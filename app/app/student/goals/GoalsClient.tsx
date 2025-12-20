'use client';

import { useState } from 'react';
import type { Goal, Student, Exercise } from '@/lib/types';
import { GoalCard } from '@/components/GoalCard';
import { EmptyState } from '@/components/EmptyState';
import { Target } from 'lucide-react';

interface Props {
  student: Student;
  initialGoals: Goal[];
  exercises: Exercise[];
  isPersonalView: boolean;
}

export function GoalsClient({
  student,
  initialGoals,
  exercises,
  isPersonalView,
}: Props) {
  const [goals] = useState<Goal[]>(initialGoals);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const otherGoals = goals.filter(
    (g) => g.status !== 'active' && g.status !== 'completed'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Minhas Metas</h1>
          <p className="text-gray-600">
            Acompanhe seu progresso e alcance seus objetivos
          </p>
        </div>

        {/* Stats */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeGoals.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Ativas</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedGoals.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Concluídas</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {activeGoals.length > 0
                  ? Math.round(
                      (activeGoals.reduce(
                        (sum, g) => sum + (g.progress_percentage || 0),
                        0
                      ) /
                        activeGoals.length) *
                        100
                    ) / 100
                  : 0}
                %
              </div>
              <div className="text-xs text-gray-600 mt-1">Progresso Médio</div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nenhuma meta definida"
            description="Seu personal trainer ainda não definiu metas para você. Entre em contato com ele para estabelecer seus objetivos!"
          />
        ) : (
          <div className="space-y-6">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Metas Ativas ({activeGoals.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Metas Concluídas ({completedGoals.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Goals */}
            {otherGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Outras ({otherGoals.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

