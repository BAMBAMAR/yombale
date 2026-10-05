'use client'

import React from 'react'
import { SurgaRadioProvider as BaseRadioProvider } from '@/lib/surga-radio-context'
import SurgaPersistentRadioBar from './SurgaPersistentRadioBar'

export default function SurgaRadioProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseRadioProvider>
      {children}
      <SurgaPersistentRadioBar />
    </BaseRadioProvider>
  )
}
