import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import Link from 'next/link';

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
    redirect('/app/student/today');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav profile={profile} title="Dashboard Personal" />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/app/personal/students"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">👥 Alunos</h2>
            <p className="text-gray-600">Gerenciar alunos e treinos</p>
          </Link>

          <Link
            href="/app/personal/exercises"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">💪 Exercícios</h2>
            <p className="text-gray-600">Biblioteca de exercícios</p>
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            🚀 Próximos passos
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Adicione exercícios na sua biblioteca</li>
            <li>• Cadastre seus alunos</li>
            <li>• Monte treinos por dia da semana</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
