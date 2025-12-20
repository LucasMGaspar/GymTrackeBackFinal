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
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'student') {
    redirect('/app/personal');
  }

  // Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('student_user_id', user.id)
    .maybeSingle();

  // If student not found, try to link automatically
  if (!student && user.email) {
    const { data: studentToLink } = await supabase
      .from('students')
      .select('id')
      .eq('student_email', user.email.toLowerCase().trim())
      .eq('status', 'invited')
      .is('student_user_id', null)
      .maybeSingle();

    if (studentToLink) {
      // Link the student
      await supabase
        .from('students')
        .update({
          student_user_id: user.id,
          status: 'active',
        })
        .eq('id', studentToLink.id);

      // Continue with linked student
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          template:workout_templates(*),
          workout_session_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('student_user_id', user.id)
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
  }

  if (!student) {
    redirect('/login?error=student_not_linked');
  }

  // Get last 14 days of completed sessions
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const dateFilter = fourteenDaysAgo.toISOString().split('T')[0];

  console.log('Fetching history - Date filter:', dateFilter, 'User ID:', user.id);

  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      template:workout_templates(*),
      workout_session_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('student_user_id', user.id)
    .eq('status', 'completed')
    .gte('session_date', dateFilter)
    .order('session_date', { ascending: false })
    .order('completed_at', { ascending: false });

  if (sessionsError) {
    console.error('Error fetching history:', sessionsError);
  } else {
    console.log('History sessions found:', sessions?.length || 0);
    if (sessions && sessions.length > 0) {
      console.log('Sessions:', sessions.map(s => ({
        id: s.id,
        date: s.session_date,
        status: s.status,
        completed_at: s.completed_at,
        template: s.template?.name
      })));
    }
  }

  return (
    <HistoryClient 
      sessions={(sessions || []) as any[]}
      currentUserId={user.id}
      currentUserRole="student"
    />
  );
}
