'use client'

import React from 'react'
import {
  FileText,
  Users2,
  Building2,
  MessageCircle,
  Calendar,
  Wrench,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  FileCheck,
  type LucideIcon
} from 'lucide-react'

interface ErpModule {
  id: string
  icon: LucideIcon
  color: string
  badge: string
  titre: string
  sousTitre: string
  benefices: string[]
}

const ERP_MODULES: ErpModule[] = [
  {
    id: 'locatif',
    icon: FileText,
    color: '#0A5C36',
    badge: 'GESTION LOCATIVE',
    titre: 'Baux Numériques & Quittances OHADA',
    sousTitre: 'Automatisez 100% de la gestion administrative de vos contrats de bail.',
    benefices: [
      'Génération instantanée de baux légaux certifiés conformes OHADA',
      'Quittances de loyer PDFKit avec QR Code anti-fraude et horodatage',
      'Échéancier automatique des loyers et alertes d\'impayés',
      'Indexation annuelle et calcul des charges locatives en 1 clic'
    ]
  },
  {
    id: 'bailleurs',
    icon: Users2,
    color: '#1C2B4A',
    badge: 'ESPACE PROPRIÉTAIRES',
    titre: 'Reddition de Comptes & Bailleurs',
    sousTitre: 'Fidélisez vos propriétaires avec une transparence comptable irréprochable.',
    benefices: [
      'Comptes de gestion mensuels clairs générés automatiquement en PDF',
      'Décompte automatique des honoraires de gestion (5% à 10%)',
      'Reversement des loyers nets aux bailleurs par virement ou Wave',
      'Historique complet des travaux et charges déductibles par lot'
    ]
  },
  {
    id: 'mandats',
    icon: Building2,
    color: '#C75B00',
    badge: 'PORTEFEUILLE BIENS',
    titre: 'Mandats & Vitrine Agence Dédiée',
    sousTitre: 'Valorisez vos biens exclusifs sur une vitrine web moderne à vos couleurs.',
    benefices: [
      'Gestion des mandats de gestion et mandats de vente (simples / exclusifs)',
      'Vitrine agence publique personnalisée (logo, coordonnées, équipe)',
      'Support multi-photos HD, vidéos YouTube, TikTok et visites 3D',
      'Diffusion automatique sur le comparateur et réseau de recherche Nopalou'
    ]
  },
  {
    id: 'crm',
    icon: MessageCircle,
    color: '#16A34A',
    badge: 'CRM & MATCHING IA',
    titre: 'Matching Prospects & WhatsApp IA',
    sousTitre: 'Ne perdez plus aucun acquéreur ni locataire solvable à Dakar.',
    benefices: [
      'Moteur algorithmique de rapprochement automatique (score ≥ 65%)',
      'Notifications WhatsApp immédiates aux prospects dès l\'entrée d\'un bien',
      'Historique des critères de recherche par budget, quartier et standing',
      'Relance automatique des prospects inactifs sans effort manuel'
    ]
  },
  {
    id: 'visites',
    icon: Calendar,
    color: '#0284C7',
    badge: 'PIPELINE VISITES',
    titre: 'Agenda & Gestion des Visites',
    sousTitre: 'Organisez les visites de vos négociateurs et éliminez les rendez-vous manqués.',
    benefices: [
      'Planification de créneaux de visite avec rappels automatiques SMS/WhatsApp',
      'Fiches de visite mobiles remplies sur smartphone par le négociateur',
      'Recueil des avis et contre-propositions des candidats locataires',
      'Statistiques de conversion des visites en baux signés'
    ]
  },
  {
    id: 'maintenance',
    icon: Wrench,
    color: '#D97706',
    badge: 'TRAVAUX & ARTISANS',
    titre: 'Maintenance & Incidents Locatifs',
    sousTitre: 'Traitez les réclamations et travaux sans contestation des propriétaires.',
    benefices: [
      'Signalement des pannes avec photos directement par le locataire',
      'Carnet d\'artisans qualifiés (plomberie, électricité, étanchéité)',
      'Validation préalable des devis par le bailleur en 1 clic',
      'Imputation automatique des factures sur les décomptes de loyer'
    ]
  },
  {
    id: 'compta',
    icon: Calculator,
    color: '#4F46E5',
    badge: 'COMPTABILITÉ SYSCOHADA',
    titre: 'Comptabilité & Commissions Négociateurs',
    sousTitre: 'Pilotez la santé financière et la rémunération de votre cabinet.',
    benefices: [
      'Journal des encaissements et décaissements conforme aux normes SYSCOHADA',
      'Ventilation automatique des commissions entre agents et apporteurs d\'affaires',
      'Suivi des dépôts de garantie en compte séquestre dédié',
      'États récapitulatifs prêts pour vos déclarations fiscales (TVA, BNC, VRS)'
    ]
  },
  {
    id: 'paiements',
    icon: CreditCard,
    color: '#059669',
    badge: 'ENCAISSEMENT 1-CLIC',
    titre: 'Collecte Digitale Wave & Orange Money',
    sousTitre: 'Faites payer vos locataires à distance sans chèque ni manipulation d\'espèces.',
    benefices: [
      'Envoi de liens de paiement directs Wave/OM par message personnalisé',
      'Lettrage automatique de l\'échéance dès confirmation du paiement',
      'Portail public sécurisé de règlement pour les locataires',
      'Délivrance instantanée de la quittance certifiée dès encaissement'
    ]
  }
]

export function AgenceErpModulesGrid() {
  return (
    <section style={{ maxWidth: 1160, margin: '0 auto 70px', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(10, 92, 54, 0.08)', color: 'var(--price, #0A5C36)',
          padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
          marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          <ShieldCheck size={14} />
          <span>La Suite Logicielle Complète Nopalou Immo Pro</span>
        </div>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 900,
          color: 'var(--navy, #1C2B4A)',
          margin: 0,
          lineHeight: 1.2
        }}>
          8 Pôles Métiers pour Piloter 100% de Votre Cabinet
        </h2>
        <p style={{
          fontSize: 15,
          color: 'var(--text-subtle, #5A4E42)',
          maxWidth: 680,
          margin: '10px auto 0',
          lineHeight: 1.5
        }}>
          Fini les logiciels disparates et les classeurs papier. Nopalou rassemble toute la chaîne immobilière sur un outil unique conçu pour la réalité du marché sénégalais.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: 20
      }}>
        {ERP_MODULES.map(m => {
          const Icon = m.icon
          return (
            <div
              key={m.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                padding: '26px 22px',
                border: '1.5px solid var(--border, #E8DDD2)',
                boxShadow: '0 4px 20px rgba(28, 43, 74, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${m.color}15`,
                    color: m.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} color={m.color} />
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: m.color,
                    background: `${m.color}12`,
                    padding: '2px 8px',
                    borderRadius: 6,
                    letterSpacing: '0.04em'
                  }}>
                    {m.badge}
                  </span>
                </div>

                <h3 style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                  margin: '0 0 6px',
                  lineHeight: 1.3
                }}>
                  {m.titre}
                </h3>
                <p style={{
                  fontSize: 12.5,
                  color: 'var(--text-subtle, #5A4E42)',
                  margin: '0 0 16px',
                  lineHeight: 1.45
                }}>
                  {m.sousTitre}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.benefices.map((b, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--text, #1C2B4A)', lineHeight: 1.4 }}>
                      <CheckCircle2 size={14} color={m.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{
                paddingTop: 12,
                borderTop: '1px solid #F1EAE1',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                fontWeight: 800,
                color: m.color
              }}>
                <FileCheck size={14} />
                <span>Opérationnel en production</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
