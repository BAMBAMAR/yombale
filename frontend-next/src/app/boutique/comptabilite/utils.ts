import type { DatePreset } from './types'
export { fcfa } from '@/lib/format'

export const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export const CAT_DEPENSES = [
  'loyer', 'stock', 'transport', 'salaires', 'marketing', 'fournitures', 'taxes', 'autre'
]

export const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  background: '#fff',
  boxSizing: 'border-box' as const,
}

export const labelStyle = {
  fontSize: 13,
  fontWeight: 600 as const,
  color: '#374151',
  display: 'block' as const,
  marginBottom: 4,
}

export function getDateRangeForPreset(preset: DatePreset): { from: string; to: string; label: string } {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  if (preset === 'today') {
    return { from: todayStr + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: 'Aujourd\'hui' }
  }
  if (preset === 'yesterday') {
    const yest = new Date(now.getTime() - 24 * 3600 * 1000)
    const yStr = yest.toISOString().slice(0, 10)
    return { from: yStr + 'T00:00:00.000Z', to: yStr + 'T23:59:59.999Z', label: 'Hier' }
  }
  if (preset === '7d') {
    const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    return { from: d7.toISOString().slice(0, 10) + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: '7 derniers jours' }
  }
  if (preset === '30d') {
    const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
    return { from: d30.toISOString().slice(0, 10) + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: '30 derniers jours' }
  }
  if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    return { from: firstDay + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: 'Ce mois-ci' }
  }
  if (preset === 'last_month') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    return { from: firstDayLastMonth + 'T00:00:00.000Z', to: lastDayLastMonth + 'T23:59:59.999Z', label: 'Mois dernier' }
  }
  if (preset === 'this_year') {
    const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    return { from: firstDayYear + 'T00:00:00.000Z', to: todayStr + 'T23:59:59.999Z', label: 'Cette année' }
  }
  return { from: '', to: '', label: 'Période personnalisée' }
}

export { KpiCard } from './components/ComptaKpiCard'

