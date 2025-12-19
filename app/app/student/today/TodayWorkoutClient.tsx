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

  // Autofocus on first input
  useEffect(() => {
    if (!isCompleted && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, []);

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

  const isCompleted = session.status === 'completed';
  
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
    <div className="space-y-5">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {session.template?.name || 'Treino do Dia'}
            </h1>
            <p className="text-sm opacity-90 capitalize">{todayDate}</p>
          </div>
          {isCompleted && (
            <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Concluído
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isCompleted && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold">Progresso</span>
              <span className="font-bold">{filledExercises} de {exercises.length} exercícios</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs opacity-90 mt-1 text-right">{progressPercent}%</div>
          </div>
        )}

        {session.template?.notes && (
          <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-sm opacity-90">{session.template.notes}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyLastSession}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl transition-all hover:border-indigo-300 hover:bg-indigo-50 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar Última
          </button>
          <button
            onClick={saveProgress}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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
              className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all duration-200 ${
                isFilled ? 'border-green-200 shadow-green-100' : 'border-gray-100'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{ex.exercise.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {ex.exercise.muscle_group && (
                          <span className="text-xs text-white opacity-90 font-medium">
                            {ex.exercise.muscle_group}
                          </span>
                        )}
                        {hasTarget && (
                          <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs font-bold text-white">
                            Meta: {ex.target_sets}x{ex.target_reps}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isFilled && !isCompleted && (
                    <div className="flex-shrink-0 ml-2">
                      <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {isCompleted ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                      <div className="text-xs text-indigo-600 font-bold mb-1.5">SÉRIES</div>
                      <div className="text-3xl font-bold text-indigo-700">{ex.actual_sets}</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="text-xs text-purple-600 font-bold mb-1.5">REPS</div>
                      <div className="text-xl font-bold text-purple-700">{ex.actual_reps || '-'}</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <div className="text-xs text-green-600 font-bold mb-1.5">CARGA</div>
                      <div className="text-xl font-bold text-green-700">
                        {ex.actual_load ? `${ex.actual_load}kg` : '-'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`sets-${ex.id}`} className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
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
                        className="w-full px-3 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-2xl font-bold text-gray-900 transition-all"
                        placeholder="0"
                        aria-label={`Séries para ${ex.exercise.name}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`reps-${ex.id}`} className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Reps
                      </label>
                      <input
                        id={`reps-${ex.id}`}
                        type="text"
                        value={ex.actual_reps}
                        onChange={(e) => updateExercise(ex.id, 'actual_reps', e.target.value)}
                        placeholder="10/10/8"
                        className="w-full px-3 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-lg font-bold text-gray-900 transition-all"
                        aria-label={`Repetições para ${ex.exercise.name}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`load-${ex.id}`} className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
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
                        placeholder="20"
                        className="w-full px-3 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-2xl font-bold text-gray-900 transition-all"
                        aria-label={`Carga em kg para ${ex.exercise.name}`}
                      />
                      <div className="text-center text-xs text-gray-500 mt-1 font-semibold">kg</div>
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
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Concluir Treino
          </button>

          {/* Confirm Modal */}
          {showCompleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Concluir Treino?</h3>
                  <p className="text-gray-600 text-sm">
                    Você completou {filledExercises} de {exercises.length} exercícios ({progressPercent}%)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowCompleteConfirm(false)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteConfirm(false);
                      completeWorkout();
                    }}
                    disabled={loading}
                    className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50"
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
