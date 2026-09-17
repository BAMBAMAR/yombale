'use client'

import React, { useState } from 'react'
import {
  X,
  Zap,
  CreditCard,
  Building2,
  Phone,
  User,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import CreditWaveSuccessView from './CreditWaveSuccessView'

interface BienOption {
  id: string
  titre: string
}

interface ModalNouveauCreditWaveProps {
  slug: string
  biens: BienOption[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNouveauCreditWave({
  slug,
  biens,
  isOpen,
  onClose,
  onSuccess,
}: ModalNouveauCreditWaveProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Formulaire
  const [typeCredit, setTypeCredit] = useState('caution_echelonnee')
  const [bienId, setBienId] = useState(biens[0]?.id || '')
  const [bienTitreLibre, setBienTitreLibre] = useState('')
  const [beneficiaireNom, setBeneficiaireNom] = useState('')
  const [beneficiaireTel, setBeneficiaireTel] = useState('')
  const [montantTotal, setMontantTotal] = useState('')
  const [apportInitial, setApportInitial] = useState('')
  const [nbEcheances, setNbEcheances] = useState(3)
  const [notes, setNotes] = useState('')

  // État de Succès
  const [createdData, setCreatedData] = useState<{
    credit: any
    reference: string
    wave_url: string
    montant_immediat: number
  } | null>(null)

  if (!isOpen) return null

  const totalNum = parseFloat(montantTotal) || 0
  const apportNum = parseFloat(apportInitial) || 0
  const soldeRestant = Math.max(0, totalNum - apportNum)
  const mensualiteEstimee = nbEcheances > 0 && soldeRestant > 0 ? Math.round(soldeRestant / nbEcheances) : 0

  function getTitreBienChoisi() {
    if (bienTitreLibre.trim()) return bienTitreLibre.trim()
    const b = biens.find((item) => item.id === bienId)
    return b ? b.titre : 'Bien immobilier'
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!beneficiaireNom.trim()) {
      setErrorMsg('Veuillez renseigner le nom du locataire ou acheteur.')
      return
    }
    if (!totalNum || totalNum <= 0) {
      setErrorMsg('Veuillez indiquer un montant total valide.')
      return
    }

    try {
      setLoading(true)
      setErrorMsg(null)

      const payload = {
        type_credit: typeCredit,
        beneficiaire_nom: beneficiaireNom.trim(),
        beneficiaire_tel: beneficiaireTel.trim() || undefined,
        bien_id: bienId || undefined,
        montant_total: totalNum,
        apport_initial: apportNum,
        nb_echeances: nbEcheances,
        frequence: 'mensuel',
        notes: notes.trim() ? `${notes.trim()} (Bien : ${getTitreBienChoisi()})` : `Bien : ${getTitreBienChoisi()}`,
        mode_paiement_initial: 'wave',
      }

      const res = await fetch(`/api/credits-immo/agence/${slug}/direct-wave`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la création du financement')
      }

      setCreatedData({
        credit: json.credit,
        reference: json.reference,
        wave_url: json.wave_url,
        montant_immediat: json.montant_immediat,
      })
      onSuccess()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="agence-card"
        style={{
          width: '100%',
          maxWidth: 580,
          background: '#FFFFFF',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Zap size={18} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                {createdData ? 'Lien Wave & Accord Prêts' : 'Nouveau Financement & Lien Wave'}
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0 0' }}>
              {createdData
                ? 'Concluez votre accord WhatsApp et transmettez le règlement Wave sécurisé.'
                : 'Établissez une caution en 2x/3x ou un acompte et générez le lien Wave direct.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── ÉCRAN DE SUCCÈS : LIEN WAVE & ENVOI WHATSAPP ── */}
        {createdData ? (
          <CreditWaveSuccessView
            createdData={createdData}
            beneficiaireNom={beneficiaireNom}
            beneficiaireTel={beneficiaireTel}
            totalNum={totalNum}
            mensualiteEstimee={mensualiteEstimee}
            nbEcheances={nbEcheances}
            titreBien={getTitreBienChoisi()}
            typeCredit={typeCredit}
            onClose={onClose}
          />
        ) : (
          /* ── FORMULAIRE DE CRÉATION RAPIDE ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Type de Financement */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                Type d&apos;opération :
              </label>
              <select
                value={typeCredit}
                onChange={(e) => setTypeCredit(e.target.value)}
                className="form-select"
              >
                <option value="caution_echelonnee">Caution locative étalée (2x / 3x / 4x)</option>
                <option value="acompte_reservation">Acompte de réservation de bien</option>
                <option value="terrain_parcelles">Achat terrain / parcelle par tranches</option>
                <option value="vefa">Programme neuf VEFA par étapes</option>
                <option value="honoraires_agence">Honoraires d&apos;agence étalés</option>
              </select>
            </div>

            {/* Bien concerné */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                Bien immobilier rattaché :
              </label>
              {biens.length > 0 ? (
                <select
                  value={bienId}
                  onChange={(e) => {
                    setBienId(e.target.value)
                    setBienTitreLibre('')
                  }}
                  className="form-select"
                  style={{ marginBottom: 6 }}
                >
                  {biens.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.titre}
                    </option>
                  ))}
                  <option value="">Autre bien (saisie libre ci-dessous)</option>
                </select>
              ) : null}
              {(!bienId || biens.length === 0) && (
                <input
                  type="text"
                  placeholder="Ex : Villa F4 Almadies, Lot B2 Diamniadio..."
                  value={bienTitreLibre}
                  onChange={(e) => setBienTitreLibre(e.target.value)}
                  className="form-input"
                />
              )}
            </div>

            {/* Client : Nom & Téléphone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                  Bénéficiaire (Nom complet) *
                </label>
                <input
                  type="text"
                  placeholder="Ex : Amadou Diallo"
                  value={beneficiaireNom}
                  onChange={(e) => setBeneficiaireNom(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                  Numéro WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="Ex : 77 123 45 67"
                  value={beneficiaireTel}
                  onChange={(e) => setBeneficiaireTel(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Montants & Formule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                  Montant total (FCFA) *
                </label>
                <input
                  type="number"
                  placeholder="Ex : 300000"
                  value={montantTotal}
                  onChange={(e) => setMontantTotal(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                  Acompte / Apport Wave (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="Ex : 100000"
                  value={apportInitial}
                  onChange={(e) => setApportInitial(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Nombre d'échéances */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                  Nombre d&apos;échéances mensuelles restantes :
                </label>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                  {nbEcheances} mensualité{nbEcheances > 1 ? 's' : ''} {mensualiteEstimee > 0 ? `× ${mensualiteEstimee.toLocaleString('fr-FR')} FCFA` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 3, 4, 6, 12].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNbEcheances(n)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: nbEcheances === n ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                      background: nbEcheances === n ? 'var(--accent, #C75B00)' : '#FAF8F5',
                      color: nbEcheances === n ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                    }}
                  >
                    {n}x
                  </button>
                ))}
              </div>
            </div>

            {/* Note additionnelle */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 5 }}>
                Conditions ou notes (optionnel) :
              </label>
              <textarea
                placeholder="Précisions sur l'échelonnement ou motif..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
                style={{ minHeight: 60 }}
              />
            </div>

            {/* Boutons formulaire */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '1px solid var(--border, #E8DDD2)',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 13.5,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Zap size={16} />
                <span>{loading ? 'Génération du lien Wave...' : 'Créer & Générer Lien Wave'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ModalNouveauCreditWave
