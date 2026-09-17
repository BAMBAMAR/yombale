import type { Metadata } from 'next'
import Link from 'next/link'
import PayerLoyerClient from './PayerLoyerClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ echeanceId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { echeanceId } = await params
  return {
    title: `Paiement de Loyer Sécurisé — Nopalou Immo`,
    description: `Réglez votre loyer en 1 clic par Wave ou Orange Money et téléchargez votre quittance officielle instantanément.`,
  }
}

export default async function PayerLoyerPage({ params }: Props) {
  const { echeanceId } = await params

  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3000'
  let echeanceData = null
  let erreur = null

  try {
    const res = await fetch(`${backendUrl}/api/locatif-immo/public/echeance/${echeanceId}`, {
      cache: 'no-store'
    })
    const json = await res.json()
    if (json.success && json.echeance) {
      echeanceData = json.echeance
    } else {
      erreur = json.error || 'Échéance de loyer introuvable.'
    }
  } catch (err: any) {
    erreur = 'Impossible de joindre le serveur de facturation.'
  }

  return (
    <div
      style={{
        minHeight: '85vh',
        background: 'var(--bg, #F8F5F0)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* En-tête officiel */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              marginBottom: 12
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: 'var(--navy, #1C2B4A)',
                letterSpacing: '-0.03em'
              }}
            >
              NOPALOU <span style={{ color: 'var(--accent, #C75B00)' }}>IMMO</span>
            </span>
          </Link>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 'clamp(18px, 2.2vw, 22px)',
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)'
            }}
          >
            Paiement de Loyer Sécurisé
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Règlement certifié et émission instantanée de quittance PDF
          </p>
        </div>

        {/* Composant interactif client */}
        <PayerLoyerClient
          echeanceId={echeanceId}
          initialData={echeanceData}
          initialError={erreur}
        />
      </div>
    </div>
  )
}
