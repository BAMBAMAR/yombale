'use client'
import { useState, useEffect } from 'react'

interface Stats {
  vues_total: string
  vues_ce_mois: string
  vues_7j: string
  clics_tel_total: string
  clics_tel_mois: string
  vues_annonces_total: string
  vues_annonces_mois: string
}

interface Historique {
  jour: string
  vues: string
  clics_tel: string
}

export default function AnalyticsClient({ boutiques }: { boutiques: { id: string; nom: string }[] }) {
  const [boutiqueId, setBoutiqueId] = useState(boutiques[0]?.id ?? '')
  const [stats, setStats]           = useState<Stats | null>(null)
  const [historique, setHistorique] = useState<Historique[]>([])
  const [loading, setLoading]       = useState(false)
  const [erreur, setErreur]         = useState<string | null>(null)

  useEffect(() => {
    if (!boutiqueId) return
    setLoading(true)
    setErreur(null)
    fetch(`/api/boutique/analytics/${boutiqueId}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error || r.status)))
      .then(data => { setStats(data.stats); setHistorique(data.historique ?? []) })
      .catch((msg) => setErreur(typeof msg === 'string' ? msg : 'Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [boutiqueId])

  const n = (v: string | number) => Number(v || 0).toLocaleString('fr-FR')

  if (boutiques.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 32 }}>📊</p>
        <p>Vous n&apos;avez pas encore de boutique.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Analytics boutique</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
        Suivez les performances de votre boutique en temps réel.
      </p>

      {/* Sélecteur boutique */}
      {boutiques.length > 1 && (
        <select
          value={boutiqueId}
          onChange={e => setBoutiqueId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 24 }}
        >
          {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      )}

      {loading && <p style={{ color: '#94a3b8' }}>Chargement…</p>}

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626' }}>
          {erreur}
        </div>
      )}

      {stats && !loading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Vues boutique',  value: n(stats.vues_total),       sub: `${n(stats.vues_7j)} cette semaine`,    emoji: '👁' },
              { label: 'Ce mois',        value: n(stats.vues_ce_mois),     sub: 'vues boutique',                         emoji: '📅' },
              { label: 'Clics tél.',     value: n(stats.clics_tel_total),  sub: `${n(stats.clics_tel_mois)} ce mois`,   emoji: '📞' },
              { label: 'Vues annonces', value: n(stats.vues_annonces_total), sub: `${n(stats.vues_annonces_mois)} ce mois`, emoji: '📋' },
            ].map(({ label, value, sub, emoji }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 22 }}>{emoji}</div>
                <div style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 2px' }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Historique 30j */}
          {historique.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14 }}>
                Activité des 30 derniers jours
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                      {['Date', 'Vues boutique', 'Clics tél.'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((h) => (
                      <tr key={h.jour} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '7px 14px', color: '#64748b' }}>{new Date(h.jour).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '7px 14px', fontWeight: Number(h.vues) > 0 ? 600 : 400 }}>{n(h.vues)}</td>
                        <td style={{ padding: '7px 14px', color: Number(h.clics_tel) > 0 ? '#C75B00' : '#94a3b8', fontWeight: Number(h.clics_tel) > 0 ? 600 : 400 }}>{n(h.clics_tel)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {historique.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
              Pas encore d&apos;activité enregistrée. Les vues s&apos;afficheront dès que des visiteurs consulteront votre boutique.
            </div>
          )}
        </>
      )}
    </div>
  )
}
