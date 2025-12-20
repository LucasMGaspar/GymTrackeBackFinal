import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoalsClient } from './GoalsClient';

export default async function StudentGoalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') {
    redirect('/app/personal');
  }

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('student_user_id', user.id)
    .single();

  if (!student) {
    redirect('/app/student/dashboard');
  }

  // Get goals for this student
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      exercise:exercises(id, name, muscle_group)
    `)
    .eq('student_id', student.id)
    .order('created_at', { ascending: false });

  return (
    <GoalsClient
      student={student as any}
      initialGoals={(goals || []) as any[]}
      exercises={[]}
      isPersonalView={false}
    />
  );
}

