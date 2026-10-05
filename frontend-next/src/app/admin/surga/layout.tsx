import '@/styles/surga-admin.css'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/app/actions/admin'

export const metadata = {
  title: 'Surga Admin — Console de Commandement Autonome',
  description: 'Interface d\'administration dédiée de l\'assistant personnel Surga, entièrement isolée de la marketplace Nopalou.',
  robots: 'noindex, nofollow',
}

export default async function SurgaAdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminSession()
  if (!adminUser) redirect('/admin/login?next=/admin/surga')

  return <>{children}</>
}
