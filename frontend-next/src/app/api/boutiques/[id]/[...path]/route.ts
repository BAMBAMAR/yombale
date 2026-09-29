import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// Proxy générique pour toutes les sous-routes dynamiques /api/boutiques/[id]/*
async function proxy(req: NextRequest, boutiqueId: string, pathSegments: string[]) {
  try {
    const subpath = pathSegments.join('/')
    const search = req.nextUrl.search || ''
    const url = (subpath === 'commandes' || subpath.startsWith('commandes/'))
      ? `/api/comptabilite/${boutiqueId}/${subpath}${search}`
      : `/api/boutiques/${boutiqueId}/${subpath}${search}`
    
    const contentType = req.headers.get('content-type') || ''
    let body: BodyInit | undefined = undefined

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (contentType.includes('multipart/form-data')) {
        body = await req.formData()
      } else {
        const text = await req.text()
        if (text) body = text
      }
    }

    const forwardHeaders: Record<string, string> = contentType.includes('multipart/form-data')
      ? {}
      : { 'Content-Type': contentType || 'application/json' }

    const adminSecret = req.headers.get('x-admin-secret')
    if (adminSecret) forwardHeaders['X-Admin-Secret'] = adminSecret

    const authHeader = req.headers.get('authorization')
    if (authHeader) forwardHeaders['Authorization'] = authHeader

    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) forwardHeaders['Cookie'] = cookieHeader

    const res = await backendFetch(url, {
      method: req.method,
      body,
      headers: forwardHeaders,
    })

    const responseContentType = res.headers.get('content-type') || ''
    const contentDisposition = res.headers.get('content-disposition')

    if (responseContentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, {
        status: res.status,
        headers: contentDisposition ? { 'Content-Disposition': contentDisposition } : {},
      })
    } else if (responseContentType.includes('application/pdf') || responseContentType.includes('text/csv')) {
      const blob = await res.blob()
      return new NextResponse(blob, {
        status: res.status,
        headers: {
          'Content-Type': responseContentType,
          ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
        },
      })
    } else {
      const text = await res.text()
      return new NextResponse(text, { status: res.status })
    }
  } catch (err) {
    console.error(`[API Route] Proxy error on /boutiques/${boutiqueId}/${pathSegments.join('/')}:`, err)
    return NextResponse.json({ error: 'Erreur proxy serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string; path: string[] } }) {
  return proxy(req, params.id, params.path || [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string; path: string[] } }) {
  return proxy(req, params.id, params.path || [])
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; path: string[] } }) {
  return proxy(req, params.id, params.path || [])
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; path: string[] } }) {
  return proxy(req, params.id, params.path || [])
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; path: string[] } }) {
  return proxy(req, params.id, params.path || [])
}
