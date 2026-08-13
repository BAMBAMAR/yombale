import { redirect } from 'next/navigation'

export default async function ImmoBoutiqueRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab || 'commandes'
  redirect(`/boutique?tab=${tab}`)
}
