'use client';

import { useState, useEffect } from 'react';
import type { Goal, Student, Exercise } from '@/lib/types';
import { X, Loader2, Target } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Props {
  student: Student;
  goal: Goal | null;
  exercises?: Exercise[];
  onClose: () => void;
  onSave: () => void;
}

const goalTypeOptions = [
  { value: 'weight_loss', label: 'Perder Peso', icon: '📉', unit: 'kg' },
  { value: 'weight_gain', label: 'Ganhar Peso', icon: '📈', unit: 'kg' },
  { value: 'muscle_gain', label: 'Ganhar Massa Muscular', icon: '💪', unit: 'kg' },
  { value: 'fat_loss', label: 'Reduzir Gordura Corporal', icon: '🔥', unit: '%' },
  { value: 'circumference_reduction', label: 'Reduzir Circunferência', icon: '📏', unit: 'cm' },
  { value: 'circumference_increase', label: 'Aumentar Circunferência', icon: '📏', unit: 'cm' },
  { value: 'load_increase', label: 'Aumentar Carga', icon: '⚡', unit: 'kg' },
  { value: 'workout_frequency', label: 'Frequência de Treinos', icon: '📅', unit: 'treinos' },
];

const circumferenceOptions = [
  { value: 'chest', label: 'Peito' },
  { value: 'waist', label: 'Cintura' },
  { value: 'hip', label: 'Quadril' },
  { value: 'arm', label: 'Braço' },
  { value: 'thigh', label: 'Coxa' },
  { value: 'calf', label: 'Panturrilha' },
];

export function GoalModal({ student, goal, exercises = [], onClose, onSave }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Form state
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [goalType, setGoalType] = useState<Goal['goal_type']>(
    goal?.goal_type || 'weight_loss'
  );
  const [targetValue, setTargetValue] = useState<string>(
    goal?.target_value?.toString() || ''
  );
  const [initialValue, setInitialValue] = useState<string>(
    goal?.initial_value?.toString() || ''
  );
  const [exerciseId, setExerciseId] = useState<string>(
    goal?.exercise_id || ''
  );
  const [circumferenceType, setCircumferenceType] = useState<Goal['circumference_type']>(
    goal?.circumference_type || null
  );
  const [startDate, setStartDate] = useState(
    goal?.start_date || new Date().toISOString().split('T')[0]
  );
  const [targetDate, setTargetDate] = useState(
    goal?.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [exercisesList, setExercisesList] = useState<Exercise[]>(exercises);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load exercises if not provided and goal type is load_increase
  useEffect(() => {
    if (goalType === 'load_increase' && exercisesList.length === 0 && !loadingExercises) {
      loadExercises();
    }
  }, [goalType]);

  const loadExercises = async () => {
    setLoadingExercises(true);
    try {
      const response = await fetch('/api/personal/exercises');
      const data = await response.json();
      if (response.ok) {
        setExercisesList(data.exercises || []);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const selectedGoalType = goalTypeOptions.find((opt) => opt.value === goalType);
  const requiresExercise = goalType === 'load_increase';
  const requiresCircumference =
    goalType === 'circumference_reduction' || goalType === 'circumference_increase';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!title.trim()) {
      setErrors({ title: 'Título é obrigatório' });
      return;
    }

    if (!targetValue || parseFloat(targetValue) <= 0) {
      setErrors({ targetValue: 'Valor alvo deve ser positivo' });
      return;
    }

    if (requiresExercise && !exerciseId) {
      setErrors({ exerciseId: 'Exercício é obrigatório para metas de carga' });
      return;
    }

    if (requiresCircumference && !circumferenceType) {
      setErrors({ circumferenceType: 'Tipo de circunferência é obrigatório' });
      return;
    }

    const start = new Date(startDate);
    const target = new Date(targetDate);
    if (target <= start) {
      setErrors({ targetDate: 'Data alvo deve ser posterior à data inicial' });
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        student_id: student.id,
        title: title.trim(),
        description: description.trim() || null,
        goal_type: goalType,
        target_value: parseFloat(targetValue),
        start_date: startDate,
        target_date: targetDate,
      };

      if (initialValue) {
        data.initial_value = parseFloat(initialValue);
      }

      if (requiresExercise) {
        data.exercise_id = exerciseId;
        const exercise = exercisesList.find((e) => e.id === exerciseId);
        if (exercise) {
          data.exercise_name = exercise.name;
        }
      }

      if (requiresCircumference) {
        data.circumference_type = circumferenceType;
      }

      const method = goal ? 'PATCH' : 'POST';
      const url = '/api/goals';

      const body = goal
        ? {
            id: goal.id,
            ...data,
          }
        : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save goal');
      }

      showToast(
        goal ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!',
        'success'
      );
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      showToast(error.message || 'Erro ao salvar meta', 'error');
      setErrors({ general: error.message || 'Erro ao salvar meta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {goal ? 'Editar Meta' : 'Nova Meta'}
              </h2>
              <p className="text-sm text-white/90">{student.student_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Meta *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Perder 5kg em 3 meses"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Adicione detalhes sobre a meta..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Goal Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Meta *
            </label>
            <select
              value={goalType}
              onChange={(e) => {
                setGoalType(e.target.value as Goal['goal_type']);
                setExerciseId('');
                setCircumferenceType(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              {goalTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise Selection (for load_increase) */}
          {requiresExercise && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exercício *
              </label>
              {loadingExercises ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Carregando exercícios...</span>
                </div>
              ) : (
                <select
                  value={exerciseId}
                  onChange={(e) => setExerciseId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading || exercisesList.length === 0}
                >
                  <option value="">
                    {exercisesList.length === 0
                      ? 'Nenhum exercício cadastrado'
                      : 'Selecione um exercício'}
                  </option>
                  {exercisesList.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                      {exercise.muscle_group ? ` (${exercise.muscle_group})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.exerciseId && (
                <p className="text-sm text-red-600 mt-1">{errors.exerciseId}</p>
              )}
            </div>
          )}

          {/* Circumference Type (for circumference goals) */}
          {requiresCircumference && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Circunferência *
              </label>
              <select
                value={circumferenceType || ''}
                onChange={(e) =>
                  setCircumferenceType(e.target.value as Goal['circumference_type'])
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Selecione...</option>
                {circumferenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.circumferenceType && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.circumferenceType}
                </p>
              )}
            </div>
          )}

          {/* Values */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Inicial ({selectedGoalType?.unit}) (opcional)
              </label>
              <input
                type="number"
                step={goalType === 'fat_loss' ? '0.1' : '0.01'}
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
                placeholder="Deixe vazio para usar última avaliação"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Se vazio, será usado o valor da última avaliação física
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Alvo ({selectedGoalType?.unit}) *
              </label>
              <input
                type="number"
                step={goalType === 'fat_loss' || goalType === 'workout_frequency' ? '0.1' : '0.01'}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex: 75"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              {errors.targetValue && (
                <p className="text-sm text-red-600 mt-1">{errors.targetValue}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Alvo *
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              {errors.targetDate && (
                <p className="text-sm text-red-600 mt-1">{errors.targetDate}</p>
              )}
            </div>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.general}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              goal ? 'Atualizar Meta' : 'Criar Meta'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

