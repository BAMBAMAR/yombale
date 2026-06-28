import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

async function proxy(req: NextRequest, path = '') {
  try {
    const jar    = await cookies()
    const secret = jar.get(COOKIE)?.value
    if (!secret) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const url  = `${BACKEND}/api/facebook-posts${path ? '/' + path : ''}`
    const init: RequestInit = {
      method:  req.method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      cache:   'no-store',
    }
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      const body = await req.text()
      if (body) init.body = body
    }

    const r    = await fetch(url, init)
    const text = await r.text()
    try {
      return NextResponse.json(JSON.parse(text), { status: r.status })
    } catch {
      return NextResponse.json({ error: `Backend: ${text.slice(0, 200)}` }, { status: 502 })
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest)    { return proxy(req) }
export async function POST(req: NextRequest)   { return proxy(req) }
export async function PATCH(req: NextRequest)  { return proxy(req) }
export async function DELETE(req: NextRequest) { return proxy(req) }
