'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa, lienBoutiqueWhatsapp } from '@/lib/format'
import CommanderModal from './CommanderModal'
import AvisClients from '@/components/AvisClients'
import DrawerCart from '@/components/DrawerCart'
import CrossSelling from '@/components/CrossSelling'
import { useCart } from '@/context/CartContext'
import CardActions from '@/app/CardActions'
import { 
  ShoppingCart, Star, Share2, Tag, Info, Phone, MessageCircle, HelpCircle, Clock, 
  MapPin, Globe, Sparkles, Search, X, Filter, Grid, List, 
  Eye, Check, ArrowUpDown, ChevronRight
} from 'lucide-react'

export interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
}

export interface Annonce {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  categorie_slug: string
  photos: string[]
}

const CAT_ICONS: Record<string, string> = {
  smartphones: '📱', informatique: '💻', 'tv-electro': '📺',
  mode: '👗', maison: '🏠', 'auto-moto': '🚗', jeux: '🎮',
  services: '🛠', alimentation: '🥗', beaute: '💄', autre: '🏪',
}

function ProduitCard({
  p,
  boutiqueId,
  boutiqueNom,
  whatsapp,
  viewMode = 'grid',
  onQuickView,
}: {
  p: Produit
  boutiqueId: string
  boutiqueNom: string
  whatsapp?: string | null
  viewMode?: 'grid' | 'list'
  onQuickView: (p: Produit) => void
}) {
  const { addToCart } = useCart()
  const [addedCart, setAddedCart] = useState(false)
  const img = p.images?.[0] ?? null
  const remise = p.prix && p.prix_barre && p.prix_barre > p.prix
    ? Math.round((1 - p.prix / p.prix_barre) * 100) : null

  if (viewMode === 'list') {
    return (
      <div className="card-premium" style={{ display: 'flex', gap: 16, padding: 14, alignItems: 'center' }}>
        <div style={{ width: 110, height: 110, borderRadius: 10, flexShrink: 0, position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cloudinaryHQ(img, { width: 300 })} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
              <ShoppingCart size={28} style={{ color: 'var(--text3)' }} />
            </div>
          )}
          {remise && (
            <span style={{ position: 'absolute', top: 6, left: 6, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 12 }}>
              -{remise}%
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{p.nom}</h4>
            {p.caracteristiques?.marque && (
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>{p.caracteristiques.marque}</span>
            )}
            {p.description && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {p.description}
              </p>
            )}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            {p.prix && <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--accent)' }}>{fcfa(p.prix)}</span>}
            {p.prix_barre && <span style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onQuickView(p)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Eye size={14} /> Aperçu
          </button>
          <button
            onClick={() => {
              addToCart(boutiqueId, boutiqueNom, p, whatsapp)
              setAddedCart(true)
              setTimeout(() => setAddedCart(false), 1800)
            }}
            disabled={!p.en_stock}
            className={`btn-premium ${addedCart ? 'btn-premium-success' : 'btn-premium-primary'}`}
            style={{ padding: '8px 14px', fontSize: 12, opacity: p.en_stock ? 1 : 0.6 }}
          >
            {addedCart ? '✅ Ajouté' : (p.en_stock ? <><ShoppingCart size={14} /> Ajouter</> : 'Rupture')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cloudinaryHQ(img, { width: 400 })} alt={p.nom}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                loading="lazy"
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: 'var(--text3)' }}>
                <ShoppingCart size={32} />
              </div>
            )}

            {!p.en_stock && (
              <span style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                Rupture
              </span>
            )}
            {remise && (
              <span style={{ position: 'absolute', top: 8, left: 8, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                -{remise}%
              </span>
            )}
          </div>
        </Link>

        {/* Bouton Aperçu Rapide au survol */}
        <button
          type="button"
          onClick={() => onQuickView(p)}
          style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 4,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
            border: '1px solid #e5e7eb', borderRadius: 20, padding: '5px 10px',
            fontSize: 11, fontWeight: 800, color: '#1f2937', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <Eye size={12} /> Aperçu
        </button>
      </div>

      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.4, color: 'var(--navy)' }}>{p.nom}</p>
        </Link>
        {p.caracteristiques?.marque && (
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.caracteristiques.marque}</p>
        )}
        {p.description && (
          <p style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0 0', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {p.description}
          </p>
        )}
        <div style={{ paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {p.prix && <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>{fcfa(p.prix)}</span>}
          {p.prix_barre && <span style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
          {!p.prix && <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>Prix à négocier</span>}
        </div>
      </div>

      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CardActions id={p.id} nom={p.nom} type="boutique_produit" boutiqueId={boutiqueId} />
        <button
          onClick={() => {
            addToCart(boutiqueId, boutiqueNom, p, whatsapp)
            setAddedCart(true)
            setTimeout(() => setAddedCart(false), 1800)
          }}
          disabled={!p.en_stock}
          className={`btn-premium ${addedCart ? 'btn-premium-success' : 'btn-premium-primary'}`}
          style={{ width: '100%', padding: '9px', fontSize: 13, opacity: p.en_stock ? 1 : 0.6 }}
        >
          {addedCart ? '✅ Ajouté !' : (p.en_stock ? <><ShoppingCart size={15} /> Ajouter au panier</> : 'Rupture de stock')}
        </button>
      </div>
    </div>
  )
}

export default function BoutiqueDetailClient({
  boutique,
  produits,
  annonces,
}: {
  boutique: {
    id: string
    slug: string | null
    nom: string
    telephone: string | null
    whatsapp: string | null
    facebook: string | null
    instagram: string | null
    site_web: string | null
    horaires: Record<string, string> | null
    adresse: string | null
    ville: string
    categorie: string | null
    description: string | null
    plan_actif: 'pro' | 'business' | null
  }
  produits: Produit[]
  annonces: Annonce[]
}) {
  const [tab, setTab] = useState<'produits' | 'annonces' | 'infos'>('produits')
  const [commanderProduit, setCommanderProduit] = useState<Produit | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<Produit | null>(null)

  // 🔍 Filtres & Recherche de produits dans la boutique
  const [searchQuery, setSearchQuery] = useState('')
  const [catFilter, setCatFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')
  const [stockOnly, setStockOnly] = useState(false)
  const [sortOption, setSortOption] = useState<string>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // 📌 Sticky Bar au défilement
  const [isSticky, setIsSticky] = useState(false)

  const { openCart, getCartItemCount, getCartTotal } = useCart()
  const boutiqueKey = boutique.slug || boutique.id
  const cartCount = getCartItemCount(boutiqueKey)
  const cartTotal = getCartTotal(boutiqueKey)

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 280) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Extraire dynamiquement les catégories de la boutique
  const categoriesInternes = useMemo(() => {
    const set = new Set<string>()
    produits.forEach(p => { if (p.categorie) set.add(p.categorie) })
    return Array.from(set)
  }, [produits])

  // Filtrer et trier les produits
  const produitsFiltres = useMemo(() => {
    let result = [...produits]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
    }

    if (catFilter) {
      result = result.filter(p => p.categorie === catFilter)
    }

    if (stockOnly) {
      result = result.filter(p => p.en_stock)
    }

    if (priceFilter) {
      if (priceFilter === '<10k') result = result.filter(p => (p.prix || 0) < 10000)
      else if (priceFilter === '10k-50k') result = result.filter(p => (p.prix || 0) >= 10000 && (p.prix || 0) <= 50000)
      else if (priceFilter === '50k-100k') result = result.filter(p => (p.prix || 0) >= 50000 && (p.prix || 0) <= 100000)
      else if (priceFilter === '>100k') result = result.filter(p => (p.prix || 0) > 100000)
    }

    if (sortOption === 'prix_asc') {
      result.sort((a, b) => (a.prix || 0) - (b.prix || 0))
    } else if (sortOption === 'prix_desc') {
      result.sort((a, b) => (b.prix || 0) - (a.prix || 0))
    } else if (sortOption === 'nom_asc') {
      result.sort((a, b) => a.nom.localeCompare(b.nom))
    }

    return result
  }, [produits, searchQuery, catFilter, stockOnly, priceFilter, sortOption])

  const tabStyle = (active: boolean) => ({
    padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: active ? 800 : 600,
    color: active ? '#C75B00' : '#6b7280',
    borderBottom: active ? '3px solid #C75B00' : '3px solid transparent',
    transition: 'all .15s',
  })

  const contactNumber = boutique.whatsapp || boutique.telephone
  const whatsappUrl = contactNumber
    ? `https://wa.me/${contactNumber.replace(/\D/g, '')}`
    : null

  const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const horairesKeys = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

  return (
    <div>
      {/* 📌 BARRE STICKY D'EN-TÊTE AU DÉFILEMENT */}
      {isSticky && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          animation: 'slideDown 0.25s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 20 }}>🏪</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {boutique.nom}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{boutique.ville}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                style={{ background: '#25d366', color: '#fff', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            <button
              onClick={() => openCart(boutiqueKey)}
              style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ShoppingCart size={15} />
              <span>Panier</span>
              {cartCount > 0 && (
                <span style={{ background: '#fff', color: '#C75B00', padding: '1px 6px', borderRadius: 10, fontSize: 11, fontWeight: 900 }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Onglets principaux */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20, overflowX: 'auto' }}>
        <button style={tabStyle(tab === 'produits')} onClick={() => setTab('produits')}>
          🛍 Catalogue {produits.length > 0 && `(${produits.length})`}
        </button>
        <button style={tabStyle(tab === 'annonces')} onClick={() => setTab('annonces')}>
          📋 Annonces {annonces.length > 0 && `(${annonces.length})`}
        </button>
        <button style={tabStyle(tab === 'infos')} onClick={() => setTab('infos')}>
          ℹ À propos & Contact
        </button>
      </div>

      {/* 🛍 ONGLET PRODUITS / CATALOGUE */}
      {tab === 'produits' && (
        <div>

          {/* 🔍 OUTILS DE RECHERCHE, FILTRES ET TRI INTERNE BOUTIQUE */}
          {produits.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e5e7eb', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Barre de Recherche Intérieure */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Rechercher un article chez ${boutique.nom}...`}
                  style={{
                    width: '100%', paddingLeft: 42, paddingRight: searchQuery ? 40 : 14, height: 44,
                    borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#f8fafc',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filtres par Catégorie Internes (Pastilles) */}
              {categoriesInternes.length > 0 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  <button
                    onClick={() => setCatFilter('')}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: !catFilter ? 800 : 600,
                      background: !catFilter ? '#1e3a5f' : '#f1f5f9', color: !catFilter ? '#fff' : '#374151',
                      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Tous les articles ({produits.length})
                  </button>
                  {categoriesInternes.map(c => (
                    <button
                      key={c}
                      onClick={() => setCatFilter(catFilter === c ? '' : c)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: catFilter === c ? 800 : 600,
                        background: catFilter === c ? '#1e3a5f' : '#f1f5f9', color: catFilter === c ? '#fff' : '#374151',
                        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* Tranche de Prix & Badges de Tri */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Prix :</span>
                  {[
                    { id: '', label: 'Tous' },
                    { id: '<10k', label: '< 10 000 F' },
                    { id: '10k-50k', label: '10k - 50k F' },
                    { id: '50k-100k', label: '50k - 100k F' },
                    { id: '>100k', label: '> 100 000 F' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPriceFilter(priceFilter === p.id ? '' : p.id)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: priceFilter === p.id ? 800 : 600,
                        background: priceFilter === p.id ? '#fff7f0' : '#fff', color: priceFilter === p.id ? '#C75B00' : '#4b5563',
                        border: priceFilter === p.id ? '1.5px solid #C75B00' : '1px solid #e5e7eb', cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setStockOnly(!stockOnly)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: stockOnly ? 800 : 600,
                      background: stockOnly ? '#f0fdf4' : '#fff', color: stockOnly ? '#16a34a' : '#4b5563',
                      border: stockOnly ? '1.5px solid #16a34a' : '1px solid #e5e7eb', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    ⚡ En stock uniquement
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Option Tri */}
                  <select
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, fontWeight: 600, background: '#fff' }}
                  >
                    <option value="recent">Plus récents</option>
                    <option value="prix_asc">Prix croissant</option>
                    <option value="prix_desc">Prix décroissant</option>
                    <option value="nom_asc">Nom A-Z</option>
                  </select>

                  {/* Basculer Grille / Liste */}
                  <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
                    <button
                      onClick={() => setViewMode('grid')}
                      style={{ padding: '5px 8px', background: viewMode === 'grid' ? '#1e3a5f' : '#fff', color: viewMode === 'grid' ? '#fff' : '#6b7280', border: 'none', cursor: 'pointer' }}
                      title="Vue Grille"
                    >
                      <Grid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      style={{ padding: '5px 8px', background: viewMode === 'list' ? '#1e3a5f' : '#fff', color: viewMode === 'list' ? '#fff' : '#6b7280', border: 'none', cursor: 'pointer' }}
                      title="Vue Liste"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grille ou Liste des Produits */}
          {produits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📦</span>
              <p style={{ margin: 0 }}>Aucun produit dans le catalogue pour l&apos;instant.</p>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 16, background: '#25d366', color: '#fff',
                    padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
                  💬 Contacter via WhatsApp
                </a>
              )}
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔎</span>
              <p style={{ margin: '0 0 12px', fontWeight: 700 }}>Aucun produit ne correspond à vos filtres</p>
              <button
                onClick={() => { setSearchQuery(''); setCatFilter(''); setPriceFilter(''); setStockOnly(false); }}
                style={{ background: '#C75B00', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : (
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              flexDirection: viewMode === 'grid' ? undefined : 'column',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(190px, 1fr))' : undefined,
              gap: 16,
            }}>
              {produitsFiltres.map((p: Produit) => (
                <ProduitCard
                  key={p.id}
                  p={p}
                  boutiqueId={boutique.slug || boutique.id}
                  boutiqueNom={boutique.nom}
                  whatsapp={boutique.whatsapp || boutique.telephone}
                  viewMode={viewMode}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Annonces */}
      {tab === 'annonces' && (
        <div>
          {annonces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📭</span>
              <p style={{ margin: 0 }}>Aucune annonce pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="boutique-annonces-grid">
              {annonces.map(a => {
                const img = a.photos?.[0] ?? null
                return (
                  <Link href={`/annonces/${a.id}`} key={a.id} className="boutique-annonce-card">
                    <div className="boutique-annonce-img">
                      {img
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={cloudinaryHQ(img, { width: 400 })} alt={a.titre} loading="lazy" />
                        : <span>{CAT_ICONS[a.categorie_slug] ?? '📦'}</span>
                      }
                    </div>
                    <div className="boutique-annonce-body">
                      <p className="boutique-annonce-titre">{a.titre}</p>
                      <p className="boutique-annonce-prix">{a.prix ? fcfa(a.prix) : 'Prix à négocier'}</p>
                      {a.ville && <p className="boutique-annonce-ville">📍 {[a.quartier, a.ville].filter(Boolean).join(', ')}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Onglet Infos */}
      {tab === 'infos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {boutique.description && (
            <div style={{
              background: 'linear-gradient(135deg, #fffcf9, #fff7f0)',
              border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px',
            }}>
              <p style={{ fontWeight: 800, margin: '0 0 10px', fontSize: 13, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} /> À propos
              </p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text2)' }}>{boutique.description}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontWeight: 800, margin: 0, fontSize: 14, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} /> Contact
              </p>

              {boutique.adresse && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: 'var(--text3)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{boutique.adresse}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>{boutique.ville}</p>
                  </div>
                </div>
              )}

              {boutique.telephone && (
                <a href={`tel:${boutique.telephone}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eff6ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #dbeafe' }}>
                    <Phone size={18} style={{ color: '#1d4ed8' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: '#2563eb', fontWeight: 700, letterSpacing: '0.05em' }}>TÉLÉPHONE</p>
                      <p style={{ margin: 0, fontSize: 14, color: '#1d4ed8', fontWeight: 700 }}>{boutique.telephone}</p>
                    </div>
                  </div>
                </a>
              )}

              {boutique.whatsapp && (
                <a href={`https://wa.me/${boutique.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', border: '1px solid #dcfce7' }}>
                    <MessageCircle size={18} style={{ color: '#16a34a' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: '#16a34a', fontWeight: 700, letterSpacing: '0.05em' }}>WHATSAPP</p>
                      <p style={{ margin: 0, fontSize: 14, color: '#15803d', fontWeight: 700 }}>{boutique.whatsapp}</p>
                    </div>
                  </div>
                </a>
              )}
            </div>

            {boutique.horaires && Object.keys(boutique.horaires).length > 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '22px' }}>
                <p style={{ fontWeight: 800, margin: '0 0 14px', fontSize: 14, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} /> Horaires d&apos;ouverture
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {horairesKeys.map((key, i) => {
                    const val = boutique.horaires?.[key]
                    if (!val) return null
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{JOURS[i]}</span>
                        <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <AvisClients boutiqueId={boutique.id} />
        </div>
      )}

      {/* 🔍 MODAL APERÇU RAPIDE / QUICK VIEW */}
      {quickViewProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setQuickViewProduct(null)}>
          <div style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: 260, background: '#f8fafc' }}>
              {quickViewProduct.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cloudinaryHQ(quickViewProduct.images[0], { width: 800 })} alt={quickViewProduct.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={48} style={{ color: '#9ca3af' }} />
                </div>
              )}
              <button onClick={() => setQuickViewProduct(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: 22 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#111827' }}>{quickViewProduct.nom}</h3>
              <p style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 900, color: '#C75B00' }}>
                {quickViewProduct.prix ? fcfa(quickViewProduct.prix) : 'Prix sur demande'}
              </p>
              {quickViewProduct.description && (
                <p style={{ margin: '0 0 20px', fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>{quickViewProduct.description}</p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    useCart().addToCart(boutiqueKey, boutique.nom, quickViewProduct, boutique.whatsapp)
                    setQuickViewProduct(null)
                  }}
                  disabled={!quickViewProduct.en_stock}
                  style={{ flex: 1, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <ShoppingCart size={16} /> Ajouter au panier
                </button>
                <Link
                  href={`/boutiques/${boutiqueKey}/produits/${quickViewProduct.id}`}
                  style={{ background: '#f1f5f9', color: '#1e3a5f', padding: '12px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
                >
                  Voir fiche complète →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Cart Multi-produits */}
      <DrawerCart />

      {/* Modal commande */}
      {commanderProduit && (
        <CommanderModal
          boutiqueId={boutique.id}
          produit={commanderProduit}
          whatsapp={boutique.whatsapp}
          nomBoutique={boutique.nom}
          onClose={() => setCommanderProduit(null)}
        />
      )}
    </div>
  )
}
