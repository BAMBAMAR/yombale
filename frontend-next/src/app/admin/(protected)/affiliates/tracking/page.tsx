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

export default function AffiliateTrackingPage() {
  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    async function fetchClicks() {
      try {
        const res = await fetch(`/api/affiliates/clicks?range=${timeRange}`, {
          headers: { 'X-Admin-Secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
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
    const interval = setInterval(fetchClicks, 30000); // Rafraîchir toutes les 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="page-container">
      <h1>📊 Tracking Affiliation</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {(['24h', '7d', '30d'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTimeRange(t)}
            className={timeRange === t ? 'button-primary' : 'button'}
            style={{ padding: '8px 16px' }}
          >
            {t === '24h' ? '24h' : t === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : clicks.length === 0 ? (
        <div className="empty">Aucun clic enregistré</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Click Ref</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Code Apporteur</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Géo</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Device</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Converti ?</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((click) => (
                <tr key={click.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{click.click_ref}</td>
                  <td style={{ padding: '10px' }}>{click.apporteur_code || '—'}</td>
                  <td style={{ padding: '10px' }}>{click.geo}</td>
                  <td style={{ padding: '10px' }}>{click.device}</td>
                  <td style={{ padding: '10px' }}>
                    {new Date(click.created_at).toLocaleString('fr-SN')}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {click.converted ? '✅ Oui' : '❌ Non'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <Link href="/admin" className="button-link">
          ← Retour Admin
        </Link>
      </div>
    </div>
  );
}
