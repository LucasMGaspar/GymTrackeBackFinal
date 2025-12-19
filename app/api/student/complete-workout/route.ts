import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ExerciseSchema = z.object({
  id: z.string().uuid(),
  actual_sets: z.number().int().min(0),
  actual_reps: z.string(),
  actual_load: z.number().nullable(),
});

const CompleteWorkoutSchema = z.object({
  sessionId: z.string().uuid(),
  exercises: z.array(ExerciseSchema),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, exercises } = CompleteWorkoutSchema.parse(body);

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update exercises
    const updates = exercises.map((ex) =>
      supabase
        .from('workout_session_exercises')
        .update({
          actual_sets: ex.actual_sets,
          actual_reps: ex.actual_reps,
          actual_load: ex.actual_load,
        })
        .eq('id', ex.id)
    );

    await Promise.all(updates);

    // Calculate duration
    const startTime = new Date(session.created_at);
    const endTime = new Date();
    const duration_minutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Mark session as complete
    await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_minutes,
      })
      .eq('id', sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete workout error:', error);
    return NextResponse.json(
      { error: 'Failed to complete workout' },
      { status: 500 }
    );
  }
}
