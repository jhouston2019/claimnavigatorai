import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    if (toast.duration !== 0) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  const success = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, description, ...options });
  }, [addToast]);

  const error = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, description, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, description, ...options });
  }, [addToast]);

  const info = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, description, ...options });
  }, [addToast]);

  return { success, error, warning, info };
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 150);
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900',
      border: 'border-green-200 dark:border-green-700',
      icon: 'text-green-400',
      title: 'text-green-800 dark:text-green-200',
      description: 'text-green-700 dark:text-green-300'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900',
      border: 'border-red-200 dark:border-red-700',
      icon: 'text-red-400',
      title: 'text-red-800 dark:text-red-200',
      description: 'text-red-700 dark:text-red-300'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
      icon: 'text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      description: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900',
      border: 'border-blue-200 dark:border-blue-700',
      icon: 'text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      description: 'text-blue-700 dark:text-blue-300'
    }
  };

  const styles = typeStyles[toast.type];

  return (
    <div
      className={`
        max-w-sm w-full ${styles.bg} ${styles.border} border rounded-lg shadow-lg
        transform transition-all duration-200 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ToastIcon type={toast.type} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles.title}`}>
              {toast.title}
            </p>
            {toast.description && (
              <p className={`mt-1 text-sm ${styles.description}`}>
                {toast.description}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={toast.action.onClick}
                  className={`text-sm font-medium ${styles.title} hover:underline`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleRemove}
              className={`inline-flex ${styles.title} hover:opacity-75 focus:outline-none`}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  const iconProps = "h-5 w-5";
  
  switch (type) {
    case 'success':
      return (
        <svg className={`${iconProps} text-green-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${iconProps} text-red-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${iconProps} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'info':
      return (
        <svg className={`${iconProps} text-blue-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }
}
