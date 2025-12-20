'use client';

import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Target, TrendingUp, TrendingDown, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Goal } from '@/lib/types';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  showActions?: boolean;
}

const goalTypeLabels: Record<Goal['goal_type'], { label: string; icon: string; unit: string }> = {
  weight_loss: { label: 'Perder Peso', icon: '📉', unit: 'kg' },
  weight_gain: { label: 'Ganhar Peso', icon: '📈', unit: 'kg' },
  muscle_gain: { label: 'Ganhar Massa Muscular', icon: '💪', unit: 'kg' },
  fat_loss: { label: 'Reduzir Gordura Corporal', icon: '🔥', unit: '%' },
  circumference_reduction: { label: 'Reduzir Circunferência', icon: '📏', unit: 'cm' },
  circumference_increase: { label: 'Aumentar Circunferência', icon: '📏', unit: 'cm' },
  load_increase: { label: 'Aumentar Carga', icon: '⚡', unit: 'kg' },
  workout_frequency: { label: 'Frequência de Treinos', icon: '📅', unit: 'treinos' },
};

const circumferenceLabels: Record<string, string> = {
  chest: 'Peito',
  waist: 'Cintura',
  hip: 'Quadril',
  arm: 'Braço',
  thigh: 'Coxa',
  calf: 'Panturrilha',
};

export function GoalCard({ goal, onEdit, onDelete, showActions = false }: GoalCardProps) {
  const goalInfo = goalTypeLabels[goal.goal_type];
  const progress = Math.min(100, Math.max(0, goal.progress_percentage || 0));
  const targetDate = new Date(goal.target_date);
  const daysRemaining = differenceInDays(targetDate, new Date());
  const isOverdue = isPast(targetDate) && goal.status === 'active';
  const isCompleted = goal.status === 'completed';

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (isOverdue) return <XCircle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-blue-600" />;
  };

  const formatValue = (value: number | null | undefined, unit: string) => {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(goal.goal_type === 'fat_loss' ? 1 : 2)} ${unit}`;
  };

  const getTargetDescription = () => {
    const current = formatValue(goal.current_value, goalInfo.unit);
    const target = formatValue(goal.target_value, goalInfo.unit);
    const initial = formatValue(goal.initial_value, goalInfo.unit);

    if (goal.goal_type === 'load_increase' && goal.exercise_name) {
      return `De ${initial} para ${target} no ${goal.exercise_name}`;
    }

    if (goal.goal_type === 'circumference_reduction' || goal.goal_type === 'circumference_increase') {
      const circLabel = goal.circumference_type ? circumferenceLabels[goal.circumference_type] : '';
      return `${circLabel}: De ${initial} para ${target}`;
    }

    if (goal.goal_type === 'workout_frequency') {
      return `Alcançar ${target} no mês`;
    }

    return `De ${initial} para ${target}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl">{goalInfo.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{goal.title}</h3>
            <p className="text-sm text-gray-600">{goalInfo.label}</p>
            {goal.description && (
              <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
            )}
          </div>
        </div>
        {getStatusIcon()}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Progresso</span>
          <span className="text-sm font-bold text-primary-600">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-500 mb-1">Inicial</div>
          <div className="text-sm font-bold text-gray-700">
            {formatValue(goal.initial_value, goalInfo.unit)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Atual</div>
          <div className="text-sm font-bold text-primary-600">
            {formatValue(goal.current_value, goalInfo.unit)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Meta</div>
          <div className="text-sm font-bold text-green-600">
            {formatValue(goal.target_value, goalInfo.unit)}
          </div>
        </div>
      </div>

      {/* Target Description */}
      <div className="text-sm text-gray-600 mb-4">
        {getTargetDescription()}
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>Início: {format(new Date(goal.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          <span>Meta: {format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
      </div>

      {/* Days Remaining / Status */}
      <div className="flex items-center justify-between">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Meta Atingida!</span>
            {goal.completed_at && (
              <span className="text-xs">
                em {format(new Date(goal.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            )}
          </div>
        ) : isOverdue ? (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Prazo Vencido</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo final hoje'}
            </span>
          </div>
        )}

        {showActions && onEdit && onDelete && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(goal)}
              className="px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(goal)}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Deletar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

