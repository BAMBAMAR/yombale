'use client'

import React, { useState } from 'react'
import {
  User,
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import SurgaProfilProExperiences from './SurgaProfilProExperiences'
import SurgaProfilProFormations from './SurgaProfilProFormations'

export interface ProfilExperience {
  titre: string
  entreprise: string
  lieu?: string
  date_debut: string
  date_fin?: string
  en_cours?: boolean
  description?: string
}

export interface ProfilFormation {
  diplome: string
  etablissement: string
  annee: string
  description?: string
}

export interface ProfilLangue {
  langue: string
  niveau: string
}

export interface ProfilProData {
  nom_complet: string
  email: string
  telephone: string
  adresse_ville: string
  titre_professionnel: string
  resume_pro: string
  competences: string[]
  experiences: ProfilExperience[]
  formations: ProfilFormation[]
  langues: ProfilLangue[]
}

// Ce que l'enregistrement a donné : le message s'affiche à côté du bouton, là où la personne regarde.
export interface ResultatEnregistrement {
  ok: boolean
  message: string
}

interface SurgaProfilProTabProps {
  profil: ProfilProData
  onChange: (nouveau: ProfilProData) => void
  onSave: () => Promise<ResultatEnregistrement>
  saving: boolean
}

export default function SurgaProfilProTab({
  profil,
  onChange,
  onSave,
  saving,
}: SurgaProfilProTabProps) {
  const [nouvelleCompetence, setNouvelleCompetence] = useState('')
  const [resultat, setResultat] = useState<ResultatEnregistrement | null>(null)

  const handleChangeChamp = (champ: keyof ProfilProData, valeur: any) => {
    onChange({ ...profil, [champ]: valeur })
  }

  const handleAjouterCompetence = () => {
    const val = nouvelleCompetence.trim()
    if (!val) return
    if (!profil.competences.includes(val)) {
      handleChangeChamp('competences', [...profil.competences, val])
    }
    setNouvelleCompetence('')
  }

  const handleSupprimerCompetence = (index: number) => {
    const maj = profil.competences.filter((_, i) => i !== index)
    handleChangeChamp('competences', maj)
  }

  const handleAjouterExperience = () => {
    const nouvelle: ProfilExperience = {
      titre: '',
      entreprise: '',
      lieu: 'Dakar',
      date_debut: '',
      date_fin: '',
      en_cours: false,
      description: '',
    }
    handleChangeChamp('experiences', [...profil.experiences, nouvelle])
  }

  const handleMajExperience = (index: number, champ: keyof ProfilExperience, valeur: any) => {
    const maj = [...profil.experiences]
    maj[index] = { ...maj[index], [champ]: valeur }
    handleChangeChamp('experiences', maj)
  }

  const handleSupprimerExperience = (index: number) => {
    handleChangeChamp('experiences', profil.experiences.filter((_, i) => i !== index))
  }

  const handleAjouterFormation = () => {
    const nouvelle: ProfilFormation = {
      diplome: '',
      etablissement: '',
      annee: '',
      description: '',
    }
    handleChangeChamp('formations', [...profil.formations, nouvelle])
  }

  const handleMajFormation = (index: number, champ: keyof ProfilFormation, valeur: any) => {
    const maj = [...profil.formations]
    maj[index] = { ...maj[index], [champ]: valeur }
    handleChangeChamp('formations', maj)
  }

  const handleSupprimerFormation = (index: number) => {
    handleChangeChamp('formations', profil.formations.filter((_, i) => i !== index))
  }

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    setResultat(null)
    // « Enregistré » ne s'affiche que si le serveur l'a confirmé ; un refus reste à l'écran jusqu'au prochain essai.
    const donne = await onSave()
    setResultat(donne)
    if (donne.ok) setTimeout(() => setResultat((r) => (r === donne ? null : r)), 4000)
  }

  return (
    <form onSubmit={handleSoumettre} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Coordonnées & Titre */}
      <div className="surga-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <User size={18} color="var(--surga-accent, #D97706)" />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', margin: 0 }}>
            Coordonnées personnelles
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 4 }}>Nom et prénom *</label>
            <input
              type="text"
              required
              value={profil.nom_complet || ''}
              onChange={(e) => handleChangeChamp('nom_complet', e.target.value)}
              placeholder="Ex: Awa Ndiaye"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 4 }}>Titre professionnel *</label>
            <input
              type="text"
              required
              value={profil.titre_professionnel || ''}
              onChange={(e) => handleChangeChamp('titre_professionnel', e.target.value)}
              placeholder="Ex: Comptable Général / Développeur"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 4 }}>Numéro de téléphone</label>
            <input
              type="tel"
              inputMode="tel"
              value={profil.telephone || ''}
              onChange={(e) => handleChangeChamp('telephone', e.target.value)}
              placeholder="Ex: +221 77 000 00 00"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 4 }}>Adresse e-mail</label>
            <input
              type="email"
              value={profil.email || ''}
              onChange={(e) => handleChangeChamp('email', e.target.value)}
              placeholder="Ex: awa.ndiaye@email.sn"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 4 }}>Ville / Quartier</label>
            <input
              type="text"
              value={profil.adresse_ville || ''}
              onChange={(e) => handleChangeChamp('adresse_ville', e.target.value)}
              placeholder="Ex: Dakar, Mermoz"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 4 }}>Résumé professionnel / Objectif</label>
          <textarea
            rows={2}
            value={profil.resume_pro || ''}
            onChange={(e) => handleChangeChamp('resume_pro', e.target.value)}
            placeholder="Courte présentation de vos atouts et de votre projet professionnel..."
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* 2. Compétences clés */}
      <div className="surga-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={18} color="var(--surga-accent, #D97706)" />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', margin: 0 }}>
            Compétences clés &amp; Atouts
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={nouvelleCompetence}
            onChange={(e) => setNouvelleCompetence(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAjouterCompetence() } }}
            placeholder="Ajouter une compétence (ex: Gestion de paie, React, SYSCOHADA)..."
            style={{ flex: 1, padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={handleAjouterCompetence}
            className="surga-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', fontSize: 13, minHeight: 40 }}
          >
            <Plus size={15} />
            <span>Ajouter</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {profil.competences?.map((comp, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(15, 23, 42, 0.07)',
                color: 'var(--surga-primary, #0F172A)',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {comp}
              <button
                type="button"
                onClick={() => handleSupprimerCompetence(idx)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--surga-text3, #94A3B8)' }}
                aria-label={`Supprimer ${comp}`}
              >
                <Trash2 size={13} />
              </button>
            </span>
          ))}
          {(!profil.competences || profil.competences.length === 0) && (
            <span style={{ fontSize: 13, color: 'var(--surga-text3, #94A3B8)', fontStyle: 'italic' }}>
              Aucune compétence renseignée.
            </span>
          )}
        </div>
      </div>

      {/* 3. Expériences Professionnelles (Composant modulaire) */}
      <SurgaProfilProExperiences
        experiences={profil.experiences}
        onAjouter={handleAjouterExperience}
        onMaj={handleMajExperience}
        onSupprimer={handleSupprimerExperience}
      />

      {/* 4. Formations & Diplômes (Composant modulaire) */}
      <SurgaProfilProFormations
        formations={profil.formations}
        onAjouter={handleAjouterFormation}
        onMaj={handleMajFormation}
        onSupprimer={handleSupprimerFormation}
      />

      {/* Barre de sauvegarde */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
        <button
          type="submit"
          disabled={saving}
          className="surga-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, minHeight: 46, width: 'auto', flexShrink: 0 }}
        >
          <Save size={16} />
          <span>{saving ? 'Enregistrement en cours...' : 'Enregistrer mon profil'}</span>
        </button>

        {resultat && (
          <div
            role={resultat.ok ? 'status' : 'alert'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 220px', minWidth: 0, color: resultat.ok ? 'var(--surga-emerald, #059669)' : 'var(--surga-danger, #DC2626)', fontSize: 14, fontWeight: 700 }}
          >
            {resultat.ok ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> : <AlertCircle size={18} style={{ flexShrink: 0 }} />}
            <span>{resultat.message}</span>
          </div>
        )}
      </div>
    </form>
  )
}
