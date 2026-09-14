'use client'

import React, { useState } from 'react'
import { RotateCcw, Check, X, Printer } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface RetoursAvoirsModalProps {
  isOpen: boolean
  onClose: () => void
  boutiqueId: string
  token: string
  caissierNom?: string
  produitsCatalogue?: Array<{ id: string; nom: string; prix_unitaire?: number; prix?: number }>
  onRetourValide?: (retour: any) => void
}

const MOTIFS_RETOUR = [
  'Mauvaise taille / pointure',
  'Article défectueux / abîmé',
  'Non conforme à la commande',
  'Changement d\'avis client',
  'Autre motif'
]

export default function RetoursAvoirsModal({
  isOpen,
  onClose,
  boutiqueId,
  token,
  caissierNom,
  produitsCatalogue = [],
  onRetourValide
}: RetoursAvoirsModalProps) {
  const [referenceOrigine, setReferenceOrigine] = useState('')
  const [selectedProduitId, setSelectedProduitId] = useState('')
  const [produitNomLibre, setProduitNomLibre] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [motif, setMotif] = useState(MOTIFS_RETOUR[0])
  const [actionStock, setActionStock] = useState<'remis_en_stock' | 'rebut'>('remis_en_stock')
  const [typeCompensation, setTypeCompensation] = useState<'avoir' | 'remboursement'>('avoir')
  const [montant, setMontant] = useState('')
  const [saving, setSaving] = useState(false)
  const [ticketAvoir, setTicketAvoir] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  if (!isOpen) return null

  const handleProduitChange = (prodId: string) => {
    setSelectedProduitId(prodId)
    const found = produitsCatalogue.find(p => p.id === prodId)
    if (found) {
      setProduitNomLibre(found.nom)
      const pPrix = found.prix_unitaire || found.prix || 0
      setMontant((pPrix * (parseInt(quantite, 10) || 1)).toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nomFinal = produitNomLibre.trim() || produitsCatalogue.find(p => p.id === selectedProduitId)?.nom
    if (!nomFinal) {
      setErrorMsg('Veuillez sélectionner ou saisir le nom du produit')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    const payload = {
      reference_origine: referenceOrigine.trim() || null,
      produit_id: selectedProduitId || null,
      produit_nom: nomFinal,
      quantite: parseInt(quantite, 10) || 1,
      motif,
      action_stock: actionStock,
      type_compensation: typeCompensation,
      montant_fcfa: parseFloat(montant) || 0,
      effectue_par: caissierNom || 'Caissier'
    }

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/retours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok && data.retour) {
        setTicketAvoir(data.retour)
        if (onRetourValide) onRetourValide(data.retour)
      } else {
        setErrorMsg(data.error || 'Erreur lors de l\'enregistrement du retour')
      }
    } catch (err) {
      console.warn('[RETOUR MODAL ERR]', err)
      setErrorMsg('Erreur de communication avec le serveur')
    } finally {
      setSaving(false)
    }
  }

  const handlePrintAvoir = () => {
    window.print()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, maxWidth: 480, width: '100%', padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Titre */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={18} color="#C75B00" />
            {ticketAvoir ? 'Bon d\'Avoir / Récépissé de Retour' : 'Enregistrer un Retour Client'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {ticketAvoir ? (
          /* Vue Récapitulatif / Bon d'avoir */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                NOPALOU COMMERCE • {ticketAvoir.type_compensation === 'avoir' ? 'BON D\'AVOIR' : 'REÇU DE REMBOURSEMENT'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '6px 0' }}>
                {fcfa(ticketAvoir.montant_fcfa)}
              </div>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                {ticketAvoir.quantite}x {ticketAvoir.produit_nom}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Motif : {ticketAvoir.motif} • Stock : {ticketAvoir.action_stock === 'remis_en_stock' ? 'Réintégré' : 'Mis au rebut'}
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 8 }}>
                Code Avoir : AVOIR-{ticketAvoir.id.slice(-6).toUpperCase()} • Servi par {ticketAvoir.effectue_par || 'Caissier'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handlePrintAvoir}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Printer size={15} /> Imprimer le bon
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1C2B4A', color: '#ffffff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Terminer
              </button>
            </div>
          </div>
        ) : (
          /* Formulaire de retour */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 8, color: '#dc2626', fontSize: 12 }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                Réf. Ticket / Commande d&apos;origine (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: TICK-1234 ou CMD-2026-XXXX"
                value={referenceOrigine}
                onChange={e => setReferenceOrigine(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                Produit retourné *
              </label>
              {produitsCatalogue.length > 0 ? (
                <select
                  value={selectedProduitId}
                  onChange={e => handleProduitChange(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Sélectionner un produit du catalogue --</option>
                  {produitsCatalogue.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} ({fcfa(p.prix_unitaire || p.prix || 0)})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nom de l'article"
                  value={produitNomLibre}
                  onChange={e => setProduitNomLibre(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' }}
                  required
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={e => setQuantite(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>Montant Total (FCFA)</label>
                <input
                  type="number"
                  placeholder="Montant du retour"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>Motif du retour</label>
              <select
                value={motif}
                onChange={e => setMotif(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, background: '#ffffff', boxSizing: 'border-box' }}
              >
                {MOTIFS_RETOUR.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>Action Stock</label>
                <select
                  value={actionStock}
                  onChange={e => setActionStock(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="remis_en_stock">Remettre en stock (+1)</option>
                  <option value="rebut">Mettre au rebut (abîmé)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>Compensation</label>
                <select
                  value={typeCompensation}
                  onChange={e => setTypeCompensation(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="avoir">Bon d&apos;Avoir (recommandé)</option>
                  <option value="remboursement">Remboursement Espèces</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#C75B00', color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Enregistrement...' : 'Valider le retour'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
