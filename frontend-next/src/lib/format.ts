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
