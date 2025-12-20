import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkoutCalendar } from '@/components/WorkoutCalendar';

export default async function PersonalStudentCalendarPage({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Calendário de Treinos - {student.student_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize o calendário de treinos deste aluno
          </p>
        </div>

        <WorkoutCalendar studentId={id} />
      </div>
    </div>
  );
}

