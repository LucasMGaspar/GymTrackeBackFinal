'use client';

import { useMemo, useState } from 'react';
import { LoadProgressChart } from './LoadProgressChart';
import type { WorkoutSession, WorkoutSessionExercise } from '@/lib/types';

interface SessionWithExercises extends WorkoutSession {
  workout_session_exercises: WorkoutSessionExercise[];
}

interface Props {
  sessions: SessionWithExercises[];
  className?: string;
}

export function ProgressCharts({ sessions, className = '' }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { exerciseData, exerciseList } = useMemo(() => {
    const dataMap = new Map<string, { name: string; points: { date: string; load: number }[] }>();

    sessions.forEach((session) => {
      session.workout_session_exercises.forEach((ex: any) => {
        if (ex.actual_load && ex.actual_load > 0) {
          const exerciseName = ex.exercise?.name || 'Exercício Desconhecido';
          
          if (!dataMap.has(exerciseName)) {
            dataMap.set(exerciseName, { name: exerciseName, points: [] });
          }

          dataMap.get(exerciseName)!.points.push({
            date: session.session_date,
            load: ex.actual_load,
          });
        }
      });
    });

    // Sort points by date for each exercise
    dataMap.forEach((data) => {
      data.points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const list = Array.from(dataMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.points.length,
        lastLoad: data.points[data.points.length - 1].load,
        trend: data.points.length > 1
          ? ((data.points[data.points.length - 1].load - data.points[0].load) / data.points[0].load) * 100
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { exerciseData: dataMap, exerciseList: list };
  }, [sessions]);

  if (exerciseList.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center ${className}`}>
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-gray-600 mb-1">Nenhum dado de progresso ainda</p>
        <p className="text-xs text-gray-500">Complete treinos com carga registrada para ver gráficos</p>
      </div>
    );
  }

  const displayedExercises = selectedExercise
    ? exerciseList.filter(e => e.name === selectedExercise)
    : exerciseList.slice(0, 6);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Evolução de Carga
          <span className="text-sm text-gray-500">({exerciseList.length} exercícios)</span>
        </h3>
        {selectedExercise && (
          <button
            onClick={() => setSelectedExercise(null)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ← Ver todos
          </button>
        )}
      </div>

      {/* Exercise Filter */}
      {!selectedExercise && exerciseList.length > 6 && (
        <div className="mb-4">
          <select
            value={selectedExercise || ''}
            onChange={(e) => setSelectedExercise(e.target.value || null)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Top 6 exercícios</option>
            {exerciseList.map((ex) => (
              <option key={ex.name} value={ex.name}>
                {ex.name} ({ex.count} sessões)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedExercises.map((exercise) => (
          <LoadProgressChart
            key={exercise.name}
            exerciseName={exercise.name}
            data={exerciseData.get(exercise.name)!.points}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-700">
              {exerciseList.filter(e => e.trend > 0).length}
            </div>
            <div className="text-xs text-indigo-600 font-semibold">Em evolução ↗</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">
              {exerciseList.filter(e => Math.abs(e.trend) < 5).length}
            </div>
            <div className="text-xs text-indigo-600 font-semibold">Estáveis →</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">
              {exerciseList.filter(e => e.trend < -5).length}
            </div>
            <div className="text-xs text-indigo-600 font-semibold">Em declínio ↘</div>
          </div>
        </div>
      </div>
    </div>
  );
}
