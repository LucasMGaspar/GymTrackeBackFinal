import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PersonalDashboardClient } from './PersonalDashboardClient';

export default async function PersonalDashboard() {
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

  if (!profile || profile.role !== 'personal') {
    redirect('/app/student/dashboard');
  }

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('personal_id', user.id);

  // Get exercises count
  const { count: exercisesCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('personal_id', user.id);

  // Get recent sessions (last 30 days) for all students
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get student_user_ids from students (only those that are linked)
  const studentUserIds = (students || [])
    .map((s) => s.student_user_id)
    .filter((id): id is string => id !== null);
  
  let recentSessions = [];
  if (studentUserIds.length > 0) {
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, template:workout_templates(*), workout_session_exercises(*)')
      .in('student_user_id', studentUserIds)
      .eq('status', 'completed')
      .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0]);
    
    recentSessions = data || [];
  }

  return (
    <PersonalDashboardClient
      students={(students || []) as any[]}
      exercisesCount={exercisesCount || 0}
      recentSessions={recentSessions as any[]}
    />
  );
}
