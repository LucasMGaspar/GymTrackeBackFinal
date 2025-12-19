import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // If no profile exists, create one (default to student)
      if (!profile) {
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
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
