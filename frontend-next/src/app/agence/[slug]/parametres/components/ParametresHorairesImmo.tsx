'use client';

import React from 'react';
import {
  Clock,
  Check,
  Copy,
  Sparkles,
  CalendarCheck2,
  AlertCircle
} from 'lucide-react';

export const JOURS_SEMAINE = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
] as const;

export type HorairesMap = Record<string, string>;

export const HORAIRES_DEFAUT_IMMO: HorairesMap = {
  lundi: '08:30 - 18:30',
  mardi: '08:30 - 18:30',
  mercredi: '08:30 - 18:30',
  jeudi: '08:30 - 18:30',
  vendredi: '08:30 - 18:30',
  samedi: '09:00 - 13:00',
  dimanche: 'Fermé',
};

interface ParametresHorairesImmoProps {
  horaires?: HorairesMap;
  onChange: (horaires: HorairesMap) => void;
}

function parsePlage(plage?: string): { ouvert: boolean; debut: string; fin: string } {
  if (!plage || plage.toLowerCase().includes('fermé')) {
    return { ouvert: false, debut: '08:30', fin: '18:30' };
  }
  const match = plage.match(/(\d{1,2}[:h]\d{2})\s*-\s*(\d{1,2}[:h]\d{2})/);
  if (match) {
    const debut = match[1].replace('h', ':').padStart(5, '0');
    const fin = match[2].replace('h', ':').padStart(5, '0');
    return { ouvert: true, debut, fin };
  }
  return { ouvert: true, debut: '08:30', fin: '18:30' };
}

export default function ParametresHorairesImmo({
  horaires = HORAIRES_DEFAUT_IMMO,
  onChange,
}: ParametresHorairesImmoProps) {
  const currentHoraires = { ...HORAIRES_DEFAUT_IMMO, ...(horaires || {}) };

  const handleJourToggle = (key: string, currentOuvert: boolean, debut: string, fin: string) => {
    const nextHoraires = { ...currentHoraires };
    if (currentOuvert) {
      nextHoraires[key] = 'Fermé';
    } else {
      nextHoraires[key] = `${debut} - ${fin}`;
    }
    onChange(nextHoraires);
  };

  const handleTimeChange = (key: string, type: 'debut' | 'fin', value: string) => {
    const parsed = parsePlage(currentHoraires[key]);
    const nextDebut = type === 'debut' ? value : parsed.debut;
    const nextFin = type === 'fin' ? value : parsed.fin;
    onChange({
      ...currentHoraires,
      [key]: `${nextDebut} - ${nextFin}`,
    });
  };

  const appliquerPreset = (preset: 'standard' | 'continu' | '7j7') => {
    if (preset === 'standard') {
      onChange({ ...HORAIRES_DEFAUT_IMMO });
    } else if (preset === 'continu') {
      onChange({
        lundi: '08:00 - 19:00',
        mardi: '08:00 - 19:00',
        mercredi: '08:00 - 19:00',
        jeudi: '08:00 - 19:00',
        vendredi: '08:00 - 19:00',
        samedi: '08:00 - 19:00',
        dimanche: 'Fermé',
      });
    } else if (preset === '7j7') {
      onChange({
        lundi: '08:30 - 19:30',
        mardi: '08:30 - 19:30',
        mercredi: '08:30 - 19:30',
        jeudi: '08:30 - 19:30',
        vendredi: '08:30 - 19:30',
        samedi: '08:30 - 19:30',
        dimanche: '09:00 - 18:00',
      });
    }
  };

  const dupliquerLundiSurSemaine = () => {
    const parsedLundi = parsePlage(currentHoraires.lundi);
    const valLundi = parsedLundi.ouvert ? `${parsedLundi.debut} - ${parsedLundi.fin}` : 'Fermé';
    onChange({
      ...currentHoraires,
      mardi: valLundi,
      mercredi: valLundi,
      jeudi: valLundi,
      vendredi: valLundi,
    });
  };

  return (
    <div className="agence-card">
      <div className="agence-card-header">
        <div className="agence-card-title">
          <Clock size={18} />
          Horaires d'Ouverture &amp; Accueil Public
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
        Configurez les heures de réception et de visite de votre agence. Ces horaires alimentent le badge en temps réel sur votre vitrine publique.
      </p>

      {/* Raccourcis de pré-remplissage rapide */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} style={{ color: 'var(--accent, #C75B00)' }} />
          Modèles d'horaires rapides :
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => appliquerPreset('standard')}
            className="vitrine-btn-base"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              minHeight: 32,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            Bureau Standard (Lun-Ven 08:30-18:30, Sam matin)
          </button>
          <button
            type="button"
            onClick={() => appliquerPreset('continu')}
            className="vitrine-btn-base"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              minHeight: 32,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            Journée Continue (Lun-Sam 08:00-19:00)
          </button>
          <button
            type="button"
            onClick={() => appliquerPreset('7j7')}
            className="vitrine-btn-base"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              minHeight: 32,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            Ouvert 7j / 7
          </button>
        </div>
      </div>

      {/* Grille des 7 jours de la semaine */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {JOURS_SEMAINE.map((j, idx) => {
          const parsed = parsePlage(currentHoraires[j.key]);
          const isLundi = j.key === 'lundi';

          return (
            <div
              key={j.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: parsed.ouvert ? '#FFFFFF' : '#F8FAFC',
                border: '1px solid',
                borderColor: parsed.ouvert ? 'var(--border, #E8DDD2)' : '#E2E8F0',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              {/* Jour et switch ouvert */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={parsed.ouvert}
                    onChange={() => handleJourToggle(j.key, parsed.ouvert, parsed.debut, parsed.fin)}
                    style={{ width: 17, height: 17, accentColor: 'var(--accent, #C75B00)', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: parsed.ouvert ? 'var(--navy, #1C2B4A)' : '#94A3B8' }}>
                    {j.label}
                  </span>
                </label>
              </div>

              {/* Sélecteurs Horaires ou Badge Fermé */}
              {parsed.ouvert ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="time"
                    value={parsed.debut}
                    onChange={(e) => handleTimeChange(j.key, 'debut', e.target.value)}
                    className="form-input"
                    style={{ width: 105, padding: '6px 10px', fontSize: 13, height: 34 }}
                  />
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>à</span>
                  <input
                    type="time"
                    value={parsed.fin}
                    onChange={(e) => handleTimeChange(j.key, 'fin', e.target.value)}
                    className="form-input"
                    style={{ width: 105, padding: '6px 10px', fontSize: 13, height: 34 }}
                  />
                  {isLundi && (
                    <button
                      type="button"
                      onClick={dupliquerLundiSurSemaine}
                      className="vitrine-btn-base"
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        minHeight: 28,
                        background: '#FFF7ED',
                        border: '1px solid #FFEDD5',
                        color: 'var(--accent, #C75B00)',
                        marginLeft: 4,
                      }}
                      title="Copier ces horaires pour Mardi à Vendredi"
                    >
                      <Copy size={12} />
                      <span>Copier Lun-Ven</span>
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#FEE2E2',
                      color: '#991B1B',
                    }}
                  >
                    Fermé au public
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
