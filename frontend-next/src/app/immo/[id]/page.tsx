import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { fcfa } from '@/lib/format';
import { getOptionalSession } from '@/lib/dal';
import SponsoringImmoBtn from './SponsoringImmoBtn';
import { cloudinaryHQ } from '@/lib/cloudinary';
import BoutonWhatsApp from '@/components/BoutonWhatsApp';
import SimilRow from '@/components/SimilRow';
import { sanitizeImgUrl } from '@/components/ExternalImg';

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
  utilisateur_id: string | null;
  sponsorisee: boolean | null;
  sponsorisee_jusqu_au: string | null;
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
  let similaires: AnnonceSimilaire[] = [];
  const session = await getOptionalSession();

  try {
    annonce = await apiFetch<AnnonceImmo>(`/immo/${params.id}`);
  } catch {
    notFound();
  }

  await apiFetch<{ annonces: AnnonceSimilaire[] }>(`/immo/${params.id}/similaires`)
    .then(raw => { similaires = raw?.annonces ?? []; })
    .catch(() => {});

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
  const isOwner = session && annonce.utilisateur_id && session.userId === annonce.utilisateur_id;
  const isSponsorise = annonce.sponsorisee && annonce.sponsorisee_jusqu_au
    ? new Date(annonce.sponsorisee_jusqu_au) > new Date()
    : false;

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

      {/* Bandeau "meilleur choix" — pousse vers le bien comparable le moins cher du secteur */}
      {proposerMeilleur && meilleurBien && (
        <Link href={`/immo/${meilleurBien.id}`} className="meilleur-choix-banner">
          <div className="meilleur-choix-img">
            {meilleurBien.photos?.[0]
              ? <img src={sanitizeImgUrl(meilleurBien.photos[0])!} alt={meilleurBien.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>🏠</span>
            }
          </div>
          <div className="meilleur-choix-info">
            <span className="meilleur-choix-label">✨ Meilleur choix pour vous</span>
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
            {/* Photo principale */}
            {mainPhoto && (
              <div style={{ position: 'relative', width: '100%', height: '360px', marginBottom: '12px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryHQ(mainPhoto, { width: 900 })}
                  alt={annonce.titre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="eager"
                />
              </div>
            )}
            {/* Galerie miniatures */}
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
                {photos.slice(1).map((url, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 100, height: 72, borderRadius: 6, overflow: 'hidden', background: 'var(--bg)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cloudinaryHQ(url, { width: 200 })} alt={`Photo ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
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

            {/* Description */}
            {annonce.description && (
              <p className="description">{annonce.description}</p>
            )}
          </div>
        </div>

        {/* Sidebar : résumé, prix, contact, actions */}
        <aside className="fiche-sidebar">
          <div className="sidebar-card" style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
            <p className="sidebar-titre" style={{ color: 'var(--text3)' }}>RÉSUMÉ</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text1)', lineHeight: 1.4, marginBottom: 16 }}>
              {annonce.titre}
            </p>

            <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
              <span>Prix</span>
              <strong style={{ color: 'var(--text1)' }}>
                {fcfa(annonce.prix)}{annonce.transaction?.toLowerCase().includes('locat') ? ' /mois' : ''}
              </strong>
            </div>
            {prixM2 && (
              <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                <span>Prix / m²</span>
                <strong style={{ color: 'var(--text1)' }}>{fcfa(prixM2)}</strong>
              </div>
            )}
            {annonce.surface_m2 && (
              <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                <span>Surface</span>
                <strong style={{ color: 'var(--text1)' }}>{annonce.surface_m2} m²</strong>
              </div>
            )}
            {annonce.nb_pieces && (
              <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                <span>Pièces</span>
                <strong style={{ color: 'var(--text1)' }}>{annonce.nb_pieces}</strong>
              </div>
            )}
            {annonce.nb_chambres && (
              <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                <span>Chambres</span>
                <strong style={{ color: 'var(--text1)' }}>{annonce.nb_chambres}</strong>
              </div>
            )}
            {localisation && (
              <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                <span>Localisation</span>
                <strong style={{ color: 'var(--text1)' }}>{localisation}</strong>
              </div>
            )}
            {annonce.transaction && (
              <div className="sidebar-ligne" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                <span>Transaction</span>
                <strong style={{ color: 'var(--text1)' }}>{annonce.transaction === 'vente' ? '🔑 Vente' : '🏠 Location'}</strong>
              </div>
            )}

            {similaires.length > 0 && (
              <Link
                href={`/immo/comparaison?ids=${idsComparaison}`}
                className="sidebar-cta"
                style={{ background: 'var(--accent)' }}
              >
                ⚖ Comparaison détaillée côte à côte
              </Link>
            )}

            {/* Contact */}
            {annonce.contact_tel && (
              <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: 10, padding: '16px 20px', marginTop: 12 }}>
                {annonce.contact_nom && <p style={{ fontWeight: 700, marginBottom: 8 }}>{annonce.contact_nom}</p>}
                <a href={`tel:${annonce.contact_tel}`} style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                  📞 {annonce.contact_tel}
                </a>
                <a
                  href={`https://wa.me/${annonce.contact_tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par :\n\n*${annonce.titre}*${annonce.prix ? ` — ${fcfa(annonce.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/immo/${annonce.id}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 8, color: '#25d366', fontWeight: 600 }}
                >
                  💬 WhatsApp
                </a>
                <BoutonWhatsApp type="immo" id={annonce.id} isConnecte={!!session} />
              </div>
            )}

            {/* Lien source */}
            {annonce.url_source && (
              <a
                href={annonce.url_source}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'var(--blue)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginTop: 16,
                }}
              >
                Voir l&apos;annonce originale →
              </a>
            )}

            {/* Sponsoring — propriétaire uniquement */}
            {isOwner && (
              isSponsorise ? (
                <div style={{ marginTop: 16, padding: '14px 18px', background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10 }}>
                  <p style={{ fontWeight: 700, color: '#854D0E' }}>
                    ⭐ Mise en avant active jusqu&apos;au{' '}
                    {new Date(annonce.sponsorisee_jusqu_au!).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ) : (
                <SponsoringImmoBtn immoId={annonce.id} userId={session!.userId} settings={settings} />
              )
            )}
          </div>
        </aside>
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
            <h2 className="similaires-titre">📊 Biens comparables dans le secteur</h2>
            <p className="similaires-sous-titre">
              {courantEstMeilleur
                ? '✅ Cette annonce a le prix le plus bas parmi les biens comparables.'
                : `💡 Un bien comparable est disponible à partir de ${fcfa(meilleurPrix)} — voir ci-dessous.`}
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
                              : <span>🏠</span>
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
                          {isBest && <span className="simil-best-ico"> 🏆</span>}
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
              <Link href={`/immo/comparaison?ids=${idsComparaison}`} className="comparaison-cta-btn">
                ⚖ Comparaison détaillée côte à côte
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
