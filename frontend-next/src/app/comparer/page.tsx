import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ComparerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const sp = new URLSearchParams()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => sp.append(key, v))
        } else {
          sp.set(key, value)
        }
      }
    }
  }

  const query = sp.toString()
  redirect(query ? `/comparaison?${query}` : '/comparaison')
}
