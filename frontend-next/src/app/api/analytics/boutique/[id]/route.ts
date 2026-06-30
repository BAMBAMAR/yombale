import { backendFetch } from '@/lib/backend-fetch'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const res = await backendFetch(`/api/analytics/boutique/${params.id}`)
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
