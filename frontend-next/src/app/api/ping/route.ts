/**
 * Route de health check applicatif pour la détection de connectivité PWA.
 * 
 * Cette route est utilisée par useOnlineStatus pour vérifier que le frontend
 * peut réellement atteindre le serveur (contrairement à navigator.onLine qui ment).
 * 
 * IMPORTANT : Cette route est exclue du cache SW (NetworkOnly dans sw.ts)
 * pour garantir qu'un succès signifie vraiment que le réseau fonctionne.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return new NextResponse('ok', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
