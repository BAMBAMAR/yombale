'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Tag, Sparkles, Info, Search, Video, PackageOpen } from 'lucide-react'
import CommanderModal from './CommanderModal'
import SocialShopFeed, { type SocialPost, type SocialAccount } from './SocialShopFeed'
import { useCart } from '@/context/CartContext'
import { matcherProduitRecherche, scorePertinenceProduit } from '@/lib/recherche-senegal'

import { Produit, Annonce, BoutiqueData, getContrastColor } from './components/types'
import ProduitCard from './components/ProduitCard'
import BoutiqueStickyBar from './components/BoutiqueStickyBar'
import BoutiqueFilterBar from './components/BoutiqueFilterBar'
import BoutiqueInfosTab from './components/BoutiqueInfosTab'
import BoutiqueQuickViewModal from './components/BoutiqueQuickViewModal'
import BoutiqueAnnoncesTab from './components/BoutiqueAnnoncesTab'

export type { Produit, Annonce }

export default function BoutiqueDetailClient({
  boutique,
  produits,
  annonces,
  initialSocialPosts = [],
  initialSocialAccounts = [],
}: {
  boutique: BoutiqueData
  produits: Produit[]
  annonces: Annonce[]
  initialSocialPosts?: SocialPost[]
  initialSocialAccounts?: SocialAccount[]
}) {
  const couleurTheme = boutique.couleur_theme || '#C75B00'
  const contrastBtnText = getContrastColor(couleurTheme)
  const radiusMap: Record<string, string> = { droit: '4px', squircle: '10px', arrondi: '14px', pill: '9999px' }
  const currentRadius = radiusMap[boutique.forme_boutons || 'squircle'] || '10px'

  const [tab, setTab] = useState<'produits' | 'social' | 'annonces' | 'infos'>('produits')
  const [commanderProduit, setCommanderProduit] = useState<Produit | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<Produit | null>(null)
  const [activePostParam, setActivePostParam] = useState<string | null>(null)

  // Filtres & Recherche de produits dans la boutique
  const [searchQuery, setSearchQuery] = useState('')
  const [catFilter, setCatFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')
  const [stockOnly, setStockOnly] = useState(false)
  const [sortOption, setSortOption] = useState<string>('recent')
  const defaultViewMode = boutique.disposition_catalogue === 'liste' ? 'list' : 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode)

  // Sticky Bar & Mode Crédit
  const [isSticky, setIsSticky] = useState(false)
  const [isCreditMode, setIsCreditMode] = useState(false)

  const { carts, openCart, getCartItemCount, addToCart, clearCart } = useCart()
  const boutiqueKey = boutique.slug || boutique.id
  const cartCount = getCartItemCount(boutiqueKey, boutique.id)

  // Réconciliation automatique Panier : si des articles ont été ajoutés sous l'UUID, les basculer sous le Slug
  useEffect(() => {
    if (!boutique.slug || !boutique.id || boutique.slug === boutique.id) return
    const uuidCart = carts[boutique.id]
    if (uuidCart && uuidCart.items && uuidCart.items.length > 0) {
      uuidCart.items.forEach(it => {
        for (let i = 0; i < it.quantite; i++) {
          addToCart(
            boutique.slug!,
            uuidCart.boutiqueNom || boutique.nom,
            {
              id: it.produitId || it.id,
              nom: it.nom,
              prix: it.prix,
              images: it.images,
              varianteId: it.varianteId,
              detailsVariante: it.detailsVariante,
              uniteVente: it.uniteVente,
            },
            uuidCart.whatsapp || boutique.whatsapp,
            false
          )
        }
      })
      clearCart(boutique.id)
    }
  }, [boutique.slug, boutique.id, carts, addToCart, clearCart, boutique.nom, boutique.whatsapp])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('mode') === 'credit') {
        setIsCreditMode(true)
      }
      const postParam = searchParams.get('post')
      if (postParam) {
        setActivePostParam(postParam)
        setTab('social')
      }
      if (searchParams.get('tab') === 'social') {
        setTab('social')
      }
    }

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
    produits.forEach(p => {
      if (p.categorie) set.add(p.categorie)
    })
    return Array.from(set)
  }, [produits])

  // Filtrer et trier les produits
  const produitsFiltres = useMemo(() => {
    let result = [...produits]

    if (searchQuery.trim()) {
      result = result
        .filter(p => matcherProduitRecherche(p, searchQuery))
        .sort((a, b) => scorePertinenceProduit(b, searchQuery) - scorePertinenceProduit(a, searchQuery))
    }

    if (catFilter) {
      result = result.filter(p => p.categorie === catFilter)
    }

    if (stockOnly) {
      result = result.filter(p =>
        (p.quantite_stock ?? p.stock_quantite) != null
          ? Number(p.quantite_stock ?? p.stock_quantite) > 0
          : p.en_stock !== false
      )
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

  const contactNumber = boutique.whatsapp || boutique.telephone
  const whatsappUrl = contactNumber ? `https://wa.me/${contactNumber.replace(/\D/g, '')}` : null

  return (
    <div>
      {/* Barre Sticky & Bannière Crédit */}
      <BoutiqueStickyBar
        isSticky={isSticky}
        isCreditMode={isCreditMode}
        boutique={boutique}
        boutiqueKey={boutiqueKey}
        whatsappUrl={whatsappUrl}
        couleurTheme={couleurTheme}
        contrastBtnText={contrastBtnText}
        currentRadius={currentRadius}
        cartCount={cartCount}
        openCart={openCart}
      />

      {/* Navigation par Onglets Mobile & Desktop */}
      <div
        className="nopalou-scroll-tabs"
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: '#f1f5f9',
          borderRadius: 14,
          marginBottom: 12,
          overflowX: 'auto',
          border: '1px solid #e2e8f0',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('produits')}
          style={{
            flex: '0 0 auto',
            padding: '8px 14px',
            borderRadius: currentRadius,
            border: 'none',
            background: tab === 'produits' ? '#fff' : 'transparent',
            color: tab === 'produits' ? couleurTheme : '#64748b',
            fontWeight: tab === 'produits' ? 900 : 600,
            fontSize: 12.5,
            cursor: 'pointer',
            boxShadow: tab === 'produits' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Tag size={15} style={{ color: tab === 'produits' ? couleurTheme : '#94a3b8' }} />
          <span>Produits</span>
          {produits.length > 0 && (
            <span
              style={{
                background: tab === 'produits' ? `${couleurTheme}15` : '#e2e8f0',
                color: tab === 'produits' ? couleurTheme : '#475569',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {produits.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('social')}
          style={{
            flex: '0 0 auto',
            padding: '8px 14px',
            borderRadius: currentRadius,
            border: 'none',
            background: tab === 'social' ? '#fff' : 'transparent',
            color: tab === 'social' ? couleurTheme : '#64748b',
            fontWeight: tab === 'social' ? 900 : 600,
            fontSize: 12.5,
            cursor: 'pointer',
            boxShadow: tab === 'social' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Video size={15} style={{ color: tab === 'social' ? couleurTheme : '#94a3b8' }} />
          <span>Autres produits</span>
          {initialSocialPosts.length > 0 && (
            <span
              style={{
                background: tab === 'social' ? `${couleurTheme}15` : '#e2e8f0',
                color: tab === 'social' ? couleurTheme : '#475569',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {initialSocialPosts.length}
            </span>
          )}
        </button>

        {annonces.length > 0 && (
          <button
            type="button"
            onClick={() => setTab('annonces')}
            style={{
              flex: '1 0 auto',
              minWidth: 100,
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: tab === 'annonces' ? '#fff' : 'transparent',
              color: tab === 'annonces' ? '#1e3a5f' : '#64748b',
              fontWeight: tab === 'annonces' ? 900 : 600,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: tab === 'annonces' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={15} style={{ color: tab === 'annonces' ? '#1e3a5f' : '#94a3b8' }} />
            <span>Annonces</span>
            <span
              style={{
                background: tab === 'annonces' ? '#eff6ff' : '#e2e8f0',
                color: tab === 'annonces' ? '#1d4ed8' : '#475569',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {annonces.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setTab('infos')}
          style={{
            flex: '1 0 auto',
            minWidth: 100,
            padding: '8px 12px',
            borderRadius: 10,
            border: 'none',
            background: tab === 'infos' ? '#fff' : 'transparent',
            color: tab === 'infos' ? '#0f172a' : '#64748b',
            fontWeight: tab === 'infos' ? 900 : 600,
            fontSize: 12.5,
            cursor: 'pointer',
            boxShadow: tab === 'infos' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Info size={15} style={{ color: tab === 'infos' ? '#0f172a' : '#94a3b8' }} />
          <span>Infos & Contact</span>
        </button>
      </div>

      {/* ONGLET PRODUITS / CATALOGUE */}
      {tab === 'produits' && (
        <div>
          {boutique.message_accueil && (
            <div
              style={{
                background: boutique.couleur_secondaire || '#f8fafc',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: currentRadius,
                padding: '14px 18px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <Info size={22} style={{ color: couleurTheme, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 500, lineHeight: 1.5 }}>
                {boutique.message_accueil}
              </p>
            </div>
          )}

          {/* Outils de recherche, filtres et tri */}
          {produits.length > 0 && (
            <BoutiqueFilterBar
              nomBoutique={boutique.nom}
              totalProduits={produits.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoriesInternes={categoriesInternes}
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              stockOnly={stockOnly}
              setStockOnly={setStockOnly}
              sortOption={sortOption}
              setSortOption={setSortOption}
              viewMode={viewMode}
              setViewMode={setViewMode}
              couleurTheme={couleurTheme}
              contrastBtnText={contrastBtnText}
              currentRadius={currentRadius}
            />
          )}

          {/* Grille ou Liste des Produits */}
          {produits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
              <PackageOpen size={48} style={{ margin: '0 auto 12px', display: 'block', color: '#9ca3af' }} />
              <p style={{ margin: 0 }}>Aucun produit dans le catalogue pour l&apos;instant.</p>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 16,
                    background: '#25d366',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: currentRadius,
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Contacter via WhatsApp
                </a>
              )}
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
              <Search size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#9ca3af' }} />
              <p style={{ margin: '0 0 12px', fontWeight: 700 }}>Aucun produit ne correspond à vos filtres</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setCatFilter('')
                  setPriceFilter('')
                  setStockOnly(false)
                }}
                style={{
                  background: couleurTheme,
                  color: contrastBtnText,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: currentRadius,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'boutique-produits-grid' : 'boutique-produits-list'}>
              {produitsFiltres.map((p: Produit) => (
                <ProduitCard
                  key={p.id}
                  p={p}
                  boutiqueId={boutique.slug || boutique.id}
                  boutiqueNom={boutique.nom}
                  whatsapp={boutique.whatsapp || boutique.telephone}
                  viewMode={viewMode}
                  onQuickView={setQuickViewProduct}
                  couleurTheme={couleurTheme}
                  contrastBtnText={contrastBtnText}
                  currentRadius={currentRadius}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Annonces */}
      {tab === 'annonces' && <BoutiqueAnnoncesTab annonces={annonces} />}

      {/* Onglet Social Shop */}
      {tab === 'social' && (
        <SocialShopFeed
          boutiqueId={boutiqueKey}
          boutiqueNom={boutique.nom}
          boutiqueSlug={boutique.slug}
          whatsappNumber={boutique.whatsapp || boutique.telephone}
          initialPosts={initialSocialPosts}
          socialAccounts={initialSocialAccounts}
          activePostId={activePostParam}
        />
      )}

      {/* Onglet Infos & Contact */}
      {tab === 'infos' && <BoutiqueInfosTab boutique={boutique} />}

      {/* Modal Aperçu Rapide */}
      <BoutiqueQuickViewModal
        quickViewProduct={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        boutiqueKey={boutiqueKey}
        boutiqueNom={boutique.nom}
        whatsapp={boutique.whatsapp}
        couleurTheme={couleurTheme}
        contrastBtnText={contrastBtnText}
        currentRadius={currentRadius}
      />

      {/* Pied de page Réassurance */}
      <div
        style={{
          marginTop: 48,
          padding: '24px 16px 36px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: 12.5,
        }}
      >
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#374151' }}>
          Vitrine officielle de <strong>{boutique.nom}</strong>
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>Paiements sécurisés Wave & Orange Money</span>
          <span>•</span>
          <span>Propulsé par Nopalou</span>
        </p>
      </div>

      {/* Modal commande express */}
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
