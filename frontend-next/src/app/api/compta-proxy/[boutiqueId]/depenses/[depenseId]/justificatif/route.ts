import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

export async function POST(
  req: NextRequest,
  { params }: { params: { boutiqueId: string; depenseId: string } }
) {
  try {
    const formData = await req.formData()
    const res = await backendFetch(
      `/api/comptabilite/${params.boutiqueId}/depenses/${params.depenseId}/justificatif`,
      { method: 'POST', body: formData }
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur lors du transfert' }, { status: 500 })
  }
}
