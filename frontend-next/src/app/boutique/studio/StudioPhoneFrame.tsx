'use client'

import React from 'react'
import { MessageCircle, ShoppingCart } from 'lucide-react'
import type { BoutiqueCustomizationData } from './types'

interface StudioPhoneFrameProps {
  previewMode: 'mobile' | 'desktop'
  boutique: BoutiqueCustomizationData
  couleurTheme: string
  contrastBtnText: string
  currentRadius: string
  activeCover: string
  activeLogo: string | null
  slogan: string
  bandeauPromo: string
  bandeauPromoActif: boolean
}

export default function StudioPhoneFrame({
  previewMode,
  boutique,
  couleurTheme,
  contrastBtnText,
  currentRadius,
  activeCover,
  activeLogo,
  slogan,
  bandeauPromo,
  bandeauPromoActif,
}: StudioPhoneFrameProps) {
  return (
    <div
      className="studio-mockup-frame-mobile"
      style={{
        background: '#ffffff',
        borderRadius: previewMode === 'mobile' ? 32 : 16,
        border: previewMode === 'mobile' ? '8px solid #0F172A' : '2px solid #E2E8F0',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        maxWidth: previewMode === 'mobile' ? 360 : '100%',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Écran Mockup */}
      <div style={{ background: '#FAF9F6', minHeight: 480, overflowY: 'auto' }}>
        {/* Bandeau Promo Virtuel si actif */}
        {bandeauPromoActif && bandeauPromo.trim() && (
          <div
            style={{
              background: couleurTheme,
              color: contrastBtnText,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}
          >
            {bandeauPromo}
          </div>
        )}

        {/* Bannière de Couverture Virtuelle */}
        <div style={{ position: 'relative', height: previewMode === 'mobile' ? 140 : 180, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeCover}
            alt={boutique.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)',
            }}
          />
        </div>

        {/* Carte En-Tête de Boutique Virtuelle */}
        <div
          style={{
            margin: '-30px 12px 10px',
            background: '#ffffff',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Logo */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#ffffff',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: couleurTheme,
                    color: contrastBtnText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                >
                  {(boutique.nom || 'B').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Nom & Slogan */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 850,
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {boutique.nom}
              </h3>
              {slogan ? (
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: '#475569',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {slogan}
                </p>
              ) : (
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
                  {boutique.ville || 'Dakar, Sénégal'}
                </p>
              )}
            </div>
          </div>

          {/* Boutons d'Action Virtuels */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: currentRadius,
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              style={{
                padding: '7px 10px',
                borderRadius: currentRadius,
                background: '#F1F5F9',
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Partager
            </button>
          </div>
        </div>

        {/* Onglets Catalogue Virtuels */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '0 12px 10px',
            overflowX: 'auto',
          }}
        >
          <span
            style={{
              padding: '5px 12px',
              borderRadius: currentRadius,
              background: couleurTheme,
              color: contrastBtnText,
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            Catalogue (12)
          </span>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: currentRadius,
              background: '#ffffff',
              color: '#64748B',
              fontSize: 11,
              fontWeight: 600,
              border: '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
            }}
          >
            Nouveautés
          </span>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: currentRadius,
              background: '#ffffff',
              color: '#64748B',
              fontSize: 11,
              fontWeight: 600,
              border: '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
            }}
          >
            Infos &amp; Horaires
          </span>
        </div>

        {/* Grille Produits Virtuelle */}
        <div style={{ padding: '0 12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            {
              nom: 'Article Tendance A',
              prix: '15 000 FCFA',
              img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
            },
            {
              nom: 'Article Star B',
              prix: '28 500 FCFA',
              img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
            },
          ].map((prod, i) => (
            <div
              key={i}
              style={{ background: '#ffffff', borderRadius: 12, padding: 8, border: '1px solid #E2E8F0' }}
            >
              <div
                style={{
                  aspectRatio: '1/1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#f8fafc',
                  marginBottom: 6,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.img}
                  alt={prod.nom}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {prod.nom}
              </p>
              <p style={{ margin: '2px 0 6px', fontSize: 12, fontWeight: 900, color: couleurTheme }}>
                {prod.prix}
              </p>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: currentRadius,
                  background: couleurTheme,
                  color: contrastBtnText,
                  border: 'none',
                  fontSize: 10.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <ShoppingCart size={11} />
                <span>Ajouter</span>
              </button>
            </div>
          ))}
        </div>

        {/* Signature discrète de réassurance */}
        <div style={{ textAlign: 'center', padding: '12px 14px 20px', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
            Vitrine propulsée par <strong>Nopalou</strong> · Paiements Wave et Orange Money sécurisés
          </p>
        </div>
      </div>
    </div>
  )
}
