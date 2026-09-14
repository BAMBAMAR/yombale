'use client'

import React from 'react'
import {
  AlertCircle,
  Truck,
  User,
  Package,
  Award,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { Produit, Zone, ClubVipData, PromoApplique, fcfa } from './types'
import CommanderPaymentSection from './CommanderPaymentSection'
import CommanderCrossSellSection from './CommanderCrossSellSection'

interface CommanderFormViewProps {
  produit: Produit
  quantite: number
  setQuantite: (q: number) => void
  nom: string
  setNom: (n: string) => void
  tel: string
  setTel: (t: string) => void
  adresse: string
  setAdresse: (a: string) => void
  zoneId: string
  setZoneId: (z: string) => void
  zones: Zone[]
  zoneSelectionnee: Zone | null
  reductionClubVip: number
  clubVip: ClubVipData | null
  paiement: string
  setPaiement: (p: string) => void
  deviseStripe: 'EUR' | 'USD' | 'XOF'
  setDeviseStripe: (d: 'EUR' | 'USD' | 'XOF') => void
  cardNumber: string
  setCardNumber: (c: string) => void
  cardExp: string
  setCardExp: (e: string) => void
  cardCvc: string
  setCardCvc: (cvc: string) => void
  codePromo: string
  setCodePromo: (cp: string) => void
  promoApplique: PromoApplique | null
  promoLoading: boolean
  promoError: string | null
  appliquerCodePromo: () => void
  removePromo: () => void
  crossSell: Produit[]
  selectedAddons: Record<string, number>
  toggleAddon: (id: string) => void
  note: string
  setNote: (n: string) => void
  sousTotal: number
  sousTotalMain: number
  fraisLivraison: number
  total: number
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export default function CommanderFormView({
  produit,
  quantite,
  setQuantite,
  nom,
  setNom,
  tel,
  setTel,
  adresse,
  setAdresse,
  zoneId,
  setZoneId,
  zones,
  zoneSelectionnee,
  reductionClubVip,
  clubVip,
  paiement,
  setPaiement,
  deviseStripe,
  setDeviseStripe,
  cardNumber,
  setCardNumber,
  cardExp,
  setCardExp,
  cardCvc,
  setCardCvc,
  codePromo,
  setCodePromo,
  promoApplique,
  promoLoading,
  promoError,
  appliquerCodePromo,
  removePromo,
  crossSell,
  selectedAddons,
  toggleAddon,
  note,
  setNote,
  sousTotal,
  sousTotalMain,
  fraisLivraison,
  total,
  loading,
  error,
  onSubmit,
}: CommanderFormViewProps) {
  const freeShippingThreshold = 25000
  const isFreeShipping = sousTotal >= freeShippingThreshold
  const progressPct = Math.min(100, Math.round((sousTotal / freeShippingThreshold) * 100))

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#b91c1c',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Jauge Dynamique Livraison Offerte */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, fontWeight: 700 }}>
          <span style={{ color: isFreeShipping ? '#15803d' : '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Truck size={15} color={isFreeShipping ? '#16a34a' : 'var(--accent, #C75B00)'} />
            <span>
              {isFreeShipping
                ? 'Livraison offerte débloquée !'
                : `Plus que ${fcfa(Math.max(0, freeShippingThreshold - sousTotal))} pour la livraison offerte !`}
            </span>
          </span>
          <span style={{ color: '#64748b', fontSize: 11.5 }}>{progressPct}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: isFreeShipping
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, var(--accent, #C75B00), #ea580c)',
              borderRadius: 6,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Section 1 : Vos Coordonnées */}
      <div>
        <label className="npl-label-airy" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <User size={16} color="var(--accent, #C75B00)" />
          <span>1. Vos Coordonnées</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <input
              required
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="npl-input-airy"
              placeholder="Prénom & Nom *"
            />
          </div>
          <div>
            <input
              required
              type="tel"
              value={tel}
              onChange={e => setTel(e.target.value)}
              className="npl-input-airy"
              placeholder="Téléphone (ex: 77 123 45 67) *"
            />
          </div>
        </div>
      </div>

      {/* Section 2 : Quantité & Livraison */}
      <div>
        <label className="npl-label-airy" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Package size={16} color="var(--accent, #C75B00)" />
          <span>2. Quantité & Livraison</span>
        </label>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid #cbd5e1',
              borderRadius: 12,
              background: '#fff',
              padding: '4px 8px',
              minHeight: 48,
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={() => setQuantite(Math.max(1, quantite - 1))}
              style={{
                width: 36,
                height: 38,
                border: 'none',
                background: 'none',
                fontSize: 20,
                fontWeight: 800,
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              -
            </button>
            <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
              {quantite}
            </span>
            <button
              type="button"
              onClick={() => setQuantite(quantite + 1)}
              style={{
                width: 36,
                height: 38,
                border: 'none',
                background: 'none',
                fontSize: 20,
                fontWeight: 800,
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              +
            </button>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <select
              value={zoneId}
              onChange={e => setZoneId(e.target.value)}
              className="npl-input-airy"
              style={{ cursor: 'pointer' }}
            >
              <option value="">— Retrait gratuit en boutique —</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.nom} ({z.prix > 0 ? fcfa(z.prix) : 'Gratuit'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <input
          value={adresse}
          onChange={e => setAdresse(e.target.value)}
          className="npl-input-airy"
          placeholder="Adresse précise (Quartier, rue, repère...)"
        />

        {reductionClubVip > 0 && clubVip && (
          <div
            style={{
              marginTop: 8,
              padding: '9px 12px',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#166534',
              fontWeight: 700,
            }}
          >
            <Award size={16} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>
              Avantage Nopalou Club VIP ({clubVip.badge}) : -{fcfa(reductionClubVip)} déduit sur votre livraison Tiak-Tiak !
            </span>
          </div>
        )}
      </div>

      {/* Section 3 : Mode de Paiement */}
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

      {/* Sections 4, 5, 6 : Promo, Cross-sell, Note */}
      <CommanderCrossSellSection
        codePromo={codePromo}
        setCodePromo={setCodePromo}
        promoApplique={promoApplique}
        promoLoading={promoLoading}
        promoError={promoError}
        appliquerCodePromo={appliquerCodePromo}
        removePromo={removePromo}
        crossSell={crossSell}
        selectedAddons={selectedAddons}
        toggleAddon={toggleAddon}
        note={note}
        setNote={setNote}
      />

      {/* Section 7 : Récapitulatif Prix Élégant */}
      <div
        style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
          <span>
            {produit.nom} × {quantite}
          </span>
          <strong style={{ color: '#1e293b' }}>{fcfa(sousTotalMain)}</strong>
        </div>
        {Object.entries(selectedAddons).map(([pId, qte]) => {
          const addon = crossSell.find(c => c.id === pId)
          if (!addon) return null
          return (
            <div key={pId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              <span>
                + {addon.nom} × {qte}
              </span>
              <span>{fcfa((addon.prix || 0) * qte)}</span>
            </div>
          )
        })}
        {promoApplique && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
            <span>Réduction Code Promo ({promoApplique.code})</span>
            <span>-{fcfa(promoApplique.reduction)}</span>
          </div>
        )}
        {fraisLivraison > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
            <span>Livraison ({zoneSelectionnee?.nom?.split('(')[0]?.trim()})</span>
            <span>{fcfa(fraisLivraison)}</span>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 17,
            fontWeight: 900,
            color: 'var(--accent, #C75B00)',
            borderTop: '1.5px solid #e2e8f0',
            paddingTop: 10,
            marginTop: 4,
          }}
        >
          <span>Total à régler</span>
          <span>{fcfa(total)}</span>
        </div>
      </div>

      {/* Bouton de Soumission Primaire */}
      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#94a3b8' : 'var(--accent, #C75B00)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          padding: '16px 20px',
          fontWeight: 900,
          fontSize: 16,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 8px 20px -4px rgba(199, 91, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? (
          'Traitement en cours…'
        ) : (
          <>
            <span>Confirmer ma commande • {fcfa(total)}</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <p
        style={{
          margin: '0 auto',
          fontSize: 11.5,
          color: '#64748b',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Lock size={13} color="#64748b" />
        <span>Données protégées & Commande sécurisée par Nopalou</span>
      </p>
    </form>
  )
}
