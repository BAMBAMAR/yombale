export interface TelecomLandingConfig {
  operateur: string      // valeur du paramètre API
  label: string
  h1: string
  titre: string          // SANS suffixe Nopalou
  description: string
  intro: string
  keywords: string[]
}

export const TELECOM_LANDINGS: Record<string, TelecomLandingConfig> = {
  orange: {
    operateur: 'orange', label: 'Forfaits Orange',
    h1: 'Forfaits Orange Sénégal 2026 — Pass Internet, Illimix & Appels',
    titre: 'Forfaits Orange Sénégal 2026 : Pass Internet, Illimix & Prix par Go',
    description: `Comparez tous les forfaits Orange Sénégal (Illimix, Pass Internet 4G/5G, Seddo). Calcul du coût réel par Go et durée pour économiser avant de recharger. Données ARTP 2026.`,
    intro: `Orange (Sonatel) est le premier opérateur du Sénégal. Nopalou compare tous ses forfaits publiés au catalogue ARTP : internet mobile, illimix (appels + data), pass journaliers et mensuels. Comparez le prix par Go réel avant de recharger.`,
    keywords: ['forfait Orange Sénégal', 'forfait internet Orange Sénégal', 'forfait illimix Orange', 'pass internet Orange prix', 'Orange Sénégal 2026'],
  },
  yas: {
    operateur: 'yas', label: 'Forfaits Yas',
    h1: 'Forfaits Yas Sénégal (ex-Free) 2026 — Internet 4G & Appels Illimités',
    titre: 'Forfaits Yas Sénégal (Ex-Free) 2026 : Pass Internet, Illimix & Prix par Go',
    description: `Tous les forfaits Yas Sénégal (ex-Free) comparés : pass internet journaliers, hebdomadaires, mensuels et appels illimités. Trouvez le meilleur tarif ARTP 2026.`,
    intro: `Yas (anciennement Free, puis Tigo) est le deuxième opérateur du Sénégal. Nopalou compare tous ses forfaits internet et appels publiés au catalogue ARTP pour trouver le meilleur prix par Go et par minute.`,
    keywords: ['forfait Yas Sénégal', 'forfait Free Sénégal', 'pass internet Yas', 'forfait internet Yas prix', 'Yas Sénégal 2026'],
  },
  promobile: {
    operateur: 'promobile', label: 'Forfaits Promobile',
    h1: 'Forfaits Promobile Sénégal 2026 — Internet & Appels Pas Chers',
    titre: 'Forfaits Promobile Sénégal 2026 : Pass Internet & Appels Dès 500F',
    description: `Comparez tous les forfaits Promobile Sénégal (Pass Internet 4G, Appels, Illimix). Prix officiel par Go, validité et comparatif direct vs Orange & Yas (ARTP 2026).`,
    intro: `Promobile est l'opérateur alternatif du Sénégal, réputé pour ses tarifs data très compétitifs. Nopalou compare l'intégralité de ses pass internet et forfaits combinés face à Orange, Yas et Expresso pour vous faire réaliser un maximum d'économies.`,
    keywords: ['Promobile forfait internet', 'Promobile forfait appel', 'forfait Promobile prix', 'Promobile Sénégal 2026', 'pass internet Promobile'],
  },
  expresso: {
    operateur: 'expresso', label: 'Forfaits Expresso',
    h1: 'Forfaits Expresso Sénégal 2026 — Internet Mobile & Appels',
    titre: 'Forfaits Expresso Sénégal 2026 : Pass Internet, Appels & Recharges',
    description: `Catalogue complet des forfaits Expresso Sénégal : pass data internet, minutes d'appels et forfaits combinés. Comparatif prix/Go vérifié ARTP.`,
    intro: `Expresso est le troisième opérateur historique du Sénégal. Nopalou compare ses forfaits internet et appels publiés au catalogue ARTP face à Orange, Yas et Promobile, pour choisir le meilleur forfait selon votre budget.`,
    keywords: ['forfait Expresso Sénégal', 'Expresso internet forfait', 'pass Expresso prix', 'Expresso Sénégal 2026'],
  },
}
