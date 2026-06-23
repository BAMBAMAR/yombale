import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { fcfa, escapeHtml } from '@/lib/format';

// ── Types ────────────────────────────────────────────────────────

interface Produit {
  id: number;
  nom: string;
  marque: string | null;
  categorie: string | null;
  description: string | null;
  prix_min: number | null;
  prix_max: number | null;
  nb_offres: number | null;
  image_url: string | null;
}

interface Offre {
  id: number;
  vendeur: string | null;
  prix: number | null;
  url: string | null;
  disponible: boolean | null;
  date_maj: string | null;
}

interface OffresResponse {
  offres?: Offre[];
  data?: Offre[];
}

// ── generateMetadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const produit = await apiFetch<Produit>(`/produits/${params.id}`);
    const titre = `${produit.nom}${produit.marque ? ` — ${produit.marque}` : ''} | Prix au Sénégal`;
    const description = produit.description
      ? produit.description.slice(0, 155)
      : `Comparez le prix de ${produit.nom} chez tous les vendeurs au Sénégal. Prix à partir de ${fcfa(produit.prix_min)}.`;

    return {
      title: titre,
      description,
      openGraph: {
        title: titre,
        description,
        type: 'website',
        ...(produit.image_url ? { images: [{ url: produit.image_url }] } : {}),
      },
    };
  } catch {
    return {
      title: 'Produit introuvable',
    };
  }
}

// ── generateStaticParams (à activer quand DB accessible en build) ─
//
// export async function generateStaticParams() {
//   const produits = await apiFetch<{ id: number }[]>('/produits?limit=200&page=1');
//   return (Array.isArray(produits) ? produits : []).map((p) => ({
//     id: String(p.id),
//   }));
// }

// ── JSON-LD Schema.org ────────────────────────────────────────────

function buildJsonLd(produit: Produit, offres: Offre[]): string {
  const offers = offres
    .filter((o) => o.prix != null)
    .map((o) => ({
      '@type': 'Offer',
      price: o.prix,
      priceCurrency: 'XOF',
      availability: o.disponible === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: o.vendeur
        ? { '@type': 'Organization', name: escapeHtml(o.vendeur) }
        : undefined,
      url: o.url ?? undefined,
    }));

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produit.nom,
    ...(produit.marque ? { brand: { '@type': 'Brand', name: produit.marque } } : {}),
    ...(produit.description ? { description: produit.description } : {}),
    ...(produit.image_url ? { image: produit.image_url } : {}),
    offers: offers.length === 1 ? offers[0] : offers,
  };

  return JSON.stringify(ld);
}

// ── Page ─────────────────────────────────────────────────────────

export default async function FicheProduitPage({
  params,
}: {
  params: { id: string };
}) {
  let produit: Produit;
  let offres: Offre[] = [];

  try {
    produit = await apiFetch<Produit>(`/produits/${params.id}`);
  } catch {
    notFound();
  }

  try {
    const raw = await apiFetch<OffresResponse | Offre[]>(
      `/produits/${params.id}/offres`
    );
    if (Array.isArray(raw)) {
      offres = raw;
    } else {
      offres = raw.offres ?? raw.data ?? [];
    }
  } catch {
    // Les offres sont optionnelles — on continue sans elles
  }

  const jsonLd = buildJsonLd(produit, offres);

  return (
    <>
      {/* JSON-LD Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="fiche">
        {/* Fil d'Ariane */}
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text3)',
            marginBottom: '16px',
          }}
        >
          <Link href="/">Accueil</Link>
          {' › '}
          {produit.categorie && (
            <>
              <span>{produit.categorie}</span>
              {' › '}
            </>
          )}
          <span>{produit.nom}</span>
        </p>

        {/* Hero */}
        <div className="fiche-hero">
          {produit.image_url && (
            <div style={{ position: 'relative', width: '100%', height: '280px', marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg)' }}>
              <Image
                src={produit.image_url}
                alt={produit.nom}
                fill
                sizes="(max-width: 900px) 90vw, 860px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          )}
          {produit.marque && (
            <span className="marque-badge">{produit.marque}</span>
          )}
          <h1>{produit.nom}</h1>

          {produit.prix_min && (
            <>
              <p className="prix-min">{fcfa(produit.prix_min)}</p>
              <p className="prix-label">
                Prix le plus bas
                {produit.prix_max && produit.prix_max !== produit.prix_min
                  ? ` · jusqu'à ${fcfa(produit.prix_max)}`
                  : ''}
              </p>
            </>
          )}

          {produit.description && (
            <p
              style={{
                marginTop: '16px',
                fontSize: '14px',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}
            >
              {produit.description}
            </p>
          )}
        </div>

        {/* Tableau des offres */}
        {offres.length > 0 && (
          <div className="tableau-offres">
            <h2>
              {offres.length} offre{offres.length > 1 ? 's' : ''} disponible
              {offres.length > 1 ? 's' : ''}
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Prix</th>
                  <th>Disponibilité</th>
                  <th>Mise à jour</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {offres.map((o) => (
                  <tr key={o.id}>
                    <td>{o.vendeur ?? '—'}</td>
                    <td className="prix-offre">{fcfa(o.prix)}</td>
                    <td>
                      {o.disponible === false ? (
                        <span style={{ color: 'var(--red)', fontSize: '13px' }}>
                          Indisponible
                        </span>
                      ) : (
                        <span style={{ color: 'var(--green)', fontSize: '13px' }}>
                          En stock
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {o.date_maj
                        ? new Date(o.date_maj).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td>
                      {o.url && (
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '13px',
                            color: 'var(--blue2)',
                            fontWeight: 600,
                          }}
                        >
                          Voir l'offre →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {offres.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px',
              color: 'var(--text3)',
              fontSize: '14px',
            }}
          >
            Aucune offre trouvée pour ce produit.
          </div>
        )}
      </div>
    </>
  );
}
