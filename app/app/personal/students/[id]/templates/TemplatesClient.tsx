'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import type { Student, WorkoutTemplate, Exercise, WorkoutTemplateExercise } from '@/lib/types';
import { TemplateModal } from './TemplateModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface TemplateWithExercises extends WorkoutTemplate {
  workout_template_exercises: (WorkoutTemplateExercise & { exercise: Exercise })[];
}

interface Props {
  student: Student;
  initialTemplates: TemplateWithExercises[];
  exercises: Exercise[];
}

const WEEKDAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export function TemplatesClient({ student, initialTemplates, exercises }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<TemplateWithExercises[]>(initialTemplates);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithExercises | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateWithExercises | null>(null);

  const getTemplateForDay = (weekday: number) => {
    return templates.find((t) => t.weekday === weekday);
  };

  const handleCreateTemplate = (weekday: number) => {
    setSelectedWeekday(weekday);
    setEditingTemplate(null);
    setModalOpen(true);
  };

  const handleEditTemplate = (template: TemplateWithExercises) => {
    setSelectedWeekday(template.weekday);
    setEditingTemplate(template);
    setModalOpen(true);
  };

  const handleDeleteClick = (template: TemplateWithExercises) => {
    setDeletingTemplate(template);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const response = await fetch('/api/personal/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingTemplate.id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setTemplates(templates.filter((t) => t.id !== deletingTemplate.id));
      setDeleteModalOpen(false);
      setDeletingTemplate(null);
      showToast('Template deletado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao deletar template', 'error');
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    router.refresh();
  };

  const totalTemplates = templates.length;
  const totalExercises = templates.reduce(
    (sum, t) => sum + t.workout_template_exercises.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/app/personal/students"
          className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
        >
          ← Voltar para Alunos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Templates de Treino - {student.student_name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {totalTemplates} dia{totalTemplates !== 1 ? 's' : ''} configurado{totalTemplates !== 1 ? 's' : ''} • {totalExercises} exercício{totalExercises !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Info */}
      {totalTemplates === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 Configure os treinos por dia da semana. O aluno verá automaticamente o treino do dia atual.
          </p>
        </div>
      )}

      {/* Weekdays Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {WEEKDAYS.map((day) => {
          const template = getTemplateForDay(day.value);
          const hasTemplate = !!template;

          return (
            <div
              key={day.value}
              className={`bg-white rounded-lg shadow-sm p-4 border-2 transition ${
                hasTemplate
                  ? 'border-green-200 hover:border-green-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-3">
                <div className="text-xs text-gray-500 mb-1">{day.short}</div>
                <div className="font-semibold text-gray-900">{day.label}</div>
              </div>

              {hasTemplate && template ? (
                <>
                  {/* Template Info */}
                  <div className="mb-3 text-center">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {template.workout_template_exercises.length} exercício{template.workout_template_exercises.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 py-1 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(template)}
                      className="w-full text-xs text-red-600 hover:text-red-700 py-1 font-medium"
                    >
                      Deletar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Empty State */}
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-2xl mb-2">—</div>
                    <button
                      onClick={() => handleCreateTemplate(day.value)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Criar Treino
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Template List (Alternative View) */}
      {totalTemplates > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Resumo dos Treinos</h3>
          <div className="space-y-3">
            {templates.map((template) => {
              const day = WEEKDAYS.find((d) => d.value === template.weekday);
              return (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {day?.label} - {template.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {template.workout_template_exercises.length} exercícios
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(template)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && selectedWeekday !== null && (
        <TemplateModal
          studentId={student.id}
          weekday={selectedWeekday}
          template={editingTemplate}
          exercises={exercises}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteModalOpen && deletingTemplate && (
        <DeleteConfirmModal
          title="Deletar Template"
          message={`Tem certeza que deseja deletar o treino "${deletingTemplate.name}" de ${WEEKDAYS[deletingTemplate.weekday].label}? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeletingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
