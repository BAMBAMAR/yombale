// frontend-next/src/app/boutique/components/AnalyticsCohortsMatrix.tsx
'use client';

import React from 'react';
import { Users, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export interface CohortData {
  mois: string;
  nouveauxClients: number;
  retention: number[]; // % de réachat à M+0, M+1, M+2, M+3, M+4, M+5
  ltvMoyenne: number;
}

interface AnalyticsCohortsMatrixProps {
  cohortes?: CohortData[];
}

export function AnalyticsCohortsMatrix({ cohortes }: AnalyticsCohortsMatrixProps) {
  const data = (cohortes && cohortes.length > 0)
    ? cohortes
    : [
        { mois: 'Jan 2026', nouveauxClients: 45, retention: [100, 42, 35, 28, 24, 20], ltvMoyenne: 38500 },
        { mois: 'Fév 2026', nouveauxClients: 52, retention: [100, 48, 38, 30, 26, 0], ltvMoyenne: 42000 },
        { mois: 'Mar 2026', nouveauxClients: 68, retention: [100, 50, 41, 33, 0, 0], ltvMoyenne: 46500 },
        { mois: 'Avr 2026', nouveauxClients: 74, retention: [100, 54, 44, 0, 0, 0], ltvMoyenne: 49000 },
        { mois: 'Mai 2026', nouveauxClients: 89, retention: [100, 58, 0, 0, 0, 0], ltvMoyenne: 52000 },
        { mois: 'Juin 2026', nouveauxClients: 95, retention: [100, 0, 0, 0, 0, 0], ltvMoyenne: 35000 }
      ];

  const getHeatmapColor = (value: number) => {
    if (value === 0) return '#f8fafc';
    if (value >= 50) return '#bbf7d0'; // Vert fort
    if (value >= 30) return '#dcfce7'; // Vert moyen
    if (value >= 15) return '#fef9c3'; // Jaune doux
    return '#ffedd5'; // Orange clair
  };

  return (
    <div className="analytics-cohorts-card" style={{
      background: 'var(--card, #ffffff)',
      border: '1px solid var(--border, #E8DDD2)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} style={{ color: 'var(--accent, #C75B00)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
              Analyse de Cohorte de Rétention & LTV Client
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Taux de réachat et valeur cumulée par mois d'acquisition
            </p>
          </div>
        </div>
      </div>

      {/* Tableau thermique des cohortes */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: 'var(--navy, #1C2B4A)', borderBottom: '2px solid var(--border, #E8DDD2)' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Cohorte</th>
              <th style={{ padding: '10px' }}>Nouveaux</th>
              <th style={{ padding: '10px' }}>M+0</th>
              <th style={{ padding: '10px' }}>M+1</th>
              <th style={{ padding: '10px' }}>M+2</th>
              <th style={{ padding: '10px' }}>M+3</th>
              <th style={{ padding: '10px' }}>M+4</th>
              <th style={{ padding: '10px' }}>M+5</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>LTV Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                  {c.mois}
                </td>
                <td style={{ padding: '10px', fontWeight: 500 }}>
                  {c.nouveauxClients}
                </td>
                {c.retention.map((val, mIdx) => (
                  <td key={mIdx} style={{
                    padding: '10px',
                    background: getHeatmapColor(val),
                    fontWeight: val > 0 ? 600 : 400,
                    color: val > 0 ? '#1e293b' : '#cbd5e1'
                  }}>
                    {val > 0 ? `${val}%` : '-'}
                  </td>
                ))}
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--price, #0A5C36)' }}>
                  {c.ltvMoyenne.toLocaleString('fr-FR')} F
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
