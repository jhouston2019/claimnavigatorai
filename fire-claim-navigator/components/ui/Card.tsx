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

  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${roundedClasses[rounded]}
        ${border ? 'border border-gray-200 dark:border-gray-700' : ''}
        ${hover ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
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
    <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${className}`}>
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
    <Component className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
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
    <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>
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
    <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 ${className}`}>
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
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
