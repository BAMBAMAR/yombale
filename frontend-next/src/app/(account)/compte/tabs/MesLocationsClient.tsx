'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Home,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import MesLocationCard, { LocationItem } from './components/MesLocationCard'

export default function MesLocationsClient() {
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null)

  async function chargerLocations() {
    // 1. Initialisation instantanée depuis le cache hors-ligne
    const cached = typeof window !== 'undefined' ? localStorage.getItem('nopalou_offline_mes_locations') : null
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(parsed)
          setLoading(false)
        }
      } catch (_) {}
    }

    try {
      if (!cached) setLoading(true)
      const res = await fetch('/api/locatif-immo/mes-locations', {
        headers: getImmoAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.locations)) {
          setLocations(data.locations)
          if (typeof window !== 'undefined') {
            localStorage.setItem('nopalou_offline_mes_locations', JSON.stringify(data.locations))
          }
        }
      }
    } catch (err) {
      console.warn('[MesLocationsClient] Erreur chargement locations (mode hors-ligne actif) :', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerLocations()
  }, [])

  async function handlePayerLoyer(echeanceId: string) {
    try {
      setPayingId(echeanceId)
      const res = await fetch(`/api/locatif-immo/public/payer-loyer/${echeanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methode_paiement: 'Wave',
          reference_paiement: `WAVE-${Date.now()}`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.wave_url) {
          // Redirection immédiate vers le checkout sécurisé Wave
          window.location.href = data.wave_url
          return
        }
        if (data.en_attente_validation) {
          setPaySuccessMsg('Déclaration de règlement transmise à l\'agence pour confirmation comptable.')
        } else {
          setPaySuccessMsg('Règlement validé avec succès ! Votre quittance officielle certifiée a été émise.')
        }
        await chargerLocations()
        setTimeout(() => setPaySuccessMsg(null), 6000)
      } else {
        alert(data.error || 'Erreur lors de l\'initialisation du paiement Wave')
      }
    } catch (err) {
      console.error('[PayerLoyerErr]', err)
    } finally {
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: 'var(--accent, #C75B00)', margin: '0 auto 12px' }}
        />
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
          Recherche de vos contrats de bail et quittances officielles...
        </p>
      </div>
    )
  }

  // État vide explicatif
  if (locations.length === 0) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid var(--border, #E8DDD2)',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1.5px solid var(--border, #E8DDD2)',
          }}
        >
          <Home size={26} style={{ color: 'var(--accent, #C75B00)' }} />
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          Aucun contrat de location actif associé
        </h3>

        <p style={{ margin: '0 auto 16px', maxWidth: 480, fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>
          Vos contrats de bail et quittances de loyer certifiées s&apos;associent automatiquement à votre compte dès que votre agence partenaire Nopalou enregistre votre contrat avec votre numéro de téléphone ou votre adresse email.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            fontSize: 12,
            color: 'var(--navy, #1C2B4A)',
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          <ShieldCheck size={16} style={{ color: '#059669', flexShrink: 0 }} />
          <span>Rapprochement automatique sécurisé par numéro de téléphone et email</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => chargerLocations()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: '#F1F5F9',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 800,
              fontSize: 13,
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </button>

          <Link
            href="/immo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <Building2 size={15} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Explorer les logements à louer à Dakar</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {paySuccessMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>{paySuccessMsg}</span>
        </div>
      )}

      {locations.map((loc) => (
        <MesLocationCard
          key={loc.bail_id}
          location={loc}
          payingId={payingId}
          onPayLoyer={handlePayerLoyer}
          onRefresh={chargerLocations}
        />
      ))}
    </div>
  )
}
