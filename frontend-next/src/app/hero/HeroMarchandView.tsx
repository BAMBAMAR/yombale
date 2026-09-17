'use client'

import React from 'react'
import Link from 'next/link'
import {
  Zap,
  Store,
  Building2,
  BookOpen,
  MessageCircle,
  ArrowRight
} from 'lucide-react'

interface HeroMarchandViewProps {
  prixTafTaf?: number
  activeBoutiqueNom?: string | null
}

export default function HeroMarchandView({
  prixTafTaf = 2500,
  activeBoutiqueNom
}: HeroMarchandViewProps) {
  return (
    <div style={{ width: '100%' }}>
      {/* En-tête Espace Pro & Commerçant */}
      <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#FED7AA',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 800,
            marginBottom: 8,
            boxShadow: '0 2px 6px rgba(28,43,74,0.2)'
          }}
        >
          <span>Écosystème Pro : Boutiques, Caisses POS &amp; Agences Immobilières</span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(20px, 2.5vw, 28px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 6px',
            lineHeight: 1.25,
            letterSpacing: '-0.02em'
          }}
        >
          Gérez vos ventes, encaissez sans frais et pilotez votre activité sur{' '}
          <span style={{ color: 'var(--accent, #C75B00)' }}>WhatsApp</span>
        </h2>

        <p
          style={{
            fontSize: 13,
            color: 'var(--text2, #5A4E42)',
            margin: '0 auto',
            maxWidth: 620,
            lineHeight: 1.4
          }}
        >
          Caisse tactile hors-ligne sur votre téléphone, carnet de dettes, gestion de baux locatifs et vitrine e-commerce à 0% de commission.
        </p>

        {/* Bannière Pro Connecté si session active */}
        {activeBoutiqueNom && (
          <div
            style={{
              marginTop: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              padding: '6px 14px',
              borderRadius: 12,
              fontSize: 12,
              color: '#065F46'
            }}
          >
            <span>
              <strong>Boutique active : {activeBoutiqueNom}</strong>
            </span>
            <Link
              href="/boutique"
              style={{ color: '#047857', fontWeight: 800, textDecoration: 'underline' }}
            >
              Accéder à mon tableau de bord →
            </Link>
          </div>
        )}
      </div>

      {/* Grille des 5 Grandes Dalles Pro Tactiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        {/* Dalle 1 : Caisse POS Tactile */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #152238 100%)',
            color: '#FFFFFF',
            borderRadius: 16,
            padding: '18px 16px',
            boxShadow: '0 6px 20px rgba(28,43,74,0.2)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--accent, #C75B00)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Zap size={20} fill="#fff" />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: '#16A34A',
                  color: '#fff',
                  padding: '2px 7px',
                  borderRadius: 8
                }}
              >
                100% HORS-LIGNE
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#FED7AA' }}>
              Caisse POS Tactile
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: '#E2E8F0', lineHeight: 1.35 }}>
              Encaissez au comptoir. Scan caméra, douchette smartphone sans fil, tickets WhatsApp et gestion des stocks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href="/boutique/caisse"
              style={{
                flex: 1.2,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(199,91,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <Zap size={13} fill="#fff" />
              <span>Ouvrir Caisse</span>
            </Link>
            <Link
              href="/pos"
              style={{
                flex: 0.8,
                padding: '8px 8px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 700,
                textDecoration: 'none',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Démo
            </Link>
          </div>
        </div>

        {/* Dalle 2 : Agences Immobilières & Baux Pro (Nouvelle Dalle Majeure) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A5C36 0%, #074026 100%)',
            color: '#FFFFFF',
            borderRadius: 16,
            padding: '18px 16px',
            boxShadow: '0 6px 20px rgba(10,92,54,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building2 size={20} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: '#C75B00',
                  color: '#fff',
                  padding: '2px 7px',
                  borderRadius: 8
                }}
              >
                PRO IMMO
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#A7F3D0' }}>
              Agences &amp; Gestion Locative
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: '#E2E8F0', lineHeight: 1.35 }}>
              Baux numériques, quittances PDF certifiées, alertes WhatsApp et encaissement des loyers Wave en 1 clic.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href="/agence"
              style={{
                flex: 1.2,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ffffff',
                color: '#0A5C36',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <Building2 size={13} />
              <span>Espace Agence</span>
            </Link>
            <Link
              href="/deposer-immo"
              style={{
                flex: 0.9,
                padding: '8px 8px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 700,
                textDecoration: 'none',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Publier bien
            </Link>
          </div>
        </div>

        {/* Dalle 3 : Créer ma Boutique en Ligne */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '18px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1.5px solid var(--border, #E8DDD2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#FFF3E8',
                  color: 'var(--accent, #C75B00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Store size={20} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: 'var(--accent, #C75B00)',
                  color: '#fff',
                  padding: '2px 7px',
                  borderRadius: 8
                }}
              >
                30J OFFERTS
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Créer ma Boutique
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
              Votre vitrine web avec catalogue interactif en 2 minutes. Recevez des commandes 24h/24.
            </p>
          </div>

          <Link
            href="/creer-boutique"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <span>Créer en 2 min</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Dalle 4 : Carnet de Dettes Client */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '18px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1.5px solid var(--border, #E8DDD2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={20} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: '#EFF6FF',
                  color: '#1E40AF',
                  padding: '2px 7px',
                  borderRadius: 8
                }}
              >
                FINI LES CAHIERS
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Carnet de Dettes &amp; Crédits
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
              Enregistrez les crédits clients. Relances WhatsApp automatiques avec lien Wave en 1 clic.
            </p>
          </div>

          <Link
            href="/boutique?tab=carnet"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              color: '#1E293B',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <span>Gérer les crédits</span>
            <span>→</span>
          </Link>
        </div>

        {/* Dalle 5 : WhatsApp Commerce & 0% Commission */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '18px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1.5px solid var(--border, #E8DDD2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#ECFDF5',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MessageCircle size={20} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: '#DCFCE7',
                  color: '#15803D',
                  padding: '2px 7px',
                  borderRadius: 8
                }}
              >
                0% COMMISSION
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              WhatsApp Commerce
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
              Commandes directes via WhatsApp. Zéro commission prélevée sur vos encaissements Wave &amp; OM.
            </p>
          </div>

          <Link
            href="/tarifs-boutique"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              color: '#1E293B',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <span>Voir les formules</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Bandeau de Clôture & Preuve Économique */}
      <div
        style={{
          background: 'var(--orange2, #FFF3E8)',
          border: '1px solid #FED7AA',
          borderRadius: 14,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--navy, #1C2B4A)', fontWeight: 800 }}>
            Formule Taf-Taf Commerçant &amp; Agence :
          </span>
          <span style={{ color: 'var(--text2, #5A4E42)' }}>
            Dès{' '}
            <strong style={{ color: 'var(--accent, #C75B00)' }}>
              {prixTafTaf.toLocaleString('fr-FR')} FCFA/mois
            </strong>{' '}
            après 30 jours d&apos;essai gratuit • Sans engagement • Aucun terminal bancaire à acheter
          </span>
        </div>

        <Link
          href="/tarifs-boutique"
          style={{
            color: 'var(--accent, #C75B00)',
            fontWeight: 900,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <span>Découvrir les offres</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
