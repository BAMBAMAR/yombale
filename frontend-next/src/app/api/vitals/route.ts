import { NextResponse } from 'next/server';

interface VitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
  pathname?: string;
  timestamp: number;
}

// Buffer in-memory des 100 dernières métriques Web Vitals
const vitalsBuffer: VitalMetric[] = [];
const MAX_BUFFER = 200;

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data || !data.name || typeof data.value !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const metric: VitalMetric = {
      id: String(data.id || Math.random().toString(36).slice(2)),
      name: String(data.name).toUpperCase(),
      value: Math.round(data.value * 100) / 100,
      rating: data.rating || (data.value < 2500 ? 'good' : data.value < 4000 ? 'needs-improvement' : 'poor'),
      delta: data.delta,
      navigationType: data.navigationType,
      pathname: data.pathname || '/',
      timestamp: Date.now(),
    };

    vitalsBuffer.push(metric);
    if (vitalsBuffer.length > MAX_BUFFER) {
      vitalsBuffer.shift();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
  }
}

export async function GET() {
  // Calcul des statistiques P75 et moyennes par métrique
  const summary: Record<string, { count: number; avg: number; p75: number; good: number; poor: number }> = {};

  const groups: Record<string, number[]> = {};
  for (const v of vitalsBuffer) {
    if (!groups[v.name]) groups[v.name] = [];
    groups[v.name].push(v.value);
    if (!summary[v.name]) {
      summary[v.name] = { count: 0, avg: 0, p75: 0, good: 0, poor: 0 };
    }
    summary[v.name].count += 1;
    if (v.rating === 'good') summary[v.name].good += 1;
    if (v.rating === 'poor') summary[v.name].poor += 1;
  }

  for (const [name, values] of Object.entries(groups)) {
    values.sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    summary[name].avg = Math.round((sum / values.length) * 100) / 100;
    const p75Idx = Math.floor(values.length * 0.75);
    summary[name].p75 = Math.round((values[p75Idx] ?? values[values.length - 1]) * 100) / 100;
  }

  return NextResponse.json({
    success: true,
    totalCollected: vitalsBuffer.length,
    metrics: summary,
    timestamp: new Date().toISOString(),
  });
}
