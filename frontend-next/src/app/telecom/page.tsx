import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Forfaits Télécom — Nopalou',
  description: 'Comparez les forfaits internet, voix et data des opérateurs télécom au Sénégal : Orange, Free, Expresso et plus.',
}

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
}

interface TelecomResponse {
  forfaits: Forfait[]
  total: number
  page: number
  pages: number
}

const OP_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  Orange:   { bg: '#FFF4E6', text: '#FF7900', badge: '#FF7900' },
  Free:     { bg: '#FEF2F2', text: '#CD1127', badge: '#CD1127' },
  Expresso: { bg: '#F0FDF4', text: '#00873F', badge: '#00873F' },
  Wave:     { bg: '#F0FAFA', text: '#00BCC9', badge: '#00BCC9' },
}

const OP_ICONS: Record<string, string> = {
  Orange:   '🟠',
  Free:     '🔴',
  Expresso: '🟢',
  Wave:     '🔵',
}

const TYPE_LABELS: Record<string, string> = {
  data:  'Internet',
  voix:  'Appels',
  mixte: 'Tout-en-un',
  sms:   'SMS',
}

function formatData(mo: number | null): string {
  if (!mo) return '—'
  if (mo >= 1024) return `${(mo / 1024).toFixed(mo % 1024 === 0 ? 0 : 1)} Go`
  return `${mo} Mo`
}

function ForfaitCard({ f }: { f: Forfait }) {
  const colors = OP_COLORS[f.operateur] ?? { bg: '#F8F5F0', text: '#1C2B4A', badge: '#1C2B4A' }
  const icon = OP_ICONS[f.operateur] ?? '📡'
  const typeLabel = TYPE_LABELS[f.type] ?? f.type

  return (
    <div className="forfait-card">
      <div className="forfait-card-header" style={{ background: colors.bg }}>
        <div className="forfait-op-badge" style={{ color: colors.text, borderColor: colors.badge }}>
          <span>{icon}</span>
          <span>{f.operateur}</span>
        </div>
        <span className="forfait-type-tag" style={{ background: colors.badge }}>
          {typeLabel}
        </span>
      </div>

      <div className="forfait-card-body">
        <h3 className="forfait-nom">{f.nom}</h3>

        <div className="forfait-specs">
          {f.data_mo != null && (
            <div className="forfait-spec forfait-spec--data">
              <span className="forfait-spec-val">{formatData(f.data_mo)}</span>
              <span className="forfait-spec-lbl">Internet</span>
            </div>
          )}
          {f.minutes != null && (
            <div className="forfait-spec">
              <span className="forfait-spec-val">
                {f.minutes === -1 ? '∞' : `${f.minutes} min`}
              </span>
              <span className="forfait-spec-lbl">Appels</span>
            </div>
          )}
          {f.sms != null && (
            <div className="forfait-spec">
              <span className="forfait-spec-val">
                {f.sms === -1 ? '∞' : f.sms}
              </span>
              <span className="forfait-spec-lbl">SMS</span>
            </div>
          )}
          {f.validite_jours != null && (
            <div className="forfait-spec">
              <span className="forfait-spec-val">{f.validite_jours}j</span>
              <span className="forfait-spec-lbl">Validité</span>
            </div>
          )}
        </div>

        {f.description && (
          <p className="forfait-desc">{f.description}</p>
        )}
      </div>

      <div className="forfait-card-footer">
        <span className="forfait-prix">{fcfa(f.prix)}</span>
        <Link
          href={`/telecom/${f.id}`}
          className="forfait-btn"
          style={{ background: colors.badge }}
        >
          Voir l&apos;offre
        </Link>
      </div>
    </div>
  )
}

export default async function TelecomPage({
  searchParams,
}: {
  searchParams: { operateur?: string; type?: string; tri?: string; page?: string }
}) {
  const { operateur = '', type = '', tri = '', page = '1' } = searchParams

  const qs = new URLSearchParams()
  qs.set('limit', '24')
  qs.set('page', page)
  if (operateur) qs.set('operateur', operateur)
  if (type) qs.set('type', type)
  if (tri) qs.set('tri', tri)

  let data: TelecomResponse = { forfaits: [], total: 0, page: 1, pages: 1 }
  let operateurs: string[] = []

  try {
    ;[data, operateurs] = await Promise.all([
      apiFetch<TelecomResponse>(`/telecom?${qs.toString()}`),
      apiFetch<string[]>('/telecom/operateurs'),
    ])
  } catch {
    // shows empty state below
  }

  const { forfaits, total, pages } = data
  const currentPage = Number(page)

  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (operateur) p.set('operateur', operateur)
    if (type) p.set('type', type)
    if (tri) p.set('tri', tri)
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    const s = p.toString()
    return `/telecom${s ? `?${s}` : ''}`
  }

  const TYPES = [
    { val: '',      label: 'Tous' },
    { val: 'data',  label: 'Internet' },
    { val: 'voix',  label: 'Appels' },
    { val: 'mixte', label: 'Tout-en-un' },
  ]

  const TRIS = [
    { val: '',          label: 'Par défaut' },
    { val: 'prix_asc',  label: 'Prix ↑' },
    { val: 'prix_desc', label: 'Prix ↓' },
    { val: 'data_desc', label: 'Data ↓' },
  ]

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      {/* En-tête */}
      <div className="telecom-header">
        <div className="telecom-header-text">
          <h1 className="telecom-titre">
            Forfaits <span style={{ color: 'var(--accent)' }}>Télécom</span>
          </h1>
          <p className="telecom-sous-titre">
            Comparez les forfaits internet et appels des opérateurs au Sénégal
          </p>
        </div>
        {total > 0 && (
          <span className="telecom-count">{total} forfait{total > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Filtres opérateurs */}
      <div className="telecom-filtres">
        <div className="filtres-bar" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Opérateurs */}
          <div className="filtres-group">
            <span className="filtres-label">Opérateur</span>
            <Link
              href={buildLink({ operateur: '', page: '1' })}
              className={`budget-pill${!operateur ? ' active' : ''}`}
            >
              Tous
            </Link>
            {operateurs.map(op => (
              <Link
                key={op}
                href={buildLink({ operateur: op, page: '1' })}
                className={`budget-pill${operateur === op ? ' active' : ''}`}
                style={
                  operateur === op
                    ? { background: OP_COLORS[op]?.badge ?? 'var(--accent)', borderColor: OP_COLORS[op]?.badge ?? 'var(--accent)' }
                    : {}
                }
              >
                {OP_ICONS[op] ?? '📡'} {op}
              </Link>
            ))}
          </div>

          {/* Type */}
          <div className="filtres-group">
            <span className="filtres-label">Type</span>
            {TYPES.map(t => (
              <Link
                key={t.val}
                href={buildLink({ type: t.val, page: '1' })}
                className={`budget-pill${type === t.val ? ' active' : ''}`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Tri */}
          <div className="filtres-group">
            <span className="filtres-label">Trier par</span>
            {TRIS.map(t => (
              <Link
                key={t.val}
                href={buildLink({ tri: t.val, page: '1' })}
                className={`budget-pill${tri === t.val ? ' active' : ''}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grille forfaits */}
      {forfaits.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📡</span>
          <p>Aucun forfait trouvé pour ces critères.</p>
          <Link href="/telecom" className="budget-pill active" style={{ marginTop: 8 }}>
            Voir tous les forfaits
          </Link>
        </div>
      ) : (
        <div className="forfaits-grid">
          {forfaits.map(f => (
            <ForfaitCard key={f.id} f={f} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          {currentPage > 1 && (
            <Link href={buildLink({ page: String(currentPage - 1) })} className="page-btn">
              ← Précédent
            </Link>
          )}
          <span className="page-info">
            Page {currentPage} / {pages}
          </span>
          {currentPage < pages && (
            <Link href={buildLink({ page: String(currentPage + 1) })} className="page-btn">
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
