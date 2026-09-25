import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

async function forwardRequest(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const subPath = params.path ? params.path.join('/') : ''
  const search = req.nextUrl.search || ''
  const fullPath = `/api/locatif-immo/${subPath}${search}`

  const headers: Record<string, string> = {}
  const clientAuth = req.headers.get('authorization')
  if (clientAuth) {
    headers['Authorization'] = clientAuth
  }

  const options: RequestInit = {
    method: req.method,
    headers,
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
    const contentType = res.headers.get('content-type') || ''

    if (
      contentType.includes('application/pdf') ||
      contentType.includes('text/csv') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('spreadsheet') ||
      contentType.includes('vnd.ms-excel')
    ) {
      const arrayBuffer = await res.arrayBuffer()
      const responseHeaders = new Headers()
      responseHeaders.set('Content-Type', contentType)
      const disposition = res.headers.get('content-disposition')
      if (disposition) {
        responseHeaders.set('Content-Disposition', disposition)
      }
      return new NextResponse(arrayBuffer, {
        status: res.status,
        headers: responseHeaders,
      })
    }

    const text = await res.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      data = { success: res.ok, error: text || 'Réponse inattendue du serveur' }
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur proxy backend'
    console.error(`[API Proxy Route] ${req.method} ${fullPath} error:`, errorMsg)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}

export const GET = forwardRequest
export const POST = forwardRequest
export const PUT = forwardRequest
export const DELETE = forwardRequest
export const PATCH = forwardRequest
