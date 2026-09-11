'use client'

import React from 'react'
import {
  ShoppingCart,
  Trash2,
  PauseCircle,
  Plus,
  Minus,
  Banknote,
  Smartphone,
  CreditCard,
  Shuffle,
  FileText,
  Tag,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  ArrowLeft
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import PosFastTender from './PosFastTender'

export interface ItemPanier {
  produit: {
    id: string
    nom: string
    code_barre?: string | null
    stock?: number
    prix?: number
  }
  quantite: number
  prixUnitaire: number
  remise?: number
}

interface Props {
  tabMobile: 'catalogue' | 'dock' | 'ticket'
  onBackToCatalogue: () => void
  panier: ItemPanier[]
  session: any | null
  produitsFiltresCount: number
  onMettreEnAttente: () => void
  onViderPanier: () => void
  onOuvrirSession: () => void
  onModifierQuantite: (produitId: string, delta: number) => void
  onOuvrirRemise: () => void
  remisePourcentage: number
  montantRemise: number
  clientFidelite: any | null
  cagnotteDeduite: number
  onOuvrirFidelite: () => void
  modePaiement: string
  onSelectModePaiement: (mode: string) => void
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
  netAPayer: number
  totalPanier: number
  encaissementEnCours: boolean
  onEnregistrerDocument: (type: 'devis' | 'proforma') => void
  onEncaisser: () => void
  t: (key: string) => string
}

export default function PosPanierSidebar({
  tabMobile,
  onBackToCatalogue,
  panier,
  session,
  produitsFiltresCount,
  onMettreEnAttente,
  onViderPanier,
  onOuvrirSession,
  onModifierQuantite,
  onOuvrirRemise,
  remisePourcentage,
  montantRemise,
  clientFidelite,
  cagnotteDeduite,
  onOuvrirFidelite,
  modePaiement,
  onSelectModePaiement,
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
  netAPayer,
  totalPanier,
  encaissementEnCours,
  onEnregistrerDocument,
  onEncaisser,
  t
}: Props) {
  const totalArticles = panier.reduce((sum, item) => sum + item.quantite, 0)

  return (
    <div
      className={`ticket-section ${tabMobile === 'ticket' ? 'mobile-active' : 'mobile-hidden'}`}
      style={{
        background: 'var(--pos-surface, #ffffff)',
        padding: '12px 10px 20px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxSizing: 'border-box',
        maxWidth: '100%',
        height: '100%',
        minHeight: 0,
        overflowY: 'auto'
      }}
    >
      {/* Bouton retour mobile */}
      <button
        type="button"
        onClick={onBackToCatalogue}
        className="caisse-back-to-catalogue-btn no-print btn-npl btn-npl-sm btn-npl-secondary"
        style={{ width: '100%', marginBottom: 4 }}
      >
        <ArrowLeft size={14} />
        <span>Revenir au catalogue ({produitsFiltresCount})</span>
      </button>

      {/* En-tête Ticket */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--pos-border, #E8DDD2)', paddingBottom: 10, gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShoppingCart size={18} color="var(--accent, #C75B00)" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--pos-text, #1C2B4A)' }}>
            Ticket en cours
          </h2>
          {totalArticles > 0 && (
            <span className="badge-npl badge-npl-neutral" style={{ fontSize: 11, padding: '1px 6px' }}>
              {totalArticles}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {panier.length > 0 && (
            <button
              type="button"
              onClick={onMettreEnAttente}
              title="Mettre en attente le ticket"
              className="btn-npl btn-npl-sm btn-npl-secondary"
              style={{ height: 26, fontSize: 11 }}
            >
              <PauseCircle size={13} />
              <span>En attente</span>
            </button>
          )}
          {panier.length > 0 && (
            <button
              type="button"
              onClick={onViderPanier}
              className="btn-npl btn-npl-sm btn-npl-ghost"
              style={{ height: 26, fontSize: 11, color: '#B91C1C' }}
            >
              <Trash2 size={13} />
              <span>Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des Articles du Panier */}
      <div style={{ flex: 1, minHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 2px' }}>
        {!session ? (
          <div style={{
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #152238 100%)',
            color: '#ffffff',
            borderRadius: 14,
            padding: '24px 18px',
            textAlign: 'center',
            margin: 'auto 0'
          }}>
            <Lock size={32} style={{ margin: '0 auto 8px', color: '#FED7AA' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
              Session de Caisse Fermée
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Déclarez votre fond de caisse initial pour ouvrir la session et commencer à encaisser.
            </p>
            <button
              type="button"
              onClick={onOuvrirSession}
              className="btn-npl btn-npl-md btn-npl-primary"
              style={{ width: '100%', fontSize: 13 }}
            >
              <span>Ouvrir la Session de Caisse</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : panier.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text3, #8C7E74)' }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Votre ticket est vide
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
              Touchez un article du catalogue ou scannez son code-barres.
            </p>
          </div>
        ) : (
          panier.map(item => (
            <div
              key={item.produit.id}
              style={{
                background: 'var(--pos-surface2, #FAF8F5)',
                border: '1px solid var(--pos-border, #E8DDD2)',
                borderRadius: 8,
                padding: '8px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                boxSizing: 'border-box',
                minHeight: 46
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: 'var(--pos-text, #1C2B4A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.produit.nom}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 800 }}>
                    {fcfa(item.prixUnitaire)}
                  </span>
                  {typeof item.produit.stock === 'number' && item.quantite > item.produit.stock && (
                    <span style={{ fontSize: 9, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                      Stock dépassé
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFFFFF', padding: '2px 4px', borderRadius: 6, border: '1px solid var(--pos-border, #E8DDD2)' }}>
                  <button
                    type="button"
                    onClick={() => onModifierQuantite(item.produit.id, -1)}
                    style={{ background: 'none', border: 'none', color: 'var(--navy, #1C2B4A)', fontWeight: 800, cursor: 'pointer', padding: '0 4px', fontSize: 13 }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center', color: 'var(--navy, #1C2B4A)' }}>
                    {item.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => onModifierQuantite(item.produit.id, 1)}
                    style={{ background: 'none', border: 'none', color: 'var(--navy, #1C2B4A)', fontWeight: 800, cursor: 'pointer', padding: '0 4px', fontSize: 13 }}
                  >
                    +
                  </button>
                </div>
                <span className="fcfa-num" style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {fcfa(item.prixUnitaire * item.quantite)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mode de Paiement & Options */}
      <div style={{ borderTop: '1px solid var(--pos-border, #E8DDD2)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text2, #5A4E42)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
          ].map(m => {
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
                  padding: '4px'
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', padding: 8, borderRadius: 8 }}>
              <input
                type="number"
                placeholder="Montant reçu..."
                value={montantRecu}
                onChange={e => onSetMontantRecu(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', background: '#FFFFFF', color: 'var(--navy, #1C2B4A)', fontSize: 13, fontWeight: 700 }}
              />
              <div style={{ fontSize: 12, textAlign: 'right' }}>
                <span style={{ color: 'var(--text3, #8C7E74)', display: 'block', fontSize: 10 }}>Monnaie à rendre</span>
                <span className="fcfa-num" style={{ fontWeight: 900, color: '#0A5C36', fontSize: 14 }}>{fcfa(monnaieARendre)}</span>
              </div>
            </div>

            <PosFastTender
              totalNet={netAPayer}
              montantRecu={montantRecu}
              onSelectMontant={m => onSetMontantRecu(String(m))}
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
                  onChange={e => onSetMontantEspecesMixte(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <select
                  value={secondModeMixte}
                  onChange={e => onSetSecondModeMixte(e.target.value)}
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
              onChange={e => onSetClientCreditIdPOS(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', background: '#fff', fontSize: 12, fontWeight: 700 }}
            >
              <option value="">-- Sélectionner le client du carnet --</option>
              {clientsCredits.map(c => (
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
                  onChange={e => onSetCreditDateEcheancePOS(e.target.value)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', fontSize: 11 }}
                />
                <input
                  type="text"
                  placeholder="Note facultative..."
                  value={creditNotePOS}
                  onChange={e => onSetCreditNotePOS(e.target.value)}
                  style={{ flex: 1, padding: '4px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', fontSize: 11 }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Récapitulatif Financier & Taxes */}
      <div style={{ background: 'var(--pos-surface2, #FAF8F5)', padding: 10, borderRadius: 8, border: '1px solid var(--pos-border, #E8DDD2)', fontSize: 12, color: 'var(--text2, #5A4E42)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {regimeFiscal === 'reel' && !estExonereClient && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total HT :</span>
              <span className="fcfa-num" style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{fcfa(totalHT)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TVA ({tvaDefaut}%) :</span>
              <span className="fcfa-num" style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{fcfa(totalTVA)}</span>
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

      {/* Zone Sticky Totaux + Bouton Encaisser */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--pos-surface, #ffffff)', paddingTop: 8, borderTop: '1px solid var(--pos-border, #E8DDD2)', zIndex: 10, marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--text3, #8C7E74)', fontWeight: 700, display: 'block' }}>TOTAL À PERCEVOIR</span>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)' }}>{totalArticles} article(s)</span>
          </div>
          <span className="fcfa-num" style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {fcfa(netAPayer)}
          </span>
        </div>

        {/* Raccourcis Devis / Proforma */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => onEnregistrerDocument('devis')}
            disabled={netAPayer === 0}
            className="btn-npl btn-npl-sm btn-npl-secondary"
            style={{ flex: 1, height: 30, fontSize: 11, opacity: netAPayer === 0 ? 0.5 : 1 }}
          >
            <FileText size={12} />
            <span>Devis</span>
          </button>
          <button
            type="button"
            onClick={() => onEnregistrerDocument('proforma')}
            disabled={netAPayer === 0}
            className="btn-npl btn-npl-sm btn-npl-secondary"
            style={{ flex: 1, height: 30, fontSize: 11, opacity: netAPayer === 0 ? 0.5 : 1 }}
          >
            <FileText size={12} />
            <span>Proforma</span>
          </button>
        </div>

        {/* Bouton ENCAISSER Principal */}
        <button
          type="button"
          onClick={onEncaisser}
          disabled={netAPayer === 0 || encaissementEnCours}
          className="btn-npl btn-npl-lg btn-npl-primary"
          style={{ width: '100%', height: 50, fontSize: 15, fontWeight: 900 }}
        >
          {encaissementEnCours ? (
            <span>Validation en cours...</span>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Encaisser {netAPayer > 0 ? fcfa(netAPayer) : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
