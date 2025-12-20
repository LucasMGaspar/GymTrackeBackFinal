'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import type { Student } from '@/lib/types';
import { AssessmentModal } from './AssessmentModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { Plus, Calendar, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';

interface Assessment {
  id: string;
  student_id: string;
  personal_id: string;
  assessment_date: string;
  weight: number | null;
  height: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  body_water_percentage: number | null;
  bone_mass: number | null;
  bmi: number | null;
  chest_circumference: number | null;
  waist_circumference: number | null;
  hip_circumference: number | null;
  arm_circumference: number | null;
  thigh_circumference: number | null;
  calf_circumference: number | null;
  triceps_skinfold: number | null;
  biceps_skinfold: number | null;
  subscapular_skinfold: number | null;
  iliac_skinfold: number | null;
  notes: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

interface Props {
  student: Student;
  assessments: Assessment[];
}

export function AssessmentsClient({ student, assessments: initialAssessments }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatNumber = (value: number | null, decimals: number = 1) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  const getComparison = (current: Assessment | null, previous: Assessment | null) => {
    if (!current || !previous) return null;

    const comparisons: Record<string, { current: number | null; previous: number | null; diff: number; unit: string }> = {};

    if (current.weight !== null && previous.weight !== null) {
      comparisons.weight = {
        current: current.weight,
        previous: previous.weight,
        diff: current.weight - previous.weight,
        unit: 'kg',
      };
    }

    if (current.body_fat_percentage !== null && previous.body_fat_percentage !== null) {
      comparisons.bodyFat = {
        current: current.body_fat_percentage,
        previous: previous.body_fat_percentage,
        diff: current.body_fat_percentage - previous.body_fat_percentage,
        unit: '%',
      };
    }

    if (current.bmi !== null && previous.bmi !== null) {
      comparisons.bmi = {
        current: current.bmi,
        previous: previous.bmi,
        diff: current.bmi - previous.bmi,
        unit: '',
      };
    }

    return comparisons;
  };

  const handleCreate = () => {
    setEditingAssessment(null);
    setModalOpen(true);
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setModalOpen(true);
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setDeletingAssessment(assessment);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAssessment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/assessments?id=${deletingAssessment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setAssessments(assessments.filter((a) => a.id !== deletingAssessment.id));
      setDeleteModalOpen(false);
      setDeletingAssessment(null);
      showToast('Avaliação deletada com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao deletar avaliação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    router.refresh();
  };

  const latestAssessment = assessments[0] || null;
  const previousAssessment = assessments[1] || null;
  const comparison = getComparison(latestAssessment, previousAssessment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/app/personal/students"
          className="text-sm text-primary-600 hover:text-primary-700 mb-3 inline-flex items-center gap-1 font-medium transition-colors"
        >
          ← Voltar para Alunos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Avaliações Físicas
            </h1>
            <p className="text-gray-600 mt-1">
              {student.student_name}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Avaliação
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {latestAssessment && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Peso</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatNumber(latestAssessment.weight)} kg
            </div>
            {comparison?.weight && (
              <div className={`flex items-center gap-1 text-sm ${
                comparison.weight.diff < 0 ? 'text-green-600' : comparison.weight.diff > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {comparison.weight.diff < 0 ? <TrendingDown className="w-4 h-4" /> : comparison.weight.diff > 0 ? <TrendingUp className="w-4 h-4" /> : null}
                {comparison.weight.diff > 0 ? '+' : ''}{formatNumber(comparison.weight.diff)} kg
                {comparison.weight.previous && ` desde ${formatDate(previousAssessment!.assessment_date)}`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">% Gordura</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatNumber(latestAssessment.body_fat_percentage)}%
            </div>
            {comparison?.bodyFat && (
              <div className={`flex items-center gap-1 text-sm ${
                comparison.bodyFat.diff < 0 ? 'text-green-600' : comparison.bodyFat.diff > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {comparison.bodyFat.diff < 0 ? <TrendingDown className="w-4 h-4" /> : comparison.bodyFat.diff > 0 ? <TrendingUp className="w-4 h-4" /> : null}
                {comparison.bodyFat.diff > 0 ? '+' : ''}{formatNumber(comparison.bodyFat.diff)}%
                {comparison.bodyFat.previous && ` desde ${formatDate(previousAssessment!.assessment_date)}`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">IMC</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatNumber(latestAssessment.bmi)}
            </div>
            {comparison?.bmi && (
              <div className={`flex items-center gap-1 text-sm ${
                comparison.bmi.diff < 0 ? 'text-green-600' : comparison.bmi.diff > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {comparison.bmi.diff < 0 ? <TrendingDown className="w-4 h-4" /> : comparison.bmi.diff > 0 ? <TrendingUp className="w-4 h-4" /> : null}
                {comparison.bmi.diff > 0 ? '+' : ''}{formatNumber(comparison.bmi.diff)}
                {comparison.bmi.previous && ` desde ${formatDate(previousAssessment!.assessment_date)}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessments List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Histórico de Avaliações
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {assessments.length} avaliação{assessments.length !== 1 ? 'ões' : ''} registrada{assessments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {assessments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma avaliação registrada
            </h3>
            <p className="text-gray-600 mb-6">
              Comece registrando a primeira avaliação física do aluno
            </p>
            <button
              onClick={handleCreate}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Avaliação
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assessments.map((assessment, index) => {
              const prev = assessments[index + 1];
              const comp = getComparison(assessment, prev);

              return (
                <div key={assessment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(assessment.assessment_date)}
                        </h3>
                        {index === 0 && (
                          <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                            Mais Recente
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {assessment.weight !== null && (
                          <div>
                            <div className="text-sm text-gray-600">Peso</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatNumber(assessment.weight)} kg
                            </div>
                            {comp?.weight && (
                              <div className={`text-xs mt-1 ${
                                comp.weight.diff < 0 ? 'text-green-600' : comp.weight.diff > 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {comp.weight.diff > 0 ? '+' : ''}{formatNumber(comp.weight.diff)} kg
                              </div>
                            )}
                          </div>
                        )}

                        {assessment.body_fat_percentage !== null && (
                          <div>
                            <div className="text-sm text-gray-600">% Gordura</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatNumber(assessment.body_fat_percentage)}%
                            </div>
                            {comp?.bodyFat && (
                              <div className={`text-xs mt-1 ${
                                comp.bodyFat.diff < 0 ? 'text-green-600' : comp.bodyFat.diff > 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {comp.bodyFat.diff > 0 ? '+' : ''}{formatNumber(comp.bodyFat.diff)}%
                              </div>
                            )}
                          </div>
                        )}

                        {assessment.bmi !== null && (
                          <div>
                            <div className="text-sm text-gray-600">IMC</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatNumber(assessment.bmi)}
                            </div>
                            {comp?.bmi && (
                              <div className={`text-xs mt-1 ${
                                comp.bmi.diff < 0 ? 'text-green-600' : comp.bmi.diff > 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {comp.bmi.diff > 0 ? '+' : ''}{formatNumber(comp.bmi.diff)}
                              </div>
                            )}
                          </div>
                        )}

                        {assessment.height !== null && (
                          <div>
                            <div className="text-sm text-gray-600">Altura</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatNumber(assessment.height)} cm
                            </div>
                          </div>
                        )}
                      </div>

                      {assessment.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="text-sm text-gray-600 mb-1">Observações</div>
                          <div className="text-sm text-gray-900">{assessment.notes}</div>
                        </div>
                      )}

                      {/* Circunferências */}
                      {(assessment.chest_circumference !== null ||
                        assessment.waist_circumference !== null ||
                        assessment.hip_circumference !== null) && (
                        <div className="text-sm text-gray-600 mb-2">Circunferências:</div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {assessment.chest_circumference !== null && (
                          <span className="text-gray-700">
                            Peito: <strong>{formatNumber(assessment.chest_circumference)} cm</strong>
                          </span>
                        )}
                        {assessment.waist_circumference !== null && (
                          <span className="text-gray-700">
                            Cintura: <strong>{formatNumber(assessment.waist_circumference)} cm</strong>
                          </span>
                        )}
                        {assessment.hip_circumference !== null && (
                          <span className="text-gray-700">
                            Quadril: <strong>{formatNumber(assessment.hip_circumference)} cm</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(assessment)}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(assessment)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <AssessmentModal
          student={student}
          assessment={editingAssessment}
          onClose={() => {
            setModalOpen(false);
            setEditingAssessment(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteModalOpen && deletingAssessment && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeletingAssessment(null);
          }}
          onConfirm={handleDelete}
          title="Deletar Avaliação"
          message={`Tem certeza que deseja deletar a avaliação de ${formatDate(deletingAssessment.assessment_date)}? Esta ação não pode ser desfeita.`}
          loading={loading}
        />
      )}
    </div>
  );
}

