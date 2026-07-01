const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';
const SSR_SECRET = process.env.SSR_SECRET || '';

export async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BACKEND}/api${path}`;
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {},
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}
