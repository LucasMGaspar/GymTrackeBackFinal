'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutTemplate } from '@/lib/types';

interface Props {
  session: WorkoutSession & { template: WorkoutTemplate };
  exercises: (WorkoutSessionExercise & { exercise: any })[];
}

export function TodayWorkoutClient({ session, exercises: initialExercises }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [exercises, setExercises] = useState(initialExercises);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = session.status === 'completed';

  // Autofocus on first input
  useEffect(() => {
    if (!isCompleted && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isCompleted]);

  const updateExercise = (id: string, field: 'actual_sets' | 'actual_reps' | 'actual_load', value: any) => {
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
      
      showToast('Progresso salvo com sucesso! 💪', 'success');
    } catch (error) {
      showToast('Erro ao salvar progresso', 'error');
    } finally {
      setSaving(false);
    }
  };

  const completeWorkout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/complete-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, exercises }),
      });

      if (!response.ok) throw new Error('Failed to complete');

      showToast('Treino concluído! Parabéns! 🎉', 'success');
      setTimeout(() => router.refresh(), 1000);
    } catch (error) {
      showToast('Erro ao concluir treino', 'error');
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

      if (!response.ok) {
        showToast('Nenhuma sessão anterior encontrada', 'warning');
        return;
      }

      const data = await response.json();
      if (data.exercises) {
        setExercises(data.exercises);
        showToast('Dados copiados da última sessão! 📋', 'success');
      }
    } catch (error) {
      showToast('Erro ao copiar sessão', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const filledExercises = exercises.filter(
    (ex) => ex.actual_sets > 0 || ex.actual_reps.trim() !== ''
  ).length;
  const progressPercent = exercises.length > 0 
    ? Math.round((filledExercises / exercises.length) * 100) 
    : 0;

  const todayDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${
        isCompleted 
          ? 'bg-gradient-to-br from-success-500 to-success-600' 
          : 'bg-gradient-to-br from-primary-500 to-primary-600'
      }`}>
        {/* Background decorations */}
        <div className="absolute inset-0 stat-pattern" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -right-4 -bottom-12 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 capitalize mb-1">{todayDate}</p>
              <h1 className="text-2xl font-bold">
                {session.template?.name || 'Treino do Dia'}
              </h1>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold">Concluído</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {!isCompleted && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-white/90">Progresso do treino</span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <div className="progress-bar bg-white/20">
                <div
                  className="progress-bar-fill bg-white"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-white/80">
                {filledExercises} de {exercises.length} exercícios preenchidos
              </p>
            </div>
          )}

          {session.template?.notes && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-sm text-white/90">{session.template.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyLastSession}
            disabled={loading}
            className="btn-secondary py-3 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
            Copiar Última
          </button>
          <button
            onClick={saveProgress}
            disabled={saving}
            className="btn-primary py-3 text-sm"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 loading-spinner border-white/30 border-t-white" />
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
                </svg>
                Salvar
              </>
            )}
          </button>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises.map((ex, index) => {
          const hasTarget = ex.target_sets || ex.target_reps;
          const isFilled = ex.actual_sets > 0 || ex.actual_reps.trim() !== '';
          
          return (
            <div 
              key={ex.id} 
              className={`card overflow-hidden transition-all duration-300 ${
                isFilled && !isCompleted ? 'ring-2 ring-success-500/20 shadow-glow-success' : ''
              }`}
            >
              {/* Header */}
              <div className={`px-5 py-4 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-success-500 to-success-600' 
                  : 'bg-gradient-to-r from-primary-500 to-primary-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{ex.exercise.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ex.exercise.muscle_group && (
                          <span className="text-xs text-white/80 font-medium">
                            {ex.exercise.muscle_group}
                          </span>
                        )}
                        {hasTarget && (
                          <span className="bg-white/20 rounded-full px-2 py-0.5 text-2xs font-semibold text-white">
                            Meta: {ex.target_sets}x{ex.target_reps}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isFilled && !isCompleted && (
                    <div className="w-8 h-8 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0 ml-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {isCompleted ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 bg-primary-50 rounded-xl border border-primary-100">
                      <p className="text-2xs font-semibold text-primary-600 uppercase tracking-wider mb-1">Séries</p>
                      <p className="text-2xl font-bold text-primary-700">{ex.actual_sets}</p>
                    </div>
                    <div className="text-center p-4 bg-accent-50 rounded-xl border border-accent-100">
                      <p className="text-2xs font-semibold text-accent-600 uppercase tracking-wider mb-1">Reps</p>
                      <p className="text-lg font-bold text-accent-700">{ex.actual_reps || '-'}</p>
                    </div>
                    <div className="text-center p-4 bg-success-50 rounded-xl border border-success-100">
                      <p className="text-2xs font-semibold text-success-600 uppercase tracking-wider mb-1">Carga</p>
                      <p className="text-lg font-bold text-success-700">
                        {ex.actual_load ? `${ex.actual_load}kg` : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`sets-${ex.id}`} className="block text-2xs font-semibold text-dark-500 mb-2 uppercase tracking-wider">
                        Séries
                      </label>
                      <input
                        ref={index === 0 ? firstInputRef : null}
                        id={`sets-${ex.id}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={ex.actual_sets || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateExercise(ex.id, 'actual_sets', parseInt(val) || 0);
                        }}
                        className="input text-center text-xl font-bold py-4"
                        placeholder="0"
                        aria-label={`Séries para ${ex.exercise.name}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`reps-${ex.id}`} className="block text-2xs font-semibold text-dark-500 mb-2 uppercase tracking-wider">
                        Reps
                      </label>
                      <input
                        id={`reps-${ex.id}`}
                        type="text"
                        value={ex.actual_reps}
                        onChange={(e) => updateExercise(ex.id, 'actual_reps', e.target.value)}
                        placeholder="10/10/8"
                        className="input text-center text-base font-bold py-4"
                        aria-label={`Repetições para ${ex.exercise.name}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`load-${ex.id}`} className="block text-2xs font-semibold text-dark-500 mb-2 uppercase tracking-wider">
                        Carga
                      </label>
                      <input
                        id={`load-${ex.id}`}
                        type="text"
                        inputMode="decimal"
                        value={ex.actual_load || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          updateExercise(ex.id, 'actual_load', val ? parseFloat(val) : null);
                        }}
                        placeholder="kg"
                        className="input text-center text-xl font-bold py-4"
                        aria-label={`Carga em kg para ${ex.exercise.name}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Button */}
      {!isCompleted && exercises.length > 0 && (
        <>
          <button
            onClick={() => setShowCompleteConfirm(true)}
            disabled={loading}
            className="btn-success w-full py-4 text-base"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Concluir Treino
          </button>

          {/* Confirm Modal */}
          {showCompleteConfirm && (
            <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="card-elevated max-w-sm w-full p-6 animate-scale-in">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-success-500/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-dark-900 mb-2">Concluir Treino?</h3>
                  <p className="text-dark-500">
                    Você preencheu <span className="font-semibold text-dark-700">{filledExercises}</span> de{' '}
                    <span className="font-semibold text-dark-700">{exercises.length}</span> exercícios ({progressPercent}%)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowCompleteConfirm(false)}
                    className="btn-secondary py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteConfirm(false);
                      completeWorkout();
                    }}
                    disabled={loading}
                    className="btn-success py-3"
                  >
                    {loading ? 'Concluindo...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
