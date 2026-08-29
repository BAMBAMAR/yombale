'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Store, Users, ShoppingBag, FileText, Package, X, Loader2, ArrowRight } from 'lucide-react'
import { fcfa } from '@/lib/format'

export default function AdminOmnisearch({ secret }: { secret: string }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Raccourci clavier Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Focus à l'ouverture
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQ('')
      setResults(null)
    }
  }, [open])

  // Requête debounce
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/omnisearch?q=${encodeURIComponent(q.trim())}`, {
          headers: { 'X-Admin-Secret': secret },
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        console.error('[OMNISEARCH_ERR]', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [q, secret])

  return (
    <>
      {/* Barre de déclenchement rapide dans le header admin */}
      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            maxWidth: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            color: '#64748b',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color="#94a3b8" />
            <span>Recherche globale (utilisateurs, boutiques, commandes...)...</span>
          </div>
          <kbd
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#475569',
            }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Modal Omnisearch */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '8vh',
            zIndex: 99999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 680,
              width: '94%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Input Search */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', gap: 12 }}>
              <Search size={20} color="#0284c7" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Tapez un nom, email, numéro, commande ou produit..."
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 16,
                  color: '#1e293b',
                  fontWeight: 500,
                }}
              />
              {loading ? (
                <Loader2 size={18} className="animate-spin text-slate-400" />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Résultats */}
            <div style={{ overflowY: 'auto', padding: '12px 18px', maxHeight: '60vh' }}>
              {!q.trim() && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  💡 Astuce : Recherchez un marchand par téléphone, une commande par sa référence Wave ou un produit par son nom.
                </div>
              )}

              {results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Boutiques */}
                  {results.results.boutiques.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Store size={14} color="#0284c7" /> Boutiques ({results.results.boutiques.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {results.results.boutiques.map((b: any) => (
                          <Link
                            key={b.id}
                            href={`/admin/boutiques?q=${encodeURIComponent(b.nom)}`}
                            onClick={() => setOpen(false)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#f8fafc',
                              textDecoration: 'none',
                              color: '#1e293b',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700 }}>{b.nom}</span>
                              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({b.telephone || b.ville})</span>
                            </div>
                            <ArrowRight size={14} color="#94a3b8" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Utilisateurs */}
                  {results.results.utilisateurs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={14} color="#16a34a" /> Utilisateurs ({results.results.utilisateurs.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {results.results.utilisateurs.map((u: any) => (
                          <Link
                            key={u.id}
                            href={`/admin/comptes?q=${encodeURIComponent(u.email || u.nom)}`}
                            onClick={() => setOpen(false)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#f8fafc',
                              textDecoration: 'none',
                              color: '#1e293b',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700 }}>{u.nom}</span>
                              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{u.email} ({u.telephone || 'Sans tel'})</span>
                            </div>
                            <ArrowRight size={14} color="#94a3b8" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Commandes */}
                  {results.results.commandes.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingBag size={14} color="#ea580c" /> Commandes ({results.results.commandes.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {results.results.commandes.map((c: any) => (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#f8fafc',
                              fontSize: 13,
                            }}
                          >
                            <div>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{c.reference}</span>
                              <span style={{ marginLeft: 8, fontWeight: 600 }}>{c.nom_produit}</span>
                              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>- {c.client_nom} ({c.client_telephone})</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#16a34a' }}>{fcfa(c.montant_total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Annonces */}
                  {results.results.annonces.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#9333ea" /> Annonces ({results.results.annonces.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {results.results.annonces.map((a: any) => (
                          <Link
                            key={a.id}
                            href={a.type_annonce === 'immo' ? `/admin/immo` : `/admin/annonces`}
                            onClick={() => setOpen(false)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#f8fafc',
                              textDecoration: 'none',
                              color: '#1e293b',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700 }}>{a.titre}</span>
                              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({a.ville}) - Tel: {a.contact_tel}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#0284c7', fontSize: 12 }}>{fcfa(a.prix || 0)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Produits Comparateur */}
                  {results.results.produits.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={14} color="#475569" /> Produits Scrapés ({results.results.produits.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {results.results.produits.map((p: any) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#f8fafc',
                              fontSize: 13,
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700 }}>{p.nom}</span>
                              {p.marque && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>({p.marque})</span>}
                            </div>
                            <span style={{ fontWeight: 800, color: '#16a34a' }}>{fcfa(p.prix_min || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.totalResults === 0 && (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      Aucun résultat correspondant à "{q}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
