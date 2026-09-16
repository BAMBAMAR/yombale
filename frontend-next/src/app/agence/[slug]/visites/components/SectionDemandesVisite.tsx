'use client'

import React from 'react'
import { Calendar, Clock, MapPin, User, Phone, MessageCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface DemandeItem {
  id: string
  bien_id: string
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  contact_id: string
  contact_nom: string
  contact_prenom?: string
  contact_tel?: string
  contact_wa?: string
  date_visite: string
  statut: string
  notes?: string
  created_at: string
}

interface SectionDemandesVisiteProps {
  demandes: DemandeItem[]
  onConfirmer: (visite: DemandeItem) => void
  onDecliner: (visiteId: string) => void
}

export default function SectionDemandesVisite({
  demandes,
  onConfirmer,
  onDecliner,
}: SectionDemandesVisiteProps) {
  if (demandes.length === 0) {
    return (
      <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
        <CheckCircle2 size={36} style={{ margin: '0 auto 12px', color: '#16A34A', opacity: 0.8 }} />
        <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Toutes les demandes sont traitées !</p>
        <p style={{ fontSize: 13.5, maxWidth: 460, margin: '6px auto 0' }}>
          Aucune nouvelle demande de visite en attente. Dès qu'un internaute formule un souhait sur votre vitrine ou la marketplace, il apparaîtra ici.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {demandes.map(d => {
        const clientTel = (d.contact_wa || d.contact_tel || '').replace(/[^0-9]/g, '')
        const dateStr = d.date_visite ? new Date(d.date_visite).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'À convenir'
        const waContactMsg = `Bonjour ${d.contact_nom}, votre agence immobilière vous contacte suite à votre demande de visite pour le bien "${d.bien_titre}".`

        return (
          <div
            key={d.id}
            className="agence-card"
            style={{
              padding: 18,
              borderLeft: '4px solid var(--accent, #C75B00)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginBottom: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#FEF3C7',
                      color: '#92400E',
                    }}
                  >
                    Nouvelle demande reçue
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Reçue le {new Date(d.created_at || Date.now()).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '6px 0 2px' }}>
                  {d.bien_titre}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12.5 }}>
                  <MapPin size={13} />
                  <span>{d.bien_quartier ? `${d.bien_quartier}, ` : ''}{d.bien_ville}</span>
                </div>
              </div>

              {/* Bloc Prospect */}
              <div style={{ background: '#FAF8F5', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', minWidth: 200 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Prospect Demandeur</div>
                <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 13.5 }}>
                  {d.contact_nom} {d.contact_prenom || ''}
                </div>
                {d.contact_tel && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    {d.contact_tel}
                  </div>
                )}
              </div>
            </div>

            {/* Note ou souhait du prospect */}
            {d.notes && (
              <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: '#334155', border: '1px solid #E2E8F0' }}>
                <strong>Souhait du visiteur :</strong> {d.notes}
              </div>
            )}

            {/* Boutons d'Action Opérationnels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderTop: '1px solid #F1EBE3', paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {clientTel && (
                  <a
                    href={`https://wa.me/${clientTel}?text=${encodeURIComponent(waContactMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'rgba(22, 163, 74, 0.08)',
                      color: '#166534',
                      border: '1px solid rgba(22, 163, 74, 0.25)',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}

                {d.contact_tel && (
                  <a
                    href={`tel:${d.contact_tel}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#FAF8F5',
                      border: '1px solid var(--border, #E8DDD2)',
                      color: 'var(--navy, #1C2B4A)',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <Phone size={13} />
                    <span>Appeler</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => onDecliner(d.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 12px',
                    borderRadius: 6,
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <XCircle size={13} />
                  <span>Décliner</span>
                </button>

                <button
                  type="button"
                  onClick={() => onConfirmer(d)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 16px',
                    borderRadius: 6,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Confirmer & Fixer l'heure</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
