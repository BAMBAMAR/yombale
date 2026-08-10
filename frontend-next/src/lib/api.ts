const BACKEND_URLS = Array.from(
  new Set(
    [
      process.env.BACKEND_URL,
      process.env.NEXT_PUBLIC_BACKEND_URL,
      'http://127.0.0.1:3000',
      'http://localhost:3000',
    ].filter((u): u is string => Boolean(u && u.trim()))
  )
)

const SSR_SECRET = process.env.SSR_SECRET || ''

export async function apiFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}
  let lastError: Error | null = null

  for (const baseUrl of BACKEND_URLS) {
    try {
      const cleanBase = baseUrl.replace(/\/$/, '')
      const cleanPath = path.startsWith('/') ? path : `/${path}`
      const url = `${cleanBase}/api${cleanPath}`

      const res = await fetch(url, {
        next: { revalidate: 300 },
        headers,
        signal: AbortSignal.timeout(5000),
      })

      if (res.ok) {
        return (await res.json()) as T
      }
      lastError = new Error(`API ${path} → HTTP ${res.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError || new Error(`API ${path} failed on all backends`)
}
