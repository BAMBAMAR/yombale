// frontend-next/src/lib/surga-cross-actions.ts
// Passerelles transversales cohérentes entre les fonctionnalités de Surga

import {
  saveLocalEvenement,
  saveLocalDepense,
  saveLocalNote,
  type SurgaEvenement,
  type SurgaDepense,
  type SurgaNote,
} from './surga-offline-sync'

/**
 * Déclenche l'affichage d'un toast informatif ou de succès dans l'interface Surga
 */
export function afficherToast(message: string, type: 'succes' | 'info' = 'succes'): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent('surga-toast', {
        detail: { message, type },
      })
    )
  } catch {}
}

/**
 * Passerelle 1 : Sport ➔ Agenda (Rappel de match)
 */
export function ajouterRappelMatch(match: {
  equipe_domicile: string
  equipe_exterieur: string
  competition?: string
  date_debut?: string
  diffuseur?: string | null
}): SurgaEvenement {
  const d = match.date_debut ? new Date(match.date_debut) : new Date()
  const dateStr = d.toISOString().slice(0, 10)
  const heureStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const evt = saveLocalEvenement({
    titre: `Match : ${match.equipe_domicile} vs ${match.equipe_exterieur}`,
    description: `${match.competition || 'Football'}${match.diffuseur ? ` • Diffuseur : ${match.diffuseur}` : ''}`,
    date_evenement: dateStr,
    heure_evenement: heureStr,
    est_rappel: true,
    repetition: 'AUCUNE',
    categorie: 'perso',
  })

  afficherToast(`Rappel match programmé pour ${heureStr} !`)
  return evt
}

/**
 * Passerelle 2 : Sport ➔ Sama Xaalis (Prévoir budget sortie match)
 */
export function prevoirBudgetMatch(match: {
  equipe_domicile: string
  equipe_exterieur: string
  montant_xof?: number
}): SurgaDepense {
  const montant = match.montant_xof || 3000
  const dep = saveLocalDepense({
    montant_xof: montant,
    categorie: 'loisirs',
    note: `Sortie match ${match.equipe_domicile} vs ${match.equipe_exterieur}`,
  })
  afficherToast(`Budget match (${montant.toLocaleString('fr-FR')} FCFA) noté dans Sama Xaalis !`)
  return dep
}

/**
 * Passerelle 3 : Bons Plans ➔ Agenda (Planifier une sortie restaurant / dibiterie)
 */
export function prevoirSortieAdresse(place: {
  nom: string
  quartier: string
  contact_tel?: string | null
  budget_moyen_xof?: number
}): SurgaEvenement {
  const aujourdhui = new Date().toISOString().slice(0, 10)
  const evt = saveLocalEvenement({
    titre: `Sortie : ${place.nom}`,
    description: `Quartier: ${place.quartier}${place.contact_tel ? ` • Tél: ${place.contact_tel}` : ''}${place.budget_moyen_xof ? ` • Budget: ~${place.budget_moyen_xof.toLocaleString('fr-FR')} FCFA` : ''}`,
    date_evenement: aujourdhui,
    heure_evenement: '20:00',
    est_rappel: true,
    repetition: 'AUCUNE',
    categorie: 'perso',
    lieu: place.quartier,
  })

  afficherToast(`Sortie chez ${place.nom} ajoutée à l'agenda (20h) !`)
  return evt
}

/**
 * Passerelle 4 : Bons Plans ➔ Sama Xaalis (Enregistrer la dépense du restaurant)
 */
export function enregistrerDepenseAdresse(place: {
  nom: string
  quartier: string
  budget_moyen_xof: number
}): SurgaDepense {
  const dep = saveLocalDepense({
    montant_xof: place.budget_moyen_xof,
    categorie: 'alimentation',
    note: `Sortie chez ${place.nom} (${place.quartier})`,
  })

  afficherToast(`Dépense (${place.budget_moyen_xof.toLocaleString('fr-FR')} FCFA) notée dans Sama Xaalis !`)
  return dep
}

/**
 * Passerelle 5 : Bons Plans ➔ Notes (Sauvegarder l'adresse pour référence)
 */
export function sauvegarderAdresseEnNote(place: {
  nom: string
  quartier: string
  budget_moyen_xof?: number
  specialite?: string
  contact_tel?: string | null
  contact_whatsapp?: string | null
  resume_honnete?: string
}): SurgaNote {
  const lignes = [
    `Quartier : ${place.quartier}`,
    place.specialite ? `Spécialité : ${place.specialite}` : '',
    place.budget_moyen_xof ? `Budget moyen : ~${place.budget_moyen_xof.toLocaleString('fr-FR')} FCFA` : '',
    place.contact_tel ? `Téléphone : ${place.contact_tel}` : '',
    place.contact_whatsapp ? `WhatsApp : ${place.contact_whatsapp}` : '',
    place.resume_honnete ? `\nAvis clients :\n${place.resume_honnete}` : '',
  ].filter(Boolean)

  const note = saveLocalNote({
    titre: `Bonne adresse : ${place.nom}`,
    contenu: lignes.join('\n'),
    categorie: 'general',
    couleur: 'ambre',
  })

  afficherToast(`Adresse ${place.nom} enregistrée dans vos Notes !`)
  return note
}

/**
 * Passerelle 6 : Concours ➔ Notes (Générer la checklist des pièces à fournir)
 */
export function creerChecklistConcours(concours: {
  sigle?: string
  nom?: string
  titre?: string
  pieces_a_fournir?: string[]
  date_cloture?: string
}): SurgaNote {
  const titreConcours = concours.sigle || concours.titre || concours.nom || 'Concours'
  const pieces = concours.pieces_a_fournir && concours.pieces_a_fournir.length > 0
    ? concours.pieces_a_fournir
    : [
        'Extrait de naissance de moins de 3 mois',
        'Casier judiciaire (bulletin n°3)',
        'Certificat de nationalité sénégalaise',
        'Copie certifiée conforme du diplôme requis',
        'Certificat de visite et contre-visite médicale',
        'Quittance du Trésor public (droits d inscription)',
        'Demande manuscrite timbrée',
      ]

  const checklistItems = pieces.map((p, idx) => ({
    id: `chk-${idx + 1}`,
    texte: p,
    fait: false,
  }))

  const contenuTexte = pieces.map((p) => `[ ] ${p}`).join('\n')

  const note = saveLocalNote({
    titre: `Dossier de candidature : ${titreConcours}`,
    contenu: `Clôture des dépôts : ${concours.date_cloture || 'À vérifier'}\n\nPièces administratives à fournir :\n${contenuTexte}`,
    categorie: 'urgent',
    couleur: 'bleu',
    is_checklist: true,
    checklist: checklistItems,
  })

  afficherToast(`Checklist dossier ${titreConcours} créée dans vos Notes !`)
  return note
}

/**
 * Passerelle 7 : Concours ➔ Sama Xaalis (Prévoir les droits d'inscription / quittance)
 */
export function prevoirFraisConcours(concours: {
  sigle?: string
  nom?: string
  titre?: string
  frais_dossier_xof?: number
}): SurgaDepense {
  const titreConcours = concours.sigle || concours.titre || concours.nom || 'Concours'
  const montant = concours.frais_dossier_xof || 5000

  const dep = saveLocalDepense({
    montant_xof: montant,
    categorie: 'autre',
    note: `Quittance Trésor : ${titreConcours}`,
  })

  afficherToast(`Frais de quittance (${montant.toLocaleString('fr-FR')} FCFA) notés dans Sama Xaalis !`)
  return dep
}

/**
 * Passerelle 8 : Immobilier ➔ Agenda (Planifier une visite de logement)
 */
export function planifierVisiteImmo(bien: {
  titre: string
  quartier: string
  contact_tel?: string | null
  prix?: number
}): SurgaEvenement {
  const aujourdhui = new Date().toISOString().slice(0, 10)
  const evt = saveLocalEvenement({
    titre: `Visite logement : ${bien.titre}`,
    description: `Quartier: ${bien.quartier}${bien.contact_tel ? ` • Tél agence: ${bien.contact_tel}` : ''}${bien.prix ? ` • Loyer: ${bien.prix.toLocaleString('fr-FR')} FCFA` : ''}`,
    date_evenement: aujourdhui,
    heure_evenement: '16:00',
    est_rappel: true,
    repetition: 'AUCUNE',
    categorie: 'rdv',
    lieu: bien.quartier,
  })

  afficherToast(`Visite ${bien.quartier} programmée dans l'agenda !`)
  return evt
}

/**
 * Passerelle 9 : Immobilier ➔ Notes (Enregistrer le bien repéré)
 */
export function sauvegarderImmoEnNote(bien: {
  titre: string
  quartier: string
  prix: number
  contact_tel?: string | null
  type_bien?: string
  surface_m2?: number | null
}): SurgaNote {
  const lignes = [
    `Type : ${bien.type_bien || 'Logement'}`,
    `Quartier : ${bien.quartier}`,
    `Prix : ${bien.prix.toLocaleString('fr-FR')} FCFA/mois`,
    bien.surface_m2 ? `Surface : ${bien.surface_m2} m²` : '',
    bien.contact_tel ? `Contact agence : ${bien.contact_tel}` : '',
    `Caution estimée (loyer x 3) : ~${(bien.prix * 3).toLocaleString('fr-FR')} FCFA`,
  ].filter(Boolean)

  const note = saveLocalNote({
    titre: `Bien repéré : ${bien.titre}`,
    contenu: lignes.join('\n'),
    categorie: 'personnel',
    couleur: 'vert',
  })

  afficherToast(`Logement ${bien.quartier} sauvegardé dans vos Notes !`)
  return note
}

/**
 * Passerelle 10 : Revue de Presse ➔ Notes (Épingler un article dans les notes)
 */
export function epinglerArticleEnNote(article: {
  titre: string
  resume?: string
  source_nom?: string
  url?: string
}): SurgaNote {
  const note = saveLocalNote({
    titre: `Presse : ${article.titre}`,
    contenu: `${article.resume || ''}\n\nSource : ${article.source_nom || 'Presse sénégalaise'}${article.url ? `\nLien : ${article.url}` : ''}`,
    categorie: 'general',
    couleur: 'creme',
  })

  afficherToast(`Article épinglé dans vos Notes !`)
  return note
}

/**
 * Passerelle 11 : Notes ➔ Détection automatique de montant pour conversion rapide en dépense
 */
export function detecterMontantTexte(texte: string): number | null {
  if (!texte) return null
  // Détecte par exemple "2500 F", "15000 FCFA", "15 000 fcfa", "50k", etc.
  const regexFCFA = /(\d[\d\s\.]*)\s*(?:f\b|cfa|fcfa|frs)/i
  const match = texte.match(regexFCFA)
  if (match && match[1]) {
    const nettoye = match[1].replace(/[\s\.]/g, '')
    const val = parseInt(nettoye, 10)
    if (!isNaN(val) && val > 0 && val < 100000000) {
      return val
    }
  }

  const regexK = /(\d+)\s*k\b/i
  const matchK = texte.match(regexK)
  if (matchK && matchK[1]) {
    const valK = parseInt(matchK[1], 10) * 1000
    if (!isNaN(valK) && valK > 0) return valK
  }

  return null
}
