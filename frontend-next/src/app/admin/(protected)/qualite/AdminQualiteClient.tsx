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

export default function AdminQualiteClient({ secret }: { secret: string }) {
  const [quarantines, setQuarantines] = useState<QuarantineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'quarantined' | 'validated'>('quarantined');

  useEffect(() => {
    async function fetchQuarantines() {
      setLoading(true);
      try {
        const res = await fetch(`/api/qualite/quarantines?status=${filter}`, {
          headers: { 'X-Admin-Secret': secret },
          cache: 'no-store',
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
  }, [filter, secret]);

  async function handleValidate(offreId: string) {
    try {
      const res = await fetch(`/api/qualite/quarantines/${offreId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
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
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      });
      if (res.ok) {
        setQuarantines(quarantines.filter((q) => q.offre_id !== offreId));
      }
    } catch (err) {
      console.error('❌', err);
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
            🔍 Qualité Données — Quarantines
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Offres suspectes détectées automatiquement (anomalies de prix &gt; 50% sous la médiane).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['quarantined', 'validated', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                background: filter === tab ? '#0284c7' : '#f1f5f9',
                color: filter === tab ? '#fff' : '#64748b',
              }}
            >
              {tab === 'quarantined' && '⚠️ Quarantinées'}
              {tab === 'validated' && '✅ Validées'}
              {tab === 'all' && '📋 Toutes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Chargement...</div>
      ) : quarantines.length === 0 ? (
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
          Aucune quarantine pour ce filtre
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Produit</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Raison</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Prix Offre</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Prix Médian 30j</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Statut</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quarantines.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{q.produit_nom}</td>
                  <td style={{ padding: '12px 16px', color: '#ef4444' }}>{q.raison}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>
                    {Number(q.prix).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>
                    {q.prix_moyen_30j ? `${Number(q.prix_moyen_30j).toLocaleString('fr-FR')} FCFA` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background:
                          q.status === 'quarantined'
                            ? '#fee2e2'
                            : q.status === 'validated'
                            ? '#dcfce7'
                            : '#f1f5f9',
                        color:
                          q.status === 'quarantined'
                            ? '#dc2626'
                            : q.status === 'validated'
                            ? '#16a34a'
                            : '#64748b',
                      }}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {q.status === 'quarantined' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleValidate(q.offre_id)}
                          style={{
                            padding: '4px 10px',
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleReject(q.offre_id)}
                          style={{
                            padding: '4px 10px',
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
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
