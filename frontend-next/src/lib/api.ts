const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BACKEND}/api${path}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5min
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}
