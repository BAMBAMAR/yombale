'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import WizardForfait from './WizardForfait'
import CardActions from '@/app/CardActions'
import type { Forfait } from './page'

interface Props {
  forfaits: Forfait[]
  total: number
  operateurs: string[]
  currentOperateur: string
  currentType: string
  currentTri: string
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

function scoreMixte(f: Forfait): number {
  if (!f.prix || f.prix === 0) return 0
  const data = f.data_mo ?? 0
  const mins = f.minutes === -1 ? 2000 : (f.minutes ?? 0)
  return ((data / f.prix) * 600 + (mins / f.prix) * 70)
}

function validiteLabel(jours: number | null): string {
  if (!jours) return 'Autres'
  if (jours <= 1) return '1 jour'
  if (jours <= 7) return '7 jours'
  if (jours <= 31) return '30 jours'
  return 'Autres'
}

function validiteOrder(label: string): number {
  return { '1 jour': 0, '7 jours': 1, '30 jours': 2, 'Autres': 3 }[label] ?? 4
}

function ForfaitCard({ f, isRecommande }: { f: Forfait; isRecommande: boolean }) {
  const colors = OP_COLORS[f.operateur] ?? { bg: '#F8F5F0', text: '#1C2B4A', badge: '#1C2B4A' }
  const icon = OP_ICONS[f.operateur] ?? '📡'
  const typeLabel = TYPE_LABELS[f.type] ?? f.type

  return (
    <Link href={`/telecom/${f.id}`} style={{ display: 'contents' }}>
      <div className={`forfait-card${isRecommande ? ' forfait-card--recommande' : ''}`} style={{ position: 'relative' }}>
        <CardActions id={f.id} nom={f.nom} type="telecom" />
        {isRecommande && (
          <div className="forfait-recommande-ribbon">🏆 Recommandé</div>
        )}
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
          <span className="forfait-voir-arrow" style={{ color: colors.badge }}>Voir →</span>
        </div>
      </div>
    </Link>
  )
}

const TYPES = [
  { val: '',         label: 'Tous' },
  { val: 'internet', label: 'Internet' },
  { val: 'voix',     label: 'Appels' },
  { val: 'mixte',    label: 'Tout-en-un' },
]

const TRIS = [
  { val: '',          label: 'Par défaut' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'data_desc', label: 'Data ↓' },
]

export default function TelecomClient({
  forfaits, total, operateurs, currentOperateur, currentType, currentTri,
}: Props) {
  const [showWizard, setShowWizard] = useState(false)

  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (currentOperateur) p.set('operateur', currentOperateur)
    if (currentType) p.set('type', currentType)
    if (currentTri) p.set('tri', currentTri)
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    const s = p.toString()
    return `/telecom${s ? `?${s}` : ''}`
  }

  // Section recommandés : meilleur forfait par opérateur par groupe de validité
  // Section reste : tous les autres
  const { recommandeGroups, reste, recommandeIds } = useMemo(() => {
    const VORDER = ['1 jour', '7 jours', '30 jours', 'Autres']
    // Pour chaque validité → meilleur par opérateur
    const byValidite = new Map<string, Map<string, Forfait>>()
    for (const f of forfaits) {
      const vl = validiteLabel(f.validite_jours)
      if (!byValidite.has(vl)) byValidite.set(vl, new Map())
      const opMap = byValidite.get(vl)!
      const existing = opMap.get(f.operateur)
      if (!existing || scoreMixte(f) > scoreMixte(existing)) opMap.set(f.operateur, f)
    }
    const recIds = new Set<string>()
    const recommandeGroups: { label: string; items: Forfait[] }[] = []
    for (const vl of VORDER) {
      const opMap = byValidite.get(vl)
      if (!opMap) continue
      const items = Array.from(opMap.values()).sort((a, b) => scoreMixte(b) - scoreMixte(a))
      items.forEach(f => recIds.add(f.id))
      recommandeGroups.push({ label: vl, items })
    }
    const reste = forfaits.filter(f => !recIds.has(f.id))
    return { recommandeGroups, reste, recommandeIds: recIds }
  }, [forfaits])

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
        <div className="telecom-header-actions">
          {total > 0 && (
            <span className="telecom-count">{total} forfait{total > 1 ? 's' : ''}</span>
          )}
          <button className="wizard-trigger-btn" onClick={() => setShowWizard(true)}>
            🎯 Trouver mon forfait
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="telecom-filtres">
        <div className="filtres-bar telecom-filtres-inner" style={{ flexWrap: 'wrap' }}>
          <div className="filtres-group">
            <span className="filtres-label">Opérateur</span>
            <Link href={buildLink({ operateur: '', page: '1' })} className={`budget-pill${!currentOperateur ? ' active' : ''}`}>
              Tous
            </Link>
            {operateurs.map(op => (
              <Link
                key={op}
                href={buildLink({ operateur: op, page: '1' })}
                className={`budget-pill${currentOperateur === op ? ' active' : ''}`}
                style={currentOperateur === op ? { background: OP_COLORS[op]?.badge ?? 'var(--accent)', borderColor: OP_COLORS[op]?.badge ?? 'var(--accent)' } : {}}
              >
                {OP_ICONS[op] ?? '📡'} {op}
              </Link>
            ))}
          </div>

          <div className="filtres-group">
            <span className="filtres-label">Type</span>
            {TYPES.map(t => (
              <Link key={t.val} href={buildLink({ type: t.val, page: '1' })} className={`budget-pill${currentType === t.val ? ' active' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>

          <div className="filtres-group">
            <span className="filtres-label">Trier par</span>
            {TRIS.map(t => (
              <Link key={t.val} href={buildLink({ tri: t.val, page: '1' })} className={`budget-pill${currentTri === t.val ? ' active' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grille : recommandés + tous les forfaits */}
      {forfaits.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📡</span>
          <p>Aucun forfait trouvé pour ces critères.</p>
          <Link href="/telecom" className="budget-pill active" style={{ marginTop: 8 }}>
            Voir tous les forfaits
          </Link>
        </div>
      ) : (
        <div className="telecom-groupes">

          {/* ── Section recommandés ── */}
          {recommandeGroups.length > 0 && (
            <div className="telecom-section">
              <div className="telecom-section-header">
                <h2 className="telecom-section-titre">🏆 Recommandés — Meilleur rapport qualité/prix</h2>
                <p className="telecom-section-sub">Un forfait par opérateur, sélectionné selon votre budget</p>
              </div>
              {recommandeGroups.map(group => (
                <div key={group.label} className="telecom-groupe">
                  <h3 className="telecom-groupe-titre">
                    📅 <span>{group.label}</span>
                    <span className="telecom-groupe-count">{group.items.length} opérateur{group.items.length > 1 ? 's' : ''}</span>
                  </h3>
                  <div className="forfaits-grid">
                    {group.items.map(f => (
                      <ForfaitCard key={f.id} f={f} isRecommande={true} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tous les forfaits ── */}
          {reste.length > 0 && (
            <div className="telecom-section">
              <div className="telecom-section-header">
                <h2 className="telecom-section-titre">📋 Tous les forfaits</h2>
                <span className="telecom-groupe-count" style={{ fontSize: 13 }}>{reste.length} offre{reste.length > 1 ? 's' : ''}</span>
              </div>
              <div className="forfaits-grid">
                {reste.map(f => (
                  <ForfaitCard key={f.id} f={f} isRecommande={false} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Wizard */}
      {showWizard && <WizardForfait onClose={() => setShowWizard(false)} />}
    </div>
  )
}
