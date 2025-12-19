import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TemplatesClient } from './TemplatesClient';
import type { Student, WorkoutTemplate, Exercise } from '@/lib/types';

export default async function StudentTemplatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get student and verify ownership
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .eq('personal_id', user.id)
    .single();

  if (!student) {
    redirect('/app/personal/students');
  }

  // Get templates for this student
  const { data: templates } = await supabase
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_id', id)
    .order('weekday');

  // Get all exercises for picker
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('personal_id', user.id)
    .order('name');

  return (
    <TemplatesClient
      student={student as Student}
      initialTemplates={(templates || []) as any[]}
      exercises={(exercises || []) as Exercise[]}
    />
  );
}
