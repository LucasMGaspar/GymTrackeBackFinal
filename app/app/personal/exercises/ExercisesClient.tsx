'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Exercise } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseModal } from './ExerciseModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface Props {
  initialExercises: Exercise[];
  personalId: string;
}

const MUSCLE_GROUPS = [
  'Todos',
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Outro',
];

export function ExercisesClient({ initialExercises, personalId }: Props) {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  const filteredExercises = exercises.filter((ex) => {
    const matchesFilter = filter === 'Todos' || ex.muscle_group === filter;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreate = () => {
    setEditingExercise(null);
    setModalOpen(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setModalOpen(true);
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setDeletingExercise(exercise);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingExercise) return;

    try {
      const response = await fetch('/api/personal/exercises', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingExercise.id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setExercises(exercises.filter((ex) => ex.id !== deletingExercise.id));
      setDeleteModalOpen(false);
      setDeletingExercise(null);
    } catch (error) {
      alert('Erro ao deletar exercício');
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>
          <p className="text-gray-600 text-sm mt-1">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} cadastrado{exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Novo Exercício
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="🔍 Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Muscle Group Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              onClick={() => setFilter(group)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === group
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredExercises.length === 0 ? (
        exercises.length === 0 ? (
          <EmptyState
            title="Nenhum exercício cadastrado"
            description="Comece criando exercícios para sua biblioteca. Você poderá usá-los nos treinos dos seus alunos."
            action={{
              label: '+ Criar Primeiro Exercício',
              onClick: handleCreate,
            }}
          />
        ) : (
          <EmptyState
            title="Nenhum exercício encontrado"
            description="Tente ajustar os filtros ou busca."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                  {exercise.muscle_group && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {exercise.muscle_group}
                    </span>
                  )}
                </div>
              </div>

              {exercise.notes && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {exercise.notes}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(exercise)}
                  className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(exercise)}
                  className="flex-1 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <ExerciseModal
          personalId={personalId}
          exercise={editingExercise}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteModalOpen && deletingExercise && (
        <DeleteConfirmModal
          title="Deletar Exercício"
          message={`Tem certeza que deseja deletar "${deletingExercise.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeletingExercise(null);
          }}
        />
      )}
    </div>
  );
}
