'use client';

import { useState, useEffect } from 'react';
import type { Student } from '@/lib/types';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Assessment {
  id: string;
  student_id: string;
  assessment_date: string;
  weight: number | null;
  height: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  body_water_percentage: number | null;
  bone_mass: number | null;
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
}

interface Props {
  student: Student;
  assessment: Assessment | null;
  onClose: () => void;
  onSave: () => void;
}

export function AssessmentModal({ student, assessment, onClose, onSave }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [assessmentDate, setAssessmentDate] = useState(
    assessment?.assessment_date || new Date().toISOString().split('T')[0]
  );
  const [weight, setWeight] = useState<string>(assessment?.weight?.toString() || '');
  const [height, setHeight] = useState<string>(assessment?.height?.toString() || '');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>(assessment?.body_fat_percentage?.toString() || '');
  const [muscleMass, setMuscleMass] = useState<string>(assessment?.muscle_mass?.toString() || '');
  const [bodyWaterPercentage, setBodyWaterPercentage] = useState<string>(assessment?.body_water_percentage?.toString() || '');
  const [boneMass, setBoneMass] = useState<string>(assessment?.bone_mass?.toString() || '');
  const [chestCircumference, setChestCircumference] = useState<string>(assessment?.chest_circumference?.toString() || '');
  const [waistCircumference, setWaistCircumference] = useState<string>(assessment?.waist_circumference?.toString() || '');
  const [hipCircumference, setHipCircumference] = useState<string>(assessment?.hip_circumference?.toString() || '');
  const [armCircumference, setArmCircumference] = useState<string>(assessment?.arm_circumference?.toString() || '');
  const [thighCircumference, setThighCircumference] = useState<string>(assessment?.thigh_circumference?.toString() || '');
  const [calfCircumference, setCalfCircumference] = useState<string>(assessment?.calf_circumference?.toString() || '');
  const [notes, setNotes] = useState(assessment?.notes || '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const parseNumber = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const data: any = {
        student_id: student.id,
        assessment_date: assessmentDate,
        weight: parseNumber(weight),
        height: parseNumber(height),
        body_fat_percentage: parseNumber(bodyFatPercentage),
        muscle_mass: parseNumber(muscleMass),
        body_water_percentage: parseNumber(bodyWaterPercentage),
        bone_mass: parseNumber(boneMass),
        chest_circumference: parseNumber(chestCircumference),
        waist_circumference: parseNumber(waistCircumference),
        hip_circumference: parseNumber(hipCircumference),
        arm_circumference: parseNumber(armCircumference),
        thigh_circumference: parseNumber(thighCircumference),
        calf_circumference: parseNumber(calfCircumference),
        notes: notes.trim() || null,
        photos: [],
      };

      const method = assessment ? 'PATCH' : 'POST';
      const url = assessment ? '/api/assessments' : '/api/assessments';
      const body = assessment ? { id: assessment.id, ...data } : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show more detailed error message
        let errorMessage = result.error || 'Failed to save assessment';
        if (result.details) {
          errorMessage += `: ${result.details}`;
        }
        if (result.hint) {
          errorMessage += ` (${result.hint})`;
        }
        throw new Error(errorMessage);
      }

      showToast(
        assessment ? 'Avaliação atualizada com sucesso' : 'Avaliação criada com sucesso',
        'success'
      );
      onSave();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      showToast(error.message || 'Erro ao salvar avaliação', 'error');
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {assessment ? 'Editar Avaliação' : 'Nova Avaliação Física'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{student.student_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-red-800 mb-1">Erro ao salvar avaliação</div>
                  <div className="text-red-700 text-sm whitespace-pre-wrap">{errors.general}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Data da Avaliação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Avaliação *
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Medidas Básicas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medidas Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 80.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Ex: 175"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    % Gordura Corporal
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={bodyFatPercentage}
                    onChange={(e) => setBodyFatPercentage(e.target.value)}
                    placeholder="Ex: 20.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Massa Muscular (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={muscleMass}
                    onChange={(e) => setMuscleMass(e.target.value)}
                    placeholder="Ex: 60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    % Água Corporal
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={bodyWaterPercentage}
                    onChange={(e) => setBodyWaterPercentage(e.target.value)}
                    placeholder="Ex: 55"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Massa Óssea (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={boneMass}
                    onChange={(e) => setBoneMass(e.target.value)}
                    placeholder="Ex: 3.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Circunferências */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Circunferências (cm)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peito
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={chestCircumference}
                    onChange={(e) => setChestCircumference(e.target.value)}
                    placeholder="Ex: 100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cintura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={waistCircumference}
                    onChange={(e) => setWaistCircumference(e.target.value)}
                    placeholder="Ex: 85"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quadril
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={hipCircumference}
                    onChange={(e) => setHipCircumference(e.target.value)}
                    placeholder="Ex: 95"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Braço
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={armCircumference}
                    onChange={(e) => setArmCircumference(e.target.value)}
                    placeholder="Ex: 35"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coxa
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={thighCircumference}
                    onChange={(e) => setThighCircumference(e.target.value)}
                    placeholder="Ex: 60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Panturrilha
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={calfCircumference}
                    onChange={(e) => setCalfCircumference(e.target.value)}
                    placeholder="Ex: 38"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Observações sobre a avaliação..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
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
              assessment ? 'Atualizar' : 'Criar Avaliação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

