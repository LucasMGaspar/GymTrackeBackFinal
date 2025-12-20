import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssessmentsClient } from './AssessmentsClient';
import type { Student } from '@/lib/types';

export default async function PersonalStudentAssessmentsPage({
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

  // Get all assessments for this student
  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('student_id', id)
    .order('assessment_date', { ascending: false });

  return (
    <AssessmentsClient
      student={student as Student}
      assessments={(assessments || []) as any[]}
    />
  );
}

