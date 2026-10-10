// frontend-next/src/app/admin/(protected)/seo/components/SeoTabSources.tsx
'use client'

import React from 'react'
import {
  Database,
  Radio,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ExternalLink,
  Layers,
  Info
} from 'lucide-react'
import { SourceConnexion } from '../types'
import AdminSeoGoogleTag from './AdminSeoGoogleTag'

const SOURCES_CONFIG: SourceConnexion[] = [
  {
    nom: 'Google Analytics 4 (GA4)',
    badge: 'GA4',
    statut: 'CONNECTÉE',
    methode: 'Balise de mesure globale gtag.js (G-3KGE1YBMVJ) chargée dans RootLayout.',
    frequence: 'Temps réel (Flux continu)',
    derniereSync: 'En continu',
    periodeCouverte: 'Historique depuis mise en ligne',
    limites: 'Bloqué par certains navigateurs avec bloqueur de publicité (AdBlock). Traité avec protection SSR.'
  },
  {
    nom: 'Base Transactionnelle PostgreSQL',
    badge: 'SQL-PG',
    statut: 'CONNECTÉE',
    methode: 'Connexion directe pool pg (Render Database)',
    frequence: 'Temps réel',
    derniereSync: 'À chaque requête admin (no-store)',
    periodeCouverte: '100% de l\'historique des boutiques et abonnements',
    limites: 'Les UTM sont capturés pour les nouvelles boutiques créées après la migration.'
  },
  {
    nom: 'Google Search Console (API Search Analytics)',
    badge: 'GSC',
    statut: 'MANUELLE',
    methode: 'Consultation web manuelle & exports CSV de la propriété nopalou.com.',
    frequence: 'Hebdomadaire (Latence Google de 48-72h)',
    derniereSync: '2026-10-10 18:00 GMT',
    periodeCouverte: '16 derniers mois',
    limites: 'Connexion API directe en attente de configuration du Compte de Service Google Cloud (OAuth 2.0).',
    actionRequise: 'Configurer GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY dans les variables d\'environnement Render.'
  },
  {
    nom: 'Sondes Techniques Google Sénégal (SERP)',
    badge: 'SERP-SN',
    statut: 'MANUELLE',
    methode: 'Contrôles périodiques des positions sur google.sn (IP Sénégal, mode navigation privée).',
    frequence: 'Par cycle d\'audit (J+0, J+7, J+30)',
    derniereSync: '2026-10-10 (Audit 2 & Pilote)',
    periodeCouverte: 'Échantillon représentatif de 100 requêtes prioritaires',
    limites: 'Mesure ponctuelle soumise à la personnalisation géographique de Google Dakar.'
  }
]

export default function SeoTabSources() {
  const badgeStatut = (statut: string) => {
    switch (statut) {
      case 'CONNECTÉE':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' }
      case 'MANUELLE':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
      case 'NON CONNECTÉE':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tableau récapitulatif des sources */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        padding: 22
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Matrice d'Intégrité des Sources de Données SEO
        </h3>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Statut</th>
                <th>Méthode de Collecte</th>
                <th>Fréquence</th>
                <th>Dernière Synchronisation</th>
                <th>Limites d'Interprétation</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES_CONFIG.map((s, i) => {
                const b = badgeStatut(s.statut)
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{s.nom}</div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: '#f1f5f9',
                        color: '#475569',
                        marginTop: 4,
                        display: 'inline-block'
                      }}>
                        [{s.badge}]
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: b.bg,
                        color: b.text,
                        border: `1px solid ${b.border}`
                      }}>
                        {s.statut}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.methode}</td>
                    <td style={{ fontSize: 12 }}>{s.frequence}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{s.derniereSync}</td>
                    <td style={{ fontSize: 12, maxWidth: 260, color: '#64748b' }}>
                      {s.limites}
                      {s.actionRequise && (
                        <div style={{ marginTop: 4, color: 'var(--accent, #C75B00)', fontWeight: 600 }}>
                          Action : {s.actionRequise}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Télémétrie & Flux GA4 existant */}
      <AdminSeoGoogleTag />
    </div>
  )
}
