'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Store, Zap, BookOpen, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react'

interface Props {
  initialMode?: 'acheteur' | 'marchand'
  prixTafTaf?: number
}

export default function HeroDualTrack({ initialMode = 'acheteur', prixTafTaf = 2500 }: Props) {
  const [activeTab, setActiveTab] = useState<'acheteur' | 'marchand'>(initialMode)

  useEffect(() => {
    try {
      const isMerchant = localStorage.getItem('nopalou_is_merchant') === 'true'
      const activeBoutique = localStorage.getItem('nopalou_boutique_active')
      if (isMerchant || (activeBoutique && activeBoutique !== 'null' && activeBoutique !== '[]')) {
        setActiveTab('marchand')
      }
    } catch (_) {}
  }, [])

  return (
    <div className="hero-dual-track-wrapper" style={{ width: '100%', marginBottom: 12 }}>
      {/* ── SÉLECTEUR D'INTENTION DUAL-TRACK (ACHETEUR / MARCHAND) ── */}
      <div
        role="tablist"
        aria-label="Mode d'utilisation Nopalou"
        style={{
          display: 'inline-flex',
          background: '#EDE8E1',
          padding: '3px',
          borderRadius: '9999px',
          border: '1px solid var(--border, #E8DDD2)',
          marginBottom: 12,
          gap: 4,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'acheteur'}
          onClick={() => setActiveTab('acheteur')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: 12,
            fontWeight: activeTab === 'acheteur' ? 800 : 600,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'acheteur' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'acheteur' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
            boxShadow: activeTab === 'acheteur' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <ShoppingBag size={14} color={activeTab === 'acheteur' ? 'var(--accent, #C75B00)' : 'currentColor'} />
          <span>Acheteur &amp; Comparateur</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'marchand'}
          onClick={() => setActiveTab('marchand')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: 12,
            fontWeight: activeTab === 'marchand' ? 800 : 600,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'marchand' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: activeTab === 'marchand' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
            boxShadow: activeTab === 'marchand' ? '0 2px 6px rgba(28,43,74,0.25)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <Store size={14} color={activeTab === 'marchand' ? '#FED7AA' : 'currentColor'} />
          <span>Commerçant &amp; Caisse POS</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              padding: '1px 5px',
              borderRadius: 8
            }}
          >
            PRO
          </span>
        </button>
      </div>

      {/* ── BANDEAU CONTEXTUEL SELON LE MODE CHOISI ── */}
      {activeTab === 'marchand' ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #152238 100%)',
            color: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 10,
            boxShadow: '0 6px 20px rgba(28,43,74,0.15)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#FED7AA' }}>
                  ⚡ Espace Commerçant &amp; Caisse Tactile
                </span>
                <span
                  style={{
                    background: '#16A34A',
                    color: '#fff',
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 12
                  }}
                >
                  0% Commission Wave/OM
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>
                Encaissez en boutique physique sans matériel coûteux, tenez votre carnet de dettes client et recevez des commandes WhatsApp.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Link
                href="/boutique/caisse"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--accent, #C75B00)',
                  color: '#ffffff',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(199,91,0,0.35)'
                }}
              >
                <Zap size={14} fill="#fff" />
                <span>Ouvrir la Caisse</span>
              </Link>

              <Link
                href="/creer-boutique"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <span>Créer ma Boutique</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--orange2, #FFF3E8)',
            border: '1px solid #FED7AA',
            borderRadius: 10,
            padding: '7px 12px',
            marginBottom: 8,
            fontSize: 11.5,
            color: 'var(--text1, #1A1612)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent, #C75B00)', fontWeight: 800 }}>
            <ShieldCheck size={14} />
            <span>Garantie Nopalou :</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>✓ Comparateur 100% indépendant</span>
            <span>✓ Commandes directes sur WhatsApp</span>
            <span>✓ Aucun frais acheteur</span>
          </div>
        </div>
      )}
    </div>
  )
}
