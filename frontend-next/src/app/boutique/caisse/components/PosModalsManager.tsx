'use client'

import React from 'react'
import PosSessionModals, { PosSessionModalsProps } from './PosSessionModals'
import PosOperationalModals, { PosOperationalModalsProps } from './PosOperationalModals'

export type PosModalsManagerProps = PosSessionModalsProps & PosOperationalModalsProps

export default function PosModalsManager(props: PosModalsManagerProps) {
  return (
    <>
      <PosSessionModals {...props} />
      <PosOperationalModals {...props} />
    </>
  )
}
