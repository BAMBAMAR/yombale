'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useFormState } from 'react-dom'
import { updateBoutique, createPromotion, deletePromotion, getBoutiquePromotions } from './actions'
import type { ActionState } from '@/lib/backend-fetch'
import { Gift, ShieldCheck, Tag } from 'lucide-react'
import FideliteTab from './fidelite/FideliteTab'
import RemisesPosTab, { type MotifRemise } from './fidelite/RemisesPosTab'
import PromotionsTab from './fidelite/PromotionsTab'

const MOTIFS_DEFAUT: MotifRemise[] = [
  { id: 'anti_gaspi', nom: 'Date courte / Anti-gaspi', pct: 30 },
  { id: 'defaut', nom: 'Défaut emballage', pct: 15 },
  { id: 'personnel', nom: 'Personnel / Employé', pct: 10 },
  { id: 'geste', nom: 'Geste commercial', pct: 5 },
]

export default function ParametresFidelitePromos({
  boutique,
  onUpdate,
}: {
  boutique: any
  onUpdate: () => void
}) {
  const [subTab, setSubTab] = useState<'fidelite' | 'remises_pos' | 'promotions'>('fidelite')

  // ── État Fidélité & Caisse ──
  const action = updateBoutique.bind(null, boutique.id)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  const [fideliteActif, setFideliteActif] = useState<boolean>(boutique.fidelite_actif !== false)
  const [fideliteType, setFideliteType] = useState<'cagnotte' | 'tampons'>(boutique.fidelite_type || 'cagnotte')
  const [fideliteTaux, setFideliteTaux] = useState<number>(
    boutique.fidelite_taux_cashback !== undefined ? Number(boutique.fidelite_taux_cashback) : 3
  )
  const [fideliteTamponsMax, setFideliteTamponsMax] = useState<number>(boutique.fidelite_tampons_max || 10)
  const [fideliteSeuilTampon, setFideliteSeuilTampon] = useState<number>(boutique.fidelite_seuil_tampon || 2000)

  const [remiseMaxCaissier, setRemiseMaxCaissier] = useState<number>(
    boutique.pos_remise_max_caissier !== undefined ? Number(boutique.pos_remise_max_caissier) : 10
  )
  const [motifs, setMotifs] = useState<MotifRemise[]>(() => {
    if (boutique.pos_remise_motifs) {
      try {
        return typeof boutique.pos_remise_motifs === 'string'
          ? JSON.parse(boutique.pos_remise_motifs)
          : boutique.pos_remise_motifs
      } catch (err) {
        console.warn('[Nopalou:ParametresFidelitePromos]', err)
      }
    }
    return MOTIFS_DEFAUT
  })
  const [nouveauMotifNom, setNouveauMotifNom] = useState('')
  const [nouveauMotifPct, setNouveauMotifPct] = useState(10)

  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    setFideliteActif(boutique.fidelite_actif !== false)
    setFideliteType(boutique.fidelite_type || 'cagnotte')
    setFideliteTaux(boutique.fidelite_taux_cashback !== undefined ? Number(boutique.fidelite_taux_cashback) : 3)
    setFideliteTamponsMax(boutique.fidelite_tampons_max || 10)
    setFideliteSeuilTampon(boutique.fidelite_seuil_tampon || 2000)
    setRemiseMaxCaissier(
      boutique.pos_remise_max_caissier !== undefined ? Number(boutique.pos_remise_max_caissier) : 10
    )
    if (boutique.pos_remise_motifs) {
      try {
        const parsed =
          typeof boutique.pos_remise_motifs === 'string'
            ? JSON.parse(boutique.pos_remise_motifs)
            : boutique.pos_remise_motifs
        if (Array.isArray(parsed)) setMotifs(parsed)
      } catch (err) {
        console.warn('[Nopalou:ParametresFidelitePromos]', err)
      }
    }
  }, [boutique])

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSavedMessage('Paramètres enregistrés avec succès !')
      onUpdate()
      const tId = setTimeout(() => setSavedMessage(null), 5000)
      return () => clearTimeout(tId)
    }
  }, [state, onUpdate])

  // ── État Promotions ──
  const [promotions, setPromotions] = useState<any[]>([])
  const [loadingPromos, setLoadingPromos] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const promoAction = createPromotion.bind(null, boutique.id)
  const [promoState, promoFormAction] = useFormState<ActionState, FormData>(promoAction, {})

  const chargerPromotions = async () => {
    setLoadingPromos(true)
    try {
      const res = await getBoutiquePromotions(boutique.id)
      if (res.promotions) {
        setPromotions(res.promotions)
      }
    } finally {
      setLoadingPromos(false)
    }
  }

  useEffect(() => {
    if (subTab === 'promotions') {
      chargerPromotions()
    }
  }, [subTab, boutique.id])

  useEffect(() => {
    if (promoState.success) {
      chargerPromotions()
    }
  }, [promoState])

  const handleSupprimerPromo = async (promoId: string) => {
    if (!confirm('Supprimer définitivement ce code promo ?')) return
    const res = await deletePromotion(boutique.id, promoId)
    if (res.success) {
      setPromotions((prev) => prev.filter((p) => p.id !== promoId))
    } else {
      alert(res.error || 'Erreur lors de la suppression')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleAjouterMotif = () => {
    if (!nouveauMotifNom.trim()) return
    const newId = 'motif_' + Date.now()
    setMotifs((prev) => [
      ...prev,
      { id: newId, nom: nouveauMotifNom.trim(), pct: Number(nouveauMotifPct) || 5 },
    ])
    setNouveauMotifNom('')
    setNouveauMotifPct(10)
  }

  const handleSupprimerMotif = (id: string) => {
    setMotifs((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── SOUS-ONGLETS ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab('fidelite')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: subTab === 'fidelite' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: subTab === 'fidelite' ? '#FFF3E8' : '#ffffff',
            color: subTab === 'fidelite' ? 'var(--accent, #C75B00)' : '#475569',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Gift size={16} />
          <span>1. Programme de Fidélité</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('remises_pos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: subTab === 'remises_pos' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: subTab === 'remises_pos' ? '#FFF3E8' : '#ffffff',
            color: subTab === 'remises_pos' ? 'var(--accent, #C75B00)' : '#475569',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={16} />
          <span>2. Règles Caisse &amp; Remises</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('promotions')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: subTab === 'promotions' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: subTab === 'promotions' ? '#FFF3E8' : '#ffffff',
            color: subTab === 'promotions' ? 'var(--accent, #C75B00)' : '#475569',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Tag size={16} />
          <span>3. Codes Promo &amp; Coupons</span>
        </button>
      </div>

      {savedMessage && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#166534',
            fontSize: 13.5,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {savedMessage}
        </div>
      )}

      {state.error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#dc2626',
            fontSize: 13.5,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {state.error}
        </div>
      )}

      {/* Onglet 1 : Programme de Fidélité */}
      {subTab === 'fidelite' && (
        <FideliteTab
          formAction={formAction}
          remiseMaxCaissier={remiseMaxCaissier}
          motifs={motifs}
          fideliteActif={fideliteActif}
          setFideliteActif={setFideliteActif}
          fideliteType={fideliteType}
          setFideliteType={setFideliteType}
          fideliteTaux={fideliteTaux}
          setFideliteTaux={setFideliteTaux}
          fideliteTamponsMax={fideliteTamponsMax}
          setFideliteTamponsMax={setFideliteTamponsMax}
          fideliteSeuilTampon={fideliteSeuilTampon}
          setFideliteSeuilTampon={setFideliteSeuilTampon}
        />
      )}

      {/* Onglet 2 : Règles de Caisse POS & Remises */}
      {subTab === 'remises_pos' && (
        <RemisesPosTab
          formAction={formAction}
          fideliteActif={fideliteActif}
          fideliteType={fideliteType}
          fideliteTaux={fideliteTaux}
          fideliteTamponsMax={fideliteTamponsMax}
          fideliteSeuilTampon={fideliteSeuilTampon}
          remiseMaxCaissier={remiseMaxCaissier}
          setRemiseMaxCaissier={setRemiseMaxCaissier}
          motifs={motifs}
          handleSupprimerMotif={handleSupprimerMotif}
          nouveauMotifNom={nouveauMotifNom}
          setNouveauMotifNom={setNouveauMotifNom}
          nouveauMotifPct={nouveauMotifPct}
          setNouveauMotifPct={setNouveauMotifPct}
          handleAjouterMotif={handleAjouterMotif}
        />
      )}

      {/* Onglet 3 : Codes Promo & Coupons */}
      {subTab === 'promotions' && (
        <PromotionsTab
          promoFormAction={promoFormAction}
          promoState={promoState}
          promotions={promotions}
          loadingPromos={loadingPromos}
          copiedCode={copiedCode}
          handleCopyCode={handleCopyCode}
          handleSupprimerPromo={handleSupprimerPromo}
        />
      )}
    </div>
  )
}
