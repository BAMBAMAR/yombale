import { cookies } from 'next/headers'
import EquipeAdminClient from './EquipeAdminClient'

export const metadata = {
  title: 'Équipe & Droits RBAC | Nopalou Control Center',
}

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminEquipePage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
  } else {
    headers['X-Admin-Secret'] = token
  }

  let membres: any[] = []
  let errorMsg: string | null = null

  try {
    const res = await fetch(`${BACKEND}/api/admin/equipe`, { headers, cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      membres = d.membres || []
    } else if (res.status === 403) {
      errorMsg = 'Accès réservé au Super Administrateur.'
    }
  } catch (err) {
    console.error('[ADMIN_EQUIPE_FETCH_ERR]', err)
  }

  return <EquipeAdminClient initialMembres={membres} initialError={errorMsg} />
}
