'use client';

import React from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Video,
  Home,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { SECTIONS_VITRINE_DEFAUT } from '../constants';
import type { SectionVitrineItem } from '../types';

interface StudioAgenceDispositionSectionsProps {
  sections: SectionVitrineItem[];
  onChangeSections: (newSections: SectionVitrineItem[]) => void;
}

export default function StudioAgenceDispositionSections({
  sections,
  onChangeSections,
}: StudioAgenceDispositionSectionsProps) {
  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChangeSections(updated);
  }

  function moveDown(index: number) {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChangeSections(updated);
  }

  function toggleVisibility(index: number) {
    const updated = sections.map((s, idx) =>
      idx === index ? { ...s, visible: !s.visible } : s
    );
    onChangeSections(updated);
  }

  function resetDefault() {
    onChangeSections([...SECTIONS_VITRINE_DEFAUT]);
  }

  function getSectionIcon(iconName: string) {
    if (iconName === 'Video') return <Video size={16} />;
    if (iconName === 'Home') return <Home size={16} />;
    if (iconName === 'ShieldCheck') return <ShieldCheck size={16} />;
    return <Phone size={16} />;
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} style={{ color: 'var(--accent, #C75B00)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Disposition & Ordre des Blocs de la Vitrine
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
              Personnalisez l'ordre d'affichage des sections et masquez celles que vous ne souhaitez pas afficher.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetDefault}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid var(--border, #E8DDD2)',
            background: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={12} />
          <span>Réinitialiser l'ordre</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((section, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === sections.length - 1;

          return (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--border, #E8DDD2)',
                background: section.visible ? '#FAF8F5' : '#F8FAFC',
                opacity: section.visible ? 1 : 0.6,
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', width: 16 }}>
                  #{idx + 1}
                </span>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: section.visible ? 'var(--navy, #1C2B4A)' : '#CBD5E1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getSectionIcon(section.iconName)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {section.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {section.description}
                  </div>
                </div>
              </div>

              {/* Contrôles Haut / Bas et Visibilité */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={isFirst}
                  title="Monter"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isFirst ? '#CBD5E1' : 'var(--navy, #1C2B4A)',
                    cursor: isFirst ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ArrowUp size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={isLast}
                  title="Descendre"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLast ? '#CBD5E1' : 'var(--navy, #1C2B4A)',
                    cursor: isLast ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ArrowDown size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleVisibility(idx)}
                  title={section.visible ? 'Masquer la section' : 'Afficher la section'}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: section.visible ? '#DCFCE7' : '#F1F5F9',
                    color: section.visible ? '#166534' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
