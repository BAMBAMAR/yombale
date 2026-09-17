'use client'

import React from 'react'
import { XCircle, CheckCircle2, Scale, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ComparisonRow {
  critere: string
  classique: string
  nopalou: string
}

const COMPARISONS: ComparisonRow[] = [
  {
    critere: 'Émission des quittances de loyer',
    classique: '2 à 3 jours par mois à remplir des carnets souches papier avec risque d\'erreurs et contestations.',
    nopalou: 'Génération instantanée en 1 clic de quittances certifiées PDFKit avec QR code officiel anti-fraude.'
  },
  {
    critere: 'Recouvrement & Encaissement des loyers',
    classique: 'Appels téléphoniques gênants, gestion risquée d\'espèces au bureau et chèques sans provision.',
    nopalou: 'Relance bienveillante automatique par SMS/WhatsApp et paiement sécurisé direct par Wave ou Orange Money.'
  },
  {
    critere: 'Reddition de comptes aux propriétaires',
    classique: 'Calculs manuels sur Excel souvent contestés, retards de reversement et mécontentement des bailleurs.',
    nopalou: 'Compte de gestion mensuel PDF généré en 1 clic avec déduction automatique des honoraires et travaux.'
  },
  {
    critere: 'Commercialisation & Relogement',
    classique: 'Annonces dispersées sur des groupes Facebook sans traçabilité des prospects ni relance structurée.',
    nopalou: 'Moteur de matching IA : dès qu\'un bien rentre, les acquéreurs compatibles sont alertés sur WhatsApp.'
  },
  {
    critere: 'Gestion des travaux & Pannes',
    classique: 'Appels nocturnes, artisans payés sans validation du propriétaire et factures égarées.',
    nopalou: 'Ticket d\'incident avec photos, devis validé en ligne par le bailleur et déduction comptable automatique.'
  },
  {
    critere: 'Répartition des commissions agents',
    classique: 'Disputes internes entre négociateurs, calculs de fin de mois opaques et litiges d\'honoraires.',
    nopalou: 'Barème automatisé des commissions par agent et apporteur selon les termes du mandat signé.'
  }
]

export function AgenceComparativeTable() {
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto 70px', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199, 91, 0, 0.08)', color: 'var(--accent, #C75B00)',
          padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
          marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          <Scale size={14} />
          <span>Comparatif d\'Efficacité Opérationnelle</span>
        </div>
        <h2 style={{
          fontSize: 'clamp(22px, 3.8vw, 34px)',
          fontWeight: 900,
          color: 'var(--navy, #1C2B4A)',
          margin: 0
        }}>
          Gestion Traditionnelle vs Agence Immobilière Nopalou
        </h2>
        <p style={{
          fontSize: 14.5,
          color: 'var(--text-subtle, #5A4E42)',
          maxWidth: 620,
          margin: '8px auto 0',
          lineHeight: 1.5
        }}>
          Voyez concrètement pourquoi les administrateurs de biens et cabinets immobiliers de Dakar abandonnent les classeurs papier.
        </p>
      </div>

      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1.5px solid var(--border, #E8DDD2)',
        boxShadow: '0 6px 24px rgba(28, 43, 74, 0.06)',
        overflow: 'hidden'
      }}>
        {/* En-tête des colonnes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 1fr) 1.2fr 1.3fr',
          background: 'var(--navy, #1C2B4A)',
          color: '#FFFFFF',
          padding: '16px 20px',
          fontWeight: 800,
          fontSize: 13.5
        }}>
          <div>Mission du Cabinet</div>
          <div style={{ color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={15} />
            <span>Gestion Manuelle (Excel &amp; Papier)</span>
          </div>
          <div style={{ color: '#86EFAC', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} />
            <span>Avec Nopalou Immo ERP</span>
          </div>
        </div>

        {/* Lignes du comparatif */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {COMPARISONS.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 1fr) 1.2fr 1.3fr',
                padding: '18px 20px',
                borderBottom: idx < COMPARISONS.length - 1 ? '1px solid #F1EAE1' : 'none',
                background: idx % 2 === 0 ? '#FFFFFF' : 'rgba(248, 245, 240, 0.5)',
                gap: 16,
                fontSize: 13,
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {row.critere}
              </div>
              <div style={{ color: '#64748B', lineHeight: 1.45, fontSize: 12.5 }}>
                {row.classique}
              </div>
              <div style={{
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 650,
                lineHeight: 1.45,
                fontSize: 12.5,
                background: 'rgba(10, 92, 54, 0.05)',
                padding: '8px 12px',
                borderRadius: 8,
                borderLeft: '3px solid #10b981'
              }}>
                {row.nopalou}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 24,
        textAlign: 'center'
      }}>
        <Link
          href="/inscription?role=agence&redirect=/agence"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            padding: '12px 28px',
            borderRadius: 30,
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(28, 43, 74, 0.15)'
          }}
        >
          <span>Moderniser mon cabinet (1er mois offert)</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  )
}
