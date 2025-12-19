import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const InviteStudentSchema = z.object({
  studentId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = InviteStudentSchema.parse(body);

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

    // Send magic link invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      student.student_email,
      {
        redirectTo: `${request.headers.get('origin')}/auth/callback`,
        data: {
          name: student.student_name,
          invited_by: user.id,
          student_id: student.id,
        },
      }
    );

    if (inviteError) {
      console.error('Invite error:', inviteError);
      
      // Check if user already exists
      if (inviteError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado no sistema' },
          { status: 400 }
        );
      }
      
      throw inviteError;
    }

    console.log('✅ Convite enviado para:', student.student_email);

    return NextResponse.json({ 
      success: true,
      message: 'Convite enviado com sucesso',
      inviteData,
    });
  } catch (error: any) {
    console.error('Invite student error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invite' },
      { status: 500 }
    );
  }
}
