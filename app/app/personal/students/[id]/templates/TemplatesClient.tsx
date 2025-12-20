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
          className="text-sm text-primary-600 hover:text-primary-700 mb-3 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Alunos
        </Link>
        <div className="mt-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Templates de Treino
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="font-medium">{student.student_name}</span>
            </div>
            <span>•</span>
            <span>{totalTemplates} dia{totalTemplates !== 1 ? 's' : ''} configurado{totalTemplates !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{totalExercises} exercício{totalExercises !== 1 ? 's' : ''} total</span>
          </div>
        </div>
      </div>

      {/* Info */}
      {totalTemplates === 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900 mb-1">Como funciona</p>
              <p className="text-sm text-primary-800">
                Configure os treinos por dia da semana. O aluno verá automaticamente o treino do dia atual.
              </p>
            </div>
          </div>
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
              className={`group relative bg-white rounded-xl shadow-sm p-5 border-2 transition-all duration-300 hover:shadow-md ${
                hasTemplate
                  ? 'border-success-200 hover:border-success-300 bg-gradient-to-br from-white to-success-50/30'
                  : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50/30'
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-4">
                <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  {day.short}
                </div>
                <div className={`text-base font-bold ${
                  hasTemplate ? 'text-success-700' : 'text-gray-700'
                }`}>
                  {day.label}
                </div>
              </div>

              {hasTemplate && template ? (
                <>
                  {/* Template Info */}
                  <div className="mb-4 text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success-100 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-semibold text-success-700">Configurado</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 line-clamp-2">
                      {template.name}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>{template.workout_template_exercises.length} exercício{template.workout_template_exercises.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="w-full text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 py-2 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(template)}
                      className="w-full text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Empty State */}
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <button
                      onClick={() => handleCreateTemplate(day.value)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      Criar Treino
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Resumo dos Treinos
            </h3>
          </div>
          <div className="space-y-3">
            {templates.map((template) => {
              const day = WEEKDAYS.find((d) => d.value === template.weekday);
              return (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {day?.short}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {day?.label} - {template.name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {template.workout_template_exercises.length} exercícios
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(template)}
                      className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
