export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FileText, ArrowLeft, Calendar, Eye, Tag, ChevronRight } from 'lucide-react'

interface Article {
  id: string
  titre: string
  slug: string
  extrait: string | null
  image_url: string | null
  tags: string[]
  vues_count: number
  created_at: string
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
  try {
    const res = await fetch(`${backendUrl}/api/boutiques/${id}/articles`, { cache: 'no-store' })
    const data = await res.json()
    const bNom = data.boutique?.nom || 'Boutique'
    return {
      title: `Blog & Conseils — ${bNom} | Nopalou`,
      description: `Découvrez tous les articles, astuces et guides d'achat de la boutique ${bNom}.`
    }
  } catch {
    return { title: 'Blog Boutique — Nopalou' }
  }
}

export default async function BoutiqueBlogPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tag?: string }>
}) {
  const { id } = await params
  const { tag } = await searchParams
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  let boutique: any = null
  let articles: Article[] = []

  try {
    const url = tag
      ? `${backendUrl}/api/boutiques/${id}/articles?tag=${encodeURIComponent(tag)}`
      : `${backendUrl}/api/boutiques/${id}/articles`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok || !data.boutique) {
      notFound()
    }
    boutique = data.boutique
    articles = data.articles || []
  } catch {
    notFound()
  }

  const bNom = boutique.nom || 'Boutique'
  const bSlug = boutique.slug || boutique.id

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        
        {/* Navigation retour */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href={`/boutiques/${bSlug}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', background: '#ffffff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
          >
            <ArrowLeft size={14} />
            Retour à la boutique {bNom}
          </Link>
        </div>

        {/* En-tête Blog */}
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px 28px', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {boutique.logo && (
              <img src={boutique.logo} alt={bNom} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1C2B4A' }}>
                Le Blog de {bNom}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Guides, astuces pratiques et actualités de notre sélection.
              </p>
            </div>
          </div>

          {tag && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Filtre actif :</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Tag size={12} /> #{tag}
              </span>
              <Link href={`/boutiques/${bSlug}/blog`} style={{ fontSize: 12, color: '#dc2626', textDecoration: 'underline' }}>
                Effacer
              </Link>
            </div>
          )}
        </div>

        {/* Liste des articles */}
        {articles.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1', padding: 40, textAlign: 'center' }}>
            <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1C2B4A' }}>
              Aucun article trouvé
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Revenez très bientôt pour découvrir nos prochains guides et conseils !
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {articles.map(art => (
              <Link
                key={art.id}
                href={`/boutiques/${bSlug}/blog/${art.slug}`}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {art.image_url ? (
                  <div style={{ height: 160, background: '#f1f5f9', overflow: 'hidden' }}>
                    <img src={art.image_url} alt={art.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: 100, background: 'linear-gradient(135deg, #1C2B4A 0%, #2A4365 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={28} color="#ffffff" opacity={0.6} />
                  </div>
                )}

                <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94a3b8', marginBottom: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {new Date(art.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> {art.vues_count}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px', lineHeight: 1.35 }}>
                    {art.titre}
                  </h2>

                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', flex: 1, lineHeight: 1.5 }}>
                    {art.extrait}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 'auto' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#C75B00', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Lire l&apos;article <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
