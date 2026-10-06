'use client'

// frontend-next/src/app/surga/components/SurgaEmploiModal.tsx
// Modal principale Emploi, Profil Pro, CV PDF, Lettres & Entretien d'embauche (Tranches 18 & 19)
// Respect strict : < 450 lignes, zéro émoji, tokens CSS officiels, anti-IDOR

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  User,
  FileText,
  Mail,
  HelpCircle,
  FolderArchive,
} from 'lucide-react'
import SurgaProfilProTab, { type ProfilProData } from './SurgaProfilProTab'
import SurgaCvTab from './SurgaCvTab'
import SurgaLettreTab from './SurgaLettreTab'
import SurgaEntretienTab from './SurgaEntretienTab'
import SurgaDocumentsEmploiTab, { type DocumentEmploi } from './SurgaDocumentsEmploiTab'

interface SurgaEmploiModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenPremium?: () => void
}

type TabEmploi = 'profil' | 'cv' | 'lettre' | 'entretien' | 'documents'

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
    message: '1 simulation gratuite par semaine incluse.',
  })
  const [documents, setDocuments] = useState<DocumentEmploi[]>([])
  const [saving, setSaving] = useState<boolean>(false)
  const [generant, setGenerant] = useState<boolean>(false)
  const [messageToast, setMessageToast] = useState<string>('')

  // Chargement des données
  const rechargerDonnees = useCallback(async () => {
    try {
      const [resProfil, resDroits, resDocs, resDroitsEntretien] = await Promise.all([
        fetch('/api/surga/emploi/profil').then((r) => r.json()).catch(() => ({})),
        fetch('/api/surga/emploi/droits').then((r) => r.json()).catch(() => ({})),
        fetch('/api/surga/emploi/documents').then((r) => r.json()).catch(() => ({})),
        fetch('/api/surga/emploi/entretien/droits').then((r) => r.json()).catch(() => ({})),
      ])

      if (resProfil?.success && resProfil.profil) {
        setProfil({
          nom_complet: resProfil.profil.nom_complet || '',
          email: resProfil.profil.email || '',
          telephone: resProfil.profil.telephone || '',
          adresse_ville: resProfil.profil.adresse_ville || 'Dakar',
          titre_professionnel: resProfil.profil.titre_professionnel || '',
          resume_pro: resProfil.profil.resume_pro || '',
          competences: Array.isArray(resProfil.profil.competences) ? resProfil.profil.competences : [],
          experiences: Array.isArray(resProfil.profil.experiences) ? resProfil.profil.experiences : [],
          formations: Array.isArray(resProfil.profil.formations) ? resProfil.profil.formations : [],
          langues: Array.isArray(resProfil.profil.langues) ? resProfil.profil.langues : [],
        })
      }

      if (resDroits?.success && resDroits.droits) {
        setDroits(resDroits.droits)
      }

      if (resDocs?.success && Array.isArray(resDocs.documents)) {
        setDocuments(resDocs.documents)
      }

      if (resDroitsEntretien?.success && resDroitsEntretien.droits) {
        setDroitsSimulation(resDroitsEntretien.droits)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profil),
      })
      const data = await res.json()
      if (data.success && data.profil) {
        setProfil(data.profil)
      }
    } finally {
      setSaving(false)
    }
  }

  // Téléchargement Blob
  const telechargerBlob = (blob: Blob, nomFichier: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nomFichier
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Génération CV
  const handleGenererCv = async (modele: 'sobre_moderne' | 'classique_pro') => {
    setGenerant(true)
    try {
      const res = await fetch('/api/surga/emploi/cv/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modele_design: modele, attestationExactitude: true }),
      })

      if (res.headers.get('content-type')?.includes('application/pdf')) {
        const blob = await res.blob()
        telechargerBlob(blob, `CV_${profil.nom_complet?.replace(/\s+/g, '_') || 'Surga'}.pdf`)
        rechargerDonnees()
      } else {
        const json = await res.json()
        if (json.quotaAtteint) {
          onOpenPremium()
        } else {
          alert(json.error || 'Erreur lors de la génération du CV.')
        }
      }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...donnees, attestationExactitude: true }),
      })

      if (res.headers.get('content-type')?.includes('application/pdf')) {
        const blob = await res.blob()
        telechargerBlob(blob, `Lettre_${donnees.poste_vise.replace(/\s+/g, '_') || 'Surga'}.pdf`)
        rechargerDonnees()
      } else {
        const json = await res.json()
        if (json.quotaAtteint) {
          onOpenPremium()
        } else {
          alert(json.error || 'Erreur lors de la génération de la lettre.')
        }
      }
    } finally {
      setGenerant(false)
    }
  }

  // Télécharger un document existant
  const handleTelechargerDocExistant = async (id: string, nom: string) => {
    const res = await fetch(`/api/surga/emploi/documents/${id}/pdf`)
    if (res.ok) {
      const blob = await res.blob()
      telechargerBlob(blob, nom || 'document.pdf')
    }
  }

  // Supprimer un document
  const handleSupprimerDoc = async (id: string) => {
    if (!confirm('Voulez-vous supprimer définitivement ce document ?')) return
    await fetch(`/api/surga/emploi/documents/${id}`, { method: 'DELETE' })
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const afficherToast = (msg: string) => {
    setMessageToast(msg)
    setTimeout(() => setMessageToast(''), 3000)
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
            style={{ border: 'none', background: 'none', padding: 4 }}
          >
            <X size={20} color="var(--navy, #1C2B4A)" />
          </button>
        </div>

        {/* Barre d'onglets (5 onglets) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            backgroundColor: 'var(--bg, #F8F5F0)',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 8px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'profil' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'profil' ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
              borderBottom: activeTab === 'profil' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <User size={14} />
            <span>Profil Pro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cv')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 8px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'cv' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'cv' ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
              borderBottom: activeTab === 'cv' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={14} />
            <span>Mon CV PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lettre')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 8px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'lettre' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'lettre' ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
              borderBottom: activeTab === 'lettre' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Mail size={14} />
            <span>Lettres</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entretien')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 8px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'entretien' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'entretien' ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
              borderBottom: activeTab === 'entretien' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <HelpCircle size={14} />
            <span>Entretien</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 8px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'documents' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'documents' ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
              borderBottom: activeTab === 'documents' ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FolderArchive size={14} />
            <span>Docs ({documents.length})</span>
          </button>
        </div>

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
