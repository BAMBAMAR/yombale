'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Building2, Check, Sparkles, Crown, ArrowRight } from 'lucide-react'
import { DureeOption, DUREES_INITIALES } from './tarifsData'

export interface DynamicPlan {
  id: string
  slug: string
  label: string
  prix_mensuel: number
  badge?: string | null
  couleur?: string
  avantages: string[]
  limites?: Record<string, any>
  ordre?: number
  actif: boolean
  visibilite?: string
  description?: string
  categorie: 'boutique' | 'immo' | string
}

interface TarifsPublicsSelectorProps {
  initialSecteur?: 'commerce' | 'immo'
  secteur?: 'commerce' | 'immo'
  onSecteurChange?: (secteur: 'commerce' | 'immo') => void
  initialPlans?: DynamicPlan[]
}

const FALLBACK_PLANS: DynamicPlan[] = [
  {
    id: 'gratuit',
    slug: 'gratuit',
    label: 'Boutique Gratuite',
    prix_mensuel: 0,
    badge: 'Départ',
    couleur: '#64748b',
    avantages: ['Page boutique vitrine visible sur Nopalou', 'Coordonnées et contact WhatsApp direct', 'Jusqu\'à 2 annonces classées incluses'],
    limites: { max_produits: 10, max_caissiers: 1 },
    ordre: 0,
    actif: true,
    description: 'Pour lancer sa visibilité sur internet sans frais.',
    categorie: 'boutique'
  },
  {
    id: 'decouverte',
    slug: 'decouverte',
    label: 'Boutique Taf Taf',
    prix_mensuel: 2500,
    badge: 'Populaire',
    couleur: '#10b981',
    avantages: ['Carnet de dettes client & relances WhatsApp', 'Catalogue connecté avec commandes WhatsApp', 'Encaissement direct Wave & Orange Money', 'Import IA magique de produits', '0% de commission', '1er mois 100% OFFERT'],
    limites: { max_produits: 50, max_caissiers: 1 },
    ordre: 1,
    actif: true,
    description: 'Pour les commerçants souhaitant digitaliser leurs ventes et carnet de crédits.',
    categorie: 'boutique'
  },
  {
    id: 'pro',
    slug: 'pro',
    label: 'Boutique Pro',
    prix_mensuel: 5000,
    badge: 'Recommandé',
    couleur: '#f59e0b',
    avantages: ['Tout le contenu Taf Taf', 'Caisse POS tactile magasin & tickets', 'Saisie express & scanner code-barres', 'Référencement prioritaire & Badge Certifié', '5 annonces classées incluses / mois', 'Analytics avancés', '1er mois 100% OFFERT'],
    limites: { max_produits: 300, max_caissiers: 3 },
    ordre: 2,
    actif: true,
    description: 'Pour les boutiques avec point de vente physique nécessitant une caisse POS.',
    categorie: 'boutique'
  },
  {
    id: 'business',
    slug: 'business',
    label: 'Boutique Business VIP',
    prix_mensuel: 10000,
    badge: 'VIP',
    couleur: '#6366f1',
    avantages: ['Tout le contenu Pro', 'Relances automatiques WhatsApp des dettes & paniers', 'Multi-caissiers avec codes PIN & clôtures Z', 'Multi-magasins & transferts de stock', 'Portail Développeur API & Webhooks', 'Comptabilité fournisseurs & Bons de commande', '1er mois 100% OFFERT'],
    limites: { max_produits: 2000, max_caissiers: 10 },
    ordre: 3,
    actif: true,
    description: 'La solution tout-en-un pour les moyennes et grandes enseignes.',
    categorie: 'boutique'
  },
  {
    id: 'immo_essentiel',
    slug: 'immo_essentiel',
    label: 'Plan Agence Essentiel',
    prix_mensuel: 0,
    badge: 'Inclus de Base',
    couleur: '#0A5C36',
    avantages: ['Jusqu\'à 5 agents négociateurs inclus', 'Mandats & biens illimités avec photos HD', 'Baux de location conformes normes OHADA', 'Émission de Quittances de Loyer certifiées avec QR Code', 'Contact direct WhatsApp avec acquéreurs & locataires', '100% GRATUIT sans engagement de durée'],
    limites: { max_biens: -1, max_agents: 5 },
    ordre: 10,
    actif: true,
    description: 'Pour démarrer votre cabinet, gérer vos mandats et vos baux conformes.',
    categorie: 'immo'
  },
  {
    id: 'immo_pro',
    slug: 'immo_pro',
    label: 'Plan Agence Pro & Croissance',
    prix_mensuel: 10000,
    badge: 'Recommandé Pro',
    couleur: '#1C2B4A',
    avantages: ['Tout le forfait Essentiel', 'Jusqu\'à 20 agents négociateurs & gestionnaires', 'Collecte des loyers 1-clic par Wave & Orange Money (/payer-loyer)', 'Relances automatiques WhatsApp des impayés de loyer', 'Reddition des comptes bailleurs & exports comptables', 'CRM Matching WhatsApp', '1er mois 100% OFFERT'],
    limites: { max_biens: -1, max_agents: 20 },
    ordre: 11,
    actif: true,
    description: 'Pour les cabinets et gestionnaires locatifs : quittances automatiques et loyers Wave.',
    categorie: 'immo'
  },
  {
    id: 'immo_multi_agence',
    slug: 'immo_multi_agence',
    label: 'Option Réseau Multi-Agences',
    prix_mensuel: 15000,
    badge: 'Multi-Succursales',
    couleur: '#7C3AED',
    avantages: ['Tout le forfait Agence Pro', 'Agents négociateurs illimités', 'Gestion multi-succursales, filiales et agences secondaires', 'Tableaux de bord consolidés groupe & suivi des royalties', 'Déploiement multi-villes (Dakar, Saly, Thiès...)', 'Account Manager VIP dédié 7j/7', '1er mois 100% OFFERT'],
    limites: { max_biens: -1, max_agents: -1 },
    ordre: 12,
    actif: true,
    description: 'Pour les grands réseaux d\'agences, franchises et groupes immobiliers multi-sites.',
    categorie: 'immo'
  },
  {
    id: 'immo_sponsoring',
    slug: 'immo_sponsoring',
    label: 'Mise en Avant Annuaire (Sponsoring)',
    prix_mensuel: 5000,
    badge: 'En Vedette',
    couleur: '#C75B00',
    avantages: ['Affichage en tête d\'annuaire des agences immobilières (/agences)', 'Badge "En Vedette" doré sur toutes les annonces de biens', 'Priorité absolue dans le moteur de recherche et le chatbot', 'Visibilité maximale auprès des propriétaires bailleurs'],
    limites: { sponsoring: true, duree_jours: 30 },
    ordre: 13,
    actif: true,
    description: 'Propulse votre agence en 1ère position de l\'annuaire public Nopalou.',
    categorie: 'immo'
  }
]

export default function TarifsPublicsSelector({
  initialSecteur = 'commerce',
  secteur: controlledSecteur,
  onSecteurChange,
  initialPlans,
}: TarifsPublicsSelectorProps = {}) {
  const [internalSecteur, setInternalSecteur] = useState<'commerce' | 'immo'>(initialSecteur)
  const secteur = controlledSecteur ?? internalSecteur

  const handleSelectSecteur = (s: 'commerce' | 'immo') => {
    setInternalSecteur(s)
    onSecteurChange?.(s)
  }

  const [duree, setDuree] = useState<number>(12) // 12 mois par défaut
  const [allPlans, setAllPlans] = useState<DynamicPlan[]>(initialPlans || FALLBACK_PLANS)
  const [dureesOptions, setDureesOptions] = useState<DureeOption[]>(DUREES_INITIALES)

  // Chargement 100% dynamique depuis la base de données (API publique administrable)
  useEffect(() => {
    // 1. Récupération des forfaits en temps réel depuis PostgreSQL
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/plans/public`)
      .then(res => res.json())
      .then(data => {
        if (data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setAllPlans(data.plans)
        }
      })
      .catch(() => {})

    // 2. Récupération des taux de réduction administrables depuis configurations_site
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/settings/public`)
      .then(res => res.json())
      .then(settings => {
        if (!settings) return
        if (settings.reduc_3_mois || settings.reduc_6_mois || settings.reduc_12_mois) {
          const r3 = Number(settings.reduc_3_mois) / 100 || 0.10
          const r6 = Number(settings.reduc_6_mois) / 100 || 0.15
          const r12 = Number(settings.reduc_12_mois) / 100 || 0.25
          setDureesOptions([
            { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
            { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: r3, badge: `-${r3 * 100}%` },
            { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: r6, badge: `-${r6 * 100}%` },
            { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: r12, badge: `-${r12 * 100}% (3 mois offerts)` },
          ])
        }
      })
      .catch(() => {})
  }, [])

  const optionDuree = dureesOptions.find(d => d.mois === duree) || dureesOptions[0]

  // Séparation dynamique entre boutiques et agences
  const activePlans = secteur === 'immo'
    ? allPlans.filter(p => p.categorie === 'immo' && p.actif !== false && p.slug !== 'immo_sponsoring')
    : allPlans.filter(p => p.categorie !== 'immo' && p.actif !== false)

  const sponsoringPlan = allPlans.find(p => p.slug === 'immo_sponsoring')

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* SÉLECTEUR D'UNIVERS : COMMERCES VS AGENCES IMMOBILIÈRES */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div
          style={{
            display: 'inline-flex',
            background: '#ffffff',
            padding: '5px',
            borderRadius: 30,
            border: '1.5px solid var(--border, #E8DDD2)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
            gap: 6,
            maxWidth: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectSecteur('commerce')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: secteur === 'commerce' ? 850 : 650,
              border: 'none',
              cursor: 'pointer',
              background: secteur === 'commerce' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: secteur === 'commerce' ? '#ffffff' : 'var(--navy, #1C2B4A)',
              boxShadow: secteur === 'commerce' ? '0 3px 10px rgba(28,43,74,0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Store size={15} color={secteur === 'commerce' ? '#fed7aa' : 'currentColor'} />
            <span>Commerces, Boutiques &amp; POS</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSecteur('immo')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: secteur === 'immo' ? 850 : 650,
              border: 'none',
              cursor: 'pointer',
              background: secteur === 'immo' ? '#7c3aed' : 'transparent',
              color: secteur === 'immo' ? '#ffffff' : 'var(--navy, #1C2B4A)',
              boxShadow: secteur === 'immo' ? '0 3px 10px rgba(124,58,237,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={15} color={secteur === 'immo' ? '#fed7aa' : 'currentColor'} />
            <span>Agences &amp; Gestion Locative</span>
            <span style={{ fontSize: 9.5, fontWeight: 900, background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '1px 6px', borderRadius: 6 }}>
              IMMO
            </span>
          </button>
        </div>
      </div>

      {/* SÉLECTEUR DE DURÉE */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
          Choisissez la durée de votre abonnement (Remises configurées) :
        </p>

        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            background: '#ffffff',
            padding: 8,
            borderRadius: 20,
            border: '1.5px solid var(--border, #E8DDD2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            maxWidth: 680,
            width: '100%',
          }}
        >
          {dureesOptions.map(d => {
            const isSelected = duree === d.mois
            const accentColor = secteur === 'immo' ? '#7c3aed' : '#C75B00'
            const accentBg = secteur === 'immo' ? '#f5f3ff' : '#fff7ed'
            const accentText = secteur === 'immo' ? '#6d28d9' : '#9a3412'

            return (
              <button
                key={d.mois}
                type="button"
                onClick={() => setDuree(d.mois)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: isSelected ? `2px solid ${accentColor}` : '1px solid transparent',
                  background: isSelected ? accentBg : 'transparent',
                  color: isSelected ? accentText : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
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
                      background: d.mois === 12 ? '#10b981' : accentColor,
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
                <p style={{ margin: 0, fontWeight: isSelected ? 900 : 700, fontSize: 14 }}>{d.label}</p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: isSelected ? accentColor : '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {d.sousTitre}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* GRILLE DYNAMIQUE DES CARTES DE FORFAITS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24, marginBottom: 28 }}>
        {activePlans.map(plan => {
          const prixBase = Number(plan.prix_mensuel) || 0
          const totalBrut = prixBase * duree
          const totalApresRemise = Math.round(totalBrut * (1 - optionDuree.remise))
          const mensuelEquiv = Math.round(totalApresRemise / duree)
          const economie = totalBrut - totalApresRemise
          const isHighlight = Boolean(plan.badge && (plan.badge.toLowerCase().includes('recommandé') || plan.badge.toLowerCase().includes('populaire')))
          const planColor = plan.couleur || (secteur === 'immo' ? '#7c3aed' : '#0284c7')

          const ctaHref = secteur === 'immo'
            ? `/inscription?role=agence&plan=${plan.slug}&duree=${duree}&redirect=/agence`
            : `/creer-boutique?plan=${plan.slug}&duree=${duree}`

          const ctaText = prixBase === 0
            ? (secteur === 'immo' ? 'Créer mon agence gratuite' : 'Créer ma boutique gratuite')
            : 'Choisir cette formule (1 mois offert)'

          return (
            <div
              key={plan.slug}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '28px 24px',
                border: isHighlight ? `2.5px solid ${planColor}` : '1.5px solid var(--border, #E8DDD2)',
                boxShadow: isHighlight
                  ? `0 12px 35px rgba(0,0,0,0.08)`
                  : '0 8px 24px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {plan.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -13,
                    right: 20,
                    background: planColor,
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Sparkles size={11} />
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, margin: '8px 0 6px', color: 'var(--navy, #1C2B4A)' }}>
                  {plan.label}
                </h3>
                {plan.description && (
                  <p style={{ color: 'var(--text-subtle, #5A4E42)', fontSize: 13, margin: '0 0 18px', lineHeight: 1.45, minHeight: 38 }}>
                    {plan.description}
                  </p>
                )}

                {/* TARIFICATION DYNAMIQUE */}
                <div style={{ marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: prixBase === 0 ? '#10b981' : 'var(--navy, #1C2B4A)' }}>
                      {prixBase === 0 ? '100% Inclus' : `${mensuelEquiv.toLocaleString('fr-FR')} FCFA`}
                    </span>
                    {prixBase > 0 && <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>/ mois</span>}
                  </div>

                  {duree > 1 && prixBase > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                      Facturé <strong>{totalApresRemise.toLocaleString('fr-FR')} FCFA</strong> pour {duree} mois
                    </div>
                  )}

                  {economie > 0 && (
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 8,
                      }}
                    >
                      Économie : {economie.toLocaleString('fr-FR')} FCFA ({optionDuree.badge})
                    </div>
                  )}
                </div>

                {/* LISTE DES AVANTAGES DYNAMIQUES */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    fontSize: 13,
                    color: '#334155',
                  }}
                >
                  {(Array.isArray(plan.avantages) ? plan.avantages : []).map((ft, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check
                        size={15}
                        color={planColor}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span>{ft}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={ctaHref}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  textAlign: 'center',
                  background: isHighlight ? planColor : 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  padding: '13px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                  marginTop: 24,
                  boxShadow: isHighlight ? `0 4px 14px rgba(0,0,0,0.18)` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{ctaText}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )
        })}
      </div>

      {/* ENCADRÉ SPONSORING POUR LE PÔLE IMMOBILIER */}
      {secteur === 'immo' && sponsoringPlan && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: 16,
            border: '1.5px solid #fde68a',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 900,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                padding: '2px 8px',
                borderRadius: 10,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 4,
              }}
            >
              <Sparkles size={11} color="#b45309" />
              {sponsoringPlan.badge || 'Option Vedette Annuaire'}
            </span>
            <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: '#78350f' }}>
              {sponsoringPlan.label} — {Number(sponsoringPlan.prix_mensuel).toLocaleString('fr-FR')} FCFA / mois
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: '#92400e', lineHeight: 1.45 }}>
              {sponsoringPlan.description || 'Propulse votre cabinet en tête des recherches sur l\'annuaire officiel des agences (/agences) pour maximiser vos mandats exclusifs.'}
            </p>
          </div>

          <Link
            href={`/inscription?role=agence&plan=${sponsoringPlan.slug}&redirect=/agence`}
            style={{
              background: '#b45309',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Activer le Sponsoring</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}
