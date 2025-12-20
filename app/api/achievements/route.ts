import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { isValidUUID } from '@/lib/security/sanitize';

// GET: Fetch student achievements
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.read.maxRequests,
      RATE_LIMITS.read.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    // Validar formato UUID
    if (!isValidUUID(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student_id format' },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch achievements with details
    const { data: achievements, error } = await supabase
      .from('student_achievements')
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq('student_id', studentId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ achievements: achievements || [] });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
