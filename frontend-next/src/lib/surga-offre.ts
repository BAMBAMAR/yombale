'use client'

// Offre commerciale de Surga côté écran : formules, durées, quotas gratuits, ouverture des ventes.
// Tout vient de la console d'administration (GET /api/surga/abonnements/offre) ; AUCUN prix, AUCUNE durée et AUCUN quota
// n'est écrit ici. Les textes sont construits à partir des chiffres reçus, et sans chiffre (réponse absente) ils restent
// neutres plutôt que d'afficher une valeur supposée.

import { useCallback, useEffect, useState } from 'react'
import { formaterFCFA } from '@/lib/surga-formatting'

export type CycleOffre = 'hebdomadaire' | 'mensuel' | 'annuel'

export interface OffreCycle {
  cycle: CycleOffre
  jours: number
  libelle: string
  montant: number
}

export interface OffrePlan {
  id: string
  nom: string
  type: 'b2c' | 'b2b' | string
  description: string
  avantages: string[]
  badge_promo?: string
  cycles: OffreCycle[]
}

export interface OffreGratuit {
  cv: number
  lettres_par_mois: number
  simulations_par_semaine: number
  suivis_demarche: number
}

export interface Offre {
  ventes_ouvertes: boolean
  plans: OffrePlan[]
  gratuit: OffreGratuit
}

// ───────────────────────────── Textes (fonctions pures, testées)

const accord = (n: number, singulier: string, pluriel: string) => (n > 1 ? pluriel : singulier)

/** Formule proposée aux particuliers (la première en vente), ou null. */
export function planParticulier(offre: Offre | null | undefined): OffrePlan | null {
  return offre?.plans.find((p) => p.type === 'b2c' && p.cycles.length > 0) || null
}

/** Nom de la formule, ou une formulation neutre quand l'offre n'est pas connue. */
export function nomOffre(offre: Offre | null | undefined): string {
  return planParticulier(offre)?.nom || 'l’abonnement Surga'
}

/** « Passer à Surga Plus », ou « S’abonner » quand le nom n'est pas connu. */
export function libelleAbonnement(offre: Offre | null | undefined): string {
  const plan = planParticulier(offre)
  return plan ? `Passer à ${plan.nom}` : 'S’abonner'
}

/** « dès 500 FCFA » : le plus petit montant proposé, ou null. */
export function prixDepuis(offre: Offre | null | undefined): string | null {
  const plan = planParticulier(offre)
  if (!plan) return null
  const min = Math.min(...plan.cycles.map((c) => c.montant))
  return Number.isFinite(min) ? `dès ${formaterFCFA(min)}` : null
}

/** Réduction (en %) du cycle annuel par rapport à douze fois le cycle mensuel, ou null si elle n'existe pas. */
export function reductionAnnuelle(plan: OffrePlan | null | undefined): number | null {
  const mensuel = plan?.cycles.find((c) => c.cycle === 'mensuel')?.montant
  const annuel = plan?.cycles.find((c) => c.cycle === 'annuel')?.montant
  if (!mensuel || !annuel || annuel >= mensuel * 12) return null
  return Math.round((1 - annuel / (mensuel * 12)) * 100)
}

export type ProduitGratuit = 'cv' | 'lettres' | 'simulations' | 'suivis'

/** Ce que le gratuit donne, d'après le réglage : « 2 lettres gratuites par mois », ou « réservé aux abonnés » si 0. */
export function phraseGratuite(produit: ProduitGratuit, n: number | null | undefined): string {
  if (n == null) return ''
  if (n <= 0) {
    return { cv: 'CV réservés aux abonnés', lettres: 'Lettres réservées aux abonnés', simulations: 'Simulations réservées aux abonnés', suivis: 'Suivi de démarches réservé aux abonnés' }[produit]
  }
  switch (produit) {
    case 'cv': return `${n} ${accord(n, 'CV gratuit', 'CV gratuits')} avec la mention « Surga »`
    case 'lettres': return `${n} ${accord(n, 'lettre gratuite', 'lettres gratuites')} par mois`
    case 'simulations': return `${n} ${accord(n, 'simulation gratuite', 'simulations gratuites')} par semaine`
    case 'suivis': return `${n} ${accord(n, 'démarche suivie', 'démarches suivies')} gratuitement`
  }
}

/** Phrase de synthèse du gratuit, pour l'écran d'abonnement. */
export function resumeGratuit(g: OffreGratuit | null | undefined): string {
  if (!g) return ''
  return [phraseGratuite('cv', g.cv), phraseGratuite('lettres', g.lettres_par_mois), phraseGratuite('simulations', g.simulations_par_semaine), phraseGratuite('suivis', g.suivis_demarche)]
    .filter(Boolean)
    .join(' · ')
}

export interface DroitUsage {
  estPremium: boolean
  limite: number | null | undefined
  utilises: number | null | undefined
}

/** Titre et détail d'un bandeau de droits (CV, lettres, simulations), construits sur la limite réelle et l'usage. */
export function etatDroit(
  produit: 'cv' | 'lettres' | 'simulations',
  d: DroitUsage,
  offre: Offre | null | undefined
): { titre: string; detail: string; atteint: boolean } {
  const nom = nomOffre(offre)
  const pluriels = { cv: 'CV', lettres: 'Lettres', simulations: 'Simulations' } as const
  if (d.estPremium) {
    return { titre: `${nom} : ${pluriels[produit].toLowerCase()} sans limite`, detail: 'Aucune restriction tant que votre abonnement est actif.', atteint: false }
  }
  const limite = d.limite
  if (limite == null) return { titre: 'Droits gratuits', detail: '', atteint: false }
  const utilises = d.utilises ?? 0
  const gratuit = phraseGratuite(produit, limite)
  if (limite <= 0) return { titre: gratuit, detail: `Abonnez-vous à ${nom} pour y accéder.`, atteint: true }
  if (utilises >= limite) {
    return { titre: `Plafond gratuit atteint (${gratuit})`, detail: `Passez à ${nom} pour continuer sans limite.`, atteint: true }
  }
  const restants = limite - utilises
  return { titre: gratuit, detail: restants === limite ? 'Disponible dès maintenant.' : `Il vous en reste ${restants}.`, atteint: false }
}

// ───────────────────────────── Chargement partagé

const DUREE_CACHE_MS = 30000
let cache: { t: number; offre: Offre } | null = null
let enCours: Promise<Offre | null> | null = null

async function lireOffre(force = false): Promise<Offre | null> {
  if (!force && cache && Date.now() - cache.t < DUREE_CACHE_MS) return cache.offre
  if (enCours) return enCours
  enCours = fetch('/api/surga/abonnements/offre')
    .then(async (r) => {
      const data = await r.json().catch(() => null)
      if (!r.ok || !data?.success) return null
      const offre: Offre = { ventes_ouvertes: data.ventes_ouvertes !== false, plans: Array.isArray(data.plans) ? data.plans : [], gratuit: data.gratuit }
      cache = { t: Date.now(), offre }
      return offre
    })
    .catch(() => null)
    .finally(() => { enCours = null })
  return enCours
}

/** Vide la copie gardée : à appeler après un changement connu de l'offre (par exemple à la réouverture de l'écran d'abonnement). */
export function oublierOffre(): void {
  cache = null
}

/** L'offre courante, partagée entre tous les écrans (une seule requête toutes les 30 secondes au plus). */
export function useSurgaOffre(): { offre: Offre | null; chargement: boolean; recharger: () => void } {
  const [offre, setOffre] = useState<Offre | null>(cache?.offre ?? null)
  const [chargement, setChargement] = useState<boolean>(!cache)
  const charger = useCallback((force: boolean) => {
    setChargement(true)
    lireOffre(force).then((o) => { setOffre(o); setChargement(false) })
  }, [])
  useEffect(() => { charger(false) }, [charger])
  return { offre, chargement, recharger: () => charger(true) }
}
