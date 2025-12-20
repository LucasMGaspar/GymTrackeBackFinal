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
  { key: 'Todos', icon: '💪', color: 'primary' },
  { key: 'Peito', icon: '🫁', color: 'danger' },
  { key: 'Costas', icon: '🔙', color: 'accent' },
  { key: 'Pernas', icon: '🦵', color: 'success' },
  { key: 'Ombros', icon: '🎯', color: 'warning' },
  { key: 'Bíceps', icon: '💪', color: 'primary' },
  { key: 'Tríceps', icon: '🔱', color: 'accent' },
  { key: 'Abdômen', icon: '🎽', color: 'success' },
  { key: 'Outro', icon: '⚡', color: 'dark' },
];

const muscleGroupColors: Record<string, string> = {
  'Peito': 'from-danger-500 to-danger-600',
  'Costas': 'from-accent-500 to-accent-600',
  'Pernas': 'from-success-500 to-success-600',
  'Ombros': 'from-warning-500 to-warning-600',
  'Bíceps': 'from-primary-500 to-primary-600',
  'Tríceps': 'from-accent-500 to-accent-600',
  'Abdômen': 'from-success-500 to-success-600',
  'Outro': 'from-dark-500 to-dark-600',
};

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

  // Group exercises by muscle group for display
  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    const group = ex.muscle_group || 'Outro';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, Exercise[]>);

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

  const muscleGroupCounts = MUSCLE_GROUPS.map(group => ({
    ...group,
    count: group.key === 'Todos' 
      ? exercises.length 
      : exercises.filter(e => e.muscle_group === group.key).length
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Biblioteca de Exercícios</h1>
          <p className="text-dark-500 text-sm mt-1">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} na sua biblioteca
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Exercício
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {muscleGroupCounts.slice(1, 5).map((group) => (
          <button
            key={group.key}
            onClick={() => setFilter(group.key)}
            className={`card p-4 text-left hover:shadow-elevated transition-all ${
              filter === group.key ? 'ring-2 ring-primary-500 shadow-elevated' : ''
            }`}
          >
            <div className="text-2xl mb-2">{group.icon}</div>
            <p className="text-2xl font-bold text-dark-900">{group.count}</p>
            <p className="text-sm text-dark-500">{group.key}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>

        {/* Muscle Group Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MUSCLE_GROUPS.map((group) => {
            const count = group.key === 'Todos' 
              ? exercises.length 
              : exercises.filter(e => e.muscle_group === group.key).length;
            
            return (
              <button
                key={group.key}
                onClick={() => setFilter(group.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === group.key
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                }`}
              >
                <span>{group.icon}</span>
                <span>{group.key}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-2xs ${
                  filter === group.key ? 'bg-white/20' : 'bg-dark-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {filteredExercises.length === 0 ? (
        exercises.length === 0 ? (
          <EmptyState
            icon="workout"
            title="Nenhum exercício cadastrado"
            description="Comece criando exercícios para sua biblioteca. Você poderá usá-los nos treinos dos seus alunos."
            action={{
              label: 'Criar Primeiro Exercício',
              onClick: handleCreate,
            }}
          />
        ) : (
          <EmptyState
            icon="search"
            title="Nenhum exercício encontrado"
            description="Tente ajustar os filtros ou termo de busca."
          />
        )
      ) : filter === 'Todos' ? (
        // Grouped view
        <div className="space-y-8">
          {Object.entries(groupedExercises).map(([group, exs]) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${muscleGroupColors[group] || 'from-dark-500 to-dark-600'} flex items-center justify-center text-white`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-dark-900">{group}</h2>
                  <p className="text-sm text-dark-500">{exs.length} exercício{exs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {exs.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat view
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
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

function ExerciseCard({ 
  exercise, 
  onEdit, 
  onDelete 
}: { 
  exercise: Exercise; 
  onEdit: (e: Exercise) => void; 
  onDelete: (e: Exercise) => void;
}) {
  const gradient = muscleGroupColors[exercise.muscle_group || 'Outro'] || 'from-primary-500 to-primary-600';
  
  return (
    <div className="card overflow-hidden group hover:shadow-elevated transition-all duration-300">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-5`}>
        <h3 className="font-bold text-white text-lg truncate">{exercise.name}</h3>
        {exercise.muscle_group && (
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white">
              {exercise.muscle_group}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {exercise.notes ? (
          <p className="text-sm text-dark-600 line-clamp-2 mb-4">{exercise.notes}</p>
        ) : (
          <p className="text-sm text-dark-400 italic mb-4">Sem observações</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(exercise)}
            className="btn-secondary flex-1 py-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => onDelete(exercise)}
            className="btn-ghost p-2 text-danger-600 hover:bg-danger-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
