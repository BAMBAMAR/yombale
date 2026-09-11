'use client'

import React from 'react'
import Link from 'next/link'
import { Zap, Plus, BookOpen, BarChart3, ShoppingBag, ArrowRight, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface Props {
  boutiqueNom: string
  boutiqueId: string
  stats?: {
    caJour?: number
    nbVentesJour?: number
    dettesTotales?: number
    produitsEnRupture?: number
  }
  onOuvrirAjoutProduit: () => void
  onNaviguerOnglet: (onglet: string) => void
  onBasculerModeComplet: () => void
}

export default function DashboardFacile({
  boutiqueNom,
  boutiqueId,
  stats = {},
  onOuvrirAjoutProduit,
  onNaviguerOnglet,
  onBasculerModeComplet,
}: Props) {
  const {
    caJour = 0,
    nbVentesJour = 0,
    dettesTotales = 0,
    produitsEnRupture = 0,
  } = stats

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '16px 12px 40px' }}>
      {/* ── EN-TÊTE MODE SIMPLE ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '16px 20px',
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 2px 8px rgba(26,22,18,0.05)',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🏪</span>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {boutiqueNom || 'Ma Boutique'}
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: 'var(--orange2, #FFF3E8)',
                color: 'var(--accent, #C75B00)',
                padding: '2px 8px',
                borderRadius: 12,
                border: '1px solid #FED7AA',
              }}
            >
              Mode Facile ⚡
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2, #5A4E42)' }}>
            Les 4 outils indispensables pour gérer votre commerce au quotidien.
          </p>
        </div>

        <button
          type="button"
          onClick={onBasculerModeComplet}
          style={{
            background: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>Basculer en Mode Expert</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* ── LES 4 GRANDES TUILES D'ACTION TACTILE ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* TUILE 1 : CAISSE ENREGISTREUSE TACTILE */}
        <Link
          href="/boutique/caisse"
          style={{
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #1C2B4A 0%, #152238 100%)',
            color: '#FFFFFF',
            borderRadius: 18,
            padding: '22px 20px',
            boxShadow: '0 8px 24px rgba(28,43,74,0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 160,
            border: '1px solid rgba(255,255,255,0.12)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--accent, #C75B00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(199,91,0,0.4)',
                }}
              >
                <Zap size={24} fill="#ffffff" color="#ffffff" />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: '#16A34A',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: 10,
                }}
              >
                HORS-LIGNE DISPONIBLE
              </span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>
              1. Encaisser (Caisse POS)
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.4 }}>
              Scannez les articles, encaissez par Wave / Orange Money / Espèces et imprimez le ticket.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: '#FED7AA',
              marginTop: 14,
            }}
          >
            <span>Ouvrir la Caisse Tactile</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* TUILE 2 : AJOUTER UN PRODUIT RAPIDE */}
        <div
          onClick={onOuvrirAjoutProduit}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onOuvrirAjoutProduit()}
          style={{
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            borderRadius: 18,
            padding: '22px 20px',
            boxShadow: '0 4px 16px rgba(26,22,18,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 160,
            border: '2px solid #FED7AA',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--orange2, #FFF3E8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent, #C75B00)',
                }}
              >
                <Plus size={24} strokeWidth={2.8} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                En 30 secondes ⚡
              </span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              2. Ajouter un Produit
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
              Prenez une photo, saisissez le nom et le prix. Le produit apparaît immédiatement en caisse.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--accent, #C75B00)',
              marginTop: 14,
            }}
          >
            <span>Nouveau Produit</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* TUILE 3 : CARNET DE DETTES CLIENT */}
        <div
          onClick={() => onNaviguerOnglet('dettes')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onNaviguerOnglet('dettes')}
          style={{
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            borderRadius: 18,
            padding: '22px 20px',
            boxShadow: '0 4px 16px rgba(26,22,18,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 160,
            border: '1px solid var(--border, #E8DDD2)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B45309',
                }}
              >
                <BookOpen size={22} strokeWidth={2.4} />
              </div>
              {dettesTotales > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background: '#FEE2E2',
                    color: '#DC2626',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  {fcfa(dettesTotales)} dûs
                </span>
              )}
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              3. Carnet de Dettes
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
              Notez qui vous doit, envoyez des rappels polis sur WhatsApp avec lien de paiement Wave.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: '#B45309',
              marginTop: 14,
            }}
          >
            <span>Consulter les Dettes</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* TUILE 4 : VENTES DU JOUR */}
        <div
          onClick={() => onNaviguerOnglet('commandes')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onNaviguerOnglet('commandes')}
          style={{
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            borderRadius: 18,
            padding: '22px 20px',
            boxShadow: '0 4px 16px rgba(26,22,18,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 160,
            border: '1px solid var(--border, #E8DDD2)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#E6F4EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--price, #0A5C36)',
                }}
              >
                <BarChart3 size={22} strokeWidth={2.4} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: 'var(--price, #0A5C36)',
                  background: '#E6F4EC',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                {nbVentesJour} vente{nbVentesJour > 1 ? 's' : ''}
              </span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              4. Mes Ventes &amp; Commandes
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
              CA du jour : <strong>{fcfa(caJour)}</strong>. Consultez vos encaissements et commandes reçues.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--price, #0A5C36)',
              marginTop: 14,
            }}
          >
            <span>Voir l&apos;Historique</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* ── BANDEAU D'AIDE ET ACADÉMIE COMMERÇANTS ── */}
      <div
        style={{
          background: 'var(--orange2, #FFF3E8)',
          borderRadius: 14,
          padding: '14px 18px',
          border: '1px solid #FED7AA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>💬</span>
          <div>
            <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>
              Besoin d&apos;aide ou d&apos;une démonstration en Wolof ?
            </strong>
            <span style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
              Notre équipe à Dakar est disponible sur WhatsApp 7j/7 pour vous accompagner.
            </span>
          </div>
        </div>

        <a
          href="https://wa.me/221777202086?text=Bonjour%20Nopalou,%20je%20souhaite%20de%20l'aide%20pour%20ma%20caisse%20et%20ma%20boutique."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#25D366',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          <Phone size={13} />
          <span>Assistance WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
