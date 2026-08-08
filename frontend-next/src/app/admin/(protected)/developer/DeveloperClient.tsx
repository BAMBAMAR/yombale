'use client'

import { useEffect, useState } from 'react'

export interface ApiKeyItem {
  id: string
  nom: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  boutique_id: string
  boutique_nom: string
  boutique_slug: string
}

export interface WebhookItem {
  id: string
  url: string
  events: string[]
  actif: boolean
  created_at: string
  boutique_id: string
  boutique_nom: string
  boutique_slug: string
}

export default function DeveloperClient({ secret }: { secret: string }) {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const chargerDonnees = async () => {
    try {
      setLoading(true)
      setErreur(null)
      const res = await fetch('/api/boutiques/admin/developer-portal', {
        headers: { 'X-Admin-Secret': secret }
      })
      if (!res.ok) {
        throw new Error(`Erreur ${res.status} lors du chargement des données API`)
      }
      const data = await res.json()
      setKeys(data.keys || [])
      setWebhooks(data.webhooks || [])
    } catch (err: any) {
      console.error('[DEV PORTAL ADMIN CLIENT ERR]', err)
      setErreur(err.message || 'Impossible de charger le Portail Développeur API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [secret])

  const revoquerCleApi = async (keyId: string, nomKey: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer la clé API "${nomKey}" ? Cette action est irréversible.`)) {
      return
    }
    try {
      setRevokingId(keyId)
      const res = await fetch(`/api/boutiques/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': secret }
      })
      if (!res.ok) throw new Error('Erreur lors de la révocation')
      setMessageSuccess(`Clé API "${nomKey}" révoquée avec succès.`)
      setKeys(prev => prev.filter(k => k.id !== keyId))
    } catch (err: any) {
      alert(`Échec de la révocation : ${err.message}`)
    } finally {
      setRevokingId(null)
    }
  }

  const supprimerWebhook = async (webhookId: string, urlWebhook: string) => {
    if (!confirm(`Supprimer le webhook "${urlWebhook}" ?`)) return
    try {
      setRevokingId(webhookId)
      const res = await fetch(`/api/boutiques/admin/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': secret }
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression du webhook')
      setMessageSuccess(`Webhook supprimé avec succès.`)
      setWebhooks(prev => prev.filter(w => w.id !== webhookId))
    } catch (err: any) {
      alert(`Échec de la suppression : ${err.message}`)
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* En-tête Superadmin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            🔌 Supervision du Portail Développeur API &amp; Webhooks
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Supervision globale des clés API REST (`nopalou_sk_live_...`) et des webhooks créés par les boutiques sur la formule Business VIP.
          </p>
        </div>
        <button
          onClick={chargerDonnees}
          style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#0f172a' }}
        >
          🔄 Actualiser
        </button>
      </div>

      {messageSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', color: '#166534', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          ✓ {messageSuccess}
        </div>
      )}

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* Cartes Métriques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Clés API Actives</p>
          <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{keys.length}</p>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Webhooks Enregistrés</p>
          <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 900, color: '#2563eb' }}>{webhooks.length}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
          Chargement des clés API et Webhooks en cours...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {/* Section 1 : Clés API */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔑 Clés API REST Générées ({keys.length})
            </h2>

            {keys.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>Aucune clé API REST générée pour le moment.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Boutique</th>
                      <th style={{ padding: '10px 12px' }}>Nom Clé</th>
                      <th style={{ padding: '10px 12px' }}>Préfixe Clé (SHA-256)</th>
                      <th style={{ padding: '10px 12px' }}>Création</th>
                      <th style={{ padding: '10px 12px' }}>Dernier Usage</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map(k => (
                      <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#0f172a' }}>{k.boutique_nom}</strong>
                          <div style={{ fontSize: 11, color: '#64748b' }}>/{k.boutique_slug}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#334155' }}>{k.nom}</td>
                        <td style={{ padding: '12px' }}>
                          <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#0f172a' }}>
                            {k.key_prefix}...
                          </code>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
                          {new Date(k.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('fr-FR') : 'Jamais'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => revoquerCleApi(k.id, k.nom)}
                            disabled={revokingId === k.id}
                            style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            ❌ Révoker
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 2 : Webhooks */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔔 Webhooks Événementiels ({webhooks.length})
            </h2>

            {webhooks.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>Aucun webhook enregistré par les marchands pour le moment.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Boutique</th>
                      <th style={{ padding: '10px 12px' }}>URL Endpoint Webhook</th>
                      <th style={{ padding: '10px 12px' }}>Événements</th>
                      <th style={{ padding: '10px 12px' }}>Statut</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#0f172a' }}>{w.boutique_nom}</strong>
                          <div style={{ fontSize: 11, color: '#64748b' }}>/{w.boutique_slug}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <code style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: 6, fontSize: 12, wordBreak: 'break-all' }}>
                            {w.url}
                          </code>
                        </td>
                        <td style={{ padding: '12px', fontSize: 12, color: '#334155' }}>
                          {Array.isArray(w.events) ? w.events.join(', ') : 'order.created'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: w.actif ? '#f0fdf4' : '#fef2f2', color: w.actif ? '#166534' : '#dc2626' }}>
                            {w.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => supprimerWebhook(w.id, w.url)}
                            disabled={revokingId === w.id}
                            style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            🗑 Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
