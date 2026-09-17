'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Phone, MessageCircle, ArrowRight } from 'lucide-react'

interface VisiteDuJour {
  id: string
  date_visite: string
  bien_titre: string
  bien_quartier?: string
  bien_ville: string
  contact_nom: string
  contact_tel?: string
  statut: string
}

interface DashboardMobileVisitesDuJourProps {
  slug: string
  visites: VisiteDuJour[]
  nbAujourdhui: number
}

export function DashboardMobileVisitesDuJour({
  slug,
  visites,
  nbAujourdhui,
}: DashboardMobileVisitesDuJourProps) {
  return (
    <div className="agence-card" style={{ padding: 14, marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(199, 91, 0, 0.1)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={15} />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Visites du Jour ({nbAujourdhui})
          </span>
        </div>

        <Link
          href={`/agence/${slug}/visites`}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent, #C75B00)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          Agenda complet
          <ArrowRight size={13} />
        </Link>
      </div>

      {visites && visites.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visites.slice(0, 3).map((v) => {
            const dateObj = new Date(v.date_visite)
            const heure = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '--:--'
            const telNet = (v.contact_tel || '').replace(/[^0-9]/g, '')
            const waMsg = `Bonjour ${v.contact_nom}, nous vous confirmons votre visite aujourd'hui à ${heure} pour le bien "${v.bien_titre}".`

            return (
              <div
                key={v.id}
                style={{
                  padding: '10px 12px',
                  background: '#FAF8F5',
                  borderRadius: 10,
                  border: '1px solid var(--border, #E8DDD2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      background: 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 7px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {heure}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--navy, #1C2B4A)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {v.contact_nom}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {v.bien_titre} • {v.bien_quartier || v.bien_ville}
                    </div>
                  </div>
                </div>

                {telNet && (
                  <a
                    href={`https://wa.me/${telNet}?text=${encodeURIComponent(waMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: 'rgba(22, 163, 74, 0.1)',
                      color: '#166534',
                      border: '1px solid rgba(22, 163, 74, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '16px 12px',
            textAlign: 'center',
            fontSize: 12.5,
            color: '#64748B',
            background: '#FAF8F5',
            borderRadius: 8,
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          Aucune visite programmée pour aujourd'hui.
        </div>
      )}
    </div>
  )
}

export default DashboardMobileVisitesDuJour
