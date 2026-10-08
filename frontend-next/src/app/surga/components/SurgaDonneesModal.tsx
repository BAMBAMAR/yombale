'use client'

import React, { useState } from 'react'
import { marquerConfigure } from '@/lib/surga-demarrage'
import {
  X,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react'

interface SurgaDonneesModalProps {
  isOpen: boolean
  onClose: () => void
  onDonneesSupprimees?: () => void
}

export default function SurgaDonneesModal({
  isOpen,
  onClose,
  onDonneesSupprimees,
}: SurgaDonneesModalProps) {
  const [chargementExport, setChargementExport] = useState<boolean>(false)
  const [chargementPurge, setChargementPurge] = useState<boolean>(false)
  const [confirmationTexte, setConfirmationTexte] = useState<string>('')
  const [modeSuppression, setModeSuppression] = useState<boolean>(false)
  const [messageSucces, setMessageSucces] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!isOpen) return null

  const handleTelechargerExport = async () => {
    setChargementExport(true)
    setErreur(null)

    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('nopalou_session') || localStorage.getItem('token'))
        : null

      let donneesJson: any = null

      if (token) {
        const res = await fetch('/api/surga/donnees/export', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error('Impossible d exporter vos données depuis le serveur.')
        }
        donneesJson = await res.json()
      } else {
        // Mode local / invité : export des données présentes dans le localStorage
        donneesJson = {
          date_export: new Date().toISOString(),
          mode: 'local_hors_ligne',
          preferences: JSON.parse(localStorage.getItem('surga_preferences') || 'null'),
          notes: JSON.parse(localStorage.getItem('surga_offline_notes') || '[]'),
          depenses: JSON.parse(localStorage.getItem('surga_offline_depenses') || '[]'),
          agenda: JSON.parse(localStorage.getItem('surga_offline_agenda') || '[]'),
          kalpe_operations: JSON.parse(localStorage.getItem('surga_kalpe_operations') || '[]'),
          kalpe_dettes: JSON.parse(localStorage.getItem('surga_kalpe_dettes') || '[]'),
          kalpe_objectifs: JSON.parse(localStorage.getItem('surga_kalpe_objectifs') || '[]'),
          video_abonnements: JSON.parse(localStorage.getItem('surga_video_abonnements') || '[]'),
        }
      }

      const blob = new Blob([JSON.stringify(donneesJson, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `surga-donnees-personnelles-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessageSucces('Vos données ont été téléchargées avec succès.')
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue lors de l export.')
    } finally {
      setChargementExport(false)
    }
  }

  const handleSupprimerDonnees = async () => {
    if (confirmationTexte.trim() !== 'SUPPRIMER') {
      setErreur('Veuillez saisir le mot SUPPRIMER pour confirmer.')
      return
    }

    setChargementPurge(true)
    setErreur(null)

    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('nopalou_session') || localStorage.getItem('token'))
        : null

      if (token) {
        const res = await fetch('/api/surga/donnees/supprimer', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ confirmation: 'SUPPRIMER' }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erreur lors de la purge serveur.')
        }
      }

      // Nettoyage local systématique
      try {
        localStorage.removeItem('surga_onboarding_done')
        marquerConfigure(false)
        localStorage.removeItem('surga_preferences')
        localStorage.removeItem('surga_offline_notes')
        localStorage.removeItem('surga_offline_depenses')
        localStorage.removeItem('surga_offline_agenda')
        localStorage.removeItem('surga_kalpe_operations')
        localStorage.removeItem('surga_kalpe_dettes')
        localStorage.removeItem('surga_kalpe_objectifs')
        localStorage.removeItem('surga_video_abonnements')
        localStorage.removeItem('surga_profil_pro')
        localStorage.removeItem('surga_documents_emploi')
        window.dispatchEvent(new CustomEvent('surga-kalpe-change'))
        window.dispatchEvent(new CustomEvent('surga-data-change'))
      } catch {}

      setMessageSucces('Toutes vos données Surga ont été définitivement purgées.')
      if (onDonneesSupprimees) {
        onDonneesSupprimees()
      }
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue lors de la suppression.')
    } finally {
      setChargementPurge(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Protection &amp; Données Personnelles</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Conformité CDP Sénégal &amp; Droit à l oubli</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messageSucces ? (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(10, 92, 54, 0.1)',
                  color: 'var(--price, #0A5C36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {messageSucces}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="surga-btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 700, marginTop: 8 }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
                Surga garantit la stricte confidentialité de votre vie privée. Vos mémos, vos dépenses et vos trajets ne sont jamais cédés ni exploités à des fins publicitaires.
              </p>

              {/* Bloc Téléchargement */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border, #E8DDD2)',
                  backgroundColor: 'var(--bg, #F8F5F0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    Portabilité des données
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                    Exportez l ensemble de vos dépenses, notes et rappels en format JSON clair.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTelechargerExport}
                  disabled={chargementExport}
                  className="surga-btn-secondary"
                  style={{ fontSize: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                  <Download size={14} />
                  <span>{chargementExport ? 'Génération...' : 'Exporter'}</span>
                </button>
              </div>

              {/* Bloc Suppression / Droit à l'oubli */}
              {!modeSuppression ? (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>
                      Suppression définitive
                    </div>
                    <div style={{ fontSize: 11, color: '#B91C1C' }}>
                      Purger irrévocablement vos notes, historiques de dépenses et alertes.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModeSuppression(true)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid #DC2626',
                      backgroundColor: '#FFFFFF',
                      color: '#DC2626',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Purger</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: '2px solid #DC2626',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B' }}>
                    <AlertTriangle size={18} />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Action irréversible</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#7F1D1D', margin: 0 }}>
                    Pour confirmer la suppression définitive de toutes vos données de nos serveurs, veuillez saisir <strong>SUPPRIMER</strong> ci-dessous :
                  </p>
                  <input
                    type="text"
                    value={confirmationTexte}
                    onChange={(e) => setConfirmationTexte(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #F87171',
                      fontSize: 13,
                      backgroundColor: '#FFFFFF',
                      color: '#1C2B4A',
                      fontWeight: 700,
                    }}
                  />
                  {erreur && (
                    <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                      {erreur}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => { setModeSuppression(false); setErreur(null); setConfirmationTexte('') }}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFFFFF', fontSize: 12, cursor: 'pointer' }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSupprimerDonnees}
                      disabled={chargementPurge}
                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {chargementPurge ? 'Purge en cours...' : 'Confirmer la suppression'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
