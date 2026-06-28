import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import { notFound } from 'next/navigation'
import { cloudinaryHQ } from '@/lib/cloudinary'

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  utilisateur_id: string
  created_at: string
}

interface Annonce {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  categorie_slug: string
  photos: string[]
  created_at: string
}

const CAT_ICONS: Record<string, string> = {
  smartphones: '📱', informatique: '💻', 'tv-electro': '📺',
  mode: '👗', maison: '🏠', 'auto-moto': '🚗', jeux: '🎮',
  services: '🛠', alimentation: '🥗', beaute: '💄', autre: '🏪',
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const b = await apiFetch<Boutique>(`/boutiques/${params.id}`)
    return { title: `${b.nom} — Nopalou`, description: b.description ?? `Boutique de ${b.ville} sur Nopalou` }
  } catch {
    return { title: 'Boutique — Nopalou' }
  }
}

export default async function BoutiqueDetailPage({ params }: { params: { id: string } }) {
  let boutique: Boutique
  let annonces: Annonce[] = []

  try {
    boutique = await apiFetch<Boutique>(`/boutiques/${params.id}`)
  } catch {
    notFound()
  }

  try {
    const data = await apiFetch<{ annonces: Annonce[] }>(
      `/annonces?utilisateur_id=${boutique!.utilisateur_id}&limit=24`
    )
    annonces = data.annonces ?? []
  } catch {}

  const b = boutique!

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      {/* Fiche boutique */}
      <div className="boutique-fiche">
        <div className="boutique-fiche-logo">
          {b.logo_url
            ? <img src={b.logo_url} alt={b.nom} />
            : <span>{CAT_ICONS[b.categorie ?? ''] ?? '🏪'}</span>
          }
        </div>
        <div className="boutique-fiche-info">
          <h1 className="boutique-fiche-nom">{b.nom}</h1>
          {b.description && <p className="boutique-fiche-desc">{b.description}</p>}
          <div className="boutique-fiche-meta">
            {b.ville    && <span>📍 {[b.adresse, b.ville].filter(Boolean).join(', ')}</span>}
            {b.categorie && <span>{CAT_ICONS[b.categorie] ?? ''} {b.categorie}</span>}
            {b.telephone && (
              <a href={`tel:${b.telephone}`} className="boutique-fiche-tel">
                📞 {b.telephone}
              </a>
            )}
          </div>
          {b.telephone && (
            <div className="boutique-fiche-actions">
              <a href={`tel:${b.telephone}`} className="boutique-contact-btn">📞 Appeler</a>
              <a
                href={`https://wa.me/${b.telephone.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="boutique-whatsapp-btn"
              >
                💬 WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Annonces du vendeur */}
      <div className="boutique-annonces-section">
        <h2 className="boutique-annonces-titre">
          Annonces de cette boutique
          {annonces.length > 0 && <span className="telecom-groupe-count">{annonces.length}</span>}
        </h2>

        {annonces.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <span style={{ fontSize: 36 }}>📭</span>
            <p>Aucune annonce pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="boutique-annonces-grid">
            {annonces.map(a => {
              const img = a.photos?.[0] ?? null
              return (
                <Link href={`/annonces/${a.id}`} key={a.id} className="boutique-annonce-card">
                  <div className="boutique-annonce-img">
                    {img
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

      <div style={{ marginTop: 24 }}>
        <Link href="/boutiques" className="budget-pill">← Toutes les boutiques</Link>
      </div>
    </div>
  )
}
