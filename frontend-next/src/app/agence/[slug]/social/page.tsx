'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ExternalLink,
  Layers,
  Download,
  Share2,
  Sparkles,
  CheckCircle2,
  Video,
  Check,
  Globe
} from 'lucide-react'
import { showToast } from '@/context/ToastContext'
import {
  BienItem,
  SocialAccountProfile,
  SocialAccountsConfig,
  SocialMainTab,
  SocialPostItem,
} from './types'
import { SocialAccountsTab } from './components/SocialAccountsTab'
import { SocialImportTab } from './components/SocialImportTab'
import { SocialPostsFeedTab } from './components/SocialPostsFeedTab'
import { SocialMarketingGeneratorTab } from './components/SocialMarketingGeneratorTab'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface AgenceItem {
  id: string
  nom: string
  slug: string
  telephone?: string
  whatsapp?: string
  site_web?: string
  ville: string
  parametres?: {
    reseaux_sociaux?: SocialAccountsConfig
    social_posts?: SocialPostItem[]
    vitrine_active?: boolean
  }
}

export default function AgencySocialShopManagerPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [activeTab, setActiveTab] = useState<SocialMainTab>('posts')
  const [agence, setAgence] = useState<AgenceItem | null>(null)
  const [biens, setBiens] = useState<BienItem[]>([])
  const [posts, setPosts] = useState<SocialPostItem[]>([])
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountsConfig>({
    instagram: '',
    tiktok: '',
    facebook: '',
    whatsapp: '',
    linkedin: '',
    youtube: '',
    twitter: '',
    site_web: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function getAuthToken(): string {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('token') || localStorage.getItem('nopalou_token') || sessionStorage.getItem('token') || ''
  }

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resAgence, resBiens] = await Promise.all([
        fetch(`/api/agences/${slug}`, { headers: getImmoAuthHeaders() }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers: getImmoAuthHeaders() }),
      ])
      const dataAgence = await resAgence.json()
      const dataBiens = await resBiens.json()

      if (dataAgence.success && dataAgence.agence) {
        const ag = dataAgence.agence
        setAgence(ag)

        const reseaux = ag.parametres?.reseaux_sociaux || {}
        setSocialAccounts({
          instagram: reseaux.instagram || '',
          tiktok: reseaux.tiktok || '',
          facebook: reseaux.facebook || '',
          whatsapp: reseaux.whatsapp || ag.whatsapp || '',
          linkedin: reseaux.linkedin || '',
          youtube: reseaux.youtube || '',
          twitter: reseaux.twitter || '',
          site_web: reseaux.site_web || ag.site_web || '',
        })

        if (ag.parametres?.social_posts && Array.isArray(ag.parametres.social_posts)) {
          setPosts(ag.parametres.social_posts)
        }
      }

      if (dataBiens.success && dataBiens.biens) {
        setBiens(dataBiens.biens)
      }
    } catch (err) {
      console.error('[LOAD_SOCIAL_SHOP_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function persistData(updatedPosts?: SocialPostItem[], updatedAccounts?: SocialAccountsConfig) {
    try {
      setSaving(true)
      const resGet = await fetch(`/api/agences/${slug}`, {
        headers: getImmoAuthHeaders(),
      })
      const dataGet = await resGet.json()
      const currentParametres = dataGet.agence?.parametres || {}

      const nextAccounts = updatedAccounts || socialAccounts
      const nextPosts = updatedPosts !== undefined ? updatedPosts : posts

      const res = await fetch(`/api/agences/${slug}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          whatsapp: nextAccounts.whatsapp,
          site_web: nextAccounts.site_web,
          parametres: {
            ...currentParametres,
            reseaux_sociaux: nextAccounts,
            social_posts: nextPosts,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        showToast('Modifications enregistrées avec succès !', 'success', 'Social Shop')
        setToastMsg('Modifications enregistrées avec succès !')
        setTimeout(() => setToastMsg(null), 3500)
      } else {
        showToast(data.error || 'Erreur lors de l\'enregistrement', 'error', 'Social Shop')
      }
    } catch (err) {
      console.error('[SAVE_SOCIAL_SHOP_ERR]', err)
      showToast('Erreur réseau lors de l\'enregistrement', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleImportPosts(newPosts: SocialPostItem[]) {
    const updated = [...newPosts, ...posts]
    setPosts(updated)
    persistData(updated)
    setActiveTab('posts')
  }

  function handleUpdatePost(updatedPost: SocialPostItem) {
    const updated = posts.map(p => (p.id === updatedPost.id ? updatedPost : p))
    setPosts(updated)
    persistData(updated)
  }

  function handleDeletePost(postId: string) {
    if (!confirm('Supprimer cette publication vidéo de votre Social Shop ?')) return
    const updated = posts.filter(p => p.id !== postId)
    setPosts(updated)
    persistData(updated)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
        <p>Chargement du Social Shop de l'agence...</p>
      </div>
    )
  }

  const nbReseauxConfigures = Object.values(socialAccounts).filter(v => !!v?.trim()).length
  const nbPostsLinked = posts.filter(p => p.biens_associes && p.biens_associes.length > 0).length

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── En-tête Principal ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Social Shop & Réseaux Sociaux</h1>
          <p className="agence-subtitle">
            Transformez vos comptes Instagram, TikTok et Facebook en catalogue interactif de visites immobilières.
          </p>
        </div>

        <Link
          href={`/agence/${slug}/vitrine`}
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={15} />
          Voir la Vitrine Interactive
        </Link>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          {toastMsg}
        </div>
      )}

      {/* ── Carte KPI Vue d'ensemble ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Comptes Connectés</span>
            <div className="kpi-card-icon">
              <Globe size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{nbReseauxConfigures} / 8</div>
          <div className="kpi-card-sub">Instagram, TikTok, FB, WhatsApp...</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Vidéos & Reels</span>
            <div className="kpi-card-icon" style={{ color: 'var(--accent, #C75B00)' }}>
              <Video size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{posts.length}</div>
          <div className="kpi-card-sub">Visites virtuelles importées</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Biens Taggués</span>
            <div className="kpi-card-icon" style={{ color: '#166534' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{nbPostsLinked}</div>
          <div className="kpi-card-sub">Vidéos reliées à un bien actif</div>
        </div>
      </div>

      {/* ── Navigation par Onglets (Identique Boutique Social Commerce) ── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border, #E8DDD2)',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'posts' as const, label: `Publications & Reels (${posts.length})`, icon: Layers },
          { key: 'import' as const, label: 'Importer des Vidéos', icon: Download },
          { key: 'accounts' as const, label: `Comptes Officiels (${nbReseauxConfigures}/8)`, icon: Share2 },
          { key: 'generator' as const, label: 'Générateur Marketing', icon: Sparkles },
        ].map(t => {
          const Icon = t.icon
          const active = activeTab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
                color: active ? 'var(--accent, #C75B00)' : '#64748B',
                fontWeight: active ? 800 : 600,
                fontSize: 13.5,
                cursor: 'pointer',
                marginBottom: -2,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Contenu de l'Onglet Actif ── */}
      {activeTab === 'posts' && (
        <SocialPostsFeedTab
          posts={posts}
          biens={biens}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />
      )}

      {activeTab === 'import' && (
        <SocialImportTab
          biens={biens}
          onImportPosts={handleImportPosts}
        />
      )}

      {activeTab === 'accounts' && (
        <SocialAccountsTab
          accounts={socialAccounts}
          setAccounts={setSocialAccounts}
          onSave={() => persistData(undefined, socialAccounts)}
          saving={saving}
          onExploreAccount={() => setActiveTab('import')}
        />
      )}

      {activeTab === 'generator' && (
        <SocialMarketingGeneratorTab
          biens={biens}
          agenceNom={agence?.nom || 'Nopalou Immo'}
          agenceSlug={slug}
          socialAccounts={socialAccounts}
          telephoneContact={agence?.telephone || agence?.whatsapp || '+221 77 000 00 00'}
        />
      )}
    </div>
  )
}
