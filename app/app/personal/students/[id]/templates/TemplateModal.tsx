'use client';

import { useState, useEffect } from 'react';
import type { WorkoutTemplate, Exercise, WorkoutTemplateExercise } from '@/lib/types';
import { z } from 'zod';

interface TemplateWithExercises extends WorkoutTemplate {
  workout_template_exercises: (WorkoutTemplateExercise & { exercise: Exercise })[];
}

interface Props {
  studentId: string;
  weekday: number;
  template: TemplateWithExercises | null;
  exercises: Exercise[];
  onClose: () => void;
  onSave: () => void;
}

interface TemplateExerciseForm {
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps: string;
  notes: string;
}

const TemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  notes: z.string().optional(),
});

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function TemplateModal({ studentId, weekday, template, exercises, onClose, onSave }: Props) {
  const [name, setName] = useState(template?.name || '');
  const [notes, setNotes] = useState(template?.notes || '');
  const [templateExercises, setTemplateExercises] = useState<TemplateExerciseForm[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template?.workout_template_exercises) {
      const sortedExercises = [...template.workout_template_exercises].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      setTemplateExercises(
        sortedExercises.map((te) => ({
          exercise_id: te.exercise_id,
          exercise_name: te.exercise.name,
          target_sets: te.target_sets,
          target_reps: te.target_reps,
          notes: te.notes || '',
        }))
      );
    }
  }, [template]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleAddExercise = (exercise: Exercise) => {
    const alreadyAdded = templateExercises.some((te) => te.exercise_id === exercise.id);
    if (alreadyAdded) {
      // Just return silently, the user will see the exercise is already in the list
      return;
    }

    setTemplateExercises([
      ...templateExercises,
      {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        target_sets: 3,
        target_reps: '10',
        notes: '',
      },
    ]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    setTemplateExercises(templateExercises.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newExercises = [...templateExercises];
    [newExercises[index - 1], newExercises[index]] = [
      newExercises[index],
      newExercises[index - 1],
    ];
    setTemplateExercises(newExercises);
  };

  const handleMoveDown = (index: number) => {
    if (index === templateExercises.length - 1) return;
    const newExercises = [...templateExercises];
    [newExercises[index], newExercises[index + 1]] = [
      newExercises[index + 1],
      newExercises[index],
    ];
    setTemplateExercises(newExercises);
  };

  const updateExercise = (index: number, field: keyof TemplateExerciseForm, value: any) => {
    const newExercises = [...templateExercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setTemplateExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = TemplateSchema.safeParse({
      name: name.trim(),
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

    if (templateExercises.length === 0) {
      setErrors({ general: 'Adicione pelo menos um exercício ao template!' });
      return;
    }

    setLoading(true);

    try {
      const method = template ? 'PUT' : 'POST';
      const body = {
        ...(template ? { id: template.id } : { student_id: studentId, weekday }),
        name: result.data.name,
        notes: result.data.notes || null,
        exercises: templateExercises.map((te, index) => ({
          exercise_id: te.exercise_id,
          sort_order: index + 1,
          target_sets: te.target_sets,
          target_reps: te.target_reps,
          notes: te.notes || null,
        })),
      };

      const response = await fetch('/api/personal/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      onSave();
    } catch (error: any) {
      setErrors({ general: error.message || 'Erro ao salvar template' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {template ? 'Editar Template' : 'Novo Template'}
            </h2>
            <p className="text-sm text-gray-600">{WEEKDAY_LABELS[weekday]}</p>
          </div>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Treino *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A - Peito/Bíceps"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
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
              placeholder="Ex: Foco em hipertrofia, descanso de 90s entre séries..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              disabled={loading}
            />
          </div>

          {/* Exercises List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Exercícios ({templateExercises.length})
              </label>
              <button
                type="button"
                onClick={() => setShowExercisePicker(!showExercisePicker)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                disabled={loading}
              >
                {showExercisePicker ? '✕ Fechar' : '+ Adicionar Exercício'}
              </button>
            </div>

            {/* Exercise Picker */}
            {showExercisePicker && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                {exercises.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">
                    Nenhum exercício cadastrado. Cadastre exercícios primeiro!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleAddExercise(exercise)}
                        className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                        disabled={loading}
                      >
                        <div className="font-medium text-sm">{exercise.name}</div>
                        {exercise.muscle_group && (
                          <div className="text-xs text-gray-600">{exercise.muscle_group}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Template Exercises */}
            {templateExercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Nenhum exercício adicionado. Clique em "+ Adicionar Exercício" acima.
              </div>
            ) : (
              <div className="space-y-3">
                {templateExercises.map((te, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{te.exercise_name}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || loading}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === templateExercises.length - 1 || loading}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(index)}
                          className="p-1 text-red-600 hover:text-red-700"
                          disabled={loading}
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Séries Alvo</label>
                        <input
                          type="number"
                          value={te.target_sets}
                          onChange={(e) =>
                            updateExercise(index, 'target_sets', parseInt(e.target.value) || 0)
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Reps Alvo</label>
                        <input
                          type="text"
                          value={te.target_reps}
                          onChange={(e) => updateExercise(index, 'target_reps', e.target.value)}
                          placeholder="10 ou 12/10/8"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
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
              {loading ? 'Salvando...' : 'Salvar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
