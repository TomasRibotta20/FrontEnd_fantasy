import React, { useEffect } from 'react';

interface NotificationProps {
  message: {
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null;
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  onClose,
  autoHide = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (message && autoHide && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, autoHide, duration, onClose]);

  if (!message) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg ${getBackgroundColor()} text-white font-medium min-w-[300px] max-w-[500px] text-center animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">{getIcon()}</span>
        <span>{message.text}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-white hover:text-gray-200 text-lg font-bold"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
