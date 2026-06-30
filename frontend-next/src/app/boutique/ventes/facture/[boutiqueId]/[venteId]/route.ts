import { backendFetch } from '@/lib/backend-fetch'

export async function GET(_req: Request, { params }: { params: { boutiqueId: string; venteId: string } }) {
  const res = await backendFetch(`/api/comptabilite/${params.boutiqueId}/ventes/${params.venteId}/facture.pdf`)
  if (!res.ok) return new Response('Erreur', { status: res.status })
  const buf = await res.arrayBuffer()
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'inline; filename="facture.pdf"',
    },
  })
}
