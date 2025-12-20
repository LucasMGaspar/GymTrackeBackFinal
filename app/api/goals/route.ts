import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const goalSchema = z.object({
  student_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  goal_type: z.enum([
    'weight_loss',
    'weight_gain',
    'muscle_gain',
    'fat_loss',
    'circumference_reduction',
    'circumference_increase',
    'load_increase',
    'workout_frequency',
  ]),
  target_value: z.number().positive('Valor alvo deve ser positivo'),
  initial_value: z.number().optional(),
  exercise_id: z.string().uuid().optional(),
  exercise_name: z.string().optional(),
  circumference_type: z.enum(['chest', 'waist', 'hip', 'arm', 'thigh', 'calf']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
});

/**
 * GET /api/goals
 * Get goals for a student (personal trainer or student can access)
 * Query params: studentId (optional, for personal trainers)
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let goalsQuery = supabase
      .from('goals')
      .select(`
        *,
        exercise:exercises(id, name, muscle_group)
      `)
      .order('created_at', { ascending: false });

    // If studentId provided, personal trainer viewing student's goals
    if (studentId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'personal') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Verify ownership
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('personal_id', user.id)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      goalsQuery = goalsQuery.eq('student_id', studentId);
    } else {
      // Student viewing their own goals
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'student') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get student record
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('student_user_id', user.id)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      goalsQuery = goalsQuery.eq('student_id', student.id);
    }

    const { data: goals, error } = await goalsQuery;

    if (error) {
      console.error('[Goals] Error fetching goals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch goals', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error: any) {
    console.error('[Goals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals
 * Create a new goal (only personal trainers)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is personal trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json({ error: 'Only personal trainers can create goals' }, { status: 403 });
    }

    const body = await request.json();
    const result = goalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify student belongs to this personal
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', data.student_id)
      .eq('personal_id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    // Validate dates
    const startDate = new Date(data.start_date);
    const targetDate = new Date(data.target_date);
    if (targetDate <= startDate) {
      return NextResponse.json(
        { error: 'Data alvo deve ser posterior à data inicial' },
        { status: 400 }
      );
    }

    // Validate exercise_id if goal_type is load_increase
    if (data.goal_type === 'load_increase' && !data.exercise_id) {
      return NextResponse.json(
        { error: 'Exercício é obrigatório para metas de carga' },
        { status: 400 }
      );
    }

    // Validate circumference_type if goal_type is circumference_*
    if (
      (data.goal_type === 'circumference_reduction' || data.goal_type === 'circumference_increase') &&
      !data.circumference_type
    ) {
      return NextResponse.json(
        { error: 'Tipo de circunferência é obrigatório' },
        { status: 400 }
      );
    }

    // If exercise_id provided, get exercise name
    let exerciseName = data.exercise_name;
    if (data.exercise_id && !exerciseName) {
      const { data: exercise } = await supabase
        .from('exercises')
        .select('name')
        .eq('id', data.exercise_id)
        .eq('personal_id', user.id)
        .single();

      if (exercise) {
        exerciseName = exercise.name;
      }
    }

    // If initial_value not provided, try to get from latest assessment
    let initialValue = data.initial_value;
    if (!initialValue) {
      const { data: latestAssessment } = await supabase
        .from('physical_assessments')
        .select('*')
        .eq('student_id', data.student_id)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (latestAssessment) {
        switch (data.goal_type) {
          case 'weight_loss':
          case 'weight_gain':
            initialValue = latestAssessment.weight;
            break;
          case 'muscle_gain':
            initialValue = latestAssessment.muscle_mass;
            break;
          case 'fat_loss':
            initialValue = latestAssessment.body_fat_percentage;
            break;
          case 'circumference_reduction':
          case 'circumference_increase':
            if (data.circumference_type) {
              const fieldMap: Record<string, keyof typeof latestAssessment> = {
                chest: 'chest_circumference',
                waist: 'waist_circumference',
                hip: 'hip_circumference',
                arm: 'arm_circumference',
                thigh: 'thigh_circumference',
                calf: 'calf_circumference',
              };
              const field = fieldMap[data.circumference_type];
              initialValue = latestAssessment[field] as number | undefined;
            }
            break;
        }
      }
    }

    // Create goal
    const goalData: any = {
      student_id: data.student_id,
      personal_id: user.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      goal_type: data.goal_type,
      target_value: data.target_value,
      initial_value: initialValue || null,
      exercise_id: data.exercise_id || null,
      exercise_name: exerciseName || null,
      circumference_type: data.circumference_type || null,
      start_date: data.start_date,
      target_date: data.target_date,
      created_by: user.id,
      status: 'active',
    };

    const { data: goal, error: insertError } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single();

    if (insertError) {
      console.error('[Goals] Error creating goal:', insertError);
      return NextResponse.json(
        { error: 'Failed to create goal', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    console.error('[Goals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/goals
 * Update a goal (only personal trainers)
 */
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is personal trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json({ error: 'Only personal trainers can update goals' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Verify goal exists and belongs to this personal
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('personal_id, start_date, target_date')
      .eq('id', id)
      .single();

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existingGoal.personal_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate dates if provided
    if (updateData.start_date || updateData.target_date) {
      const startDate = new Date(updateData.start_date || existingGoal.start_date);
      const targetDate = new Date(updateData.target_date || existingGoal.target_date);
      if (targetDate <= startDate) {
        return NextResponse.json(
          { error: 'Data alvo deve ser posterior à data inicial' },
          { status: 400 }
        );
      }
    }

    // Clean update data
    const cleanUpdateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.title !== undefined) cleanUpdateData.title = updateData.title.trim();
    if (updateData.description !== undefined) cleanUpdateData.description = updateData.description?.trim() || null;
    if (updateData.target_value !== undefined) cleanUpdateData.target_value = updateData.target_value;
    if (updateData.start_date !== undefined) cleanUpdateData.start_date = updateData.start_date;
    if (updateData.target_date !== undefined) cleanUpdateData.target_date = updateData.target_date;
    if (updateData.status !== undefined) cleanUpdateData.status = updateData.status;

    const { data: goal, error: updateError } = await supabase
      .from('goals')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Goals] Error updating goal:', updateError);
      return NextResponse.json(
        { error: 'Failed to update goal', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error('[Goals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/goals
 * Delete a goal (only personal trainers)
 */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is personal trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json({ error: 'Only personal trainers can delete goals' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Verify goal exists and belongs to this personal
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('personal_id')
      .eq('id', id)
      .single();

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existingGoal.personal_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Goals] Error deleting goal:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete goal', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Goals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

