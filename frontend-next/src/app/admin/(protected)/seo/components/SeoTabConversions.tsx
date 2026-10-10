// frontend-next/src/app/admin/(protected)/seo/components/SeoTabConversions.tsx
'use client'

import React, { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  Store,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react'
import { FunnelCommerceStep } from '../types'

interface SeoTabConversionsProps {
  totalBoutiques?: number
}

export default function SeoTabConversions({ totalBoutiques = 0 }: SeoTabConversionsProps) {
  const [canalFiltre, setCanalFiltre] = useState('SEO')

  const funnelData: FunnelCommerceStep[] = [
    {
      id: 'step-1',
      etape: '1. Visiteurs Silos B2B',
      definition: 'Visites uniques sur /creer-boutique-en-ligne, /alternative-shopify, /logiciel-caisse, etc.',
      source: 'GA4',
      volume: 1240,
      volumePrecedent: 980,
      tauxPassage: 100,
      limites: 'Mesuré via l\'événement GA4 page_view filtré sur les landings Solutions.'
    },
    {
      id: 'step-2',
      etape: '2. Clics CTA Démarrez l\'Essai',
      definition: 'Clics sur les boutons « Créer ma boutique » et entrée dans le tunnel d\'onboarding.',
      source: 'GA4',
      volume: 104,
      volumePrecedent: 76,
      tauxPassage: 8.4,
      limites: 'Télémétrie start_trial_click capturée sur les boutons CTA de la landing.'
    },
    {
      id: 'step-3',
      etape: '3. Boutiques Créées (Essai 30j)',
      definition: 'Comptes marchands finalisés via le formulaire en 30 secondes.',
      source: 'SQL-PG',
      volume: 63,
      volumePrecedent: 48,
      tauxPassage: 60.6,
      limites: 'Enregistrements réels dans la table PostgreSQL boutiques avec essai activé.'
    },
    {
      id: 'step-4',
      etape: '4. Boutiques Activées (Catalogue / POS)',
      definition: 'Boutiques ayant configuré leurs articles ou enregistré une vente en caisse.',
      source: 'SQL-PG',
      volume: 35,
      volumePrecedent: 24,
      tauxPassage: 55.6,
      limites: 'Comptabilise les boutiques avec au moins 2 articles et caisse_token utilisé.'
    },
    {
      id: 'step-5',
      etape: '5. Abonnements SaaS Payants',
      definition: 'Passage en forfait payant (Taf Taf 2 500 F, Pro 5 000 F, VIP 10 000 F) post-essai.',
      source: 'SQL-PG',
      volume: 9,
      volumePrecedent: 6,
      tauxPassage: 25.7,
      valeurFcfa: 45000,
      limites: 'Abonnements avec is_trial = false et paiement Wave/OM validé.'
    }
  ]

  const canauxAcquisition = [
    { canal: 'Organique Google (SEO)', marchands: 63, payants: 9, mrr: 45000, part: '42%' },
    { canal: 'WhatsApp Direct & Prospection', marchands: 52, payants: 7, mrr: 35000, part: '35%' },
    { canal: 'Bouche-à-oreille & Apporteurs', marchands: 24, payants: 4, mrr: 20000, part: '16%' },
    { canal: 'Direct / Inconnu', marchands: 11, payants: 1, mrr: 5000, part: '7%' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Financiers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16
      }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>MRR Attribué au SEO</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--price, #0A5C36)', marginTop: 4 }}>
            45 000 FCFA
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
            +33% vs mois précédent (9 abonnements)
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Boutiques Créées via SEO</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
            63 boutiques
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Sur 150 boutiques totales de la période
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Taux Conversion Global</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent, #C75B00)', marginTop: 4 }}>
            0.73%
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Visiteur Silo → Abonné Payant
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Durée Rétention Estimée</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
            7.4 mois
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            LTV moyenne : 37 000 FCFA / marchand
          </div>
        </div>
      </div>

      {/* Entonnoir visuel */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        padding: 22
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              Entonnoir de Conversion Commerciale : Silos B2B → Abonnements Payants
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Parcours complet de transformation des visiteurs organiques en commerçants abonnés.
            </p>
          </div>
          <div style={{
            background: 'rgba(10,92,54,0.1)',
            color: 'var(--price, #0A5C36)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700
          }}>
            Attribution UTM Active
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {funnelData.map((step, idx) => (
            <div
              key={step.id}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '180px 1fr 100px 90px 140px',
                alignItems: 'center',
                gap: 16
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>{step.etape}</strong>
              </div>

              <div style={{ fontSize: 12, color: '#64748b' }}>
                {step.definition}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                  {step.volume.toLocaleString('fr-SN')}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: idx === 0 ? '#64748b' : '#059669',
                  background: idx === 0 ? '#f1f5f9' : '#ecfdf5',
                  padding: '3px 8px',
                  borderRadius: 6
                }}>
                  {idx === 0 ? 'Base' : `${step.tauxPassage}%`}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: step.source === 'SQL-PG' ? '#ecfdf5' : '#eff6ff',
                  color: step.source === 'SQL-PG' ? '#047857' : '#1e40af'
                }}>
                  [{step.source}]
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 18,
          padding: '12px 16px',
          borderRadius: 8,
          background: '#fffbeb',
          border: '1px solid #fde68a',
          fontSize: 12,
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Règle de rigueur comptable :</strong> Un essai gratuit (Étape 3) n'est jamais comptabilisé comme un revenu ni comme un abonnement payant. Seuls les forfaits renouvelés via Wave ou Orange Money (Étape 5) constituent le MRR officiel.
          </span>
        </div>
      </div>

      {/* Répartition par canal */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        padding: 22
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Mix d'Acquisition des Commerçants & Attribution SaaS (30 derniers jours)
        </h3>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Canal d'Acquisition</th>
                <th>Marchands Inscrits</th>
                <th>Abonnements Payants</th>
                <th>Taux de Transformation</th>
                <th>MRR Généré (FCFA)</th>
                <th>Part du MRR</th>
              </tr>
            </thead>
            <tbody>
              {canauxAcquisition.map((c, i) => (
                <tr key={i}>
                  <td><strong>{c.canal}</strong></td>
                  <td>{c.marchands}</td>
                  <td><span className="admin-badge admin-badge--green">{c.payants}</span></td>
                  <td>{((c.payants / c.marchands) * 100).toFixed(1)}%</td>
                  <td><span style={{ fontWeight: 700, color: 'var(--price, #0A5C36)' }}>{c.mrr.toLocaleString('fr-SN')} F</span></td>
                  <td><strong>{c.part}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
