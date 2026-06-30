import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import GalerieClient from './GalerieClient'
import { getOptionalSession } from '@/lib/dal'

interface ProduitDetail {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  boutique_nom: string
  boutique_telephone: string | null
  boutique_whatsapp: string | null
  boutique_ville: string
  boutique_logo: string | null
}

const CARAC_LABELS: Record<string, string> = {
  marque: 'Marque', modele: 'Modèle', stockage: 'Stockage', ram: 'RAM',
  couleur: 'Couleur', etat: 'État', processeur: 'Processeur',
  type_article: 'Type d\'article', taille: 'Taille', genre: 'Genre',
  matiere: 'Matière', dimensions: 'Dimensions', annee: 'Année',
  kilometrage: 'Kilométrage', carburant: 'Carburant', plateforme: 'Plateforme',
  editeur: 'Éditeur', poids_quantite: 'Poids / Quantité',
  conditionnement: 'Conditionnement', date_peremption: 'Date de péremption',
  type_produit: 'Type', pour_qui: 'Pour qui', contenance: 'Contenance',
  type_service: 'Type de service', zone_intervention: 'Zone d\'intervention',
  duree: 'Durée', disponibilite: 'Disponibilité',
}

export async function generateMetadata(
  { params }: { params: { id: string; produitId: string } }
): Promise<Metadata> {
  try {
    const { produit } = await apiFetch<{ produit: ProduitDetail }>(
      `/boutiques/${params.id}/produits/${params.produitId}`
    )
    return {
      title: `${produit.nom} — ${produit.boutique_nom} | Nopalou`,
      description: produit.description ?? `${produit.nom} disponible chez ${produit.boutique_nom} à ${produit.boutique_ville}`,
      openGraph: produit.images?.[0] ? { images: [produit.images[0]] } : undefined,
    }
  } catch {
    return { title: 'Produit — Nopalou' }
  }
}

export default async function FicheProduitPage(
  { params }: { params: { id: string; produitId: string } }
) {
  let produit: ProduitDetail
  const session = await getOptionalSession()

  try {
    const data = await apiFetch<{ produit: ProduitDetail }>(
      `/boutiques/${params.id}/produits/${params.produitId}`
    )
    produit = data.produit
  } catch {
    notFound()
  }

  const p = produit!

  const waContact = p.boutique_whatsapp || p.boutique_telephone
  const waUrl = waContact
    ? `https://wa.me/${waContact.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par :\n\n*${p.nom}*${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${params.id}/produits/${params.produitId}`)}`
    : null
  const telUrl = p.boutique_telephone ? `tel:${p.boutique_telephone}` : null

  const remise = p.prix && p.prix_barre && p.prix_barre > p.prix
    ? Math.round((1 - p.prix / p.prix_barre) * 100)
    : null

  const caracEntries = p.caracteristiques
    ? Object.entries(p.caracteristiques).filter(([, v]) => v?.trim())
    : []

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px 48px' }}>

      {/* Fil d'Ariane */}
      <nav style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Link href="/boutiques" style={{ color: '#6b7280', textDecoration: 'none' }}>Boutiques</Link>
        <span>›</span>
        <Link href={`/boutiques/${params.id}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{p.boutique_nom}</Link>
        <span>›</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{p.nom}</span>
      </nav>

      {/* Layout principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

        {/* ── Galerie ────────────────────────── */}
        <GalerieClient images={p.images} nom={p.nom} enStock={p.en_stock} />

        {/* ── Infos produit ──────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* En-tête */}
          <div>
            {p.caracteristiques?.marque && (
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {p.caracteristiques.marque}
              </p>
            )}
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              {p.nom}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: p.en_stock ? '#dcfce7' : '#fee2e2',
                color: p.en_stock ? '#16a34a' : '#dc2626',
              }}>
                {p.en_stock ? '✅ En stock' : '❌ Rupture de stock'}
              </span>
              {p.categorie && (
                <span style={{ fontSize: 12, color: '#9ca3af', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
                  {p.categorie}
                </span>
              )}
            </div>
          </div>

          {/* Prix */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            {p.prix
              ? <span style={{ fontSize: 30, fontWeight: 900, color: '#C75B00' }}>{fcfa(p.prix)}</span>
              : <span style={{ fontSize: 18, color: '#6b7280' }}>Prix à négocier</span>
            }
            {p.prix_barre && (
              <span style={{ fontSize: 18, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>
            )}
            {remise && (
              <span style={{ fontSize: 14, background: '#dcfce7', color: '#16a34a', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                -{remise}% de remise
              </span>
            )}
          </div>

          {/* Caractéristiques */}
          {caracEntries.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Caractéristiques
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {caracEntries.map(([k, v], i) => (
                    <tr key={k} style={{ borderTop: i > 0 ? '1px solid #e2e8f0' : 'none' }}>
                      <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 700, color: '#374151', width: '45%', verticalAlign: 'top' }}>
                        {CARAC_LABELS[k] ?? k}
                      </td>
                      <td style={{ padding: '8px 0', fontSize: 13, color: '#4b5563', textTransform: k === 'etat' ? 'capitalize' : 'none' }}>
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Description
              </p>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                {p.description}
              </p>
            </div>
          )}

          {/* Boutique vendeur */}
          <Link
            href={`/boutiques/${params.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 12, padding: '12px 16px', textDecoration: 'none',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.boutique_logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={cloudinaryHQ(p.boutique_logo, { width: 80 })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20 }}>🏪</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{p.boutique_nom}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>📍 {p.boutique_ville} · Voir la boutique →</p>
            </div>
          </Link>

          {/* CTA contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: '#25d366', color: '#fff', padding: '14px 24px',
                  borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 16,
                  boxShadow: '0 4px 14px rgba(37,211,102,.3)',
                }}
              >
                💬 Commander via WhatsApp
              </a>
            )}
            {telUrl && (
              <a
                href={telUrl}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: '#fff', color: '#1d4ed8', border: '2px solid #bfdbfe',
                  padding: '13px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15,
                }}
              >
                📞 Appeler le vendeur
              </a>
            )}
          </div>

        </div>
      </div>

      {/* Retour boutique */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
        <Link href={`/boutiques/${params.id}`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>
          ← Retour à la boutique {p.boutique_nom}
        </Link>
      </div>
    </div>
  )
}
