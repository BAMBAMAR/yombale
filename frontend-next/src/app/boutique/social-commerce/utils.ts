export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('nopalou_token') || localStorage.getItem('token') || '') : ''
  const headers = new Headers(init.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  })
}
