import { backendFetch } from '@/lib/backend-fetch'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await backendFetch(`/api/analytics/boutique/${params.id}`)
    if (!res.ok) {
      return Response.json({}, { status: 200 })
    }
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: 200 })
  } catch (error) {
    return Response.json({}, { status: 200 })
  }
}
