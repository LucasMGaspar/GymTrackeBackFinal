'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
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
  const { showToast } = useToast();
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
      showToast('Exercício deletado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao deletar exercício', 'error');
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
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Exercício
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
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                filter === group
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-200"
            >
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4">
                <h3 className="font-bold text-white text-lg truncate">{exercise.name}</h3>
                {exercise.muscle_group && (
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 text-white opacity-90 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm text-white opacity-90 font-medium">
                      {exercise.muscle_group}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                {exercise.notes ? (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{exercise.notes}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">Sem observações</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(exercise)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(exercise)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
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
