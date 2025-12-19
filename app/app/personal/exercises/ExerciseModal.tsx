'use client';

import { useState, useEffect } from 'react';
import type { Exercise } from '@/lib/types';
import { z } from 'zod';

interface Props {
  personalId: string;
  exercise: Exercise | null;
  onClose: () => void;
  onSave: () => void;
}

const ExerciseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  muscle_group: z.string().optional(),
  notes: z.string().optional(),
});

const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Outro',
];

export function ExerciseModal({ personalId, exercise, onClose, onSave }: Props) {
  const [name, setName] = useState(exercise?.name || '');
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscle_group || '');
  const [notes, setNotes] = useState(exercise?.notes || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Lock scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = ExerciseSchema.safeParse({
      name: name.trim(),
      muscle_group: muscleGroup || null,
      notes: notes.trim() || null,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const method = exercise ? 'PUT' : 'POST';
      const body = exercise
        ? { id: exercise.id, ...result.data }
        : { personal_id: personalId, ...result.data };

      const response = await fetch('/api/personal/exercises', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      onSave();
    } catch (error: any) {
      // Inline error display - no toast needed as modal shows errors
      setErrors({ general: error.message || 'Erro ao salvar exercício' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {exercise ? 'Editar Exercício' : 'Novo Exercício'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Exercício *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Reto"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Muscle Group */}
          <div>
            <label htmlFor="muscleGroup" className="block text-sm font-medium text-gray-700 mb-2">
              Grupo Muscular
            </label>
            <select
              id="muscleGroup"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            >
              <option value="">Selecione...</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Executar com amplitude completa, controlar a descida..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
