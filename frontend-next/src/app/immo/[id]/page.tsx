import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';
import { getOptionalSession } from '@/lib/dal';
import { cloudinaryHQ } from '@/lib/cloudinary';
import BoutonWhatsApp from '@/components/BoutonWhatsApp';
import SimilRow from '@/components/SimilRow';
import { sanitizeImgUrl } from '@/lib/sanitizeImg';
import PageHeader from '@/components/PageHeader';
import { Scale } from 'lucide-react';
import { AgenceInfo, AgentInfo } from './BlocAgenceAnnonce';
import FicheImmoSidebar from './FicheImmoSidebar';
import GaleriePhotosFiche from './GaleriePhotosFiche';
import SectionVideoImmo from './SectionVideoImmo';

export const dynamic = 'force-dynamic';

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
  videos?: string[] | null;
  source: string | null;
  utilisateur_id: string | null;
  sponsorisee: boolean | null;
  sponsorisee_jusqu_au: string | null;
  agence_id?: string | null;
  agence?: AgenceInfo | null;
  agent?: AgentInfo | null;
}

interface AnnonceSimilaire {
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
  photos: string[] | null;
}

// ── JSON-LD ───────────────────────────────────────────────────────

function buildRealEstateJsonLd(annonce: AnnonceImmo): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: annonce.titre,
    description: annonce.description ?? undefined,
    url: `https://nopalou.com/immo/${annonce.id}`,
    ...(annonce.prix ? {
      offers: {
        '@type': 'Offer',
        price: annonce.prix,
        priceCurrency: 'XOF',
        availability: 'https://schema.org/InStock',
      },
    } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: annonce.ville ?? 'Dakar',
      addressRegion: annonce.ville ?? 'Dakar',
      addressCountry: 'SN',
      ...(annonce.quartier ? { streetAddress: annonce.quartier } : {}),
    },
    ...(Array.isArray(annonce.photos) && annonce.photos[0] ? {
      image: annonce.photos[0],
    } : {}),
  })
}

// ── generateMetadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    if (id === 'boutique') {
      return { title: 'Mes commandes' };
    }
    const annonce = await apiFetch<AnnonceImmo>(`/immo/${id}`);
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
    try {
      const { id } = await params;
      const resolved = await apiFetch<{ found: boolean; type: string; url: string }>(`/entites/resoudre/${encodeURIComponent(id)}`);
      if (resolved?.found) {
        return {
          title: 'Redirection en cours... | Nopalou',
        };
      }
    } catch (err) { console.warn('[Nopalou:page:L126]', err); }
    return {
      title: 'Annonce introuvable',
    };
  }
}

// ── Page ─────────────────────────────────────────────────────────

export default async function FicheImmoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) redirect('/immo');

  let annonce: AnnonceImmo;
  let similaires: AnnonceSimilaire[] = [];
  const session = await getOptionalSession();

  try {
    annonce = await apiFetch<AnnonceImmo>(`/immo/${id}`);
  } catch {
    // Résolution universelle d'entité : si le bouton Meta ou le lien pointe vers une boutique,
    // un produit marchand, une commande, une petite annonce, ou un alias, rediriger automatiquement.
    try {
      const resolved = await apiFetch<{ found: boolean; type: string; url: string }>(`/entites/resoudre/${encodeURIComponent(id)}`);
      if (resolved && resolved.found && resolved.url && resolved.url !== `/immo/${id}`) {
        redirect(resolved.url);
      }
    } catch (rErr) {
      if ((rErr as any)?.digest?.startsWith('NEXT_REDIRECT')) throw rErr;
    }

    // Si l'ID ne correspond à aucune annonce immo ni entité, rediriger vers l'accueil pour éviter une page incohérente
    redirect('/');
  }

  await apiFetch<{ annonces: AnnonceSimilaire[] }>(`/immo/${id}/similaires`)
    .then(raw => { similaires = raw?.annonces ?? []; })
    .catch(() => { similaires = []; });

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';
  let settings: Record<string, string> = {};
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' });
    if (r.ok) settings = await r.json();
  } catch {
    // handled by defaults in SponsoringImmoBtn
  }

  const localisation = [annonce.quartier, annonce.ville].filter(Boolean).join(', ');
  const photos = Array.isArray(annonce.photos) ? annonce.photos : [];
  const mainPhoto = photos[0] ?? null;
  const isOwner = Boolean(session && annonce.utilisateur_id && session.userId === annonce.utilisateur_id);
  const isSponsorise = Boolean(annonce.sponsorisee && annonce.sponsorisee_jusqu_au
    ? new Date(annonce.sponsorisee_jusqu_au) > new Date()
    : false);

  // Meilleur choix parmi les biens comparables — le moins cher du secteur, à type/transaction identiques
  const meilleurBien = annonce.prix ? similaires.reduce((best, s) => {
    if (s.prix == null) return best
    return (!best || s.prix < best.prix!) ? s : best
  }, null as AnnonceSimilaire | null) : null
  const proposerMeilleur = !!(meilleurBien && annonce.prix && meilleurBien.prix! < annonce.prix)
  const prixM2 = (annonce.prix && annonce.surface_m2) ? Math.round(annonce.prix / annonce.surface_m2) : null

  // Même sélection pré-remplie pour le bouton "Comparaison détaillée" du résumé
  // et celui en bas de la section "Biens comparables dans le secteur".
  const idsComparaison = [annonce.id, ...similaires.slice(0, 2).map(s => s.id)].join(',')

  return (
    <div className="fiche-immo">
      <PageHeader
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Immobilier', href: '/immo' },
          { label: annonce.titre }
        ]}
        titre={annonce.titre}
      />

      {/* Bandeau "meilleur choix" — pousse vers le bien comparable le moins cher du secteur */}
      {proposerMeilleur && meilleurBien && (
        <Link href={`/immo/${meilleurBien.id}`} className="meilleur-choix-banner">
          <div className="meilleur-choix-img">
            {meilleurBien.photos?.[0]
              ? <img src={sanitizeImgUrl(meilleurBien.photos[0])!} alt={meilleurBien.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span></span>
            }
          </div>
          <div className="meilleur-choix-info">
            <span className="meilleur-choix-label">Meilleur choix pour vous</span>
            <span className="meilleur-choix-nom">{meilleurBien.titre}</span>
            <span className="meilleur-choix-prix">
              {fcfa(meilleurBien.prix)}
              {annonce.prix && (
                <span className="meilleur-choix-eco"> · -{Math.round((annonce.prix - meilleurBien.prix!) / annonce.prix * 100)}%</span>
              )}
            </span>
          </div>
          <span className="meilleur-choix-cta">Voir ce bien →</span>
        </Link>
      )}

      {/* ── Layout 2 colonnes : galerie/description à gauche, prix/contact à droite ── */}
      <div className="fiche-grid">
        {/* Colonne principale */}
        <div className="fiche-main">
          <div className="fiche-immo-hero">
            {/* Galerie Photos avec Album Plein Écran et Slider */}
            <GaleriePhotosFiche photos={photos} titre={annonce.titre} />
            {annonce.type_bien && (
              <span
                className="type-badge"
                style={{ display: 'inline-block', marginBottom: '12px' }}
              >
                {annonce.type_bien}
                {annonce.transaction ? ` · ${annonce.transaction}` : ''}
              </span>
            )}



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

            {/* Description */}
            {annonce.description && (
              <p className="description">{annonce.description}</p>
            )}

            {/* Vidéo / Visite Virtuelle si disponible */}
            {Array.isArray(annonce.videos) && annonce.videos.length > 0 && (
              <SectionVideoImmo
                videos={annonce.videos}
                titre={annonce.titre}
                posterPhoto={photos[0] ?? null}
              />
            )}
          </div>
        </div>

        {/* Sidebar : résumé, prix, contact, actions */}
        <FicheImmoSidebar
          annonce={annonce}
          similaires={similaires}
          idsComparaison={idsComparaison}
          prixM2={prixM2}
          localisation={localisation}
          isOwner={isOwner}
          isSponsorise={Boolean(isSponsorise)}
          session={session ? { userId: session.userId } : null}
          settings={settings}
        />
      </div>

      {/* ── Comparaison automatique avec des biens similaires ───── */}
      {similaires.length > 0 && annonce.prix && (() => {
        const prixCourant = annonce.prix!
        const lignes = [
          { id: annonce.id, titre: annonce.titre, prix: prixCourant, surface_m2: annonce.surface_m2, photo: mainPhoto, courant: true },
          ...similaires.map(s => ({
            id: s.id, titre: s.titre, prix: s.prix, surface_m2: s.surface_m2,
            photo: s.photos?.[0] ?? null, courant: false,
          })),
        ].sort((a, b) => (a.prix ?? Infinity) - (b.prix ?? Infinity))

        const meilleurPrix = lignes[0]?.prix ?? prixCourant
        const courantEstMeilleur = meilleurPrix === prixCourant

        return (
          <section className="similaires-section">
            <h2 className="similaires-titre">Biens comparables dans le secteur</h2>
            <p className="similaires-sous-titre">
              {courantEstMeilleur
                ? 'Cette annonce a le prix le plus bas parmi les biens comparables.'
                : `Un bien comparable est disponible à partir de ${fcfa(meilleurPrix)} — voir ci-dessous.`}
            </p>
            <table className="similaires-table">
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Prix / m²</th>
                  <th>Prix</th>
                  <th>vs cette annonce</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, idx) => {
                  const ecartPct = (!l.courant && l.prix) ? Math.round((l.prix - prixCourant) / prixCourant * 100) : null
                  const prixM2 = (l.prix && l.surface_m2) ? Math.round(l.prix / l.surface_m2) : null
                  const isBest = idx === 0
                  return (
                    <SimilRow key={l.id} id={l.id} basePath="/immo" courant={l.courant}>
                      <td>
                        <div className="simil-produit-cell">
                          <div className="simil-img-wrap">
                            {l.photo
                              ? <img src={sanitizeImgUrl(l.photo)!} alt={l.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span></span>
                            }
                          </div>
                          <div>
                            <span className="simil-nom">{l.titre}</span>
                            {l.courant && <span className="simil-courant-badge">Cette annonce</span>}
                          </div>
                        </div>
                      </td>
                      <td>{prixM2 ? `${fcfa(prixM2)}/m²` : '—'}</td>
                      <td>
                        <span className={`simil-prix-val${isBest ? ' simil-prix-val--best' : ''}`}>
                          {l.prix ? fcfa(l.prix) : '—'}
                          {isBest && <span className="simil-best-ico"> </span>}
                        </span>
                      </td>
                      <td>
                        {l.courant ? (
                          <span className="simil-ecart simil-ecart--egale">référence</span>
                        ) : (
                          <span className={`simil-ecart ${ecartPct !== null && ecartPct < -2 ? 'simil-ecart--moins' : ecartPct !== null && ecartPct > 2 ? 'simil-ecart--plus' : 'simil-ecart--egale'}`}>
                            {ecartPct === null ? '—'
                              : ecartPct < -2 ? `${ecartPct}% moins cher`
                              : ecartPct > 2  ? `+${ecartPct}% plus cher`
                              : '≈ même prix'}
                          </span>
                        )}
                      </td>
                      <td>
                        {l.courant
                          ? <span className="simil-courant-lbl">Vous êtes ici</span>
                          : <span className="simil-voir-btn">Voir →</span>
                        }
                      </td>
                    </SimilRow>
                  )
                })}
              </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href={`/immo/comparaison?ids=${idsComparaison}`} className="comparaison-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Scale size={16} />
                <span>Comparaison détaillée côte à côte</span>
              </Link>
            </div>
          </section>
        )
      })()}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildRealEstateJsonLd(annonce) }}
      />
    </div>
  );
}
