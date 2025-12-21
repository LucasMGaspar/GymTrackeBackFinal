import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /auth/accept-invite
 * Accept invite token and verify directly, then redirect to app
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const email = searchParams.get('email');
    const origin = request.url.split('/auth/accept-invite')[0] || 'http://localhost:3000';

    if (!token || !type) {
      console.error('[Accept Invite] Missing token or type');
      redirect('/login?error=invalid_invite');
    }

    if (!email) {
      console.error('[Accept Invite] Missing email');
      redirect('/login?error=invalid_invite');
    }

    const supabase = await createClient();

    // For invite tokens, we need to use the Supabase API directly
    // The token from generateLink needs to be verified through Supabase's verify endpoint
    // We'll redirect to Supabase's verify endpoint which will then redirect back to our callback
    console.log('[Accept Invite] Redirecting to Supabase verify endpoint for email:', email);
    
    // Build the Supabase verify URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[Accept Invite] NEXT_PUBLIC_SUPABASE_URL not configured');
      redirect('/login?error=configuration_error');
    }

    // Create redirect URL to Supabase verify endpoint
    const redirectTo = `${origin}/auth/callback`;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo)}`;
    
    // Redirect to Supabase verify endpoint - it will verify and redirect back to our callback
    // The Supabase endpoint will verify the token and redirect to our callback with a code
    return NextResponse.redirect(verifyUrl);
  } catch (error: any) {
    console.error('[Accept Invite] Error:', error);
    redirect(`/login?error=${encodeURIComponent(error.message || 'invite_failed')}`);
  }
}

