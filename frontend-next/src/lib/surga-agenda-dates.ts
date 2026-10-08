// Dates de l'agenda de Surga, en heure de l'appareil.

const deuxChiffres = (n: number) => String(n).padStart(2, '0')

// « AAAA-MM-JJ » d'une date, dans le fuseau de l'appareil (toISOString rendrait le jour en temps universel).
export const jourLocal = (d: Date): string => `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`
export const heureLocale = (d: Date): string => `${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`

// SRG-A2-017 : « + 1 heure » repousse le rappel d'une heure à partir de sa propre date et de sa propre heure.
// L'ancien calcul partait de l'instant présent : un rappel de demain 14 h revenait à aujourd'hui, une heure plus tard.
// Un rappel sans heure est compté à 9 h, l'heure à laquelle il est annoncé.
export function decalerDUneHeure(dateEvenement: string, heureEvenement?: string): { date: string; heure: string } {
  const [h, m] = (heureEvenement || '09:00').split(':').map((x) => parseInt(x, 10))
  const [annee, mois, jour] = dateEvenement.slice(0, 10).split('-').map((x) => parseInt(x, 10))
  const d = new Date(annee, (mois || 1) - 1, jour || 1, (h || 0) + 1, m || 0)
  return { date: jourLocal(d), heure: heureLocale(d) }
}
