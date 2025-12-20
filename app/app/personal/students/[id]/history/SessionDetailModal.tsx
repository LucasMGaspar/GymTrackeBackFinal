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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{session.template?.name || 'Treino'}</h2>
              <p className="text-sm text-gray-600 mt-1">{formatDate(session.session_date)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Session Info */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600 font-semibold">{totalSets}</div>
              <div className="text-xs text-blue-800 mt-1">Séries Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600 font-semibold">
                {formatTime(session.completed_at)}
              </div>
              <div className="text-xs text-green-800 mt-1">Concluído às</div>
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <div className="text-sm text-primary-600 font-semibold">
                {formatDuration(session.duration_minutes)}
              </div>
              <div className="text-xs text-primary-800 mt-1">Duração</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notes */}
          {session.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-yellow-800 mb-1">Observações</div>
              <p className="text-sm text-yellow-900">{session.notes}</p>
            </div>
          )}

          {/* Exercises */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Exercícios ({sortedExercises.length})
            </h3>
            <div className="space-y-4">
              {sortedExercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-gray-50 rounded-lg p-4">
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {exercise.exercise.name}
                        </span>
                      </div>
                      {exercise.exercise.muscle_group && (
                        <div className="text-xs text-gray-600 mt-1">
                          {exercise.exercise.muscle_group}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {exercise.actual_sets} série{exercise.actual_sets !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Data */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Reps</div>
                      <div className="font-medium text-gray-900">
                        {exercise.actual_reps || '—'}
                      </div>
                      {exercise.target_reps && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Alvo: {exercise.target_reps}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Carga</div>
                      <div className="font-medium text-gray-900">
                        {exercise.actual_load || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Sets Alvo</div>
                      <div className="font-medium text-gray-900">
                        {exercise.target_sets || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Notes */}
                  {exercise.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">Observações:</div>
                      <div className="text-sm text-gray-700 mt-1">{exercise.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
            <WorkoutComments 
              sessionId={session.id}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
