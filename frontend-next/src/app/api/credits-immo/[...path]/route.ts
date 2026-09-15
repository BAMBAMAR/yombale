import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

async function forwardRequest(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const subPath = params.path ? params.path.join('/') : ''
  const search = req.nextUrl.search || ''
  const fullPath = `/api/credits-immo/${subPath}${search}`

  const options: RequestInit = {
    method: req.method,
  }

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const body = await req.json()
      options.body = JSON.stringify(body)
    } catch {
      // Pas de body JSON
    }
  }

  try {
    const res = await backendFetch(fullPath, options)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[API Proxy Route] ${req.method} ${fullPath} error:`, err)
    return NextResponse.json({ success: false, error: 'Erreur proxy backend' }, { status: 500 })
  }
}

export const GET = forwardRequest
export const POST = forwardRequest
export const PUT = forwardRequest
export const DELETE = forwardRequest
export const PATCH = forwardRequest
