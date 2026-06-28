'use server'

import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

async function secret() {
  const jar = await cookies()
  return jar.get(COOKIE)?.value || ''
}

function headers(s: string): HeadersInit {
  return { 'X-Admin-Secret': s, 'Content-Type': 'application/json' }
}

export async function getFbPosts() {
  const s = await secret()
  const r = await fetch(`${BACKEND}/api/facebook-posts`, { headers: headers(s), cache: 'no-store' })
  if (!r.ok) throw new Error('Non autorisé')
  return r.json()
}

export async function creerFbPost(data: {
  message: string; lien?: string | null; image_url?: string | null;
  publier_instagram?: boolean; date_publication?: string | null
}) {
  const s = await secret()
  const r = await fetch(`${BACKEND}/api/facebook-posts`, {
    method: 'POST', headers: headers(s), body: JSON.stringify(data), cache: 'no-store',
  })
  const json = await r.json()
  if (!r.ok) throw new Error(json.error || 'Erreur')
  return json
}

export async function modifierFbPost(id: string, data: object) {
  const s = await secret()
  const r = await fetch(`${BACKEND}/api/facebook-posts/${id}`, {
    method: 'PATCH', headers: headers(s), body: JSON.stringify(data), cache: 'no-store',
  })
  const json = await r.json()
  if (!r.ok) throw new Error(json.error || 'Erreur')
  return json
}

export async function supprimerFbPost(id: string) {
  const s = await secret()
  const r = await fetch(`${BACKEND}/api/facebook-posts/${id}`, {
    method: 'DELETE', headers: headers(s), cache: 'no-store',
  })
  if (!r.ok) throw new Error('Erreur suppression')
  return { ok: true }
}

export async function publierFbPostMaintenant(id: string) {
  const s = await secret()
  const r = await fetch(`${BACKEND}/api/facebook-posts/${id}/publier`, {
    method: 'POST', headers: headers(s), cache: 'no-store',
  })
  const json = await r.json()
  if (!r.ok) throw new Error(json.error || 'Erreur publication')
  return json
}

export async function genererFbPost(type: string) {
  const s = await secret()
  const r = await fetch(`${BACKEND}/api/facebook-posts/generer/${type}`, {
    headers: headers(s), cache: 'no-store',
  })
  const json = await r.json()
  if (!r.ok) throw new Error(json.error || 'Aucun contenu trouvé')
  return json
}
