import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const planSlug = requestUrl.searchParams.get('plan_slug');
  const redirectTo = requestUrl.searchParams.get('redirect_to');
  const origin = requestUrl.origin;

  console.log('🔍 Auth Callback - Debug:');
  console.log('- Code:', code ? 'presente' : 'ausente');
  console.log('- Plan Slug:', planSlug || 'não presente');
  console.log('- Redirect To:', redirectTo || 'não presente');
  console.log('- Origin:', origin);

  if (code) {
    const supabase = await createClient();
    
    console.log('🔄 Trocando code por sessão...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log('❌ Erro ao trocar code:', error.message, error.status);
      
      // Handle specific error types
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      if (error.message.includes('expired') || error.status === 403) {
        errorMessage = 'Link expirado. Solicite um novo link de acesso.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Link inválido. Solicite um novo link de acesso.';
      }
      
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`);
    }

    console.log('✅ Sessão criada com sucesso!');
    console.log('📦 Session data:', data?.session ? 'presente' : 'ausente');

    // Get user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ User não encontrado após criar sessão');
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    console.log('👤 User ID:', user.id);
    console.log('📧 User Email:', user.email);

    // Link student if email matches an invited student
    // (This ensures linking even if the trigger didn't fire)
    if (user.email) {
      const { data: studentToLink, error: linkError } = await supabase
        .from('students')
        .select('id, student_name, status')
        .eq('student_email', user.email.toLowerCase().trim())
        .eq('status', 'invited')
        .is('student_user_id', null)
        .limit(1)
        .maybeSingle();

      if (studentToLink && !linkError) {
        console.log('🔗 Vinculando aluno ao usuário...', studentToLink.id);
        const { error: updateError } = await supabase
          .from('students')
          .update({
            student_user_id: user.id,
            status: 'active',
          })
          .eq('id', studentToLink.id);

        if (updateError) {
          console.error('❌ Erro ao vincular aluno:', updateError);
        } else {
          console.log('✅ Aluno vinculado com sucesso!');
        }
      } else if (linkError) {
        console.log('⚠️ Erro ao buscar aluno para vincular:', linkError);
      } else {
        console.log('ℹ️ Nenhum aluno pendente encontrado para este email');
      }
    }

    // Check/create profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      console.log('🆕 Criando profile...');
      // If plan_slug is present, user is signing up as personal trainer
      const role = planSlug ? 'personal' : 'student';
      await supabase.from('profiles').insert({
        id: user.id,
        role,
        name: user.email?.split('@')[0] || 'User',
      });
      
      // If plan_slug is present, redirect to checkout
      if (planSlug) {
        console.log('💳 Redirecionando para checkout com plan:', planSlug);
        return NextResponse.redirect(`${origin}/app/personal/plans?checkout=${encodeURIComponent(planSlug)}`);
      }
      
      console.log('🚀 Redirecionando para: /app/student/today');
      return NextResponse.redirect(`${origin}/app/student/today`);
    }

    // If plan_slug is present and user is personal trainer, redirect to checkout
    if (planSlug && profile.role === 'personal') {
      console.log('💳 Redirecionando para checkout com plan:', planSlug);
      // Ensure we redirect to plans page with checkout parameter
      const redirectUrl = `${origin}/app/personal/plans?checkout=${encodeURIComponent(planSlug)}`;
      console.log('🔗 Redirect URL:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // If redirect_to is specified, use it
    if (redirectTo) {
      console.log('🚀 Redirecionando para:', redirectTo);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    // Redirect based on role
    const redirectPath = profile.role === 'personal' 
      ? '/app/personal' 
      : '/app/student/today';
    
    console.log('🚀 Redirecionando para:', redirectPath);
    
    // Create redirect response and ensure cookies are set
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    
    // Ensure session cookies are preserved
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('🍪 Sessão confirmada antes do redirect');
    }
    
    return response;
  }

  console.log('❌ Code não encontrado - redirecionando para login');
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
