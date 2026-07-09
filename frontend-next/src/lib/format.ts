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

// Calcul côté serveur uniquement (Server Component) — pas de re-render client,
// donc pas de risque de mismatch d'hydratation malgré l'usage de Date.now().
export function tempsRelatif(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  const dt = typeof d === 'string' ? new Date(d) : d;
  const diffH = (Date.now() - dt.getTime()) / 3_600_000;
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${Math.floor(diffH)}h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 30) return `il y a ${diffJ}j`;
  return fmtDate(dt);
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
