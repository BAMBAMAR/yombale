import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';

// ── Types ────────────────────────────────────────────────────────

interface AnnonceImmo {
  id: string;
  titre: string;
  prix: number | null;
  ville: string | null;
  quartier: string | null;
  type_bien: string | null;
  transaction: string | null;
  surface_m2: number | null;
  nb_pieces: number | null;
  nb_chambres: number | null;
  description: string | null;
  url_source: string | null;
  contact_nom: string | null;
  contact_tel: string | null;
  created_at: string | null;
  photos: string[] | null;
  source: string | null;
}

// ── generateMetadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const annonce = await apiFetch<AnnonceImmo>(`/immo/${params.id}`);
    const localisation = [annonce.quartier, annonce.ville].filter(Boolean).join(', ');
    const titre = `${annonce.titre}${localisation ? ` — ${localisation}` : ''} | Nopalou Immo`;
    const description =
      annonce.description
        ? annonce.description.slice(0, 155)
        : `${annonce.type_bien ?? 'Bien'} à ${annonce.transaction ?? 'louer/vendre'} à ${localisation || 'Sénégal'}. Prix : ${fcfa(annonce.prix)}.`;
    const mainPhoto = Array.isArray(annonce.photos) ? annonce.photos[0] : null;

    return {
      title: titre,
      description,
      openGraph: {
        title: titre,
        description,
        type: 'website',
        ...(mainPhoto ? { images: [{ url: mainPhoto }] } : {}),
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

  const localisation = [annonce.quartier, annonce.ville].filter(Boolean).join(', ');
  const photos = Array.isArray(annonce.photos) ? annonce.photos : [];
  const mainPhoto = photos[0] ?? null;

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
        {/* Photo principale */}
        {mainPhoto && (
          <div style={{ position: 'relative', width: '100%', height: '360px', marginBottom: '12px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg)' }}>
            <Image
              src={mainPhoto}
              alt={annonce.titre}
              fill
              sizes="(max-width: 860px) 90vw, 820px"
              style={{ objectFit: 'cover' }}
              priority
              unoptimized
            />
          </div>
        )}
        {/* Galerie miniatures */}
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
            {photos.slice(1).map((url, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0, width: 100, height: 72, borderRadius: 6, overflow: 'hidden', background: 'var(--bg)' }}>
                <Image src={url} alt={`Photo ${i + 2}`} fill sizes="100px" style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
        )}
        {annonce.type_bien && (
          <span
            className="type-badge"
            style={{ display: 'inline-block', marginBottom: '12px' }}
          >
            {annonce.type_bien}
            {annonce.transaction ? ` · ${annonce.transaction}` : ''}
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
          {annonce.surface_m2 && (
            <span className="meta-chip">
              Surface : <strong>{annonce.surface_m2} m²</strong>
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
          {annonce.contact_nom && (
            <span className="meta-chip">
              Contact : <strong>{annonce.contact_nom}</strong>
            </span>
          )}
          {annonce.created_at && (
            <span className="meta-chip">
              Publié le :{' '}
              <strong>
                {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
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
        {annonce.transaction?.toLowerCase().includes('locat') && (
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>par mois</p>
        )}

        {/* Description */}
        {annonce.description && (
          <p className="description">{annonce.description}</p>
        )}

        {/* Contact */}
        {annonce.contact_tel && (
          <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: 10, padding: '16px 20px', marginTop: 20 }}>
            {annonce.contact_nom && <p style={{ fontWeight: 700, marginBottom: 8 }}>{annonce.contact_nom}</p>}
            <a href={`tel:${annonce.contact_tel}`} style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
              📞 {annonce.contact_tel}
            </a>
            <a
              href={`https://wa.me/${annonce.contact_tel.replace(/\D/g, '')}?text=Bonjour, je suis intéressé par votre annonce : ${annonce.titre}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 8, color: '#25d366', fontWeight: 600 }}
            >
              💬 WhatsApp
            </a>
          </div>
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
