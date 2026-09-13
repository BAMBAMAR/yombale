'use client'

import React from 'react'
import {
  ChevronLeft,
  ShieldCheck,
  ShoppingBag,
  Tag,
  X,
  AlertCircle,
  Award,
} from 'lucide-react'
import type { Produit, PromoApplique, ClubVipData } from './types'
import { fcfa } from './types'
import CommanderPaymentSection from './CommanderPaymentSection'
import Image from 'next/image'

interface CheckoutStep2RecapProps {
  produit: Produit
  quantite: number
  sousTotal: number
  fraisLivraison: number
  total: number
  paiement: string
  setPaiement: (mode: string) => void
  promoApplique: PromoApplique | null
  clubVip: ClubVipData | null
  reductionClubVip?: number
  codePromo: string
  setCodePromo: (val: string) => void
  appliquerCodePromo: () => void
  removePromo?: () => void
  promoLoading?: boolean
  promoError?: string | null
  deviseStripe: 'EUR' | 'USD' | 'XOF'
  setDeviseStripe: (devise: 'EUR' | 'USD' | 'XOF') => void
  cardNumber: string
  setCardNumber: (val: string) => void
  cardExp: string
  setCardExp: (val: string) => void
  cardCvc: string
  setCardCvc: (val: string) => void
  loading: boolean
  error: string | null
  onSubmit: () => void
  onBack: () => void
}

export default function CheckoutStep2Recap({
  produit,
  quantite,
  sousTotal,
  fraisLivraison,
  total,
  paiement,
  setPaiement,
  promoApplique,
  clubVip,
  reductionClubVip = 0,
  codePromo,
  setCodePromo,
  appliquerCodePromo,
  removePromo,
  promoLoading = false,
  promoError,
  deviseStripe,
  setDeviseStripe,
  cardNumber,
  setCardNumber,
  cardExp,
  setCardExp,
  cardCvc,
  setCardCvc,
  loading,
  error,
  onSubmit,
  onBack,
}: CheckoutStep2RecapProps) {
  return (
    <div className="checkout-step-container">
      <div>
        <button type="button" className="checkout-back-btn" onClick={onBack}>
          <ChevronLeft size={15} /> Modifier mes coordonnées
        </button>
        <div className="checkout-step-badge">Étape 2 sur 3</div>
        <h3 className="checkout-step-title">Récapitulatif & Choix du Paiement</h3>
      </div>

      {error && (
        <div className="checkout-error-banner">
          <AlertCircle size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Ligne Produit */}
      <div className="checkout-product-line">
        {(produit.photo || produit.images?.[0]) ? (
          <Image
            src={produit.photo || produit.images![0]}
            alt={produit.nom}
            width={52}
            height={52}
            className="checkout-product-thumb"
            unoptimized
          />
        ) : (
          <div className="checkout-product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={20} color="var(--text3)" />
          </div>
        )}
        <div className="checkout-product-info">
          <strong>{produit.nom}</strong>
          <span>
            {quantite} × {fcfa(produit.prix || 0)}
          </span>
        </div>
        <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--navy)' }}>
          {fcfa((produit.prix || 0) * quantite)}
        </div>
      </div>

      {/* Détail Prix */}
      <div className="checkout-price-breakdown">
        <div>
          <span>Sous-total articles</span>
          <span>{fcfa(sousTotal)}</span>
        </div>
        <div>
          <span>Frais de livraison</span>
          <span>{fraisLivraison > 0 ? fcfa(fraisLivraison) : 'Offerte'}</span>
        </div>

        {promoApplique && (
          <div className="checkout-promo-line">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag size={12} /> Code promo ({promoApplique.code})
            </span>
            <span>-{fcfa(promoApplique.reduction)}</span>
          </div>
        )}

        {reductionClubVip > 0 && clubVip && (
          <div style={{ color: 'var(--price)', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Award size={12} /> Club VIP ({clubVip.badge})
            </span>
            <span>-{fcfa(reductionClubVip)}</span>
          </div>
        )}

        <div className="checkout-total-line">
          <span>TOTAL À PAYER</span>
          <strong>{fcfa(total)}</strong>
        </div>
      </div>

      {/* Code Promo Input */}
      <div>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6, display: 'block' }}>
          Code promotionnel
        </label>
        {promoApplique ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--r-md)',
              background: 'var(--green2)',
              border: '1px solid #86efac',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#166534',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={14} /> Code <strong>{promoApplique.code}</strong> appliqué (-{fcfa(promoApplique.reduction)})
            </span>
            {removePromo && (
              <button
                type="button"
                onClick={removePromo}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                title="Supprimer la promo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="checkout-promo-row">
            <input
              type="text"
              value={codePromo}
              onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
              placeholder="Ex: BIENVENUE10"
            />
            <button
              type="button"
              className="btn-npl btn-npl-sm btn-npl-secondary"
              onClick={appliquerCodePromo}
              disabled={promoLoading || !codePromo.trim()}
            >
              {promoLoading ? 'Vérif...' : 'Appliquer'}
            </button>
          </div>
        )}
        {promoError && (
          <p style={{ color: 'var(--red)', fontSize: 11.5, margin: '4px 0 0', fontWeight: 600 }}>{promoError}</p>
        )}
      </div>

      {/* Sélecteur de Paiement */}
      <div>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6, display: 'block' }}>
          Mode de règlement sécurisé
        </label>
        <CommanderPaymentSection
          paiement={paiement}
          setPaiement={setPaiement}
          deviseStripe={deviseStripe}
          setDeviseStripe={setDeviseStripe}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardExp={cardExp}
          setCardExp={setCardExp}
          cardCvc={cardCvc}
          setCardCvc={setCardCvc}
          total={total}
        />
      </div>

      {/* Badge de Réassurance Sécurisée */}
      <div className="checkout-security-badge">
        <ShieldCheck size={16} color="var(--price)" style={{ flexShrink: 0 }} />
        <span>Paiement 100% sécurisé via Pay Safe Séquestre Nopalou. Le commerçant n'est crédité qu'après livraison.</span>
      </div>

      {/* Bouton de Soumission Final */}
      <button
        type="button"
        className="btn-npl btn-npl-lg btn-npl-primary"
        style={{ width: '100%', height: 48, fontSize: 15 }}
        disabled={loading}
        onClick={onSubmit}
      >
        <ShoppingBag size={18} />
        <span>{loading ? 'Traitement sécurisé en cours...' : `Confirmer & Payer ${fcfa(total)}`}</span>
      </button>
    </div>
  )
}
