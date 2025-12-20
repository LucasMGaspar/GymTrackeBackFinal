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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {template ? 'Editar Template' : 'Novo Template'}
            </h2>
            <p className="text-sm text-white/90 mt-0.5">{WEEKDAY_LABELS[weekday]}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
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
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none transition-colors hover:border-gray-300"
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
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1.5 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                disabled={loading}
              >
                {showExercisePicker ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Fechar
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Exercício
                  </>
                )}
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
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-gray-500 mb-2">Nenhum exercício adicionado</p>
                <p className="text-xs text-gray-400">Clique em "Adicionar Exercício" acima</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templateExercises.map((te, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-200 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="font-semibold text-gray-900">{te.exercise_name}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || loading}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover para cima"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === templateExercises.length - 1 || loading}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover para baixo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={loading}
                          title="Remover"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Séries Alvo</label>
                        <input
                          type="number"
                          value={te.target_sets}
                          onChange={(e) =>
                            updateExercise(index, 'target_sets', parseInt(e.target.value) || 0)
                          }
                          min="1"
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors hover:border-gray-300"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reps Alvo</label>
                        <input
                          type="text"
                          value={te.target_reps}
                          onChange={(e) => updateExercise(index, 'target_reps', e.target.value)}
                          placeholder="10 ou 12/10/8"
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors hover:border-gray-300"
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
          <div className="flex gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
