import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /auth/accept-invite
 * Accept invite token and redirect to callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const email = searchParams.get('email');

    if (!token || !type) {
      redirect('/login?error=invalid_invite');
    }

    // Redirect to callback with the token
    const callbackUrl = `/auth/callback?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
    if (email) {
      redirect(`${callbackUrl}&email=${encodeURIComponent(email)}`);
    } else {
      redirect(callbackUrl);
    }
  } catch (error) {
    console.error('[Accept Invite] Error:', error);
    redirect('/login?error=invite_failed');
  }
}

