export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Eye, Tag, Share2, MessageCircle, Store } from 'lucide-react'

interface Article {
  id: string
  titre: string
  slug: string
  contenu: string
  extrait: string | null
  image_url: string | null
  tags: string[]
  vues_count: number
  created_at: string
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; slug: string }>
}): Promise<Metadata> {
  const { id, slug } = await params
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  try {
    const res = await fetch(`${backendUrl}/api/boutiques/${id}/articles/detail/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok || !data.article) {
      return { title: 'Article — Nopalou' }
    }
    const art = data.article
    const bNom = data.boutique?.nom || 'Boutique'
    return {
      title: `${art.titre} — ${bNom} | Nopalou`,
      description: art.extrait || art.contenu.slice(0, 160),
      openGraph: {
        title: art.titre,
        description: art.extrait || art.contenu.slice(0, 160),
        images: art.image_url ? [{ url: art.image_url }] : []
      }
    }
  } catch {
    return { title: 'Article Blog — Nopalou' }
  }
}

export default async function BoutiqueArticleDetailPage({
  params
}: {
  params: Promise<{ id: string; slug: string }>
}) {
  const { id, slug } = await params
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  let boutique: any = null
  let article: Article | null = null

  try {
    const res = await fetch(`${backendUrl}/api/boutiques/${id}/articles/detail/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok || !data.article) {
      notFound()
    }
    boutique = data.boutique
    article = data.article
  } catch {
    notFound()
  }

  if (!article || !boutique) notFound()

  const bNom = boutique.nom || 'Boutique'
  const bSlug = boutique.slug || boutique.id
  const articleUrl = `https://nopalou.com/boutiques/${bSlug}/blog/${article.slug}`

  // Schema.org Article JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.titre,
    description: article.extrait,
    image: article.image_url || undefined,
    datePublished: article.created_at,
    author: {
      '@type': 'Organization',
      name: bNom
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nopalou',
      url: 'https://nopalou.com'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Balisage JSON-LD pour Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Navigation retour & Fil d'Ariane */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13 }}>
          <Link
            href={`/boutiques/${bSlug}/blog`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', background: '#ffffff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
          >
            <ArrowLeft size={14} />
            Tous les articles
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <Link href={`/boutiques/${bSlug}`} style={{ color: '#64748b', textDecoration: 'none' }}>
            {bNom}
          </Link>
        </div>

        {/* Cadre de l'article */}
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '32px 28px' }}>
          
          {/* Métadonnées & Auteur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            {boutique.logo ? (
              <img src={boutique.logo} alt={bNom} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={20} color="#1C2B4A" />
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A' }}>{bNom}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 12, marginTop: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> {new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={12} /> {article.vues_count} lectures
                </span>
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px', lineHeight: 1.3 }}>
            {article.titre}
          </h1>

          {/* Image de couverture */}
          {article.image_url && (
            <div style={{ margin: '0 0 24px', borderRadius: 12, overflow: 'hidden', maxHeight: 380 }}>
              <img src={article.image_url} alt={article.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Corps de texte de l'article */}
          <div style={{ fontSize: 15.5, lineHeight: 1.75, color: '#334155', whiteSpace: 'pre-line', marginBottom: 28 }}>
            {article.contenu}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              {article.tags.map(t => (
                <Link
                  key={t}
                  href={`/boutiques/${bSlug}/blog?tag=${encodeURIComponent(t)}`}
                  style={{ fontSize: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1C2B4A', fontWeight: 600, padding: '3px 10px', borderRadius: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Tag size={11} /> #{t}
                </Link>
              ))}
            </div>
          )}

          {/* Boutons de Partage WhatsApp & Social */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Share2 size={16} color="#C75B00" />
              Partager cet article
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${article.titre}\n\nÀ lire sur le blog de ${bNom} :\n${articleUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#25D366',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>

              <Link
                href={`/boutiques/${bSlug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#1C2B4A',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <Store size={14} /> Visiter la boutique
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
