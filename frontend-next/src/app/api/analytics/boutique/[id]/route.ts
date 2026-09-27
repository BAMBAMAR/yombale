import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const search = req.nextUrl.search || ''
    const headers: Record<string, string> = {}
    const auth = req.headers.get('authorization')
    if (auth) headers['Authorization'] = auth

    const res = await backendFetch(`/api/analytics/boutique/${params.id}${search}`, {
      headers,
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error || 'Erreur récupération analytics' },
        { status: res.status }
      )
    }
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[API Route] /analytics/boutique/[id] GET error:', error)
    return NextResponse.json({ error: 'Erreur proxy analytics' }, { status: 500 })
  }
}
