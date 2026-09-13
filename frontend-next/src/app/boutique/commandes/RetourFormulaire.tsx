'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '@/i18n/context'

interface CommandeRetour {
  id: string
  reference: string
  nom_produit: string
  quantite: number
  montant_total: number
  client_nom: string
  client_telephone: string
}

interface RetourFormulaireProps {
  commande: CommandeRetour
  motif: 'defectueux' | 'erreur_taille' | 'retractation' | 'autre'
  setMotif: (m: 'defectueux' | 'erreur_taille' | 'retractation' | 'autre') => void
  montantAvoir: number
  setMontantAvoir: (m: number) => void
  reintegrerStock: boolean
  setReintegrerStock: (r: boolean) => void
  loading: boolean
  erreur: string | null
  handleCreerAvoir: (e: React.FormEvent) => void
  onClose: () => void
}

export default function RetourFormulaire({
  commande,
  motif,
  setMotif,
  montantAvoir,
  setMontantAvoir,
  reintegrerStock,
  setReintegrerStock,
  loading,
  erreur,
  handleCreerAvoir,
  onClose,
}: RetourFormulaireProps) {
  const { formatPrice } = useTranslation()

  return (
    <form onSubmit={handleCreerAvoir} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {erreur && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12.5,
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          <span>{erreur}</span>
        </div>
      )}

      {/* Résumé Article */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Article retourné :</span>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
            {commande.quantite}× {commande.nom_produit}
          </p>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#C75B00' }}>
          {formatPrice(commande.montant_total)}
        </span>
      </div>

      {/* Motif du Retour */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
          Motif du retour :
        </label>
        <select
          value={motif}
          onChange={(e) => setMotif(e.target.value as any)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            color: '#1e293b',
            background: '#ffffff',
            outline: 'none',
          }}
        >
          <option value="erreur_taille">Erreur de taille / pointure / modèle</option>
          <option value="defectueux">Article défectueux ou abîmé</option>
          <option value="retractation">Changement d'avis / Rétractation client</option>
          <option value="autre">Autre motif commercial</option>
        </select>
      </div>

      {/* Montant du Bon d'Avoir */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
            Montant de l'avoir (FCFA) :
          </label>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Max: {formatPrice(commande.montant_total)}
          </span>
        </div>
        <input
          type="number"
          min={1}
          max={commande.montant_total}
          value={montantAvoir}
          onChange={(e) => setMontantAvoir(Math.max(0, Number(e.target.value)))}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
            outline: 'none',
          }}
        />
      </div>

      {/* Option Réintégration de Stock */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          padding: '8px 10px',
          borderRadius: 8,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <input
          type="checkbox"
          checked={reintegrerStock}
          onChange={(e) => setReintegrerStock(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: '#C75B00', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
          Remettre automatiquement l'article en stock marchand (+{commande.quantite})
        </span>
      </label>

      {/* Bouton de Soumission */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#64748b',
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || montantAvoir <= 0}
          style={{
            flex: 2,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #C75B00, #9A4300)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: loading || montantAvoir <= 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(199, 91, 0, 0.25)',
          }}
        >
          {loading ? 'Création en cours...' : 'Valider le Retour & Créer l\'Avoir'}
        </button>
      </div>
    </form>
  )
}
