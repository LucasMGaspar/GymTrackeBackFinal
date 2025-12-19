import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/EmptyState';
import { TodayWorkoutClient } from './TodayWorkoutClient';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutTemplate, WorkoutTemplateExercise } from '@/lib/types';

async function getOrCreateTodayWorkout(userId: string) {
  const supabase = await createClient();
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const weekday = new Date().getDay();

  // Check if session already exists for today
  const { data: existingSession } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      template:workout_templates(*)
    `)
    .eq('student_user_id', userId)
    .eq('session_date', today)
    .single();

  if (existingSession) {
    // Get exercises for this session
    const { data: exercises } = await supabase
      .from('workout_session_exercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('session_id', existingSession.id)
      .order('sort_order');

    return {
      session: existingSession as WorkoutSession & { template: WorkoutTemplate },
      exercises: (exercises || []) as (WorkoutSessionExercise & { exercise: any })[],
    };
  }

  // Get student record to find template
  const { data: studentRecord } = await supabase
    .from('students')
    .select('id')
    .eq('student_user_id', userId)
    .single();

  if (!studentRecord) {
    return null;
  }

  // Get template for today's weekday
  const { data: template } = await supabase
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_id', studentRecord.id)
    .eq('weekday', weekday)
    .single();

  if (!template) {
    return null;
  }

  // Create new session
  const { data: newSession, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      student_user_id: userId,
      template_id: template.id,
      session_date: today,
      status: 'in_progress',
    })
    .select()
    .single();

  if (sessionError || !newSession) {
    console.error('Error creating session:', sessionError);
    return null;
  }

  // Create session exercises from template
  const templateExercises = (template as any).workout_template_exercises || [];
  if (templateExercises.length > 0) {
    const sessionExercises = templateExercises.map((te: any) => ({
      session_id: newSession.id,
      exercise_id: te.exercise_id,
      sort_order: te.sort_order,
      sets_done: 0,
      reps_done: '',
      load: null,
      notes: null,
    }));

    await supabase
      .from('workout_session_exercises')
      .insert(sessionExercises);
  }

  // Fetch complete session with exercises
  const { data: completeSession } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      template:workout_templates(*)
    `)
    .eq('id', newSession.id)
    .single();

  const { data: exercises } = await supabase
    .from('workout_session_exercises')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('session_id', newSession.id)
    .order('sort_order');

  return {
    session: completeSession as WorkoutSession & { template: WorkoutTemplate },
    exercises: (exercises || []) as (WorkoutSessionExercise & { exercise: any })[],
  };
}

export default async function TodayPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const workoutData = await getOrCreateTodayWorkout(user.id);

  if (!workoutData) {
    return (
      <EmptyState
        title="Nenhum treino para hoje"
        description="Seu personal trainer ainda não configurou um treino para este dia da semana. Entre em contato com ele!"
      />
    );
  }

  return (
    <TodayWorkoutClient
      session={workoutData.session}
      exercises={workoutData.exercises}
    />
  );
}
