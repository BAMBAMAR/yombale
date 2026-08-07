'use client'

import { useEffect, useState } from 'react'

export interface ApiKey {
  id: string
  nom: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export interface Webhook {
  id: string
  url: string
  secret_prefix: string
  events: string[]
  actif: boolean
  created_at: string
}

export default function PortailDeveloppeurBoutique({ boutiqueId, planActif }: { boutiqueId: string; planActif: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [erreur, setErreur] = useState<string | null>(null)
  
  // États de création de clé API
  const [nomNouvelleCle, setNomNouvelleCle] = useState<string>('')
  const [cleBruteCreee, setCleBruteCreee] = useState<string | null>(null)
  const [creationCleEnCours, setCreationCleEnCours] = useState<boolean>(false)

  // États de création de Webhook
  const [urlWebhook, setUrlWebhook] = useState<string>('')
  const [eventsWebhook, setEventsWebhook] = useState<string>('order.created')
  const [webhookSecretCree, setWebhookSecretCree] = useState<string | null>(null)
  const [creationWebhookEnCours, setCreationWebhookEnCours] = useState<boolean>(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null

  const chargerDonnees = async () => {
    try {
      setLoading(true)
      setErreur(null)

      const [resKeys, resWebhooks] = await Promise.all([
        fetch(`/api/boutiques/${boutiqueId}/api-keys`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/boutiques/${boutiqueId}/webhooks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ])

      if (resKeys.ok) {
        const dataKeys = await resKeys.json()
        setKeys(dataKeys.apiKeys || dataKeys.keys || [])
      }

      if (resWebhooks.ok) {
        const dataWebhooks = await resWebhooks.json()
        setWebhooks(dataWebhooks.webhooks || [])
      }
    } catch (err: any) {
      console.error('[PORTAIL DEV BOUTIQUE ERR]', err)
      setErreur(err.message || 'Impossible de charger vos données Développeur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  const genererCleApi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomNouvelleCle.trim()) return
    try {
      setCreationCleEnCours(true)
      setCleBruteCreee(null)
      const res = await fetch(`/api/boutiques/${boutiqueId}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nom: nomNouvelleCle.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de la génération de la clé API')

      const rawKey = data.api_key || data.apiKey || data.key
      setCleBruteCreee(rawKey)
      setNomNouvelleCle('')
      chargerDonnees()

      if (rawKey) {
        try {
          await navigator.clipboard.writeText(rawKey)
          alert(`Clé API générée et copiée automatiquement dans le presse-papier :\n\n${rawKey}\n\nConservez-la en lieu sûr !`)
        } catch (_) {
          alert(`Clé API générée avec succès :\n\n${rawKey}\n\nCopiez-la dans la boîte verte qui vient d'apparaître !`)
        }
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setCreationCleEnCours(false)
    }
  }

  const revoquerCleApi = async (keyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé API ? Les applications l\'utilisant perdront leur accès.')) return
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      setKeys(prev => prev.filter(k => k.id !== keyId))
    } catch (err: any) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const ajouterWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlWebhook.trim()) return
    try {
      setCreationWebhookEnCours(true)
      setWebhookSecretCree(null)
      const res = await fetch(`/api/boutiques/${boutiqueId}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url: urlWebhook.trim(),
          events: [eventsWebhook],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de l\'ajout du Webhook')

      const rawSecret = data.secret || data.webhook?.secret || data.webhookSecret
      setWebhookSecretCree(rawSecret)
      setUrlWebhook('')
      chargerDonnees()
    } catch (err: any) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setCreationWebhookEnCours(false)
    }
  }

  const supprimerWebhook = async (webhookId: string) => {
    if (!confirm('Supprimer ce webhook ?')) return
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      setWebhooks(prev => prev.filter(w => w.id !== webhookId))
    } catch (err: any) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const isBusiness = planActif === 'business'

  if (!isBusiness) {
    return (
      <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 16, padding: 24, textOverflow: 'ellipsis' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#9a3412', fontWeight: 800 }}>Portail Développeur API REST &amp; Webhooks (Formule Business VIP)</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#c2410c' }}>
              L&apos;accès à l&apos;API REST Nopalou et aux Webhooks événementiels en temps réel est réservé aux boutiques abonnées au plan <strong>Business VIP</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Banner Business VIP */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 16, padding: 24, color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ background: '#ff6600', color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
            VIP Active
          </span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🔌 Portail Développeur &amp; Intégrations API REST</h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
          Connectez votre boutique Nopalou à votre site e-commerce externe (WooCommerce, Shopify), votre logiciel de caisse externe ou votre application mobile grâce aux clés API sécurisées (`nopalou_sk_live_...`) et recevez des notifications Webhooks en temps réel.
        </p>
      </div>

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, color: '#dc2626', fontSize: 13, fontWeight: 700 }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* SECTION 1 : CLÉS API REST */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          🔑 Mes Clés API REST
        </h3>

        {/* Formulaire de génération */}
        <form onSubmit={genererCleApi} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nom de l'application (ex: WooCommerce Prod, App Mobile)"
            value={nomNouvelleCle}
            onChange={e => setNomNouvelleCle(e.target.value)}
            required
            style={{ flex: 1, minWidth: 260, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
          <button
            type="submit"
            disabled={creationCleEnCours}
            style={{ padding: '10px 20px', background: '#ff6600', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
          >
            {creationCleEnCours ? 'Génération...' : '⚡ Générer une Clé API'}
          </button>
        </form>

        {/* Notification Clé Brute générée */}
        {cleBruteCreee && (
          <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: '#166534', fontSize: 14, marginBottom: 6 }}>
              ✅ Clé API générée avec succès !
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#15803d' }}>
              Copiez cette clé maintenant. Pour votre sécurité, elle ne pourra plus être réaffichée par la suite.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#0f172a', fontWeight: 700, wordBreak: 'break-all' }}>
                {cleBruteCreee}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cleBruteCreee)
                  alert('Clé API copiée dans le presse-papier !')
                }}
                style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                📋 Copier
              </button>
            </div>
          </div>
        )}

        {/* Tableau des Clés */}
        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>Chargement des clés API...</div>
        ) : keys.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Aucune clé API créée pour le moment.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>Nom</th>
                  <th style={{ padding: '10px 12px' }}>Préfixe Clé</th>
                  <th style={{ padding: '10px 12px' }}>Création</th>
                  <th style={{ padding: '10px 12px' }}>Dernier usage</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{k.nom}</td>
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
                        onClick={() => revoquerCleApi(k.id)}
                        style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        ❌ Révoquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2 : WEBHOOKS ÉVÉNEMENTIELS */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          🔔 Endpoints Webhooks (Notifications en direct)
        </h3>

        {/* Formulaire Webhook */}
        <form onSubmit={ajouterWebhook} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 10, marginBottom: 20 }}>
          <input
            type="url"
            placeholder="URL HTTPS de votre serveur (ex: https://monsite.com/api/webhook-nopalou)"
            value={urlWebhook}
            onChange={e => setUrlWebhook(e.target.value)}
            required
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
          <select
            value={eventsWebhook}
            onChange={e => setEventsWebhook(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
          >
            <option value="order.created">📦 Nouvelle commande</option>
            <option value="stock.updated">📊 Modification de stock</option>
            <option value="payment.success">💳 Paiement encaissé</option>
          </select>
          <button
            type="submit"
            disabled={creationWebhookEnCours}
            style={{ padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
          >
            {creationWebhookEnCours ? 'Ajout...' : '➕ Enregistrer Webhook'}
          </button>
        </form>

        {/* Notif Secret Webhook */}
        {webhookSecretCree && (
          <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: '#1e40af', fontSize: 14, marginBottom: 6 }}>
              🛡 Secret de Signature Webhook (`X-Nopalou-Signature`)
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#1d4ed8' }}>
              Utilisez cette clé secrète dans votre backend pour vérifier la signature HMAC des requêtes webhook.
            </p>
            <code style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 13, color: '#0f172a', fontWeight: 700, display: 'block', wordBreak: 'break-all' }}>
              {webhookSecretCree}
            </code>
          </div>
        )}

        {/* Tableau Webhooks */}
        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>Chargement des webhooks...</div>
        ) : webhooks.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Aucun webhook configuré pour cette boutique.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>URL Endpoint</th>
                  <th style={{ padding: '10px 12px' }}>Événements</th>
                  <th style={{ padding: '10px 12px' }}>Statut</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <code style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
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
                        onClick={() => supprimerWebhook(w.id)}
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
      </div>
    </div>
  )
}
