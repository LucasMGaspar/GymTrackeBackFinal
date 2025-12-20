'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutTemplate } from '@/lib/types';

interface Props {
  session: WorkoutSession & { template: WorkoutTemplate };
  exercises: (WorkoutSessionExercise & { exercise: any })[];
  allTemplates?: any[];
}

export function TodayWorkoutClient({ session, exercises: initialExercises, allTemplates = [] }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [exercises, setExercises] = useState(initialExercises);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = session.status === 'completed';

  // Calculate upcoming workouts
  const getUpcomingWorkouts = () => {
    const today = new Date();
    const currentWeekday = today.getDay();
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const upcoming = [];
    
    // Get next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const weekday = date.getDay();
      
      const template = allTemplates.find(t => t.weekday === weekday);
      if (template) {
        const exerciseCount = template.workout_template_exercises?.length || 0;
        upcoming.push({
          weekday,
          weekdayName: weekdays[weekday],
          weekdayShort: weekdaysShort[weekday],
          date,
          template,
          exerciseCount,
          isToday: i === 0,
        });
      }
    }
    
    return upcoming;
  };

  const upcomingWorkouts = getUpcomingWorkouts();

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
      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
        <button
          onClick={() => setShowUpcoming(false)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
            !showUpcoming
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          Treino de Hoje
        </button>
        <button
          onClick={() => setShowUpcoming(true)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
            showUpcoming
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          Próximos Treinos
        </button>
      </div>

      {showUpcoming ? (
        <div className="space-y-4" key="upcoming">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Próximos Treinos da Semana</h2>
            
            {upcomingWorkouts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum treino configurado para os próximos dias.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingWorkouts.map((workout) => (
                  <div
                    key={workout.weekday}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      workout.isToday
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50'
                        : 'border-gray-200 bg-white hover:border-primary-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                          {workout.weekdayShort}
                        </div>
                        <div className={`text-lg font-bold ${
                          workout.isToday ? 'text-primary-700' : 'text-gray-900'
                        }`}>
                          {workout.weekdayName}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {workout.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      {workout.isToday && (
                        <span className="px-2.5 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                          Hoje
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {workout.template.name}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{workout.exerciseCount} exercícios</span>
                        </div>
                      </div>
                      
                      {workout.template.workout_template_exercises && workout.template.workout_template_exercises.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-2">Exercícios:</p>
                          <div className="space-y-1.5">
                            {workout.template.workout_template_exercises.slice(0, 3).map((ex: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="w-5 h-5 flex items-center justify-center bg-primary-100 text-primary-700 rounded text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span>{ex.exercise?.name || 'Exercício'}</span>
                              </div>
                            ))}
                            {workout.template.workout_template_exercises.length > 3 && (
                              <p className="text-xs text-gray-500 ml-7">
                                +{workout.template.workout_template_exercises.length - 3} mais
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div key="today">
          {/* Header Card */}
          <div className={`rounded-xl p-5 ${
            isCompleted 
              ? 'bg-success-500 text-white' 
              : 'bg-primary-500 text-white'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs text-white/80 mb-1">{todayDate}</p>
                <h1 className="text-xl font-bold">
                  {session.template?.name || 'Treino do Dia'}
                </h1>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-xs font-semibold">Concluído</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {!isCompleted && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/90">Progresso</span>
                  <span className="font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-white/70">
                  {filledExercises} de {exercises.length} exercícios
                </p>
              </div>
            )}

            {session.template?.notes && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs text-white/80">{session.template.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!isCompleted && (
            <div className="flex gap-2">
              <button
                onClick={copyLastSession}
                disabled={loading}
                className="flex-1 btn-secondary py-2.5 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Copiar Última
              </button>
              <button
                onClick={saveProgress}
                disabled={saving}
                className="flex-1 btn-primary py-2.5 text-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 loading-spinner border-white/30 border-t-white" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
              className={`bg-white rounded-lg border-2 overflow-hidden transition-all ${
                isFilled && !isCompleted 
                  ? 'border-success-300 shadow-sm' 
                  : isCompleted
                  ? 'border-gray-200'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              {/* Header */}
              <div className={`px-4 py-3 ${
                isCompleted 
                  ? 'bg-success-50 border-b border-success-100' 
                  : 'bg-primary-50 border-b border-primary-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">{ex.exercise.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ex.exercise.muscle_group && (
                        <span className="text-xs text-gray-600">
                          {ex.exercise.muscle_group}
                        </span>
                      )}
                      {hasTarget && (
                        <span className="text-xs text-gray-500">
                          Meta: {ex.target_sets}x{ex.target_reps}
                        </span>
                      )}
                    </div>
                  </div>
                  {isFilled && !isCompleted && (
                    <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {isCompleted ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Séries</p>
                      <p className="text-lg font-bold text-gray-900">{ex.actual_sets}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Reps</p>
                      <p className="text-sm font-semibold text-gray-900">{ex.actual_reps || '-'}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Carga</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {ex.actual_load ? `${ex.actual_load}kg` : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`sets-${ex.id}`} className="block text-xs font-medium text-gray-600 mb-1.5">
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
                        className="w-full input text-center text-lg font-bold py-3"
                        placeholder="0"
                        aria-label={`Séries para ${ex.exercise.name}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`reps-${ex.id}`} className="block text-xs font-medium text-gray-600 mb-1.5">
                        Reps
                      </label>
                      <input
                        id={`reps-${ex.id}`}
                        type="text"
                        value={ex.actual_reps}
                        onChange={(e) => updateExercise(ex.id, 'actual_reps', e.target.value)}
                        placeholder="10/10/8"
                        className="w-full input text-center text-sm font-semibold py-3"
                        aria-label={`Repetições para ${ex.exercise.name}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`load-${ex.id}`} className="block text-xs font-medium text-gray-600 mb-1.5">
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
                        className="w-full input text-center text-sm font-semibold py-3"
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
                className="btn-success w-full py-3 text-sm font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
      )}
    </div>
  );
}
