import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  hover = false, 
  gradient = false,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-soft border border-gray-100/80
        ${hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : ''}
        ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
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
  gradient?: 'indigo' | 'green' | 'amber' | 'rose' | 'blue' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const gradientClasses = {
  indigo: 'from-indigo-500 to-purple-600',
  green: 'from-green-500 to-emerald-600',
  amber: 'from-amber-500 to-orange-600',
  rose: 'from-rose-500 to-pink-600',
  blue: 'from-blue-500 to-cyan-600',
  purple: 'from-purple-500 to-violet-600',
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient = 'indigo', 
  trend 
}: MetricCardProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl 
      bg-gradient-to-br ${gradientClasses[gradient]} 
      p-6 text-white shadow-lg hover:shadow-xl 
      transition-all duration-300 hover:-translate-y-1
    `}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      {/* Decorative circle */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
      <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/5 rounded-full"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold opacity-90">{title}</p>
          </div>
          {icon && (
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-4xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm font-medium opacity-80">{subtitle}</p>
          )}
          {trend && (
            <div className={`
              inline-flex items-center gap-1 text-sm font-semibold 
              px-2 py-1 rounded-full
              ${trend.isPositive ? 'bg-white/20' : 'bg-white/10'}
            `}>
              <svg
                className={`w-4 h-4 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatCard({ 
  label, 
  value, 
  icon,
  color = 'indigo'
}: { 
  label: string; 
  value: string | number; 
  icon?: ReactNode;
  color?: 'indigo' | 'green' | 'amber' | 'rose' | 'blue';
}) {
  const colorClasses = {
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-600',
    green: 'from-green-50 to-green-100 text-green-600',
    amber: 'from-amber-50 to-amber-100 text-amber-600',
    rose: 'from-rose-50 to-rose-100 text-rose-600',
    blue: 'from-blue-50 to-blue-100 text-blue-600',
  };

  return (
    <div className="text-center p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100">
      {icon && (
        <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      )}
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
    </div>
  );
}
