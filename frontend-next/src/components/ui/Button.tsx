'use client'

import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const variantClass = {
    primary: 'btn-npl-primary',
    secondary: 'btn-npl-secondary',
    accent: 'btn-npl-primary',
    outline: 'btn-npl-secondary',
    ghost: 'btn-npl-ghost',
    danger: 'btn-npl-danger',
  }[variant] || 'btn-npl-primary'

  const sizeClass = {
    sm: 'btn-npl-sm',
    md: 'btn-npl-md',
    lg: 'btn-npl-lg',
  }[size] || 'btn-npl-md'

  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      className={`btn-npl ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : (
        leftIcon && <span className="btn-icon-left" style={{ display: 'inline-flex', alignItems: 'center' }}>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="btn-icon-right" style={{ display: 'inline-flex', alignItems: 'center' }}>{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
