// frontend-next/src/app/admin/(protected)/seo/components/SeoTabPages.tsx
'use client'

import React, { useState } from 'react'
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react'
import { PageSeoStatus } from '../types'

const PAGES_STRATEGIQUES: PageSeoStatus[] = [
  {
    url: '/creer-boutique-en-ligne',
    type: 'Silo B2B Solution',
    titre: 'Créer une Boutique en Ligne au Sénégal (2026)',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com/creer-boutique-en-ligne',
    dansSitemap: true,
    scoreQualite: 96,
    clicsOrganiques: 24,
    impressions: 420,
    conversions: 6,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'Injection FAQPage + CTA interactif GA4',
    statutValidation: 'VALIDÉ',
  },
  {
    url: '/alternative-shopify-senegal',
    type: 'Silo B2B Solution',
    titre: 'Nopalou vs Shopify au Sénégal : Comparatif Factuel',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com/alternative-shopify-senegal',
    dansSitemap: true,
    scoreQualite: 94,
    clicsOrganiques: 38,
    impressions: 290,
    conversions: 4,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'Mise à jour barème commissions Wave 1%',
    statutValidation: 'VALIDÉ',
  },
  {
    url: '/logiciel-caisse-senegal',
    type: 'Silo B2B Solution',
    titre: 'Logiciel de Caisse Enregistreuse au Sénégal (POS)',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com/logiciel-caisse-senegal',
    dansSitemap: true,
    scoreQualite: 95,
    clicsOrganiques: 45,
    impressions: 380,
    conversions: 5,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'Schema SoftwareApplication XOF validé',
    statutValidation: 'VALIDÉ',
  },
  {
    url: '/vendre-sur-whatsapp',
    type: 'Silo B2B Solution',
    titre: 'Vendre sur WhatsApp au Sénégal : Boutique & Commandes',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com/vendre-sur-whatsapp',
    dansSitemap: true,
    scoreQualite: 92,
    clicsOrganiques: 19,
    impressions: 260,
    conversions: 3,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'Validation mobile Core Web Vitals',
    statutValidation: 'VALIDÉ',
  },
  {
    url: '/creer-boutique',
    type: 'Tunnel Onboarding Marchand',
    titre: 'Formulaire Inscription Wizard 30s',
    statusHttp: 200,
    robots: 'noindex, follow',
    canonical: 'https://nopalou.com/creer-boutique-en-ligne',
    dansSitemap: false,
    scoreQualite: 90,
    clicsOrganiques: 0,
    impressions: 0,
    conversions: 18,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'CORR-03: noindex + canonical vers /creer-boutique-en-ligne',
    statutValidation: 'VALIDÉ',
  },
  {
    url: '/categorie/tv-electro/climatiseurs',
    type: 'Catégorie Hub Produit',
    titre: 'Climatiseurs au Sénégal — Meilleurs Prix Comparateur',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com/categorie/tv-electro/climatiseurs',
    dansSitemap: true,
    scoreQualite: 91,
    clicsOrganiques: 166,
    impressions: 2230,
    conversions: 12,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'Télémétrie clics sortants WhatsApp câblée',
    statutValidation: 'VALIDÉ',
  },
  {
    url: '/immo',
    type: 'Portail Pilier',
    titre: 'Immobilier Sénégal — Acheter, Louer, Vendre',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com/immo',
    dansSitemap: true,
    scoreQualite: 88,
    clicsOrganiques: 85,
    impressions: 1840,
    conversions: 2,
    anomaliesOuvertes: 1,
    dernierControle: '2026-10-10',
    derniereCorrection: 'ANO-A11-04: Surveillance Soft-404 maintenue',
    statutValidation: 'RÉSERVE',
  },
  {
    url: '/',
    type: 'Portail Racine',
    titre: 'Nopalou — Comparateur de Prix & Boutiques au Sénégal',
    statusHttp: 200,
    robots: 'index, follow',
    canonical: 'https://nopalou.com',
    dansSitemap: true,
    scoreQualite: 98,
    clicsOrganiques: 310,
    impressions: 4800,
    conversions: 22,
    anomaliesOuvertes: 0,
    dernierControle: '2026-10-10',
    derniereCorrection: 'Audit 5: Schema WebSite + Organization',
    statutValidation: 'VALIDÉ',
  }
]

export default function SeoTabPages() {
  const [pages] = useState<PageSeoStatus[]>(PAGES_STRATEGIQUES)
  const [filtreType, setFiltreType] = useState('TOUS')

  const pagesFiltrees = pages.filter((p) => {
    if (filtreType !== 'TOUS' && !p.type.includes(filtreType)) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Surveillance Technique des Pages & URL Stratégiques
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Contrôle des statuts HTTP, balises d'indexation, canonicals et conformité sitemap XML.
          </p>
        </div>

        <div>
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUS">Toutes les typologies de pages</option>
            <option value="Silo B2B">Silos B2B Solutions</option>
            <option value="Tunnel">Tunnels Onboarding</option>
            <option value="Catégorie">Catégories Comparateur</option>
            <option value="Portail">Portails Piliers</option>
          </select>
        </div>
      </div>

      {/* Tableau des pages */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        overflow: 'hidden'
      }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>URL relative</th>
                <th>Statut HTTP</th>
                <th>Directives Robots</th>
                <th>URL Canonique</th>
                <th>Sitemap XML</th>
                <th>Clics / Impr.</th>
                <th>Dernière Correction</th>
                <th>Contrôle</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagesFiltrees.map((p) => (
                <tr key={p.url}>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: p.type.includes('Silo') ? '#fef3c7' : '#f1f5f9',
                      color: p.type.includes('Silo') ? '#92400e' : '#475569'
                    }}>
                      {p.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>{p.url}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.titre}</div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--green" style={{ fontWeight: 700 }}>
                      {p.statusHttp} OK
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: p.robots.includes('noindex') ? '#fee2e2' : '#ecfdf5',
                      color: p.robots.includes('noindex') ? '#991b1b' : '#065f46'
                    }}>
                      {p.robots}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: 11, color: '#475569' }}>
                      {p.canonical.replace('https://nopalou.com', '') || '/'}
                    </code>
                  </td>
                  <td>
                    {p.dansSitemap ? (
                      <span className="admin-badge admin-badge--green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> Présent
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge--gray">Exclu</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>
                    <span style={{ color: 'var(--price, #0A5C36)' }}>{p.clicsOrganiques}</span> / {p.impressions}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 220, color: '#334155' }}>
                    {p.derniereCorrection}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: p.statutValidation === 'VALIDÉ' ? '#ecfdf5' : '#fffbeb',
                      color: p.statutValidation === 'VALIDÉ' ? '#065f46' : '#92400e',
                      border: p.statutValidation === 'VALIDÉ' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                    }}>
                      {p.statutValidation}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`https://nopalou.com${p.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn-small"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Voir <ExternalLink size={11} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
