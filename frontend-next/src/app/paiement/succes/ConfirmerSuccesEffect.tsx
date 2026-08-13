'use client'

import { useEffect } from 'react'

export function ConfirmerSuccesEffect({ reference }: { reference?: string }) {
  useEffect(() => {
    if (!reference) return
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://yombale.onrender.com'
    fetch(`${backendUrl}/api/paiement/confirmer-succes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    }).catch(() => {})
  }, [reference])

  return null
}
