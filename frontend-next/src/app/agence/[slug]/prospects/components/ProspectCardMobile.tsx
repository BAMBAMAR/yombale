'use client'

import React from 'react'
import { Phone, MessageCircle, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react'

export interface Prospect {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  statut_crm: string
  budget_min?: number
  budget_max?: number
  type_operation?: string
  type_bien_souhaite?: string
  villes_souhaitees?: string[]
  probabilite: number
  nb_visites: number
}

interface ProspectCardMobileProps {
  prospect: Prospect
  onStatusChange: (id: string, statut: string) => void
  onOpenMatching: (prospect: Prospect) => void | Promise<void>
}

const STAGES = [
  { id: 'nouveau', label: 'Nouveau', color: '#92400E', bg: '#FEF3C7' },
  { id: 'qualifie', label: 'Qualifié', color: '#0369A1', bg: '#E0F2FE' },
  { id: 'visite_programmee', label: 'En Visite', color: '#5B21B6', bg: '#EDE9FE' },
  { id: 'offre', label: 'Offre / Négoc.', color: '#C75B00', bg: '#FFEDD5' },
  { id: 'gagne', label: 'Gagné', color: '#166534', bg: '#DCFCE7' },
]

export function ProspectCardMobile({
  prospect,
  onStatusChange,
  onOpenMatching,
}: ProspectCardMobileProps) {
  const currentStage = STAGES.find(s => s.id === prospect.statut_crm) || STAGES[0]
  const telNet = (prospect.whatsapp || prospect.telephone || '').replace(/[^0-9]/g, '')
  const nomComplet = `${prospect.nom} ${prospect.prenom || ''}`.trim()
  const waMsg = `Bonjour ${nomComplet}, suite à votre recherche de bien immobilier sur Dakar, nous avons de nouvelles opportunités à vous présenter.`

  return (
    <div
      className="agence-card"
      style={{
        padding: 14,
        marginBottom: 10,
        borderRadius: 12,
        border: '1px solid var(--border, #E8DDD2)',
        background: '#FFFFFF',
      }}
    >
      {/* ── En-tête : Nom & Étape ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {nomComplet}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
            {prospect.type_bien_souhaite ? (
              <span style={{ textTransform: 'capitalize' }}>
                Recherche : {prospect.type_bien_souhaite}
              </span>
            ) : (
              'Recherche générale'
            )}
            {prospect.villes_souhaitees && prospect.villes_souhaitees.length > 0
              ? ` • ${prospect.villes_souhaitees.join(', ')}`
              : ''}
          </div>
        </div>

        {/* Sélecteur d'étape compact */}
        <select
          value={prospect.statut_crm}
          onChange={(e) => onStatusChange(prospect.id, e.target.value)}
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            padding: '4px 8px',
            borderRadius: 8,
            background: currentStage.bg,
            color: currentStage.color,
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Budget & Visites */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12 }}>
        <div>
          {prospect.budget_max ? (
            <span style={{ fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
              Budget : jusqu'à {Number(prospect.budget_max).toLocaleString('fr-FR')} FCFA
            </span>
          ) : (
            <span style={{ color: '#94A3B8' }}>Budget non précisé</span>
          )}
        </div>
        {prospect.nb_visites && prospect.nb_visites > 0 ? (
          <span style={{ color: '#64748B', fontWeight: 600 }}>
            {prospect.nb_visites} visite(s)
          </span>
        ) : null}
      </div>

      {/* ── Actions Tactiles Rapides ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {/* Bouton Appel */}
        {prospect.telephone && (
          <a
            href={`tel:${prospect.telephone}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textDecoration: 'none',
              minHeight: 38,
            }}
          >
            <Phone size={14} />
            <span>Appeler</span>
          </a>
        )}

        {/* Bouton WhatsApp direct */}
        {telNet && (
          <a
            href={`https://wa.me/${telNet}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1.2,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(22, 163, 74, 0.1)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              color: '#166534',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textDecoration: 'none',
              minHeight: 38,
            }}
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Matching IA */}
        <button
          type="button"
          onClick={() => onOpenMatching(prospect)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(199, 91, 0, 0.1)',
            border: '1px solid rgba(199, 91, 0, 0.3)',
            color: 'var(--accent, #C75B00)',
            fontSize: 12,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
            minHeight: 38,
          }}
          title="Matching automatique avec les biens de l'agence"
        >
          <Sparkles size={14} />
          <span>Match IA</span>
        </button>
      </div>
    </div>
  )
}

export default ProspectCardMobile
