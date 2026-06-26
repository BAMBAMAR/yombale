'use client'

import { useState } from 'react'
import WizardImmo from './WizardImmo'

export default function ImmoClientWrapper() {
  const [showWizard, setShowWizard] = useState(false)

  return (
    <>
      <button className="wizard-trigger-btn" onClick={() => setShowWizard(true)}>
        🏘 Trouver mon bien
      </button>
      {showWizard && <WizardImmo onClose={() => setShowWizard(false)} />}
    </>
  )
}
