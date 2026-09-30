'use client'

import React, { useEffect, useState } from 'react'
import { Award } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

// Réglage « Club VIP » : le marchand décide d'offrir (et de financer) une remise sur la livraison à ses clients fidèles.
export default function ParametreClubVip({ boutiqueId }: { boutiqueId: string }) {
  const { toast } = useToast()
  const [actif, setActif] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const entetes = (): Record<string, string> => {
    const token = localStorage.getItem('token') || localStorage.getItem('nopalou_token') || ''
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  useEffect(() => {
    let vivant = true
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/club-vip`, { headers: entetes() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivant && d) setActif(d.actif === true) })
      .catch(() => {})
      .finally(() => { if (vivant) setChargement(false) })
    return () => { vivant = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boutiqueId, backendUrl])

  const basculer = async () => {
    const suivant = !actif
    setEnvoi(true)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/club-vip`, {
        method: 'PUT',
        headers: entetes(),
        body: JSON.stringify({ actif: suivant }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')
      setActif(suivant)
      toast({ type: 'success', message: suivant ? 'Remise Club VIP activée sur votre boutique.' : 'Remise Club VIP désactivée.' })
    } catch (err: any) {
      toast({ type: 'error', message: err.message })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div
      style={{
        width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '14px 16px',
        border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, background: '#ffffff',
        display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      }}
    >
      <Award size={18} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>Remise Club VIP sur la livraison</div>
        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
          Vos clients fidèles paient moins cher leur livraison : 500 F dès 2 commandes, 1 000 F dès 5, livraison offerte
          (jusqu&apos;à 2 500 F) dès 10. <strong>Cette remise est déduite de votre encaissement.</strong> Désactivée par défaut.
        </div>
      </div>
      <button
        type="button"
        onClick={basculer}
        disabled={chargement || envoi}
        aria-pressed={actif}
        className="btn-npl"
        style={{
          flexShrink: 0, whiteSpace: 'nowrap', padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13,
          cursor: chargement || envoi ? 'default' : 'pointer', border: '1.5px solid var(--accent, #C75B00)',
          background: actif ? 'var(--accent, #C75B00)' : '#ffffff', color: actif ? '#ffffff' : 'var(--accent, #C75B00)',
        }}
      >
        {chargement ? '…' : actif ? 'Activée — désactiver' : 'Activer'}
      </button>
    </div>
  )
}
