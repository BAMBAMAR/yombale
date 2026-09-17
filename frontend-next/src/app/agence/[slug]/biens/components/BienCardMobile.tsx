'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Pencil,
  Share2,
  MessageCircle,
  MoreVertical,
  Globe,
  Home,
  CheckCircle2,
  Maximize2,
  BedDouble
} from 'lucide-react'
import BienCardMenu from './BienCardMenu'




export interface BienItem {
  id: string
  reference: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  surface_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  statut_occupation: string
  prix_location?: number
  prix_vente?: number
  meuble: boolean
  photos?: string[]
  annonce_publiee_id?: string
  annonce_publiee_actif?: boolean
  nb_visites?: number
  nb_baux_actifs?: number
  created_at?: string
  date_creation?: string
}

interface BienCardMobileProps {
  slug: string
  bien: BienItem
  onEdit: (bien: BienItem) => void
  onDuplicate: (bienId: string) => void
  onArchive: (bienId: string) => void
  onDelete: (bienId: string) => void
  onPublish: (bienId: string) => void
  isPublishing?: boolean
  isSelected?: boolean
  onToggleSelect?: (bienId: string) => void
}

export function BienCardMobile({
  slug,
  bien,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onPublish,
  isPublishing = false,
  isSelected = false,
  onToggleSelect,
}: BienCardMobileProps) {
  const [showMenu, setShowMenu] = useState(false)

  const isLocation = Boolean(bien.prix_location)
  const prix = bien.prix_location || bien.prix_vente || 0
  const isPublie = Boolean(bien.annonce_publiee_id && bien.annonce_publiee_actif)
  const photoPrincipale = Array.isArray(bien.photos) && bien.photos.length > 0 ? bien.photos[0] : null

  const waMessage = `Bonjour, voici notre bien disponible à ${bien.ville}${bien.quartier ? ` (${bien.quartier})` : ''} : "${bien.titre}" - Prix : ${Number(prix).toLocaleString('fr-FR')} FCFA. Contactez-nous pour organiser une visite.`

  return (
    <div
      className="agence-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        marginBottom: 12,
        borderRadius: 12,
        border: isSelected ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
        background: '#FFFFFF',
        boxShadow: isSelected ? '0 4px 12px rgba(199, 91, 0, 0.12)' : undefined,
      }}
    >
      {/* ── Partie Haute : Photo & Badges ── */}
      <div style={{ position: 'relative', width: '100%', height: 140, background: '#F1EBE3' }}>
        {photoPrincipale ? (
          <img
            src={photoPrincipale}
            alt={bien.titre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              gap: 6,
            }}
          >
            <Home size={28} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
              {bien.type_bien}
            </span>
          </div>
        )}

        {/* Badge Statut d'occupation & Checkbox */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(bien.id)}
              className="immo-checkbox"
              style={{ width: 20, height: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            />
          )}
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              background:
                bien.statut_occupation === 'disponible'
                  ? '#DCFCE7'
                  : bien.statut_occupation === 'loue'
                  ? '#E0F2FE'
                  : '#FEF3C7',
              color:
                bien.statut_occupation === 'disponible'
                  ? '#166534'
                  : bien.statut_occupation === 'loue'
                  ? '#0369A1'
                  : '#92400E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {bien.statut_occupation === 'disponible'
              ? 'Disponible'
              : bien.statut_occupation === 'loue'
              ? 'Loué'
              : bien.statut_occupation}
          </span>

          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              background: isLocation ? '#F1F5F9' : '#EDE9FE',
              color: isLocation ? '#334155' : '#5B21B6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {isLocation ? 'Location' : 'Vente'}
          </span>
        </div>

        {/* Badge En Ligne Marketplace */}
        {isPublie && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 7px',
                borderRadius: 6,
                background: 'rgba(22, 163, 74, 0.9)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Globe size={11} />
              En ligne
            </span>
          </div>
        )}
      </div>

      {/* ── Partie Centrale : Détails du Bien ── */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
            Réf : {bien.reference || bien.id.slice(0, 8)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
            {Number(prix).toLocaleString('fr-FR')} FCFA
            {isLocation && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}> / mois</span>}
          </div>
        </div>

        <Link
          href={`/agence/${slug}/biens/${bien.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3
            style={{
              margin: '0 0 6px',
              fontSize: 14.5,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              lineHeight: 1.3,
            }}
          >
            {bien.titre}
          </h3>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: 12, marginBottom: 8 }}>
          <MapPin size={13} color="var(--accent, #C75B00)" />
          <span>{bien.quartier ? `${bien.quartier}, ${bien.ville}` : bien.ville}</span>
        </div>

        {/* Specs : surface & chambres */}
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569', marginBottom: 10 }}>
          {bien.surface_m2 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Maximize2 size={13} color="#94A3B8" />
              {bien.surface_m2} m²
            </span>
          ) : null}
          {bien.nb_chambres ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <BedDouble size={13} color="#94A3B8" />
              {bien.nb_chambres} ch.
            </span>
          ) : null}
          {bien.meuble && (
            <span style={{ color: 'var(--navy, #1C2B4A)', fontWeight: 700 }}>
              • Meublé
            </span>
          )}
        </div>

        {/* ── Barre d'Actions Tactiles Rapides ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 10,
            borderTop: '1px solid var(--border, #E8DDD2)',
          }}
        >
          {/* Voir Fiche */}
          <Link
            href={`/agence/${slug}/biens/${bien.id}`}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 38,
            }}
          >
            Fiche 360°
          </Link>

          {/* Modifier */}
          <button
            type="button"
            onClick={() => onEdit(bien)}
            style={{
              padding: '7px 10px',
              borderRadius: 8,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              minHeight: 38,
            }}
            title="Modifier le bien"
          >
            <Pencil size={13} />
            <span>Éditer</span>
          </button>

          {/* WhatsApp Partage */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(22, 163, 74, 0.09)',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              color: '#166534',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              minHeight: 38,
              minWidth: 38,
            }}
            title="Partager sur WhatsApp"
          >
            <MessageCircle size={15} />
          </a>

          {/* Menu Plus Actions */}
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              padding: '7px',
              borderRadius: 8,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              color: '#64748B',
              cursor: 'pointer',
              minHeight: 38,
              minWidth: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Plus d'actions sur ce bien"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Menu Contextuel Déroulé */}
        {showMenu && (
          <BienCardMenu
            bienId={bien.id}
            isPublie={isPublie}
            isPublishing={isPublishing}
            onPublish={onPublish}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onDelete={onDelete}
            onClose={() => setShowMenu(false)}
          />
        )}

      </div>
    </div>
  )
}

export default BienCardMobile
