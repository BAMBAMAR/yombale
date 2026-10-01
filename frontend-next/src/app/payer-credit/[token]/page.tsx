import type { Metadata } from 'next'
import Link from 'next/link'
import PayerCreditClient from './PayerCreditClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  return {
    title: `Règlement Sécurisé Carnet de Crédit`,
    description: `Réglez votre solde boutique en 1 clic par Wave ou Orange Money et obtenez votre reçu instantanément.`,
  }
}

export default async function PayerCreditPage({ params }: Props) {
  const { token } = await params

  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3000'
  let dossier = null
  let erreur = null

  try {
    const res = await fetch(`${backendUrl}/api/public-credit/${token}`, {
      cache: 'no-store'
    })
    const json = await res.json()
    if (json.success) {
      dossier = json
    } else {
      erreur = json.error || 'Dossier de créance introuvable ou lien expiré.'
    }
  } catch (err: any) {
    erreur = 'Impossible de joindre le serveur de facturation Nopalou.'
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
              NOPALOU <span style={{ color: 'var(--accent, #C75B00)' }}>COMMERCE</span>
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
            Règlement Sécurisé de Créance
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Paiement certifié 0% commission et mise à jour immédiate du carnet
          </p>
        </div>

        {/* Composant interactif client */}
        <PayerCreditClient
          token={token}
          initialData={dossier}
          initialError={erreur}
        />
      </div>
    </div>
  )
}
