'use client'

import React, { useState } from 'react'
import { fcfa } from '@/lib/format'

export interface RemiseMotif {
  id: string
  nom: string
  pct: number
}

interface PosRemiseModalProps {
  sousTotal: number
  remiseActuelle: number
  motifActuel?: string
  plafondCaissierPct?: number
  motifsBoutique?: RemiseMotif[]
  isSuperviseur?: boolean
  onApplyRemise: (pourcentage: number, motif?: string) => void
  onRequestSupervisor?: (titre: string, onValide: () => void) => void
  onClose: () => void
}

const MOTIFS_DEFAUT: RemiseMotif[] = [
  { id: 'anti_gaspi', nom: '🍌 Date courte / Anti-gaspi', pct: 30 },
  { id: 'defaut', nom: '📦 Défaut packaging / Boîte', pct: 15 },
  { id: 'personnel', nom: '👥 Personnel / Collaborateur', pct: 10 },
  { id: 'geste', nom: '👑 Geste commercial client', pct: 5 },
]

export default function PosRemiseModal({
  sousTotal,
  remiseActuelle,
  motifActuel = '',
  plafondCaissierPct = 10,
  motifsBoutique = MOTIFS_DEFAUT,
  isSuperviseur = false,
  onApplyRemise,
  onRequestSupervisor,
  onClose,
}: PosRemiseModalProps) {
  const [mode, setMode] = useState<'motifs' | 'pourcentage' | 'montant'>('motifs')
  const [valeur, setValeur] = useState<string>(remiseActuelle > 0 ? String(remiseActuelle) : '10')
  const [motifSelectionne, setMotifSelectionne] = useState<string>(motifActuel)

  const listeMotifs = motifsBoutique && motifsBoutique.length > 0 ? motifsBoutique : MOTIFS_DEFAUT

  const appliquerDirectement = (pct: number, motifNom: string) => {
    onApplyRemise(pct, motifNom)
    onClose()
  }

  const handleApplyForm = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(valeur) || 0
    let pctCalcule = 0

    if (mode === 'pourcentage') {
      pctCalcule = Math.min(50, Math.max(0, num))
    } else if (mode === 'montant') {
      if (sousTotal > 0) {
        pctCalcule = Math.min(50, Math.max(0, Math.round((num / sousTotal) * 100)))
      }
    }

    // Vérifier si le pourcentage dépasse l'autonomie autorisée du caissier
    if (!isSuperviseur && pctCalcule > plafondCaissierPct && onRequestSupervisor) {
      onRequestSupervisor(
        `Autorisation Remise Exceptionnelle (${pctCalcule}% > Plafond Magasin ${plafondCaissierPct}%)`,
        () => {
          onApplyRemise(pctCalcule, motifSelectionne || 'Remise Personnalisée')
          onClose()
        }
      )
    } else {
      onApplyRemise(pctCalcule, motifSelectionne || 'Remise Commerciale')
      onClose()
    }
  }

  const PRESETS_PCT = [3, 5, 10, 15, 20]

  const montantCalcule = mode === 'pourcentage'
    ? Math.round((sousTotal * (Number(valeur) || 0)) / 100)
    : mode === 'montant'
    ? Math.min(sousTotal, Number(valeur) || 0)
    : 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--pos-surface, #ffffff)',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 460,
          border: '1.5px solid var(--pos-border, #fed7aa)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* En-tête Modale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--pos-text, #0f172a)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🏷️</span> Règles & Motifs de Remises
            </h3>
            <span style={{ fontSize: 11, color: 'var(--pos-text3, #64748b)', fontWeight: 600 }}>
              Standard Retail Auchan • Autonomie caissier : max {plafondCaissierPct}% sans superviseur
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'var(--pos-surface2, #f1f5f9)', border: 'none', color: 'var(--pos-text2, #64748b)', borderRadius: '50%', width: 32, height: 32, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Sélecteur d'onglets de Remise */}
        <div style={{ display: 'flex', background: 'var(--pos-surface2, #f1f5f9)', padding: 4, borderRadius: 10, gap: 4 }}>
          <button
            type="button"
            onClick={() => setMode('motifs')}
            style={{
              flex: 1.2,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'motifs' ? 'var(--pos-surface, #ffffff)' : 'transparent',
              color: mode === 'motifs' ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text2, #64748b)',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: mode === 'motifs' ? 'var(--pos-shadow)' : 'none',
            }}
          >
            ⚡ Motifs Métiers (1 Clic)
          </button>
          <button
            type="button"
            onClick={() => { setMode('pourcentage'); setValeur('5'); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'pourcentage' ? 'var(--pos-surface, #ffffff)' : 'transparent',
              color: mode === 'pourcentage' ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text2, #64748b)',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: mode === 'pourcentage' ? 'var(--pos-shadow)' : 'none',
            }}
          >
            Pourcentage (%)
          </button>
          <button
            type="button"
            onClick={() => { setMode('montant'); setValeur(String(Math.round(sousTotal * 0.05))); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'montant' ? 'var(--pos-surface, #ffffff)' : 'transparent',
              color: mode === 'montant' ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text2, #64748b)',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: mode === 'montant' ? 'var(--pos-shadow)' : 'none',
            }}
          >
            Montant Fixe
          </button>
        </div>

        {/* ── MODE 1 : GRILLE DES MOTIFS MÉTIERS 1-CLIC (STANDARD AUCHAN) ── */}
        {mode === 'motifs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pos-text2, #475569)' }}>
              Sélectionnez un motif commercial autorisé (validé automatiquement) :
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {listeMotifs.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => appliquerDirectement(m.pct, m.nom)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 10,
                    border: '1.5px solid var(--pos-border, #cbd5e1)',
                    background: 'var(--pos-surface2, #ffffff)',
                    color: 'var(--pos-text, #0f172a)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    cursor: 'pointer',
                    boxShadow: 'var(--pos-shadow)',
                    transition: 'all 0.12s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--pos-primary, #f97316)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--pos-border, #cbd5e1)'
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--pos-text)' }}>{m.nom}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--pos-primary, #f97316)' }}>
                    -{m.pct}% ({fcfa(Math.round(sousTotal * m.pct / 100))})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MODE 2 & 3 : FORMULAIRE POURCENTAGE OU MONTANT FIXE ── */}
        {(mode === 'pourcentage' || mode === 'montant') && (
          <form onSubmit={handleApplyForm} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Presets rapides de pourcentage */}
            {mode === 'pourcentage' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {PRESETS_PCT.map((p) => {
                  const depassePlafond = !isSuperviseur && p > plafondCaissierPct
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValeur(String(p))}
                      style={{
                        padding: '8px 0',
                        borderRadius: 8,
                        border: Number(valeur) === p ? '2px solid var(--pos-primary, #C75B00)' : '1px solid var(--pos-border, #cbd5e1)',
                        background: Number(valeur) === p ? 'var(--pos-primary-bg, #fff7ed)' : 'var(--pos-surface2, #ffffff)',
                        color: Number(valeur) === p ? 'var(--pos-primary, #C75B00)' : 'var(--pos-text, #0f172a)',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      title={depassePlafond ? 'Dépasse le plafond sans superviseur' : 'Remise autorisée'}
                    >
                      {p}%
                      {depassePlafond && (
                        <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 8 }}>🔒</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--pos-text2, #475569)', display: 'block', marginBottom: 4 }}>
                {mode === 'pourcentage' ? `Pourcentage personnalisé (Plafond autonome : ${plafondCaissierPct}%)` : 'Montant de réduction en FCFA'}
              </label>
              <input
                type="number"
                min={0}
                max={mode === 'pourcentage' ? 50 : sousTotal}
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 10,
                  border: '2px solid var(--pos-primary, #fed7aa)',
                  background: 'var(--pos-surface2, #fff7ed)',
                  color: 'var(--pos-text, #0f172a)',
                  fontSize: 17,
                  fontWeight: 900,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Récapitulatif dynamique */}
            <div style={{ background: 'var(--pos-surface2, #f8fafc)', padding: 10, borderRadius: 10, border: '1px solid var(--pos-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--pos-text2, #64748b)', fontWeight: 600 }}>Déduction sur le panier :</span>
              <span style={{ fontSize: 14.5, fontWeight: 900, color: '#f87171' }}>-{fcfa(montantCalcule)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: '11px', background: 'var(--pos-surface2, #f1f5f9)', color: 'var(--pos-text2, #475569)', border: '1px solid var(--pos-border, #cbd5e1)', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{ flex: 1.5, padding: '11px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.35)' }}
              >
                ✓ Appliquer
              </button>
            </div>
          </form>
        )}

        {/* Bouton de suppression de remise active */}
        {remiseActuelle > 0 && (
          <button
            type="button"
            onClick={() => { onApplyRemise(0); onClose(); }}
            style={{ width: '100%', padding: '9px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
          >
            🗑️ Supprimer la remise active (-{remiseActuelle}%)
          </button>
        )}
      </div>
    </div>
  )
}
