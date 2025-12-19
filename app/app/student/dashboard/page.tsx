import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './DashboardClient';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'student') {
    redirect('/app/personal/students');
  }

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) {
    redirect('/login');
  }

  // Get all completed sessions (last 90 days for PRs and trends)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_session_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_user_id', user.id)
    .eq('status', 'completed')
    .gte('session_date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false });

  return (
    <DashboardClient
      studentName={profile.name}
      sessions={(sessions || []) as any[]}
    />
  );
}
