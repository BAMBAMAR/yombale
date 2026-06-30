const MOIS = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

// Formatage de date sans toLocaleDateString (évite les erreurs d'hydratation SSR/client)
export function fmtDate(d: string | Date): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${String(dt.getDate()).padStart(2,'0')} ${MOIS[dt.getMonth()]} ${dt.getFullYear()}`
}

export function fmtDateHeure(d: string | Date): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${String(dt.getDate()).padStart(2,'0')} ${MOIS[dt.getMonth()]} ${String(dt.getHours()).padStart(2,'0')}h${String(dt.getMinutes()).padStart(2,'0')}`
}

export function fcfa(prix: number | string | null): string {
  if (!prix) return '—';
  return new Intl.NumberFormat('fr-FR').format(Number(prix)) + ' FCFA';
}

export function escapeHtml(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
