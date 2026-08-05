import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let res: Response

    try {
      res = await backendFetch('/api/boutiques/magic-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      // Fallback si pas de session active ou erreur de verification
      res = await fetch(`${API}/api/boutiques/magic-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors de l\'import' }))
      return NextResponse.json(err, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur lors de l\'import' }, { status: 500 })
  }
}

