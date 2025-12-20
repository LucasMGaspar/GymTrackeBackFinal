import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkoutCalendar } from '@/components/WorkoutCalendar';

export default async function StudentCalendarPage() {
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

  if (!profile || profile.role !== 'student') {
    redirect('/app/personal');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Calendário de Treinos</h1>
          <p className="text-gray-600 mt-1">
            Visualize todos os seus treinos em formato de calendário
          </p>
        </div>

        <WorkoutCalendar />
      </div>
    </div>
  );
}

