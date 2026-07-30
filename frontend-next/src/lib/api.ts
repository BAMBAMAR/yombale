const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const SSR_SECRET = process.env.SSR_SECRET || '';

export async function apiFetch<T>(path: string): Promise<T> {
  const primaryUrl = `${BACKEND}/api${path}`;
  const headers: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {};
  let res: Response;
  try {
    res = await fetch(primaryUrl, { next: { revalidate: 300 }, headers, signal: AbortSignal.timeout(6000) });
  } catch {
    const fallbackUrl = primaryUrl.includes('127.0.0.1')
      ? primaryUrl.replace('127.0.0.1', 'localhost')
      : primaryUrl.replace('localhost', '127.0.0.1');
    res = await fetch(fallbackUrl, { next: { revalidate: 300 }, headers, signal: AbortSignal.timeout(6000) });
  }
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}
