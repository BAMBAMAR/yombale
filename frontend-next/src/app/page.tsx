import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Nopalou — Comparateur de prix Sénégal',
  description:
    'Comparez les prix de milliers de produits au Sénégal. Économisez en trouvant les meilleures offres du marché sénégalais.',
};

interface Produit {
  id: number;
  nom: string;
  marque: string | null;
  categorie: string | null;
  prix_min: number | null;
  nb_offres: number | null;
}

interface ApiResponse {
  produits?: Produit[];
  data?: Produit[];
}

export default async function HomePage() {
  let produits: Produit[] = [];
  let erreur: string | null = null;

  try {
    const data = await apiFetch<ApiResponse | Produit[]>('/produits?limit=20&page=1');
    if (Array.isArray(data)) {
      produits = data;
    } else {
      produits = data.produits ?? data.data ?? [];
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'Erreur inconnue';
  }

  return (
    <>
      <div className="page-header">
        <h1>Comparer les prix au Sénégal</h1>
        <p>
          {produits.length > 0
            ? `${produits.length} produits affichés — trouvez la meilleure offre`
            : 'Chargement des produits…'}
        </p>
      </div>

      {erreur && (
        <div className="erreur-page">
          <h2>Impossible de charger les produits</h2>
          <p>{erreur}</p>
        </div>
      )}

      {!erreur && (
        <div className="grid-produits">
          {produits.map((p) => (
            <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
              <article className="card-produit">
                {p.marque && <p className="marque">{p.marque}</p>}
                <p className="nom">{p.nom}</p>
                <p className="prix">{fcfa(p.prix_min)}</p>
                {p.nb_offres != null && p.nb_offres > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {p.nb_offres} offre{p.nb_offres > 1 ? 's' : ''}
                  </p>
                )}
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
