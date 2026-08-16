import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch('/api/boutiques/scan-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur proxy OCR' }, { status: 500 })
  }
}
