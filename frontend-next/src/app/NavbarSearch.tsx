'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'

interface ProduitResult {
  id: string
  nom: string
  prix: number | null
  images: string[]
  boutique_id: string
  boutique_nom: string
  boutique_slug: string
}

interface BoutiqueResult {
  id: string
  nom: string
  logo_url: string | null
  ville: string
  slug: string
}

export default function NavbarSearch({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(alwaysOpen)

  if (pathname === '/') {
    return null
  }
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ produits: ProduitResult[]; boutiques: BoutiqueResult[] }>({ produits: [], boutiques: [] })
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    if (alwaysOpen) {
      setOpen(true)
    }
  }, [alwaysOpen])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ produits: [], boutiques: [] })
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      fetch(`${backendUrl}/api/produits/instantanee?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setResults({ produits: data.produits || [], boutiques: data.boutiques || [] })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 200)

    return () => clearTimeout(timer)
  }, [query, backendUrl])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim() || inputRef.current?.value.trim()
    if (q) {
      startTransition(() => router.push(`/recherche?q=${encodeURIComponent(q)}`))
      if (!alwaysOpen) {
        setOpen(false)
      }
      setQuery('')
    }
  }

  const hasResults = results.produits.length > 0 || results.boutiques.length > 0

  return (
    <div style={{ position: 'relative', width: alwaysOpen ? '100%' : 'auto' }}>
      <form
        className={`navbar-search${(open || alwaysOpen) ? ' navbar-search--open' : ''}`}
        onSubmit={handleSubmit}
        role="search"
        style={alwaysOpen ? { width: '100%', display: 'flex', background: 'var(--bg)', borderRadius: '10px', border: '1.5px solid var(--border)', padding: '2px 6px' } : undefined}
      >
        {(open || alwaysOpen) && (
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher des produits, boutiques, immobilier..."
            className="navbar-search-input"
            autoFocus={alwaysOpen ? false : true}
            aria-label="Recherche globale Nopalou"
            style={alwaysOpen ? { border: 'none', background: 'transparent', flex: 1, padding: '6px 8px', fontSize: '13px', width: '100%' } : undefined}
          />
        )}
        <button
          type={(open || alwaysOpen) ? 'submit' : 'button'}
          className="navbar-search-btn"
          aria-label={(open || alwaysOpen) ? 'Lancer la recherche' : 'Ouvrir la recherche'}
          onMouseDown={e => { if ((open || alwaysOpen) && !query) e.preventDefault() }}
          onClick={() => !alwaysOpen && !open && setOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </form>

      {/* Menu déroulant de résultats Typeahead */}
      {open && query.length >= 2 && (
        <div
          style={{
            position: 'absolute', top: '100%', right: 0, left: alwaysOpen ? 0 : 'auto', width: alwaysOpen ? '100%' : 340, background: '#fff',
            borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.18)', border: '1px solid #e5e7eb',
            marginTop: 8, zIndex: 1100, overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: 16, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
              Recherche instantanée…
            </div>
          ) : !hasResults ? (
            <div style={{ padding: 16, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
              Aucun résultat direct pour &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Boutiques trouvées */}
              {results.boutiques.length > 0 && (
                <div style={{ padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Boutiques</span>
                  {results.boutiques.map(b => (
                    <Link
                      key={b.id}
                      href={`/boutiques/${b.slug || b.id}`}
                      onClick={() => { setOpen(false); setQuery('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                        textDecoration: 'none', color: '#111827',
                      }}
                    >
                      {b.logo_url ? (
                        <img src={b.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 18 }}>🏪</span>
                      )}
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{b.nom}</p>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>📍 {b.ville}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Produits trouvés */}
              {results.produits.length > 0 && (
                <div style={{ padding: '8px 12px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Produits</span>
                  {results.produits.map(p => (
                    <Link
                      key={p.id}
                      href={`/boutiques/${p.boutique_slug || p.boutique_id}/produits/${p.id}`}
                      onClick={() => { setOpen(false); setQuery('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                        textDecoration: 'none', color: '#111827', borderBottom: '1px solid #f8fafc',
                      }}
                    >
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#f8fafc' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</p>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{p.boutique_nom}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00' }}>{fcfa(p.prix)}</span>
                    </Link>
                  ))}
                </div>
              )}

              <button
                onClick={handleSubmit}
                style={{
                  padding: 10, background: '#f8fafc', border: 'none', borderTop: '1px solid #e5e7eb',
                  color: '#C75B00', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center',
                }}
              >
                Voir tous les résultats pour &ldquo;{query}&rdquo; →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

