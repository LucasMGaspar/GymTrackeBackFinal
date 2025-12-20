'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { WorkoutSession, WorkoutSessionExercise, Exercise } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { WorkoutComments } from '@/components/WorkoutComments';

interface SessionWithExercises extends WorkoutSession {
  workout_session_exercises: (WorkoutSessionExercise & { exercise: Exercise })[];
}

interface Props {
  sessions: SessionWithExercises[];
  currentUserId: string;
  currentUserRole: 'student' | 'personal';
}

type FilterPeriod = 'all' | '7days' | '14days' | '30days';

export function HistoryClient({ sessions, currentUserId, currentUserRole }: Props) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('14days');

  const filteredSessions = useMemo(() => {
    if (filterPeriod === 'all') return sessions;

    const daysMap = {
      '7days': 7,
      '14days': 14,
      '30days': 30,
    };

    const days = daysMap[filterPeriod];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return sessions.filter((session) => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= cutoffDate;
    });
  }, [sessions, filterPeriod]);

  const formatDate = (dateString: string) => {
    // Extract just the date part (YYYY-MM-DD) if it's a full timestamp
    const dateOnly = dateString.split('T')[0];
    
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Compare date strings directly (no timezone issues)
    if (dateOnly === todayStr) return 'Hoje';
    if (dateOnly === yesterdayStr) return 'Ontem';

    // Format the date for display
    const date = new Date(dateOnly + 'T12:00:00'); // Use noon to avoid timezone issues
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateStats = () => {
    const total = filteredSessions.length;
    const totalExercises = filteredSessions.reduce(
      (sum, s) => sum + s.workout_session_exercises.length,
      0
    );
    const avgExercises = total > 0 ? Math.round(totalExercises / total) : 0;
    
    const durationsWithValues = filteredSessions
      .map((s) => s.duration_minutes)
      .filter((d): d is number => d !== null && d > 0);
    const avgDuration = durationsWithValues.length > 0
      ? Math.round(
          durationsWithValues.reduce((sum, d) => sum + d, 0) / durationsWithValues.length
        )
      : 0;

    return { total, avgExercises, avgDuration };
  };

  const stats = calculateStats();

  const filterOptions = [
    { key: '7days', label: '7 dias' },
    { key: '14days', label: '14 dias' },
    { key: '30days', label: '30 dias' },
    { key: 'all', label: 'Todos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <Link
          href="/app/student/today"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar para Treino
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-dark-900 mb-2">Histórico de Treinos</h1>
            <p className="text-dark-500 text-base">
              Acompanhe sua evolução ao longo do tempo
            </p>
          </div>
          <Link
            href="/app/student/calendar"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendário
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5 text-center group hover:shadow-elevated transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
            <p className="text-sm text-dark-500 mt-1 font-medium">Treinos</p>
          </div>
          <div className="card p-5 text-center group hover:shadow-elevated transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-success-100 text-success-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-success-600">{stats.avgExercises}</p>
            <p className="text-sm text-dark-500 mt-1 font-medium">Exercícios/Treino</p>
          </div>
          <div className="card p-5 text-center group hover:shadow-elevated transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-accent-600">
              {formatDuration(stats.avgDuration)}
            </p>
            <p className="text-sm text-dark-500 mt-1 font-medium">Duração Média</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterPeriod(filter.key as FilterPeriod)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              filterPeriod === filter.key
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 scale-105'
                : 'bg-dark-100 text-dark-600 hover:bg-dark-200 hover:scale-105'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nenhum treino encontrado"
          description="Complete alguns treinos para ver seu histórico aqui."
          action={{
            label: 'Ir para Treino do Dia',
            onClick: () => window.location.href = '/app/student/today',
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const totalSets = session.workout_session_exercises.reduce(
              (sum, e) => sum + e.actual_sets,
              0
            );
            return (
              <div
                key={session.id}
                className="w-full card overflow-hidden text-left hover:shadow-elevated transition-all duration-300 group"
              >
                <button
                  onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                  className="w-full text-left"
                >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-6 py-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-xl mb-1.5 break-words">{session.template?.name || 'Treino'}</h3>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-white/90 font-medium">
                          {formatDate(session.completed_at ? session.completed_at : session.session_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                        <p className="text-sm text-white font-bold">
                          {session.completed_at &&
                            new Date(session.completed_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>
                      </div>
                      {session.duration_minutes && (
                        <div className="mt-2 flex items-center justify-end gap-1">
                          <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-white/90 font-medium">
                            {formatDuration(session.duration_minutes)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-3 text-sm font-semibold text-dark-700">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                      </div>
                      <span className="text-base">{session.workout_session_exercises.length} exercícios</span>
                    </div>
                    {totalSets > 0 && (
                      <div className="flex items-center gap-3 text-sm font-semibold text-dark-700">
                        <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-base">{totalSets} séries</span>
                      </div>
                    )}
                  </div>

                  {/* Notes preview */}
                  {session.notes && (
                    <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl px-4 py-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <p className="text-sm text-warning-800 italic line-clamp-2 leading-relaxed">
                          &ldquo;{session.notes}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                </button>

                {/* Expanded Details */}
                {expandedSessionId === session.id && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6 space-y-6">
                      {/* Session Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                          <div className="text-2xl font-bold text-blue-600">
                            {totalSets}
                          </div>
                          <div className="text-xs text-blue-800 mt-1 font-medium">Séries Total</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                          <div className="text-lg font-bold text-green-600">
                            {session.completed_at &&
                              new Date(session.completed_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </div>
                          <div className="text-xs text-green-800 mt-1 font-medium">Concluído às</div>
                        </div>
                        <div className="bg-primary-50 rounded-xl p-4 text-center border border-primary-100">
                          <div className="text-lg font-bold text-primary-600">
                            {formatDuration(session.duration_minutes)}
                          </div>
                          <div className="text-xs text-primary-800 mt-1 font-medium">Duração</div>
                        </div>
                      </div>

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
                          <h3 className="text-lg font-bold text-dark-900">Exercícios</h3>
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                            {session.workout_session_exercises.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {[...session.workout_session_exercises]
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((exercise, index) => (
                              <div key={exercise.id} className="card overflow-hidden hover:shadow-elevated transition-all duration-300">
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
                                  {exercise.notes && (
                                    <div className="mt-4 bg-warning-50 border border-warning-200 rounded-lg p-3">
                                      <div className="text-xs font-semibold text-warning-800 mb-1">Observações do Exercício</div>
                                      <div className="text-sm text-warning-900 leading-relaxed">{exercise.notes}</div>
                                    </div>
                                  )}
                                </div>
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

                      {/* Close Button */}
                      <button
                        onClick={() => setExpandedSessionId(null)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-primary-500/25"
                      >
                        Fechar Detalhes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
