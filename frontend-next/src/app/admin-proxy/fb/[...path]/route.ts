import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

async function proxy(req: NextRequest, path: string) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const url  = `${BACKEND}/api/facebook-posts/${path}`
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
  const data = await r.json()
  return NextResponse.json(data, { status: r.status })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxy(req, path.join('/'))
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxy(req, path.join('/'))
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxy(req, path.join('/'))
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxy(req, path.join('/'))
}
