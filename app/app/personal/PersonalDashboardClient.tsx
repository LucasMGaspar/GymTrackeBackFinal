'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { Student, WorkoutSession, WorkoutSessionExercise } from '@/lib/types';

interface SessionWithExercises extends WorkoutSession {
  workout_session_exercises: WorkoutSessionExercise[];
}

interface Props {
  students: Student[];
  exercisesCount: number;
  recentSessions: SessionWithExercises[];
}

export function PersonalDashboardClient({ students, exercisesCount, recentSessions }: Props) {
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const activeStudents = students.filter((s) => s.status !== 'inactive');

    const thisMonthSessions = recentSessions.filter((s) => {
      const date = new Date(s.session_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const weeklyActivity = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekSessions = recentSessions.filter((s) => {
        const date = new Date(s.session_date);
        return date >= weekStart && date < weekEnd;
      });

      weeklyActivity.push({
        week: `S${4 - i}`,
        count: weekSessions.length,
        label: `Semana ${4 - i}`,
      });
    }

    const studentSessionCounts = new Map<string, { name: string; count: number }>();
    
    recentSessions.forEach((session) => {
      const student = students.find((s) => s.id === session.student_id);
      if (student) {
        const current = studentSessionCounts.get(student.id);
        if (current) {
          current.count++;
        } else {
          studentSessionCounts.set(student.id, {
            name: student.student_name,
            count: 1,
          });
        }
      }
    });

    const topStudents = Array.from(studentSessionCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      exercisesCount,
      thisMonthTotal: thisMonthSessions.length,
      last30DaysTotal: recentSessions.length,
      weeklyActivity,
      topStudents,
    };
  }, [students, exercisesCount, recentSessions]);

  const maxWeeklyCount = Math.max(...metrics.weeklyActivity.map((w) => w.count), 1);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 p-6 md:p-8 text-white">
        <div className="absolute inset-0 stat-pattern" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent-500/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <p className="text-primary-100 font-medium mb-1">{greeting}! 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard do Personal</h1>
          <p className="text-primary-100 text-sm md:text-base">
            Acompanhe o progresso dos seus alunos e gerencie seus treinos
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 group hover:shadow-elevated transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-dark-900">{metrics.totalStudents}</p>
          <p className="text-sm text-dark-500 mt-1">Total de Alunos</p>
          <p className="text-xs text-success-600 font-medium mt-2">{metrics.activeStudents} ativos</p>
        </div>

        <div className="card p-5 group hover:shadow-elevated transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-dark-900">{metrics.exercisesCount}</p>
          <p className="text-sm text-dark-500 mt-1">Exercícios</p>
          <p className="text-xs text-dark-400 font-medium mt-2">na biblioteca</p>
        </div>

        <div className="card p-5 group hover:shadow-elevated transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-dark-900">{metrics.thisMonthTotal}</p>
          <p className="text-sm text-dark-500 mt-1">Este Mês</p>
          <p className="text-xs text-dark-400 font-medium mt-2">treinos realizados</p>
        </div>

        <div className="card p-5 group hover:shadow-elevated transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-dark-900">{metrics.last30DaysTotal}</p>
          <p className="text-sm text-dark-500 mt-1">Últimos 30 dias</p>
          <p className="text-xs text-dark-400 font-medium mt-2">treinos completos</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">Atividade Semanal</h2>
              <p className="text-sm text-dark-500">Últimas 4 semanas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          
          {metrics.last30DaysTotal === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-dark-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <p className="text-dark-500">Nenhum treino nos últimos 30 dias</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.weeklyActivity.map((week, index) => (
                <div key={week.week} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-700">{week.label}</span>
                    <span className="text-sm font-bold text-primary-600">{week.count} treinos</span>
                  </div>
                  <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700 ease-out"
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

        {/* Top Students */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">Top Alunos</h2>
              <p className="text-sm text-dark-500">Mais ativos nos últimos 30 dias</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
          </div>

          {metrics.topStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-dark-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-dark-500">Nenhum aluno com treinos recentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topStudents.map((student, index) => (
                <div
                  key={student.name}
                  className="flex items-center gap-4 p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-gradient-to-br from-warning-400 to-warning-500' :
                    index === 1 ? 'bg-gradient-to-br from-dark-300 to-dark-400' :
                    index === 2 ? 'bg-gradient-to-br from-warning-600 to-warning-700' :
                    'bg-gradient-to-br from-primary-400 to-primary-500'
                  }`}>
                    {index + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark-900 truncate">{student.name}</p>
                    <p className="text-sm text-dark-500">{student.count} treinos</p>
                  </div>
                  <div className="text-2xl font-bold text-success-600">
                    {student.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/app/personal/students"
          className="card-interactive p-6 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-dark-900">Gerenciar Alunos</h3>
                <span className="badge-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                  Ativo
                </span>
              </div>
              <p className="text-dark-500 text-sm">
                Adicione alunos, crie templates de treino e acompanhe o progresso
              </p>
            </div>
            <svg className="w-5 h-5 text-dark-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>

        <Link
          href="/app/personal/exercises"
          className="card-interactive p-6 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center text-white shadow-lg shadow-success-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-dark-900">Biblioteca de Exercícios</h3>
                <span className="badge-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                  Ativo
                </span>
              </div>
              <p className="text-dark-500 text-sm">
                Crie e organize sua biblioteca de exercícios personalizados
              </p>
            </div>
            <svg className="w-5 h-5 text-dark-400 group-hover:text-success-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
