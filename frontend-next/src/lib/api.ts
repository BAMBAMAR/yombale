const isProd = process.env.NODE_ENV === 'production'

const BACKEND_URLS = Array.from(
  new Set(
    [
      process.env.BACKEND_URL,
      process.env.NEXT_PUBLIC_BACKEND_URL,
      'https://yombale.onrender.com',
      ...(!isProd ? ['http://127.0.0.1:3000', 'http://localhost:3000'] : []),
    ]
      .filter((u): u is string => Boolean(u && u.trim()))
      .filter((u) => !isProd || (!u.includes('localhost') && !u.includes('127.0.0.1')))
  )
)

const SSR_SECRET = process.env.SSR_SECRET || ''

export interface ApiFetchOptions {
  timeoutMs?: number
  retries?: number
  headers?: Record<string, string>
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = 12000, retries = 1, headers: customHeaders } = options

  const headers: Record<string, string> = {
    ...(SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}),
    'User-Agent': 'Nopalou-SSR/1.0',
    'Accept': 'application/json',
    ...customHeaders,
  }
  let lastError: Error | null = null

  for (const baseUrl of BACKEND_URLS) {
    const cleanBase = baseUrl.replace(/\/$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const url = `${cleanBase}/api${cleanPath}`

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Attente 700ms pour laisser à Render le temps de finaliser son démarrage
          await new Promise((r) => setTimeout(r, 700))
        }

        const res = await fetch(url, {
          cache: 'no-store',
          headers,
          signal: AbortSignal.timeout(timeoutMs),
        })

        if (res.ok) {
          return (await res.json()) as T
        }

        // Si le serveur est en cours de réveil (502/503/504), réessayer
        if (res.status >= 502 && res.status <= 504 && attempt < retries) {
          continue
        }

        lastError = new Error(`API ${path} → HTTP ${res.status}`)
        // Ne pas réessayer si c'est une erreur client (400, 404, etc.)
        if (res.status < 500) {
          break
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }
  }

  throw lastError || new Error(`API ${path} failed on all backends`)
}
