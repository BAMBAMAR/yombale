'use client'

import { useState } from 'react'
import { Key, Webhook, RefreshCw, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import { showToast } from '@/context/ToastContext'
import { fetchDevPortalData, revoquerCleApiAction, supprimerWebhookAction } from './actions'

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

interface Props {
  secret?: string
  initialKeys?: ApiKeyItem[]
  initialWebhooks?: WebhookItem[]
}

export default function DeveloperClient({
  initialKeys = [],
  initialWebhooks = [],
}: Props) {
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys)
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(initialWebhooks)
  const [loading, setLoading] = useState<boolean>(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const chargerDonnees = async () => {
    try {
      setLoading(true)
      setErreur(null)
      const res = await fetchDevPortalData()
      if (!res.success) {
        throw new Error(res.error || 'Erreur lors du chargement des données API')
      }
      setKeys(res.keys || [])
      setWebhooks(res.webhooks || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger le Portail Développeur API'
      setErreur(msg)
    } finally {
      setLoading(false)
    }
  }

  const revoquerCleApi = async (keyId: string, nomKey: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer la clé API "${nomKey}" ? Cette action est irréversible.`)) {
      return
    }
    try {
      setRevokingId(keyId)
      const res = await revoquerCleApiAction(keyId)
      if (!res.success) throw new Error(res.error || 'Erreur lors de la révocation')
      setMessageSuccess(`Clé API "${nomKey}" révoquée avec succès.`)
      showToast(`Clé API "${nomKey}" révoquée avec succès.`, 'info', 'Clé API')
      setKeys(prev => prev.filter(k => k.id !== keyId))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la révocation'
      showToast(msg, 'error', 'Clé API')
    } finally {
      setRevokingId(null)
    }
  }

  const supprimerWebhook = async (webhookId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce webhook ?')) {
      return
    }
    try {
      setRevokingId(webhookId)
      const res = await supprimerWebhookAction(webhookId)
      if (!res.success) throw new Error(res.error || 'Erreur lors de la suppression')
      setMessageSuccess('Webhook supprimé avec succès.')
      showToast('Webhook supprimé avec succès.', 'info', 'Webhook')
      setWebhooks(prev => prev.filter(w => w.id !== webhookId))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression'
      showToast(msg, 'error', 'Webhook')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* En-tête Superadmin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={26} color="#1C2B4A" />
            Supervision du Portail Développeur API &amp; Webhooks
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Supervision globale des clés API REST (`nopalou_sk_live_...`) et des webhooks créés par les boutiques sur la formule Business VIP.
          </p>
        </div>
        <button
          onClick={chargerDonnees}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            color: '#1C2B4A',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {messageSuccess && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', color: '#166534', fontSize: 13, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{messageSuccess}</span>
        </div>
      )}

      {erreur && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', color: '#DC2626', fontSize: 13, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{erreur}</span>
        </div>
      )}

      {/* Cartes Métriques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Key size={16} color="#0A5C36" />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Clés API Actives</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#1C2B4A' }}>{keys.length}</p>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Webhook size={16} color="#2563EB" />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Webhooks Enregistrés</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#2563EB' }}>{webhooks.length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Section 1 : Clés API */}
        <section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="#0A5C36" />
            Clés API REST Générées ({keys.length})
          </h2>

          {keys.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Aucune clé API REST générée pour le moment.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC', color: '#475569' }}>
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
                    <tr key={k.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#1C2B4A' }}>{k.boutique_nom}</strong>
                        <div style={{ fontSize: 11, color: '#64748B' }}>/{k.boutique_slug}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#334155' }}>{k.nom}</td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#1C2B4A' }}>
                          {k.key_prefix}••••••••
                        </code>
                      </td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: 12 }}>
                        {new Date(k.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: 12 }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => revoquerCleApi(k.id, k.nom)}
                          disabled={revokingId === k.id}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: revokingId === k.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} />
                          {revokingId === k.id ? 'Révocation...' : 'Révoquer'}
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
        <section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Webhook size={18} color="#2563EB" />
            Webhooks Actifs ({webhooks.length})
          </h2>

          {webhooks.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Aucun webhook enregistré pour le moment.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>Boutique</th>
                    <th style={{ padding: '10px 12px' }}>URL de Réception (Endpoint)</th>
                    <th style={{ padding: '10px 12px' }}>Événements Écoutés</th>
                    <th style={{ padding: '10px 12px' }}>Statut</th>
                    <th style={{ padding: '10px 12px' }}>Création</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#1C2B4A' }}>{w.boutique_nom}</strong>
                        <div style={{ fontSize: 11, color: '#64748B' }}>/{w.boutique_slug}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#1C2B4A', wordBreak: 'break-all' }}>
                          {w.url}
                        </code>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {w.events && w.events.map((ev, i) => (
                            <span key={i} style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                              {ev}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: w.actif ? '#DCFCE7' : '#F1F5F9',
                          color: w.actif ? '#15803D' : '#64748B',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                        }}>
                          {w.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: 12 }}>
                        {new Date(w.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => supprimerWebhook(w.id)}
                          disabled={revokingId === w.id}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: revokingId === w.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} />
                          {revokingId === w.id ? 'Suppression...' : 'Supprimer'}
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
    </div>
  )
}
