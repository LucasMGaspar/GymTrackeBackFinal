import { createClient } from '@/lib/supabase/server';
import { StudentsClient } from './StudentsClient';
import type { Student } from '@/lib/types';

export default async function StudentsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch students
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('personal_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <StudentsClient 
      initialStudents={(students || []) as Student[]}
      personalId={user.id}
    />
  );
}
