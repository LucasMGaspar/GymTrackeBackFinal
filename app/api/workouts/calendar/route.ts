import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/workouts/calendar
 * Get workouts for a specific month/year for calendar view
 * Query params: year, month, studentId (optional, for personal trainers)
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.read.maxRequests,
      RATE_LIMITS.read.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const studentId = searchParams.get('studentId'); // For personal trainers viewing a specific student

    // Validate month
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    let studentUserId: string | null = null;

    // If studentId is provided (personal trainer viewing student calendar)
    if (studentId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'personal') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get student and verify ownership
      const { data: student } = await supabase
        .from('students')
        .select('student_user_id')
        .eq('id', studentId)
        .eq('personal_id', user.id)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      studentUserId = student.student_user_id;
      
      // If student hasn't accepted invite yet, return empty calendar
      if (!studentUserId) {
        return NextResponse.json({
          year,
          month,
          sessions: [],
          sessionsByDate: {},
        });
      }
    } else {
      // Student viewing their own calendar
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'student') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      studentUserId = user.id;
    }

    // If student not linked to account (shouldn't happen for student role, but handle gracefully)
    if (!studentUserId) {
      return NextResponse.json({
        year,
        month,
        sessions: [],
        sessionsByDate: {},
      });
    }

    // Fetch sessions for the month
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        session_date,
        status,
        completed_at,
        template_name,
        duration_minutes
      `)
      .eq('student_user_id', studentUserId)
      .gte('session_date', startDate.toISOString().split('T')[0])
      .lte('session_date', endDate.toISOString().split('T')[0])
      .order('session_date', { ascending: true });

    if (error) {
      console.error('[Calendar] Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: error.message },
        { status: 500 }
      );
    }

    // Group sessions by date for easy lookup
    const sessionsByDate: Record<string, any> = {};
    sessions?.forEach((session) => {
      const dateKey = session.session_date;
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    });

    return NextResponse.json({
      year,
      month,
      sessions: sessions || [],
      sessionsByDate,
    });
  } catch (error: any) {
    console.error('[Calendar] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

