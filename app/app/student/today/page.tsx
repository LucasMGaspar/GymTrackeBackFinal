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
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_session_exercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('session_id', existingSession.id)
      .order('sort_order');

    if (exercisesError) {
      console.error('❌ Error fetching existing session exercises:', exercisesError);
    } else {
      console.log('✅ Fetched existing session exercises:', exercises?.length || 0);
      if (exercises && exercises.length > 0) {
        console.log('Exercises data:', exercises.map(e => ({ id: e.id, exercise_id: e.exercise_id, exercise: e.exercise?.name || 'NO EXERCISE' })));
      }
    }

    // If session exists but has no exercises, try to create them from template
    if ((!exercises || exercises.length === 0) && existingSession.template_id) {
      console.log('Session exists but has no exercises. Creating from template...');
      
      // Get template exercises
      const { data: templateExercises } = await supabase
        .from('workout_template_exercises')
        .select('*')
        .eq('template_id', existingSession.template_id)
        .order('sort_order');

      if (templateExercises && templateExercises.length > 0) {
        const sessionExercises = templateExercises.map((te) => ({
          session_id: existingSession.id,
          exercise_id: te.exercise_id,
          sort_order: te.sort_order,
          target_sets: te.target_sets,
          target_reps: te.target_reps,
          actual_sets: 0,
          actual_reps: '',
          actual_load: null,
          notes: null,
        }));

        const { error: insertError, data: insertedExercises } = await supabase
          .from('workout_session_exercises')
          .insert(sessionExercises)
          .select();

        if (insertError) {
          console.error('❌ Error creating exercises for existing session:', insertError);
        } else {
          console.log('✅ Created exercises for existing session:', insertedExercises?.length || 0);
          // Fetch again with the new exercises (wait a bit for the insert to complete)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: newExercises, error: fetchError } = await supabase
            .from('workout_session_exercises')
            .select(`
              *,
              exercise:exercises(*)
            `)
            .eq('session_id', existingSession.id)
            .order('sort_order');

          if (fetchError) {
            console.error('❌ Error fetching new exercises:', fetchError);
          } else {
            console.log('✅ Fetched exercises after creation:', newExercises?.length || 0);
          }

          return {
            session: existingSession as WorkoutSession & { template: WorkoutTemplate },
            exercises: (newExercises || []) as (WorkoutSessionExercise & { exercise: any })[],
          };
        }
      }
    }

    return {
      session: existingSession as WorkoutSession & { template: WorkoutTemplate },
      exercises: (exercises || []) as (WorkoutSessionExercise & { exercise: any })[],
    };
  }

  // Get student record to find template
  let { data: studentRecord, error: studentError } = await supabase
    .from('students')
    .select('id, student_user_id, status')
    .eq('student_user_id', userId)
    .maybeSingle();

  if (studentError) {
    console.error('Error fetching student record:', studentError);
    return null;
  }

  if (!studentRecord) {
    // Try to link automatically by email
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: studentToLink } = await supabase
        .from('students')
        .select('id, student_user_id, status')
        .eq('student_email', user.email.toLowerCase().trim())
        .eq('status', 'invited')
        .is('student_user_id', null)
        .maybeSingle();

      if (studentToLink) {
        // Link the student
        const { error: linkError } = await supabase
          .from('students')
          .update({
            student_user_id: userId,
            status: 'active',
          })
          .eq('id', studentToLink.id);

        if (!linkError) {
          // Use the linked student
          studentRecord = { 
            id: studentToLink.id,
            student_user_id: userId,
            status: 'active' as const
          };
        } else {
          console.error('Error linking student:', linkError);
          return null;
        }
      } else {
        console.error('Student record not found and no pending invite found for userId:', userId);
        return null;
      }
    } else {
      console.error('Student record not found and no email available for userId:', userId);
      return null;
    }
  }

  if (!studentRecord) {
    return null;
  }

  // Get template for today's weekday
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('student_id', studentRecord.id)
    .eq('weekday', weekday)
    .single();

  if (templateError) {
    console.error('Error fetching template:', templateError);
    return null;
  }

  if (!template) {
    console.log('No template found for weekday:', weekday, 'student:', studentRecord.id);
    return null;
  }

  // Get template exercises separately (to avoid RLS issues with nested joins)
  const { data: templateExercises, error: templateExercisesError } = await supabase
    .from('workout_template_exercises')
    .select('*')
    .eq('template_id', template.id)
    .order('sort_order');

  if (templateExercisesError) {
    console.error('Error fetching template exercises:', templateExercisesError);
    return null;
  }

  console.log('Template found:', template.name, 'Exercises:', templateExercises?.length || 0);

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

  if (sessionError) {
    console.error('Error creating session:', {
      message: sessionError.message,
      code: sessionError.code,
      details: sessionError.details,
      hint: sessionError.hint,
      userId,
      templateId: template.id,
      sessionDate: today,
    });
    return null;
  }

  if (!newSession) {
    console.error('Session created but no data returned');
    return null;
  }

  // Create session exercises from template
  if (templateExercises && templateExercises.length > 0) {
    const sessionExercises = templateExercises.map((te) => ({
      session_id: newSession.id,
      exercise_id: te.exercise_id,
      sort_order: te.sort_order,
      target_sets: te.target_sets,
      target_reps: te.target_reps,
      actual_sets: 0,
      actual_reps: '',
      actual_load: null,
      notes: null,
    }));

    const { error: exercisesError, data: insertedExercises } = await supabase
      .from('workout_session_exercises')
      .insert(sessionExercises)
      .select();

    if (exercisesError) {
      console.error('❌ Error creating session exercises:', {
        message: exercisesError.message,
        code: exercisesError.code,
        details: exercisesError.details,
        hint: exercisesError.hint,
        sessionId: newSession.id,
        exercisesToInsert: sessionExercises.length,
      });
      // Continue anyway - the session exists, exercises can be added later
    } else {
      console.log('✅ Session exercises created:', insertedExercises?.length || 0);
    }
  } else {
    console.warn('No template exercises found in template:', template.id);
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

async function getAllTemplates(userId: string) {
  const supabase = await createClient();
  
  // Get student record
  let { data: studentRecord } = await supabase
    .from('students')
    .select('id, student_user_id, status')
    .eq('student_user_id', userId)
    .maybeSingle();

  if (!studentRecord) {
    // Try to link automatically by email
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: studentToLink } = await supabase
        .from('students')
        .select('id, student_user_id, status')
        .eq('student_email', user.email.toLowerCase().trim())
        .eq('status', 'invited')
        .is('student_user_id', null)
        .maybeSingle();

      if (studentToLink) {
        await supabase
          .from('students')
          .update({
            student_user_id: userId,
            status: 'active',
          })
          .eq('id', studentToLink.id);
        studentRecord = { 
          id: studentToLink.id,
          student_user_id: userId,
          status: 'active' as const
        };
      }
    }
  }

  if (!studentRecord) {
    return [];
  }

  // Get all templates for this student
  const { data: templates } = await supabase
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_id', studentRecord.id)
    .order('weekday');

  return templates || [];
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
  const allTemplates = await getAllTemplates(user.id);

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
      allTemplates={allTemplates as any[]}
    />
  );
}
