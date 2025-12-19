import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  console.log('🔍 Auth Callback - Debug:');
  console.log('- Code:', code ? 'presente' : 'ausente');
  console.log('- Origin:', origin);

  if (code) {
    const supabase = await createClient();
    
    console.log('🔄 Trocando code por sessão...');
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log('❌ Erro ao trocar code:', error.message);
      return NextResponse.redirect(`${origin}/login?error=${error.message}`);
    }

    console.log('✅ Sessão criada com sucesso!');

    // Get user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ User não encontrado após criar sessão');
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    console.log('👤 User ID:', user.id);

    // Check/create profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      console.log('🆕 Criando profile como student...');
      await supabase.from('profiles').insert({
        id: user.id,
        role: 'student',
        name: user.email?.split('@')[0] || 'User',
      });
      
      console.log('🚀 Redirecionando para: /app/student/today');
      return NextResponse.redirect(`${origin}/app/student/today`);
    }

    // Redirect based on role
    const redirectPath = profile.role === 'personal' 
      ? '/app/personal' 
      : '/app/student/today';
    
    console.log('🚀 Redirecionando para:', redirectPath);
    return NextResponse.redirect(`${origin}${redirectPath}`);
  }

  console.log('❌ Code não encontrado - redirecionando para login');
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
