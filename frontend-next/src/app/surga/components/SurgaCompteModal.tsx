'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  Crown,
  Sparkles,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bell,
  Home,
  Save,
  ShieldCheck,
  Edit2,
} from 'lucide-react'
import { libelleAbonnement, nomOffre, useSurgaOffre } from '@/lib/surga-offre'

export interface SurgaUser {
  id: string
  nom?: string
  telephone?: string
  email?: string
}

interface SurgaCompteModalProps {
  isOpen: boolean
  onClose: () => void
  user: SurgaUser | null
  statutPremium?: {
    estPremium: boolean
    plan?: string | null
    joursRestants?: number
    source?: string
  }
  onUserUpdated: (user: SurgaUser) => void
  onDeconnexion: () => void
  onSynchroniser: () => void
  isSyncing?: boolean
  onOpenPremium?: () => void
  onOpenEmploi?: () => void
  onOpenConcours?: () => void
  onOpenImmo?: () => void
  onOpenAuth?: () => void
}

export default function SurgaCompteModal({
  isOpen,
  onClose,
  user,
  statutPremium,
  onUserUpdated,
  onDeconnexion,
  onSynchroniser,
  isSyncing = false,
  onOpenPremium,
  onOpenEmploi,
  onOpenConcours,
  onOpenImmo,
  onOpenAuth,
}: SurgaCompteModalProps) {
  const { offre } = useSurgaOffre()
  const [isEditing, setIsEditing] = useState(false)
  const [nomInput, setNomInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    setNomInput(user?.nom || '')
    setIsEditing(false)
    setToast(null)
  }, [user, isOpen])

  if (!isOpen) return null

  const estPremium = Boolean(statutPremium?.estPremium)
  const joursRestants = statutPremium?.joursRestants || 0
  const initiale = (user?.nom?.trim() || 'U').charAt(0).toUpperCase()

  const handleEnregistrerProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!nomInput.trim()) {
      setToast({ type: 'err', text: 'Le nom ne peut pas être vide.' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomInput.trim() }),
      })
      const json = await res.json()
      if (res.ok && !json.errors && !json.error) {
        onUserUpdated({ ...user, nom: nomInput.trim() })
        setIsEditing(false)
        setToast({ type: 'ok', text: 'Votre profil a été mis à jour avec succès.' })
      } else {
        setToast({ type: 'err', text: json.error || json.errors?.[0]?.msg || 'Erreur lors de la mise à jour.' })
      }
    } catch {
      setToast({ type: 'err', text: 'Erreur réseau lors de la mise à jour.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
      }}
      onClick={onClose}
    >
      <div
        className="surga-card"
        style={{
          width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
          backgroundColor: '#FFFFFF', borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 22px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(10, 92, 54, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--price, #0A5C36)' }}>
              <User size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Mon Compte Surga</div>
              <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>Profil &amp; synchronisation cloud</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2, #5A4E42)', padding: 4 }} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: toast.type === 'ok' ? '#F0FDF4' : '#FEF2F2',
            color: toast.type === 'ok' ? '#166534' : '#991B1B',
            border: `1px solid ${toast.type === 'ok' ? '#BBF7D0' : '#FECACA'}`,
          }}>
            {toast.type === 'ok' ? <CheckCircle2 size={15} strokeWidth={2.5} /> : <AlertCircle size={15} strokeWidth={2.5} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Identité & Formule */}
        {user ? (
          <div style={{ padding: 14, borderRadius: 12, backgroundColor: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'var(--navy, #1C2B4A)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 }}>
                  {initiale}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{user.nom || 'Utilisateur Nopalou'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 600 }}>
                    <ShieldCheck size={13} strokeWidth={2.5} />
                    <span>Connecté par WhatsApp</span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                backgroundColor: estPremium ? 'rgba(199, 91, 0, 0.1)' : 'rgba(28, 43, 74, 0.08)',
                color: estPremium ? 'var(--surga-accent-ink, #A64B08)' : 'var(--navy, #1C2B4A)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                {estPremium ? <Crown size={12} strokeWidth={2.5} /> : <Sparkles size={12} strokeWidth={2.5} />}
                <span>{estPremium ? (statutPremium?.source === 'nopalou' ? 'Abonné Nopalou : accès total' : `${nomOffre(offre)} (${joursRestants} j)`) : 'Surga Gratuit'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {user.telephone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
                  <Phone size={13} strokeWidth={2} />
                  <span>{user.telephone}</span>
                </div>
              )}
              {user.email && !user.email.includes('@whatsapp.nopalou.com') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
                  <Mail size={13} strokeWidth={2} />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: 16, borderRadius: 12, backgroundColor: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(28, 43, 74, 0.08)', color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Mode invité</div>
                  <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', marginTop: 2 }}>Stockage local sur cet appareil</div>
                </div>
              </div>

              <div style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                backgroundColor: 'rgba(28, 43, 74, 0.08)', color: 'var(--navy, #1C2B4A)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <Sparkles size={12} strokeWidth={2.5} />
                <span>Non connecté</span>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.45 }}>
              Vos notes, calculs et mémos sont enregistrés localement dans votre navigateur. Connectez-vous avec votre numéro WhatsApp ou email pour activer la synchronisation cloud et sécuriser vos données sur tous vos appareils.
            </p>

            <button
              type="button"
              onClick={() => {
                onClose()
                if (onOpenAuth) onOpenAuth()
              }}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck size={16} />
              <span>Se connecter ou créer un compte</span>
            </button>
          </div>
        )}

        {/* Modification du Profil (si connecté) */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Informations personnelles</span>
              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--surga-accent-ink, #A64B08)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Edit2 size={13} />
                  <span>Modifier</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEnregistrerProfil} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  value={nomInput}
                  onChange={(e) => setNomInput(e.target.value)}
                  placeholder="Ex : Mouhamed Ndiaye"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { setIsEditing(false); setNomInput(user.nom || '') }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFF', fontSize: 12, cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', backgroundColor: 'var(--navy, #1C2B4A)', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Save size={13} />
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
                Nom enregistré : <strong>{user.nom || 'Non renseigné'}</strong>
              </div>
            )}
          </div>
        )}

        {/* Raccourcis de services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Accès rapides &amp; quotas</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {onOpenEmploi && (
              <button type="button" onClick={() => { onClose(); onOpenEmploi() }} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                <FileText size={14} style={{ color: 'var(--surga-accent-ink, #A64B08)', flexShrink: 0 }} />
                <span>Mon CV &amp; Emploi</span>
              </button>
            )}
            {onOpenConcours && (
              <button type="button" onClick={() => { onClose(); onOpenConcours() }} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                <Bell size={14} style={{ color: 'var(--price, #0A5C36)', flexShrink: 0 }} />
                <span>Rappels Concours</span>
              </button>
            )}
            {onOpenImmo && (
              <button type="button" onClick={() => { onClose(); onOpenImmo() }} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                <Home size={14} style={{ color: 'var(--navy, #1C2B4A)', flexShrink: 0 }} />
                <span>Alertes Immo</span>
              </button>
            )}
            {onOpenPremium && !estPremium && offre?.ventes_ouvertes && (
              <button type="button" onClick={() => { onClose(); onOpenPremium() }} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(199, 91, 0, 0.3)', backgroundColor: 'rgba(199, 91, 0, 0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-ink, #A64B08)' }}>
                <Crown size={14} style={{ flexShrink: 0 }} />
                <span>{libelleAbonnement(offre)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Boutons Action : Synchroniser & Déconnexion (si connecté) */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--border, #E8DDD2)' }}>
            <button
              type="button"
              onClick={onSynchroniser}
              disabled={isSyncing}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)',
                backgroundColor: 'var(--bg, #F8F5F0)', color: 'var(--navy, #1C2B4A)', fontSize: 12, fontWeight: 700,
                cursor: isSyncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <RefreshCw size={14} className={isSyncing ? 'surga-spin' : ''} />
              <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser mes données'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Voulez-vous vraiment vous déconnecter de votre compte Surga ?')) {
                  onDeconnexion()
                  onClose()
                }
              }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #FECACA',
                backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <LogOut size={14} strokeWidth={2.5} />
              <span>Se déconnecter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
