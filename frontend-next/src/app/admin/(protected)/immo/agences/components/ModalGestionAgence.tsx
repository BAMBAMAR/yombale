'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles,
  ExternalLink,
  Trash2,
  Phone,
  Mail,
  Home,
  MessageSquare,
} from 'lucide-react'
import {
  adminModererAgence,
  adminChangerForfaitAgence,
  adminSupprimerAgence,
} from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'
import {
  AgenceImmo,
  isSponsorActif,
  isAgenceActive,
  formatDate,
  genererMessageGuideAgence,
} from './types'

interface ModalGestionAgenceProps {
  agence: AgenceImmo
  onClose: () => void
  onRefresh: () => void
}

export default function ModalGestionAgence({
  agence,
  onClose,
  onRefresh,
}: ModalGestionAgenceProps) {
  const [pending, startTransition] = useTransition()
  const isActif = isAgenceActive(agence)
  const sponsorActif = isSponsorActif(agence)

  const [planSelect, setPlanSelect] = useState<string>(
    agence.abonnement_plan || 'immo_essentiel'
  )
  const [joursPlanSelect, setJoursPlanSelect] = useState<number>(30)

  const [sponsorChecked, setSponsorChecked] = useState<boolean>(sponsorActif)
  const [joursSponsorSelect, setJoursSponsorSelect] = useState<number>(30)

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleUpdateForfait = () => {
    setMsg(null)
    startTransition(async () => {
      const res = await adminChangerForfaitAgence(agence.id, {
        abonnement_plan: planSelect,
        jours_abonnement: joursPlanSelect,
        sponsorise: sponsorChecked,
        jours_sponsoring: sponsorChecked ? joursSponsorSelect : 0,
      })

      if (res.success) {
        setMsg({ type: 'ok', text: 'Forfait et visibilité mis à jour avec succès !' })
        showToast('Forfait de l\'agence mis à jour.', 'success', 'Gestion Agence')
        setTimeout(() => {
          onRefresh()
          onClose()
        }, 1000)
      } else {
        setMsg({ type: 'err', text: res.error || 'Erreur lors de la mise à jour' })
      }
    })
  }

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
        onRefresh()
        onClose()
      } else {
        showToast(res.error || 'Erreur modération', 'error', 'Modération Agence')
      }
    })
  }

  const handleSupprimer = () => {
    if (!window.confirm(`Confirmez-vous la suppression définitive de l'agence "${agence.nom}" ?`)) {
      return
    }
    startTransition(async () => {
      const res = await adminSupprimerAgence(agence.id)
      if (res.success) {
        showToast(`Agence "${agence.nom}" définitivement supprimée.`, 'success', 'Suppression Agence')
        onRefresh()
        onClose()
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {/* En-tête Modal */}
        <div
          style={{
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{agence.nom}</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>
                {agence.proprietaire_nom || 'Gérant'} · {agence.ville || 'Dakar'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps de la Modale */}
        <div style={{ padding: 22, maxHeight: '80vh', overflowY: 'auto' }}>
          {msg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
                background: msg.type === 'ok' ? '#ecfdf5' : '#fef2f2',
                color: msg.type === 'ok' ? '#047857' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

          {/* Section Forfait & Durée */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Crown size={14} color="#7c3aed" />
              <span>Formule d&apos;Abonnement Agence</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Formule choisie :
                </label>
                <select
                  value={planSelect}
                  onChange={(e) => setPlanSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <option value="immo_essentiel">Essentiel (Gratuit)</option>
                  <option value="immo_pro">Pro (10 000 FCFA/mois)</option>
                  <option value="immo_multi_agence">Multi-Agences (15 000 FCFA/mois)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Durée engagée :
                </label>
                <select
                  value={joursPlanSelect}
                  onChange={(e) => setJoursPlanSelect(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <option value={30}>1 Mois (30j)</option>
                  <option value={90}>3 Mois (90j — 10% reduc)</option>
                  <option value={180}>6 Mois (180j — 15% reduc)</option>
                  <option value={365}>1 An (365j — 25% reduc)</option>
                </select>
              </div>
            </div>

            {agence.abonnement_fin && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Expiration actuelle : {formatDate(agence.abonnement_fin)}
              </div>
            )}

            {/* Sponsoring "En Vedette" */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sponsorChecked}
                  onChange={(e) => setSponsorChecked(e.target.checked)}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={13} color="#f59e0b" />
                  Sponsoring / Badge Doré &quot;En Vedette&quot;
                </span>
              </label>

              {sponsorChecked && (
                <div style={{ marginTop: 8, paddingLeft: 22 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>
                    Durée de validité du sponsoring :
                  </label>
                  <select
                    value={joursSponsorSelect}
                    onChange={(e) => setJoursSponsorSelect(Number(e.target.value))}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <option value={15}>15 jours</option>
                    <option value={30}>30 jours (1 mois)</option>
                    <option value={60}>60 jours (2 mois)</option>
                    <option value={90}>90 jours (3 mois)</option>
                    <option value={180}>180 jours (6 mois)</option>
                  </select>
                  {agence.sponsor_jusqu_au && (
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
                      (Actuel : {formatDate(agence.sponsor_jusqu_au)})
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleUpdateForfait}
              disabled={pending}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                border: 'none',
                cursor: pending ? 'not-allowed' : 'pointer',
                marginTop: 14,
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? 'Enregistrement…' : 'Valider Formule & Sponsoring'}
            </button>
          </div>

          {/* Raccourcis Directs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Link
              href={`/agence/${agence.slug || agence.id}/vitrine`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                background: '#ffffff',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>Voir Vitrine Publique</span>
              <ExternalLink size={12} />
            </Link>

            <Link
              href={`/agence/${agence.slug || agence.id}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #ddd6fe',
                background: '#ede9fe',
                color: '#6d28d9',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>Accéder Espace Pro</span>
            </Link>
          </div>

          {/* Modération Rapide & Suppression */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={handleToggleStatut}
              disabled={pending}
              style={{
                padding: '10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: isActif ? '#fee2e2' : '#ecfdf5',
                color: isActif ? '#991b1b' : '#047857',
                cursor: pending ? 'not-allowed' : 'pointer',
              }}
            >
              {isActif ? 'Suspendre l\'Agence' : 'Réactiver l\'Agence'}
            </button>

            <button
              type="button"
              onClick={handleSupprimer}
              disabled={pending}
              style={{
                padding: '10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid #fecaca',
                background: '#ffffff',
                color: '#dc2626',
                cursor: pending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <Trash2 size={13} />
              <span>Supprimer Définitivement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
