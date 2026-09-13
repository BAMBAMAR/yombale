'use client'

import React, { forwardRef } from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
  style,
  ...props
}, ref) => {
  const paddingStyle = {
    none: '0',
    sm: '12px',
    md: '18px',
    lg: '24px',
  }[padding]

  const shadowStyle = {
    default: 'var(--shadow-sm)',
    elevated: 'var(--shadow-md)',
    outlined: 'none',
  }[variant]

  return (
    <div
      ref={ref}
      className={`card-npl ${interactive ? 'card-interactive' : ''} ${className}`.trim()}
      style={{
        padding: paddingStyle,
        boxShadow: shadowStyle,
        cursor: interactive ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
