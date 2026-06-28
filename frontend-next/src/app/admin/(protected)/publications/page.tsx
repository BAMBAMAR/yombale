'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getFbPosts, creerFbPost, modifierFbPost, supprimerFbPost,
  publierFbPostMaintenant, genererFbPost,
} from '@/app/actions/facebook-posts'

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

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon',  color: '#94A3B8' },
  approuve:  { label: 'Approuvé',   color: '#F59E0B' },
  publie:    { label: 'Publié',     color: '#10B981' },
  erreur:    { label: 'Erreur',     color: '#EF4444' },
}

export default function PublicationsPage() {
  const [posts, setPosts] = useState<FbPost[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    message: '', lien: '', image_url: '', publier_instagram: false, date_publication: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [ok, setOk]   = useState('')
  const [isPending, startTransition] = useTransition()

  async function load() {
    setLoading(true)
    try { setPosts(await getFbPosts()) } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setForm({ message: '', lien: '', image_url: '', publier_instagram: false, date_publication: '' })
    setEditId(null); setErr(''); setOk('')
  }

  function generer(type: string) {
    setErr(''); setOk('')
    startTransition(async () => {
      try {
        const data = await genererFbPost(type)
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
        if (editId) { await modifierFbPost(editId, body); setOk('Post mis à jour') }
        else { await creerFbPost(body); setOk('Brouillon créé') }
        resetForm(); load()
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function approuver(id: string) {
    startTransition(async () => {
      try {
        await modifierFbPost(id, { statut: 'approuve' })
        setOk('Post approuvé — sera publié à la date prévue'); load()
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function remettreEnBrouillon(id: string) {
    startTransition(async () => {
      try { await modifierFbPost(id, { statut: 'brouillon' }); load() }
      catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function publierMaintenant(id: string) {
    if (!confirm('Publier immédiatement sur Facebook (et Instagram si activé) ?')) return
    startTransition(async () => {
      try {
        const res = await publierFbPostMaintenant(id)
        setOk(`Publié ! FB: ${res.fb_id || '—'} ${res.ig_id ? '· IG: ' + res.ig_id : ''}`); load()
      } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Erreur') }
    })
  }

  function supprimer(id: string) {
    if (!confirm('Supprimer ce post ?')) return
    startTransition(async () => {
      try { await supprimerFbPost(id); load() }
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
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 28 }}>
        Rédigez des posts, ajoutez une image, approuvez puis publiez manuellement ou à une date programmée.
      </p>

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

        <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={form.publier_instagram}
            onChange={e => setForm(f => ({ ...f, publier_instagram: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: '#E4405F' }}
          />
          <span style={{ fontSize: 13, color: '#1C2B4A', fontWeight: 600 }}>
            📸 Publier aussi sur Instagram <span style={{ color: '#94A3B8', fontWeight: 400 }}>(image requise)</span>
          </span>
        </label>

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
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1C2B4A', marginBottom: 12 }}>
        Tous les posts ({posts.length})
      </h2>

      {loading && <p style={{ color: '#94A3B8' }}>Chargement...</p>}

      {posts.map(p => {
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

            {/* Aperçu image */}
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
