'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import {
  Building2,
  ExternalLink,
  MessageSquare,
  Trash2,
  Crown,
  Sparkles,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Home,
  ShieldCheck,
} from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import { adminModererAgence, adminSupprimerAgence } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'
import {
  AgenceImmo,
  formatDate,
  isSponsorActif,
  isAgenceActive,
  getPlanLabel,
  genererMessageGuideAgence,
} from './types'

interface AgenceImmoRowProps {
  agence: AgenceImmo
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
  onOpenGestion: (a: AgenceImmo) => void
  onOpenRelance: (a: AgenceImmo) => void
}

export default function AgenceImmoRow({
  agence,
  isSelected,
  onToggleSelect,
  onAction,
  onOpenGestion,
  onOpenRelance,
}: AgenceImmoRowProps) {
  const [pending, startTransition] = useTransition()
  const isActif = isAgenceActive(agence)
  const isSponsor = isSponsorActif(agence)
  const planInfo = getPlanLabel(agence.abonnement_plan)
  const nbBiens = agence.nb_biens ?? 0
  const nbBaux = agence.nb_baux_actifs ?? 0

  const handleToggleStatut = () => {
    const nextStatut = isActif ? 'suspendu' : 'actif'
    startTransition(async () => {
      const res = await adminModererAgence(agence.id, { statut: nextStatut })
      if (res.success) {
        showToast(
          `Agence "${agence.nom}" : statut passé à "${nextStatut === 'actif' ? 'Active' : 'Suspendue'}".`,
          'success',
          'Modération Agence'
        )
        onAction()
      } else {
        showToast(res.error || 'Erreur lors de la modération', 'error', 'Modération Agence')
      }
    })
  }

  const handleSupprimer = () => {
    if (!window.confirm(`Supprimer définitivement l'agence "${agence.nom}" et ses données rattachées ?`)) {
      return
    }
    startTransition(async () => {
      const res = await adminSupprimerAgence(agence.id)
      if (res.success) {
        showToast(`Agence "${agence.nom}" supprimée avec succès.`, 'success', 'Suppression Agence')
        onAction()
      } else {
        showToast(res.error || 'Erreur lors de la suppression', 'error', 'Suppression Agence')
      }
    })
  }

  const tel = agence.whatsapp || agence.telephone || ''
  const cleanPhone = tel.replace(/\D/g, '')
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`}?text=${encodeURIComponent(
        genererMessageGuideAgence(agence)
      )}`
    : null

  const emailDisplay = agence.email_contact || agence.proprietaire_email || agence.email || ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderLeft:
          agence.abonnement_plan === 'immo_multi_agence' || agence.abonnement_plan === 'multi_agence'
            ? '4px solid #b45309'
            : agence.abonnement_plan === 'immo_pro' || agence.abonnement_plan === 'pro'
              ? '4px solid #7c3aed'
              : isSponsor
                ? '4px solid #f59e0b'
                : !isActif
                  ? '4px solid #ef4444'
                  : '4px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        padding: '14px 16px',
        opacity: pending ? 0.6 : 1,
        transition: 'opacity .2s',
      }}
    >
      {/* Checkbox de sélection */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      {/* Logo / Initiale Agence */}
      <div
        style={{
          flexShrink: 0,
          width: 52,
          height: 52,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {agence.logo_url ? (
          <ExternalImg
            src={agence.logo_url}
            alt={agence.nom}
            style={{ width: 52, height: 52, objectFit: 'cover' }}
            fallback={<Building2 size={24} color="#94a3b8" />}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#ede9fe',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            {agence.nom?.substring(0, 2).toUpperCase() || <Building2 size={20} />}
          </div>
        )}
      </div>

      {/* Informations de l'Agence */}
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
            {agence.nom}
          </span>

          {/* Badge Formule */}
          <span
            style={{
              fontSize: 10,
              background: planInfo.bg,
              color: planInfo.color,
              border: `1px solid ${planInfo.border}`,
              padding: '1px 7px',
              borderRadius: 4,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Crown size={10} />
            {planInfo.label.toUpperCase()}
          </span>

          {/* Badge Sponsoring */}
          {isSponsor && (
            <span
              style={{
                fontSize: 10,
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Sparkles size={10} />
              EN VEDETTE
            </span>
          )}

          {/* Badge Nombre de Biens */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              background:
                nbBiens === 0 ? '#fee2e2' : nbBiens <= 2 ? '#ffedd5' : '#dcfce7',
              color:
                nbBiens === 0 ? '#991b1b' : nbBiens <= 2 ? '#9a3412' : '#166534',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {nbBiens === 0 ? '0 bien (vide)' : `${nbBiens} bien${nbBiens > 1 ? 's' : ''}`}
          </span>

          {/* Badge Baux actifs */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: '#e0f2fe',
              color: '#0369a1',
            }}
          >
            {nbBaux} bail{nbBaux > 1 ? 's' : ''} actif{nbBaux > 1 ? 's' : ''}
          </span>
        </div>

        {/* Coordonnées & Gérant */}
        <div style={{ fontSize: 12, color: 'var(--text2, #475569)', marginBottom: 2 }}>
          <span>{agence.proprietaire_nom ? `Gérant : ${agence.proprietaire_nom}` : 'Compte Pro'}</span>
          {emailDisplay && (
            <span>
              {' · '}
              <a
                href={`mailto:${emailDisplay}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
                title="Envoyer un email"
              >
                {emailDisplay}
              </a>
            </span>
          )}
          {agence.telephone && (
            <span>
              {' · '}
              <a href={`tel:${agence.telephone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {agence.telephone}
              </a>
            </span>
          )}
          {agence.whatsapp && agence.whatsapp !== agence.telephone && (
            <span> · WhatsApp : {agence.whatsapp}</span>
          )}
        </div>

        {/* Adresse & Validité */}
        <div style={{ fontSize: 11, color: 'var(--text3, #94a3b8)' }}>
          {[agence.quartier, agence.ville || 'Dakar'].filter(Boolean).join(', ')}
          {' · '}Inscrite le {formatDate(agence.created_at)}
          {agence.abonnement_fin && (
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>
              {' · '}Plan valide jusqu&apos;au {formatDate(agence.abonnement_fin)}
            </span>
          )}
          {isSponsor && agence.sponsor_jusqu_au && (
            <span style={{ color: '#b45309', fontWeight: 600 }}>
              {' · '}Sponsoring jusqu&apos;au {formatDate(agence.sponsor_jusqu_au)}
            </span>
          )}
          {agence.numero_agrement && (
            <span style={{ color: '#047857', fontWeight: 600 }}>
              {' · '}Agrément : {agence.numero_agrement}
            </span>
          )}
        </div>
      </div>

      {/* Statut Visuel */}
      <div style={{ flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            background: isActif ? '#ecfdf5' : '#fef2f2',
            color: isActif ? '#059669' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isActif ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {isActif ? 'Active' : 'Suspendue'}
        </span>
      </div>

      {/* Bloc d'Actions Directes */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 160,
        }}
      >
        {/* Ligne Relance / WhatsApp */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => onOpenRelance(agence)}
            style={{
              flex: 1,
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 11,
              padding: '6px 8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            title="Envoyer le guide d'ajout de biens et baux locatifs à l'agence"
          >
            Relancer
          </button>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366',
                color: '#ffffff',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 12,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Ouvrir directement dans WhatsApp avec message pré-rempli"
            >
              <MessageSquare size={14} />
            </a>
          )}
        </div>

        {/* Bouton Gérer l'agence (modale complète) */}
        <button
          type="button"
          onClick={() => onOpenGestion(agence)}
          style={{
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            padding: '6px 10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Crown size={12} color="#f59e0b" />
          <span>Gérer l&apos;agence</span>
        </button>

        {/* Liens Vitrine & Espace Pro */}
        <div style={{ display: 'flex', gap: 4 }}>
          <Link
            href={`/agence/${agence.slug || agence.id}/vitrine`}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: '#f8fafc',
              color: 'var(--navy, #1C2B4A)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 6,
              fontSize: 11,
              padding: '5px 6px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
            title="Consulter la vitrine publique de l'agence"
          >
            <span>Vitrine</span>
            <ExternalLink size={10} />
          </Link>
          <Link
            href={`/agence/${agence.slug || agence.id}`}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: '#ede9fe',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
              borderRadius: 6,
              fontSize: 11,
              padding: '5px 6px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
            title="Accéder au tableau de bord agence"
          >
            <span>Espace Pro</span>
          </Link>
        </div>

        {/* Bascule Activer/Suspendre & Suppression */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={handleToggleStatut}
            disabled={pending}
            style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 8px',
              borderRadius: 6,
              border: `1px solid ${isActif ? '#fca5a5' : '#86efac'}`,
              background: isActif ? '#fef2f2' : '#ecfdf5',
              color: isActif ? '#991b1b' : '#166534',
              cursor: pending ? 'not-allowed' : 'pointer',
            }}
          >
            {pending ? '…' : isActif ? 'Suspendre' : 'Activer'}
          </button>
          <button
            type="button"
            onClick={handleSupprimer}
            disabled={pending}
            style={{
              fontSize: 11,
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              borderRadius: 6,
              padding: '5px 8px',
              cursor: pending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Supprimer définitivement cette agence"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
