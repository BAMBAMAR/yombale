'use client'

import React from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'

// SRG-A3-006 : une liste qui n'a pas pu être chargée le dit et propose de réessayer. « Aucun résultat » est réservé
// au cas où le serveur a répondu qu'il n'y en a pas.
// Lit une réponse de l'API de Surga : tout ce qui n'est pas un succès explicite est une erreur (statut d'échec,
// 429 compris, corps illisible, ou « success: false »).
export async function lireReponseSurga(res: Response): Promise<any> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data || data.success === false) throw new Error(data?.error || 'réponse en échec')
  return data
}

interface SurgaChargementEchoueProps {
  message: string
  onReessayer: () => void
}

export default function SurgaChargementEchoue({ message, onReessayer }: SurgaChargementEchoueProps) {
  return (
    <div role="alert" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--surga-text2, #475569)' }}>
      <CloudOff size={26} style={{ opacity: 0.55, marginBottom: 8 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>{message}</div>
      <div style={{ fontSize: 12, marginTop: 4, marginBottom: 14 }}>Vérifiez votre connexion, puis réessayez.</div>
      <button
        type="button"
        className="surga-btn-secondary"
        onClick={onReessayer}
        style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
      >
        <RefreshCw size={14} />
        Réessayer
      </button>
    </div>
  )
}
