'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { WorkoutSession, WorkoutSessionExercise, Exercise } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { SessionDetailModal } from './SessionDetailModal';

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
  const [selectedSession, setSelectedSession] = useState<SessionWithExercises | null>(null);
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
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Hoje';
    if (isYesterday) return 'Ontem';

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
      <div>
        <Link
          href="/app/student/today"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar para Treino
        </Link>
        <h1 className="text-2xl font-bold text-dark-900">Histórico de Treinos</h1>
        <p className="text-dark-500 text-sm mt-1">
          Acompanhe sua evolução ao longo do tempo
        </p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
            <p className="text-xs text-dark-500 mt-1">Treinos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success-600">{stats.avgExercises}</p>
            <p className="text-xs text-dark-500 mt-1">Exercícios/Treino</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-accent-600">
              {formatDuration(stats.avgDuration)}
            </p>
            <p className="text-xs text-dark-500 mt-1">Duração Média</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterPeriod(filter.key as FilterPeriod)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filterPeriod === filter.key
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
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
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full card overflow-hidden text-left hover:shadow-elevated transition-all duration-300"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{session.template_name}</h3>
                      <p className="text-sm text-white/80 mt-1">
                        {formatDate(session.session_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                        <p className="text-xs text-white font-semibold">
                          {session.completed_at &&
                            new Date(session.completed_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>
                      </div>
                      {session.duration_minutes && (
                        <p className="text-xs text-white/80 mt-1.5">
                          {formatDuration(session.duration_minutes)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-dark-700">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                      </div>
                      {session.workout_session_exercises.length} exercícios
                    </div>
                    {totalSets > 0 && (
                      <div className="flex items-center gap-2 text-sm font-medium text-dark-700">
                        <div className="w-8 h-8 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {totalSets} séries
                      </div>
                    )}
                  </div>

                  {/* Notes preview */}
                  {session.notes && (
                    <div className="bg-warning-50 border border-warning-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-warning-800 italic line-clamp-1">
                        &ldquo;{session.notes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
