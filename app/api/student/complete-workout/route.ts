import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ExerciseSchema = z.object({
  id: z.string().uuid(),
  sets_done: z.number().int().min(0),
  reps_done: z.string(),
  load: z.number().nullable(),
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
          sets_done: ex.sets_done,
          reps_done: ex.reps_done,
          load: ex.load,
        })
        .eq('id', ex.id)
    );

    await Promise.all(updates);

    // Mark session as complete
    await supabase
      .from('workout_sessions')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
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
