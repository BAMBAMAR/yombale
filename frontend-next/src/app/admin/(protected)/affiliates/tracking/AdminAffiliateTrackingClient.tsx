'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AffiliateClick {
  id: number;
  click_ref: string;
  apporteur_code: string;
  geo: string;
  device: string;
  ip_hash: string;
  created_at: string;
  converted: boolean;
  converted_at?: string;
}

export default function AdminAffiliateTrackingClient({ secret }: { secret: string }) {
  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    async function fetchClicks() {
      setLoading(true);
      try {
        const res = await fetch(`/api/affiliates/clicks?range=${timeRange}`, {
          headers: { 'X-Admin-Secret': secret },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Fetch échoué');
        const data = await res.json();
        setClicks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌', err);
        setClicks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClicks();
    const interval = setInterval(fetchClicks, 30000);
    return () => clearInterval(interval);
  }, [timeRange, secret]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
        📊 Tracking Affiliation
      </h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {(['24h', '7d', '30d'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTimeRange(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              background: timeRange === t ? '#0284c7' : '#f1f5f9',
              color: timeRange === t ? '#fff' : '#64748b',
            }}
          >
            {t === '24h' ? '24h' : t === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Chargement...</div>
      ) : clicks.length === 0 ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          Aucun clic enregistré
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Réf. Clic</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Apporteur</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Géo</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Appareil</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Statut</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((click) => (
                <tr key={click.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{click.click_ref}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0284c7' }}>
                    {click.apporteur_code || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{click.geo || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{click.device || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: click.converted ? '#dcfce7' : '#f1f5f9',
                        color: click.converted ? '#16a34a' : '#64748b',
                      }}
                    >
                      {click.converted ? '✅ Converti' : '⏳ Clic'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                    {new Date(click.created_at).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <Link href="/admin" style={{ color: '#0284c7', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          ← Retour Admin
        </Link>
      </div>
    </div>
  );
}
