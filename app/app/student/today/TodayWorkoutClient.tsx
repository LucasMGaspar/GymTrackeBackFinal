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

  const updateExercise = (id: string, field: 'actual_sets' | 'actual_reps' | 'actual_load', value: any) => {
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

  const isCompleted = session.status === 'completed';
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
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition text-sm font-semibold disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar Última
          </button>
          <button
            onClick={saveProgress}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 px-4 rounded-xl transition text-sm font-semibold disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises.map((ex, index) => (
          <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{ex.exercise.name}</h3>
                    {ex.exercise.muscle_group && (
                      <p className="text-xs text-white opacity-90">{ex.exercise.muscle_group}</p>
                    )}
                  </div>
                </div>
                {isCompleted && (
                  <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <span className="text-white text-xs font-semibold">✓ Completo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              {isCompleted ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-xs text-indigo-600 font-semibold mb-1">Séries</div>
                    <div className="text-2xl font-bold text-indigo-700">{ex.actual_sets}</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 font-semibold mb-1">Reps</div>
                    <div className="text-lg font-bold text-purple-700">{ex.actual_reps || '-'}</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 font-semibold mb-1">Carga</div>
                    <div className="text-lg font-bold text-green-700">
                      {ex.actual_load ? `${ex.actual_load}kg` : '-'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Séries</label>
                    <input
                      type="number"
                      value={ex.actual_sets}
                      onChange={(e) => updateExercise(ex.id, 'actual_sets', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center font-semibold text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Reps</label>
                    <input
                      type="text"
                      value={ex.actual_reps}
                      onChange={(e) => updateExercise(ex.id, 'actual_reps', e.target.value)}
                      placeholder="10/10/8"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Carga (kg)</label>
                    <input
                      type="number"
                      value={ex.actual_load || ''}
                      onChange={(e) => updateExercise(ex.id, 'actual_load', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="20"
                      step="0.5"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center font-semibold text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Complete Button */}
      {!isCompleted && exercises.length > 0 && (
        <button
          onClick={completeWorkout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {loading ? 'Concluindo...' : 'Concluir Treino'}
        </button>
      )}
    </div>
  );
}
