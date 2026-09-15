import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search || ''
    const res = await backendFetch(`/api/agences${search}`, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] GET /api/agences error:', err)
    return NextResponse.json({ success: false, error: 'Erreur proxy /api/agences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch('/api/agences', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] POST /api/agences error:', err)
    return NextResponse.json({ success: false, error: 'Erreur proxy /api/agences' }, { status: 500 })
  }
}
