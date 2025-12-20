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

    const thisMonthSessions = sessions.filter((s) => {
      const date = new Date(s.session_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const last28DaysSessions = sessions.filter(
      (s) => new Date(s.session_date) >= twentyEightDaysAgo
    );

    const totalSessions = sessions.length;
    const totalExercises = sessions.reduce(
      (sum, s) => sum + s.workout_session_exercises.length,
      0
    );

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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <p className="text-gray-500 text-sm mb-2">
          {greeting}!
        </p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{studentName}</h1>
        <p className="text-gray-600 text-sm">
          Continue focado e alcance seus objetivos!
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.thisMonthTotal}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Este Mês</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.last28DaysTotal}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Últimos 28 dias</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalSessions}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Treinos</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {metrics.avgDuration > 0 ? formatDuration(metrics.avgDuration) : '—'}
          </p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duração Média</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Adherence */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Aderência Semanal</h2>
              <p className="text-sm text-gray-500">Últimas 4 semanas</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          
          {metrics.last28DaysTotal === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <p className="text-gray-500">Comece a treinar para ver seu progresso!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.weeklyAdherence.map((week, index) => (
                <div key={week.week}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-700">{week.label}</span>
                    <span className="text-sm font-bold text-primary-600">{week.count} treinos</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-700 ease-out"
                      style={{
                        width: `${(week.count / maxWeeklyCount) * 100}%`,
                        transitionDelay: `${index * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Records */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Personal Records</h2>
              <p className="text-sm text-gray-500">Suas maiores cargas 🏆</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
          </div>

          {metrics.personalRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <p className="text-gray-500">Treine com carga para registrar seus PRs!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.personalRecords.map((pr, index) => (
                <div
                  key={pr.exercise_name}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-warning-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-warning-600' :
                    'bg-gray-500'
                  }`}>
                    {index + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{pr.exercise_name}</p>
                    <p className="text-sm text-gray-500">{formatDate(pr.date)} • {pr.reps}</p>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {pr.max_load}kg
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Charts */}
      <ProgressCharts sessions={sessions} />

      {/* Quick Stats */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-dark-900 mb-4">Estatísticas Gerais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-5 bg-primary-50 rounded-lg border border-primary-100">
            <p className="text-3xl font-bold text-primary-600 mb-1">{metrics.totalExercises}</p>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total de Exercícios</p>
          </div>
          <div className="text-center p-5 bg-success-50 rounded-lg border border-success-100">
            <p className="text-3xl font-bold text-success-600 mb-1">
              {metrics.totalSessions > 0
                ? Math.round(metrics.totalExercises / metrics.totalSessions)
                : 0}
            </p>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Exercícios por Treino</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/app/student/today" className="card-interactive p-5 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-dark-900">Treino do Dia</h3>
              <p className="text-sm text-dark-500">Iniciar agora</p>
            </div>
          </div>
        </Link>

        <Link href="/app/student/history" className="card-interactive p-5 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-500 to-dark-600 flex items-center justify-center text-white shadow-lg shadow-dark-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-dark-900">Ver Histórico</h3>
              <p className="text-sm text-dark-500">Treinos anteriores</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
