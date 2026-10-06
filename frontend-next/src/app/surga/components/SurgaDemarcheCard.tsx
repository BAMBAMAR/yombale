'use client';

// frontend-next/src/app/surga/components/SurgaDemarcheCard.tsx
// Carte de présentation sobre d'une démarche administrative vérifiée
// Conformité Anti-AI-Slop : Zéro émoji, icônes Lucide, tokens officiels, < 450 lignes

import React from 'react';
import {
  FileText,
  Clock,
  Coins,
  ChevronRight,
  ShieldCheck,
  BookmarkCheck,
} from 'lucide-react';

export interface DemarchePiece {
  intitule: string;
  obligatoire: boolean;
  precision?: string;
}

export interface DemarcheAdminData {
  id: string;
  slug: string;
  titre: string;
  categorie: string;
  public_concerne?: string;
  pieces?: DemarchePiece[];
  cout_xof?: number;
  delai?: string;
  lieux?: string;
  etapes?: string[];
  source_officielle?: string;
  date_verification?: string;
  date_prochaine_verification?: string;
  statut?: 'BROUILLON' | 'PUBLIE' | 'A_REVERIFIER';
  mots_cles?: string[];
}

interface SurgaDemarcheCardProps {
  demarche: DemarcheAdminData;
  estSuivie?: boolean;
  onClick: () => void;
}

const CATEGORIE_LABELS: Record<string, string> = {
  identite_voyage: 'Identité & Voyage',
  etat_civil: 'État Civil & Famille',
  justice: 'Justice & Casier',
  transport: 'Transports & Permis',
  logement: 'Logement & Résidence',
  activite_pro: 'Entreprise & Pro',
};

export default function SurgaDemarcheCard({
  demarche,
  estSuivie = false,
  onClick,
}: SurgaDemarcheCardProps) {
  const cout = demarche.cout_xof || 0;
  const categorieLabel = CATEGORIE_LABELS[demarche.categorie] || demarche.categorie;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="surga-card"
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        backgroundColor: 'var(--surface, #FFFFFF)',
        border: estSuivie
          ? '1.5px solid var(--price, #0A5C36)'
          : '1px solid var(--border, #E8DDD2)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: 'rgba(28, 43, 74, 0.08)',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            {categorieLabel}
          </span>

          {estSuivie && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 6,
                backgroundColor: 'rgba(10, 92, 54, 0.1)',
                color: 'var(--price, #0A5C36)',
              }}
            >
              <BookmarkCheck size={12} />
              <span>Suivie</span>
            </span>
          )}

          {demarche.statut === 'PUBLIE' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--price, #0A5C36)',
              }}
            >
              <ShieldCheck size={12} />
              <span>Vérifiée</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3, #73675E)' }}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Consulter</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 4px 0',
            lineHeight: 1.3,
          }}
        >
          {demarche.titre}
        </h3>
        {demarche.public_concerne && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text2, #5A4E42)',
              margin: 0,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {demarche.public_concerne}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px dashed var(--border, #E8DDD2)',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2, #5A4E42)' }}>
          <Coins size={13} color="var(--navy, #1C2B4A)" />
          <span style={{ fontWeight: 700, color: cout === 0 ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)' }}>
            {cout === 0 ? 'Gratuit' : `${cout.toLocaleString('fr-FR')} FCFA`}
          </span>
        </div>

        {demarche.delai && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3, #73675E)' }}>
            <Clock size={12} />
            <span>{demarche.delai}</span>
          </div>
        )}
      </div>
    </div>
  );
}
