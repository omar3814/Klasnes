import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const config = {
    success: {
      bg: 'bg-primary',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    },
    error: {
      bg: 'bg-destructive',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
    },
    info: {
      bg: 'bg-info',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  }[type];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div
        className={`${config.bg} text-white font-bold rounded-xl shadow-2xl shadow-black/40 flex items-center p-4 animate-fade-in-up transition-colors duration-300`}
      >
        <svg
          className="w-6 h-6 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fillRule="evenodd" d={config.icon} clipRule="evenodd"></path>
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};