'use client'
import { useState } from 'react'
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

function ProduitCard({ p, telephone, whatsapp }: { p: Produit; telephone: string | null; whatsapp: string | null }) {
  const img = p.images?.[0] ?? null
  const contact = whatsapp
    ? `https://wa.me/${(whatsapp || telephone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par : ${p.nom}`)}`
    : telephone ? `tel:${telephone}` : null

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column',
    }}>
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
      </div>
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.3 }}>{p.nom}</p>
        {p.description && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {p.description}
          </p>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div>
            {p.prix && <span style={{ fontWeight: 800, fontSize: 15, color: '#C75B00' }}>{fcfa(p.prix)}</span>}
            {p.prix_barre && (
              <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginLeft: 6 }}>{fcfa(p.prix_barre)}</span>
            )}
            {!p.prix && <span style={{ fontSize: 13, color: '#6b7280' }}>Prix à négocier</span>}
          </div>
          {contact && (
            <a href={contact} target={whatsapp ? '_blank' : undefined} rel="noopener noreferrer"
              style={{ fontSize: 12, background: whatsapp ? '#25d366' : '#1d4ed8', color: '#fff',
                padding: '4px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {whatsapp ? '💬 WhatsApp' : '📞 Appeler'}
            </a>
          )}
        </div>
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
                <ProduitCard key={p.id} p={p} telephone={boutique.telephone} whatsapp={boutique.whatsapp} />
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
    </div>
  )
}
