import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    console.error('Auth callback: No code provided');
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Exchange code error:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (!data.user) {
      console.error('No user returned after exchange');
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    // If no profile exists, create one (default to student)
    if (!profile && !profileError) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role: 'student',
        name: data.user.email?.split('@')[0] || 'User',
      });
      
      if (insertError) {
        console.error('Error creating profile:', insertError.message);
      }
    }

    // Determine redirect path based on role
    const redirectPath = profile?.role === 'personal' 
      ? '/app/personal' 
      : '/app/student/today';

    // Handle different environments
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    let redirectUrl: string;
    if (isLocalEnv) {
      redirectUrl = `${origin}${redirectPath}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${redirectPath}`;
    } else {
      redirectUrl = `${origin}${redirectPath}`;
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Unexpected auth callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=unexpected_error`);
  }
}
