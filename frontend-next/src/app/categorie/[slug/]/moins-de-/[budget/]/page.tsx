import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';
import ExternalImg from '@/components/ExternalImg';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema } from '@/lib/schema-org';

interface PageParams {
  slug: string;
  budget: string;
}

const CATEGORIES = {
  smartphones: 'Téléphones',
  informatique: 'Informatique',
  'tv-electro': 'TV & Électroménager',
  mode: 'Mode',
  maison: 'Maison',
  'auto-moto': 'Auto & Moto',
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const catLabel = CATEGORIES[params.slug as keyof typeof CATEGORIES] || params.slug;
  const budgetNum = parseInt(params.budget) || 100000;

  return {
    title: `${catLabel} moins de ${fcfa(budgetNum)} | Nopalou`,
    description: `Découvrez les ${catLabel.toLowerCase()} au Sénégal à moins de ${fcfa(budgetNum)}. Comparez les meilleurs prix.`,
  };
}

interface Produit {
  id: string;
  nom: string;
  image_url?: string;
  marque?: string;
  prix_min: number;
  nb_offres: number;
}

interface ApiResponse {
  produits?: Produit[];
  data?: Produit[];
}

export default async function BudgetCategoryPage({ params }: { params: PageParams }) {
  const catLabel = CATEGORIES[params.slug as keyof typeof CATEGORIES] || params.slug;
  const budgetNum = parseInt(params.budget) || 100000;

  let produits: Produit[] = [];

  try {
    const res = await apiFetch<ApiResponse>(`/produits?categorie=${params.slug}&prixMax=${budgetNum}&limit=40`);
    produits = Array.isArray(res) ? res : (res?.produits || res?.data || []);
  } catch {
    produits = [];
  }

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: catLabel, url: `/categorie/${params.slug}` },
    { name: `Moins de ${fcfa(budgetNum)}`, url: `` },
  ];

  return (
    <div className="page-container">
      <JsonLd schema={breadcrumbSchema(breadcrumbs)} />

      <h1>{catLabel} — Moins de {fcfa(budgetNum)}</h1>
      <p className="subtitle">
        {produits.length} produits trouvés au Sénégal dans cette gamme de prix.
      </p>

      {produits.length === 0 ? (
        <div className="empty">Aucun produit trouvé dans cette gamme de prix.</div>
      ) : (
        <div className="grid-produits">
          {produits.map((p: Produit) => (
            <Link key={p.id} href={`/produit/${p.id}`} className="card-produit">
              {p.image_url && (
                <ExternalImg
                  src={p.image_url}
                  alt={p.nom}
                  width={200}
                  height={200}
                  style={{ objectFit: 'contain', height: '140px' }}
                />
              )}
              <h3>{p.nom}</h3>
              <p className="card-brand">{p.marque || '—'}</p>
              <p className="card-prix">{fcfa(p.prix_min)}</p>
              <p className="card-offres">{p.nb_offres} offres</p>
            </Link>
          ))}
        </div>
      )}

      <Link href={`/categorie/${params.slug}`} className="button-link">
        ← Retour à {catLabel}
      </Link>
    </div>
  );
}
