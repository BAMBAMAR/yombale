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

export function fcfa(prix: number | string | null | undefined): string {
  if (prix === null || prix === undefined || prix === '') return '—';
  const num = Number(prix);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-FR').format(Math.round(num)) + ' FCFA';
}

export function escapeHtml(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function lienBoutiqueWhatsapp(slug: string): string {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const texte = encodeURIComponent(`boutique_${slug}`)
  return `https://wa.me/${numero}?text=${texte}`
}

export function formatPhone(tel: string | null | undefined): string {
  if (!tel) return ''
  const clean = tel.replace(/[\s\-\.\(\)]/g, '')
  // Cas numéro sénégalais 9 chiffres (ex: 771234567 ou 70/75/76/78/33...)
  if (/^(77|78|76|75|70|33)\d{7}$/.test(clean)) {
    return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`
  }
  // Cas indicatif +221 ou 00221 suivi de 9 chiffres
  if (/^(?:\+221|00221)(77|78|76|75|70|33)\d{7}$/.test(clean)) {
    const core = clean.replace(/^(?:\+221|00221)/, '')
    return `+221 ${core.slice(0, 2)} ${core.slice(2, 5)} ${core.slice(5, 7)} ${core.slice(7, 9)}`
  }
  return tel
}

export function formatNomPropre(nom: string | null | undefined): string {
  if (!nom) return ''
  return nom
    .trim()
    .split(/\s+/)
    .map(mot => mot.charAt(0).toUpperCase() + mot.slice(1).toLowerCase())
    .join(' ')
}

export function decodeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
