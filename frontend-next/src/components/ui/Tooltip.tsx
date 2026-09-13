'use client'

import React, { useState, useId } from 'react'
import { HelpCircle } from 'lucide-react'

export interface TooltipProps {
  content: string | React.ReactNode
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()

  const positionStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px',
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '8px',
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '8px',
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '8px',
    },
  }

  return (
    <span
      className={`tooltip-wrapper ${className}`.trim()}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children || (
        <span
          tabIndex={0}
          role="button"
          aria-label="Information complémentaire"
          style={{
            cursor: 'help',
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--text3, #888)',
            padding: '2px',
          }}
        >
          <HelpCircle size={14} />
        </span>
      )}

      {isVisible && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 9999,
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            fontSize: '11.5px',
            lineHeight: 1.4,
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: '6px',
            whiteSpace: 'normal',
            width: 'max-content',
            maxWidth: '240px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease',
            ...positionStyles[position],
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
