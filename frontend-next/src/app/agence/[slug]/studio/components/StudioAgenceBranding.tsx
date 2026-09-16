'use client';

import React from 'react';
import { Palette, Image as ImageIcon, Check } from 'lucide-react';
import { BANNIERES_IMMO_PRESETS, PALETTES_ACCENT_IMMO } from '../constants';

interface StudioAgenceBrandingProps {
  logoUrl: string;
  onChangeLogoUrl: (val: string) => void;
  coverUrl: string;
  onChangeCoverUrl: (val: string) => void;
  couleurAccent: string;
  onChangeCouleurAccent: (val: string) => void;
  formeBoutons: 'squircle' | 'arrondi' | 'droit';
  onChangeFormeBoutons: (val: 'squircle' | 'arrondi' | 'droit') => void;
  agenceNom: string;
}

export default function StudioAgenceBranding({
  logoUrl,
  onChangeLogoUrl,
  coverUrl,
  onChangeCoverUrl,
  couleurAccent,
  onChangeCouleurAccent,
  formeBoutons,
  onChangeFormeBoutons,
  agenceNom,
}: StudioAgenceBrandingProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Palette size={18} style={{ color: 'var(--accent, #C75B00)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Identité Visuelle & Bannière
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
            Personnalisez la bannière de couverture, le logo et la couleur signature de votre agence.
          </p>
        </div>
      </div>

      {/* ── Galerie des Bannières Recommandées ── */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
          Bannière de couverture de la vitrine
        </label>
        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px' }}>
          Choisissez parmi nos visuels d'exception ou insérez l'adresse web de votre propre photo :
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}
        >
          {BANNIERES_IMMO_PRESETS.map((b) => {
            const isSelected = coverUrl === b.url;
            return (
              <div
                key={b.id}
                onClick={() => onChangeCoverUrl(b.url)}
                style={{
                  position: 'relative',
                  height: 100,
                  borderRadius: 10,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  boxShadow: isSelected ? '0 2px 8px rgba(199, 91, 0, 0.2)' : 'none',
                }}
              >
                <img
                  src={b.url}
                  alt={b.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.label}
                  </span>
                  <span style={{ fontSize: 9.5, color: '#FCD34D', fontWeight: 700 }}>
                    {b.tag}
                  </span>
                </div>

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* URL Personnalisée */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            placeholder="Ou collez l'URL d'une image personnalisée (https://...)"
            value={coverUrl}
            onChange={(e) => onChangeCoverUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12.5,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Logo de l'Agence ── */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 12,
            background: logoUrl ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={agenceNom}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            agenceNom.charAt(0).toUpperCase()
          )}
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
            Logo officiel de l'agence
          </label>
          <input
            type="url"
            placeholder="URL du logo officiel (ex: https://...)"
            value={logoUrl}
            onChange={(e) => onChangeLogoUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Couleur Signature & Forme des Boutons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
            Couleur Signature
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {PALETTES_ACCENT_IMMO.map((p) => {
              const active = couleurAccent.toLowerCase() === p.hex.toLowerCase();
              return (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => onChangeCouleurAccent(p.hex)}
                  title={p.nom}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: p.hex,
                    border: active ? '3px solid #FFFFFF' : '2px solid transparent',
                    outline: active ? '2px solid var(--accent, #C75B00)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
            <input
              type="color"
              value={couleurAccent}
              onChange={(e) => onChangeCouleurAccent(e.target.value)}
              title="Choisir une teinte sur mesure"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
            Style des boutons
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'squircle' as const, label: 'Doux (8px)' },
              { key: 'arrondi' as const, label: 'Rond (16px)' },
              { key: 'droit' as const, label: 'Droit (4px)' },
            ].map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => onChangeFormeBoutons(b.key)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: b.key === 'arrondi' ? 16 : b.key === 'squircle' ? 8 : 4,
                  background: formeBoutons === b.key ? 'var(--navy, #1C2B4A)' : '#F1F5F9',
                  color: formeBoutons === b.key ? '#FFFFFF' : '#475569',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
