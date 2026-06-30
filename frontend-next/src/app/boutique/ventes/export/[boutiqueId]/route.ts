import { backendFetch } from '@/lib/backend-fetch'

export async function GET(_req: Request, { params }: { params: { boutiqueId: string } }) {
  const res = await backendFetch(`/api/comptabilite/${params.boutiqueId}/ventes/export.csv`)
  if (!res.ok) return new Response('Erreur', { status: res.status })
  const body = await res.text()
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment; filename="ventes.csv"',
    },
  })
}
