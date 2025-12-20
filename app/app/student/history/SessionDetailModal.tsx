'use client';

import { useEffect } from 'react';
import { WorkoutComments } from '@/components/WorkoutComments';
import type { WorkoutSession, WorkoutSessionExercise, Exercise } from '@/lib/types';

interface SessionWithExercises extends WorkoutSession {
  workout_session_exercises: (WorkoutSessionExercise & { exercise: Exercise })[];
}

interface Props {
  session: SessionWithExercises;
  currentUserId: string;
  currentUserRole: 'student' | 'personal';
  onClose: () => void;
}

export function SessionDetailModal({ session, currentUserId, currentUserRole, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const sortedExercises = [...session.workout_session_exercises].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const totalSets = sortedExercises.reduce((sum, e) => sum + e.actual_sets, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-2xl font-bold text-white break-words leading-tight">{session.template?.name || 'Treino'}</h2>
              <p className="text-sm text-white/90 mt-2 font-medium">{formatDate(session.session_date)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition flex-shrink-0"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Session Info */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <div className="text-2xl font-bold text-white">{totalSets}</div>
              <div className="text-xs text-white/90 mt-1 font-medium">Séries Total</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <div className="text-lg font-bold text-white">
                {formatTime(session.completed_at)}
              </div>
              <div className="text-xs text-white/90 mt-1 font-medium">Concluído às</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <div className="text-lg font-bold text-white">
                {formatDuration(session.duration_minutes)}
              </div>
              <div className="text-xs text-white/90 mt-1 font-medium">Duração</div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Notes */}
          {session.notes && (
            <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-warning-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-warning-800 mb-1">Observações do Treino</div>
                  <p className="text-sm text-warning-900 leading-relaxed">{session.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-900">
                Exercícios
              </h3>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {sortedExercises.length}
              </span>
            </div>
            <div className="space-y-3">
              {sortedExercises.map((exercise, index) => (
                <div key={exercise.id} className="card overflow-hidden hover:shadow-elevated transition-all duration-300">
                  {/* Exercise Header */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-5 border-b border-primary-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-bold text-dark-900 text-lg leading-tight break-words mb-2">
                          {exercise.exercise.name}
                        </h4>
                        {exercise.exercise.muscle_group && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-200 text-primary-800">
                              {exercise.exercise.muscle_group}
                            </span>
                          </div>
                        )}
                        <div className="inline-flex items-center px-3 py-1.5 bg-white rounded-lg border border-primary-200">
                          <span className="text-sm font-bold text-primary-700">
                            {exercise.actual_sets} série{exercise.actual_sets !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Data */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <div className="text-xs font-semibold text-blue-700 mb-2.5 uppercase tracking-wide">Reps</div>
                        <div className="text-xl font-bold text-blue-900 mb-2 break-words">
                          {exercise.actual_reps || '—'}
                        </div>
                        {exercise.target_reps && (
                          <div className="text-xs text-blue-600 font-medium">
                            Alvo: {exercise.target_reps}
                          </div>
                        )}
                      </div>
                      <div className="bg-success-50 rounded-xl p-5 border border-success-100">
                        <div className="text-xs font-semibold text-success-700 mb-2.5 uppercase tracking-wide">Carga</div>
                        <div className="text-xl font-bold text-success-900 break-words">
                          {exercise.actual_load ? `${exercise.actual_load}kg` : '—'}
                        </div>
                      </div>
                      <div className="bg-accent-50 rounded-xl p-5 border border-accent-100">
                        <div className="text-xs font-semibold text-accent-700 mb-2.5 uppercase tracking-wide">Sets Alvo</div>
                        <div className="text-xl font-bold text-accent-900">
                          {exercise.target_sets || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Notes */}
                  {exercise.notes && (
                    <div className="px-5 pb-4">
                      <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-warning-800 mb-1">Observações do Exercício</div>
                        <div className="text-sm text-warning-900 leading-relaxed">{exercise.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
            <WorkoutComments 
              sessionId={session.id}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
