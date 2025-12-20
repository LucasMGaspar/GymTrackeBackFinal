'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-success-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-primary-500 text-white',
  warning: 'bg-amber-500 text-white',
};

export function Toast({ type, message, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-soft-xl
        transition-all duration-300
        ${styles[type]}
        ${isVisible ? 'animate-slide-down opacity-100' : 'opacity-0 translate-y-2'}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium text-sm">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; message: string }>>([]);

  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    hideToast,
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    info: (message: string) => showToast('info', message),
    warning: (message: string) => showToast('warning', message),
  };
}
