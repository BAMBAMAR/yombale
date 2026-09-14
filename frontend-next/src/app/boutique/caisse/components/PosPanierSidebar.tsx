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
import PosPanierPaymentOptions from './PosPanierPaymentOptions'

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
  monnaieARendre?: number
  montantEspecesMixte: string
  onSetMontantEspecesMixte: (val: string) => void
  secondModeMixte: string
  onSetSecondModeMixte: (mode: string) => void
  resteAPayerMixte?: number
  clientCreditIdPOS: string
  onSetClientCreditIdPOS: (id: string) => void
  clientsCredits: any[]
  creditDateEcheancePOS: string
  onSetCreditDateEcheancePOS: (date: string) => void
  creditNotePOS: string
  onSetCreditNotePOS: (note: string) => void
  finances?: {
    regimeFiscal: string
    estExonereClient: boolean
    totalHT: number
    totalTVA: number
    tvaDefaut: number
    timbreFiscal: number
    resteAPayerMixte: number
    monnaieARendre: number
  }
  regimeFiscal?: string
  estExonereClient?: boolean
  totalHT?: number
  totalTVA?: number
  tvaDefaut?: number
  timbreFiscal?: number
  netAPayer: number
  totalPanier: number
  encaissementEnCours: boolean
  onEnregistrerDocument: (type: 'devis' | 'proforma') => void
  onEncaisser: () => void
  t: (key: string) => string
}

export default function PosPanierSidebar(props: Props) {
  const {
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
    montantEspecesMixte,
    onSetMontantEspecesMixte,
    secondModeMixte,
    onSetSecondModeMixte,
    clientCreditIdPOS,
    onSetClientCreditIdPOS,
    clientsCredits,
    creditDateEcheancePOS,
    onSetCreditDateEcheancePOS,
    creditNotePOS,
    onSetCreditNotePOS,
    finances,
    netAPayer,
    totalPanier,
    encaissementEnCours,
    onEnregistrerDocument,
    onEncaisser,
    t,
  } = props

  const regimeFiscal = finances ? finances.regimeFiscal : (props.regimeFiscal || 'reel')
  const estExonereClient = finances ? finances.estExonereClient : Boolean(props.estExonereClient)
  const totalHT = finances ? finances.totalHT : (props.totalHT ?? 0)
  const totalTVA = finances ? finances.totalTVA : (props.totalTVA ?? 0)
  const tvaDefaut = finances ? finances.tvaDefaut : (props.tvaDefaut ?? 18)
  const timbreFiscal = finances ? finances.timbreFiscal : (props.timbreFiscal ?? 0)
  const resteAPayerMixte = finances ? finances.resteAPayerMixte : (props.resteAPayerMixte ?? 0)
  const monnaieARendre = finances ? finances.monnaieARendre : (props.monnaieARendre ?? 0)
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
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--pos-navy, #1C2B4A)' }}>
              Votre ticket est vide
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--pos-text2, #5A4E42)' }}>
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
                <div className="pos-qty-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--pos-surface3, #FFFFFF)', padding: '2px 4px', borderRadius: 6, border: '1px solid var(--pos-border, #E8DDD2)' }}>
                  <button
                    type="button"
                    onClick={() => onModifierQuantite(item.produit.id, -1)}
                    style={{ background: 'none', border: 'none', color: 'var(--pos-navy, #1C2B4A)', fontWeight: 800, cursor: 'pointer', padding: '0 4px', fontSize: 13 }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center', color: 'var(--pos-navy, #1C2B4A)' }}>
                    {item.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => onModifierQuantite(item.produit.id, 1)}
                    style={{ background: 'none', border: 'none', color: 'var(--pos-navy, #1C2B4A)', fontWeight: 800, cursor: 'pointer', padding: '0 4px', fontSize: 13 }}
                  >
                    +
                  </button>
                </div>
                <span className="fcfa-num pos-panier-total" style={{ fontSize: 13, fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {fcfa(item.prixUnitaire * item.quantite)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <PosPanierPaymentOptions
        modePaiement={modePaiement}
        onSelectModePaiement={onSelectModePaiement}
        panier={panier}
        totalPanier={totalPanier}
        netAPayer={netAPayer}
        onOuvrirFidelite={onOuvrirFidelite}
        clientFidelite={clientFidelite}
        cagnotteDeduite={cagnotteDeduite}
        onOuvrirRemise={onOuvrirRemise}
        remisePourcentage={remisePourcentage}
        montantRemise={montantRemise}
        montantRecu={montantRecu}
        onSetMontantRecu={onSetMontantRecu}
        monnaieARendre={monnaieARendre}
        montantEspecesMixte={montantEspecesMixte}
        onSetMontantEspecesMixte={onSetMontantEspecesMixte}
        secondModeMixte={secondModeMixte}
        onSetSecondModeMixte={onSetSecondModeMixte}
        resteAPayerMixte={resteAPayerMixte}
        clientCreditIdPOS={clientCreditIdPOS}
        onSetClientCreditIdPOS={onSetClientCreditIdPOS}
        clientsCredits={clientsCredits}
        creditDateEcheancePOS={creditDateEcheancePOS}
        onSetCreditDateEcheancePOS={onSetCreditDateEcheancePOS}
        creditNotePOS={creditNotePOS}
        onSetCreditNotePOS={onSetCreditNotePOS}
        regimeFiscal={regimeFiscal}
        estExonereClient={estExonereClient}
        totalHT={totalHT}
        totalTVA={totalTVA}
        tvaDefaut={tvaDefaut}
        timbreFiscal={timbreFiscal}
      />

      {/* Zone Sticky Totaux + Bouton Encaisser */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--pos-surface, #ffffff)', paddingTop: 8, borderTop: '1px solid var(--pos-border, #E8DDD2)', zIndex: 10, marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--pos-text3, #8C7E74)', fontWeight: 700, display: 'block' }}>TOTAL À PERCEVOIR</span>
            <span style={{ fontSize: 11, color: 'var(--pos-text2, #5A4E42)' }}>{totalArticles} article(s)</span>
          </div>
          <span className="fcfa-num pos-grand-total" style={{ fontSize: 22, fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)' }}>
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
