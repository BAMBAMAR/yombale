'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import WizardImmo from './WizardImmo'

export default function ImmoClientWrapper() {
  const [showWizard, setShowWizard] = useState(false)

  return (
    <>
      <button
        type="button"
        className="immo-wizard-trigger-btn"
        onClick={() => setShowWizard(true)}
      >
        <Search size={14} />
        <span>Trouver mon bien</span>
      </button>
      {showWizard && <WizardImmo onClose={() => setShowWizard(false)} />}
    </>
  )
}
