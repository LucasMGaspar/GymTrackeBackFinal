import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ExerciseSchema = z.object({
  id: z.string().uuid(),
  actual_sets: z.number().int().min(0),
  actual_reps: z.string(),
  actual_load: z.number().nullable(),
});

const SaveWorkoutSchema = z.object({
  exercises: z.array(ExerciseSchema),
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
    const { exercises } = SaveWorkoutSchema.parse(body);

    // Update each exercise
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save workout error:', error);
    return NextResponse.json(
      { error: 'Failed to save workout' },
      { status: 500 }
    );
  }
}
