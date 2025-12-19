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
}

type FilterPeriod = 'all' | '7days' | '14days' | '30days';

export function HistoryClient({ sessions }: Props) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/app/student/today"
          className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
        >
          ← Voltar para Treino do Dia
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Treinos</h1>
        <p className="text-gray-600 text-sm mt-1">
          Seus treinos completados nos últimos dias
        </p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600 mt-1">Treinos</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.avgExercises}</div>
            <div className="text-xs text-gray-600 mt-1">Exercícios/Treino</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatDuration(stats.avgDuration)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Duração Média</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterPeriod('7days')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            filterPeriod === '7days'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Últimos 7 dias
        </button>
        <button
          onClick={() => setFilterPeriod('14days')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            filterPeriod === '14days'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Últimos 14 dias
        </button>
        <button
          onClick={() => setFilterPeriod('30days')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            filterPeriod === '30days'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Últimos 30 dias
        </button>
        <button
          onClick={() => setFilterPeriod('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            filterPeriod === 'all'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum treino encontrado</h3>
          <p className="text-gray-600 mb-6">Complete alguns treinos para ver seu histórico aqui.</p>
          <Link
            href="/app/student/today"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Ir para Treino do Dia
          </Link>
        </div>
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
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-lg hover:border-indigo-100 transition-all duration-200"
              >
                {/* Header com gradiente */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{session.template_name}</h3>
                      <p className="text-sm text-white opacity-90 mt-1">
                        {formatDate(session.session_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                        <div className="text-xs text-white font-semibold">
                          {session.completed_at &&
                            new Date(session.completed_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </div>
                      </div>
                      {session.duration_minutes && (
                        <div className="text-xs text-white opacity-90 mt-1">
                          {formatDuration(session.duration_minutes)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {session.workout_session_exercises.length} exercícios
                    </div>
                    {totalSets > 0 && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {totalSets} séries
                      </div>
                    )}
                  </div>

                  {/* Notes preview */}
                  {session.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <p className="text-sm text-yellow-800 italic line-clamp-1">
                        "{session.notes}"
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
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
