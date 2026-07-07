import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ExternalImg from '@/components/ExternalImg';
import { fcfa, escapeHtml } from '@/lib/format';
import { getOptionalSession } from '@/lib/dal';
import AlertePrix from '@/app/AlertePrix';
import TrackRecent from './TrackRecent';
import SponsoringProduitBtn from './SponsoringProduitBtn';
import SimilRow from './SimilRow';

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

interface HistoriquePoint {
  jour: string;
  prix_min: string;
  prix_max: string;
}

interface ProduitSimilaire {
  id: string;
  nom: string;
  image_url: string | null;
  prix_min: string | null;
  nb_offres: string | null;
  categorie_nom: string | null;
  similarite: string | null;
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

// ── Composant Graphique Historique (SVG pur, server-rendered) ──────

function HistoriqueChart({ data }: { data: HistoriquePoint[] }) {
  if (data.length < 2) return null;

  const W = 600, H = 160, PAD = { t: 16, r: 16, b: 32, l: 64 };
  const pts = data.map(d => ({
    jour: d.jour,
    min: parseFloat(d.prix_min),
    max: parseFloat(d.prix_max),
  })).filter(p => p.min > 0);

  if (pts.length < 2) return null;

  const allPrix = pts.flatMap(p => [p.min, p.max]);
  const yMin = Math.min(...allPrix);
  const yMax = Math.max(...allPrix);
  const yRange = yMax - yMin || 1;

  const xScale = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r);
  const yScale = (v: number) => PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b);

  const minLine = pts.map((p, i) => `${xScale(i)},${yScale(p.min)}`).join(' ');
  const areaPath = [
    ...pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.min)}`),
    ...pts.map((p, i) => `${i === 0 ? 'L' : 'L'}${xScale(pts.length - 1 - i)},${yScale(pts[pts.length - 1 - i].min)}`).reverse(),
    'Z',
  ].join(' ');

  const labelsX: { x: number; label: string }[] = [];
  const step = Math.max(1, Math.floor(pts.length / 4));
  for (let i = 0; i < pts.length; i += step) {
    const d = new Date(pts[i].jour);
    labelsX.push({ x: xScale(i), label: `${d.getDate()}/${d.getMonth() + 1}` });
  }

  const labelsY = [yMin, yMin + yRange / 2, yMax].map(v => ({
    y: yScale(v),
    label: fcfa(Math.round(v)),
  }));

  const currentMin = pts[pts.length - 1].min;
  const startMin = pts[0].min;
  const variation = startMin > 0 ? ((currentMin - startMin) / startMin) * 100 : 0;

  return (
    <div className="historique-section">
      <div className="historique-header">
        <h2 className="offres-titre">📈 Historique des prix <span>{pts.length} jours</span></h2>
        <span className={`historique-variation ${variation <= 0 ? 'historique-variation--good' : 'historique-variation--bad'}`}>
          {variation <= 0 ? '↓' : '↑'} {Math.abs(variation).toFixed(1)}%
        </span>
      </div>
      <div className="historique-stats-row">
        <div className="historique-stat">
          <span>Prix actuel</span>
          <strong>{fcfa(currentMin)}</strong>
        </div>
        <div className="historique-stat">
          <span>Plus bas ({pts.length}j)</span>
          <strong className="historique-stat--green">{fcfa(Math.min(...pts.map(p => p.min)))}</strong>
        </div>
        <div className="historique-stat">
          <span>Plus haut ({pts.length}j)</span>
          <strong>{fcfa(Math.max(...pts.map(p => p.min)))}</strong>
        </div>
      </div>
      <div className="historique-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="historique-svg">
          {/* Grille horizontale */}
          {labelsY.map((l, i) => (
            <line key={i} x1={PAD.l} y1={l.y} x2={W - PAD.r} y2={l.y} stroke="#E8DDD2" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          {/* Zone sous la courbe */}
          <path d={areaPath} fill="rgba(10,92,54,0.08)" />
          {/* Ligne prix min */}
          <polyline points={minLine} fill="none" stroke="#0A5C36" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* Labels Y */}
          {labelsY.map((l, i) => (
            <text key={i} x={PAD.l - 6} y={l.y + 4} textAnchor="end" fontSize="10" fill="#9C8E84">{l.label}</text>
          ))}
          {/* Labels X */}
          {labelsX.map((l, i) => (
            <text key={i} x={l.x} y={H - 4} textAnchor="middle" fontSize="10" fill="#9C8E84">{l.label}</text>
          ))}
          {/* Point actuel */}
          <circle cx={xScale(pts.length - 1)} cy={yScale(currentMin)} r="4" fill="#0A5C36" />
        </svg>
      </div>
    </div>
  );
}

// ── generateMetadata ───────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const p = await apiFetch<Produit>(`/produits/${params.id}`);
    const titre = `${p.nom}${p.marque ? ` ${p.marque}` : ''} — Prix Sénégal | Nopalou`;
    const prixStr = p.prix_min ? ` à partir de ${fcfa(p.prix_min)}` : ''
    const description = p.description
      ? p.description.slice(0, 155)
      : `Comparez le prix de ${p.nom} chez tous les vendeurs au Sénégal${prixStr}. Meilleure offre à Dakar et partout au Sénégal.`;
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
  let historique: HistoriquePoint[] = [];
  let similaires: ProduitSimilaire[] = [];

  const session = await getOptionalSession();

  try {
    produit = await apiFetch<Produit>(`/produits/${params.id}`);
  } catch {
    notFound();
  }

  await Promise.all([
    apiFetch<Offre[] | { offres?: Offre[]; data?: Offre[] }>(`/produits/${params.id}/offres`)
      .then(raw => { offres = Array.isArray(raw) ? raw : (raw.offres ?? raw.data ?? []); })
      .catch(() => {}),
    apiFetch<HistoriquePoint[]>(`/produits/${params.id}/historique`)
      .then(raw => { historique = Array.isArray(raw) ? raw : []; })
      .catch(() => {}),
    apiFetch<{ produits: ProduitSimilaire[] }>(`/produits/${params.id}/similaires`)
      .then(raw => { similaires = raw?.produits ?? []; })
      .catch(() => {}),
  ]);

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';
  let settings: Record<string, string> = {};
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' });
    if (r.ok) settings = await r.json();
  } catch {
    // handled by defaults in SponsoringProduitBtn
  }

  // Filtre 1 : exclure les offres marquées suspectes par le backend
  const sansSupects = offres.filter(o => !o._suspect && o.prix != null && o.prix > 0)
  // Filtre 2 : exclure les outliers par rapport à la médiane (fourchette 0.4× – 2.0×)
  const sorted    = [...sansSupects].sort((a, b) => a.prix! - b.prix!)
  const mediane   = sorted.length ? sorted[Math.floor(sorted.length / 2)].prix! : 0
  const valides   = mediane > 0
    ? sansSupects.filter(o => o.prix! >= mediane * 0.4 && o.prix! <= mediane * 2.0)
    : sansSupects
  const nbExclues = offres.length - valides.length

  const prixMin  = valides.length ? Math.min(...valides.map(o => o.prix!)) : null
  const prixMax  = valides.length ? Math.max(...valides.map(o => o.prix!)) : null
  const best     = valides.find(o => o.prix === prixMin)
  const economie = prixMin && prixMax && prixMax > prixMin ? prixMax - prixMin : null

  // ── Produits similaires (même modèle/gamme chez d'autres vendeurs ou variantes proches) ──
  const catProduit = produit.categorie_nom ?? produit.categorie

  // Normalise un nom : minuscules sans accents, split en mots ≥4 chars
  const GENERIQUES = new Set([
    'smart','avec','pour','noir','gris','blanc',
    'android','google','slim','full','dual','inch',
    'pouces','serie','mode','type','sans','dans','vers','this','that',
  ])
  function motsCles(nom: string): string[] {
    return nom.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !GENERIQUES.has(w))
  }

  // Variantes de gamme : on ne compare jamais un modèle de base à sa version
  // Pro/Max/Ultra — prix et positionnement trop différents pour être "similaires".
  const VARIANTES = ['pro', 'max', 'ultra', 'plus', 'mini', 'lite', 'se', 'fe']
  function variantes(nom: string): string[] {
    const tokens = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[\s,\-/]+/)
    return VARIANTES.filter(v => tokens.includes(v))
  }

  // Un appareil et son accessoire (coque, chargeur…) ne sont jamais "similaires"
  // même s'ils partagent un mot-clé (ex: "iPhone 13" vs "Coque iPhone 13").
  const ACCESSOIRE_RE = /\b(chargeur|cable|câble|adaptateur|support|housse|etui|étui|coque|sacoche|powerbank|power\s*bank)\b/i
  const produitEstAccessoire = ACCESSOIRE_RE.test(produit.nom)
  const variantesProduit = variantes(produit.nom)

  const motsProduit = motsCles(produit.nom)
  // Seuil de mots-clés communs : 2 si la source en a ≥2, sinon 1 (titres courts)
  const seuilMots = motsProduit.length >= 2 ? 2 : 1

  // Similaires filtrés : même catégorie + mots-clés communs + même gamme + fourchette prix
  const proches = (prixMin ? similaires.filter(p => {
    const catP = p.categorie_nom
    if (catProduit && catP && catP !== catProduit) return false
    if (ACCESSOIRE_RE.test(p.nom) !== produitEstAccessoire) return false
    const variantesP = variantes(p.nom)
    if (variantesP.length !== variantesProduit.length
      || !variantesProduit.every(v => variantesP.includes(v))) return false
    const motsP = motsCles(p.nom)
    const motsCommuns = motsProduit.filter(w => motsP.includes(w)).length
    if (motsCommuns < seuilMots) return false
    const px = p.prix_min ? parseFloat(p.prix_min) : null
    if (!px) return false
    const ratio = px / prixMin!
    return ratio >= 0.35 && ratio <= 2.5
  }) : []).slice(0, 7)

  // Meilleur prix du marché parmi le produit courant + ses similaires
  const meilleurSimilaire = proches.reduce((best, p) => {
    const px = p.prix_min ? parseFloat(p.prix_min) : null
    if (px == null) return best
    return (!best || px < best.px!) ? { px, nom: p.nom, id: p.id, image_url: p.image_url } : best
  }, null as { px: number; nom: string; id: string; image_url: string | null } | null)
  const existeMoinsCher = !!(meilleurSimilaire && prixMin && meilleurSimilaire.px < prixMin)

  // Même sélection pré-remplie pour le bouton "Comparaison détaillée" du résumé
  // et celui en bas de la section "Comparer les prix du marché".
  const idsComparaison = [String(produit.id), ...proches.slice(0, 2).map(p => p.id)].join(',')

  return (
    <>
      <TrackRecent id={produit.id} nom={produit.nom} prix_min={prixMin} image_url={produit.image_url} />
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

        {/* Bandeau "meilleur choix" — pousse vers l'alternative la moins chère si elle existe */}
        {existeMoinsCher && meilleurSimilaire && (
          <Link href={`/produit/${meilleurSimilaire.id}`} className="meilleur-choix-banner">
            <div className="meilleur-choix-img">
              <ExternalImg src={meilleurSimilaire.image_url} alt={meilleurSimilaire.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="meilleur-choix-info">
              <span className="meilleur-choix-label">✨ Meilleur choix pour vous</span>
              <span className="meilleur-choix-nom">{meilleurSimilaire.nom}</span>
              <span className="meilleur-choix-prix">
                {fcfa(meilleurSimilaire.px)}
                {prixMin && <span className="meilleur-choix-eco"> · -{Math.round((prixMin - meilleurSimilaire.px) / prixMin * 100)}%</span>}
              </span>
            </div>
            <span className="meilleur-choix-cta">Voir ce produit →</span>
          </Link>
        )}

        <div className="fiche-grid">
          {/* ── Colonne principale ──────────────────────────────── */}
          <div className="fiche-main">

            {/* ── Header produit — aligné sur la fiche forfait ── */}
            <div className="produit-fiche-header">
              <div className="produit-fiche-top">
                {produit.marque && <span className="marque-badge">{produit.marque}</span>}
                {(produit.categorie_nom ?? produit.categorie) && (
                  <Link href={`/?categorie=${produit.categorie}`} className="categ-tag">
                    {produit.categorie_nom ?? produit.categorie}
                  </Link>
                )}
              </div>
              <div className="produit-fiche-nom-row produit-fiche-nom-row--avec-cta">
                {produit.image_url && (
                  <div className="produit-fiche-img">
                    <ExternalImg src={produit.image_url} alt={produit.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="eager" />
                  </div>
                )}
                <h1 className="produit-fiche-nom">{produit.nom}</h1>
                {best?.url_achat && (
                  <a href={`/api/click/${best.id}`} target="_blank" rel="noopener noreferrer" className="cta-acheter cta-acheter--header">
                    🛒 Acheter →
                  </a>
                )}
              </div>
              <div className="forfait-fiche-prix-row">
                <span className="forfait-fiche-prix">{prixMin ? fcfa(prixMin) : '—'}</span>
                {best?.marchand_nom && (
                  <span className="forfait-fiche-duree">chez {best.marchand_nom}</span>
                )}
              </div>
            </div>

            {/* ── Grille métriques clés — alignée sur forfait-fiche-specs ── */}
            {valides.length > 0 && (
              <div className="forfait-fiche-specs">
                <div className="forfait-fiche-spec">
                  <span className="forfait-fiche-spec-val">{valides.length}</span>
                  <span className="forfait-fiche-spec-lbl">🏪 Marchands</span>
                </div>
                <div className="forfait-fiche-spec">
                  <span className="forfait-fiche-spec-val">{fcfa(prixMin)}</span>
                  <span className="forfait-fiche-spec-lbl">💰 Prix le plus bas</span>
                </div>
                {prixMax && prixMax !== prixMin && (
                  <div className="forfait-fiche-spec">
                    <span className="forfait-fiche-spec-val">{fcfa(prixMax)}</span>
                    <span className="forfait-fiche-spec-lbl">📈 Prix le plus haut</span>
                  </div>
                )}
                {economie && (
                  <div className="forfait-fiche-spec">
                    <span className="forfait-fiche-spec-val">{fcfa(economie)}</span>
                    <span className="forfait-fiche-spec-lbl">💸 Économie possible</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {produit.description && (
              <p className="fiche-desc">{produit.description}</p>
            )}

            {/* Liste des offres */}
            {valides.length > 0 && (
              <div className="offres-section">
                <h2 className="offres-titre">
                  📊 Comparer les prix <span>{valides.length} offre{valides.length > 1 ? 's' : ''}</span>
                  {nbExclues > 0 && (
                    <span className="offres-exclues" title="Prix trop éloignés de la fourchette principale, probablement d'autres modèles">
                      · {nbExclues} hors fourchette
                    </span>
                  )}
                </h2>
                <div className="offres-list">
                  {valides.map((o) => {
                    const isBest   = o.prix === prixMin
                    const ecart    = (!isBest && o.prix && prixMin) ? o.prix - prixMin : 0
                    const bgClass  = isBest ? 'offre-row--best' : ''
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
                            <a href={`/api/click/${o.id}`} target="_blank" rel="noopener noreferrer" className={`offre-btn${isBest ? ' offre-btn--best' : ''}`}>
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

            {/* CTA comparaison — visible sur mobile avant la sidebar */}
            {proches.length > 0 && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Link href={`/comparaison?ids=${idsComparaison}`} className="comparaison-cta-btn">
                  ⚖ Comparaison détaillée côte à côte
                </Link>
              </div>
            )}

            {/* Historique des prix */}
            <HistoriqueChart data={historique} />

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
                <a href={`/api/click/${best.id}`} target="_blank" rel="noopener noreferrer" className="sidebar-cta">
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
              {session && (
                <SponsoringProduitBtn produitId={String(produit.id)} userId={session.userId} settings={settings} />
              )}
              {proches.length > 0 && (
                <Link
                  href={`/comparaison?ids=${idsComparaison}`}
                  className="sidebar-cta"
                  style={{ background: 'var(--accent)' }}
                >
                  ⚖ Comparaison détaillée côte à côte
                </Link>
              )}
            </div>
          </aside>
        </div>

        {/* ── Comparaison produits similaires ───────────────────── */}
        {prixMin && (() => {
          // Ligne du produit courant (toujours incluse)
          const lignes = [
            {
              id: String(produit.id),
              nom: produit.nom,
              image_url: produit.image_url,
              px: prixMin,
              nb: valides.length,
              courant: true,
            },
            ...proches.map(p => ({
              id: p.id,
              nom: p.nom,
              image_url: p.image_url,
              px: p.prix_min ? parseFloat(p.prix_min) : null,
              nb: p.nb_offres ? parseInt(p.nb_offres) : 0,
              courant: false,
            })),
          ].sort((a, b) => (a.px ?? 999999) - (b.px ?? 999999))

          // Meilleur prix du marché parmi tous les produits comparés
          const meilleuxPrix = lignes[0]?.px ?? prixMin
          const courantEstMeilleur = !existeMoinsCher

          if (lignes.length <= 1) return null

          return (
            <section className="similaires-section">
              <h2 className="similaires-titre">📊 Comparer les prix du marché</h2>
              <p className="similaires-sous-titre">
                {courantEstMeilleur
                  ? '✅ Ce produit a le meilleur prix de sa catégorie parmi les références comparées.'
                  : `💡 Un produit similaire est disponible à partir de ${fcfa(meilleuxPrix!)} — voir ci-dessous.`}
              </p>
              <table className="similaires-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix le plus bas</th>
                    <th>Offres</th>
                    <th>vs ce produit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l, idx) => {
                    const ecartPct = (!l.courant && l.px && prixMin)
                      ? Math.round((l.px - prixMin) / prixMin * 100)
                      : null
                    const isBest = idx === 0
                    return (
                      <SimilRow key={l.id} id={l.id} courant={l.courant}>
                        <td>
                          <div className="simil-produit-cell">
                            <div className="simil-img-wrap">
                              <ExternalImg src={l.image_url} alt={l.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div>
                              <span className="simil-nom">{l.nom}</span>
                              {l.courant && <span className="simil-courant-badge">Ce produit</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`simil-prix-val${isBest ? ' simil-prix-val--best' : ''}`}>
                            {l.px ? fcfa(l.px) : '—'}
                            {isBest && <span className="simil-best-ico"> 🏆</span>}
                          </span>
                        </td>
                        <td>
                          <span className="simil-offres-val">
                            {l.nb > 0 ? `${l.nb} offre${l.nb > 1 ? 's' : ''}` : '—'}
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
                <Link href={`/comparaison?ids=${idsComparaison}`} className="comparaison-cta-btn">
                  ⚖ Comparaison détaillée côte à côte
                </Link>
              </div>
            </section>
          )
        })()}
      </div>
    </>
  );
}
