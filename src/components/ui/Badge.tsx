import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200 hover:scale-105';
  
  const variantClasses = {
    success: 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md',
    warning: 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:shadow-md',
    error: 'bg-red-100 text-red-800 hover:bg-red-200 hover:shadow-md',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:shadow-md',
    neutral: 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
}