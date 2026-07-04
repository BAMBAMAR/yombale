import type { Metadata } from 'next'
import { getMesStatsApporteur } from './actions'
import ApporteurClient from './ApporteurClient'

export const metadata: Metadata = { title: 'Programme apporteur — Nopalou' }

export default async function ApporteurPage() {
  const stats = await getMesStatsApporteur()

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 680 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>💼 Programme apporteur d&apos;affaires</h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Recommandez Nopalou aux commerçants de votre réseau et touchez une commission sur leurs abonnements.
      </p>
      <ApporteurClient statsInitiales={stats} />
    </div>
  )
}
