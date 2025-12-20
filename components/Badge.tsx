interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({ children, variant = 'default', size = 'md', dot = false }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200',
    warning: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200',
    danger: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200',
    info: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200',
    primary: 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200',
  };

  const dotColors = {
    default: 'bg-gray-400',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    primary: 'bg-indigo-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full ${variants[variant]} ${sizes[size]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
