'use client'

import React from 'react'
import Link from 'next/link'
import { Bell, Calendar, AlertTriangle, Clock, Wrench } from 'lucide-react'

export interface CompteursAlertes {
  demandes_visite: number
  loyers_retard: number
  mandats_expirants: number
  baux_expirants: number
  tickets_urgents: number
  total_alertes: number
}

interface DashboardAlertesPrioritairesProps {
  slug: string
  compteurs: CompteursAlertes
}

export function DashboardAlertesPrioritaires({ slug, compteurs }: DashboardAlertesPrioritairesProps) {
  const aDesAlertes =
    compteurs.demandes_visite > 0 ||
    compteurs.loyers_retard > 0 ||
    compteurs.mandats_expirants > 0 ||
    compteurs.tickets_urgents > 0

  if (!aDesAlertes) return null

  return (
    <div
      style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Bell size={18} color="#D97706" />
        <h2 style={{ fontSize: 14.5, fontWeight: 800, color: '#92400E', margin: 0 }}>
          Actions Prioritaires Requises
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
        {compteurs.demandes_visite > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 14px',
              border: '1px solid #FCD34D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="var(--accent, #C75B00)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                  {compteurs.demandes_visite} demande(s) de visite
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>En attente de confirmation</div>
              </div>
            </div>
            <Link
              href={`/agence/${slug}/visites?tab=demandes`}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Traiter →
            </Link>
          </div>
        )}

        {compteurs.loyers_retard > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 14px',
              border: '1px solid #FECACA',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#DC2626" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#DC2626' }}>
                  {compteurs.loyers_retard} loyer(s) en retard
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>Échéance dépassée</div>
              </div>
            </div>
            <Link
              href={`/agence/${slug}/locatif`}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Relancer →
            </Link>
          </div>
        )}

        {compteurs.mandats_expirants > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 14px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#D97706" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                  {compteurs.mandats_expirants} mandat(s) expirants
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>Dans les 30 prochains jours</div>
              </div>
            </div>
            <Link
              href={`/agence/${slug}/mandats`}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Vérifier →
            </Link>
          </div>
        )}

        {compteurs.tickets_urgents > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 14px',
              border: '1px solid #FECACA',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={16} color="#DC2626" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#DC2626' }}>
                  {compteurs.tickets_urgents} ticket(s) urgent(s)
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>Maintenance requise</div>
              </div>
            </div>
            <Link
              href={`/agence/${slug}/maintenance`}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: '#FAF8F5',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Voir →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
