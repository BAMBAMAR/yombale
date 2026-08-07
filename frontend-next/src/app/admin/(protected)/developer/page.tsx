import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import DeveloperClient from './DeveloperClient'

export const metadata: Metadata = { title: 'Portail Développeur API — Admin Nopalou' }

export default async function AdminDeveloperPage() {
  const jar = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  return <DeveloperClient secret={secret} />
}
