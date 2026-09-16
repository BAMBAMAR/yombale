'use client'

import React, { useState, useEffect } from 'react'
import { X, FileText, Check, Loader2 } from 'lucide-react'
import SimulateurHonorairesImmo from './SimulateurHonorairesImmo'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface BienOption {
  id: string
  titre: string
  prix_vente?: number
  prix_location?: number
}

interface ModalCreerFactureImmoProps {
  slug: string
  biens: BienOption[]
  onClose: () => void
  onSuccess: (message: string) => void
}

export default function ModalCreerFactureImmo({
  slug,
  biens,
  onClose,
  onSuccess,
}: ModalCreerFactureImmoProps) {
  const [typeFacture, setTypeFacture] = useState('honoraires_vente')
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [bienId, setBienId] = useState('')

  // Outils de calcul automatique d'honoraires
  const [baseCalcul, setBaseCalcul] = useState('')
  const [tauxCommission, setTauxCommission] = useState('5')

  const [montantHt, setMontantHt] = useState('')
  const [tauxTva, setTauxTva] = useState('18')
  const [timbreFiscal, setTimbreFiscal] = useState('100')
  const [dateEcheance, setDateEcheance] = useState('')
  const [modePaiement, setModePaiement] = useState('wave')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recalcul automatique lorsque le type de facture change
  useEffect(() => {
    if (typeFacture === 'honoraires_vente') {
      setTauxCommission('5')
    } else if (typeFacture === 'gestion_locative') {
      setTauxCommission('10')
    } else if (typeFacture === 'honoraires_location') {
      setTauxCommission('100')
    }
  }, [typeFacture])

  function handleCalculerHonoraires() {
    const base = parseFloat(baseCalcul) || 0
    const taux = parseFloat(tauxCommission) || 0
    if (base > 0 && taux > 0) {
      const ht = Math.round((base * taux) / 100)
      setMontantHt(String(ht))
    }
  }

  function handleSelectBien(id: string) {
    setBienId(id)
    const b = biens.find(item => item.id === id)
    if (b) {
      if (typeFacture === 'honoraires_vente' && b.prix_vente) {
        setBaseCalcul(String(b.prix_vente))
        const ht = Math.round((b.prix_vente * 5) / 100)
        setMontantHt(String(ht))
      } else if ((typeFacture === 'gestion_locative' || typeFacture === 'honoraires_location') && b.prix_location) {
        setBaseCalcul(String(b.prix_location))
        const ht = typeFacture === 'gestion_locative'
          ? Math.round((b.prix_location * 10) / 100)
          : b.prix_location
        setMontantHt(String(ht))
      }
    }
  }

  const ht = parseFloat(montantHt) || 0
  const tva = (ht * (parseFloat(tauxTva) || 0)) / 100
  const timbre = parseFloat(timbreFiscal) || 0
  const ttc = ht + tva + timbre

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientNom.trim()) {
      setError('Veuillez renseigner le nom du client ou mandant.')
      return
    }
    if (!ht || ht <= 0) {
      setError('Le montant hors taxes doit être supérieur à zéro.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/factures-immo/agence/${slug}`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          type_facture: typeFacture,
          client_nom: clientNom.trim(),
          client_tel: clientTel.trim() || null,
          client_email: clientEmail.trim() || null,
          bien_id: bienId || null,
          montant_ht: ht,
          taux_tva: parseFloat(tauxTva) || 0,
          timbre_fiscal: timbre,
          date_echeance: dateEcheance || null,
          mode_paiement: modePaiement,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création de la facture d\'honoraires')
      }

      onSuccess(`Facture d'honoraires ${data.facture.numero_facture} générée avec succès !`)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 580,
          width: '100%',
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border, #E8DDD2)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} color="var(--accent, #C75B00)" />
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Émettre une Facture d'Honoraires Immobiliers
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Note d'honoraires officielle conforme COCC (Transactions, gestion, débours).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type de Prestation Immobilière */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
              Type de Prestation Immobilière *
            </label>
            <select
              value={typeFacture}
              onChange={e => setTypeFacture(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13.5,
                fontWeight: 600,
                background: '#FFF',
              }}
            >
              <option value="honoraires_vente">Honoraires de Transaction &amp; Vente</option>
              <option value="gestion_locative">Honoraires de Gestion Locative Mensuelle</option>
              <option value="honoraires_location">Frais de Rédaction de Bail &amp; Entrée Preneur</option>
              <option value="debours_travaux">Refacturation Débours / Travaux Artisans</option>
              <option value="expertise">Honoraires d'Expertise &amp; Avis de Valeur</option>
            </select>
          </div>

          {/* Rapprochement Bien Immobilier */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
              Bien Immobilier Concerné (Optionnel)
            </label>
            <select
              value={bienId}
              onChange={e => handleSelectBien(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                background: '#FFF',
              }}
            >
              <option value="">-- Aucun bien particulier (Conseil / Frais généraux) --</option>
              {biens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Client / Mandant */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Client / Mandant Facturé *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Babacar Ndiaye"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Téléphone Client
              </label>
              <input
                type="tel"
                placeholder="+221 77 000 00 00"
                value={clientTel}
                onChange={e => setClientTel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Assistant de calcul des honoraires (Composant extrait) */}
          <SimulateurHonorairesImmo
            typeFacture={typeFacture}
            baseCalcul={baseCalcul}
            setBaseCalcul={setBaseCalcul}
            tauxCommission={tauxCommission}
            setTauxCommission={setTauxCommission}
            onCalculer={handleCalculerHonoraires}
          />

          {/* Décomposition Financière */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Montant HT (FCFA) *
              </label>
              <input
                type="number"
                required
                placeholder="Ex: 500000"
                value={montantHt}
                onChange={e => setMontantHt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                TVA (%)
              </label>
              <select
                value={tauxTva}
                onChange={e => setTauxTva(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  background: '#FFF',
                }}
              >
                <option value="18">18% (Régime réel)</option>
                <option value="0">0% (Exonéré / Non assujetti)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Timbre Fiscal (Art. 544 CGI)
              </label>
              <input
                type="number"
                value={timbreFiscal}
                onChange={e => setTimbreFiscal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Récapitulatif TTC en direct */}
          <div style={{ padding: '10px 14px', background: 'var(--bg, #F8F5F0)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--navy, #1C2B4A)' }}>Total Net TTC à Payer :</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
              {Number(ttc).toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Règlement */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Date d'échéance
              </label>
              <input
                type="date"
                value={dateEcheance}
                onChange={e => setDateEcheance(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
                Mode de règlement
              </label>
              <select
                value={modePaiement}
                onChange={e => setModePaiement(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  background: '#FFF',
                }}
              >
                <option value="wave">Wave Sénégal</option>
                <option value="orange_money">Orange Money</option>
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5, color: 'var(--navy, #1C2B4A)' }}>
              Désignation ou Notes sur la facture
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Commission de négociation sur la vente du bien référence VIL-001..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
                fontWeight: 650,
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 750,
                cursor: saving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              <span>{saving ? 'Création...' : 'Émettre la Facture d\'Honoraires'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
