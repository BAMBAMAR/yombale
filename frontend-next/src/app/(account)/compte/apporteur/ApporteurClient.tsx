'use client'
import { useState, useTransition } from 'react'
import { devenirApporteur, type StatsApporteur } from './actions'
import { fcfa } from '@/lib/format'

const ETAPES = [
  {
    titre: 'Partagez votre lien',
    detail: 'Envoyez votre lien unique par WhatsApp, SMS ou en personne à un commerçant, une agence immo ou un vendeur de votre réseau.',
  },
  {
    titre: 'Il crée sa boutique',
    detail: 'Le commerçant clique sur votre lien et crée sa boutique Nopalou — votre code est enregistré automatiquement, sans rien à faire de votre côté.',
  },
  {
    titre: 'Vous touchez votre commission',
    detail: 'Dès qu\'il passe en abonnement Pro ou Business payant, vous touchez un pourcentage chaque mois, tant qu\'il reste abonné.',
  },
]

const MESSAGE_PARTAGE = (lien: string) =>
  `Salut ! Je te recommande Nopalou, le comparateur de prix N°1 au Sénégal. Tu peux créer ta boutique en ligne gratuitement (30 jours d'essai Pro offerts) et recevoir tes commandes directement sur WhatsApp. Crée ta boutique ici : ${lien}`

export default function ApporteurClient({ statsInitiales }: { statsInitiales: StatsApporteur | null }) {
  const [stats, setStats] = useState(statsInitiales)
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)

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

  if (!stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Comment ça marche</h2>
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
          {isPending ? 'Activation...' : 'Devenir apporteur d\'affaires'}
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
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>Votre code apporteur</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', margin: '0 0 16px' }}>{stats.code_apporteur}</p>

        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>Lien à partager</p>
        <code style={{ fontSize: 13, background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, display: 'block', marginBottom: 12, wordBreak: 'break-all' }}>
          {lien}
        </code>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={copierLien}
            style={{ padding: '10px 18px', background: copie ? '#16a34a' : '#1C2B4A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href="/assets/apporteur-affaires"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 18px', background: '#fff', color: '#C75B00',
              border: '1px solid #C75B00', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center' }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>

        <p style={{ fontSize: 12, color: '#64748B', margin: '16px 0 8px' }}>
          Visuels par palier d&apos;abonnement, à partager avec le commerçant que vous démarchez :
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/assets/palier/gratuit/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Gratuit →
          </a>
          <a href="/assets/palier/pro/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#C75B00', border: '1px solid #C75B00',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Pro →
          </a>
          <a href="/assets/palier/business/carre" target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 14px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f',
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Business →
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Commission due</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>{fcfa(stats.total_du)}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Déjà payé</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: 0 }}>{fcfa(stats.total_paye)}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
        Taux de commission actuel : {stats.taux_commission}% · Règlement à partir de {fcfa(stats.seuil_paiement)} cumulés
      </p>

      {/* Comment ça marche */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Comment ça marche</h2>
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
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Quoi dire à un commerçant</h2>
        <div style={{
          border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', background: '#F8FAFC',
        }}>
          <p style={{ fontSize: 13, color: '#1C2B4A', margin: 0, lineHeight: 1.8 }}>
            « Je te recommande Nopalou — ça te permet d&apos;avoir une boutique en ligne et de recevoir tes
            commandes directement sur WhatsApp, l&apos;outil que tu utilises déjà. Le premier mois est
            gratuit, sans engagement, et il n&apos;y a pas de commission cachée. Je peux t&apos;aider à la
            créer maintenant si tu veux, ça prend 5 minutes. »
          </p>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10 }}>
          Un argumentaire plus complet et un script de présentation détaillé sont disponibles auprès de
          l&apos;équipe Nopalou si vous démarchez régulièrement.
        </p>
      </div>

      {/* Boutiques recrutées */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Boutiques recrutées ({stats.boutiques.length})</h2>
        {stats.boutiques.length === 0 ? (
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Aucune boutique recrutée pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.boutiques.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 14 }}>
                <span>{b.nom}</span>
                <span style={{ color: b.abonnement_statut === 'actif' ? '#16a34a' : '#94A3B8' }}>
                  {b.plan ? `${b.plan} — ${b.abonnement_statut ?? 'inactif'}` : 'Sans abonnement'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
