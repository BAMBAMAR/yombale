import type { Metadata } from 'next'
import TarifsBoutiqueClient from './TarifsBoutiqueClient'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Tarifs & Forfaits Vendeurs & Agences Immobilières | Nopalou Sénégal',
  description: 'Découvrez nos forfaits d’abonnement pour boutiques (dès 2.500 FCFA/mois) et agences immobilières (dès 0 FCFA). 0% de commission, paiement Wave et Orange Money.',
  keywords: ['tarifs boutique en ligne sénégal', 'forfait vendeur dakar', 'tarifs agence immobilière sénégal', 'gestion locative sénégal wave', 'logiciel agence dakar', 'alternative shopify sénégal', 'nopalou tarifs'],
  alternates: {
    canonical: `${BASE}/tarifs-boutique`,
  },
  openGraph: {
    title: 'Tarifs & Formules Nopalou — Boutiques & Agences Immobilières',
    description: 'Boutiques en ligne & Gestion locative immobilière au Sénégal. 0% de commission, paiements Wave & Orange Money.',
    url: `${BASE}/tarifs-boutique`,
    type: 'website',
  },
}

const FAQ_STRUCTURED_DATA = [
  { q: 'Combien coûte la création d’une boutique en ligne sur Nopalou ?', a: 'La création de boutique démarre dès 2.500 FCFA par mois avec la formule Boutique Taf Taf, avec 30 jours 100% offerts sans engagement.' },
  { q: 'Combien coûte Nopalou pour une agence immobilière ou un gestionnaire locatif ?', a: 'Le plan Agence Essentiel est 100% gratuit sans limitation de durée et inclut jusqu\'à 5 négociateurs, la gestion des mandats et la génération de baux conformes OHADA.' },
  { q: 'Comment mes clients ou locataires paient-ils ?', a: 'Vos clients ou locataires règlent directement par Wave ou Orange Money depuis leur smartphone sans frais cachés ni déplacement.' },
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_STRUCTURED_DATA.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function TarifsBoutiquePage({
  searchParams,
}: {
  searchParams?: { secteur?: string }
}) {
  const initialSecteur = searchParams?.secteur === 'immo' ? 'immo' : 'commerce'
  let initialPlans = []

  try {
    const res = await fetch(`${BACKEND}/api/plans/public`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      initialPlans = data.plans || []
    }
  } catch (err) {
    console.error('[TARIFS_PAGE_FETCH_ERR]', err)
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }} />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', paddingBottom: 80, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* ── HERO HEADER SAAS PREMIUM ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          color: '#ffffff',
          padding: '80px 20px 140px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glassmorphism circles */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', right: '0', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>

          <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(199,91,0,0.2)', color: '#fed7aa', padding: '6px 16px', borderRadius: 20,
              fontSize: 13, fontWeight: 800, marginBottom: 20, border: '1px solid rgba(199,91,0,0.4)', letterSpacing: '0.05em'
            }}>
              PRIX TRANSPARENTS &amp; SANS COMMISSION
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Investissez dans votre succès, <br/>sans surprise.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#94a3b8', maxWidth: 650, margin: '0 auto 0', lineHeight: 1.6 }}>
              Aucune commission sur vos ventes ni sur vos loyers. <br/>Boutiques de commerce et agences immobilières au Sénégal.
            </p>
          </div>
        </section>

        {/* ── CLIENT CONTAINER DYNAMIQUE (FORFAITS, MATRICE, COMPARATIF & FAQ) ── */}
        <TarifsBoutiqueClient initialSecteur={initialSecteur} initialPlans={initialPlans} />

      </main>
    </>
  )
}
