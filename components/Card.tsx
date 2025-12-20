import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md'
}: CardProps) {
  const variants = {
    default: 'card',
    elevated: 'card-elevated',
    interactive: 'card-interactive',
    gradient: 'card-gradient',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`${variants[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const gradientClasses = {
  primary: 'from-primary-500 to-primary-600',
  success: 'from-success-500 to-success-600',
  warning: 'from-warning-500 to-warning-600',
  danger: 'from-danger-500 to-danger-600',
  accent: 'from-accent-500 to-accent-600',
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient = 'primary', 
  trend 
}: MetricCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClasses[gradient]} p-6 text-white shadow-lg`}>
      {/* Background pattern */}
      <div className="absolute inset-0 stat-pattern" />
      
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -right-2 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-white/90">{title}</p>
          {icon && (
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-white/80">{subtitle}</p>
          )}
          {trend && (
            <div className={`inline-flex items-center gap-1 text-sm font-medium mt-2 px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-white/20' : 'bg-white/10'
            }`}>
              <svg
                className={`w-3.5 h-3.5 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  success: 'bg-success-50 text-success-600 border-success-100',
  warning: 'bg-warning-50 text-warning-600 border-warning-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
  accent: 'bg-accent-50 text-accent-600 border-accent-100',
};

export function StatCard({ label, value, icon, color = 'primary' }: StatCardProps) {
  return (
    <div className="card p-5 text-center">
      {icon && (
        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl border flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      )}
      <p className="text-2xl font-bold text-dark-900">{value}</p>
      <p className="text-sm text-dark-500 mt-1">{label}</p>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function InfoCard({ title, description, icon, action }: InfoCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-dark-900">{title}</h3>
        {description && (
          <p className="text-sm text-dark-500 mt-1">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 mt-2"
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
}
