import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const InviteStudentSchema = z.object({
  studentId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting (muito restritivo para convites)
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.auth.maxRequests,
      RATE_LIMITS.auth.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = InviteStudentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    
    const validated = validationResult.data;

    // Get student and verify ownership
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', validated.studentId)
      .eq('personal_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if student is already active (already accepted invite)
    if (student.status === 'active') {
      return NextResponse.json(
        { error: 'Student has already accepted the invite' },
        { status: 400 }
      );
    }

    // Create admin client with service_role
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already exists in auth.users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === student.student_email.toLowerCase()
    );

    // If user exists but is not confirmed, we can resend the confirmation
    if (existingUser) {
      if (existingUser.email_confirmed_at) {
        // User is already registered and confirmed - use direct app link (not Supabase link)
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const loginLink = `${origin}/login?email=${encodeURIComponent(student.student_email)}`;
        return NextResponse.json({
          success: true,
          message: 'Link de login gerado (usuário já cadastrado)',
          inviteLink: loginLink,
          note: 'Este email já está cadastrado. Envie este link para o aluno fazer login. Se não lembrar a senha, use "Esqueci minha senha" na página de login.',
          studentEmail: student.student_email,
          studentName: student.student_name,
          isExistingUser: true,
        });
      } else {
        // User exists but not confirmed - try to resend confirmation
        try {
          const { data: resendData, error: resendError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: student.student_email,
            options: {
              redirectTo: `${request.headers.get('origin')}/auth/callback`,
            },
          });

          if (resendError) {
            // If resend fails, try the normal invite flow
            console.log('Resend failed, trying normal invite:', resendError);
          } else {
            console.log('✅ Link de convite regenerado para:', student.student_email);
            return NextResponse.json({ 
              success: true,
              message: 'Convite reenviado com sucesso',
              inviteData: resendData,
            });
          }
        } catch (resendErr) {
          console.log('Error in resend, trying normal invite:', resendErr);
        }
      }
    }

    // First, try to send invite email automatically (this sends email with Supabase link)
    // We do this BEFORE generating the link manually so the email goes out
    let emailSent = false;
    let emailErrorDetails: any = null;
    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        student.student_email,
        {
          redirectTo: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
          data: {
            name: student.student_name,
            invited_by: user.id,
            student_id: student.id,
          },
        }
      );
      
      if (!inviteError) {
        emailSent = true;
        console.log('✅ Email de convite enviado automaticamente pelo Supabase para:', student.student_email);
      } else {
        emailErrorDetails = {
          message: inviteError.message,
          status: inviteError.status,
          code: inviteError.code,
          name: inviteError.name,
        };
        console.error('❌ Erro ao enviar email automaticamente para:', student.student_email, inviteError);
      }
    } catch (emailErr: any) {
      emailErrorDetails = {
        message: emailErr?.message || 'Erro desconhecido ao enviar email',
        status: emailErr?.status,
        code: emailErr?.code,
        name: emailErr?.name,
        stack: emailErr?.stack,
      };
      console.error('❌ Exceção ao tentar enviar email para:', student.student_email, emailErr);
    }

    // Generate invite link manually (as backup and to get the link for manual sending)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: student.student_email,
      options: {
        redirectTo: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          name: student.student_name,
          invited_by: user.id,
          student_id: student.id,
        },
      },
    });

    if (linkError) {
      console.error('❌ Generate link error para:', student.student_email, linkError);
      
      // Check for common error cases
      const errorMessage = linkError.message?.toLowerCase() || '';
      const errorCode = linkError.status || linkError.code;
      
      // User already has a pending invite or user exists
      if (errorMessage.includes('already been registered') || 
          errorMessage.includes('user already registered') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate') ||
          errorCode === 422 ||
          errorCode === 400) {
        
        // Check if it's because user already confirmed - use direct app link
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        if (existingUser?.email_confirmed_at) {
          // User confirmed - use direct login link
          const loginLink = `${origin}/login?email=${encodeURIComponent(student.student_email)}`;
          return NextResponse.json({
            success: true,
            message: 'Link de login gerado',
            inviteLink: loginLink,
            note: 'Este email já está cadastrado. Envie este link para o aluno fazer login.',
            studentEmail: student.student_email,
            studentName: student.student_name,
            isExistingUser: true,
          });
        }
        
        // Pending invite - use direct login link (student can request new invite there)
        const loginLink = `${origin}/login?email=${encodeURIComponent(student.student_email)}`;
        return NextResponse.json({
          success: true,
          message: 'Link gerado',
          inviteLink: loginLink,
          note: 'Já existe um convite pendente. Envie este link para o aluno acessar a página de login e solicitar um novo convite.',
          studentEmail: student.student_email,
          studentName: student.student_name,
        });
      }
      
      if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
        return NextResponse.json(
          { 
            error: 'Email inválido. Verifique o email do aluno.',
            email: student.student_email,
            details: linkError.message,
          },
          { status: 400 }
        );
      }
      
      // Return the error with more details
      return NextResponse.json(
        { 
          error: 'Erro ao gerar link de convite',
          email: student.student_email,
          details: linkError.message || 'Erro desconhecido',
          code: errorCode,
          linkError: {
            message: linkError.message,
            status: linkError.status,
            code: linkError.code,
            name: linkError.name,
          },
          emailError: emailErrorDetails, // Include email sending error if any
        },
        { status: 400 }
      );
    }

    // Always prefer direct app links over Supabase links for display
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Extract token from Supabase link to create direct invite link
    // The linkData.properties.action_link contains the full Supabase URL with token
    let inviteLink: string;
    
    if (linkData?.properties?.action_link) {
      // Extract token and type from Supabase URL
      // Format: https://project.supabase.co/auth/v1/verify?token=XXX&type=invite&...
      try {
        const supabaseUrl = new URL(linkData.properties.action_link);
        const token = supabaseUrl.searchParams.get('token');
        const type = supabaseUrl.searchParams.get('type') || 'invite';
        const hash = supabaseUrl.searchParams.get('hash'); // Some links use hash instead of token
        
        if (token || hash) {
          // Use token or hash for direct invite link that works without email
          const tokenOrHash = token || hash;
          inviteLink = `${origin}/auth/accept-invite?token=${encodeURIComponent(tokenOrHash!)}&type=${encodeURIComponent(type)}&email=${encodeURIComponent(student.student_email)}`;
          console.log('✅ Link direto com token gerado para:', student.student_email);
        } else {
          // If we can't extract token, use the full Supabase link (it still works!)
          inviteLink = linkData.properties.action_link;
          console.log('⚠️ Token não encontrado, usando link completo do Supabase');
        }
      } catch (urlError) {
        console.error('Erro ao extrair token do link:', urlError);
        // Fallback to Supabase link if available
        inviteLink = linkData.properties.action_link || `${origin}/login?email=${encodeURIComponent(student.student_email)}&invite=true`;
      }
    } else {
      // Fallback to login page if action_link not available
      inviteLink = `${origin}/login?email=${encodeURIComponent(student.student_email)}&invite=true`;
      console.log('⚠️ action_link não disponível, usando link de login');
    }

    console.log('✅ Link de convite gerado para:', student.student_email);
    console.log('📧 Email enviado automaticamente:', emailSent ? 'Sim' : 'Não');
    if (emailErrorDetails) {
      console.log('⚠️ Erro ao enviar email (mas link gerado):', emailErrorDetails);
    }

    return NextResponse.json({ 
      success: true,
      message: emailSent 
        ? 'Email de convite enviado automaticamente! O aluno receberá o link no email.' 
        : 'Link de convite gerado. O email automático não foi enviado - copie o link abaixo para enviar manualmente.',
      inviteLink: inviteLink,
      note: emailSent 
        ? 'O aluno receberá o email automaticamente. Você também pode copiar o link abaixo para enviar por outro canal.'
        : emailErrorDetails 
          ? `O email não foi enviado automaticamente: ${emailErrorDetails.message || 'Erro desconhecido'}. Copie o link abaixo e envie manualmente.`
          : 'Copie o link abaixo e envie manualmente para o aluno.',
      studentEmail: student.student_email,
      studentName: student.student_name,
      emailSent: emailSent,
      emailError: emailErrorDetails || undefined, // Include error details if email failed
    });
  } catch (error: any) {
    console.error('Invite student error:', error);
    
    // Handle Zod errors specifically
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || error.message
        },
        { status: 400 }
      );
    }
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de dados inválido' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao enviar convite',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
