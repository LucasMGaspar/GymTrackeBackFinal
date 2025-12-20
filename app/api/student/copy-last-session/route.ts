import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CopyLastSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request as NextRequest,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = CopyLastSessionSchema.parse(body);

    // Get current session
    const { data: currentSession } = await supabase
      .from('workout_sessions')
      .select('template_id, student_user_id')
      .eq('id', sessionId)
      .eq('student_user_id', user.id)
      .single();

    if (!currentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Find last completed session with same template
    const { data: lastSession } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('student_user_id', user.id)
      .eq('template_id', currentSession.template_id)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .limit(1)
      .single();

    if (!lastSession) {
      return NextResponse.json(
        { error: 'No previous session found' },
        { status: 404 }
      );
    }

    // Get exercises from last session
    const { data: lastExercises } = await supabase
      .from('workout_session_exercises')
      .select('exercise_id, actual_sets, actual_reps, actual_load')
      .eq('session_id', lastSession.id)
      .order('sort_order');

    // Get current session exercises
    const { data: currentExercises } = await supabase
      .from('workout_session_exercises')
      .select('id, exercise_id')
      .eq('session_id', sessionId)
      .order('sort_order');

    if (!lastExercises || !currentExercises) {
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    // Match and update exercises
    const updates = currentExercises.map((currentEx) => {
      const lastEx = lastExercises.find((le) => le.exercise_id === currentEx.exercise_id);
      if (!lastEx) return null;

      return supabase
        .from('workout_session_exercises')
        .update({
          actual_sets: lastEx.actual_sets,
          actual_reps: lastEx.actual_reps,
          actual_load: lastEx.actual_load,
        })
        .eq('id', currentEx.id)
        .select()
        .single();
    }).filter(Boolean);

    const results = await Promise.all(updates);

    // Fetch updated exercises with exercise details
    const { data: updatedExercises } = await supabase
      .from('workout_session_exercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('session_id', sessionId)
      .order('sort_order');

    return NextResponse.json({ exercises: updatedExercises });
  } catch (error) {
    console.error('Copy last session error:', error);
    return NextResponse.json(
      { error: 'Failed to copy last session' },
      { status: 500 }
    );
  }
}
