import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 text-white hover:bg-blue-700 
      focus:ring-blue-500 shadow-sm
    `,
    secondary: `
      bg-gray-600 text-white hover:bg-gray-700 
      focus:ring-gray-500 shadow-sm
    `,
    outline: `
      border border-gray-300 dark:border-gray-600 
      bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
      hover:bg-gray-50 dark:hover:bg-gray-700 
      focus:ring-blue-500
    `,
    ghost: `
      text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
      focus:ring-blue-500
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700 
      focus:ring-red-500 shadow-sm
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className={`animate-spin -ml-1 mr-2 ${iconClasses[size]}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={`mr-2 ${iconClasses[size]}`}>
          {icon}
        </span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={`ml-2 ${iconClasses[size]}`}>
          {icon}
        </span>
      )}
    </button>
  );
}

// Specialized button variants
export function LoadingButton({ children, ...props }: ButtonProps) {
  return <Button loading {...props}>{children}</Button>;
}

export function IconButton({ 
  icon, 
  'aria-label': ariaLabel,
  ...props 
}: ButtonProps & { 'aria-label': string }) {
  return (
    <Button
      {...props}
      aria-label={ariaLabel}
      className={`p-2 ${props.className || ''}`}
    >
      {icon}
    </Button>
  );
}
