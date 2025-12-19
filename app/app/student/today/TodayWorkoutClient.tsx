'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutTemplate } from '@/lib/types';

interface Props {
  session: WorkoutSession & { template: WorkoutTemplate };
  exercises: (WorkoutSessionExercise & { exercise: any })[];
}

export function TodayWorkoutClient({ session, exercises: initialExercises }: Props) {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateExercise = (id: string, field: 'sets_done' | 'reps_done' | 'load', value: any) => {
    setExercises(prev =>
      prev.map(ex =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/student/save-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      // Show success feedback
      alert('Progresso salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar progresso');
    } finally {
      setSaving(false);
    }
  };

  const completeWorkout = async () => {
    if (!confirm('Tem certeza que deseja concluir este treino?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/student/complete-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, exercises }),
      });

      if (!response.ok) throw new Error('Failed to complete');

      alert('Treino concluído! Parabéns! 💪');
      router.refresh();
    } catch (error) {
      alert('Erro ao concluir treino');
    } finally {
      setLoading(false);
    }
  };

  const copyLastSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/copy-last-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (!response.ok) throw new Error('Failed to copy');

      const data = await response.json();
      if (data.exercises) {
        setExercises(data.exercises);
        alert('Dados da última sessão copiados!');
      }
    } catch (error) {
      alert('Nenhuma sessão anterior encontrada');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = session.status === 'done';
  const todayDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {session.template?.name || 'Treino do Dia'}
            </h2>
            <p className="text-sm text-gray-600 capitalize">{todayDate}</p>
            {session.template?.notes && (
              <p className="text-sm text-gray-600 mt-2">{session.template.notes}</p>
            )}
          </div>
          {isCompleted && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
              Concluído ✓
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!isCompleted && (
        <div className="flex gap-2">
          <button
            onClick={copyLastSession}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            📋 Copiar última sessão
          </button>
          <button
            onClick={saveProgress}
            disabled={saving}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            {saving ? '💾 Salvando...' : '💾 Salvar progresso'}
          </button>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">{ex.exercise.name}</h3>
              {ex.exercise.muscle_group && (
                <p className="text-xs text-gray-500">{ex.exercise.muscle_group}</p>
              )}
            </div>

            {isCompleted ? (
              <div className="bg-gray-50 rounded p-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Séries:</span>
                    <span className="ml-2 font-semibold">{ex.sets_done}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reps:</span>
                    <span className="ml-2 font-semibold">{ex.reps_done || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carga:</span>
                    <span className="ml-2 font-semibold">
                      {ex.load ? `${ex.load}kg` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Séries</label>
                  <input
                    type="number"
                    value={ex.sets_done}
                    onChange={(e) => updateExercise(ex.id, 'sets_done', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Reps</label>
                  <input
                    type="text"
                    value={ex.reps_done}
                    onChange={(e) => updateExercise(ex.id, 'reps_done', e.target.value)}
                    placeholder="10/10/8"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Carga (kg)</label>
                  <input
                    type="number"
                    value={ex.load || ''}
                    onChange={(e) => updateExercise(ex.id, 'load', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="20"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Complete Button */}
      {!isCompleted && exercises.length > 0 && (
        <button
          onClick={completeWorkout}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Concluindo...' : '✓ Concluir Treino'}
        </button>
      )}
    </div>
  );
}
