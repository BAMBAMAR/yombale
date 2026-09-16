/**
 * Helper d'authentification pour les espaces Agences Immobilières.
 * Résout le token de session JWT depuis les stockages client (nopalou_token, token, sessionStorage).
 */

export function getImmoAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('nopalou_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('nopalou_token') ||
    null
  )
}

export function getImmoAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getImmoAuthToken()
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
