import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ApporteurPage() {
  redirect('/compte?tab=apporteur')
}

