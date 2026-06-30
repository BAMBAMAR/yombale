'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition, Suspense } from 'react'
import Link from 'next/link'

function fcfa(n: number | null) {
  if (!n) return null
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

interface SearchData {
  q: string
  total: number
  produits: { id: string; nom: string; marque: string | null; prix: number | null; image: string | null; marchand: string | null }[]
  boutiques: { type: string; id: string; nom: string; description: string | null; categorie: string | null; ville: string | null; image: string | null; slug: string | null; prix: number | null }[]
  annonces: { id: string; nom: string; description: string | null; prix: number | null; ville: string | null; image: string | null; categorie: string | null }[]
  immo: { id: string; nom: string; prix: number | null; ville: string | null; quartier: string | null; image: string | null; type_bien: string | null; transaction: string | null; surface: number | null }[]
}

// Carte générique résultat
function ResultCard({ href, image, titre, sub1, sub2, badge }: {
  href: string; image: string | null
  titre: string; sub1?: string | null; sub2?: string | null; badge?: string | null
}) {
  return (
    <Link href={href} style={{
      display: 'flex', gap: 12, padding: '12px 14px',
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
      textDecoration: 'none', color: 'inherit', transition: 'border-color .15s',
    }}>
      <div style={{
        width: 60, height: 60, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
        background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 24, color: '#d1d5db' }}>📦</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{titre}</p>
        {sub1 && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{sub1}</p>}
        {sub2 && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#C75B00', fontWeight: 700 }}>{sub2}</p>}
        {badge && (
          <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, padding: '1px 7px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
            {badge}
          </span>
        )}
      </div>
      <span style={{ alignSelf: 'center', color: '#9ca3af', fontSize: 18 }}>›</span>
    </Link>
  )
}

function EmptyState({ q }: { q: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucun résultat pour « {q} »</p>
      <p style={{ fontSize: 13 }}>Vérifiez l&apos;orthographe ou essayez un terme plus général.</p>
    </div>
  )
}

type Tab = 'tout' | 'produits' | 'boutiques' | 'annonces' | 'immo'

function RechercheClientInner({ query, data }: { query: string; data: SearchData | null }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('tout')
  const [inputVal, setInputVal] = useState(query)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = inputVal.trim()
    if (q) startTransition(() => router.push(`/recherche?q=${encodeURIComponent(q)}`))
  }

  const counts = data ? {
    tout: data.total,
    produits: data.produits.length,
    boutiques: data.boutiques.length,
    annonces: data.annonces.length,
    immo: data.immo.length,
  } : null

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'tout', label: 'Tout', emoji: '🔍' },
    { key: 'produits', label: 'Produits', emoji: '🛒' },
    { key: 'boutiques', label: 'Boutiques', emoji: '🏪' },
    { key: 'annonces', label: 'Annonces', emoji: '📌' },
    { key: 'immo', label: 'Immobilier', emoji: '🏠' },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          ref={inputRef}
          type="search"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Rechercher produits, boutiques, annonces, immo…"
          style={{
            flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10,
            fontSize: 15, outline: 'none', background: '#fff',
          }}
          autoFocus={!query}
        />
        <button type="submit" style={{
          padding: '0 20px', background: '#C75B00', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Rechercher
        </button>
      </form>

      {!query && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15 }}>Tapez un mot-clé pour chercher partout sur Nopalou.</p>
        </div>
      )}

      {query && !data && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#dc2626' }}>
          <p>Erreur de connexion au serveur. Réessayez.</p>
        </div>
      )}

      {query && data && (
        <>
          {/* En-tête résultats */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, margin: '0 0 4px' }}>
              Résultats pour <em style={{ fontStyle: 'normal', color: '#C75B00' }}>« {data.q} »</em>
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              {data.total} résultat{data.total > 1 ? 's' : ''} dans toutes les catégories
            </p>
          </div>

          {data.total === 0 ? (
            <EmptyState q={data.q} />
          ) : (
            <>
              {/* Onglets */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
                {tabs.map(t => {
                  const count = counts![t.key]
                  if (t.key !== 'tout' && count === 0) return null
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                      padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                      color: tab === t.key ? '#C75B00' : '#6b7280',
                      borderBottom: tab === t.key ? '2px solid #C75B00' : '2px solid transparent',
                      marginBottom: -2,
                    }}>
                      {t.emoji} {t.label}
                      {count != null && count > 0 && (
                        <span style={{ marginLeft: 5, fontSize: 11, background: tab === t.key ? '#fff3e0' : '#f1f5f9', color: tab === t.key ? '#C75B00' : '#6b7280', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Produits marketplace */}
              {(tab === 'tout' || tab === 'produits') && data.produits.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                  {tab === 'tout' && <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.04em' }}>🛒 Produits marketplace</h2>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.produits.map(p => (
                      <ResultCard
                        key={p.id}
                        href={`/produit/${p.id}`}
                        image={p.image}
                        titre={p.nom}
                        sub1={[p.marque, p.marchand].filter(Boolean).join(' · ')}
                        sub2={p.prix ? `à partir de ${fcfa(p.prix)}` : undefined}
                      />
                    ))}
                  </div>
                  {tab === 'tout' && data.produits.length >= 10 && (
                    <Link href={`/?q=${encodeURIComponent(data.q)}`} style={{ display: 'block', textAlign: 'right', fontSize: 13, color: '#1d4ed8', marginTop: 8 }}>
                      Voir tous les produits →
                    </Link>
                  )}
                </section>
              )}

              {/* Boutiques & produits boutique */}
              {(tab === 'tout' || tab === 'boutiques') && data.boutiques.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                  {tab === 'tout' && <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.04em' }}>🏪 Boutiques</h2>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.boutiques.map(b => (
                      <ResultCard
                        key={`${b.type}-${b.id}`}
                        href={b.type === 'boutique' ? `/boutiques/${b.slug || b.id}` : `/boutiques/${b.slug}`}
                        image={b.image}
                        titre={b.nom}
                        sub1={[b.categorie, b.ville].filter(Boolean).join(' · ')}
                        sub2={b.prix ? fcfa(b.prix) : undefined}
                        badge={b.type === 'boutique' ? 'Boutique' : 'Produit boutique'}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Annonces classées */}
              {(tab === 'tout' || tab === 'annonces') && data.annonces.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                  {tab === 'tout' && <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.04em' }}>📌 Annonces</h2>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.annonces.map(a => (
                      <ResultCard
                        key={a.id}
                        href={`/annonces/${a.id}`}
                        image={a.image}
                        titre={a.nom}
                        sub1={[a.categorie, a.ville].filter(Boolean).join(' · ')}
                        sub2={a.prix ? fcfa(a.prix) : undefined}
                      />
                    ))}
                  </div>
                  {tab === 'tout' && data.annonces.length >= 10 && (
                    <Link href={`/annonces?q=${encodeURIComponent(data.q)}`} style={{ display: 'block', textAlign: 'right', fontSize: 13, color: '#1d4ed8', marginTop: 8 }}>
                      Voir toutes les annonces →
                    </Link>
                  )}
                </section>
              )}

              {/* Immobilier */}
              {(tab === 'tout' || tab === 'immo') && data.immo.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                  {tab === 'tout' && <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.04em' }}>🏠 Immobilier</h2>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.immo.map(i => (
                      <ResultCard
                        key={i.id}
                        href={`/immo/${i.id}`}
                        image={i.image}
                        titre={i.nom}
                        sub1={[i.type_bien, i.transaction, i.surface ? `${i.surface} m²` : null, i.quartier, i.ville].filter(Boolean).join(' · ')}
                        sub2={i.prix ? fcfa(i.prix) : 'Prix non renseigné'}
                      />
                    ))}
                  </div>
                  {tab === 'tout' && data.immo.length >= 10 && (
                    <Link href={`/immo?q=${encodeURIComponent(data.q)}`} style={{ display: 'block', textAlign: 'right', fontSize: 13, color: '#1d4ed8', marginTop: 8 }}>
                      Voir toutes les annonces immo →
                    </Link>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function RechercheClient({ query, data }: { query: string; data: SearchData | null }) {
  return (
    <Suspense>
      <RechercheClientInner query={query} data={data} />
    </Suspense>
  )
}
