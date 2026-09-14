'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Trash2, Edit3, Eye, ExternalLink, Check, X, Search } from 'lucide-react'

interface Article {
  id: string
  titre: string
  slug: string
  contenu: string
  extrait: string | null
  image_url: string | null
  est_publie: boolean
  tags: string[]
  vues_count: number
  created_at: string
}

interface BlogArticlesManagerProps {
  boutiqueId: string
  boutiqueSlug?: string
  token: string
}

export default function BlogArticlesManager({ boutiqueId, boutiqueSlug, token }: BlogArticlesManagerProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)

  // Form states
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [extrait, setExtrait] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [estPublie, setEstPublie] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/articles?tous=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.articles) {
        setArticles(data.articles)
      }
    } catch (err) {
      console.warn('[BLOG ARTICLES FETCH ERR]', err)
    } finally {
      setLoading(false)
    }
  }, [backendUrl, boutiqueId, token])

  useEffect(() => {
    if (boutiqueId && token) {
      fetchArticles()
    }
  }, [boutiqueId, token, fetchArticles])

  const openCreateModal = () => {
    setEditingArticle(null)
    setTitre('')
    setContenu('')
    setExtrait('')
    setImageUrl('')
    setTagsInput('')
    setEstPublie(true)
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const openEditModal = (art: Article) => {
    setEditingArticle(art)
    setTitre(art.titre)
    setContenu(art.contenu)
    setExtrait(art.extrait || '')
    setImageUrl(art.image_url || '')
    setTagsInput((art.tags || []).join(', '))
    setEstPublie(art.est_publie)
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim() || !contenu.trim()) {
      setErrorMsg('Le titre et le contenu sont obligatoires')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const payload = {
      titre: titre.trim(),
      contenu: contenu.trim(),
      extrait: extrait.trim() || null,
      image_url: imageUrl.trim() || null,
      est_publie: estPublie,
      tags: tagsArray
    }

    try {
      const url = editingArticle
        ? `${backendUrl}/api/boutiques/${boutiqueId}/articles/${editingArticle.id}`
        : `${backendUrl}/api/boutiques/${boutiqueId}/articles`
      const method = editingArticle ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setIsModalOpen(false)
        fetchArticles()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      console.warn('[BLOG SAVE ERR]', err)
      setErrorMsg('Erreur de communication avec le serveur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (artId: string) => {
    if (!confirm('Supprimer définitivement cet article ?')) return

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/articles/${artId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== artId))
      }
    } catch (err) {
      console.warn('[BLOG DELETE ERR]', err)
    }
  }

  const filteredArticles = articles.filter(a =>
    a.titre.toLowerCase().includes(search.toLowerCase()) ||
    (a.extrait && a.extrait.toLowerCase().includes(search.toLowerCase()))
  )

  const publicBoutiqueSlug = boutiqueSlug || boutiqueId

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} color="#C75B00" />
            Blog & Articles SEO Marchand
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Rédigez des guides et conseils pour attirer du trafic naturel depuis Google Sénégal vers vos produits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`/boutiques/${publicBoutiqueSlug}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={15} />
            Voir le blog public
          </a>

          <button
            type="button"
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#C75B00',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(199, 91, 0, 0.25)'
            }}
          >
            <Plus size={16} />
            Nouvel Article
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Rechercher parmi les articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px 9px 36px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            outline: 'none',
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Liste des articles */}
      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Chargement des articles...</div>
      ) : filteredArticles.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 36, textAlign: 'center' }}>
          <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
          <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Aucun article publié pour le moment</p>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: '#64748b' }}>
            Partagez vos astuces, conseils d&apos;utilisation ou nouveautés pour booster votre référencement.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#1C2B4A',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Rédiger mon premier article
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredArticles.map(art => (
            <div
              key={art.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {art.image_url && (
                <div style={{ height: 140, background: '#f1f5f9', overflow: 'hidden' }}>
                  <img src={art.image_url} alt={art.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: art.est_publie ? '#dcfce7' : '#f1f5f9',
                      color: art.est_publie ? '#166534' : '#64748b'
                    }}
                  >
                    {art.est_publie ? 'Publié' : 'Brouillon'}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> {art.vues_count} vues
                  </span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px', lineHeight: 1.3 }}>
                  {art.titre}
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', flex: 1, lineHeight: 1.4 }}>
                  {art.extrait || art.contenu.slice(0, 100) + '...'}
                </p>

                {art.tags && art.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {art.tags.map(t => (
                      <span key={t} style={{ fontSize: 10.5, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: 6 }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto' }}>
                  <a
                    href={`/boutiques/${publicBoutiqueSlug}/blog/${art.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: '#C75B00', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <ExternalLink size={12} /> Lire
                  </a>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(art)}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}
                    >
                      <Edit3 size={12} /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(art.id)}
                      style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création / Édition */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1C2B4A' }}>
                {editingArticle ? 'Modifier l\'Article' : 'Rédiger un Nouvel Article'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Titre de l&apos;article *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5 astuces pour bien entretenir ses tissus Bazin"
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Image de couverture (URL optionnelle)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Extrait SEO / Résumé (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Bref résumé qui apparaîtra dans les résultats de recherche Google..."
                  value={extrait}
                  onChange={e => setExtrait(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Contenu de l&apos;article *
                </label>
                <textarea
                  rows={8}
                  placeholder="Rédigez votre guide, vos conseils pratiques ou l'actualité de votre boutique..."
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Mots-clés / Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  placeholder="Ex: mode, conseils, tissu, dakar"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="publieCheck"
                  checked={estPublie}
                  onChange={e => setEstPublie(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="publieCheck" style={{ fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Publier immédiatement cet article sur le blog public
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#C75B00', color: '#ffffff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer l\'article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
