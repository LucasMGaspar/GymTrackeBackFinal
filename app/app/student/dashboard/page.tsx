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
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'student') {
    redirect('/app/personal');
  }

  // Get student record with streak data
  const { data: student } = await supabase
    .from('students')
    .select('id, current_streak, longest_streak, last_workout_date, total_workouts_completed')
    .eq('student_user_id', user.id)
    .maybeSingle();

  // If student not found, it means the user hasn't been linked to a student record yet
  // This can happen if the user was created but the linking didn't work
  if (!student) {
    // Try to link automatically by email
    if (user.email) {
      const { data: studentToLink } = await supabase
        .from('students')
        .select('id, current_streak, longest_streak, last_workout_date, total_workouts_completed')
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

        // Use the linked student
        const updatedStudent = {
          ...studentToLink,
          student_user_id: user.id,
          status: 'active' as const,
        };

        // Continue with the rest of the code using updatedStudent
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

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
          .gte('session_date', ninetyDaysAgo.toISOString().split('T')[0])
          .order('session_date', { ascending: false });

        return (
          <DashboardClient
            studentName={profile.name}
            studentId={updatedStudent.id}
            currentStreak={updatedStudent.current_streak || 0}
            longestStreak={updatedStudent.longest_streak || 0}
            lastWorkoutDate={updatedStudent.last_workout_date}
            totalWorkoutsCompleted={updatedStudent.total_workouts_completed || 0}
            sessions={(sessions || []) as any[]}
          />
        );
      }
    }

    // If still no student found, show empty state instead of redirecting
    // This prevents infinite loops - the user exists but isn't linked to a student
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return (
      <DashboardClient
        studentName={profile.name}
        studentId={''}
        currentStreak={0}
        longestStreak={0}
        lastWorkoutDate={null}
        totalWorkoutsCompleted={0}
        sessions={[]}
        goals={[]}
      />
    );
  }

  // Get all completed sessions (last 90 days for PRs and trends)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

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
    .gte('session_date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false });

  // Get active goals for dashboard
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      exercise:exercises(id, name, muscle_group)
    `)
    .eq('student_id', student.id)
    .eq('status', 'active')
    .order('progress_percentage', { ascending: false })
    .limit(3);

  return (
    <DashboardClient
      studentName={profile.name}
      studentId={student.id}
      currentStreak={student.current_streak || 0}
      longestStreak={student.longest_streak || 0}
      lastWorkoutDate={student.last_workout_date}
      totalWorkoutsCompleted={student.total_workouts_completed || 0}
      sessions={(sessions || []) as any[]}
      goals={(goals || []) as any[]}
    />
  );
}
