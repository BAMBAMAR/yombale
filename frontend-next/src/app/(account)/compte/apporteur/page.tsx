import type { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import ApporteurClient from './ApporteurClient'

export const metadata: Metadata = {
  title: 'Programme Apporteur d\'Affaires — Nopalou',
  description: 'Gagnez 20% de commissions récurrentes à vie sur chaque commerçant et boutique recommandés.',
}

export default async function ApporteurPage() {
  await verifySession()

  return <ApporteurClient />
}
