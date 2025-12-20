'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Goal, Student, Exercise } from '@/lib/types';
import { GoalCard } from '@/components/GoalCard';
import { GoalModal } from '@/components/GoalModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Target, Plus } from 'lucide-react';

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
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const otherGoals = goals.filter(
    (g) => g.status !== 'active' && g.status !== 'completed'
  );

  const handleCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleDeleteClick = (goal: Goal) => {
    setDeletingGoal(goal);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;

    try {
      const response = await fetch(`/api/goals?id=${deletingGoal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setGoals(goals.filter((g) => g.id !== deletingGoal.id));
      setDeleteModalOpen(false);
      setDeletingGoal(null);
      showToast('Meta deletada com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao deletar meta', 'error');
    }
  };

  const handleSave = async () => {
    // Refetch goals
    try {
      const params = isPersonalView ? `?studentId=${student.id}` : '';
      const response = await fetch(`/api/goals${params}`);
      const data = await response.json();
      if (response.ok) {
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {isPersonalView && (
            <Link
              href="/app/personal/students"
              className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Voltar para Alunos
            </Link>
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Metas - {student.student_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {isPersonalView
                  ? 'Gerencie as metas deste aluno'
                  : 'Acompanhe seu progresso e alcance seus objetivos'}
              </p>
            </div>
            {isPersonalView && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nova Meta
              </button>
            )}
          </div>
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
                {Math.round(
                  (activeGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) /
                    (activeGoals.length || 1)) *
                    100
                ) / 100}
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
            description={
              isPersonalView
                ? 'Crie uma meta para este aluno começar a acompanhar o progresso'
                : 'Seu personal trainer ainda não definiu metas para você'
            }
            action={
              isPersonalView
                ? {
                    label: 'Criar Primeira Meta',
                    onClick: handleCreate,
                  }
                : undefined
            }
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
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={isPersonalView ? handleEdit : undefined}
                      onDelete={isPersonalView ? handleDeleteClick : undefined}
                      showActions={isPersonalView}
                    />
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
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={isPersonalView ? handleEdit : undefined}
                      onDelete={isPersonalView ? handleDeleteClick : undefined}
                      showActions={isPersonalView}
                    />
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
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={isPersonalView ? handleEdit : undefined}
                      onDelete={isPersonalView ? handleDeleteClick : undefined}
                      showActions={isPersonalView}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {modalOpen && (
          <GoalModal
            student={student}
            goal={editingGoal}
            exercises={exercises}
            onClose={() => {
              setModalOpen(false);
              setEditingGoal(null);
            }}
            onSave={handleSave}
          />
        )}

        {deleteModalOpen && deletingGoal && (
          <DeleteConfirmModal
            title="Deletar Meta"
            message={`Tem certeza que deseja deletar a meta "${deletingGoal.title}"? Esta ação não pode ser desfeita.`}
            onConfirm={handleDelete}
            onCancel={() => {
              setDeleteModalOpen(false);
              setDeletingGoal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

