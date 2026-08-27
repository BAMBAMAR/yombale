import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MesAnnoncesImmoRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const sp = new URLSearchParams()
  sp.set('tab', 'mes-annonces-immo')

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'tab' && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => sp.append(key, v))
        } else {
          sp.set(key, value)
        }
      }
    }
  }

  redirect(`/compte?${sp.toString()}`)
}
