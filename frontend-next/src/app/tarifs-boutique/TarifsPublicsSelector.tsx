'use client'
import { useState } from 'react'
import Link from 'next/link'

interface DureeOption {
  mois: number
  label: string
  sousTitre: string
  remise: number
  badge: string | null
}

const DUREES: DureeOption[] = [
  { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
  { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: 0.10, badge: '-10%' },
  { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: 0.15, badge: '-15%' },
  { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: 0.25, badge: '🔥 -25% (3 mois offerts)' },
]

interface PlanConfig {
  id: string
  nom: string
  tag: string
  badgeSection?: string
  badgeCouleur?: string
  description: string
  prixMensuelBase: number
  populaire?: boolean
  recommande?: boolean
  features: string[]
  ctaText: string
  ctaHref: string
}

const PLANS_CONFIG: PlanConfig[] = [
  {
    id: 'taf_taf',
    nom: 'Boutique Taf Taf',
    tag: 'Formule Populaire',
    description: 'Idéal pour débuter son commerce et vendre immédiatement sur WhatsApp.',
    prixMensuelBase: 5000,
    populaire: true,
    features: [
      'Catalogue de produits illimité',
      'Commandes directes sur WhatsApp',
      'Encaissement Wave & Orange Money',
      'Vitrine personnalisable à votre couleur',
      '0% de commission sur vos ventes',
      '🎁 1er mois 100% offert',
    ],
    ctaText: 'Choisir cette formule (1 mois offert)',
    ctaHref: '/creer-boutique?plan=decouverte',
  },
  {
    id: 'pro',
    nom: 'Vendeur Pro',
    tag: 'Booster de Ventes',
    description: 'Pour les commerces établis voulant maximiser leur visibilité sur Nopalou.',
    prixMensuelBase: 15000,
    recommande: true,
    features: [
      'Tout le contenu de la formule Taf Taf',
      'Badge Vendeur Pro Certifié ⭐',
      'Référencement prioritaire sur le comparateur',
      'Affichage en tête des recherches à Dakar',
      'Support client prioritaire sur WhatsApp',
      'Caisse enregistreuse & Statistiques',
    ],
    ctaText: 'Devenir Vendeur Pro',
    ctaHref: '/creer-boutique?plan=pro',
  },
  {
    id: 'business',
    nom: 'Business VIP',
    tag: 'Solution Globale',
    description: 'Pour les grandes enseignes, grossistes et marques d\'importation.',
    prixMensuelBase: 35000,
    features: [
      'Tout le contenu de la formule Pro',
      'Bannière publicitaire sponsorisée Nopalou',
      'Campagnes de promotion WhatsApp & TikTok',
      'Analytics avancés & statistiques de visites',
      'Account Manager dédié 7j/7',
      'Intégration sur mesure',
    ],
    ctaText: 'Rejoindre le Business VIP',
    ctaHref: '/creer-boutique?plan=business',
  },
]

export default function TarifsPublicsSelector() {
  const [duree, setDuree] = useState<number>(12) // 12 mois par défaut

  const optionDuree = DUREES.find((d) => d.mois === duree) || DUREES[0]

  return (
    <div>
      {/* SÉLECTEUR DE DURÉE */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          Choisissez la durée de votre forfait (Remise selon votre choix) :
        </p>

        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            background: '#ffffff',
            padding: 8,
            borderRadius: 20,
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            maxWidth: 680,
            width: '100%',
          }}
        >
          {DUREES.map((d) => {
            const isSelected = duree === d.mois
            return (
              <button
                key={d.mois}
                onClick={() => setDuree(d.mois)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: isSelected ? '2px solid #C75B00' : '1px solid transparent',
                  background: isSelected ? '#fff7ed' : 'transparent',
                  color: isSelected ? '#9a3412' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  outline: 'none',
                }}
              >
                {d.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 6,
                      background: d.mois === 12 ? '#dc2626' : '#C75B00',
                      color: '#ffffff',
                      fontSize: 9,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 10,
                    }}
                  >
                    {d.badge}
                  </span>
                )}
                <p style={{ margin: 0, fontWeight: isSelected ? 900 : 700, fontSize: 15 }}>{d.label}</p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: isSelected ? '#C75B00' : '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {d.sousTitre}
                </p>
              </button>
            )
          })}
        </div>

        {/* SAISIE DE DURÉE PERSONNALISÉE PAR LE MARCHAND */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
            ✏️ Durée sur mesure (saisissez le nombre de mois) :
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={1}
              max={36}
              value={duree}
              onChange={(e) => {
                const val = Math.max(1, Math.min(36, parseInt(e.target.value, 10) || 1))
                setDuree(val)
              }}
              style={{
                width: 76,
                padding: '6px 10px',
                borderRadius: 10,
                border: '2px solid #C75B00',
                fontWeight: 900,
                fontSize: 16,
                textAlign: 'center',
                outline: 'none',
                background: '#fff7ed',
                color: '#9a3412',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>mois</span>
          </div>
        </div>
      </div>

      {/* GRILLE DES CARTES DE FORFAITS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {PLANS_CONFIG.map((plan) => {
          const remise = duree >= 12 ? 0.25 : duree >= 6 ? 0.15 : duree >= 3 ? 0.10 : duree >= 2 ? 0.05 : 0
          const badgeLabel = duree >= 12 ? '🔥 -25% (3m offerts)' : duree >= 6 ? '-15%' : duree >= 3 ? '-10%' : duree >= 2 ? '-5%' : null
          const totalBrut = plan.prixMensuelBase * duree
          const totalApresRemise = Math.round(totalBrut * (1 - remise))
          const mensuelEquiv = Math.round(totalApresRemise / duree)
          const economie = totalBrut - totalApresRemise

          return (
            <div
              key={plan.id}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 32,
                border: plan.recommande ? '2.5px solid #C75B00' : '1px solid #cbd5e1',
                boxShadow: plan.recommande
                  ? '0 12px 35px rgba(199,91,0,0.15)'
                  : '0 10px 30px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {plan.recommande && (
                <span
                  style={{
                    position: 'absolute',
                    top: -14,
                    right: 24,
                    background: '#C75B00',
                    color: '#ffffff',
                    padding: '4px 14px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  ⭐ Recommandé
                </span>
              )}

              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: plan.recommande ? '#C75B00' : '#475569',
                    background: plan.recommande ? '#fff7ed' : '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: 12,
                  }}
                >
                  {plan.tag}
                </span>

                <h3 style={{ fontSize: 24, fontWeight: 900, margin: '12px 0 8px', color: '#0f172a' }}>
                  {plan.nom}
                </h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
                  {plan.description}
                </p>

                {/* TARIFICATION DYNAMIQUE */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 34, fontWeight: 900, color: '#0f172a' }}>
                      {mensuelEquiv.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span style={{ color: '#64748b', fontSize: 14 }}>/ mois</span>
                  </div>

                  {duree > 1 && (
                    <div style={{ marginTop: 6, fontSize: 13, color: '#475569', fontWeight: 600 }}>
                      Facturé <strong style={{ color: '#0f172a' }}>{totalApresRemise.toLocaleString('fr-FR')} FCFA</strong> pour {duree} mois
                    </div>
                  )}

                  {economie > 0 && (
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        fontSize: 12,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 10,
                      }}
                    >
                      🎉 Économisez {economie.toLocaleString('fr-FR')} FCFA ({badgeLabel})
                    </div>
                  )}
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    fontSize: 14,
                    color: '#334155',
                  }}
                >
                  {plan.features.map((ft, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>
                      <span>{ft}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`${plan.ctaHref}&duree=${duree}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: plan.recommande ? '#C75B00' : '#0f172a',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginTop: 28,
                  boxShadow: plan.recommande ? '0 4px 14px rgba(199,91,0,0.3)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              >
                {plan.ctaText}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
