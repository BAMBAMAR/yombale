import { cookies } from 'next/headers'
import AdminAffiliateTrackingClient from './AdminAffiliateTrackingClient'

const COOKIE = 'nopalou_admin'

export const metadata = {
  title: 'Tracking Affiliation — Admin Nopalou',
}

export default async function AffiliateTrackingPage() {
  const jar = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  return <AdminAffiliateTrackingClient secret={secret} />
}
