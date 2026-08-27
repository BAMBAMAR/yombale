import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import GalerieClient from './GalerieClient'
import ProduitCTA from './ProduitCTA'
import BoutonPartager from '@/components/BoutonPartager'
import CardActions from '@/app/CardActions'
import PageHeader from '@/components/PageHeader'


interface ProduitDetail {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  stock_quantite?: number | null
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes: { nom: string; valeurs: string[] }[] | null
  variantes_skus?: { id: string; sku?: string; code_barre?: string; attributs: Record<string, string>; prix: number; prix_barre?: number; stock_quantite?: number; image_url?: string }[] | null
  unite_vente?: string | null
  has_variants?: boolean
  date_expiration?: string | null
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
  concentration: 'Concentration', famille_olfactive: 'Famille olfactive',
  forme_monture: 'Forme monture', protection_uv: 'Protection verres',
  type_service: 'Type de service', zone_intervention: 'Zone d\'intervention',
  duree: 'Durée', disponibilite: 'Disponibilité',
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; produitId: string }> }
): Promise<Metadata> {
  try {
    const { id, produitId } = await params
    const { produit } = await apiFetch<{ produit: ProduitDetail }>(
      `/boutiques/${id}/produits/${produitId}`
    )
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
    const ogImageUrl = `${siteUrl}/assets/produit-boutique/${produit.id}/og?boutiqueId=${id}`
    const desc = produit.description ? produit.description.slice(0, 160) : `${produit.nom} disponible chez ${produit.boutique_nom} à ${produit.boutique_ville}.`

    return {
      title: `${produit.nom} — ${produit.boutique_nom}`,
      description: desc,
      openGraph: {
        title: `${produit.nom} — ${produit.boutique_nom}`,
        description: desc,
        url: `${siteUrl}/boutiques/${id}/produits/${produitId}`,
        siteName: produit.boutique_nom,
        type: 'website',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${produit.nom} — ${produit.boutique_nom}`,
          },
          ...(produit.images?.[0] ? [{ url: produit.images[0], alt: produit.nom }] : []),
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${produit.nom} — ${produit.boutique_nom}`,
        description: desc,
        images: [ogImageUrl],
      },
    }
  } catch {
    return { title: 'Produit' }
  }
}

export default async function FicheProduitPage(
  { params }: { params: Promise<{ id: string; produitId: string }> }
) {
  const { id, produitId } = await params
  if (!id || !produitId) redirect('/boutiques')

  let produit: ProduitDetail

  try {
    const data = await apiFetch<{ produit: ProduitDetail }>(
      `/boutiques/${id}/produits/${produitId}`
    )
    produit = data.produit
  } catch {
    // Si le produit n'est pas trouvé sous cette boutique, tenter de résoudre le produit pour obtenir sa boutique canonique
    try {
      const resolved = await apiFetch<{ found: boolean; type: string; url: string }>(`/entites/resoudre/${encodeURIComponent(produitId)}`);
      if (resolved && resolved.found && resolved.url && resolved.url !== `/boutiques/${id}/produits/${produitId}`) {
        redirect(resolved.url);
      }
    } catch (rErr) {
      if ((rErr as any)?.digest?.startsWith('NEXT_REDIRECT')) throw rErr;
    }

    redirect(`/boutiques/${id}`)
  }

  const p = produit!

  const waContact = p.boutique_whatsapp || p.boutique_telephone
  const waUrl = waContact
    ? `https://wa.me/${waContact.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par :\n\n*${p.nom}*${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${id}/produits/${produitId}`)}`
    : null
  const telUrl = p.boutique_telephone ? `tel:${p.boutique_telephone}` : null

  const isEnStock = (p.stock_quantite != null) ? Number(p.stock_quantite) > 0 : (p.en_stock !== false)

  const remise = p.prix && p.prix_barre && p.prix_barre > p.prix
    ? Math.round((1 - p.prix / p.prix_barre) * 100)
    : null

  const caracEntries = p.caracteristiques
    ? Object.entries(p.caracteristiques).filter(([, v]) => v?.trim())
    : []

  return (
    <div className="boutique-produit-page">

      <div style={{ marginBottom: 24 }}>
        <PageHeader
          breadcrumb={[
            { label: 'Boutiques', href: '/boutiques' },
            { label: p.boutique_nom, href: `/boutiques/${id}` },
            { label: p.nom }
          ]}
          titre=""
        />
      </div>

      {/* Layout principal */}
      <div className="boutique-produit-layout">

        {/* ── Galerie ────────────────────────── */}
        <GalerieClient images={p.images} nom={p.nom} enStock={isEnStock} />

        {/* ── Infos produit ──────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* En-tête */}
          <div>
            {p.caracteristiques?.marque && (
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {p.caracteristiques.marque}
              </p>
            )}
            <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              {p.nom}
            </h1>
            <div style={{ marginTop: 8, maxWidth: 200 }}>
              <CardActions id={p.id} nom={p.nom} type="boutique_produit" boutiqueId={id} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: isEnStock ? '#dcfce7' : '#fee2e2',
                color: isEnStock ? '#16a34a' : '#dc2626',
              }}>
                {isEnStock ? '✅ En stock' : '❌ Rupture de stock'}
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
            href={`/boutiques/${id}`}
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

          {/* CTA */}
          <ProduitCTA
            boutiqueId={id}
            boutiqueNom={p.boutique_nom}
            produit={{ id: p.id, nom: p.nom, prix: p.prix, images: p.images, prix_barre: p.prix_barre }}
            enStock={isEnStock}
            waUrl={waUrl}
            telUrl={telUrl}
            variantes={p.variantes ?? []}
            variantesSkus={p.variantes_skus ?? []}
            uniteVente={p.unite_vente}
          />

          <BoutonPartager
            lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${id}/produits/${produitId}`}
            message={`${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${id}/produits/${produitId}`}
            lienVisuel={`/assets/produit-boutique/${produitId}/story?boutiqueId=${id}`}
          />

        </div>
      </div>
    </div>
  )
}
