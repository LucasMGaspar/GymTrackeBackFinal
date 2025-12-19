'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { StreakDisplay } from '@/components/StreakDisplay';
import { AchievementsBadges } from '@/components/AchievementsBadges';
import { ProgressCharts } from '@/components/ProgressCharts';
import type { WorkoutSession, WorkoutSessionExercise, Exercise } from '@/lib/types';

interface SessionWithExercises extends WorkoutSession {
  workout_session_exercises: (WorkoutSessionExercise & { exercise: Exercise })[];
}

interface Props {
  studentName: string;
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkoutsCompleted: number;
  sessions: SessionWithExercises[];
}

interface PersonalRecord {
  exercise_name: string;
  max_load: number;
  date: string;
  reps: string;
}

export function DashboardClient({ 
  studentName, 
  studentId,
  currentStreak,
  longestStreak,
  lastWorkoutDate,
  totalWorkoutsCompleted,
  sessions 
}: Props) {
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // This month
    const thisMonthSessions = sessions.filter((s) => {
      const date = new Date(s.session_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    // Last 28 days (4 weeks)
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const last28DaysSessions = sessions.filter(
      (s) => new Date(s.session_date) >= twentyEightDaysAgo
    );

    // Total stats
    const totalSessions = sessions.length;
    const totalExercises = sessions.reduce(
      (sum, s) => sum + s.workout_session_exercises.length,
      0
    );

    // Weekly adherence (last 4 weeks)
    const weeklyAdherence = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekSessions = sessions.filter((s) => {
        const date = new Date(s.session_date);
        return date >= weekStart && date < weekEnd;
      });

      weeklyAdherence.push({
        week: `S${4 - i}`,
        count: weekSessions.length,
        label: `Semana ${4 - i}`,
      });
    }

    // Personal Records (PRs)
    const exerciseMaxLoads = new Map<string, PersonalRecord>();
    
    sessions.forEach((session) => {
      session.workout_session_exercises.forEach((ex) => {
        if (ex.actual_load && ex.actual_load > 0) {
          const current = exerciseMaxLoads.get(ex.exercise.name);
          if (!current || ex.actual_load > current.max_load) {
            exerciseMaxLoads.set(ex.exercise.name, {
              exercise_name: ex.exercise.name,
              max_load: ex.actual_load,
              date: session.session_date,
              reps: ex.actual_reps,
            });
          }
        }
      });
    });

    const personalRecords = Array.from(exerciseMaxLoads.values())
      .sort((a, b) => b.max_load - a.max_load)
      .slice(0, 5);

    // Average duration
    const durationsWithValues = sessions
      .map((s) => s.duration_minutes)
      .filter((d): d is number => d !== null && d > 0);
    const avgDuration = durationsWithValues.length > 0
      ? Math.round(
          durationsWithValues.reduce((sum, d) => sum + d, 0) / durationsWithValues.length
        )
      : 0;

    return {
      thisMonthTotal: thisMonthSessions.length,
      last28DaysTotal: last28DaysSessions.length,
      totalSessions,
      totalExercises,
      avgDuration,
      weeklyAdherence,
      personalRecords,
    };
  }, [sessions]);

  const maxWeeklyCount = Math.max(...metrics.weeklyAdherence.map((w) => w.count), 1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Olá, {studentName}! Aqui está seu resumo de desempenho 💪
        </p>
      </div>

      {/* Streak Display */}
      <StreakDisplay 
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        lastWorkoutDate={lastWorkoutDate}
      />

      {/* Achievements */}
      <AchievementsBadges studentId={studentId} />

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Este Mês</div>
          <div className="text-3xl font-bold">{metrics.thisMonthTotal}</div>
          <div className="text-xs opacity-90 mt-1">treinos</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Últimos 28 Dias</div>
          <div className="text-3xl font-bold">{metrics.last28DaysTotal}</div>
          <div className="text-xs opacity-90 mt-1">treinos</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Total Geral</div>
          <div className="text-3xl font-bold">{metrics.totalSessions}</div>
          <div className="text-xs opacity-90 mt-1">treinos</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Duração Média</div>
          <div className="text-3xl font-bold">
            {metrics.avgDuration > 0 ? formatDuration(metrics.avgDuration) : '—'}
          </div>
          <div className="text-xs opacity-90 mt-1">por treino</div>
        </div>
      </div>

      {/* Weekly Adherence */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Aderência Semanal (Últimas 4 Semanas)
        </h2>
        
        {metrics.last28DaysTotal === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum treino nos últimos 28 dias. Comece hoje! 💪
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.weeklyAdherence.map((week) => (
              <div key={week.week}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{week.label}</span>
                  <span className="text-sm font-bold text-blue-600">{week.count} treinos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end px-2"
                    style={{
                      width: `${(week.count / maxWeeklyCount) * 100}%`,
                      minWidth: week.count > 0 ? '8%' : '0%',
                    }}
                  >
                    {week.count > 0 && (
                      <span className="text-xs font-bold text-white">{week.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Charts */}
      <ProgressCharts sessions={sessions} />

      {/* Personal Records */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Personal Records (PRs) 🏆</h2>
          <span className="text-xs text-gray-500">Top 5 cargas</span>
        </div>

        {metrics.personalRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum PR registrado ainda. Continue treinando com carga! 💪
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.personalRecords.map((pr, index) => (
              <div
                key={pr.exercise_name}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{pr.exercise_name}</div>
                    <div className="text-xs text-gray-600">
                      {formatDate(pr.date)} • {pr.reps} reps
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{pr.max_load}kg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Estatísticas Gerais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{metrics.totalExercises}</div>
            <div className="text-sm text-gray-600 mt-1">Total de Exercícios</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {metrics.totalSessions > 0
                ? Math.round(metrics.totalExercises / metrics.totalSessions)
                : 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Exercícios por Treino</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/app/student/today"
          className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-4 rounded-lg font-semibold transition shadow-md"
        >
          🏋️ Treino do Dia
        </Link>
        <Link
          href="/app/student/history"
          className="block bg-gray-600 hover:bg-gray-700 text-white text-center py-4 rounded-lg font-semibold transition shadow-md"
        >
          📊 Ver Histórico
        </Link>
      </div>
    </div>
  );
}
