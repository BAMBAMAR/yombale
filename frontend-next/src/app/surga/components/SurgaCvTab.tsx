'use client'

// frontend-next/src/app/surga/components/SurgaCvTab.tsx
// Génération de CV professionnel en PDF A4 conforme aux standards sénégalais
// Quota & Droits : 1 CV gratuit avec mention, puis 500 FCFA à l'acte (Option A) ou Surga Premium
// Modularité stricte < 450 lignes, zéro émoji, tokens CSS officiels

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Lock,
  Crown,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import type { ProfilProData } from './SurgaProfilProTab'

interface DroitsCv {
  estPremium: boolean
  cvTelecharges: number
  quotaAtteint: boolean
  message: string
}

interface SurgaCvTabProps {
  profil: ProfilProData
  droits: DroitsCv
  onGenererCv: (modele: 'sobre_moderne' | 'classique_pro') => Promise<void>
  generant: boolean
  onOpenPremium: () => void
}

export default function SurgaCvTab({
  profil,
  droits,
  onGenererCv,
  generant,
  onOpenPremium,
}: SurgaCvTabProps) {
  const [modeleChoisi, setModeleChoisi] = useState<'sobre_moderne' | 'classique_pro'>('sobre_moderne')
  const [exactitudeConfirmee, setExactitudeConfirmee] = useState(false)
  const [erreurExactitude, setErreurExactitude] = useState(false)

  const profilIncomplet = !profil.nom_complet || !profil.titre_professionnel

  const handleTelecharger = async () => {
    if (!exactitudeConfirmee) {
      setErreurExactitude(true)
      return
    }
    setErreurExactitude(false)
    await onGenererCv(modeleChoisi)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Alerte Profil Incomplet */}
      {profilIncomplet && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid var(--accent, #C75B00)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} color="var(--accent, #C75B00)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--navy, #1C2B4A)' }}>
            Veuillez compléter au minimum votre nom et votre titre professionnel dans l’onglet{' '}
            <strong>Profil Pro</strong> avant de générer votre CV.
          </div>
        </div>
      )}

      {/* 2. Statut des Droits & Quotas (D27 / Section 1 bis) */}
      <div
        className="surga-card"
        style={{
          padding: 14,
          backgroundColor: droits.estPremium ? 'rgba(10, 92, 54, 0.05)' : 'var(--bg, #F8F5F0)',
          border: droits.estPremium ? '1.5px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {droits.estPremium ? (
              <Crown size={18} color="var(--price, #0A5C36)" />
            ) : (
              <FileText size={18} color="var(--navy, #1C2B4A)" />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {droits.estPremium
                  ? 'Surga Premium : Générations illimitées'
                  : droits.cvTelecharges === 0
                  ? '1er CV Gratuit disponible'
                  : 'Plafond gratuit atteint (1 CV gratuit utilisé)'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
                {droits.estPremium
                  ? 'Générez et téléchargez vos CV en haute fidélité sans aucune mention commerciale.'
                  : droits.cvTelecharges === 0
                  ? 'Votre premier CV est 100% offert avec une mention discrète en pied de page.'
                  : '500 FCFA par nouveau CV à l’acte ou accès illimité via Surga Premium (1 500 F/mois).'}
              </div>
            </div>
          </div>

          {!droits.estPremium && (
            <button
              type="button"
              onClick={onOpenPremium}
              className="surga-btn-secondary"
              style={{ fontSize: 11, padding: '5px 10px', fontWeight: 700, flexShrink: 0 }}
            >
              Passer Premium
            </button>
          )}
        </div>
      </div>

      {/* 3. Choix du Modèle de CV */}
      <div className="surga-card" style={{ padding: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px 0' }}>
          Choisissez votre modèle de mise en page
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {/* Modèle Sobre Moderne */}
          <div
            onClick={() => setModeleChoisi('sobre_moderne')}
            style={{
              padding: 12,
              borderRadius: 8,
              border: modeleChoisi === 'sobre_moderne'
                ? '2px solid var(--accent, #C75B00)'
                : '1px solid var(--border, #E8DDD2)',
              backgroundColor: modeleChoisi === 'sobre_moderne' ? 'rgba(199, 91, 0, 0.04)' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Sobre &amp; Moderne
              </span>
              {modeleChoisi === 'sobre_moderne' && <Check size={16} color="var(--accent, #C75B00)" />}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', margin: 0 }}>
              En-tête bleu nuit minéral, mise en valeur des compétences par puces et typographie fluide.
            </p>
          </div>

          {/* Modèle Classique Pro */}
          <div
            onClick={() => setModeleChoisi('classique_pro')}
            style={{
              padding: 12,
              borderRadius: 8,
              border: modeleChoisi === 'classique_pro'
                ? '2px solid var(--accent, #C75B00)'
                : '1px solid var(--border, #E8DDD2)',
              backgroundColor: modeleChoisi === 'classique_pro' ? 'rgba(199, 91, 0, 0.04)' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Classique Épuré
              </span>
              {modeleChoisi === 'classique_pro' && <Check size={16} color="var(--accent, #C75B00)" />}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', margin: 0 }}>
              Présentation sobre noir &amp; blanc, idéale pour concours, administration et banques.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Aperçu du Contenu Prêt à Imprimer */}
      <div className="surga-card" style={{ padding: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px 0' }}>
          Contenu du document
        </h3>
        <ul style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
          <li>
            <strong>Identité :</strong> {profil.nom_complet || 'Non renseigné'} &bull; {profil.titre_professionnel || 'Non renseigné'}
          </li>
          <li>
            <strong>Expériences professionnelles :</strong> {profil.experiences?.length || 0} poste(s)
          </li>
          <li>
            <strong>Formations &amp; Diplômes :</strong> {profil.formations?.length || 0} diplôme(s)
          </li>
          <li>
            <strong>Compétences clés :</strong> {profil.competences?.length || 0} compétence(s) déclarée(s)
          </li>
        </ul>
      </div>

      {/* 5. Engagement de Zéro-Hallucination & Exactitude Obligatoire */}
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: erreurExactitude ? 'rgba(220, 38, 38, 0.06)' : 'var(--bg, #F8F5F0)',
          border: erreurExactitude ? '1.5px solid #DC2626' : '1px solid var(--border, #E8DDD2)',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={exactitudeConfirmee}
            onChange={(e) => {
              setExactitudeConfirmee(e.target.checked)
              if (e.target.checked) setErreurExactitude(false)
            }}
            style={{ marginTop: 2, cursor: 'pointer' }}
          />
          <div style={{ fontSize: 12, color: 'var(--navy, #1C2B4A)', lineHeight: 1.4 }}>
            <strong>Je certifie sur l’honneur l’exactitude de ces informations.</strong>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 2 }}>
              Surga ne modifie ni n’invente aucune expérience professionnelle. Le document final reflète strictement vos déclarations.
            </div>
          </div>
        </label>
        {erreurExactitude && (
          <div style={{ color: '#DC2626', fontSize: 11, fontWeight: 700, marginTop: 6 }}>
            Veuillez cocher cette case pour valider votre relecture avant de télécharger le PDF.
          </div>
        )}
      </div>

      {/* 6. Bouton de Téléchargement */}
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
            <span>Débloquer ce CV (500 FCFA à l’acte ou Surga Premium)</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={generant || profilIncomplet}
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
              opacity: profilIncomplet ? 0.6 : 1,
            }}
          >
            <Download size={16} />
            <span>{generant ? 'Génération du PDF en cours...' : 'Télécharger mon CV au format PDF'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
