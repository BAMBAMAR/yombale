import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'

interface Forfait {
  id: string
  operateur: string
  nom: string
  type: string
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
  description: string | null
  image_url: string | null
  source: string | null
}

interface ForfaitSimilaire {
  id: string
  operateur: string
  nom: string
  type: string
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
}

const OP_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  Orange:   { bg: '#FFF4E6', text: '#FF7900', badge: '#FF7900' },
  Free:     { bg: '#FEF2F2', text: '#CD1127', badge: '#CD1127' },
  Expresso: { bg: '#F0FDF4', text: '#00873F', badge: '#00873F' },
  Wave:     { bg: '#F0FAFA', text: '#00BCC9', badge: '#00BCC9' },
}

const OP_ICONS: Record<string, string> = {
  Orange: '🟠', Free: '🔴', Expresso: '🟢', Wave: '🔵',
}

const TYPE_LABELS: Record<string, string> = {
  data: 'Internet', internet: 'Internet', voix: 'Appels', mixte: 'Tout-en-un',
  combo: 'Tout-en-un', sms: 'SMS',
}

function formatData(mo: number | null): string {
  if (!mo) return '—'
  if (mo >= 1024) return `${(mo / 1024).toFixed(mo % 1024 === 0 ? 0 : 1)} Go`
  return `${mo} Mo`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const f = await apiFetch<Forfait>(`/telecom/${params.id}`)
    return {
      title: `${f.nom} — ${f.operateur} | Nopalou Télécom`,
      description: `Forfait ${f.operateur} ${f.nom} à ${fcfa(f.prix)}${f.data_mo ? ` — ${formatData(f.data_mo)} internet` : ''}${f.minutes === -1 ? ', appels illimités' : f.minutes ? `, ${f.minutes} min d'appels` : ''}`,
    }
  } catch {
    return { title: 'Forfait introuvable | Nopalou' }
  }
}

export default async function FicheForfaitPage({ params }: { params: { id: string } }) {
  let forfait: Forfait
  let similaires: ForfaitSimilaire[] = []

  try {
    forfait = await apiFetch<Forfait>(`/telecom/${params.id}`)
  } catch {
    notFound()
  }

  await apiFetch<{ forfaits: ForfaitSimilaire[] }>(`/telecom/${params.id}/similaires`)
    .then(raw => { similaires = raw?.forfaits ?? [] })
    .catch(() => {})

  const f = forfait!
  const colors = OP_COLORS[f.operateur] ?? { bg: '#F8F5F0', text: '#1C2B4A', badge: '#1C2B4A' }
  const icon = OP_ICONS[f.operateur] ?? '📡'
  const typeLabel = TYPE_LABELS[f.type] ?? f.type

  const prixParJour = f.validite_jours && f.validite_jours > 0
    ? Math.round(f.prix / f.validite_jours)
    : null
  const prixParGo = f.data_mo && f.data_mo > 0
    ? Math.round((f.prix / f.data_mo) * 1024)
    : null
  const prixParMin = f.minutes && f.minutes > 0
    ? (f.prix / f.minutes).toFixed(0)
    : null

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      {/* Fil d'Ariane */}
      <p className="breadcrumb" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
        <Link href="/">Accueil</Link>
        {' › '}
        <Link href="/telecom">Télécom</Link>
        {' › '}
        <span>{f.nom}</span>
      </p>

      <div className="forfait-fiche">
        {/* En-tête opérateur */}
        <div className="forfait-fiche-header" style={{ background: colors.bg }}>
          <div className="forfait-fiche-top">
            <div className="forfait-fiche-op" style={{ color: colors.text }}>
              <span className="forfait-fiche-icon">{icon}</span>
              <span className="forfait-fiche-operateur">{f.operateur}</span>
            </div>
            <span className="forfait-fiche-type-tag" style={{ background: colors.badge }}>
              {typeLabel}
            </span>
          </div>
          <h1 className="forfait-fiche-nom">{f.nom}</h1>
          <div className="forfait-fiche-prix-row">
            <span className="forfait-fiche-prix">{fcfa(f.prix)}</span>
            {f.validite_jours && (
              <span className="forfait-fiche-duree">
                · {f.validite_jours} jour{f.validite_jours > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Specs principales */}
        <div className="forfait-fiche-specs">
          {f.data_mo != null && (
            <div className="forfait-fiche-spec">
              <span className="forfait-fiche-spec-val">{formatData(f.data_mo)}</span>
              <span className="forfait-fiche-spec-lbl">🌐 Internet</span>
            </div>
          )}
          {f.minutes != null && (
            <div className="forfait-fiche-spec">
              <span className="forfait-fiche-spec-val">{f.minutes === -1 ? '∞' : `${f.minutes}`}</span>
              <span className="forfait-fiche-spec-lbl">📞 {f.minutes === -1 ? 'Illimité' : 'Minutes'}</span>
            </div>
          )}
          {f.sms != null && (
            <div className="forfait-fiche-spec">
              <span className="forfait-fiche-spec-val">{f.sms === -1 ? '∞' : f.sms}</span>
              <span className="forfait-fiche-spec-lbl">💬 SMS</span>
            </div>
          )}
          {f.validite_jours != null && (
            <div className="forfait-fiche-spec">
              <span className="forfait-fiche-spec-val">{f.validite_jours}j</span>
              <span className="forfait-fiche-spec-lbl">⏱ Validité</span>
            </div>
          )}
        </div>

        {/* Ratios qualité/prix */}
        {(prixParJour || prixParGo || prixParMin) && (
          <div className="forfait-fiche-ratios">
            <p className="forfait-fiche-ratios-titre">Rapport qualité/prix</p>
            <div className="forfait-fiche-ratios-grid">
              {prixParJour && (
                <div className="forfait-fiche-ratio">
                  <span className="forfait-fiche-ratio-val">
                    {prixParJour.toLocaleString('fr-FR')} F
                  </span>
                  <span className="forfait-fiche-ratio-lbl">par jour</span>
                </div>
              )}
              {prixParGo && (
                <div className="forfait-fiche-ratio">
                  <span className="forfait-fiche-ratio-val">
                    {prixParGo.toLocaleString('fr-FR')} F
                  </span>
                  <span className="forfait-fiche-ratio-lbl">par Go</span>
                </div>
              )}
              {prixParMin && f.minutes !== -1 && (
                <div className="forfait-fiche-ratio">
                  <span className="forfait-fiche-ratio-val">
                    {Number(prixParMin).toLocaleString('fr-FR')} F
                  </span>
                  <span className="forfait-fiche-ratio-lbl">par minute</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {f.description && (
          <div className="forfait-fiche-desc-block">
            <p className="forfait-fiche-desc">{f.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="forfait-fiche-actions">
          <Link href="/telecom" className="budget-pill">
            ← Retour aux forfaits
          </Link>
          <Link
            href={`/telecom?operateur=${encodeURIComponent(f.operateur)}`}
            className="budget-pill"
          >
            {icon} Tous les forfaits {f.operateur}
          </Link>
          <Link
            href={`/telecom/comparaison?ids=${f.id}`}
            className="budget-pill"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
          >
            ⚖ Comparer ce forfait
          </Link>
        </div>
      </div>

      {/* ── Comparaison automatique avec d'autres forfaits ───────── */}
      {similaires.length > 0 && (() => {
        const lignes = [
          { id: f.id, operateur: f.operateur, nom: f.nom, prix: f.prix, courant: true },
          ...similaires.map(s => ({ id: s.id, operateur: s.operateur, nom: s.nom, prix: s.prix, courant: false })),
        ].sort((a, b) => a.prix - b.prix)

        const meilleurPrix = lignes[0]?.prix ?? f.prix
        const courantEstMeilleur = meilleurPrix === f.prix
        const idsComparaison = [f.id, ...similaires.slice(0, 2).map(s => s.id)].join(',')

        return (
          <section className="similaires-section">
            <h2 className="similaires-titre">📊 Comparer avec d&apos;autres forfaits</h2>
            <p className="similaires-sous-titre">
              {courantEstMeilleur
                ? '✅ Ce forfait a le prix le plus bas parmi les alternatives comparées.'
                : `💡 Un forfait similaire est disponible à partir de ${fcfa(meilleurPrix)} — voir ci-dessous.`}
            </p>
            <table className="similaires-table">
              <thead>
                <tr>
                  <th>Forfait</th>
                  <th>Data</th>
                  <th>Prix</th>
                  <th>vs ce forfait</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, idx) => {
                  const original = l.courant ? f : similaires.find(s => s.id === l.id)!
                  const ecartPct = !l.courant ? Math.round((l.prix - f.prix) / f.prix * 100) : null
                  const isBest = idx === 0
                  return (
                    <tr key={l.id} className={`simil-row${l.courant ? ' simil-row--courant' : ''}`}>
                      <td>
                        <div className="simil-produit-cell">
                          <span style={{ fontSize: 20 }}>{OP_ICONS[l.operateur] ?? '📡'}</span>
                          <div>
                            <span className="simil-nom">{l.nom}</span>
                            <span className="simil-prod-marque" style={{ display: 'block', fontSize: 12, color: OP_COLORS[l.operateur]?.text }}>{l.operateur}</span>
                            {l.courant && <span className="simil-courant-badge">Ce forfait</span>}
                          </div>
                        </div>
                      </td>
                      <td>{formatData(original.data_mo)}</td>
                      <td>
                        <span className={`simil-prix-val${isBest ? ' simil-prix-val--best' : ''}`}>
                          {fcfa(l.prix)}
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
                          : <Link href={`/telecom/${l.id}`} className="simil-voir-btn">Voir →</Link>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href={`/telecom/comparaison?ids=${idsComparaison}`} className="budget-pill">
                ⚖ Comparaison détaillée côte à côte
              </Link>
            </div>
          </section>
        )
      })()}
    </div>
  )
}
