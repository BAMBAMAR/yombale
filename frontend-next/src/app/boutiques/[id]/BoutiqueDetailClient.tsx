'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa, lienBoutiqueWhatsapp } from '@/lib/format'
import CommanderModal from './CommanderModal'
import AvisClients from '@/components/AvisClients'
import DrawerCart from '@/components/DrawerCart'
import CrossSelling from '@/components/CrossSelling'
import { useCart } from '@/context/CartContext'
import CardActions from '@/app/CardActions'
import { ShoppingCart, Star, Share2, Tag, Info, Phone, MessageCircle, HelpCircle } from 'lucide-react'

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
  onCommander,
}: {
  p: Produit
  boutiqueId: string
  boutiqueNom: string
  whatsapp?: string | null
  onCommander: (p: Produit) => void
}) {
  const { addToCart } = useCart()
  const [addedCart, setAddedCart] = useState(false)
  const img = p.images?.[0] ?? null
  const remise = p.prix && p.prix_barre && p.prix_barre > p.prix
    ? Math.round((1 - p.prix / p.prix_barre) * 100) : null

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Link href={`/boutiques/${boutiqueId}/produits/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', background: '#f8fafc', overflow: 'hidden' }}>
          {img
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cloudinaryHQ(img, { width: 400 })} alt={p.nom}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                loading="lazy"
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: 'var(--text3)' }}><ShoppingCart size={32} /></div>
          }
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
        <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.4, color: 'var(--navy)' }}>{p.nom}</p>
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
      </Link>
      {/* Action standard : Ajouter au panier */}
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

  const tabStyle = (active: boolean) => ({
    padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: active ? 700 : 500,
    color: active ? '#C75B00' : '#6b7280',
    borderBottom: active ? '2px solid #C75B00' : '2px solid transparent',
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
      {/* Onglets */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 24, overflowX: 'auto' }}>
        <button style={tabStyle(tab === 'produits')} onClick={() => setTab('produits')}>
          🛍 Produits {produits.length > 0 && `(${produits.length})`}
        </button>
        <button style={tabStyle(tab === 'annonces')} onClick={() => setTab('annonces')}>
          📋 Annonces {annonces.length > 0 && `(${annonces.length})`}
        </button>
        <button style={tabStyle(tab === 'infos')} onClick={() => setTab('infos')}>
          ℹ Infos
        </button>
      </div>

      {/* Onglet Produits */}
      {tab === 'produits' && (
        <div>
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {produits.map(p => (
                <ProduitCard
                  key={p.id}
                  p={p}
                  boutiqueId={boutique.slug || boutique.id}
                  boutiqueNom={boutique.nom}
                  whatsapp={boutique.whatsapp || boutique.telephone}
                  onCommander={setCommanderProduit}
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

          {/* À propos */}
          {boutique.description && (
            <div style={{
              background: 'linear-gradient(135deg, #fff8f0, #fff3e6)',
              border: '1px solid #fed7aa', borderRadius: 14, padding: '20px 24px',
            }}>
              <p style={{ fontWeight: 800, margin: '0 0 10px', fontSize: 14, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                ✦ À propos
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: '#374151' }}>{boutique.description}</p>
            </div>
          )}

          {/* Grille contact + réseaux */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Contact */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontWeight: 800, margin: 0, fontSize: 14, color: '#1e293b' }}>📞 Contact</p>

              {boutique.adresse && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>📍</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{boutique.adresse}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{boutique.ville}</p>
                  </div>
                </div>
              )}

              {boutique.telephone && (
                <a href={`tel:${boutique.telephone}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#eff6ff', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontSize: 18 }}>📞</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#60a5fa', fontWeight: 700 }}>TÉLÉPHONE</p>
                      <p style={{ margin: 0, fontSize: 14, color: '#1d4ed8', fontWeight: 700 }}>{boutique.telephone}</p>
                    </div>
                  </div>
                </a>
              )}

              {boutique.whatsapp && (
                <a href={`https://wa.me/${boutique.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#f0fdf4', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontSize: 18 }}>💬</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#4ade80', fontWeight: 700 }}>WHATSAPP</p>
                      <p style={{ margin: 0, fontSize: 14, color: '#16a34a', fontWeight: 700 }}>{boutique.whatsapp}</p>
                    </div>
                  </div>
                </a>
              )}

              {boutique.site_web && (
                <a href={boutique.site_web} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#f8fafc', borderRadius: 10, padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>SITE WEB</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {boutique.site_web.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* Réseaux sociaux + Horaires */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {(boutique.facebook || boutique.instagram) && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px' }}>
                  <p style={{ fontWeight: 800, margin: '0 0 14px', fontSize: 14, color: '#1e293b' }}>🌍 Réseaux sociaux</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {boutique.facebook && (
                      <a href={boutique.facebook} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          background: '#1877f2', borderRadius: 10, padding: '12px 16px',
                        }}>
                          <span style={{ fontSize: 20 }}>📘</span>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Suivre sur Facebook</span>
                          <span style={{ color: 'rgba(255,255,255,.7)', marginLeft: 'auto', fontSize: 16 }}>↗</span>
                        </div>
                      </a>
                    )}
                    {boutique.instagram && (
                      <a href={boutique.instagram} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                          borderRadius: 10, padding: '12px 16px',
                        }}>
                          <span style={{ fontSize: 20 }}>📸</span>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Suivre sur Instagram</span>
                          <span style={{ color: 'rgba(255,255,255,.7)', marginLeft: 'auto', fontSize: 16 }}>↗</span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {boutique.horaires && Object.keys(boutique.horaires).length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', flex: 1 }}>
                  <p style={{ fontWeight: 800, margin: '0 0 14px', fontSize: 14, color: '#1e293b' }}>🕐 Horaires</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {horairesKeys.map((key, i) => {
                      const val = boutique.horaires?.[key]
                      if (!val) return null
                      return (
                        <div key={key} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 10px', borderRadius: 8,
                          background: '#f8fafc',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{JOURS[i]}</span>
                          <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>{val}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action principaux */}
          {(boutique.whatsapp || boutique.telephone) && (
            <div style={{ display: 'grid', gridTemplateColumns: boutique.whatsapp && boutique.telephone ? '1fr 1fr' : '1fr', gap: 12 }}>
              {boutique.whatsapp && (
                <a
                  href={`https://wa.me/${boutique.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, j'ai trouvé votre boutique sur Nopalou !`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: '#25d366', color: '#fff', padding: '14px 20px',
                    borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 15,
                    boxShadow: '0 4px 14px rgba(37,211,102,.25)',
                  }}
                >
                  💬 Écrire sur WhatsApp
                </a>
              )}
              {boutique.telephone && (
                <a
                  href={`tel:${boutique.telephone}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: '#fff', color: '#1d4ed8', border: '2px solid #bfdbfe',
                    padding: '14px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15,
                  }}
                >
                  📞 Appeler
                </a>
              )}
            </div>
          )}

          {boutique.slug && (
            <a
              href={lienBoutiqueWhatsapp(boutique.slug)}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#fff', color: '#16a34a', border: '2px solid #bbf7d0',
                padding: '14px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15,
                marginTop: 12,
              }}
            >
              🤖 Voir le catalogue sur l&apos;assistant Nopalou
            </a>
          )}

          {produits.length > 0 && (
            <CrossSelling
              boutiqueId={boutique.id}
              boutiqueNom={boutique.nom}
              produitActuel={produits[0]}
              whatsapp={boutique.whatsapp}
            />
          )}

          {/* Section Avis Clients & Étoiles */}
          <AvisClients boutiqueId={boutique.id} />
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

