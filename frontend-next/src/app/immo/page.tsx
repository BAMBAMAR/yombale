import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Immobilier au Sénégal',
  description:
    'Annonces immobilières au Sénégal : appartements, villas, terrains à louer ou à vendre à Dakar et dans tout le pays.',
};

interface AnnonceImmo {
  id: number;
  titre: string;
  prix: number | null;
  ville: string | null;
  quartier: string | null;
  type_bien: string | null;
  type_offre: string | null;
  surface: number | null;
  nb_pieces: number | null;
}

interface ApiResponse {
  annonces?: AnnonceImmo[];
  data?: AnnonceImmo[];
}

export default async function ImmoPage() {
  let annonces: AnnonceImmo[] = [];
  let erreur: string | null = null;

  try {
    const data = await apiFetch<ApiResponse | AnnonceImmo[]>('/immo?limit=20&page=1');
    if (Array.isArray(data)) {
      annonces = data;
    } else {
      annonces = data.annonces ?? data.data ?? [];
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'Erreur inconnue';
  }

  return (
    <>
      <div className="page-header">
        <h1>Immobilier au Sénégal</h1>
        <p>
          {annonces.length > 0
            ? `${annonces.length} annonces disponibles`
            : 'Chargement des annonces…'}
        </p>
      </div>

      {erreur && (
        <div className="erreur-page">
          <h2>Impossible de charger les annonces</h2>
          <p>{erreur}</p>
        </div>
      )}

      {!erreur && (
        <div className="grid-immo">
          {annonces.map((a) => (
            <Link key={a.id} href={`/immo/${a.id}`} style={{ display: 'contents' }}>
              <article className="card-immo">
                {a.type_bien && (
                  <span className="type-badge">{a.type_bien}</span>
                )}
                <p className="titre">{a.titre}</p>
                <p className="localisation">
                  {[a.quartier, a.ville].filter(Boolean).join(', ') || 'Sénégal'}
                </p>
                <p className="prix-immo">{fcfa(a.prix)}</p>
                {(a.surface || a.nb_pieces) && (
                  <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
                    {a.surface ? `${a.surface} m²` : ''}
                    {a.surface && a.nb_pieces ? ' · ' : ''}
                    {a.nb_pieces ? `${a.nb_pieces} pièce${a.nb_pieces > 1 ? 's' : ''}` : ''}
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
