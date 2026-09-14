// frontend-next/src/lib/creditCalculator.ts
/**
 * Moteur de calcul TypeScript pour le paiement échelonné et carnet de crédit Nopalou.
 */

export interface EchelonnementConfig {
  actif: boolean
  montant_min_vente: number
  montant_max_vente?: number
  apport_min_pct: number
  apport_min_fcfa: number
  echeance_min_fcfa: number
  nb_echeances_autorisees: number[]
  frequences_autorisees: Array<'mensuel' | 'bimensuel' | 'hebdomadaire'>
  delai_premiere_echeance_jours: number
  frais_dossier_fixes?: number
  frais_pourcentage?: number
}

export interface EcheanceLigne {
  id?: string
  numero_echeance: number
  date_echeance: string
  montant_prevu: number
  montant_paye: number
  montant_restant: number
  statut: 'payee' | 'partielle' | 'a_venir' | 'bientot_due' | 'en_retard' | 'annulee' | 'soldee_par_anticipation'
  date_paiement_complet?: string | null
  note?: string | null
}

export interface CalculEcheancierResult {
  valide: boolean
  erreur?: string | null
  montant_total_vente: number
  frais_dossier: number
  total_a_payer: number
  apport_initial: number
  montant_finance: number
  nb_echeances: number
  frequence: string
  montant_base_echeance: number
  prochaine_echeance: string | null
  prochain_montant: number
  echeances: EcheanceLigne[]
  solde_restant: number
}

export interface FormuleRecommandee {
  id: string
  badge: string
  titre: string
  apport: number
  apport_pct: number
  nb_echeances: number
  frequence: string
  label_frequence: string
  montant_echeance: number
  prochaine_date: string | null
  detail: CalculEcheancierResult
}

export const CONFIG_DEFAUT_ECHELONNEMENT: EchelonnementConfig = {
  actif: true,
  montant_min_vente: 10000,
  montant_max_vente: 5000000,
  apport_min_pct: 20,
  apport_min_fcfa: 5000,
  echeance_min_fcfa: 5000,
  nb_echeances_autorisees: [2, 3, 4, 6],
  frequences_autorisees: ['mensuel', 'bimensuel', 'hebdomadaire'],
  delai_premiere_echeance_jours: 30,
  frais_dossier_fixes: 0,
  frais_pourcentage: 0,
}

export function validerReglesEchelonnement(
  configRaw: Partial<EchelonnementConfig> | null | undefined,
  params: {
    montantTotal: number
    apport: number
    nbEcheances: number
    frequence: string
  }
) {
  const config = { ...CONFIG_DEFAUT_ECHELONNEMENT, ...(configRaw || {}) }
  const { montantTotal, apport, nbEcheances, frequence } = params

  const numTotal = Number(montantTotal) || 0
  const numApport = Number(apport) || 0
  const numNb = Number(nbEcheances) || 0
  const freq = String(frequence || 'mensuel').toLowerCase() as 'mensuel' | 'bimensuel' | 'hebdomadaire'

  if (!config.actif) {
    return { valide: false, erreur: 'Le paiement échelonné n’est pas activé pour cette boutique.' }
  }

  if (numTotal < config.montant_min_vente) {
    return {
      valide: false,
      erreur: `Le montant minimum pour un paiement échelonné est de ${config.montant_min_vente.toLocaleString('fr-FR')} FCFA.`,
    }
  }

  if (config.montant_max_vente && numTotal > config.montant_max_vente) {
    return {
      valide: false,
      erreur: `Le montant maximum éligible est de ${config.montant_max_vente.toLocaleString('fr-FR')} FCFA.`,
    }
  }

  const apportMinCalcule = Math.max(
    config.apport_min_fcfa || 0,
    Math.round((numTotal * (config.apport_min_pct || 0)) / 100)
  )

  if (numApport < apportMinCalcule) {
    return {
      valide: false,
      erreur: `L’apport initial minimum requis est de ${apportMinCalcule.toLocaleString('fr-FR')} FCFA (${config.apport_min_pct}% du total).`,
    }
  }

  if (numApport >= numTotal) {
    return {
      valide: false,
      erreur: 'L’apport ne peut pas être supérieur ou égal au montant total de la vente.',
    }
  }

  const autoriseesNb = Array.isArray(config.nb_echeances_autorisees) ? config.nb_echeances_autorisees : [2, 3, 4, 6]
  if (!autoriseesNb.includes(numNb)) {
    return {
      valide: false,
      erreur: `Le nombre d’échéances (${numNb}x) n’est pas autorisé par le marchand. Choix possibles : ${autoriseesNb.join(', ')}x.`,
    }
  }

  const autoriseesFreq = Array.isArray(config.frequences_autorisees)
    ? config.frequences_autorisees
    : ['mensuel', 'bimensuel', 'hebdomadaire']
  if (!autoriseesFreq.includes(freq)) {
    return {
      valide: false,
      erreur: `La fréquence "${freq}" n’est pas autorisée par le marchand.`,
    }
  }

  const fraisFixes = Math.max(0, Number(config.frais_dossier_fixes) || 0)
  const fraisPct = Math.max(0, Number(config.frais_pourcentage) || 0)
  const montantFrais = fraisFixes + Math.round((numTotal * fraisPct) / 100)
  const montantFinance = (numTotal + montantFrais) - numApport

  const montantMoyenParEcheance = montantFinance / numNb
  if (config.echeance_min_fcfa && montantMoyenParEcheance < config.echeance_min_fcfa) {
    return {
      valide: false,
      erreur: `Le montant par échéance est inférieur au minimum autorisé (${config.echeance_min_fcfa.toLocaleString('fr-FR')} FCFA).`,
    }
  }

  return { valide: true, config, apportMinCalcule, montantFrais, montantFinance }
}

export function calculerDateEcheance(
  dateDepart: Date | string | null | undefined,
  indexEcheance: number,
  frequence: string,
  delaiInitialJours = 30
): string {
  const d = new Date(dateDepart || new Date())
  d.setHours(12, 0, 0, 0)

  if (indexEcheance === 1) {
    d.setDate(d.getDate() + (delaiInitialJours || 30))
    return d.toISOString().split('T')[0]
  }

  const baseJours = delaiInitialJours || 30
  const pasIndex = indexEcheance - 1

  if (frequence === 'hebdomadaire') {
    d.setDate(d.getDate() + baseJours + (pasIndex * 7))
  } else if (frequence === 'bimensuel') {
    d.setDate(d.getDate() + baseJours + (pasIndex * 14))
  } else {
    d.setDate(d.getDate() + baseJours + (pasIndex * 30))
  }

  return d.toISOString().split('T')[0]
}

export function calculerEcheancier(options: {
  montantTotal: number
  apport: number
  nbEcheances: number
  frequence?: string
  dateDebut?: Date | string
  config?: Partial<EchelonnementConfig> | null
}): CalculEcheancierResult {
  const {
    montantTotal,
    apport,
    nbEcheances,
    frequence = 'mensuel',
    dateDebut = new Date(),
    config = CONFIG_DEFAUT_ECHELONNEMENT,
  } = options

  const validation = validerReglesEchelonnement(config, {
    montantTotal,
    apport,
    nbEcheances,
    frequence,
  })

  const numTotal = Number(montantTotal) || 0
  const numApport = Number(apport) || 0
  const numNb = Number(nbEcheances) || 3
  const freq = String(frequence || 'mensuel').toLowerCase()

  const fraisFixes = Math.max(0, Number(config?.frais_dossier_fixes) || 0)
  const fraisPct = Math.max(0, Number(config?.frais_pourcentage) || 0)
  const montantFrais = fraisFixes + Math.round((numTotal * fraisPct) / 100)
  const totalAPayer = numTotal + montantFrais
  const montantFinance = Math.max(0, totalAPayer - numApport)

  // Garantie d'arrondi exact
  const baseEcheance = Math.floor(montantFinance / numNb)
  const resteArrondi = montantFinance - (baseEcheance * numNb)

  const echeances: EcheanceLigne[] = []
  const delaiJours = Number(config?.delai_premiere_echeance_jours) || (freq === 'hebdomadaire' ? 7 : freq === 'bimensuel' ? 14 : 30)

  for (let i = 1; i <= numNb; i++) {
    const isDerniere = (i === numNb)
    const montantPrevu = isDerniere ? (baseEcheance + resteArrondi) : baseEcheance
    const dateEch = calculerDateEcheance(dateDebut, i, freq, delaiJours)

    echeances.push({
      numero_echeance: i,
      date_echeance: dateEch,
      montant_prevu: montantPrevu,
      montant_paye: 0,
      montant_restant: montantPrevu,
      statut: 'a_venir',
    })
  }

  return {
    valide: validation.valide,
    erreur: validation.erreur || null,
    montant_total_vente: numTotal,
    frais_dossier: montantFrais,
    total_a_payer: totalAPayer,
    apport_initial: numApport,
    montant_finance: montantFinance,
    nb_echeances: numNb,
    frequence: freq,
    montant_base_echeance: baseEcheance,
    prochaine_echeance: echeances[0]?.date_echeance || null,
    prochain_montant: echeances[0]?.montant_prevu || 0,
    echeances,
    solde_restant: montantFinance,
  }
}

export function genererFormulesRecommandees(
  montantTotal: number,
  configRaw?: Partial<EchelonnementConfig> | null,
  dateDebut: Date | string = new Date()
): FormuleRecommandee[] {
  const config = { ...CONFIG_DEFAUT_ECHELONNEMENT, ...(configRaw || {}) }
  const numTotal = Number(montantTotal) || 0

  if (!config.actif || numTotal < config.montant_min_vente) {
    return []
  }

  const autoriseesNb = (config.nb_echeances_autorisees || [2, 3, 4, 6]).slice().sort((a, b) => a - b)
  const minPct = config.apport_min_pct || 20

  const formules: FormuleRecommandee[] = []

  // 1. Formule Recommandée
  const nbRec = autoriseesNb.includes(3) ? 3 : autoriseesNb[Math.floor(autoriseesNb.length / 2)] || 2
  const apportPctRec = Math.min(50, Math.max(minPct, 30))
  const apportRec = Math.max(config.apport_min_fcfa || 0, Math.round((numTotal * apportPctRec) / 100))

  try {
    const calcRec = calculerEcheancier({
      montantTotal: numTotal,
      apport: apportRec,
      nbEcheances: nbRec,
      frequence: 'mensuel',
      dateDebut,
      config,
    })
    if (calcRec.valide) {
      formules.push({
        id: 'recommande',
        badge: '⭐ RECOMMANDÉ',
        titre: 'Équilibre Confort',
        apport: apportRec,
        apport_pct: apportPctRec,
        nb_echeances: nbRec,
        frequence: 'mensuel',
        label_frequence: 'Chaque mois',
        montant_echeance: calcRec.montant_base_echeance,
        prochaine_date: calcRec.prochaine_echeance,
        detail: calcRec,
      })
    }
  } catch (err) {
    console.debug('[CALCUL REC SKIP]:', err)
  }

  // 2. Formule Économique (Apport minimum, maximum d'échéances)
  const nbEco = autoriseesNb[autoriseesNb.length - 1]
  const apportEco = Math.max(config.apport_min_fcfa || 0, Math.round((numTotal * minPct) / 100))

  if (nbEco !== nbRec || apportEco !== apportRec) {
    try {
      const calcEco = calculerEcheancier({
        montantTotal: numTotal,
        apport: apportEco,
        nbEcheances: nbEco,
        frequence: 'mensuel',
        dateDebut,
        config,
      })
      if (calcEco.valide) {
        formules.push({
          id: 'economique',
          badge: 'PETIT BUDGET',
          titre: 'Apport Minimum',
          apport: apportEco,
          apport_pct: minPct,
          nb_echeances: nbEco,
          frequence: 'mensuel',
          label_frequence: 'Chaque mois',
          montant_echeance: calcEco.montant_base_echeance,
          prochaine_date: calcEco.prochaine_echeance,
          detail: calcEco,
        })
      }
    } catch (err) {
      console.debug('[CALCUL ECO SKIP]:', err)
    }
  }

  // 3. Formule Rapide (Apport 50%, 2 échéances)
  const nbRapide = autoriseesNb[0] || 2
  const apportRapide = Math.round(numTotal * 0.5)

  if (nbRapide !== nbRec && nbRapide !== nbEco) {
    try {
      const calcRapide = calculerEcheancier({
        montantTotal: numTotal,
        apport: apportRapide,
        nbEcheances: nbRapide,
        frequence: 'mensuel',
        dateDebut,
        config,
      })
      if (calcRapide.valide) {
        formules.push({
          id: 'rapide',
          badge: 'RÈGLEMENT RAPIDE',
          titre: 'Liberté Express',
          apport: apportRapide,
          apport_pct: 50,
          nb_echeances: nbRapide,
          frequence: 'mensuel',
          label_frequence: 'Chaque mois',
          montant_echeance: calcRapide.montant_base_echeance,
          prochaine_date: calcRapide.prochaine_echeance,
          detail: calcRapide,
        })
      }
    } catch (err) {
      console.debug('[CALCUL RAPIDE SKIP]:', err)
    }
  }

  return formules
}

export function imputerPaiementSurEcheances(
  echeances: EcheanceLigne[],
  montantPaiement: number
): { echeancesUpdated: EcheanceLigne[]; resteNonImpute: number } {
  let montantRestantAImputer = Number(montantPaiement) || 0
  if (montantRestantAImputer <= 0) return { echeancesUpdated: echeances, resteNonImpute: 0 }

  const echeancesUpdated = echeances.map((ech) => ({ ...ech }))

  for (const ech of echeancesUpdated) {
    if (montantRestantAImputer <= 0) break
    if (ech.statut === 'payee' || ech.statut === 'annulee' || ech.statut === 'soldee_par_anticipation') continue

    const detteLigne = Number(ech.montant_restant !== undefined ? ech.montant_restant : (ech.montant_prevu - ech.montant_paye))
    if (detteLigne <= 0) {
      ech.statut = 'payee'
      continue
    }

    const payeSurLigne = Math.min(detteLigne, montantRestantAImputer)
    ech.montant_paye = Number(ech.montant_paye || 0) + payeSurLigne
    ech.montant_restant = detteLigne - payeSurLigne
    montantRestantAImputer -= payeSurLigne

    if (ech.montant_restant <= 0) {
      ech.statut = 'payee'
      ech.date_paiement_complet = new Date().toISOString()
    } else {
      ech.statut = 'partielle'
    }
  }

  return {
    echeancesUpdated,
    resteNonImpute: montantRestantAImputer,
  }
}
