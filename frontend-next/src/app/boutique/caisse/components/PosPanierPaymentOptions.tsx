'use client'

import React from 'react'
import {
  Banknote,
  Smartphone,
  CreditCard,
  Shuffle,
  FileText,
  Star,
  Tag,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import PosFastTender from './PosFastTender'

interface PosPanierPaymentOptionsProps {
  modePaiement: string
  onSelectModePaiement: (mode: string) => void
  panier: any[]
  totalPanier: number
  netAPayer: number
  onOuvrirFidelite: () => void
  clientFidelite: any | null
  cagnotteDeduite: number
  onOuvrirRemise: () => void
  remisePourcentage: number
  montantRemise: number
  montantRecu: string
  onSetMontantRecu: (val: string) => void
  monnaieARendre: number
  montantEspecesMixte: string
  onSetMontantEspecesMixte: (val: string) => void
  secondModeMixte: string
  onSetSecondModeMixte: (mode: string) => void
  resteAPayerMixte: number
  clientCreditIdPOS: string
  onSetClientCreditIdPOS: (id: string) => void
  clientsCredits: any[]
  creditDateEcheancePOS: string
  onSetCreditDateEcheancePOS: (date: string) => void
  creditNotePOS: string
  onSetCreditNotePOS: (note: string) => void
  regimeFiscal: string
  estExonereClient: boolean
  totalHT: number
  totalTVA: number
  tvaDefaut: number
  timbreFiscal: number
}

export default function PosPanierPaymentOptions({
  modePaiement,
  onSelectModePaiement,
  panier,
  totalPanier,
  netAPayer,
  onOuvrirFidelite,
  clientFidelite,
  cagnotteDeduite,
  onOuvrirRemise,
  remisePourcentage,
  montantRemise,
  montantRecu,
  onSetMontantRecu,
  monnaieARendre,
  montantEspecesMixte,
  onSetMontantEspecesMixte,
  secondModeMixte,
  onSetSecondModeMixte,
  resteAPayerMixte,
  clientCreditIdPOS,
  onSetClientCreditIdPOS,
  clientsCredits,
  creditDateEcheancePOS,
  onSetCreditDateEcheancePOS,
  creditNotePOS,
  onSetCreditNotePOS,
  regimeFiscal,
  estExonereClient,
  totalHT,
  totalTVA,
  tvaDefaut,
  timbreFiscal,
}: PosPanierPaymentOptionsProps) {
  return (
    <>
      {/* Mode de Paiement & Options */}
      <div style={{ borderTop: '1px solid var(--pos-border, #E8DDD2)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--pos-text2, #5A4E42)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mode de Règlement
          </label>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Bouton Fidélité */}
            <button
              type="button"
              onClick={onOuvrirFidelite}
              className="btn-npl btn-npl-sm btn-npl-secondary"
              style={{ height: 26, fontSize: 11 }}
            >
              <Star size={12} color="var(--accent, #C75B00)" />
              <span>{clientFidelite ? clientFidelite.nom.split(' ')[0] : 'Fidélité'}</span>
              {cagnotteDeduite > 0 && <span style={{ color: '#0A5C36', fontWeight: 900 }}>(-{fcfa(cagnotteDeduite)})</span>}
            </button>

            {/* Bouton Remise */}
            {panier.length > 0 && (
              <button
                type="button"
                onClick={onOuvrirRemise}
                className="btn-npl btn-npl-sm btn-npl-secondary"
                style={{ height: 26, fontSize: 11 }}
              >
                <Tag size={12} color="var(--accent, #C75B00)" />
                <span>{remisePourcentage > 0 ? `Remise (${remisePourcentage}%)` : 'Remise'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grille des Modes de Paiement — Icônes Vectorielles Nettes */}
        <div className="paiement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { id: 'especes', label: 'Espèces', icon: Banknote },
            { id: 'wave', label: 'Wave', icon: Smartphone },
            { id: 'orange_money', label: 'Orange Money', icon: Smartphone },
            { id: 'carte', label: 'Carte Bancaire', icon: CreditCard },
            { id: 'mixte', label: 'Mixte / Partagé', icon: Shuffle },
            { id: 'credit_client', label: 'Carnet Crédit', icon: FileText },
          ].map((m) => {
            const Icon = m.icon
            const isSelected = modePaiement === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectModePaiement(m.id)}
                className={`btn-npl ${isSelected ? 'btn-npl-primary' : 'btn-npl-secondary'}`}
                style={{
                  height: 48,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '4px',
                }}
              >
                <Icon size={16} />
                <span style={{ fontSize: 10.5, fontWeight: isSelected ? 800 : 600 }}>{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Saisie Espèces Standard + Fast Tender */}
        {modePaiement === 'especes' && totalPanier > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--pos-surface2, #F8F5F0)', border: '1px solid var(--pos-border, #E8DDD2)', padding: 8, borderRadius: 8 }}>
              <input
                type="number"
                placeholder="Montant reçu..."
                value={montantRecu}
                onChange={(e) => onSetMontantRecu(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--pos-border, #E8DDD2)', background: 'var(--pos-surface, #FFFFFF)', color: 'var(--pos-navy, #1C2B4A)', fontSize: 13, fontWeight: 700 }}
              />
              <div style={{ fontSize: 12, textAlign: 'right' }}>
                <span style={{ color: 'var(--pos-text3, #8C7E74)', display: 'block', fontSize: 10 }}>Monnaie à rendre</span>
                <span className="fcfa-num" style={{ fontWeight: 900, color: monnaieARendre > 0 ? '#16a34a' : 'var(--pos-navy, #1C2B4A)', fontSize: 14 }}>{fcfa(monnaieARendre)}</span>
              </div>
            </div>

            <PosFastTender
              totalNet={netAPayer}
              montantRecu={montantRecu}
              onSelectMontant={(m) => onSetMontantRecu(String(m))}
            />
          </div>
        )}

        {/* Saisie Mixte */}
        {modePaiement === 'mixte' && totalPanier > 0 && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', padding: 10, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>Répartition Paiement Mixte</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  placeholder="Espèces (FCFA)"
                  value={montantEspecesMixte}
                  onChange={(e) => onSetMontantEspecesMixte(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <select
                  value={secondModeMixte}
                  onChange={(e) => onSetSecondModeMixte(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="carte">Carte Bancaire</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderTop: '1px solid #FED7AA', paddingTop: 4 }}>
              <span style={{ color: 'var(--text2, #5A4E42)' }}>Reste en {secondModeMixte.toUpperCase()} :</span>
              <span className="fcfa-num" style={{ fontWeight: 900, color: 'var(--accent, #C75B00)' }}>{fcfa(resteAPayerMixte)}</span>
            </div>
          </div>
        )}

        {/* Saisie Carnet Crédit Client */}
        {modePaiement === 'credit_client' && totalPanier > 0 && (
          <div style={{ background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', padding: 10, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select
              value={clientCreditIdPOS}
              onChange={(e) => onSetClientCreditIdPOS(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', background: '#fff', fontSize: 12, fontWeight: 700 }}
            >
              <option value="">-- Sélectionner le client du carnet --</option>
              {clientsCredits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.telephone}) — {c.solde > 0 ? `Dette: ${fcfa(c.solde)}` : '0 FCFA'}
                </option>
              ))}
            </select>
            {clientCreditIdPOS && (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="date"
                  value={creditDateEcheancePOS}
                  onChange={(e) => onSetCreditDateEcheancePOS(e.target.value)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', fontSize: 11 }}
                />
                <input
                  type="text"
                  placeholder="Note facultative..."
                  value={creditNotePOS}
                  onChange={(e) => onSetCreditNotePOS(e.target.value)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', fontSize: 11 }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Récapitulatif Financier & Taxes */}
      <div className="pos-recap-fiscal" style={{ background: 'var(--pos-surface2, #FAF8F5)', padding: 10, borderRadius: 8, border: '1px solid var(--pos-border, #E8DDD2)', fontSize: 12, color: 'var(--pos-text2, #5A4E42)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {regimeFiscal === 'reel' && !estExonereClient && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total HT :</span>
              <span className="fcfa-num" style={{ fontWeight: 800, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalHT)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TVA ({tvaDefaut}%) :</span>
              <span className="fcfa-num" style={{ fontWeight: 800, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalTVA)}</span>
            </div>
          </>
        )}
        {timbreFiscal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 800 }}>
            <span>Timbre fiscal (1% cash) :</span>
            <span className="fcfa-num">{fcfa(timbreFiscal)}</span>
          </div>
        )}
        {remisePourcentage > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B91C1C', fontWeight: 800 }}>
            <span>Remise accordée ({remisePourcentage}%) :</span>
            <span className="fcfa-num">-{fcfa(montantRemise)}</span>
          </div>
        )}
      </div>
    </>
  )
}
