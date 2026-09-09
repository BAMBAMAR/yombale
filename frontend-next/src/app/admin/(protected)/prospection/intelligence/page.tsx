import { cookies } from 'next/headers'
import IntelligenceClient from './IntelligenceClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function IntelligencePage() {
  const jar = await cookies()
  const secret = jar.get('nopalou_admin')?.value || ''

  let initialOverview: any = null
  let initialRecommandation: any = null

  try {
    const [resOverview, resReco] = await Promise.all([
      fetch(`${BACKEND}/api/prospection/intelligence/overview`, {
        headers: { 'x-admin-secret': secret },
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/prospection/intelligence/recommandation`, {
        headers: { 'x-admin-secret': secret },
        cache: 'no-store',
      })
    ])

    if (resOverview.ok) {
      initialOverview = await resOverview.json()
    }
    if (resReco.ok) {
      const dataR = await resReco.json()
      initialRecommandation = dataR.recommandation
    }
  } catch (err) {
    console.error('[INTELLIGENCE PAGE LOAD ERR]:', err)
  }

  return (
    <IntelligenceClient
      initialOverview={initialOverview}
      initialRecommandation={initialRecommandation}
      secret={secret}
    />
  )
}
