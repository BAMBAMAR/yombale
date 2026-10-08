'use client'

// frontend-next/src/app/surga/components/SurgaLettreTab.tsx
// Rapprochement offre d'emploi, rédaction de lettre de motivation et export PDF
// Quota : le nombre de lettres gratuites et l'abonnement viennent de la console (voir SurgaBandeauDroit)
// Respect strict du vouvoiement (D19) et zéro hallucination
// Modularité stricte < 450 lignes, zéro émoji, tokens CSS officiels

import React, { useState } from 'react'
import {
  FileText,
  Sparkles,
  Download,
  Lock,
  Crown,
  AlertCircle,
  Building,
  Briefcase,
} from 'lucide-react'
import type { ProfilProData } from './SurgaProfilProTab'
import SurgaBandeauDroit from './SurgaBandeauDroit'
import { libelleAbonnement, useSurgaOffre } from '@/lib/surga-offre'

interface DroitsLettre {
  estPremium: boolean
  lettresMoisEnCours: number
  lettresLimite?: number | null
  lettresUtilisees?: number | null
  quotaAtteint: boolean
  message: string
}

interface SurgaLettreTabProps {
  profil: ProfilProData
  droits: DroitsLettre
  onTelechargerLettre: (donnees: {
    entreprise_destinataire: string
    poste_vise: string
    texte_offre: string
    lettre_redigee: string
  }) => Promise<void>
  generant: boolean
  onOpenPremium: () => void
}

export default function SurgaLettreTab({
  profil,
  droits,
  onTelechargerLettre,
  generant,
  onOpenPremium,
}: SurgaLettreTabProps) {
  const { offre } = useSurgaOffre()
  const [poste, setPoste] = useState(profil.titre_professionnel || '')
  const [entreprise, setEntreprise] = useState('')
  const [texteOffre, setTexteOffre] = useState('')
  const [lettreRedigee, setLettreRedigee] = useState('')
  const [relectureConfirmee, setRelectureConfirmee] = useState(false)
  const [erreurRelecture, setErreurRelecture] = useState(false)

  // Génération déterministe de la proposition de lettre
  const handleGenererProposition = () => {
    const nom = profil.nom_complet || 'Madame, Monsieur'
    const posteCible = poste.trim() || profil.titre_professionnel || 'le poste proposé'
    const entCible = entreprise.trim() || 'votre organisation'
    const dateJour = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const expResume = (profil.experiences || [])
      .slice(0, 2)
      .map((e) => `${e.titre} au sein de ${e.entreprise}`)
      .join(', ')

    const compResume = (profil.competences || []).slice(0, 4).join(', ')

    const texte = `À l'attention de la Direction des Ressources Humaines
${entCible}
Dakar, le ${dateJour}

Objet : Candidature au poste de ${posteCible}

Madame, Monsieur,

Je vous adresse ma candidature pour le poste de ${posteCible} au sein de ${entCible}.

${
  expResume
    ? `Fort d'un parcours enrichi par mes expériences en tant que ${expResume}, j'ai développé des compétences rigoureuses et une solide capacité d'adaptation aux exigences professionnelles locales.`
    : `Désireux de mettre mon engagement et mon sens de la rigueur au service de votre structure, je souhaite contribuer activement à vos objectifs.`
}

${
  compResume
    ? `Mes aptitudes dans les domaines suivants : ${compResume}, constituent des atouts concrets pour mener à bien les missions confiées.`
    : ''
}

Je me tiens à votre entière disposition pour tout entretien afin de vous exposer plus en détail ma motivation et mes perspectives de collaboration.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${nom}`

    setLettreRedigee(texte)
  }

  const handleTelecharger = async () => {
    if (!lettreRedigee.trim()) {
      handleGenererProposition()
      return
    }
    if (!relectureConfirmee) {
      setErreurRelecture(true)
      return
    }
    setErreurRelecture(false)
    await onTelechargerLettre({
      entreprise_destinataire: entreprise,
      poste_vise: poste,
      texte_offre: texteOffre,
      lettre_redigee: lettreRedigee,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Droits : limite réelle réglée dans la console */}
      <SurgaBandeauDroit produit="lettres" estPremium={droits.estPremium} limite={droits.lettresLimite} utilises={droits.lettresUtilisees ?? droits.lettresMoisEnCours} onOpenPremium={onOpenPremium} />

      {/* 2. Formulaire de l'offre ciblée */}
      <div className="surga-card" style={{ padding: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px 0' }}>
          Informations sur l’offre ou l’entreprise
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Poste visé *</label>
            <input
              type="text"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="Ex: Responsable Comptable"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Entreprise / Organisation</label>
            <input
              type="text"
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
              placeholder="Ex: Cabinet Audit Dakar"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8 }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
              Texte de l’annonce ou exigences (facultatif)
            </label>
            <textarea
              rows={2}
              value={texteOffre}
              onChange={(e) => setTexteOffre(e.target.value)}
              placeholder="Collez ici les missions ou critères mentionnés dans l’annonce..."
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 8, resize: 'vertical' }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenererProposition}
          className="surga-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700 }}
        >
          <Sparkles size={14} color="var(--accent, #C75B00)" />
          <span>Générer une proposition personnalisée</span>
        </button>
      </div>

      {/* 3. Zone de Rédaction & Personnalisation libre */}
      <div className="surga-card" style={{ padding: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px 0' }}>
          Texte de votre lettre de motivation
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: '0 0 10px 0' }}>
          Vous êtes libre de retoucher chaque paragraphe pour refléter fidèlement votre style et vos motivations réelles.
        </p>

        <textarea
          rows={9}
          value={lettreRedigee}
          onChange={(e) => setLettreRedigee(e.target.value)}
          placeholder="Cliquez sur 'Générer une proposition' ou saisissez directement votre texte ici..."
          className="surga-input"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 12,
            fontFamily: 'monospace',
            lineHeight: 1.5,
            borderRadius: 8,
            resize: 'vertical',
          }}
        />
      </div>

      {/* 4. Case à cocher d'exactitude & Relecture obligatoire */}
      {lettreRedigee && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: erreurRelecture ? 'rgba(220, 38, 38, 0.06)' : 'var(--bg, #F8F5F0)',
            border: erreurRelecture ? '1.5px solid #DC2626' : '1px solid var(--border, #E8DDD2)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={relectureConfirmee}
              onChange={(e) => {
                setRelectureConfirmee(e.target.checked)
                if (e.target.checked) setErreurRelecture(false)
              }}
              style={{ marginTop: 2, cursor: 'pointer' }}
            />
            <div style={{ fontSize: 12, color: 'var(--navy, #1C2B4A)', lineHeight: 1.4 }}>
              <strong>J’ai relu et j’approuve les termes de cette lettre de motivation.</strong>
              <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                Le document PDF sera édité avec votre en-tête et prêt à l’envoi.
              </div>
            </div>
          </label>
          {erreurRelecture && (
            <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
              Veuillez confirmer la relecture de votre lettre avant le téléchargement.
            </div>
          )}
        </div>
      )}

      {/* 5. Bouton de Téléchargement */}
      <div>
        {droits.quotaAtteint && !droits.estPremium ? (
          <button
            type="button"
            onClick={onOpenPremium}
            className="surga-btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Lock size={16} />
            <span>{offre ? `${libelleAbonnement(offre)} pour télécharger` : 'S’abonner pour télécharger'}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={generant || !lettreRedigee.trim()}
            onClick={handleTelecharger}
            className="surga-btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 700,
              opacity: !lettreRedigee.trim() ? 0.6 : 1,
            }}
          >
            <Download size={16} />
            <span>{generant ? 'Génération du PDF en cours...' : 'Télécharger la lettre en PDF'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
