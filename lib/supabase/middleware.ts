import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    // Return a response that won't break the app
    return NextResponse.next({
      request,
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Allow auth callback to process
    if (request.nextUrl.pathname === '/auth/callback') {
      return supabaseResponse;
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/plans'];
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
    );

    // Protection: redirect to login if not authenticated (except public routes)
    if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If authenticated and trying to access login, redirect based on role
    if (user && request.nextUrl.pathname.startsWith('/login')) {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const url = request.nextUrl.clone();
      if (profile?.role === 'personal') {
        url.pathname = '/app/personal';
      } else if (profile?.role === 'student') {
        url.pathname = '/app/student/today';
      } else {
        // No role set yet, redirect to a setup page or default
        url.pathname = '/app/student/today';
      }
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Return response to prevent breaking the app
    return supabaseResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
