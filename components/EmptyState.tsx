import { Calendar, Dumbbell, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'inbox' | 'calendar' | 'dumbbell';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  inbox: Inbox,
  calendar: Calendar,
  dumbbell: Dumbbell,
};

export function EmptyState({ title, description, icon = 'inbox', action }: EmptyStateProps) {
  const IconComponent = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl scale-150"></div>
        
        {/* Icon container */}
        <div className="relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-6 shadow-soft">
          <IconComponent className="w-12 h-12 text-primary-500" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
