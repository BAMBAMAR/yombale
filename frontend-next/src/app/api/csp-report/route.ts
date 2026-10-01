import { NextResponse } from 'next/server'

// AUD-149 : réception des violations de la politique de sécurité de contenu en mode « rapport seul ».
// On ne conserve que l'essentiel (directive, ressource bloquée, page) et on borne la taille : aucun cookie ni contenu.
export async function POST(request: Request) {
  try {
    const brut = await request.text()
    if (brut.length > 8192) return new NextResponse(null, { status: 413 })
    const r = JSON.parse(brut)?.['csp-report'] ?? {}
    console.warn('[CSP-REPORT]', JSON.stringify({
      directive: String(r['violated-directive'] ?? '').slice(0, 80),
      bloque: String(r['blocked-uri'] ?? '').slice(0, 200),
      page: String(r['document-uri'] ?? '').split('?')[0].slice(0, 200),
    }))
  } catch {
    /* rapport illisible : ignoré */
  }
  return new NextResponse(null, { status: 204 })
}
