import React from 'react';

interface Button_1Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

function Button_1({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'lg',
  className = '',
  type = 'button',
}: Button_1Props) {
  const baseClasses =
    'group relative font-semibold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95';

  const variants = {
    primary:
      'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700',
    secondary:
      'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  };

  const sizes = {
    sm: 'px-6 py-3 text-lg',
    md: 'px-8 py-4 text-xl',
    lg: 'px-10 py-5 text-2xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${
        sizes[size]
      } text-white ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <span className="relative z-10">{children}</span>

      {/* Efecto de brillo al hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

      {/* Anillo de focus */}
      <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-opacity-0 group-focus:ring-opacity-50 transition-all duration-300"></div>
    </button>
  );
}

export default Button_1;
