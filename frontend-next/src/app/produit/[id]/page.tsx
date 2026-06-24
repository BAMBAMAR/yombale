import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { fcfa, escapeHtml } from '@/lib/format';
import { getOptionalSession } from '@/lib/dal';
import AlertePrix from '@/app/AlertePrix';

// ── Types ─────────────────────────────────────────────────────────

interface Produit {
  id: number;
  nom: string;
  marque: string | null;
  categorie: string | null;
  categorie_nom: string | null;
  description: string | null;
  prix_min: number | null;
  image_url: string | null;
}

interface Offre {
  id: number;
  prix: number | null;
  url_achat: string | null;
  site_url: string | null;
  stock: boolean | null;
  date_maj: string | null;
  marchand_nom: string | null;
  titre_affiche: string | null;
  _suspect?: boolean;
}

const MARCHAND_ICONS: Record<string, string> = {
  'Jumia':       '🛒',
  'Expat-Dakar': '📦',
  'CoinAfrique': '🏪',
  'Dakar-Deal':  '🛍',
  'Soumari':     '🏬',
  'Cdiscount':   '🛒',
}

function icon(nom: string | null) {
  if (!nom) return '🏪'
  return MARCHAND_ICONS[nom] ?? '🏪'
}

// ── generateMetadata ───────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const p = await apiFetch<Produit>(`/produits/${params.id}`);
    const titre = `${p.nom}${p.marque ? ` — ${p.marque}` : ''} | Prix au Sénégal`;
    const description = p.description
      ? p.description.slice(0, 155)
      : `Comparez le prix de ${p.nom} chez tous les vendeurs au Sénégal. Prix à partir de ${fcfa(p.prix_min)}.`;
    return {
      title: titre,
      description,
      openGraph: { title: titre, description, type: 'website', ...(p.image_url ? { images: [{ url: p.image_url }] } : {}) },
    };
  } catch {
    return { title: 'Produit introuvable' };
  }
}

// ── JSON-LD ────────────────────────────────────────────────────────

function buildJsonLd(produit: Produit, offres: Offre[]): string {
  const offers = offres
    .filter(o => o.prix != null && !o._suspect)
    .map(o => ({
      '@type': 'Offer',
      price: o.prix,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      seller: o.marchand_nom ? { '@type': 'Organization', name: escapeHtml(o.marchand_nom) } : undefined,
      url: o.url_achat ?? undefined,
    }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produit.nom,
    ...(produit.marque ? { brand: { '@type': 'Brand', name: produit.marque } } : {}),
    ...(produit.description ? { description: produit.description } : {}),
    ...(produit.image_url ? { image: produit.image_url } : {}),
    offers: offers.length === 1 ? offers[0] : offers,
  });
}

// ── Page ───────────────────────────────────────────────────────────

export default async function FicheProduitPage({ params }: { params: { id: string } }) {
  let produit: Produit;
  let offres: Offre[] = [];

  const session = await getOptionalSession();

  try {
    produit = await apiFetch<Produit>(`/produits/${params.id}`);
  } catch {
    notFound();
  }

  try {
    const raw = await apiFetch<Offre[] | { offres?: Offre[]; data?: Offre[] }>(`/produits/${params.id}/offres`);
    offres = Array.isArray(raw) ? raw : (raw.offres ?? raw.data ?? []);
  } catch { /* offres optionnelles */ }

  const valides  = offres.filter(o => !o._suspect && o.prix != null)
  const prixMin  = valides.length ? Math.min(...valides.map(o => o.prix!)) : null
  const prixMax  = valides.length ? Math.max(...valides.map(o => o.prix!)) : null
  const best     = valides.find(o => o.prix === prixMin)
  const economie = prixMin && prixMax && prixMax > prixMin ? prixMax - prixMin : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(produit, offres) }} />

      <div className="fiche">
        {/* Fil d'Ariane */}
        <p className="breadcrumb">
          <Link href="/">Accueil</Link>
          {' › '}
          {(produit.categorie_nom ?? produit.categorie) && (
            <><Link href={`/?categorie=${produit.categorie}`}>{produit.categorie_nom ?? produit.categorie}</Link>{' › '}</>
          )}
          <span>{produit.nom}</span>
        </p>

        <div className="fiche-grid">
          {/* ── Colonne principale ──────────────────────────────── */}
          <div className="fiche-main">

            {/* Image + identité */}
            <div className="fiche-hero">
              {produit.image_url && (
                <div className="fiche-hero-img">
                  <Image src={produit.image_url} alt={produit.nom} fill sizes="(max-width:900px) 90vw, 520px" style={{ objectFit: 'contain' }} priority />
                </div>
              )}
              <div className="fiche-hero-info">
                {produit.marque && <span className="marque-badge">{produit.marque}</span>}
                <h1>{produit.nom}</h1>
                {(produit.categorie_nom ?? produit.categorie) && (
                  <span className="categ-tag">{produit.categorie_nom ?? produit.categorie}</span>
                )}
              </div>
            </div>

            {/* Box meilleur prix */}
            {prixMin && (
              <div className="prix-box">
                <p className="prix-box-label">🏆 MEILLEUR PRIX TROUVÉ</p>
                <p className="prix-box-montant">{fcfa(prixMin)}</p>
                {economie && (
                  <p className="prix-box-eco">🔥 Économie possible : {fcfa(economie)}</p>
                )}
                <p className="prix-box-nb">{valides.length} marchand{valides.length > 1 ? 's' : ''} comparé{valides.length > 1 ? 's' : ''}</p>
              </div>
            )}

            {/* CTA principal */}
            {best?.url_achat && (
              <a href={best.url_achat} target="_blank" rel="noopener noreferrer" className="cta-acheter">
                🛒 Acheter au meilleur prix →
              </a>
            )}

            {/* Trust badges */}
            <div className="trust-row">
              <span className="trust-badge">🔒 Paiement sécurisé</span>
              <span className="trust-badge">🚚 Livraison Dakar</span>
              <span className="trust-badge">✅ Prix vérifiés</span>
            </div>

            {/* Description */}
            {produit.description && (
              <p className="fiche-desc">{produit.description}</p>
            )}

            {/* Liste des offres */}
            {offres.length > 0 && (
              <div className="offres-section">
                <h2 className="offres-titre">📊 Comparer les prix <span>{offres.length} offre{offres.length > 1 ? 's' : ''}</span></h2>
                <div className="offres-list">
                  {offres.map((o) => {
                    const isBest   = !o._suspect && o.prix === prixMin
                    const ecart    = (!isBest && !o._suspect && o.prix && prixMin) ? o.prix - prixMin : 0
                    const bgClass  = o._suspect ? 'offre-row--suspect' : isBest ? 'offre-row--best' : ''
                    return (
                      <div key={o.id} className={`offre-row-fiche ${bgClass}`}>
                        <div className="offre-icon">{icon(o.marchand_nom)}</div>
                        <div className="offre-info">
                          {isBest && <span className="offre-badge-best">🏆 Meilleur prix</span>}
                          {o._suspect && <span className="offre-badge-suspect">⚠ Prix suspect</span>}
                          <p className="offre-marchand">
                            {o.site_url
                              ? <a href={o.site_url} target="_blank" rel="noopener noreferrer">{o.marchand_nom ?? 'Marchand'}</a>
                              : (o.marchand_nom ?? 'Marchand')
                            }
                          </p>
                          {o.titre_affiche && (
                            <p className="offre-ref">{o.titre_affiche.slice(0, 60)}{o.titre_affiche.length > 60 ? '…' : ''}</p>
                          )}
                          {ecart > 0 && <p className="offre-ecart">+{fcfa(ecart)} de plus que le moins cher</p>}
                        </div>
                        <div className="offre-prix-col">
                          <p className={`offre-prix${isBest ? ' offre-prix--best' : ''}`}>{fcfa(o.prix)}</p>
                          {o.url_achat && (
                            <a href={o.url_achat} target="_blank" rel="noopener noreferrer" className={`offre-btn${isBest ? ' offre-btn--best' : ''}`}>
                              Voir l&apos;offre →
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar résumé ──────────────────────────────────── */}
          <aside className="fiche-sidebar">
            <div className="sidebar-card">
              <p className="sidebar-titre">RÉSUMÉ</p>
              <p className="sidebar-produit">{produit.nom}</p>
              <div className="sidebar-ligne">
                <span>Prix le plus bas</span>
                <strong>{fcfa(prixMin)}</strong>
              </div>
              <div className="sidebar-ligne">
                <span>Prix le plus haut</span>
                <strong>{fcfa(prixMax)}</strong>
              </div>
              <div className="sidebar-ligne">
                <span>Marchands</span>
                <strong>{valides.length}</strong>
              </div>
              {best && (
                <div className="sidebar-best-label">
                  Meilleur prix chez <strong>{best.marchand_nom ?? '—'}</strong>
                </div>
              )}
              {best?.url_achat && (
                <a href={best.url_achat} target="_blank" rel="noopener noreferrer" className="sidebar-cta">
                  🛒 Meilleur prix chez {best.marchand_nom ?? '—'}
                </a>
              )}
              {session ? (
                <AlertePrix
                  produitId={String(produit.id)}
                  prixMin={prixMin}
                  email={session.email ?? ''}
                />
              ) : (
                <Link href="/connexion" className="alerte-trigger-login">
                  🔔 Alertes prix (connexion requise)
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
