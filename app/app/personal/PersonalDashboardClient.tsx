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

    // Active students (not inactive)
    const activeStudents = students.filter((s) => s.status !== 'inactive');

    // This month sessions
    const thisMonthSessions = recentSessions.filter((s) => {
      const date = new Date(s.session_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    // Weekly activity (last 4 weeks)
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

    // Student activity (top 5 most active)
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

    // Templates count
    const studentsWithData = students.length;

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      exercisesCount,
      thisMonthTotal: thisMonthSessions.length,
      last30DaysTotal: recentSessions.length,
      weeklyActivity,
      topStudents,
      studentsWithData,
    };
  }, [students, exercisesCount, recentSessions]);

  const maxWeeklyCount = Math.max(...metrics.weeklyActivity.map((w) => w.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard do Personal</h1>
        <p className="text-gray-600 text-sm mt-1">
          Visão geral do seu negócio e alunos
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Total de Alunos</div>
          <div className="text-3xl font-bold">{metrics.totalStudents}</div>
          <div className="text-xs opacity-90 mt-1">
            {metrics.activeStudents} ativos
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Exercícios</div>
          <div className="text-3xl font-bold">{metrics.exercisesCount}</div>
          <div className="text-xs opacity-90 mt-1">na biblioteca</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Este Mês</div>
          <div className="text-3xl font-bold">{metrics.thisMonthTotal}</div>
          <div className="text-xs opacity-90 mt-1">treinos</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
          <div className="text-xs opacity-90 mb-1">Últimos 30 Dias</div>
          <div className="text-3xl font-bold">{metrics.last30DaysTotal}</div>
          <div className="text-xs opacity-90 mt-1">treinos</div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Atividade Semanal (Últimas 4 Semanas)
        </h2>
        
        {metrics.last30DaysTotal === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum treino completado nos últimos 30 dias
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.weeklyActivity.map((week) => (
              <div key={week.week}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{week.label}</span>
                  <span className="text-sm font-bold text-purple-600">{week.count} treinos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end px-2"
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

      {/* Top Students */}
      {metrics.topStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Alunos Mais Ativos (Últimos 30 Dias) 🏆
          </h2>
          <div className="space-y-3">
            {metrics.topStudents.map((student, index) => (
              <div
                key={student.name}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-400 to-green-500 rounded-full text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="font-semibold text-gray-900">{student.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{student.count}</div>
                  <div className="text-xs text-gray-600">treinos</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/app/personal/students"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-blue-300"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">👥</div>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              ✓ Disponível
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Alunos</h2>
          <p className="text-gray-600 text-sm">
            Gerenciar alunos, templates e acompanhar progresso
          </p>
        </Link>

        <Link
          href="/app/personal/exercises"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-green-300"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">💪</div>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              ✓ Disponível
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Exercícios</h2>
          <p className="text-gray-600 text-sm">
            Criar e gerenciar biblioteca de exercícios
          </p>
        </Link>
      </div>
    </div>
  );
}
