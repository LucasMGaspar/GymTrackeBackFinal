import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
        hover ? 'hover:shadow-md transition-shadow duration-200' : ''
      } ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, subtitle, icon, gradient = 'from-indigo-500 to-purple-500', trend }: MetricCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
          </div>
          {icon && (
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm opacity-90">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center space-x-1 text-sm">
              <svg
                className={`w-4 h-4 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
