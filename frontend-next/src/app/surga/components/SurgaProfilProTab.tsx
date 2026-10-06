'use client'

// frontend-next/src/app/surga/components/SurgaProfilProTab.tsx
// Édition du profil professionnel de l'utilisateur (Expériences, Formations, Compétences)
// Modularité stricte < 450 lignes, zéro émoji, tokens CSS officiels

import React, { useState } from 'react'
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react'

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

interface SurgaProfilProTabProps {
  profil: ProfilProData
  onChange: (nouveau: ProfilProData) => void
  onSave: () => Promise<void>
  saving: boolean
}

export default function SurgaProfilProTab({
  profil,
  onChange,
  onSave,
  saving,
}: SurgaProfilProTabProps) {
  const [nouvelleCompetence, setNouvelleCompetence] = useState('')
  const [sauvegardeSucces, setSauvegardeSucces] = useState(false)

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
    setSauvegardeSucces(false)
    await onSave()
    setSauvegardeSucces(true)
    setTimeout(() => setSauvegardeSucces(false), 3000)
  }

  return (
    <form onSubmit={handleSoumettre} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Coordonnées & Titre */}
      <div className="surga-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <User size={18} color="var(--accent, #C75B00)" />
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Coordonnées personnelles
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Nom et prénom *</label>
            <input
              type="text"
              required
              value={profil.nom_complet || ''}
              onChange={(e) => handleChangeChamp('nom_complet', e.target.value)}
              placeholder="Ex: Awa Ndiaye"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Titre professionnel *</label>
            <input
              type="text"
              required
              value={profil.titre_professionnel || ''}
              onChange={(e) => handleChangeChamp('titre_professionnel', e.target.value)}
              placeholder="Ex: Comptable Général / Développeur"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Numéro de téléphone</label>
            <input
              type="tel"
              value={profil.telephone || ''}
              onChange={(e) => handleChangeChamp('telephone', e.target.value)}
              placeholder="Ex: +221 77 000 00 00"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Adresse e-mail</label>
            <input
              type="email"
              value={profil.email || ''}
              onChange={(e) => handleChangeChamp('email', e.target.value)}
              placeholder="Ex: awa.ndiaye@email.sn"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Ville / Quartier</label>
            <input
              type="text"
              value={profil.adresse_ville || ''}
              onChange={(e) => handleChangeChamp('adresse_ville', e.target.value)}
              placeholder="Ex: Dakar, Mermoz"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Résumé professionnel / Objectif</label>
          <textarea
            rows={2}
            value={profil.resume_pro || ''}
            onChange={(e) => handleChangeChamp('resume_pro', e.target.value)}
            placeholder="Courte présentation de vos atouts et de votre projet professionnel..."
            className="surga-input"
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* 2. Compétences clés */}
      <div className="surga-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles size={18} color="var(--accent, #C75B00)" />
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Compétences clés &amp; Atouts
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={nouvelleCompetence}
            onChange={(e) => setNouvelleCompetence(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAjouterCompetence() } }}
            placeholder="Ajouter une compétence (ex: Gestion de paie, React, SYSCOHADA)..."
            className="surga-input"
            style={{ flex: 1, padding: '7px 10px', fontSize: 13, borderRadius: 8 }}
          />
          <button
            type="button"
            onClick={handleAjouterCompetence}
            className="surga-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', fontSize: 12 }}
          >
            <Plus size={14} />
            <span>Ajouter</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {profil.competences?.map((comp, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(28, 43, 74, 0.07)',
                color: 'var(--navy, #1C2B4A)',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {comp}
              <button
                type="button"
                onClick={() => handleSupprimerCompetence(idx)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text3, #73675E)' }}
                aria-label={`Supprimer ${comp}`}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          {(!profil.competences || profil.competences.length === 0) && (
            <span style={{ fontSize: 12, color: 'var(--text3, #73675E)', fontStyle: 'italic' }}>
              Aucune compétence renseignée.
            </span>
          )}
        </div>
      </div>

      {/* 3. Expériences Professionnelles */}
      <div className="surga-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} color="var(--accent, #C75B00)" />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Expériences professionnelles
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAjouterExperience}
            className="surga-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}
          >
            <Plus size={13} />
            <span>Ajouter une expérience</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profil.experiences?.map((exp, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Poste #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleSupprimerExperience(idx)}
                  className="surga-btn-secondary"
                  style={{ padding: '3px 6px', color: '#DC2626', border: 'none', background: 'none' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Intitulé du poste *"
                  value={exp.titre}
                  onChange={(e) => handleMajExperience(idx, 'titre', e.target.value)}
                  className="surga-input"
                  style={{ padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  placeholder="Entreprise / Organisation *"
                  value={exp.entreprise}
                  onChange={(e) => handleMajExperience(idx, 'entreprise', e.target.value)}
                  className="surga-input"
                  style={{ padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  placeholder="Période (ex: 2021 - 2023)"
                  value={exp.date_debut ? `${exp.date_debut}${exp.date_fin ? ` - ${exp.date_fin}` : ''}` : ''}
                  onChange={(e) => handleMajExperience(idx, 'date_debut', e.target.value)}
                  className="surga-input"
                  style={{ padding: '6px 8px', fontSize: 12 }}
                />
              </div>

              <textarea
                rows={2}
                placeholder="Missions principales réalisées..."
                value={exp.description || ''}
                onChange={(e) => handleMajExperience(idx, 'description', e.target.value)}
                className="surga-input"
                style={{ padding: '6px 8px', fontSize: 12, resize: 'vertical' }}
              />
            </div>
          ))}
          {(!profil.experiences || profil.experiences.length === 0) && (
            <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: 0, fontStyle: 'italic' }}>
              Aucune expérience renseignée. Cliquez sur &quot;Ajouter une expérience&quot;.
            </p>
          )}
        </div>
      </div>

      {/* 4. Formations & Diplômes */}
      <div className="surga-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={18} color="var(--accent, #C75B00)" />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Formations &amp; Diplômes
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAjouterFormation}
            className="surga-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}
          >
            <Plus size={13} />
            <span>Ajouter une formation</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profil.formations?.map((form, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Diplôme #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleSupprimerFormation(idx)}
                  className="surga-btn-secondary"
                  style={{ padding: '3px 6px', color: '#DC2626', border: 'none', background: 'none' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Intitulé du diplôme *"
                  value={form.diplome}
                  onChange={(e) => handleMajFormation(idx, 'diplome', e.target.value)}
                  className="surga-input"
                  style={{ padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  placeholder="Établissement / Université *"
                  value={form.etablissement}
                  onChange={(e) => handleMajFormation(idx, 'etablissement', e.target.value)}
                  className="surga-input"
                  style={{ padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="text"
                  placeholder="Année d'obtention (ex: 2020)"
                  value={form.annee}
                  onChange={(e) => handleMajFormation(idx, 'annee', e.target.value)}
                  className="surga-input"
                  style={{ padding: '6px 8px', fontSize: 12 }}
                />
              </div>
            </div>
          ))}
          {(!profil.formations || profil.formations.length === 0) && (
            <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: 0, fontStyle: 'italic' }}>
              Aucune formation renseignée. Cliquez sur &quot;Ajouter une formation&quot;.
            </p>
          )}
        </div>
      </div>

      {/* Barre de sauvegarde */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <button
          type="submit"
          disabled={saving}
          className="surga-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700 }}
        >
          <Save size={16} />
          <span>{saving ? 'Enregistrement en cours...' : 'Enregistrer mon profil'}</span>
        </button>

        {sauvegardeSucces && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--price, #0A5C36)', fontSize: 13, fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>Profil enregistré avec succès !</span>
          </div>
        )}
      </div>
    </form>
  )
}
