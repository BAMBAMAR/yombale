import type { Metadata } from 'next'
import FavorisClient from './FavorisClient'

export const metadata: Metadata = {
  title: 'Mes favoris — Nopalou',
  description: 'Vos produits favoris enregistrés sur Nopalou.',
}

export default function FavorisPage() {
  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>
          Mes <span style={{ color: 'var(--accent)' }}>favoris</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Produits sauvegardés localement sur cet appareil.
        </p>
      </div>
      <FavorisClient />
    </div>
  )
}
