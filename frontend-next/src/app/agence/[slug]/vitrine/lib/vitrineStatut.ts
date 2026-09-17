// frontend-next/src/app/agence/[slug]/vitrine/lib/vitrineStatut.ts
// Calcul en temps réel du statut d'ouverture d'une agence (Fuseau horaire Sénégal / UTC)

export const JOURS_SEMAINE_KEYS = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
] as const;

export function calculerStatutAgence(horaires?: Record<string, string>): {
  ouvert: boolean;
  label: string;
  badgeText: string;
  plageAujourdhui: string;
  jourActuelKey: string;
} {
  const JOURS_ORDRE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const now = new Date();
  const jourActuelKey = JOURS_ORDRE[now.getDay()];
  const defaultPlage =
    jourActuelKey === 'dimanche'
      ? 'Fermé'
      : jourActuelKey === 'samedi'
      ? '09:00 - 13:00'
      : '08:30 - 18:30';

  const plage = (horaires && horaires[jourActuelKey]) ? horaires[jourActuelKey] : defaultPlage;

  if (!plage || plage.toLowerCase().includes('fermé')) {
    return {
      ouvert: false,
      label: 'Fermé actuellement',
      badgeText: 'Fermé',
      plageAujourdhui: 'Fermé',
      jourActuelKey,
    };
  }

  const match = plage.match(/(\d{1,2})[:h](\d{2})?\s*-\s*(\d{1,2})[:h](\d{2})?/);
  if (match) {
    const debutH = parseInt(match[1], 10);
    const debutM = match[2] ? parseInt(match[2], 10) : 0;
    const finH = parseInt(match[3], 10);
    const finM = match[4] ? parseInt(match[4], 10) : 0;

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const minutesDebut = debutH * 60 + debutM;
    const minutesFin = finH * 60 + finM;

    if (minutesNow >= minutesDebut && minutesNow < minutesFin) {
      const heureFinStr = finM > 0 ? `${finH}h${String(finM).padStart(2, '0')}` : `${finH}h`;
      return {
        ouvert: true,
        label: `Ouvert jusqu'à ${heureFinStr}`,
        badgeText: `Ouvert • Ferme à ${heureFinStr}`,
        plageAujourdhui: plage,
        jourActuelKey,
      };
    } else if (minutesNow < minutesDebut) {
      const heureDebStr = debutM > 0 ? `${debutH}h${String(debutM).padStart(2, '0')}` : `${debutH}h`;
      return {
        ouvert: false,
        label: `Fermé (Ouvre à ${heureDebStr})`,
        badgeText: `Fermé • Ouvre à ${heureDebStr}`,
        plageAujourdhui: plage,
        jourActuelKey,
      };
    } else {
      return {
        ouvert: false,
        label: 'Fermé pour la journée',
        badgeText: 'Fermé',
        plageAujourdhui: plage,
        jourActuelKey,
      };
    }
  }

  return {
    ouvert: true,
    label: 'Ouvert',
    badgeText: 'Ouvert',
    plageAujourdhui: plage,
    jourActuelKey,
  };
}
