import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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

  // Get stats
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id')
    .eq('personal_id', user.id);

  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('personal_id', user.id);

  const exerciseCount = exercises?.length || 0;
  const studentCount = students?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Bem-vindo, {profile.name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-600 text-sm mb-1">Alunos</div>
          <div className="text-2xl font-bold text-gray-900">{studentCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-600 text-sm mb-1">Exercícios</div>
          <div className="text-2xl font-bold text-gray-900">{exerciseCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-600 text-sm mb-1">Templates</div>
          <div className="text-2xl font-bold text-gray-900">-</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-gray-600 text-sm mb-1">Treinos Ativos</div>
          <div className="text-2xl font-bold text-gray-900">-</div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/app/personal/students"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-green-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">👥</div>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              ✓ Disponível
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Alunos</h2>
          <p className="text-gray-600 text-sm">
            Gerenciar alunos, enviar convites e acompanhar progresso
          </p>
        </Link>

        <Link
          href="/app/personal/exercises"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-green-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">💪</div>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              ✓ Disponível
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Exercícios</h2>
          <p className="text-gray-600 text-sm">
            Criar e gerenciar biblioteca de exercícios
          </p>
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          🚀 Próximos passos
        </h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>✅ Adicione exercícios na sua biblioteca</li>
          <li>✅ Cadastre seus alunos e envie convites</li>
          <li>• Monte treinos por dia da semana (em breve)</li>
        </ul>
      </div>
    </div>
  );
}
