import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// Proxy générique pour toutes les sous-routes dynamiques /api/boutiques/[id]/*
async function proxy(req: NextRequest, boutiqueId: string, pathSegments: string[]) {
  try {
    const subpath = pathSegments.join('/')
    const search = req.nextUrl.search || ''
    const url = `/api/boutiques/${boutiqueId}/${subpath}${search}`
    
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

    const res = await backendFetch(url, {
      method: req.method,
      body,
      headers: contentType.includes('multipart/form-data') ? {} : { 'Content-Type': contentType || 'application/json' },
    })

    const responseContentType = res.headers.get('content-type') || ''
    if (responseContentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    } else if (responseContentType.includes('application/pdf') || responseContentType.includes('text/csv')) {
      const blob = await res.blob()
      return new NextResponse(blob, {
        status: res.status,
        headers: {
          'Content-Type': responseContentType,
          ...(res.headers.get('content-disposition') ? { 'Content-Disposition': res.headers.get('content-disposition')! } : {}),
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
