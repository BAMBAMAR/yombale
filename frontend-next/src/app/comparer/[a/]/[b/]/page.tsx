import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema } from '@/lib/schema-org';

interface PageParams {
  a: string;
  b: string;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  return {
    title: `Comparer ${decodeURIComponent(params.a)} vs ${decodeURIComponent(params.b)} | Nopalou`,
    description: `Comparaison détaillée : ${decodeURIComponent(params.a)} vs ${decodeURIComponent(params.b)}. Trouvez le meilleur prix au Sénégal.`,
  };
}

interface Produit {
  id: string;
  nom: string;
  categorie_nom: string;
  marque?: string;
  prix_min: number;
  nb_offres: number;
}

interface ApiResponse {
  produits?: Produit[];
  data?: Produit[];
}

export default async function ComparerPage({ params }: { params: PageParams }) {
  const produitAName = decodeURIComponent(params.a);
  const produitBName = decodeURIComponent(params.b);

  let produitA: Produit | undefined;
  let produitB: Produit | undefined;

  try {
    // Rechercher les deux produits par nom (first match)
    const [resA, resB] = await Promise.all([
      apiFetch<ApiResponse>(`/produits?q=${encodeURIComponent(produitAName)}&limit=1`),
      apiFetch<ApiResponse>(`/produits?q=${encodeURIComponent(produitBName)}&limit=1`),
    ]);

    const listA: Produit[] = Array.isArray(resA) ? resA : (resA?.produits || resA?.data || []);
    const listB: Produit[] = Array.isArray(resB) ? resB : (resB?.produits || resB?.data || []);

    if (listA.length === 0 || listB.length === 0) {
      notFound();
    }

    produitA = listA[0];
    produitB = listB[0];
  } catch {
    notFound();
  }

  if (!produitA || !produitB) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Comparaison', url: '/comparaison' },
  ];

  return (
    <div className="page-container">
      <JsonLd schema={breadcrumbSchema(breadcrumbs)} />

      <nav className="breadcrumb">
        {breadcrumbs.map((bc, i) => (
          <div key={i}>
            <Link href={bc.url}>{bc.name}</Link>
            {i < breadcrumbs.length - 1 && ' / '}
          </div>
        ))}
      </nav>

      <h1>Comparer : {produitAName} vs {produitBName}</h1>

      <div className="comparison-grid">
        <div className="comparison-column">
          <h2>{produitA.nom}</h2>
          <p className="comparison-price">{fcfa(produitA.prix_min)}</p>
          <p className="comparison-offers">{produitA.nb_offres} offres</p>
          <Link href={`/produit/${produitA.id}`} className="button-primary">
            Voir la fiche
          </Link>
        </div>

        <div className="comparison-vs">VS</div>

        <div className="comparison-column">
          <h2>{produitB.nom}</h2>
          <p className="comparison-price">{fcfa(produitB.prix_min)}</p>
          <p className="comparison-offers">{produitB.nb_offres} offres</p>
          <Link href={`/produit/${produitB.id}`} className="button-primary">
            Voir la fiche
          </Link>
        </div>
      </div>

      <div className="comparison-table">
        <table>
          <tbody>
            <tr>
              <td>Catégorie</td>
              <td>{produitA.categorie_nom}</td>
              <td>{produitB.categorie_nom}</td>
            </tr>
            <tr>
              <td>Marque</td>
              <td>{produitA.marque || '—'}</td>
              <td>{produitB.marque || '—'}</td>
            </tr>
            <tr>
              <td>Prix le moins cher</td>
              <td className="price">{fcfa(produitA.prix_min)}</td>
              <td className="price">{fcfa(produitB.prix_min)}</td>
            </tr>
            <tr>
              <td>Différence</td>
              <td colSpan={2} className="price">
                {fcfa(Math.abs(produitA.prix_min - produitB.prix_min))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Link href="/comparaison" className="button-link">
        ← Retour à la comparaison
      </Link>
    </div>
  );
}
