import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HistoryClient } from './HistoryClient';
import type { Student } from '@/lib/types';

export default async function PersonalStudentHistoryPage({
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

  // Get last 30 days of completed sessions (personal sees more)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_session_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_id', id)
    .eq('status', 'completed')
    .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false })
    .order('completed_at', { ascending: false });

  return (
    <HistoryClient
      student={student as Student}
      sessions={(sessions || []) as any[]}
    />
  );
}
