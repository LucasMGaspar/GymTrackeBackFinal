import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const TemplateExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  sort_order: z.number().int().min(1),
  target_sets: z.number().int().min(1),
  target_reps: z.string().min(1),
  notes: z.string().nullable().optional(),
});

const CreateTemplateSchema = z.object({
  student_id: z.string().uuid(),
  weekday: z.number().int().min(0).max(6),
  name: z.string().min(1),
  notes: z.string().nullable().optional(),
  exercises: z.array(TemplateExerciseSchema).min(1),
});

const UpdateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  exercises: z.array(TemplateExerciseSchema).min(1).optional(),
});

const DeleteTemplateSchema = z.object({
  id: z.string().uuid(),
});

// POST - Create template
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
    const validated = CreateTemplateSchema.parse(body);

    // Verify student belongs to user
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', validated.student_id)
      .eq('personal_id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if template already exists for this day
    const { data: existing } = await supabase
      .from('workout_templates')
      .select('id')
      .eq('student_id', validated.student_id)
      .eq('weekday', validated.weekday)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um template para este dia da semana' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        student_id: validated.student_id,
        weekday: validated.weekday,
        name: validated.name,
        notes: validated.notes || null,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Create template exercises
    const exercisesData = validated.exercises.map((ex) => ({
      template_id: template.id,
      exercise_id: ex.exercise_id,
      sort_order: ex.sort_order,
      target_sets: ex.target_sets,
      target_reps: ex.target_reps,
      notes: ex.notes || null,
    }));

    const { error: exercisesError } = await supabase
      .from('workout_template_exercises')
      .insert(exercisesData);

    if (exercisesError) throw exercisesError;

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateTemplateSchema.parse(body);

    // Verify template belongs to user's student
    const { data: template } = await supabase
      .from('workout_templates')
      .select('*, students!inner(personal_id)')
      .eq('id', validated.id)
      .single();

    if (!template || (template.students as any).personal_id !== user.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Update template
    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.notes !== undefined) updateData.notes = validated.notes || null;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('workout_templates')
        .update(updateData)
        .eq('id', validated.id);

      if (updateError) throw updateError;
    }

    // Update exercises if provided
    if (validated.exercises) {
      // Delete existing exercises
      await supabase
        .from('workout_template_exercises')
        .delete()
        .eq('template_id', validated.id);

      // Insert new exercises
      const exercisesData = validated.exercises.map((ex) => ({
        template_id: validated.id,
        exercise_id: ex.exercise_id,
        sort_order: ex.sort_order,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        notes: ex.notes || null,
      }));

      const { error: exercisesError } = await supabase
        .from('workout_template_exercises')
        .insert(exercisesData);

      if (exercisesError) throw exercisesError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = DeleteTemplateSchema.parse(body);

    // Verify template belongs to user's student
    const { data: template } = await supabase
      .from('workout_templates')
      .select('*, students!inner(personal_id)')
      .eq('id', validated.id)
      .single();

    if (!template || (template.students as any).personal_id !== user.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete template (cascade will delete exercises)
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', validated.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
