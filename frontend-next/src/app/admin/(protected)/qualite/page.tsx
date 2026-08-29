import { cookies } from 'next/headers'
import AdminQualiteClient from './AdminQualiteClient'

const COOKIE = 'nopalou_admin'

export const metadata = {
  title: 'Qualité Données & Quarantines — Admin Nopalou',
}

export default async function QualiteDataPage() {
  const jar = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  return <AdminQualiteClient secret={secret} />
}
