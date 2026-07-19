import type { Metadata } from 'next'
import Link from 'next/link'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import { FONCTIONNALITES_PLATEFORME, PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

export const metadata: Metadata = { title: 'Fonctionnalités & abonnements' }

export default async function FonctionnalitesPage() {
  await verifySession()

  let planActif: { plan: string; fin: string } | null = null
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (res.ok) {
      const data = await res.json()
      planActif = data.abonnement
    }
  } catch { /* page neutre si erreur */ }

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro = Number(settings.plan_pro_prix) || 15000
  const prixBusiness = Number(settings.plan_business_prix) || 35000
  const PRIX_PAR_PALIER: Record<string, number | null> = { gratuit: null, pro: prixPro, business: prixBusiness }

  const palierActuelId = planActif ? planActif.plan : 'gratuit'

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1C2B4A', marginBottom: 8 }}>
        Fonctionnalités & abonnements
      </h1>
      <p style={{ color: '#64748b', marginBottom: 40 }}>
        Tout ce que propose Nopalou, et ce qui change selon votre abonnement boutique.
      </p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          Ce que Nopalou propose
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {FONCTIONNALITES_PLATEFORME.map(f => (
            <div key={f.id} style={{
              border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, background: '#fff',
            }}>
              <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{f.emoji}</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1C2B4A', margin: '0 0 6px' }}>{f.label}</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          Boutique — choisissez votre palier
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {PALIERS_BOUTIQUE.map(palier => {
            const estActuel = palierActuelId === palier.id
            const prix = PRIX_PAR_PALIER[palier.id]
            return (
              <div key={palier.id} style={{
                border: `2px solid ${estActuel ? palier.couleur : '#e2e8f0'}`,
                borderRadius: 16, padding: 24, background: estActuel ? '#fffbf5' : '#fff',
                position: 'relative',
              }}>
                {estActuel && (
                  <span style={{
                    position: 'absolute', top: -12, left: 20,
                    background: palier.couleur, color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  }}>
                    VOTRE PALIER ACTUEL
                  </span>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: palier.couleur, marginBottom: 4 }}>
                  {palier.label}
                </h3>
                <p style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 16px' }}>
                  {prix ? `${prix.toLocaleString('fr-FR')} FCFA/mois` : 'Gratuit'}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {palier.avantages.map(a => (
                    <li key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                      <span style={{ color: palier.couleur, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
                {!estActuel && palier.id !== 'gratuit' && (
                  <Link href="/boutique/abonnement" style={{
                    display: 'block', textAlign: 'center', background: palier.couleur, color: '#fff',
                    padding: '10px 0', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                  }}>
                    Passer à {palier.label.replace('Boutique ', '')}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
