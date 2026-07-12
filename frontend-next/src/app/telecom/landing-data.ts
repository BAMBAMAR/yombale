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
    h1: 'Forfaits Orange Sénégal — internet, appels et illimix',
    titre: 'Forfait Orange Sénégal — Comparez internet, appels, illimix',
    description: `Tous les forfaits Orange Sénégal comparés : internet mobile, illimix, appels. Trouvez le forfait Orange au meilleur rapport data/prix, données ARTP.`,
    intro: `Orange (Sonatel) est le premier opérateur du Sénégal. Nopalou compare tous ses forfaits publiés au catalogue ARTP : internet mobile, illimix (appels + data), pass journaliers et mensuels. Comparez le prix par Go réel avant de recharger.`,
    keywords: ['forfait Orange Sénégal', 'forfait internet Orange Sénégal', 'forfait illimix Orange', 'pass internet Orange prix'],
  },
  yas: {
    operateur: 'yas', label: 'Forfaits Yas',
    h1: 'Forfaits Yas Sénégal (ex-Free) — internet et appels',
    titre: 'Forfait Yas Sénégal — Comparez les forfaits internet et appels',
    description: `Tous les forfaits Yas (ex-Free Sénégal) comparés : internet mobile, appels, pass data. Trouvez le forfait Yas au meilleur prix, données ARTP.`,
    intro: `Yas (anciennement Free, puis Tigo) est le deuxième opérateur du Sénégal. Nopalou compare tous ses forfaits internet et appels publiés au catalogue ARTP pour trouver le meilleur prix par Go et par minute.`,
    keywords: ['forfait Yas Sénégal', 'forfait Free Sénégal', 'pass internet Yas', 'forfait internet Yas prix'],
  },
  promobile: {
    operateur: 'promobile', label: 'Forfaits Promobile',
    h1: 'Forfaits Promobile Sénégal — internet et appels pas chers',
    titre: 'Forfait Promobile Sénégal — Comparez internet et appels',
    description: `Tous les forfaits Promobile comparés : internet mobile et appels à petits prix. Données du catalogue ARTP, mises à jour régulièrement.`,
    intro: `Promobile est l'opérateur alternatif du Sénégal, connu pour ses forfaits agressifs sur les prix. Nopalou compare ses forfaits internet et appels face à Orange, Yas et Expresso pour vérifier s'il est vraiment le moins cher pour votre usage.`,
    keywords: ['Promobile forfait internet', 'Promobile forfait appel', 'forfait Promobile prix', 'Promobile Sénégal'],
  },
  expresso: {
    operateur: 'expresso', label: 'Forfaits Expresso',
    h1: 'Forfaits Expresso Sénégal — internet et appels',
    titre: 'Forfait Expresso Sénégal — Comparez internet et appels',
    description: `Tous les forfaits Expresso Sénégal comparés : internet mobile et appels. Données du catalogue ARTP.`,
    intro: `Expresso est le troisième opérateur historique du Sénégal. Nopalou compare ses forfaits internet et appels publiés au catalogue ARTP face à Orange, Yas et Promobile, pour choisir le meilleur forfait selon votre budget.`,
    keywords: ['forfait Expresso Sénégal', 'Expresso internet forfait', 'pass Expresso prix'],
  },
}
