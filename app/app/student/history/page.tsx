import { createClient } from '@/lib/supabase/server';
import { 
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';

async function getWorkoutHistory(userId: string) {
  const supabase = await createClient();
  
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      template:workout_templates(name)
    `)
    .eq('student_user_id', userId)
    .order('session_date', { ascending: false })
    .limit(30);

  return sessions || [];
}

export default async function HistoryPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sessions = await getWorkoutHistory(user.id);

  // Group by month
  type SessionType = typeof sessions[number];
  const groupedSessions = sessions.reduce<Record<string, SessionType[]>>((acc, session) => {
    const date = new Date(session.session_date);
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(session);
    return acc;
  }, {});

  const completedCount = sessions.filter(s => s.status === 'done').length;
  const totalCount = sessions.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-primary-500" />
          Histórico
        </h1>
        <p className="text-gray-500 mt-1">
          Acompanhe sua evolução
        </p>
      </div>

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-sm text-gray-500">Treinos completos</p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500">Taxa de conclusão</p>
          </div>
        </div>
      )}

      {/* History List */}
      {sessions.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nenhum treino registrado"
          description="Seu histórico de treinos aparecerá aqui conforme você completar os treinos."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([month, monthSessions]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1 capitalize">
                {month}
              </h2>
              
              <div className="space-y-2">
                {monthSessions.map((session) => {
                  const date = new Date(session.session_date);
                  const isCompleted = session.status === 'done';
                  
                  return (
                    <div
                      key={session.id}
                      className="card card-hover flex items-center gap-4 py-4"
                    >
                      {/* Date */}
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-500 uppercase">
                          {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {session.template?.name || 'Treino'}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Dumbbell className="w-3.5 h-3.5" />
                          {date.toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Status */}
                      {isCompleted ? (
                        <span className="badge badge-success flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluído
                        </span>
                      ) : (
                        <span className="badge badge-gray flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Pendente
                        </span>
                      )}

                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
