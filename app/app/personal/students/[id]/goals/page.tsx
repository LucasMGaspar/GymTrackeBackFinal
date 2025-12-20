import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoalsClient } from './GoalsClient';
import type { Student } from '@/lib/types';

export default async function PersonalStudentGoalsPage({
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

  // Get goals for this student
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      exercise:exercises(id, name, muscle_group)
    `)
    .eq('student_id', id)
    .order('created_at', { ascending: false });

  // Get exercises for the modal
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('personal_id', user.id)
    .order('name');

  return (
    <GoalsClient
      student={student as Student}
      initialGoals={(goals || []) as any[]}
      exercises={(exercises || []) as any[]}
      isPersonalView={true}
    />
  );
}

