import { cookies } from 'next/headers'
import AdminScrapingClient from './AdminScrapingClient'

const COOKIE = 'nopalou_admin'

export const metadata = {
  title: 'Supervision Scraping & Flux — Admin Nopalou',
  description: 'Observabilité en temps réel des collectes de données, qualité, fraîcheur et état des sources marchandes.',
}

export default async function AdminScrapingPage() {
  const jar = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  return <AdminScrapingClient secret={secret} />
}
