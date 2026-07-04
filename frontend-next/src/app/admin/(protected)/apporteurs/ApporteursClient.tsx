'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Settings {
  apporteur_actif: string
  apporteur_taux_commission: string
  apporteur_seuil_paiement: string
  apporteur_cookie_jours: string
}

interface Apporteur {
  id: string
  nom: string
  email: string
  code_apporteur: string
  nb_boutiques: string
  total_du: string
  total_paye: string
}

interface Commission {
  id: string
  montant: string
  statut: 'du' | 'paye'
  created_at: string
  paye_at: string | null
  apporteur_nom: string
  code_apporteur: string
  boutique_nom: string
  cumul_du_apporteur: string
  seuil_atteint: boolean
}

export default function ApporteursClient({
  initialSettings, initialApporteurs, initialCommissions, secret,
}: {
  initialSettings: Settings
  initialApporteurs: Apporteur[]
  initialCommissions: Commission[]
  secret: string
}) {
  const [form, setForm] = useState<Settings>(initialSettings)
  const [apporteurs] = useState<Apporteur[]>(initialApporteurs)
  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function saveSettings() {
    setSaving(true)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (r.ok) setMsg({ type: 'ok', text: `${Object.keys(data.updated || {}).length} paramètre(s) sauvegardé(s) ✓` })
      else setMsg({ type: 'err', text: data.error || 'Erreur' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setSaving(false) }
  }

  async function payerCommission(id: string, forcer: boolean) {
    try {
      const r = await fetch(`${BACKEND}/api/apporteurs/admin/commissions/${id}/payer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ ignorer_seuil: forcer }),
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error }); return }
      setCommissions(cs => cs.map(c => c.id === id ? { ...c, statut: 'paye', paye_at: data.commission.paye_at } : c))
      setMsg({ type: 'ok', text: 'Commission marquée payée ✓' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    }
  }

  const field = (key: keyof Settings, label: string, suffix: string) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13, color: '#374151' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 180 }}
        />
        <span style={{ color: '#6b7280', fontSize: 13 }}>{suffix}</span>
      </div>
    </div>
  )

  const actif = form.apporteur_actif === 'true'

  return (
    <div style={{ maxWidth: 960 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b' }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>⚙️ Configuration</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button
            onClick={() => setForm(f => ({ ...f, apporteur_actif: actif ? 'false' : 'true' }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: actif ? '#16a34a' : '#d1d5db', position: 'relative' }}
          >
            <span style={{ position: 'absolute', top: 3, left: actif ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Programme actif — <strong style={{ color: actif ? '#16a34a' : '#dc2626' }}>{actif ? 'Activé' : 'Désactivé'}</strong>
          </span>
        </div>

        {field('apporteur_taux_commission', 'Taux de commission', '%')}
        {field('apporteur_seuil_paiement', 'Seuil minimum de règlement', 'FCFA')}
        {field('apporteur_cookie_jours', 'Durée du lien de recommandation', 'jours')}

        <button
          onClick={saveSettings}
          disabled={saving}
          style={{ padding: '12px 32px', background: saving ? '#9ca3af' : '#ff6600', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>👥 Apporteurs ({apporteurs.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Nom', 'Code', 'Boutiques', 'Dû', 'Payé'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apporteurs.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '8px 10px' }}>{a.nom}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#C75B00' }}>{a.code_apporteur}</td>
                  <td style={{ padding: '8px 10px' }}>{a.nb_boutiques}</td>
                  <td style={{ padding: '8px 10px' }}>{Number(a.total_du).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '8px 10px', color: '#16a34a' }}>{Number(a.total_paye).toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>💰 Commissions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Apporteur', 'Boutique', 'Montant', 'Statut', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '8px 10px' }}>{c.apporteur_nom} ({c.code_apporteur})</td>
                  <td style={{ padding: '8px 10px' }}>{c.boutique_nom}</td>
                  <td style={{ padding: '8px 10px' }}>{Number(c.montant).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '8px 10px', color: c.statut === 'paye' ? '#16a34a' : '#dc2626' }}>{c.statut}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {c.statut === 'du' && (
                      <button
                        onClick={() => payerCommission(c.id, !c.seuil_atteint)}
                        title={!c.seuil_atteint ? 'Cumul sous le seuil — cliquer pour forcer le paiement' : undefined}
                        style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: c.seuil_atteint ? '#16a34a' : '#f59e0b', color: '#fff',
                        }}
                      >
                        {c.seuil_atteint ? 'Marquer payé' : 'Forcer le paiement'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
