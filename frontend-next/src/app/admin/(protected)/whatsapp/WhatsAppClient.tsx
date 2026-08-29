'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface WaStatus {
  config: {
    phone_number_id: string | null
    token_present: boolean
    app_secret: boolean
    verify_token: boolean
    catalog_id: string | null
    webhook_url: string
  }
  api_status: 'ok' | 'token_invalide' | 'erreur_reseau' | 'non_configure'
  enabled: boolean
  chatbot: boolean
  stats: { sessions_total: number; sessions_actives: number; messages_24h: number }
}

interface Session {
  phone: string
  state: string
  updated_at: string
}

interface SupportDemande {
  id: string
  telephone: string
  nom: string | null
  sujet: string | null
  message: string | null
  statut: string
  canal: string
  created_at: string
}

export default function WhatsAppClient({
  status: initialStatus,
  sessions: initialSessions,
  initialSupport = [],
  secret,
}: {
  status: WaStatus
  sessions: Session[]
  initialSupport?: SupportDemande[]
  secret: string
}) {
  const [status, setStatus] = useState(initialStatus)
  const [sessions, setSessions] = useState(initialSessions)
  const [supportList, setSupportList] = useState<SupportDemande[]>(initialSupport)
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('Bonjour depuis Nopalou ! 👋')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function show(type: 'ok' | 'err', text: string) {
    setFlash({ type, text })
    setTimeout(() => setFlash(null), 4000)
  }

  async function updateSupportStatut(id: string, newStatut: string) {
    try {
      const r = await fetch(`/api/whatsapp/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ statut: newStatut }),
      })
      if (r.ok) {
        setSupportList(prev => prev.map(s => s.id === id ? { ...s, statut: newStatut } : s))
        show('ok', `Statut mis à jour : ${newStatut}`)
      } else {
        const d = await r.json()
        show('err', d.error || 'Erreur lors de la mise à jour')
      }
    } catch (_) {
      show('err', 'Erreur réseau')
    }
  }

  async function toggle(key: 'whatsapp_enabled' | 'whatsapp_chatbot') {
    const r = await fetch(`/api/whatsapp/admin/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({ key }),
    })
    const d = await r.json()
    if (r.ok) {
      setStatus(s => ({ ...s, enabled: d.whatsapp_enabled ?? s.enabled, chatbot: d.whatsapp_chatbot ?? s.chatbot }))
      show('ok', `${key === 'whatsapp_enabled' ? 'WhatsApp' : 'Chatbot'} mis à jour`)
    } else show('err', d.error)
  }

  async function sendTest() {
    if (!testPhone) return
    setBusy(true)
    try {
      const r = await fetch(`/api/whatsapp/admin/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ phone: testPhone, message: testMsg }),
      })
      const d = await r.json()
      if (r.ok) show('ok', `Message envoyé à ${testPhone} ✓`)
      else show('err', d.error)
    } finally { setBusy(false) }
  }

  async function clearSessions() {
    if (!confirm('Vider toutes les sessions chatbot ?')) return
    const r = await fetch(`/api/whatsapp/admin/sessions`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': secret },
    })
    const d = await r.json()
    if (r.ok) { setSessions([]); show('ok', `${d.deleted} session(s) supprimée(s)`) }
    else show('err', d.error)
  }

  const statusColor = { ok: '#16a34a', token_invalide: '#dc2626', erreur_reseau: '#d97706', non_configure: '#6b7280' }
  const statusLabel = { ok: '✅ Connecté', token_invalide: '❌ Token invalide', erreur_reseau: '⚠️ Erreur réseau', non_configure: '⚙️ Non configuré' }

  const card = (title: string, children: React.ReactNode) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#111827', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>{title}</h3>
      {children}
    </div>
  )

  const onOff = (enabled: boolean, onToggle: () => void, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <button onClick={onToggle} style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: enabled ? '#16a34a' : '#d1d5db', position: 'relative',
      }}>
        <span style={{ position: 'absolute', top: 3, left: enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
      <span style={{ fontSize: 14, fontWeight: 500 }}>
        {label} — <strong style={{ color: enabled ? '#16a34a' : '#dc2626' }}>{enabled ? 'Activé' : 'Désactivé'}</strong>
      </span>
    </div>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      {flash && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: flash.type === 'ok' ? '#dcfce7' : '#fee2e2', color: flash.type === 'ok' ? '#166534' : '#991b1b' }}>
          {flash.text}
        </div>
      )}

      {card('📊 État de la connexion Meta', <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {([
            ['Statut API', <span key="statut" style={{ color: statusColor[status.api_status], fontWeight: 700 }}>{statusLabel[status.api_status]}</span>],
            ['Phone ID', status.config.phone_number_id || '—'],
            ['Token', status.config.token_present ? '✅ Présent' : '❌ Manquant'],
            ['App Secret', status.config.app_secret ? '✅' : '❌'],
            ['Catalog ID', status.config.catalog_id || '—'],
          ] as [string, React.ReactNode][]).map(([k, v]) => (
            <div key={String(k)} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 16px', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '8px 12px', borderRadius: 6 }}>
          URL Webhook : <code>{status.config.webhook_url}</code>
        </div>
      </>)}

      {card('📈 Statistiques', <>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            [`${status.stats.sessions_total}`, 'Sessions totales'],
            [`${status.stats.sessions_actives}`, 'Sessions actives (1h)'],
            [`${status.stats.messages_24h}`, 'Messages reçus (24h)'],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', background: '#f9fafb', borderRadius: 10, padding: '14px 20px', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ff6600' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </>)}

      {card('⚙️ Activation', <>
        {onOff(status.enabled, () => toggle('whatsapp_enabled'), 'WhatsApp (envoi & réception)')}
        {onOff(status.chatbot, () => toggle('whatsapp_chatbot'), 'Chatbot automatique')}
        <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
          Désactiver le chatbot conserve la réception des messages mais arrête les réponses automatiques.
        </p>
      </>)}

      {card('📨 Message de test', <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            placeholder="221XXXXXXXXX"
            style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 200 }}
          />
          <input
            value={testMsg}
            onChange={e => setTestMsg(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, flex: 1, minWidth: 200 }}
          />
          <button onClick={sendTest} disabled={busy || !testPhone} style={{
            padding: '9px 20px', background: busy ? '#9ca3af' : '#25D366', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
          }}>
            {busy ? '...' : '📤 Envoyer'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Le numéro doit être enregistré sur WhatsApp et avoir accepté vos messages (opt-in Meta).</p>
      </>)}

      {card(`💬 Sessions chatbot actives (${sessions.length})`, <>
        {sessions.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>Aucune session active.</p>
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Téléphone', 'État', 'Dernière activité'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{s.phone}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{s.state}</span></td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{new Date(s.updated_at).toLocaleString('fr-SN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={clearSessions} style={{ marginTop: 14, padding: '8px 18px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          🗑 Vider toutes les sessions
        </button>
      </>)}

      {card(`📞 Demandes de Rappel & Support Client (${supportList.filter(s => s.statut === 'en_attente').length} en attente)`, <>
        {supportList.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>Aucune demande de rappel en attente.</p>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Date', 'Téléphone', 'Nom / Objet', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supportList.map((sup) => {
                  const isPending = sup.statut === 'en_attente'
                  const cleanPh = sup.telephone.replace(/\D/g, '')
                  return (
                    <tr key={sup.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(sup.created_at).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}>
                        +{sup.telephone}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{sup.nom || 'Client Nopalou'}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{sup.message || 'Demande de rappel'}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          background: isPending ? '#fef3c7' : '#dcfce7',
                          color: isPending ? '#92400e' : '#166534',
                          borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        }}>
                          {isPending ? '🟡 En attente' : '🟢 Traité'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <a
                            href={`https://wa.me/${cleanPh}?text=${encodeURIComponent(`Bonjour ${sup.nom || ''}, suite à votre demande de rappel sur Nopalou, je suis à votre écoute.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#25D366', color: '#fff', padding: '4px 10px',
                              borderRadius: 4, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            }}
                          >
                            💬 Rappeler
                          </a>
                          {isPending ? (
                            <button
                              onClick={() => updateSupportStatut(sup.id, 'traite')}
                              style={{
                                background: '#e5e7eb', color: '#374151', border: 'none',
                                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              ✓ Marquer traité
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSupportStatut(sup.id, 'en_attente')}
                              style={{
                                background: '#fef3c7', color: '#92400e', border: 'none',
                                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              ↩ Rouvrir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </>)}

      {card('📋 Checklist mise en production Meta', <>
        {[
          ['WHATSAPP_PHONE_NUMBER_ID', status.config.phone_number_id ? '✅' : '❌'],
          ['WHATSAPP_API_TOKEN (token système permanent)', status.config.token_present ? '✅' : '❌'],
          ['WHATSAPP_APP_SECRET', status.config.app_secret ? '✅' : '❌'],
          ['WHATSAPP_VERIFY_TOKEN', status.config.verify_token ? '✅' : '❌'],
          ['WHATSAPP_CATALOG_ID (pour catalogue)', status.config.catalog_id ? '✅' : '⚠️ Optionnel'],
          ['Webhook déclaré sur Meta', status.api_status === 'ok' ? '✅' : '⏳ À faire'],
          ['4 templates soumis à Meta', '✅ Approuvés'],
          ['Vérification entreprise Business Manager', '✅ SKYROAD SARL'],
        ].map(([item, ok]) => (
          <div key={String(item)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
            <span style={{ color: '#374151' }}>{item}</span>
            <span style={{ fontWeight: 700 }}>{ok}</span>
          </div>
        ))}
      </>)}
    </div>
  )
}
