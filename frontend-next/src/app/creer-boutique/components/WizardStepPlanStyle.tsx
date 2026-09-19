'use client'

import React from 'react'
import { Check, Palette, Sparkles } from 'lucide-react'
import CategorieSelector from './CategorieSelector'

export interface PlanConfigItem {
  name: string
  badge: string
  priceMain: string
  priceSub: string
  desc: string
  features: string[]
  color: string
  bgLight: string
}

export interface PlansConfig {
  decouverte: PlanConfigItem
  pro: PlanConfigItem
  business: PlanConfigItem
}

export const DEFAULT_PLANS: PlansConfig = {
  decouverte: {
    name: 'Boutique Taf Taf',
    badge: '1 MOIS OFFERT',
    priceMain: '0 FCFA',
    priceSub: 'pendant 30j puis 2.500 FCFA/mois',
    desc: 'Idéal pour débuter et vendre directement sur WhatsApp.',
    features: ['Catalogue illimité', 'Ventes WhatsApp 1-clic', 'Paiement Wave & OM'],
    color: '#10b981',
    bgLight: '#ecfdf5',
  },
  pro: {
    name: 'Vendeur Pro',
    badge: 'POPULAIRE',
    priceMain: '0 FCFA',
    priceSub: 'pendant 30j puis 5.000 FCFA/mois',
    desc: 'Pour les commerces voulant être en tête des recherches.',
    features: ['Badge Pro Certifié', 'Référencement prioritaire', 'Caisse POS & Reçus PDF'],
    color: '#C75B00',
    bgLight: '#fff7ed',
  },
  business: {
    name: 'Business VIP',
    badge: 'MULTI-SITES & API',
    priceMain: '0 FCFA',
    priceSub: 'pendant 30j puis 10.000 FCFA/mois',
    desc: 'Solution complète pour chaînes, grossistes & marques.',
    features: ['Multi-Caissiers & Magasins', 'Clés API & Webhooks', 'Relances WhatsApp Auto'],
    color: '#1e3a5f',
    bgLight: '#f0f9ff',
  },
}

interface WizardStepPlanStyleProps {
  plansConfig: PlansConfig
  plan: 'decouverte' | 'pro' | 'business'
  setPlan: (plan: 'decouverte' | 'pro' | 'business') => void
  categorie: string
  setCategorie: (cat: string) => void
  couleur: string
  setCouleur: (col: string) => void
  contratRequis: boolean
  accepteContrat: boolean
  setAccepteContrat: (accepted: boolean) => void
  onOpenContratModal: () => void
}

const THEME_COLORS = [
  { hex: '#C75B00', label: 'Orange Nopalou' },
  { hex: '#1C2B4A', label: 'Bleu Marine' },
  { hex: '#0A5C36', label: 'Vert Émeraude' },
  { hex: '#2563EB', label: 'Bleu Royal' },
  { hex: '#7C3AED', label: 'Violet Luxe' },
  { hex: '#0F172A', label: 'Noir Chic' },
]

export default function WizardStepPlanStyle({
  plansConfig,
  plan,
  setPlan,
  categorie,
  setCategorie,
  couleur,
  setCouleur,
  contratRequis,
  accepteContrat,
  setAccepteContrat,
  onOpenContratModal,
}: WizardStepPlanStyleProps) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            fontSize: 12,
            fontWeight: 900,
            padding: '6px 16px',
            borderRadius: 20,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <Sparkles size={13} />
          1er mois 100% offert sur tous nos forfaits
        </span>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}
        >
          Choisissez votre formule &amp; style
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Testez gratuitement pendant 30 jours sans aucun engagement bancaire.
        </p>
      </div>

      {/* Grille des 3 forfaits */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {(['decouverte', 'pro', 'business'] as const).map((pId) => {
          const p = plansConfig[pId]
          const isSelected = plan === pId

          return (
            <div
              key={pId}
              onClick={() => setPlan(pId)}
              style={{
                padding: '20px 18px',
                borderRadius: 20,
                cursor: 'pointer',
                border: isSelected ? `2.5px solid ${p.color}` : '1.5px solid #e2e8f0',
                background: isSelected ? p.bgLight : '#ffffff',
                boxShadow: isSelected ? `0 12px 28px -6px ${p.color}35` : '0 4px 12px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span
                    style={{
                      background: p.color,
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '3px 10px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {p.badge}
                  </span>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: isSelected ? `2px solid ${p.color}` : '2px solid #cbd5e1',
                      background: isSelected ? p.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  {p.name}
                </h3>

                <div style={{ margin: '8px 0 12px' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: p.color }}>
                    {p.priceMain}
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                    {p.priceSub}
                  </p>
                </div>

                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: '0 0 14px' }}>
                  {p.desc}
                </p>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  paddingTop: 12,
                }}
              >
                {p.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Check size={14} color={p.color} strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Type de boutique / Secteur d'activité avec liste restreinte & affichage étendu */}
      <CategorieSelector
        value={categorie}
        onChange={setCategorie}
        label="Secteur d'activité :"
        description="Sélectionnez le rayon principal de votre commerce dans l'annuaire."
      />

      {/* Couleur thème de la boutique */}
      <div
        style={{
          background: '#f8fafc',
          padding: '16px 20px',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: 10,
          }}
        >
          <Palette size={16} color="var(--accent, #C75B00)" />
          Couleur identité de votre vitrine :
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {THEME_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => setCouleur(c.hex)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: c.hex,
                border: 'none',
                cursor: 'pointer',
                boxShadow: couleur === c.hex ? `0 0 0 3px #ffffff, 0 0 0 6px ${c.hex}` : '0 2px 6px rgba(0,0,0,0.1)',
                transform: couleur === c.hex ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {couleur === c.hex && <Check size={16} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      {/* Acceptation contrat & CGU Marchand */}
      {contratRequis && (
        <div
          style={{
            background: '#FFF7ED',
            border: '1.5px solid #FED7AA',
            borderRadius: 18,
            padding: '16px 20px',
            marginTop: 20,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
              fontSize: 13,
              color: '#1e293b',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={accepteContrat}
              onChange={(e) => setAccepteContrat(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#C75B00' }}
            />
            <span>
              J&apos;accepte la{' '}
              <button
                type="button"
                onClick={onOpenContratModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C75B00',
                  fontWeight: 900,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                Charte Vendeur &amp; les CGU Marchand Nopalou
              </button>{' '}
              (responsabilités, commissions &amp; délais de reversement).
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
