'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'

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

const CARAC_LABELS: Record<string, string> = {
  marque: 'Marque', modele: 'Modèle', stockage: 'Stockage', ram: 'RAM',
  couleur: 'Couleur', etat: 'État', processeur: 'Processeur',
  type_article: 'Type', taille: 'Taille', genre: 'Genre', matiere: 'Matière',
  dimensions: 'Dimensions', annee: 'Année', kilometrage: 'Kilométrage',
  carburant: 'Carburant', plateforme: 'Plateforme', editeur: 'Éditeur',
  poids_quantite: 'Poids / Quantité', conditionnement: 'Conditionnement',
  date_peremption: 'Péremption', type_produit: 'Type', pour_qui: 'Pour qui',
  contenance: 'Contenance', type_service: 'Service', zone_intervention: 'Zone',
  duree: 'Durée', disponibilite: 'Disponibilité',
}

// ── Modal fiche produit ───────────────────────────────────────────────────────

function FicheProduitModal({ produit, boutique, onClose }: {
  produit: Produit
  boutique: { telephone: string | null; whatsapp: string | null; nom: string }
  onClose: () => void
}) {
  const [imgIdx, setImgIdx] = useState(0)

  const handleClose = useCallback(onClose, [onClose])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [handleClose])

  const images = produit.images?.length ? produit.images : []
  const currentImg = images[imgIdx] ?? null

  const waContact = (boutique.whatsapp || boutique.telephone)
  const waUrl = waContact
    ? `https://wa.me/${waContact.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par : ${produit.nom} — ${boutique.nom}`)}`
    : null
  const telUrl = boutique.telephone ? `tel:${boutique.telephone}` : null

  const caracEntries = produit.caracteristiques
    ? Object.entries(produit.caracteristiques).filter(([, v]) => v && v.trim())
    : []

  const remise = produit.prix && produit.prix_barre && produit.prix_barre > produit.prix
    ? Math.round((1 - produit.prix / produit.prix_barre) * 100)
    : null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', overflowY: 'auto',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760,
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'sticky', top: 12, float: 'right', marginRight: 12, marginTop: 12,
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,.08)', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
          }}
          aria-label="Fermer"
        >
          ✕
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 0 }}>

          {/* ── Colonne gauche : images ────────────── */}
          <div style={{ background: '#f8fafc', borderRadius: '16px 0 0 16px', overflow: 'hidden' }}>
            {/* Image principale */}
            <div style={{ width: '100%', paddingTop: '100%', position: 'relative' }}>
              {currentImg
                // eslint-disable-next-line @next/next/no-img-element
                ? <img
                    src={cloudinaryHQ(currentImg, { width: 600 })}
                    alt={produit.nom}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</span>
              }
              {!produit.en_stock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 14, padding: '6px 18px', borderRadius: 20 }}>Rupture de stock</span>
                </div>
              )}
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto' }}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                      border: imgIdx === i ? '2px solid #C75B00' : '2px solid transparent',
                      padding: 0, cursor: 'pointer', background: 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cloudinaryHQ(src, { width: 120 })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Colonne droite : infos ─────────────── */}
          <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

            {/* Nom */}
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              {produit.nom}
            </h2>

            {/* Prix */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              {produit.prix
                ? <span style={{ fontSize: 24, fontWeight: 800, color: '#C75B00' }}>{fcfa(produit.prix)}</span>
                : <span style={{ fontSize: 16, color: '#6b7280' }}>Prix à négocier</span>
              }
              {produit.prix_barre && (
                <span style={{ fontSize: 15, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(produit.prix_barre)}</span>
              )}
              {remise && (
                <span style={{ fontSize: 12, background: '#dcfce7', color: '#16a34a', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                  -{remise}%
                </span>
              )}
            </div>

            {/* Caractéristiques */}
            {caracEntries.length > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 10px' }}>
                  Caractéristiques
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', alignItems: 'start' }}>
                  {caracEntries.map(([k, v]) => [
                    <span key={`l-${k}`} style={{ fontSize: 12, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                      {CARAC_LABELS[k] ?? k}
                    </span>,
                    <span key={`v-${k}`} style={{ fontSize: 13, color: '#4b5563', textTransform: k === 'etat' ? 'capitalize' : 'none' }}>
                      {v}
                    </span>,
                  ])}
                </div>
              </div>
            )}

            {/* Description */}
            {produit.description && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 6px' }}>
                  Description
                </p>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>
                  {produit.description}
                </p>
              </div>
            )}

            {/* Badge stock */}
            <div>
              <span style={{
                display: 'inline-block', fontSize: 12, fontWeight: 700,
                padding: '4px 12px', borderRadius: 20,
                background: produit.en_stock ? '#dcfce7' : '#fee2e2',
                color: produit.en_stock ? '#16a34a' : '#dc2626',
              }}>
                {produit.en_stock ? '✅ En stock' : '❌ Rupture de stock'}
              </span>
            </div>

            {/* CTA contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#25d366', color: '#fff', padding: '12px 20px',
                    borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15,
                  }}
                >
                  💬 Commander via WhatsApp
                </a>
              )}
              {telUrl && (
                <a
                  href={telUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                    padding: '11px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15,
                  }}
                >
                  📞 Appeler le vendeur
                </a>
              )}
              {!waUrl && !telUrl && (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Contactez la boutique pour plus d&apos;infos.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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

function ProduitCard({ p, onClick }: { p: Produit; onClick: () => void }) {
  const img = p.images?.[0] ?? null
  const remise = p.prix && p.prix_barre && p.prix_barre > p.prix
    ? Math.round((1 - p.prix / p.prix_barre) * 100) : null

  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column', cursor: 'pointer',
        padding: 0, textAlign: 'left', width: '100%',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,.12)'
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'
        ;(e.currentTarget as HTMLButtonElement).style.transform = ''
      }}
    >
      <div style={{ width: '100%', paddingTop: '75%', position: 'relative', background: '#f8fafc' }}>
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cloudinaryHQ(img, { width: 400 })} alt={p.nom}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</span>
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
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.3 }}>{p.nom}</p>
        {p.caracteristiques?.marque && (
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 600 }}>{p.caracteristiques.marque}</p>
        )}
        {p.description && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {p.description}
          </p>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div>
            {p.prix && <span style={{ fontWeight: 800, fontSize: 15, color: '#C75B00' }}>{fcfa(p.prix)}</span>}
            {p.prix_barre && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginLeft: 6 }}>{fcfa(p.prix_barre)}</span>}
            {!p.prix && <span style={{ fontSize: 13, color: '#6b7280' }}>Prix à négocier</span>}
          </div>
          <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>Voir détails →</span>
        </div>
      </div>
    </button>
  )
}

export default function BoutiqueDetailClient({
  boutique,
  produits,
  annonces,
}: {
  boutique: {
    id: string
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
  const [ficheProduit, setFicheProduit] = useState<Produit | null>(null)

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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}>
              {produits.map(p => (
                <ProduitCard key={p.id} p={p} onClick={() => setFicheProduit(p)} />
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
        <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {boutique.description && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 13, color: '#374151' }}>À propos</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#4b5563' }}>{boutique.description}</p>
            </div>
          )}

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 13, color: '#374151' }}>Contact & localisation</p>
            {boutique.adresse && (
              <div style={{ fontSize: 14, color: '#4b5563', display: 'flex', gap: 8 }}>
                <span>📍</span>
                <span>{[boutique.adresse, boutique.ville].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {boutique.telephone && (
              <a href={`tel:${boutique.telephone}`} style={{ fontSize: 14, color: '#1d4ed8', display: 'flex', gap: 8, textDecoration: 'none' }}>
                <span>📞</span><span>{boutique.telephone}</span>
              </a>
            )}
            {boutique.whatsapp && (
              <a href={`https://wa.me/${boutique.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, color: '#16a34a', display: 'flex', gap: 8, textDecoration: 'none' }}>
                <span>💬</span><span>WhatsApp : {boutique.whatsapp}</span>
              </a>
            )}
            {boutique.site_web && (
              <a href={boutique.site_web} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, color: '#1d4ed8', display: 'flex', gap: 8, textDecoration: 'none' }}>
                <span>🌐</span><span>{boutique.site_web.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

          {(boutique.facebook || boutique.instagram) && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 13, color: '#374151' }}>Réseaux sociaux</p>
              {boutique.facebook && (
                <a href={boutique.facebook} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, color: '#1877f2', display: 'flex', gap: 8, textDecoration: 'none' }}>
                  <span>📘</span><span>Facebook</span>
                </a>
              )}
              {boutique.instagram && (
                <a href={boutique.instagram} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, color: '#e1306c', display: 'flex', gap: 8, textDecoration: 'none' }}>
                  <span>📸</span><span>Instagram</span>
                </a>
              )}
            </div>
          )}

          {boutique.horaires && Object.keys(boutique.horaires).length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <p style={{ fontWeight: 700, margin: '0 0 10px', fontSize: 13, color: '#374151' }}>🕐 Horaires d&apos;ouverture</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
                {horairesKeys.map((key, i) => {
                  const val = boutique.horaires?.[key]
                  if (!val) return null
                  return [
                    <span key={`k-${key}`} style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{JOURS[i]}</span>,
                    <span key={`v-${key}`} style={{ fontSize: 13, color: '#4b5563' }}>{val}</span>,
                  ]
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal fiche produit */}
      {ficheProduit && (
        <FicheProduitModal
          produit={ficheProduit}
          boutique={{ telephone: boutique.telephone, whatsapp: boutique.whatsapp, nom: boutique.nom }}
          onClose={() => setFicheProduit(null)}
        />
      )}
    </div>
  )
}
