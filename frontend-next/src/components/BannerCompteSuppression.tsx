'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { annulerSuppressionAction, getStatutSuppressionAction } from '@/app/actions/auth'

export default function BannerCompteSuppression() {
  const router = useRouter()
  const [statut, setStatut] = useState<{
    en_cours_de_suppression: boolean
    jours_restants?: number | null
    date_limite?: string | null
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getStatutSuppressionAction().then(res => {
      if (res && res.en_cours_de_suppression) {
        setStatut(res)
      }
    })
  }, [])

  if (!statut || !statut.en_cours_de_suppression || dismissed) {
    return null
  }

  function handleAnnuler() {
    startTransition(async () => {
      const res = await annulerSuppressionAction()
      if (res.success) {
        setStatut(null)
        router.refresh()
      }
    })
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #b45309 0%, #92400e 100%)',
      color: '#ffffff',
      padding: '10px 16px',
      fontSize: 13.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      zIndex: 50,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <AlertTriangle size={18} color="#fde68a" style={{ flexShrink: 0 }} />
        <span>
          <strong>Attention :</strong> Votre compte est programmé pour suppression dans{' '}
          <strong>{statut.jours_restants ?? 30} jours</strong> (le {statut.date_limite || 'terme'}).
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleAnnuler}
          disabled={isPending}
          style={{
            background: '#ffffff',
            color: '#92400e',
            border: 'none',
            padding: '5px 12px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={13} className={isPending ? 'spin' : ''} />
          {isPending ? 'Annulation...' : 'Annuler la suppression'}
        </button>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fde68a',
            cursor: 'pointer',
            padding: 4
          }}
          aria-label="Masquer le bandeau"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
