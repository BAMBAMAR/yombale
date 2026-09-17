'use client'

import React from 'react'
import ModalCreerBail from './ModalCreerBail'
import ModalEncaisserLoyer from './ModalEncaisserLoyer'
import ModalEditerQuittanceImmo from './ModalEditerQuittanceImmo'
import { LoyerEcheance } from './LoyerCardMobile'

interface LocatifModalsProps {
  slug: string
  showCreerBail: boolean
  selectedLoyer: LoyerEcheance | null
  loyerAEditer: LoyerEcheance | null
  onCloseCreerBail: () => void
  onSuccessCreerBail: () => void
  onCloseEncaisserLoyer: () => void
  onSuccessEncaisserLoyer: () => void
  onCloseEditerLoyer: () => void
  onSuccessEditerLoyer: () => void
}

export default function LocatifModals({
  slug,
  showCreerBail,
  selectedLoyer,
  loyerAEditer,
  onCloseCreerBail,
  onSuccessCreerBail,
  onCloseEncaisserLoyer,
  onSuccessEncaisserLoyer,
  onCloseEditerLoyer,
  onSuccessEditerLoyer,
}: LocatifModalsProps) {
  return (
    <>
      {showCreerBail && (
        <ModalCreerBail
          slug={slug}
          onClose={onCloseCreerBail}
          onSuccess={onSuccessCreerBail}
        />
      )}

      {selectedLoyer && (
        <ModalEncaisserLoyer
          slug={slug}
          loyer={selectedLoyer}
          onClose={onCloseEncaisserLoyer}
          onSuccess={onSuccessEncaisserLoyer}
        />
      )}

      {loyerAEditer && (
        <ModalEditerQuittanceImmo
          slug={slug}
          loyer={loyerAEditer}
          onClose={onCloseEditerLoyer}
          onSuccess={onSuccessEditerLoyer}
        />
      )}
    </>
  )
}
