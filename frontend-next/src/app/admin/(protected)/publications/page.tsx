'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/admin-proxy/fb/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...((opts.headers as Record<string,string>) || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

interface FbPost {
  id: string
  message: string
  lien: string | null
  image_url: string | null
  publier_instagram: boolean
  statut: 'brouillon' | 'approuve' | 'publie' | 'erreur'
  date_publication: string | null
  date_publie: string | null
  post_fb_id: string | null
  post_ig_id: string | null
  erreur: string | null
  created_at: string
}

interface TokenStatus {
  status: 'ok' | 'expired' | 'missing' | 'error'
  message?: string
  name?: string
  expires_at?: string | null
  is_page_token?: boolean
  type?: string
}

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon',  color: '#94A3B8' },
  approuve:  { label: 'Approuvé',   color: '#F59E0B' },
  publie:    { label: 'Publié',     color: '#10B981' },
  erreur:    { label: 'Erreur',     color: '#EF4444' },
}

function TokenBanner({ onRenew }: { onRenew: () => void }) {
  const [ts, setTs]       = useState<TokenStatus | null>(null)
  const [loading, setL]   = useState(true)

  useEffect(() => {
    api('token-status').then(setTs).catch(() => setTs({ status: 'error', message: 'Impossible de vérifier' })).finally(() => setL(false))
  }, [])

  if (loading) return null

  const expired  = ts?.status === 'expired' || ts?.status === 'missing'
  const bg       = expired ? '#FEF2F2' : ts?.status === 'ok' ? '#F0FDF4' : '#FFFBEB'
  const border   = expired ? '#FECACA' : ts?.status === 'ok' ? '#BBF7D0' : '#FDE68A'
  const color    = expired ? '#DC2626' : ts?.status === 'ok' ? '#166534' : '#92400E'
  const icon     = expired ? '❌' : ts?.status === 'ok' ? '✅' : '⚠️'

  let label = ''
  if (ts?.status === 'missing') label = 'Aucun token Facebook configuré'
  else if (ts?.status === 'expired') label = `Token expiré — ${ts.message?.split('on ')[1]?.split('.')[0] || 'session terminée'}`
  else if (ts?.status === 'ok') {
    const exp = ts.expires_at ? new Date(ts.expires_at) : null
    const days = exp ? Math.ceil((exp.getTime() - Date.now()) / 86400000) : null
    label = `Token actif${ts.name ? ` · ${ts.name}` : ''}${days !== null ? ` · expire dans ${days}j` : ' · pas d\'expiration'}`
  } else label = ts?.message || 'Statut inconnu'

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color, fontWeight: 600 }}>{icon} {label}</span>
      <button
        onClick={onRenew}
        style={{ padding: '6px 14px', background: expired ? '#DC2626' : '#1877F2', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        {expired ? '🔑 Renouveler le token' : '🔑 Changer le token'}
      </button>
    </div>
  )
}

function TokenModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [mode, setMode]     = useState<'exchange'|'direct'>('exchange')
  const [token, setToken]   = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msg, setMsg]       = useState('')

  async function save() {
    if (!token.trim()) return
    setStatus('loading'); setMsg('')
    try {
      const endpoint = mode === 'exchange' ? 'token-exchange' : 'token'
      const body     = mode === 'exchange' ? { user_token: token.trim() } : { token: token.trim() }
      const res = await api(endpoint, { method: 'POST', body: JSON.stringify(body) })
      const label = mode === 'exchange'
        ? `Token permanent enregistré · Page : ${res.name}`
        : `Token enregistré · Page : ${res.name}`
      setStatus('ok'); setMsg(label)
      setTimeout(() => { onSaved(); onClose() }, 1800)
    } catch (e: unknown) {
      setStatus('err'); setMsg(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>🔑 Renouveler le token Facebook</h2>

        {/* Sélecteur de mode */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => { setMode('exchange'); setToken(''); setMsg(''); setStatus('idle') }}
            style={{ flex: 1, padding: '10px 12px', border: `2px solid ${mode === 'exchange' ? '#1877F2' : '#E2E8F0'}`, borderRadius: 8, background: mode === 'exchange' ? '#EFF6FF' : '#F8FAFC', color: mode === 'exchange' ? '#1D4ED8' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            ♾️ Token permanent (recommandé)
          </button>
          <button
            onClick={() => { setMode('direct'); setToken(''); setMsg(''); setStatus('idle') }}
            style={{ flex: 1, padding: '10px 12px', border: `2px solid ${mode === 'direct' ? '#1877F2' : '#E2E8F0'}`, borderRadius: 8, background: mode === 'direct' ? '#EFF6FF' : '#F8FAFC', color: mode === 'direct' ? '#1D4ED8' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            📋 Token de page direct (~60j)
          </button>
        </div>

        {mode === 'exchange' ? (
          <>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
              ✅ Cette méthode génère un token qui <strong>n&apos;expire jamais</strong> — plus besoin de renouveler régulièrement.
            </div>
            <ol style={{ fontSize: 13, color: '#1C2B4A', lineHeight: 2.2, paddingLeft: 20, marginBottom: 16 }}>
              <li>Aller sur <strong>developers.facebook.com/tools/explorer</strong></li>
              <li>Sélectionner l&apos;app <strong>Nopalou</strong></li>
              <li>Cliquer <strong>Générer un token d&apos;accès</strong> (token <em>utilisateur</em>, pas de page)</li>
              <li>Cocher : <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code></li>
              <li>Copier le token <strong>utilisateur</strong> généré</li>
              <li>Coller ci-dessous — le serveur l&apos;échange automatiquement en token de page permanent</li>
            </ol>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAAxxxxx... (token utilisateur Facebook — le serveur fait l'échange)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, minHeight: 80, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'monospace' }}
            />
          </>
        ) : (
          <>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              ⚠️ Ce token expire dans ~60 jours. Préférez la méthode <strong>Token permanent</strong> pour éviter ce problème.
            </div>
            <ol style={{ fontSize: 13, color: '#1C2B4A', lineHeight: 2.2, paddingLeft: 20, marginBottom: 16 }}>
              <li>Aller sur <strong>developers.facebook.com/tools/explorer</strong></li>
              <li>Sélectionner l&apos;app <strong>Nopalou</strong> → <strong>Obtenir un token d&apos;accès de Page</strong></li>
              <li>Cocher : <code>pages_manage_posts</code>, <code>pages_read_engagement</code></li>
              <li>Copier le token de Page généré et coller ci-dessous</li>
            </ol>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAAxxxxx... (token de page Facebook)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, minHeight: 80, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'monospace' }}
            />
          </>
        )}

        {msg && (
          <p style={{ fontSize: 13, color: status === 'ok' ? '#10B981' : '#EF4444', marginBottom: 12 }}>
            {status === 'ok' ? '✅' : '❌'} {msg}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={save}
            disabled={status === 'loading' || !token.trim()}
            style={{ padding: '8px 18px', background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            {status === 'loading' ? (mode === 'exchange' ? 'Échange en cours...' : 'Vérification...') : (mode === 'exchange' ? 'Échanger et enregistrer' : 'Enregistrer le token')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PublicationsPage() {
  const [posts, setPosts]     = useState<FbPost[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({
    message: '', lien: '', image_url: '', publier_instagram: false, date_publication: '',
  })
  const [editId, setEditId]   = useState<string | null>(null)
  const [err, setErr]         = useState('')
  const [ok, setOk]           = useState('')
  const [isPending, startTransition] = useTransition()
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [tokenKey, setTokenKey] = useState(0)
  const [showPublies, setShowPublies] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setPosts(await api('')) } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setForm({ message: '', lien: '', image_url: '', publier_instagram: false, date_publication: '' })
    setEditId(null); setErr(''); setOk('')
  }

  function generer(type: string) {
    setErr(''); setOk('')
    startTransition(async () => {
      try {
        const data = await api(`generer/${type}`)
        setForm(f => ({
          ...f,
          message: data.message || '',
          image_url: data.image_url || '',
          lien: data.lien || '',
        }))
        setEditId(null)
        setOk(`Post "${type}" généré — modifiez si besoin puis créez le brouillon`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur génération') }
    })
  }

  function startEdit(p: FbPost) {
    setEditId(p.id)
    setForm({
      message: p.message,
      lien: p.lien || '',
      image_url: p.image_url || '',
      publier_instagram: p.publier_instagram,
      date_publication: p.date_publication ? p.date_publication.slice(0, 16) : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function submit() {
    setErr(''); setOk('')
    startTransition(async () => {
      try {
        const body = {
          message: form.message, lien: form.lien || null,
          image_url: form.image_url || null,
          publier_instagram: form.publier_instagram,
          date_publication: form.date_publication || null,
        }
        if (editId) { await api(`${editId}`, { method: 'PATCH', body: JSON.stringify(body) }); setOk('Post mis à jour') }
        else { await api('', { method: 'POST', body: JSON.stringify(body) }); setOk('Brouillon créé') }
        resetForm(); load()
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function approuver(id: string) {
    startTransition(async () => {
      try {
        await api(`${id}`, { method: 'PATCH', body: JSON.stringify({ statut: 'approuve' }) })
        setOk('Post approuvé — sera publié à la date prévue'); load()
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function remettreEnBrouillon(id: string) {
    startTransition(async () => {
      try { await api(`${id}`, { method: 'PATCH', body: JSON.stringify({ statut: 'brouillon' }) }); load() }
      catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function publierMaintenant(id: string) {
    if (!confirm('Publier immédiatement sur Facebook (et Instagram si activé) ?')) return
    startTransition(async () => {
      try {
        const res = await api(`${id}/publier`, { method: 'POST' })
        setOk(`Publié ! FB: ${res.fb_id || '—'} ${res.ig_id ? '· IG: ' + res.ig_id : ''}`); load()
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function supprimer(id: string) {
    if (!confirm('Supprimer ce post ?')) return
    startTransition(async () => {
      try { await api(`${id}`, { method: 'DELETE' }); load() }
      catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  const s: Record<string, React.CSSProperties> = {
    page:    { maxWidth: 860, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' },
    card:    { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, marginBottom: 12 },
    label:   { fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 },
    input:   { width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' as const, marginBottom: 12 },
    textarea:{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' as const, marginBottom: 12, minHeight: 130, resize: 'vertical' as const },
    btn:     { padding: '8px 16px', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  }

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 4 }}>
        📘 Publications Facebook · Instagram
      </h1>
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
        Rédigez des posts, ajoutez une image, approuvez puis publiez manuellement ou à une date programmée.
      </p>

      {/* Statut token */}
      <TokenBanner key={tokenKey} onRenew={() => setShowTokenModal(true)} />

      {showTokenModal && (
        <TokenModal
          onClose={() => setShowTokenModal(false)}
          onSaved={() => setTokenKey(k => k + 1)}
        />
      )}

      {/* Générateurs automatiques */}
      <div style={{ ...s.card, background: '#F8FAFC', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1C2B4A', marginBottom: 12 }}>
          ⚡ Générer automatiquement depuis la base de données
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <button style={{ ...s.btn, background: '#FEF3C7', color: '#92400E' }} onClick={() => generer('bon-plan')} disabled={isPending}>
            🔥 Bon plan du jour
          </button>
          <button style={{ ...s.btn, background: '#EFF6FF', color: '#1D4ED8' }} onClick={() => generer('comparatif')} disabled={isPending}>
            📊 Comparatif prix
          </button>
          <button style={{ ...s.btn, background: '#F0FDF4', color: '#166534' }} onClick={() => generer('immo')} disabled={isPending}>
            🏠 Annonce immo
          </button>
          <button style={{ ...s.btn, background: '#FDF4FF', color: '#7E22CE' }} onClick={() => generer('conseil')} disabled={isPending}>
            💡 Conseil achat
          </button>
          <button style={{ ...s.btn, background: '#FFF7ED', color: '#C75B00' }} onClick={() => generer('abonnement')} disabled={isPending}>
            🎯 Promo abonnement
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, marginBottom: 0 }}>
          Le contenu est pré-rempli avec de vraies données — modifiez avant de sauvegarder.
        </p>
      </div>

      {/* Formulaire */}
      <div style={{ ...s.card, borderColor: editId ? '#C75B00' : '#E2E8F0' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1C2B4A', marginBottom: 16 }}>
          {editId ? '✏️ Modifier le post' : '➕ Nouveau post'}
        </h2>

        <label style={s.label}>Message *</label>
        <textarea
          style={s.textarea}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Rédigez votre post ici (emojis, hashtags...)&#10;&#10;#Nopalou #Sénégal #Dakar #BonPlan"
        />

        <label style={s.label}>🖼 URL de l&apos;image (optionnel)</label>
        <input
          style={s.input}
          value={form.image_url}
          onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
          placeholder="https://res.cloudinary.com/... ou autre URL d'image publique"
        />
        {form.image_url && (
          <img src={form.image_url} alt="aperçu" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 12, objectFit: 'cover' }} />
        )}

        <label style={s.label}>🔗 Lien (optionnel — ignoré si image)</label>
        <input
          style={s.input}
          value={form.lien}
          onChange={e => setForm(f => ({ ...f, lien: e.target.value }))}
          placeholder="https://nopalou.com/produit/..."
        />

        <label style={s.label}>📅 Date de publication programmée (optionnel)</label>
        <input
          type="datetime-local"
          style={s.input}
          value={form.date_publication}
          onChange={e => setForm(f => ({ ...f, date_publication: e.target.value }))}
        />

        <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 10, cursor: form.image_url ? 'pointer' : 'not-allowed', marginBottom: 4, opacity: form.image_url ? 1 : 0.5 }}>
          <input
            type="checkbox"
            checked={form.publier_instagram}
            disabled={!form.image_url}
            onChange={e => setForm(f => ({ ...f, publier_instagram: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: '#E4405F' }}
          />
          <span style={{ fontSize: 13, color: '#1C2B4A', fontWeight: 600 }}>
            📸 Publier aussi sur Instagram <span style={{ color: '#94A3B8', fontWeight: 400 }}>(image requise)</span>
          </span>
        </label>
        {form.publier_instagram && !form.image_url && (
          <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠️ Ajoutez une URL d&apos;image pour publier sur Instagram</p>
        )}

        {err && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 8 }}>{err}</p>}
        {ok  && <p style={{ color: '#10B981', fontSize: 13, marginBottom: 8 }}>{ok}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...s.btn, background: '#C75B00', color: '#fff' }}
            onClick={submit}
            disabled={isPending || !form.message.trim()}
          >
            {isPending ? '...' : editId ? 'Enregistrer' : 'Créer le brouillon'}
          </button>
          {editId && (
            <button style={{ ...s.btn, background: '#F1F5F9', color: '#64748B' }} onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1C2B4A', margin: 0 }}>
          {showPublies ? `Tous les posts (${posts.length})` : `En cours (${posts.filter(p => p.statut !== 'publie').length})`}
        </h2>
        <button
          onClick={() => setShowPublies(v => !v)}
          style={{ fontSize: 12, padding: '5px 12px', background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}
        >
          {showPublies ? '🙈 Masquer les publiés' : `📂 Voir publiés (${posts.filter(p => p.statut === 'publie').length})`}
        </button>
      </div>

      {loading && <p style={{ color: '#94A3B8' }}>Chargement...</p>}

      {posts.filter(p => showPublies || p.statut !== 'publie').map(p => {
        const st = STATUT_LABEL[p.statut] || { label: p.statut, color: '#94A3B8' }
        return (
          <div key={p.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                  background: st.color + '20', color: st.color,
                }}>{st.label}</span>
                <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                  📘 FB
                </span>
                {p.publier_instagram && (
                  <span style={{ fontSize: 11, background: '#FDF2F8', color: '#9D174D', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    📸 IG
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {p.image_url && (
              <img src={p.image_url} alt="aperçu" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
            )}

            <pre style={{
              fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px', margin: '0 0 10px',
              fontFamily: 'system-ui, sans-serif', lineHeight: 1.6,
            }}>{p.message}</pre>

            {p.date_publication && (
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 6px' }}>
                📅 Programmé : {new Date(p.date_publication).toLocaleString('fr-FR')}
              </p>
            )}
            {p.date_publie && (
              <p style={{ fontSize: 12, color: '#10B981', margin: '0 0 6px' }}>
                ✅ Publié le {new Date(p.date_publie).toLocaleString('fr-FR')}
                {p.post_fb_id && <> · FB: {p.post_fb_id}</>}
                {p.post_ig_id && <> · IG: {p.post_ig_id}</>}
              </p>
            )}
            {p.erreur && (
              <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 6px' }}>❌ {p.erreur}</p>
            )}

            {p.statut !== 'publie' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 10 }}>
                {p.statut === 'brouillon' && (
                  <>
                    <button style={{ ...s.btn, background: '#EFF6FF', color: '#1D4ED8' }} onClick={() => startEdit(p)}>✏️ Modifier</button>
                    <button style={{ ...s.btn, background: '#FEF3C7', color: '#92400E' }} onClick={() => approuver(p.id)}>✅ Approuver</button>
                  </>
                )}
                {p.statut === 'approuve' && (
                  <>
                    <button style={{ ...s.btn, background: '#1877F2', color: '#fff' }} onClick={() => publierMaintenant(p.id)}>
                      📤 Publier maintenant
                    </button>
                    <button style={{ ...s.btn, background: '#F1F5F9', color: '#64748B' }} onClick={() => remettreEnBrouillon(p.id)}>↩️ Brouillon</button>
                  </>
                )}
                {p.statut === 'erreur' && (
                  <>
                    <button style={{ ...s.btn, background: '#1877F2', color: '#fff' }} onClick={() => publierMaintenant(p.id)}>🔄 Réessayer</button>
                    <button style={{ ...s.btn, background: '#F1F5F9', color: '#64748B' }} onClick={() => remettreEnBrouillon(p.id)}>↩️ Brouillon</button>
                  </>
                )}
                <button style={{ ...s.btn, background: '#FEF2F2', color: '#DC2626' }} onClick={() => supprimer(p.id)}>🗑 Supprimer</button>
              </div>
            )}
          </div>
        )
      })}

      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
          <p style={{ fontSize: 36 }}>📝</p>
          <p>Aucun post. Créez votre premier brouillon ci-dessus.</p>
        </div>
      )}
    </div>
  )
}
