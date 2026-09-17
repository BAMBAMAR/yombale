import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

async function forwardRequest(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const subPath = params.path ? params.path.join('/') : ''
  const search = req.nextUrl.search || ''
  const fullPath = `/api/biens/${subPath}${search}`

  const headers: Record<string, string> = {}
  const clientAuth = req.headers.get('authorization')
  if (clientAuth) {
    headers['Authorization'] = clientAuth
  }
  const clientContentType = req.headers.get('content-type') || ''
  if (clientContentType && !clientContentType.includes('multipart/form-data')) {
    headers['Content-Type'] = clientContentType
  }

  const options: RequestInit = {
    method: req.method,
    headers,
  }

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      try {
        options.body = await req.formData()
      } catch {
        // Fallback
      }
    } else {
      try {
        const body = await req.json()
        options.body = JSON.stringify(body)
      } catch {
        // Pas de body JSON
      }
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
