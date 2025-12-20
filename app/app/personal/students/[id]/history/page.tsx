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

  // Use student_user_id to get sessions (workout_sessions uses student_user_id, not student_id)
  // If student_user_id is null, return empty array (student hasn't accepted invite yet)
  let sessions: any[] = [];
  if (student.student_user_id) {
    const { data: sessionsData } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        template:workout_templates(*),
        workout_session_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('student_user_id', student.student_user_id)
      .eq('status', 'completed')
      .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('session_date', { ascending: false })
      .order('completed_at', { ascending: false });
    
    sessions = sessionsData || [];
  }

  return (
    <HistoryClient
      student={student as Student}
      sessions={(sessions || []) as any[]}
      currentUserId={user.id}
      currentUserRole="personal"
    />
  );
}
