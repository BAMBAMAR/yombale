import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('[API CHAT PROXY ERR]:', err?.message)
    return NextResponse.json(
      {
        success: false,
        reply: 'Service momentanément indisponible. Veuillez continuer sur WhatsApp.',
        whatsappUrl: 'https://wa.me/221708717942?text=Bonjour',
        items: [],
        chips: [],
      },
      { status: 500 }
    )
  }
}
