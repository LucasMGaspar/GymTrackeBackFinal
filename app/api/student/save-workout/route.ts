import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ExerciseSchema = z.object({
  id: z.string().uuid(),
  sets_done: z.number().int().min(0),
  reps_done: z.string(),
  load: z.number().nullable(),
});

const SaveWorkoutSchema = z.object({
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
    const { exercises } = SaveWorkoutSchema.parse(body);

    // Update each exercise
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save workout error:', error);
    return NextResponse.json(
      { error: 'Failed to save workout' },
      { status: 500 }
    );
  }
}
