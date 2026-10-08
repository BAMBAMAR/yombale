'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  ShoppingBag,
  Store,
  Tag,
} from 'lucide-react'
import SurgaChargementEchoue, { lireReponseSurga } from './SurgaChargementEchoue'
import {
  BoutiqueCard,
  ProduitCard,
  type BoutiqueItem,
  type ProduitItem,
} from './SurgaShoppingCards'

interface SurgaShoppingModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES_SHOPPING = [
  { id: 'tous', label: 'Tout explorer' },
  { id: 'mode', label: 'Mode & Caftans' },
  { id: 'tech', label: 'High-Tech & Mobiles' },
  { id: 'beaute', label: 'Beauté & Parfums' },
  { id: 'alimentation', label: 'Alimentation & Épicerie' },
  { id: 'maison', label: 'Maison & Déco' },
]

export default function SurgaShoppingModal({ isOpen, onClose }: SurgaShoppingModalProps) {
  const [onglet, setOnglet] = useState<'boutiques' | 'produits'>('boutiques')
  const [recherche, setRecherche] = useState('')
  const [categorieActive, setCategorieActive] = useState('tous')
  const [boutiques, setBoutiques] = useState<BoutiqueItem[]>([])
  const [produits, setProduits] = useState<ProduitItem[]>([])
  const [loading, setLoading] = useState(false)
  const [echec, setEchec] = useState(false)
  const [essai, setEssai] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setLoading(true)
    setEchec(false)

    const params = new URLSearchParams()
    if (categorieActive !== 'tous') params.append('categorie', categorieActive)
    if (recherche.trim()) params.append('q', recherche.trim())
    params.append('limit', '200')

    fetch(`/api/surga/shopping?${params.toString()}`)
      .then(lireReponseSurga)
      .then((data) => {
        if (!isMounted) return
        setBoutiques(data.boutiques || [])
        setProduits(data.produits || [])
      })
      .catch(() => {
        if (isMounted) setEchec(true)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, categorieActive, recherche, essai])

  const boutiquesFiltrees = useMemo(() => {
    if (!recherche.trim()) return boutiques
    const q = recherche.toLowerCase()
    return boutiques.filter((b) => (
      b.nom.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.ville?.toLowerCase().includes(q) ||
      b.categorie?.toLowerCase().includes(q)
    ))
  }, [boutiques, recherche])

  const produitsFiltres = useMemo(() => {
    if (!recherche.trim()) return produits
    const q = recherche.toLowerCase()
    return produits.filter((p) => (
      p.nom.toLowerCase().includes(q) ||
      p.boutique_nom?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.categorie?.toLowerCase().includes(q)
    ))
  }, [produits, recherche])

  if (!isOpen) return null

  const handleWhatsAppBoutique = (tel?: string, boutiqueNom?: string) => {
    const num = (tel || '+221770000000').replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Bonjour ${boutiqueNom || 'Nopalou'}, je vous contacte depuis Surga pour découvrir vos articles.`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  const handleWhatsAppProduit = (p: ProduitItem) => {
    const num = (p.boutique_tel || '+221770000000').replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Bonjour ${p.boutique_nom}, je souhaite commander "${p.nom}" vu sur Surga (${p.prix.toLocaleString('fr-FR')} FCFA). Est-il disponible ?`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--surga-border, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                Shopping &amp; Boutiques Nopalou
              </h2>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--text3, #73675E)' }}>
                Boutiques marchandes et produits disponibles au Sénégal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--text3, #73675E)',
              borderRadius: 6,
            }}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contrôles de Recherche & Onglets */}
        <div style={{ padding: '14px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3, #73675E)' }}
            />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une boutique, caftan, smartphone, parfum..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                backgroundColor: 'var(--surga-bg, #F8FAFC)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--surga-border, #E2E8F0)', paddingBottom: 10 }}>
            <button
              type="button"
              onClick={() => setOnglet('boutiques')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: onglet === 'boutiques' ? 'var(--navy, #1C2B4A)' : 'transparent',
                color: onglet === 'boutiques' ? '#FFFFFF' : 'var(--text2, #475569)',
              }}
            >
              <Store size={15} />
              <span>Boutiques ({boutiquesFiltrees.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setOnglet('produits')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: onglet === 'produits' ? 'var(--navy, #1C2B4A)' : 'transparent',
                color: onglet === 'produits' ? '#FFFFFF' : 'var(--text2, #475569)',
              }}
            >
              <Tag size={15} />
              <span>Produits &amp; Articles ({produitsFiltres.length})</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            {CATEGORIES_SHOPPING.map((cat) => {
              const active = categorieActive === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategorieActive(cat.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    whiteSpace: 'nowrap',
                    border: '1px solid',
                    borderColor: active ? 'var(--accent, #C75B00)' : 'var(--surga-border, #E2E8F0)',
                    backgroundColor: active ? 'rgba(199, 91, 0, 0.1)' : '#FFFFFF',
                    color: active ? 'var(--accent, #C75B00)' : 'var(--text2, #475569)',
                    cursor: 'pointer',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Corps Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              Chargement des boutiques et produits...
            </div>
          ) : echec ? (
            <SurgaChargementEchoue message="Les boutiques et les produits n’ont pas pu être chargés." onReessayer={() => setEssai((n) => n + 1)} />
          ) : onglet === 'boutiques' ? (
            boutiquesFiltrees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)' }}>
                Aucune boutique trouvée pour cette recherche.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {boutiquesFiltrees.map((b) => (
                  <BoutiqueCard key={b.id} boutique={b} onWhatsApp={handleWhatsAppBoutique} />
                ))}
              </div>
            )
          ) : (
            produitsFiltres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)' }}>
                Aucun produit trouvé pour cette sélection.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {produitsFiltres.map((p) => (
                  <ProduitCard key={p.id} produit={p} onWhatsApp={handleWhatsAppProduit} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
