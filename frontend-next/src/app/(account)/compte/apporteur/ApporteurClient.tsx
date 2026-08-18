'use client'
import { useState, useTransition, useEffect } from 'react'
import { devenirApporteur, type StatsApporteur } from './actions'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'

export default function ApporteurClient({ statsInitiales }: { statsInitiales?: StatsApporteur | null }) {
  const [stats, setStats] = useState(statsInitiales || null)
  const [loading, setLoading] = useState(statsInitiales === undefined)
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const { t } = useTranslation()

  const ETAPES = [
    {
      titre: t('account.step1Title'),
      detail: t('account.step1Detail'),
    },
    {
      titre: t('account.step2Title'),
      detail: t('account.step2Detail'),
    },
    {
      titre: t('account.step3Title'),
      detail: t('account.step3Detail'),
    },
  ]

  const MESSAGE_PARTAGE = (lien: string) =>
    `Salut ! Je te recommande Nopalou, le comparateur de prix N°1 au Sénégal. Tu peux créer ta boutique en ligne gratuitement (30 jours d'essai Pro offerts) et recevoir tes commandes directement sur WhatsApp. Crée ta boutique ici : ${lien}`

  useEffect(() => {
    if (statsInitiales !== undefined) return
    const cacheKey = 'nopalou_offline_apporteur_stats'
    const cached = localStorage.getItem(cacheKey)
    if (cached) { try { setStats(JSON.parse(cached)); setLoading(false) } catch(e) {} }

    import('./actions').then(m => {
      m.getMesStatsApporteur().then(fraiches => {
        setStats(fraiches)
        localStorage.setItem(cacheKey, JSON.stringify(fraiches))
      }).catch(err => {
        console.error('Erreur getMesStatsApporteur', err)
      }).finally(() => setLoading(false))
    })
  }, [statsInitiales])

  function activer() {
    setErreur(null)
    startTransition(async () => {
      const result = await devenirApporteur()
      if (result.error) { setErreur(result.error); return }
      const { getMesStatsApporteur } = await import('./actions')
      const fraiches = await getMesStatsApporteur()
      setStats(fraiches)
    })
  }

  if (loading && !stats) {
    return <p style={{ padding: 20 }}>{t('common.loading')}</p>
  }

  if (!stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('account.howItWorks')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ETAPES.map((e, i) => (
              <div key={e.titre} style={{
                border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
                background: '#fff', display: 'flex', gap: 14,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: '#C75B00', background: '#FFF7ED',
                  borderRadius: '50%', width: 26, height: 26, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', margin: '0 0 4px' }}>{e.titre}</p>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {erreur && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>
            {erreur}
          </div>
        )}
        <button
          onClick={activer}
          disabled={isPending}
          style={{ padding: '12px 32px', background: isPending ? '#9ca3af' : '#C75B00', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer' }}
        >
          {isPending ? t('account.activating') : t('account.becomeApporteur')}
        </button>
      </div>
    )
  }

  const lien = `https://nopalou.com/boutique?apporteur=${stats.code_apporteur}`
  const messageWhatsApp = MESSAGE_PARTAGE(lien)
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(messageWhatsApp)}`

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Code + lien + actions de partage */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>{t('account.apporteurCode')}</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', margin: '0 0 16px' }}>{stats.code_apporteur}</p>

        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>{t('account.shareLink')}</p>
        <code style={{ fontSize: 13, background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, display: 'block', marginBottom: 12, wordBreak: 'break-all' }}>
          {lien}
        </code>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={copierLien}
            style={{ padding: '10px 18px', background: copie ? '#16a34a' : '#1C2B4A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {copie ? t('account.copied') : t('account.copyLink')}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            {t('account.shareWhatsApp')}
          </a>
          <a
            href="/assets/apporteur-affaires"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#C75B00',
              border: '1px solid #C75B00', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            {t('account.downloadVisual')}
          </a>
          <a
            href="/assets/poster-ecosysteme"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#7C3AED', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            {t('account.posterEcosystem')}
          </a>
          <a
            href="/brochure-apporteur.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#1C2B4A',
              border: '1px solid #1C2B4A', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            {t('account.downloadBrochure')}
          </a>
        </div>

        <p style={{ fontSize: 12, color: '#64748B', margin: '16px 0 8px' }}>
          {t('account.tierVisualsPrompt')}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/assets/palier/gratuit/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            {t('account.tierFree')}
          </a>
          <a href="/assets/palier/pro/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#C75B00', border: '1px solid #C75B00',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            {t('account.tierPro')}
          </a>
          <a href="/assets/palier/business/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            {t('account.tierBusiness')}
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>{t('account.commissionDue')}</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>{fcfa(stats.total_du)}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>{t('account.alreadyPaid')}</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: 0 }}>{fcfa(stats.total_paye)}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
        {t('account.commissionRate')} {stats.taux_commission}% · {t('account.payoutThreshold')} {fcfa(stats.seuil_paiement)} {t('account.cumulated')}
      </p>

      {/* Comment ça marche */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('account.howItWorks')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ETAPES.map((e, i) => (
            <div key={e.titre} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
              background: '#fff', display: 'flex', gap: 14,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 800, color: '#C75B00', background: '#FFF7ED',
                borderRadius: '50%', width: 26, height: 26, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{i + 1}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', margin: '0 0 4px' }}>{e.titre}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{e.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Argumentaire simplifié */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('account.pitchTitle')}</h2>
        <div style={{
          border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', background: '#F8FAFC',
        }}>
          <p style={{ fontSize: 13, color: '#1C2B4A', margin: 0, lineHeight: 1.8 }}>
            {t('account.pitchDetail')}
          </p>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10 }}>
          {t('account.pitchNote')}
        </p>
      </div>

      {/* Boutiques recrutées */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('account.recruitedShops')} ({stats.boutiques.length})</h2>
        {stats.boutiques.length === 0 ? (
          <p style={{ fontSize: 14, color: '#94A3B8' }}>{t('account.noRecruitedShops')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.boutiques.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 14 }}>
                <span>{b.nom}</span>
                <span style={{ color: b.abonnement_statut === 'actif' ? '#16a34a' : '#94A3B8' }}>
                  {b.plan ? `${b.plan} — ${b.abonnement_statut ?? 'inactif'}` : t('account.noSubscription')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
