'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutTemplate } from '@/lib/types';
import { 
  Calendar, 
  CheckCircle2, 
  Copy, 
  Save, 
  Trophy, 
  Dumbbell,
  ChevronRight,
  Flame,
  Target,
  Weight
} from 'lucide-react';

interface Props {
  session: WorkoutSession & { template: WorkoutTemplate };
  exercises: (WorkoutSessionExercise & { exercise: any })[];
}

export function TodayWorkoutClient({ session, exercises: initialExercises }: Props) {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const updateExercise = (id: string, field: 'sets_done' | 'reps_done' | 'load', value: any) => {
    setExercises(prev =>
      prev.map(ex =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/student/save-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises }),
      });

      if (!response.ok) throw new Error('Failed to save');
      showToast('success', 'Progresso salvo com sucesso!');
    } catch (error) {
      showToast('error', 'Erro ao salvar progresso');
    } finally {
      setSaving(false);
    }
  };

  const completeWorkout = async () => {
    if (!confirm('Tem certeza que deseja concluir este treino?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/student/complete-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, exercises }),
      });

      if (!response.ok) throw new Error('Failed to complete');
      showToast('success', 'Treino concluído! Parabéns! 💪');
      router.refresh();
    } catch (error) {
      showToast('error', 'Erro ao concluir treino');
    } finally {
      setLoading(false);
    }
  };

  const copyLastSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/copy-last-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (!response.ok) throw new Error('Failed to copy');

      const data = await response.json();
      if (data.exercises) {
        setExercises(data.exercises);
        showToast('success', 'Dados da última sessão copiados!');
      }
    } catch (error) {
      showToast('error', 'Nenhuma sessão anterior encontrada');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = session.status === 'done';
  const todayDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const completedExercises = exercises.filter(ex => ex.sets_done > 0).length;
  const progress = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div 
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-soft-xl animate-slide-down ${
            toast.type === 'success' 
              ? 'bg-success-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <span className="w-5 h-5 flex items-center justify-center">!</span>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="card relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4" />
                <span className="capitalize">{todayDate}</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {session.template?.name || 'Treino do Dia'}
              </h2>
              {session.template?.notes && (
                <p className="text-gray-500 text-sm">{session.template.notes}</p>
              )}
            </div>
            
            {isCompleted && (
              <div className="badge-success flex items-center gap-1.5 animate-scale-in">
                <Trophy className="w-4 h-4" />
                <span>Concluído</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {!isCompleted && exercises.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Progresso do treino</span>
                <span className="font-semibold text-primary-600">
                  {completedExercises}/{exercises.length} exercícios
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-50 rounded-xl mx-auto mb-2">
                <Dumbbell className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{exercises.length}</p>
              <p className="text-xs text-gray-500">Exercícios</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-accent-50 rounded-xl mx-auto mb-2">
                <Flame className="w-5 h-5 text-accent-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{completedExercises}</p>
              <p className="text-xs text-gray-500">Feitos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-success-50 rounded-xl mx-auto mb-2">
                <Target className="w-5 h-5 text-success-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</p>
              <p className="text-xs text-gray-500">Completo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyLastSession}
            disabled={loading}
            className="btn-secondary flex items-center justify-center gap-2 py-3"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar última</span>
          </button>
          <button
            onClick={saveProgress}
            disabled={saving}
            className="btn bg-primary-50 text-primary-700 hover:bg-primary-100 focus:ring-primary-500 flex items-center justify-center gap-2 py-3"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary-500" />
          Exercícios
        </h3>
        
        {exercises.map((ex, index) => (
          <div 
            key={ex.id} 
            className="card card-hover animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Exercise number */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                ex.sets_done > 0 
                  ? 'bg-success-100 text-success-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {ex.sets_done > 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Exercise content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">{ex.exercise.name}</h4>
                  {ex.exercise.muscle_group && (
                    <span className="badge-gray text-xs ml-2 flex-shrink-0">
                      {ex.exercise.muscle_group}
                    </span>
                  )}
                </div>

                {isCompleted ? (
                  <div className="grid grid-cols-3 gap-4 mt-3 bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Séries</p>
                      <p className="font-bold text-gray-900">{ex.sets_done}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Reps</p>
                      <p className="font-bold text-gray-900">{ex.reps_done || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Carga</p>
                      <p className="font-bold text-gray-900">
                        {ex.load ? `${ex.load}kg` : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Séries
                      </label>
                      <input
                        type="number"
                        value={ex.sets_done}
                        onChange={(e) => updateExercise(ex.id, 'sets_done', parseInt(e.target.value) || 0)}
                        className="input text-center font-semibold"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Reps
                      </label>
                      <input
                        type="text"
                        value={ex.reps_done}
                        onChange={(e) => updateExercise(ex.id, 'reps_done', e.target.value)}
                        placeholder="10/10/8"
                        className="input text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                        <Weight className="w-3 h-3" />
                        Carga
                      </label>
                      <input
                        type="number"
                        value={ex.load || ''}
                        onChange={(e) => updateExercise(ex.id, 'load', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="kg"
                        step="0.5"
                        className="input text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Button */}
      {!isCompleted && exercises.length > 0 && (
        <button
          onClick={completeWorkout}
          disabled={loading}
          className="btn-success w-full py-4 text-lg shadow-glow-success"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Concluindo...</span>
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5" />
              <span>Concluir Treino</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      )}

      {/* Completed celebration */}
      {isCompleted && (
        <div className="card bg-gradient-to-br from-success-50 to-success-100 border border-success-200 text-center">
          <div className="py-4">
            <div className="w-16 h-16 gradient-success rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-success">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-success-800 mb-2">
              Treino Concluído!
            </h3>
            <p className="text-success-600">
              Parabéns pelo esforço de hoje. Continue assim! 💪
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
