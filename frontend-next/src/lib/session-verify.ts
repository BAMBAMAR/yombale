import { jwtVerify, type JWTPayload } from 'jose'

// Sans 'server-only' : importé aussi par le middleware (runtime Edge).
// Le cookie nopalou_session peut être signé par Next (SESSION_SECRET) ou par le backend
// (JWT_SECRET, connexion WhatsApp / magic link) : on accepte l'une ou l'autre clé, jamais un jeton non vérifié.
const SECRETS = Array.from(
  new Set([process.env.SESSION_SECRET, process.env.JWT_SECRET].filter((s): s is string => !!s))
).map((s) => new TextEncoder().encode(s))

// Jetons à usage unique signés avec JWT_SECRET côté backend : jamais valables comme session
const TYPES_JETON_NON_SESSION = new Set(['verify', 'reset', '2fa_pending', 'magic'])

export async function verifierJetonSession(token: string): Promise<JWTPayload | null> {
  for (const key of SECRETS) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
      if (typeof payload.type === 'string' && TYPES_JETON_NON_SESSION.has(payload.type)) return null
      if (!payload.userId && !payload.id) return null
      return payload
    } catch {
      // clé suivante
    }
  }
  return null
}
