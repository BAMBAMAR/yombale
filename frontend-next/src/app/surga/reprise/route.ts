import { ORIGINE_SURGA } from '@/lib/surga-adresse'
import { pageDeReprise } from '@/lib/surga-reprise'

// D83 : page de l'ancienne adresse qui remet à l'origine de Surga les données gardées sur l'appareil.
// Sans origine propre réglée, elle n'existe pas. Le middleware n'autorise son affichage en cadre qu'à cette origine.
export const dynamic = 'force-dynamic'

export function GET() {
  if (!ORIGINE_SURGA) {
    return Response.json({ success: false, error: 'Not Found' }, { status: 404 })
  }
  return new Response(pageDeReprise(ORIGINE_SURGA), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
