// Réglages de Surga : ce que l'appareil joint au briefing, et qui l'emporte entre l'appareil et le compte.
// SRG-A2-011 : les réglages faits en invité n'atteignaient ni le briefing, ni le compte à la connexion, ni un autre
// appareil ; l'appareil gardait toujours ses propres réglages, même quand le compte en portait d'autres.

import type { SurgaPreferencesData } from '@/app/surga/components/SurgaOnboarding'
import { quartierDe } from '@/lib/surga-meteo'

type Prefs = Partial<SurgaPreferencesData>

// Marqueur d'un changement fait par un compte connecté et pas encore reçu par le serveur. Préfixe « surga_offline_ » :
// il est retiré de l'appareil à la déconnexion, avec le reste de ce qui appartient au compte.
export const CLE_ENVOI_EN_ATTENTE = 'surga_offline_preferences_en_attente'

export function envoiEnAttente(): boolean {
  try { return localStorage.getItem(CLE_ENVOI_EN_ATTENTE) === '1' } catch { return false }
}

/**
 * Paramètres d'adresse du briefing : la zone, les briques, l'heure et les équipes choisies sur l'appareil.
 * Le serveur ne s'en sert que pour un invité ou un compte pas encore configuré (rien n'est écrit).
 */
export function parametresBriefing(prefs?: Prefs | null): string {
  if (!prefs) return ''
  const p = new URLSearchParams()
  if (Array.isArray(prefs.quartiers) && prefs.quartiers.length > 0) p.set('quartier', quartierDe(prefs))
  if (Array.isArray(prefs.modules_actifs) && prefs.modules_actifs.length > 0) p.set('modules', prefs.modules_actifs.join(','))
  if (typeof prefs.heure_briefing === 'string') p.set('heure', prefs.heure_briefing)
  if (Array.isArray(prefs.equipes_suivies) && prefs.equipes_suivies.length > 0) p.set('equipes', prefs.equipes_suivies.join('|'))
  return p.toString()
}

export type DecisionPreferences =
  | { action: 'rien' }
  | { action: 'adopter'; prefs: SurgaPreferencesData }
  | { action: 'envoyer'; prefs: SurgaPreferencesData }

const CHAMPS_COMPARES = ['modules_actifs', 'heure_briefing', 'langue', 'quartiers', 'equipes_suivies', 'audio_actif', 'sidebar_services', 'rail_widgets'] as const

// Les champs que le serveur ne renseigne pas (colonnes absentes d'une ancienne ligne) ne comptent pas comme une différence.
function memesReglages(a: Prefs, b: Prefs): boolean {
  return CHAMPS_COMPARES.every((c) => b[c] == null || a[c] == null || JSON.stringify(a[c]) === JSON.stringify(b[c]))
}

// Le réglage du compte, complété par ce que l'appareil porte et que le compte ne connaît pas.
function fusionnerServeur(locales: Prefs | null, serveur: Prefs): SurgaPreferencesData {
  const base: Record<string, unknown> = { ...(locales || {}) }
  for (const c of CHAMPS_COMPARES) if (serveur[c] != null) base[c] = serveur[c]
  base.onboarding_termine = true
  return base as unknown as SurgaPreferencesData
}

/**
 * Qui l'emporte, l'appareil ou le compte ?
 * - Invité : le serveur ne porte que des valeurs par défaut, l'appareil garde ses réglages.
 * - Compte pas encore configuré : l'appareil lui envoie ses réglages.
 * - Compte déjà configuré, réglages différents : ceux du compte sont repris (on ne refait pas la configuration à
 *   chaque appareil), sauf si l'appareil porte un changement du compte que le serveur n'a pas encore reçu.
 * La décision ne dépend d'aucune comparaison de dates : l'heure d'un appareil n'est pas fiable, et une configuration
 * faite en invité avant la connexion paraîtrait plus récente que le compte.
 */
export function reconcilierPreferences(
  locales: Prefs | null,
  serveur: Prefs | null,
  { connecte, enAttente = false }: { connecte: boolean; enAttente?: boolean }
): DecisionPreferences {
  if (!connecte) return { action: 'rien' }
  const serveurFait = serveur?.onboarding_termine === true
  const localFait = !!locales && Array.isArray(locales.modules_actifs)

  if (!localFait) return serveurFait ? { action: 'adopter', prefs: fusionnerServeur(null, serveur as Prefs) } : { action: 'rien' }
  if (!serveurFait) return { action: 'envoyer', prefs: { ...(locales as SurgaPreferencesData), onboarding_termine: true } }
  if (memesReglages(locales as Prefs, serveur as Prefs)) return { action: 'rien' }
  return enAttente
    ? { action: 'envoyer', prefs: { ...(locales as SurgaPreferencesData), onboarding_termine: true } }
    : { action: 'adopter', prefs: fusionnerServeur(locales, serveur as Prefs) }
}

/**
 * Garde les réglages sur l'appareil et les envoie au compte.
 * Un envoi qui n'a pas abouti (réseau coupé, serveur en erreur) pose le marqueur « en attente » : au prochain
 * chargement, ces réglages-là l'emportent sur ceux du compte. Un invité (401) n'a pas de compte à qui les envoyer :
 * rien n'est en attente.
 */
export async function enregistrerPreferences(prefs: SurgaPreferencesData): Promise<SurgaPreferencesData> {
  try { localStorage.setItem('surga_preferences', JSON.stringify(prefs)) } catch {}
  let enAttente = true
  try {
    const r = await fetch('/api/surga/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) })
    const data = r.status === 401 ? null : await r.json().catch(() => null)
    enAttente = r.status !== 401 && !(r.ok && data?.success)
  } catch {}
  try {
    if (enAttente) localStorage.setItem(CLE_ENVOI_EN_ATTENTE, '1')
    else localStorage.removeItem(CLE_ENVOI_EN_ATTENTE)
  } catch {}
  return prefs
}
