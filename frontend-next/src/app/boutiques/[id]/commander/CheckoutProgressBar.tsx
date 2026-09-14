'use client'

import React from 'react'
import { Check } from 'lucide-react'

interface CheckoutProgressBarProps {
  step: 1 | 2 | 3
}

export default function CheckoutProgressBar({ step }: CheckoutProgressBarProps) {
  const steps = [
    { num: 1, label: 'Coordonnées' },
    { num: 2, label: 'Paiement' },
    { num: 3, label: 'Confirmation' },
  ]

  return (
    <div className="checkout-progress" role="navigation" aria-label="Progression de la commande">
      {steps.map((s, idx) => (
        <div
          key={s.num}
          className={`checkout-progress-step ${step >= s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}
        >
          <div className="checkout-progress-circle">
            {step > s.num ? <Check size={13} strokeWidth={2.5} /> : s.num}
          </div>
          <span>{s.label}</span>
          {idx < steps.length - 1 && (
            <div className={`checkout-progress-line ${step > s.num ? 'filled' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
