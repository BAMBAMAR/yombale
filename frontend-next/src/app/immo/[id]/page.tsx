import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';

// ── Types ────────────────────────────────────────────────────────

interface AnnonceImmo {
  id: number;
  titre: string;
  prix: number | null;
  ville: string | null;
  quartier: string | null;
  region: string | null;
  type_bien: string | null;
  type_offre: string | null;
  surface: number | null;
  nb_pieces: number | null;
  nb_chambres: number | null;
  description: string | null;
  url_source: string | null;
  vendeur: string | null;
  date_publication: string | null;
  image_url: string | null;
}

// ── generateMetadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const annonce = await apiFetch<AnnonceImmo>(`/immo/${params.id}`);
    const localisation = [annonce.quartier, annonce.ville, annonce.region]
      .filter(Boolean)
      .join(', ');
    const titre = `${annonce.titre}${localisation ? ` — ${localisation}` : ''} | Nopalou Immo`;
    const description =
      annonce.description
        ? annonce.description.slice(0, 155)
        : `${annonce.type_bien ?? 'Bien'} à ${annonce.type_offre ?? 'louer/vendre'} à ${localisation || 'Sénégal'}. Prix : ${fcfa(annonce.prix)}.`;

    return {
      title: titre,
      description,
      openGraph: {
        title: titre,
        description,
        type: 'website',
        ...(annonce.image_url ? { images: [{ url: annonce.image_url }] } : {}),
      },
    };
  } catch {
    return {
      title: 'Annonce introuvable',
    };
  }
}

// ── Page ─────────────────────────────────────────────────────────

export default async function FicheImmoPage({
  params,
}: {
  params: { id: string };
}) {
  let annonce: AnnonceImmo;

  try {
    annonce = await apiFetch<AnnonceImmo>(`/immo/${params.id}`);
  } catch {
    notFound();
  }

  const localisation = [annonce.quartier, annonce.ville, annonce.region]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="fiche-immo">
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
        <Link href="/immo">Immobilier</Link>
        {' › '}
        <span>{annonce.titre}</span>
      </p>

      {/* Hero */}
      <div className="fiche-immo-hero">
        {annonce.image_url && (
          <div style={{ position: 'relative', width: '100%', height: '320px', marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg)' }}>
            <Image
              src={annonce.image_url}
              alt={annonce.titre}
              fill
              sizes="(max-width: 860px) 90vw, 820px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}
        {annonce.type_bien && (
          <span
            className="type-badge"
            style={{ display: 'inline-block', marginBottom: '12px' }}
          >
            {annonce.type_bien}
            {annonce.type_offre ? ` · ${annonce.type_offre}` : ''}
          </span>
        )}

        <h1>{annonce.titre}</h1>

        {/* Méta-données */}
        <div className="meta-row">
          {localisation && (
            <span className="meta-chip">
              Localisation : <strong>{localisation}</strong>
            </span>
          )}
          {annonce.surface && (
            <span className="meta-chip">
              Surface : <strong>{annonce.surface} m²</strong>
            </span>
          )}
          {annonce.nb_pieces && (
            <span className="meta-chip">
              Pièces : <strong>{annonce.nb_pieces}</strong>
            </span>
          )}
          {annonce.nb_chambres && (
            <span className="meta-chip">
              Chambres : <strong>{annonce.nb_chambres}</strong>
            </span>
          )}
          {annonce.vendeur && (
            <span className="meta-chip">
              Agence : <strong>{annonce.vendeur}</strong>
            </span>
          )}
          {annonce.date_publication && (
            <span className="meta-chip">
              Publié le :{' '}
              <strong>
                {new Date(annonce.date_publication).toLocaleDateString('fr-FR')}
              </strong>
            </span>
          )}
        </div>

        {/* Prix */}
        <p
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: 'var(--blue)',
            marginBottom: '4px',
          }}
        >
          {fcfa(annonce.prix)}
        </p>
        {annonce.type_offre?.toLowerCase().includes('locat') && (
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>par mois</p>
        )}

        {/* Description */}
        {annonce.description && (
          <p className="description">{annonce.description}</p>
        )}

        {/* Lien source */}
        {annonce.url_source && (
          <div style={{ marginTop: '20px' }}>
            <a
              href={annonce.url_source}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'var(--blue)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Voir l&apos;annonce originale →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
