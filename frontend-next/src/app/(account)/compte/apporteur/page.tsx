import type { Metadata } from 'next'
import { getMesStatsApporteur } from './actions'
import ApporteurClient from './ApporteurClient'

export const metadata: Metadata = { title: 'Programme apporteur — Nopalou' }

export default async function ApporteurPage() {
  const stats = await getMesStatsApporteur()

  return <ApporteurClient statsInitiales={stats} />
}
