'use client'

// frontend-next/src/app/surga/components/SurgaEmploiModal.tsx
// Modal principale Emploi, Profil Pro, CV PDF, Lettres & Entretien d'embauche (Tranches 18 & 19)
// Respect strict : < 450 lignes, zéro émoji, tokens CSS officiels, anti-IDOR

import React, { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import SurgaProfilProTab, { type ProfilProData } from './SurgaProfilProTab'
import SurgaCvTab from './SurgaCvTab'
import SurgaLettreTab from './SurgaLettreTab'
import SurgaEntretienTab from './SurgaEntretienTab'
import SurgaDocumentsEmploiTab, { type DocumentEmploi } from './SurgaDocumentsEmploiTab'
import SurgaEmploiNav, { type TabEmploi } from './SurgaEmploiNav'
import {
  getSurgaEmploiHeaders,
  telechargerBlobPdf,
  fetchSurgaEmploiDonnees,
} from '@/lib/surga-emploi-api'

interface SurgaEmploiModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenPremium?: () => void
  onOpenAuth?: () => void
}

const PROFIL_INITIAL: ProfilProData = {
  nom_complet: '',
  email: '',
  telephone: '',
  adresse_ville: 'Dakar',
  titre_professionnel: '',
  resume_pro: '',
  competences: [],
  experiences: [],
  formations: [],
  langues: [{ langue: 'Français', niveau: 'Courant' }],
}

export default function SurgaEmploiModal({
  isOpen,
  onClose,
  onOpenPremium = () => {},
  onOpenAuth,
}: SurgaEmploiModalProps) {
  const [activeTab, setActiveTab] = useState<TabEmploi>('profil')
  const [profil, setProfil] = useState<ProfilProData>(PROFIL_INITIAL)
  const [droits, setDroits] = useState<any>({
    estPremium: false,
    cvTelecharges: 0,
    quotaCvAtteint: false,
    lettresMoisEnCours: 0,
    quotaLettreAtteint: false,
  })
  const [droitsSimulation, setDroitsSimulation] = useState<any>({
    estPremium: false,
    quotaAtteint: false,
    simulationsSemaine: 0,
  })
  const [documents, setDocuments] = useState<DocumentEmploi[]>([])
  const [saving, setSaving] = useState<boolean>(false)
  const [generant, setGenerant] = useState<boolean>(false)
  const [messageToast, setMessageToast] = useState<string>('')

  const afficherToast = (msg: string) => {
    setMessageToast(msg)
    setTimeout(() => setMessageToast(''), 3500)
  }

  // Chargement des données
  const rechargerDonnees = useCallback(async () => {
    try {
      const data = await fetchSurgaEmploiDonnees()
      if (data.profil) {
        setProfil({
          nom_complet: data.profil.nom_complet || '',
          email: data.profil.email || '',
          telephone: data.profil.telephone || '',
          adresse_ville: data.profil.adresse_ville || data.profil.adresse || 'Dakar',
          titre_professionnel: data.profil.titre_professionnel || data.profil.titre_poste || '',
          resume_pro: data.profil.resume_pro || data.profil.resume || '',
          competences: Array.isArray(data.profil.competences) ? data.profil.competences : [],
          experiences: Array.isArray(data.profil.experiences) ? data.profil.experiences : [],
          formations: Array.isArray(data.profil.formations) ? data.profil.formations : [],
          langues: Array.isArray(data.profil.langues) ? data.profil.langues : [],
        })
      }
      if (data.droits) {
        setDroits(data.droits)
      }
      if (Array.isArray(data.documents)) {
        setDocuments(data.documents)
      }
      if (data.droitsEntretien) {
        setDroitsSimulation(data.droitsEntretien)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (isOpen) {
      rechargerDonnees()
    }
  }, [isOpen, rechargerDonnees])

  // Sauvegarde du profil
  const handleSauvegarderProfil = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/surga/emploi/profil', {
        method: 'PUT',
        headers: getSurgaEmploiHeaders(true),
        body: JSON.stringify(profil),
      })
      const data = await res.json()
      if (data.success && data.profil) {
        setProfil((prev) => ({ ...prev, ...data.profil }))
        afficherToast('Profil professionnel enregistré avec succès.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Génération CV
  const handleGenererCv = async (modele: 'sobre_moderne' | 'classique_pro') => {
    setGenerant(true)
    try {
      const res = await fetch('/api/surga/emploi/cv/generer', {
        method: 'POST',
        headers: getSurgaEmploiHeaders(true),
        body: JSON.stringify({
          modele,
          modele_design: modele,
          attestationExactitude: true,
          profil,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob()
        telechargerBlobPdf(blob, `CV_${profil.nom_complet?.replace(/\s+/g, '_') || 'Surga'}.pdf`)
        afficherToast('CV généré et téléchargé avec succès.')
        rechargerDonnees()
        return
      }

      const json = await res.json()
      if (json.success && json.document?.id) {
        const pdfRes = await fetch(`/api/surga/emploi/documents/${json.document.id}/pdf`, {
          headers: getSurgaEmploiHeaders(false),
        })
        if (pdfRes.ok) {
          const blob = await pdfRes.blob()
          telechargerBlobPdf(blob, `CV_${profil.nom_complet?.replace(/\s+/g, '_') || 'Surga'}.pdf`)
          afficherToast('CV généré et téléchargé avec succès.')
        } else {
          const errData = await pdfRes.json().catch(() => ({}))
          alert(errData.error || 'Erreur lors du téléchargement du PDF.')
        }
        rechargerDonnees()
      } else if (json.requireAuth && onOpenAuth) {
        afficherToast('Connexion WhatsApp requise pour sécuriser votre quota gratuit.')
        onOpenAuth()
      } else if (json.motif === 'limite_atteinte' || json.quotaAtteint) {
        onOpenPremium()
      } else {
        alert(json.error || 'Erreur lors de la génération du CV.')
      }
    } catch {
      alert('Erreur réseau lors de la génération du CV.')
    } finally {
      setGenerant(false)
    }
  }

  // Génération Lettre
  const handleGenererLettre = async (donnees: {
    entreprise_destinataire: string
    poste_vise: string
    texte_offre: string
    lettre_redigee: string
  }) => {
    setGenerant(true)
    try {
      const res = await fetch('/api/surga/emploi/lettre/generer', {
        method: 'POST',
        headers: getSurgaEmploiHeaders(true),
        body: JSON.stringify({ ...donnees, attestationExactitude: true, profil }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob()
        telechargerBlobPdf(blob, `Lettre_${donnees.poste_vise.replace(/\s+/g, '_') || 'Surga'}.pdf`)
        afficherToast('Lettre générée et téléchargée avec succès.')
        rechargerDonnees()
        return
      }

      const json = await res.json()
      if (json.success && json.document?.id) {
        const pdfRes = await fetch(`/api/surga/emploi/documents/${json.document.id}/pdf`, {
          headers: getSurgaEmploiHeaders(false),
        })
        if (pdfRes.ok) {
          const blob = await pdfRes.blob()
          telechargerBlobPdf(blob, `Lettre_${donnees.poste_vise.replace(/\s+/g, '_') || 'Surga'}.pdf`)
          afficherToast('Lettre générée et téléchargée avec succès.')
        }
        rechargerDonnees()
      } else if (json.motif === 'limite_atteinte' || json.quotaAtteint) {
        onOpenPremium()
      } else {
        alert(json.error || 'Erreur lors de la génération de la lettre.')
      }
    } catch {
      alert('Erreur réseau lors de la génération de la lettre.')
    } finally {
      setGenerant(false)
    }
  }

  // Télécharger un document existant
  const handleTelechargerDocExistant = async (id: string, nom: string) => {
    try {
      const res = await fetch(`/api/surga/emploi/documents/${id}/pdf`, {
        headers: getSurgaEmploiHeaders(false),
      })
      if (res.ok) {
        const blob = await res.blob()
        telechargerBlobPdf(blob, nom || 'document.pdf')
      } else {
        alert('Impossible de télécharger ce document.')
      }
    } catch {
      alert('Erreur réseau lors du téléchargement.')
    }
  }

  // Supprimer un document
  const handleSupprimerDoc = async (id: string) => {
    if (!confirm('Voulez-vous supprimer définitivement ce document ?')) return
    await fetch(`/api/surga/emploi/documents/${id}`, {
      method: 'DELETE',
      headers: getSurgaEmploiHeaders(true),
    })
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        className="surga-card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Pôle Emploi &amp; Carrière Surga
            </h2>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
              CV PDF A4, Lettres de motivation &amp; Préparation d’entretien
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="surga-btn-secondary"
            style={{ border: 'none', background: 'none', padding: 4, width: 'auto' }}
          >
            <X size={20} color="var(--navy, #1C2B4A)" />
          </button>
        </div>

        {/* Barre d'onglets modulaire */}
        <SurgaEmploiNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          nbDocuments={documents.length}
        />

        {/* Corps défilable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messageToast && (
            <div
              style={{
                backgroundColor: 'rgba(10, 92, 54, 0.1)',
                color: 'var(--price, #0A5C36)',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              {messageToast}
            </div>
          )}

          {activeTab === 'profil' && (
            <SurgaProfilProTab
              profil={profil}
              onChange={setProfil}
              onSave={handleSauvegarderProfil}
              saving={saving}
            />
          )}

          {activeTab === 'cv' && (
            <SurgaCvTab
              profil={profil}
              droits={{
                estPremium: droits.estPremium,
                cvTelecharges: droits.cvTelecharges,
                quotaAtteint: droits.quotaCvAtteint,
                message: droits.message,
              }}
              onGenererCv={handleGenererCv}
              generant={generant}
              onOpenPremium={onOpenPremium}
            />
          )}

          {activeTab === 'lettre' && (
            <SurgaLettreTab
              profil={profil}
              droits={{
                estPremium: droits.estPremium,
                lettresMoisEnCours: droits.lettresMoisEnCours,
                quotaAtteint: droits.quotaLettreAtteint,
                message: droits.message,
              }}
              onTelechargerLettre={handleGenererLettre}
              generant={generant}
              onOpenPremium={onOpenPremium}
            />
          )}

          {activeTab === 'entretien' && (
            <SurgaEntretienTab
              profil={profil}
              droitsSimulation={droitsSimulation}
              onOpenPremium={onOpenPremium}
              onNotifierSucces={afficherToast}
            />
          )}

          {activeTab === 'documents' && (
            <SurgaDocumentsEmploiTab
              documents={documents}
              onTelecharger={handleTelechargerDocExistant}
              onSupprimer={handleSupprimerDoc}
            />
          )}
        </div>
      </div>
    </div>
  )
}
