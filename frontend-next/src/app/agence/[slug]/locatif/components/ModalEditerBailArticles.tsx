'use client'

import React, { useState } from 'react'
import { FileText, RotateCcw, CheckCircle2, PenLine, Scale, ShieldCheck } from 'lucide-react'

export interface ArticlesMap {
  article1_parties?: string
  article2_bien?: string
  article3_duree?: string
  article4_finances?: string
  article5_obligations?: string
  article6_conditions?: string
  clauses_libres?: string
}

interface ModalEditerBailArticlesProps {
  defauts: ArticlesMap
  clauses: ArticlesMap
  onChange: (newClauses: ArticlesMap) => void
}

interface ArticleDef {
  key: keyof ArticlesMap
  num: string
  titre: string
  sousTitre: string
}

const ARTICLES_LIST: ArticleDef[] = [
  {
    key: 'article1_parties',
    num: 'Art. 1',
    titre: 'Désignation des Parties & Garants',
    sousTitre: 'Bailleur, Agence mandataire, Preneur et éventuels garants solidaires',
  },
  {
    key: 'article2_bien',
    num: 'Art. 2',
    titre: 'Objet du Contrat & Bien Loué',
    sousTitre: 'Description, surface, pièces, adresse et annexes (eau/élec)',
  },
  {
    key: 'article3_duree',
    num: 'Art. 3',
    titre: 'Durée, Reconduction & Préavis',
    sousTitre: 'Durée ferme, tacite reconduction et préavis légal de 3 mois (COCC)',
  },
  {
    key: 'article4_finances',
    num: 'Art. 4',
    titre: 'Finances, Modalités & Révision',
    sousTitre: 'Loyer, charges, caution (Décret 2023-442) et règles de révision',
  },
  {
    key: 'article5_obligations',
    num: 'Art. 5',
    titre: 'Obligations & Clause Résolutoire',
    sousTitre: 'Devoirs preneur/bailleur et résiliation de plein droit sous 1 mois',
  },
  {
    key: 'article6_conditions',
    num: 'Art. 6',
    titre: 'Conditions Particulières & Règlement',
    sousTitre: 'Règlement de l\'immeuble, animaux, parking, clés et dérogations',
  },
  {
    key: 'clauses_libres',
    num: 'Art. 7',
    titre: 'Dispositions Complémentaires (Libres)',
    sousTitre: 'Clauses annexes personnalisées spécifiques convenues entre les parties',
  },
]

export default function ModalEditerBailArticles({
  defauts,
  clauses,
  onChange,
}: ModalEditerBailArticlesProps) {
  const [selectedKey, setSelectedKey] = useState<keyof ArticlesMap>('article1_parties')

  const currentArticle = ARTICLES_LIST.find(a => a.key === selectedKey) || ARTICLES_LIST[0]
  const currentText = clauses[selectedKey] !== undefined ? clauses[selectedKey] || '' : defauts[selectedKey] || ''
  const isCustomized = Boolean(clauses[selectedKey] && clauses[selectedKey]?.trim() !== defauts[selectedKey]?.trim())

  function handleTextChange(val: string) {
    onChange({
      ...clauses,
      [selectedKey]: val,
    })
  }

  function handleResetToDefault() {
    const nextClauses = { ...clauses }
    delete nextClauses[selectedKey]
    onChange(nextClauses)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sélecteur d'articles en barre de défilement horizontale */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 6,
          borderBottom: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {ARTICLES_LIST.map(art => {
          const isActif = art.key === selectedKey
          const hasCustom = Boolean(clauses[art.key] && clauses[art.key]?.trim() !== defauts[art.key]?.trim())

          return (
            <button
              key={art.key}
              type="button"
              onClick={() => setSelectedKey(art.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: isActif ? 800 : 600,
                border: isActif ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
                background: isActif ? 'var(--navy, #1C2B4A)' : hasCustom ? '#FFF8F0' : '#FFFFFF',
                color: isActif ? '#FFFFFF' : hasCustom ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{art.num}</span>
              {hasCustom && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isActif ? 'var(--accent, #C75B00)' : 'var(--accent, #C75B00)',
                    display: 'inline-block',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* En-tête de l'article en cours d'édition */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          background: '#F8FAFC',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
              }}
            >
              {currentArticle.num}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {currentArticle.titre}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#64748B' }}>
            {currentArticle.sousTitre}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isCustomized ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <PenLine size={12} />
              Personnalisé
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                background: '#ECFDF5',
                color: 'var(--price, #0A5C36)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={12} />
              Standard COCC
            </span>
          )}

          {isCustomized && (
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Rétablir le texte légal standard pour cet article"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 9px',
                borderRadius: 6,
                border: '1px solid var(--border, #E8DDD2)',
                background: '#FFFFFF',
                color: '#64748B',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={11} />
              Rétablir standard
            </button>
          )}
        </div>
      </div>

      {/* Éditeur de texte de l'article */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <textarea
          value={currentText}
          onChange={e => handleTextChange(e.target.value)}
          placeholder={`Rédigez ou personnalisez les stipulations de l'${currentArticle.titre}...`}
          rows={7}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: isCustomized ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
            fontSize: 12.5,
            lineHeight: 1.5,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#1F2937',
            background: isCustomized ? '#FFFDFB' : '#FFFFFF',
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B', padding: '0 4px' }}>
          <span>
            Ce texte sera intégralement imprimé dans l&apos;<strong>{currentArticle.num}</strong> du contrat de bail officiel PDF.
          </span>
          <span>{currentText.length} caractères</span>
        </div>
      </div>
    </div>
  )
}
