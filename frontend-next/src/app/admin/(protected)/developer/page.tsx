import type { Metadata } from 'next'
import DeveloperClient from './DeveloperClient'

export const metadata: Metadata = { title: 'Portail Développeur API — Admin Nopalou' }

export default function AdminDeveloperPage() {
  return <DeveloperClient />
}
