import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Debug logs
  console.log('🔍 Auth Callback - Debug:');
  console.log('- Code:', code ? 'presente' : 'ausente');
  console.log('- Origin:', origin);
  console.log('- URL completa:', request.url);

  if (code) {
    const supabase = await createClient();
    console.log('🔄 Trocando code por sessão...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      console.log('✅ Sessão criada! User ID:', data.user.id);
      
      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      console.log('👤 Profile:', profile ? `role=${profile.role}` : 'não existe');

      // If no profile exists, create one (default to student)
      if (!profile) {
        console.log('🆕 Criando profile como student...');
        await supabase.from('profiles').insert({
          id: data.user.id,
          role: 'student',
          name: data.user.email?.split('@')[0] || 'User',
        });

        // Redirect to student area
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/app/student/today`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/app/student/today`);
        } else {
          return NextResponse.redirect(`${origin}/app/student/today`);
        }
      }

      // Redirect based on role
      const redirectPath = profile.role === 'personal' 
        ? '/app/personal' 
        : '/app/student/today';
      
      console.log('🚀 Redirecionando para:', redirectPath);

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  // Return the user to an error page with instructions
  console.log('❌ Auth falhou - redirecionando para login');
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
