'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QuarantineEntry {
  id: string;
  offre_id: string;
  produit_nom: string;
  raison: string;
  prix: number;
  prix_moyen_30j: number;
  quarantined_at: string;
  status: 'quarantined' | 'validated' | 'rejected';
}

export default function QualiteDataPage() {
  const [quarantines, setQuarantines] = useState<QuarantineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'quarantined' | 'validated'>('quarantined');

  useEffect(() => {
    async function fetchQuarantines() {
      try {
        const res = await fetch(`/api/qualite/quarantines?status=${filter}`, {
          headers: { 'X-Admin-Secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        });
        if (!res.ok) throw new Error('Fetch échoué');
        const data = await res.json();
        setQuarantines(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌', err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuarantines();
  }, [filter]);

  async function handleValidate(offreId: string) {
    try {
      const res = await fetch(`/api/qualite/quarantines/${offreId}/validate`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
      });
      if (res.ok) {
        setQuarantines(quarantines.filter((q) => q.offre_id !== offreId));
      }
    } catch (err) {
      console.error('❌', err);
    }
  }

  async function handleReject(offreId: string) {
    try {
      const res = await fetch(`/api/qualite/quarantines/${offreId}/reject`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
      });
      if (res.ok) {
        setQuarantines(quarantines.filter((q) => q.offre_id !== offreId));
      }
    } catch (err) {
      console.error('❌', err);
    }
  }

  return (
    <div className="page-container">
      <h1>🔍 Qualité Données — Quarantines</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {(['quarantined', 'validated', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'button-primary' : 'button'}
            style={{ padding: '8px 16px' }}
          >
            {f === 'quarantined' ? '⚠️ Quarantinées' : f === 'validated' ? '✅ Validées' : '📋 Toutes'}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : quarantines.length === 0 ? (
        <div className="empty">Aucune quarantine</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Produit</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Raison</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Prix</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Moyenne 30j</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Variation</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quarantines.map((q) => {
                const variation = q.prix_moyen_30j
                  ? ((q.prix - q.prix_moyen_30j) / q.prix_moyen_30j * 100).toFixed(1)
                  : '—';
                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{q.produit_nom}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>{q.raison}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{q.prix.toLocaleString('fr-SN')} XOF</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {q.prix_moyen_30j?.toLocaleString('fr-SN') || '—'} XOF
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', color: Number(variation) > 50 ? '#d32f2f' : '#666' }}>
                      {variation}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      {filter === 'quarantined' && (
                        <>
                          <button
                            onClick={() => handleValidate(q.offre_id)}
                            style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px' }}
                          >
                            ✓ Valider
                          </button>
                          <button
                            onClick={() => handleReject(q.offre_id)}
                            style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px' }}
                          >
                            ✕ Rejeter
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
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
