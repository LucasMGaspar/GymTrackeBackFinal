import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CreateExerciseSchema = z.object({
  personal_id: z.string().uuid(),
  name: z.string().min(1),
  muscle_group: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const UpdateExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  muscle_group: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const DeleteExerciseSchema = z.object({
  id: z.string().uuid(),
});

// GET - List exercises (optional, for API usage)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('personal_id', user.id)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

// POST - Create exercise
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
    const validated = CreateExerciseSchema.parse(body);

    // Verify personal_id matches user
    if (validated.personal_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert({
        personal_id: validated.personal_id,
        name: validated.name,
        muscle_group: validated.muscle_group || null,
        notes: validated.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    console.error('Create exercise error:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}

// PUT - Update exercise
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
    const validated = UpdateExerciseSchema.parse(body);

    // Verify exercise belongs to user (RLS will also check, but good practice)
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .eq('id', validated.id)
      .eq('personal_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const { data: exercise, error } = await supabase
      .from('exercises')
      .update({
        name: validated.name,
        muscle_group: validated.muscle_group || null,
        notes: validated.notes || null,
      })
      .eq('id', validated.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Update exercise error:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

// DELETE - Delete exercise
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
    const validated = DeleteExerciseSchema.parse(body);

    // Check if exercise is used in any templates
    const { data: usedInTemplates } = await supabase
      .from('workout_template_exercises')
      .select('id')
      .eq('exercise_id', validated.id)
      .limit(1);

    if (usedInTemplates && usedInTemplates.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete exercise that is used in workout templates' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', validated.id)
      .eq('personal_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exercise error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
