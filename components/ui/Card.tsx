import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  border?: boolean;
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = '2xl',
  border = false,
  hover = false,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  const baseStyle: React.CSSProperties = {
    background: 'rgba(20, 24, 28, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '18px',
    boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.45)',
    transition: 'all 0.25s ease',
  };

  const hoverStyle: React.CSSProperties = hover ? {
    background: 'rgba(26, 30, 36, 0.60)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    transform: 'translateY(-3px)',
    boxShadow: '0px 14px 34px rgba(0, 0, 0, 0.55)',
  } : {};

  return (
    <div
      className={`
        ${paddingClasses[padding]}
        ${roundedClasses[rounded]}
        ${className}
      `}
      style={{ ...baseStyle, ...hoverStyle }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.background = 'rgba(18, 28, 50, 0.55)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0px 12px 32px rgba(0, 0, 0, 0.45)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.background = 'rgba(14, 22, 40, 0.45)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0px 8px 24px rgba(0, 0, 0, 0.35)';
        }
      }}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-white/10 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({ 
  children, 
  className = '', 
  as: Component = 'h3' 
}: CardTitleProps) {
  return (
    <Component className={`text-lg font-semibold text-white ${className}`}>
      {children}
    </Component>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-gray-300 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`border-t border-white/10 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}

// Compound Card component
export function CardCompound({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = '2xl',
  border = false,
  hover = false,
}: CardProps) {
  return (
    <Card
      className={className}
      padding={padding}
      shadow={shadow}
      rounded={rounded}
      border={border}
      hover={hover}
    >
      {children}
    </Card>
  );
}

// Specialized card variants
export function FeatureCard({ 
  title, 
  description, 
  icon, 
  children,
  ...props 
}: CardProps & {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-3">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon,
  ...props 
}: CardProps & {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card {...props}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">
              {title}
            </p>
            <p className="text-2xl font-bold text-white">
              {value}
            </p>
            {change && (
              <p className={`text-sm ${changeColor[changeType]}`}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
