'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Paiement {
  id: string
  reference: string
  montant: string
  methode: 'wave' | 'orange'
  telephone_expediteur: string
  transaction_id_client: string | null
  preuve_url: string | null
  statut: string
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  utilisateur_telephone: string | null
}

export default function PaiementsManuelsClient({
  initialPaiements, secret,
}: { initialPaiements: Paiement[]; secret: string }) {
  const [paiements, setPaiements] = useState(initialPaiements)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  async function valider(id: string) {
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/valider`, {
        method: 'POST', headers: { 'X-Admin-Secret': secret },
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Paiement validé et activé ✓' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  async function rejeter(id: string) {
    const motif = prompt('Motif du rejet (optionnel) :') ?? ''
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/rejeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ motif }),
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Déclaration rejetée' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b' }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>
          En attente ({paiements.length})
        </h3>
        {paiements.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucune déclaration en attente.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Client', 'Référence', 'Montant', 'Méthode', 'Tél. expéditeur', 'ID transaction', 'Preuve', 'Déclaré le', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '8px 10px' }}>{p.utilisateur_nom}<br /><span style={{ color: '#9ca3af' }}>{p.utilisateur_email}</span></td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{p.reference}</td>
                    <td style={{ padding: '8px 10px' }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</td>
                    <td style={{ padding: '8px 10px' }}>{p.methode === 'wave' ? '🌊 Wave' : '🟠 Orange'}</td>
                    <td style={{ padding: '8px 10px' }}>{p.telephone_expediteur}</td>
                    <td style={{ padding: '8px 10px' }}>{p.transaction_id_client || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {p.preuve_url ? <a href={p.preuve_url} target="_blank" rel="noreferrer">Voir</a> : '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                    <td style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => valider(p.id)}
                        disabled={enCours === p.id}
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#16a34a', color: '#fff' }}
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => rejeter(p.id)}
                        disabled={enCours === p.id}
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff' }}
                      >
                        Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
