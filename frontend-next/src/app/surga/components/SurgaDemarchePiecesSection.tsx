'use client';

// frontend-next/src/app/surga/components/SurgaDemarchePiecesSection.tsx
// Sous-composant modulaire : checklist interactive des pièces à fournir
// Modularité < 450 lignes, zéro émoji, tokens officiels, vouvoiement strict D19

import React from 'react';
import { FileText, CheckSquare, Square } from 'lucide-react';
import type { DemarchePiece } from './SurgaDemarcheCard';

interface SurgaDemarchePiecesSectionProps {
  pieces: DemarchePiece[];
  piecesCochees: Record<number, boolean>;
  onTogglePiece: (index: number) => void;
  onExporterNote?: () => void;
}

export default function SurgaDemarchePiecesSection({
  pieces,
  piecesCochees,
  onTogglePiece,
  onExporterNote,
}: SurgaDemarchePiecesSectionProps) {
  if (pieces.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
          Pièces à fournir ({pieces.length})
        </h4>
        {onExporterNote && (
          <button
            type="button"
            onClick={onExporterNote}
            className="surga-btn-secondary"
            style={{ fontSize: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FileText size={12} />
            <span>Exporter en Note</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pieces.map((piece, idx) => {
          const estCochee = Boolean(piecesCochees[idx]);
          return (
            <div
              key={idx}
              onClick={() => onTogglePiece(idx)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: estCochee ? 'rgba(10, 92, 54, 0.05)' : 'var(--bg, #F8F5F0)',
                border: estCochee ? '1px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <div style={{ color: estCochee ? 'var(--price, #0A5C36)' : 'var(--text3, #73675E)', marginTop: 1 }}>
                {estCochee ? <CheckSquare size={16} /> : <Square size={16} />}
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    textDecoration: estCochee ? 'line-through' : 'none',
                    color: estCochee ? 'var(--text3, #73675E)' : 'var(--navy, #1C2B4A)',
                    fontWeight: 600,
                  }}
                >
                  {piece.intitule}
                </span>
                {piece.precision && (
                  <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                    {piece.precision}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: piece.obligatoire ? 'var(--surga-accent-ink, #A64B08)' : 'var(--text3, #73675E)',
                }}
              >
                {piece.obligatoire ? 'Obligatoire' : 'Facultatif'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
