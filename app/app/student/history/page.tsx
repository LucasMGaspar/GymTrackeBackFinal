import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HistoryClient } from './HistoryClient';
import type { WorkoutSession } from '@/lib/types';

export default async function StudentHistoryPage() {
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
    .select('role')
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

  // Get last 14 days of completed sessions
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_session_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_id', student.id)
    .eq('status', 'completed')
    .gte('session_date', fourteenDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false })
    .order('completed_at', { ascending: false });

  return (
    <HistoryClient 
      sessions={(sessions || []) as any[]}
      currentUserId={user.id}
      currentUserRole="student"
    />
  );
}
