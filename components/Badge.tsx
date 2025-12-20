interface BadgeProps {
  variant?: 'gray' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variants = {
  gray: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  accent: 'bg-accent-100 text-accent-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

export function Badge({ variant = 'gray', size = 'md', children, icon }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {icon}
      {children}
    </span>
  );
}
