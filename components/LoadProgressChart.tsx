'use client';

import { useMemo } from 'react';

interface DataPoint {
  date: string;
  load: number;
}

interface Props {
  exerciseName: string;
  data: DataPoint[];
  className?: string;
}

export function LoadProgressChart({ exerciseName, data, className = '' }: Props) {
  const { chartPoints, maxLoad, minLoad, trend } = useMemo(() => {
    if (data.length === 0) {
      return { chartPoints: [], maxLoad: 0, minLoad: 0, trend: 0 };
    }

    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const loads = sortedData.map(d => d.load);
    const max = Math.max(...loads);
    const min = Math.min(...loads);
    const range = max - min || 1;

    // Calculate chart points (SVG coordinates)
    const width = 300;
    const height = 120;
    const padding = 10;

    const points = sortedData.map((d, i) => {
      const x = padding + (i / (sortedData.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((d.load - min) / range) * (height - 2 * padding);
      return { x, y, load: d.load, date: d.date };
    });

    // Calculate trend (simple: compare first and last)
    const trendPercent = sortedData.length > 1
      ? ((sortedData[sortedData.length - 1].load - sortedData[0].load) / sortedData[0].load) * 100
      : 0;

    return {
      chartPoints: points,
      maxLoad: max,
      minLoad: min,
      trend: trendPercent,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">{exerciseName}</h4>
        <p className="text-xs text-gray-500">Sem dados de carga registrados</p>
      </div>
    );
  }

  const pathData = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ');

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{exerciseName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600">
              {minLoad}kg → {maxLoad}kg
            </span>
            {trend !== 0 && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox="0 0 300 120"
        className="w-full h-24"
        style={{ touchAction: 'none' }}
      >
        {/* Grid lines */}
        <line x1="10" y1="10" x2="10" y2="110" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="10" y1="110" x2="290" y2="110" stroke="#e5e7eb" strokeWidth="1" />

        {/* Area fill */}
        {chartPoints.length > 1 && (
          <path
            d={`${pathData} L ${chartPoints[chartPoints.length - 1].x},110 L ${chartPoints[0].x},110 Z`}
            fill="url(#gradient)"
            opacity="0.2"
          />
        )}

        {/* Line */}
        {chartPoints.length > 1 && (
          <path
            d={pathData}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {chartPoints.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#6366f1"
              stroke="white"
              strokeWidth="2"
            />
            <title>{`${new Date(point.date).toLocaleDateString('pt-BR')}: ${point.load}kg`}</title>
          </g>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>{data.length} sessão{data.length > 1 ? 'ões' : ''}</span>
        <span>
          {new Date(data[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          {' → '}
          {new Date(data[data.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
