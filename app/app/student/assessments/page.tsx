import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentAssessmentsClient } from './StudentAssessmentsClient';

export default async function StudentAssessmentsPage() {
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

  if (!student) {
    redirect('/app/student/dashboard');
  }

  // Get all assessments for this student
  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('student_id', student.id)
    .order('assessment_date', { ascending: false });

  return (
    <StudentAssessmentsClient
      assessments={(assessments || []) as any[]}
    />
  );
}

