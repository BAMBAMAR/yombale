import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-fetch'

// DELETE /api/boutiques/[id]/admins/[adminId] — Révoquer un administrateur délégué
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; adminId: string } }
) {
  try {
    const res = await backendFetch(`/api/boutiques/${params.id}/admins/${params.adminId}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[API Route] DELETE /api/boutiques/[id]/admins/[adminId] error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
