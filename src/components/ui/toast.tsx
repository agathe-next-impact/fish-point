'use client';

import { useNotificationStore } from '@/store/notification.store';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  error: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
  warning: 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  info: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
};

export function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);
  const removeToast = useNotificationStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in-from-bottom min-w-[300px] max-w-[420px]',
              styles[toast.type],
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
