'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface Assessment {
  id: string;
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
  notes: string | null;
  photos: string[];
}

interface Props {
  assessments: Assessment[];
}

export function StudentAssessmentsClient({ assessments }: Props) {
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

  const latestAssessment = assessments[0] || null;
  const previousAssessment = assessments[1] || null;
  const comparison = getComparison(latestAssessment, previousAssessment);

  // Prepare data for charts
  const weightData = useMemo(() => {
    return assessments
      .filter(a => a.weight !== null)
      .map(a => ({
        date: a.assessment_date,
        value: a.weight!,
      }))
      .reverse();
  }, [assessments]);

  const bodyFatData = useMemo(() => {
    return assessments
      .filter(a => a.body_fat_percentage !== null)
      .map(a => ({
        date: a.assessment_date,
        value: a.body_fat_percentage!,
      }))
      .reverse();
  }, [assessments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app/student/dashboard"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Minhas Avaliações Físicas
          </h1>
          <p className="text-gray-600">
            Acompanhe sua evolução física ao longo do tempo
          </p>
        </div>

        {assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma avaliação registrada
            </h3>
            <p className="text-gray-600 max-w-sm">
              Seu personal trainer ainda não registrou nenhuma avaliação física. Quando houver avaliações, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            {latestAssessment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Peso</div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
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

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">% Gordura Corporal</div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
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

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">IMC</div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
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

            {/* Charts Section */}
            {(weightData.length > 0 || bodyFatData.length > 0) && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Evolução</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {weightData.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolução do Peso</h3>
                      <SimpleLineChart data={weightData} unit="kg" color="primary" />
                    </div>
                  )}
                  {bodyFatData.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolução do % Gordura</h3>
                      <SimpleLineChart data={bodyFatData} unit="%" color="accent" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assessments List */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Histórico de Avaliações
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {assessments.length} avaliação{assessments.length !== 1 ? 'ões' : ''} registrada{assessments.length !== 1 ? 's' : ''}
                </p>
              </div>

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
                              <div className="text-sm text-gray-600 mb-1">Observações do Personal</div>
                              <div className="text-sm text-gray-900">{assessment.notes}</div>
                            </div>
                          )}

                          {/* Fotos */}
                          {assessment.photos && assessment.photos.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-600 mb-2">Fotos:</div>
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {assessment.photos.map((photoUrl, photoIndex) => (
                                  <img
                                    key={photoIndex}
                                    src={photoUrl}
                                    alt={`Foto ${photoIndex + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(photoUrl, '_blank')}
                                  />
                                ))}
                              </div>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({ data, unit, color }: { data: { date: string; value: number }[]; unit: string; color: 'primary' | 'accent' }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const colorClass = color === 'primary' ? 'text-primary-500' : 'text-accent-500';
  const bgColorClass = color === 'primary' ? 'bg-primary-500' : 'bg-accent-500';

  return (
    <div className="relative h-48">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y * 200}
            x2="400"
            y2={y * 200}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path
          d={`M 0,200 ${data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 400;
            const y = 200 - ((d.value - minValue) / range) * 180;
            return `L ${x},${y}`;
          }).join(' ')} L 400,200 Z`}
          fill={color === 'primary' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)'}
        />

        {/* Line */}
        <path
          d={`M ${data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 400;
            const y = 200 - ((d.value - minValue) / range) * 180;
            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
          }).join(' ')}`}
          fill="none"
          stroke={color === 'primary' ? '#3b82f6' : '#8b5cf6'}
          strokeWidth="2"
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 400;
          const y = 200 - ((d.value - minValue) / range) * 180;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={color === 'primary' ? '#3b82f6' : '#8b5cf6'}
            />
          );
        })}
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
        <span>{new Date(data[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
      </div>

      {/* Value labels */}
      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs font-semibold text-gray-700 px-2">
        <span>{formatNumber(minValue)}{unit}</span>
        <span>{formatNumber(maxValue)}{unit}</span>
      </div>
    </div>
  );
}

function formatNumber(value: number, decimals: number = 1) {
  return value.toFixed(decimals);
}

