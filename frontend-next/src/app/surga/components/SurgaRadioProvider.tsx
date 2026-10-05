'use client'

import React from 'react'
import { SurgaRadioProvider as BaseRadioProvider } from '@/lib/surga-radio-context'
import SurgaPersistentRadioBar from './SurgaPersistentRadioBar'
import SurgaToastContainer from './SurgaToastContainer'

export default function SurgaRadioProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseRadioProvider>
      {children}
      <SurgaPersistentRadioBar />
      <SurgaToastContainer />
    </BaseRadioProvider>
  )
}
