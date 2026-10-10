// frontend-next/src/app/admin/(protected)/seo/components/SeoTabAlertes.tsx
'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  ShieldAlert,
  Clock,
  ArrowRight
} from 'lucide-react'
import { AlerteSeoItem } from '../types'

const ALERTES_INITIALES: AlerteSeoItem[] = [
  {
    id: 'ALT-01',
    gravite: 'CRITIQUE',
    titre: 'Résolution Soft-404 Streaming racine (loading.tsx)',
    declencheur: 'Émission d\'un code 200 au lieu de 404 sur les fiches supprimées.',
    seuil: 'Toute réponse 200 sur UUID inexistant',
    source: 'SERP-SN',
    dateDetection: '2026-10-10',
    actionRecommandee: 'Suppression effectuée par l\'Agent 10. Statut 404 rétabli.',
    statut: 'RÉSOLUE'
  },
  {
    id: 'ALT-02',
    gravite: 'CRITIQUE',
    titre: 'Cannibalisation B2B /creer-boutique vs /creer-boutique-en-ligne',
    declencheur: 'Indexation concurrente de 2 URLs sur le même mot-clé principal.',
    seuil: 'Deux pages indexables avec même balise title',
    source: 'AUDIT-REF',
    dateDetection: '2026-10-10',
    actionRecommandee: 'Noindex + canonical appliqués. Attente de désindexation GSC.',
    statut: 'RÉSOLUE'
  },
  {
    id: 'ALT-03',
    gravite: 'MAJEURE',
    titre: 'Surveillance Soft-404 local sur le module Immobilier (/immo)',
    declencheur: 'Maintien de app/immo/loading.tsx pour le squelette visuel.',
    seuil: 'Vérification du code HTTP sur /immo/[id-inexistant]',
    source: 'SERP-SN',
    dateDetection: '2026-10-10',
    actionRecommandee: 'Sonde curl post-déploiement pour s\'assurer que introuvableOuRedirection prime.',
    statut: 'SOUS SURVEILLANCE'
  },
  {
    id: 'ALT-04',
    gravite: 'MINEURE',
    titre: 'Index partiel UTM table abonnements',
    declencheur: 'idx_abonnements_utm_source omis de migrate-inline.js.',
    seuil: 'Absence d\'index pour requêtes GROUP BY utm_source',
    source: 'SQL-PG',
    dateDetection: '2026-10-10',
    actionRecommandee: 'Index synchronisé dans migrate-inline.js par l\'Agent 12.',
    statut: 'RÉSOLUE'
  },
  {
    id: 'ALT-05',
    gravite: 'MINEURE',
    titre: 'Fiches catalogue en Thin Content (description = nom)',
    declencheur: '99% des produits du catalogue ont une description identique au titre.',
    seuil: 'Ratio longueur description / nom < 1.1',
    source: 'SQL-PG',
    dateDetection: '2026-10-10',
    actionRecommandee: 'Le filtre AUD-162 écarte la description dupliquée en attendant l\'enrichissement IA.',
    statut: 'SOUS SURVEILLANCE'
  }
]

export default function SeoTabAlertes() {
  const [alertes] = useState<AlerteSeoItem[]>(ALERTES_INITIALES)
  const [filtreGravite, setFiltreGravite] = useState('TOUTES')

  const alertesFiltrees = alertes.filter((a) => {
    if (filtreGravite !== 'TOUTES' && a.gravite !== filtreGravite) return false
    return true
  })

  const badgeGravite = (gravite: string) => {
    switch (gravite) {
      case 'CRITIQUE':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
      case 'MAJEURE':
        return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }
      case 'MINEURE':
        return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' }
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }
    }
  }

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
            Détection Active des Régressions & Alertes de Santé SEO
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Surveillance continue des ruptures techniques, régressions de classement et risques d'indexation.
          </p>
        </div>

        <div>
          <select
            value={filtreGravite}
            onChange={(e) => setFiltreGravite(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUTES">Toutes les gravités</option>
            <option value="CRITIQUE">Critique (P0)</option>
            <option value="MAJEURE">Majeure (P1)</option>
            <option value="MINEURE">Mineure (P2)</option>
          </select>
        </div>
      </div>

      {/* Liste des alertes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {alertesFiltrees.map((a) => {
          const bg = badgeGravite(a.gravite)
          return (
            <div
              key={a.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: bg.bg,
                    color: bg.text,
                    border: `1px solid ${bg.border}`
                  }}>
                    {a.gravite}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    {a.titre}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: a.statut === 'RÉSOLUE' ? '#ecfdf5' : '#fffbeb',
                    color: a.statut === 'RÉSOLUE' ? '#065f46' : '#92400e',
                    border: a.statut === 'RÉSOLUE' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                  }}>
                    {a.statut}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {a.dateDetection}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
                fontSize: 13,
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Condition & Seuil de Déclenchement
                  </strong>
                  <div style={{ color: '#334155' }}>{a.declencheur}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Seuil : {a.seuil}</div>
                </div>

                <div>
                  <strong style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Action Recommandée & Résolution
                  </strong>
                  <div style={{ color: '#065f46', fontWeight: 600 }}>{a.actionRecommandee}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Source de sonde : [{a.source}]
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
