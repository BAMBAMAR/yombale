// frontend-next/src/lib/surga-cross-actions.ts
// Passerelles transversales cohérentes et dynamiques entre les fonctionnalités de Surga

import {
  saveLocalEvenement,
  saveLocalDepense,
  saveLocalNote,
  getLocalAgenda,
  deleteLocalEvenement,
  getLocalDepenses,
  deleteLocalDepense,
  getLocalNotes,
  deleteLocalNote,
  type SurgaEvenement,
  type SurgaDepense,
  type SurgaNote,
} from './surga-offline-sync'

/**
 * Notifie l'ensemble des composants qu'une donnée Surga (agenda, note, dépense) a changé
 */
export function notifierChangementDonnees(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('surga-data-change'))
  } catch {}
}

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

/* =========================================================================
   1. SPORT ➔ AGENDA & SAMA XAALIS
   ========================================================================= */

export function getCleMatch(match: { equipe_domicile: string; equipe_exterieur: string }): string {
  return `${match.equipe_domicile} vs ${match.equipe_exterieur}`
}

export function estMatchRappele(match: { equipe_domicile: string; equipe_exterieur: string }): boolean {
  const cle = getCleMatch(match)
  return getLocalAgenda().some(
    (e) =>
      e.titre.includes(cle) ||
      (e.titre.includes(match.equipe_domicile) && e.titre.includes(match.equipe_exterieur))
  )
}

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

  notifierChangementDonnees()
  afficherToast(`Rappel match programmé pour ${heureStr} !`, 'succes')
  return evt
}

export function toggleRappelMatch(match: {
  equipe_domicile: string
  equipe_exterieur: string
  competition?: string
  date_debut?: string
  diffuseur?: string | null
}): boolean {
  const cle = getCleMatch(match)
  const existing = getLocalAgenda().find(
    (e) =>
      e.titre.includes(cle) ||
      (e.titre.includes(match.equipe_domicile) && e.titre.includes(match.equipe_exterieur))
  )

  if (existing) {
    deleteLocalEvenement(existing.id)
    notifierChangementDonnees()
    afficherToast(`Rappel du match annulé`, 'info')
    return false
  }

  ajouterRappelMatch(match)
  return true
}

export function estMatchBudgete(match: { equipe_domicile: string; equipe_exterieur: string }): boolean {
  const cle = getCleMatch(match)
  return getLocalDepenses().some(
    (d) =>
      d.note?.includes(cle) ||
      (d.note?.includes(match.equipe_domicile) && d.note?.includes(match.equipe_exterieur))
  )
}

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

  notifierChangementDonnees()
  afficherToast(`Budget match (${montant.toLocaleString('fr-FR')} FCFA) noté dans Sama Xaalis !`, 'succes')
  return dep
}

export function toggleBudgetMatch(match: {
  equipe_domicile: string
  equipe_exterieur: string
  montant_xof?: number
}): boolean {
  const cle = getCleMatch(match)
  const existing = getLocalDepenses().find(
    (d) =>
      d.note?.includes(cle) ||
      (d.note?.includes(match.equipe_domicile) && d.note?.includes(match.equipe_exterieur))
  )

  if (existing) {
    deleteLocalDepense(existing.id)
    notifierChangementDonnees()
    afficherToast(`Budget match retiré de Sama Xaalis`, 'info')
    return false
  }

  prevoirBudgetMatch(match)
  return true
}

/* =========================================================================
   2. BONNES ADRESSES ➔ AGENDA, SAMA XAALIS & NOTES
   ========================================================================= */

export function estSortieAdressePlanifiee(place: { nom: string }): boolean {
  return getLocalAgenda().some((e) => e.titre === `Sortie : ${place.nom}`)
}

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

  notifierChangementDonnees()
  afficherToast(`Sortie chez ${place.nom} ajoutée à l'agenda (20h) !`, 'succes')
  return evt
}

export function toggleSortieAdresse(place: {
  nom: string
  quartier: string
  contact_tel?: string | null
  budget_moyen_xof?: number
}): boolean {
  const existing = getLocalAgenda().find((e) => e.titre === `Sortie : ${place.nom}`)
  if (existing) {
    deleteLocalEvenement(existing.id)
    notifierChangementDonnees()
    afficherToast(`Sortie chez ${place.nom} annulée de l'agenda`, 'info')
    return false
  }

  prevoirSortieAdresse(place)
  return true
}

export function estDepenseAdresseEnregistree(place: { nom: string }): boolean {
  return getLocalDepenses().some((d) => d.note?.includes(`Sortie chez ${place.nom}`))
}

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

  notifierChangementDonnees()
  afficherToast(`Dépense (${place.budget_moyen_xof.toLocaleString('fr-FR')} FCFA) notée dans Sama Xaalis !`, 'succes')
  return dep
}

export function toggleDepenseAdresse(place: {
  nom: string
  quartier: string
  budget_moyen_xof: number
}): boolean {
  const existing = getLocalDepenses().find((d) => d.note?.includes(`Sortie chez ${place.nom}`))
  if (existing) {
    deleteLocalDepense(existing.id)
    notifierChangementDonnees()
    afficherToast(`Dépense de ${place.nom} retirée de Sama Xaalis`, 'info')
    return false
  }

  enregistrerDepenseAdresse(place)
  return true
}

export function estAdresseEnNote(place: { nom: string }): boolean {
  return getLocalNotes().some((n) => n.titre === `Bonne adresse : ${place.nom}`)
}

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

  notifierChangementDonnees()
  afficherToast(`Adresse ${place.nom} enregistrée dans vos Notes !`, 'succes')
  return note
}

export function toggleAdresseEnNote(place: {
  nom: string
  quartier: string
  budget_moyen_xof?: number
  specialite?: string
  contact_tel?: string | null
  contact_whatsapp?: string | null
  resume_honnete?: string
}): boolean {
  const existing = getLocalNotes().find((n) => n.titre === `Bonne adresse : ${place.nom}`)
  if (existing) {
    deleteLocalNote(existing.id)
    notifierChangementDonnees()
    afficherToast(`Adresse ${place.nom} retirée de vos Notes`, 'info')
    return false
  }

  sauvegarderAdresseEnNote(place)
  return true
}

/* =========================================================================
   3. CONCOURS NATIONAUX ➔ NOTES & SAMA XAALIS
   ========================================================================= */

export function getTitreConcours(concours: { sigle?: string; titre?: string; nom?: string }): string {
  return concours.sigle || concours.titre || concours.nom || 'Concours'
}

export function estChecklistConcoursEnNote(concours: { sigle?: string; titre?: string; nom?: string }): boolean {
  const t = getTitreConcours(concours)
  return getLocalNotes().some((n) => n.titre.includes(t))
}

export function creerChecklistConcours(concours: {
  sigle?: string
  nom?: string
  titre?: string
  pieces_a_fournir?: string[]
  date_cloture?: string
}): SurgaNote {
  const titreConcours = getTitreConcours(concours)
  const pieces =
    concours.pieces_a_fournir && concours.pieces_a_fournir.length > 0
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

  notifierChangementDonnees()
  afficherToast(`Checklist dossier ${titreConcours} créée dans vos Notes !`, 'succes')
  return note
}

export function toggleChecklistConcours(concours: {
  sigle?: string
  nom?: string
  titre?: string
  pieces_a_fournir?: string[]
  date_cloture?: string
}): boolean {
  const t = getTitreConcours(concours)
  const existing = getLocalNotes().find((n) => n.titre.includes(t))
  if (existing) {
    deleteLocalNote(existing.id)
    notifierChangementDonnees()
    afficherToast(`Checklist dossier ${t} retirée des Notes`, 'info')
    return false
  }

  creerChecklistConcours(concours)
  return true
}

export function estFraisConcoursEnregistre(concours: { sigle?: string; titre?: string; nom?: string }): boolean {
  const t = getTitreConcours(concours)
  return getLocalDepenses().some((d) => d.note?.includes(`Quittance Trésor : ${t}`))
}

export function prevoirFraisConcours(concours: {
  sigle?: string
  nom?: string
  titre?: string
  frais_dossier_xof?: number
}): SurgaDepense {
  const titreConcours = getTitreConcours(concours)
  const montant = concours.frais_dossier_xof || 5000

  const dep = saveLocalDepense({
    montant_xof: montant,
    categorie: 'autre',
    note: `Quittance Trésor : ${titreConcours}`,
  })

  notifierChangementDonnees()
  afficherToast(`Frais de quittance (${montant.toLocaleString('fr-FR')} FCFA) notés dans Sama Xaalis !`, 'succes')
  return dep
}

export function toggleFraisConcours(concours: {
  sigle?: string
  nom?: string
  titre?: string
  frais_dossier_xof?: number
}): boolean {
  const t = getTitreConcours(concours)
  const existing = getLocalDepenses().find((d) => d.note?.includes(`Quittance Trésor : ${t}`))
  if (existing) {
    deleteLocalDepense(existing.id)
    notifierChangementDonnees()
    afficherToast(`Quittance ${t} retirée de Sama Xaalis`, 'info')
    return false
  }

  prevoirFraisConcours(concours)
  return true
}

/* =========================================================================
   4. IMMOBILIER CERTIFIÉ ➔ AGENDA & NOTES
   ========================================================================= */

export function estVisiteImmoPlanifiee(bien: { titre: string }): boolean {
  return getLocalAgenda().some((e) => e.titre === `Visite logement : ${bien.titre}`)
}

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

  notifierChangementDonnees()
  afficherToast(`Visite ${bien.quartier} programmée dans l'agenda !`, 'succes')
  return evt
}

export function toggleVisiteImmo(bien: {
  titre: string
  quartier: string
  contact_tel?: string | null
  prix?: number
}): boolean {
  const existing = getLocalAgenda().find((e) => e.titre === `Visite logement : ${bien.titre}`)
  if (existing) {
    deleteLocalEvenement(existing.id)
    notifierChangementDonnees()
    afficherToast(`Visite de ${bien.titre} annulée de l'agenda`, 'info')
    return false
  }

  planifierVisiteImmo(bien)
  return true
}

export function estImmoEnNote(bien: { titre: string }): boolean {
  return getLocalNotes().some((n) => n.titre === `Bien repéré : ${bien.titre}`)
}

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

  notifierChangementDonnees()
  afficherToast(`Logement ${bien.quartier} sauvegardé dans vos Notes !`, 'succes')
  return note
}

export function toggleImmoEnNote(bien: {
  titre: string
  quartier: string
  prix: number
  contact_tel?: string | null
  type_bien?: string
  surface_m2?: number | null
}): boolean {
  const existing = getLocalNotes().find((n) => n.titre === `Bien repéré : ${bien.titre}`)
  if (existing) {
    deleteLocalNote(existing.id)
    notifierChangementDonnees()
    afficherToast(`Logement ${bien.titre} retiré de vos Notes`, 'info')
    return false
  }

  sauvegarderImmoEnNote(bien)
  return true
}

/* =========================================================================
   5. REVUE DE PRESSE ➔ NOTES
   ========================================================================= */

export function estArticleEnNote(article: { titre: string; url?: string }): boolean {
  return getLocalNotes().some(
    (n) => n.titre === `Presse : ${article.titre}` || (article.url && n.contenu?.includes(article.url))
  )
}

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

  notifierChangementDonnees()
  afficherToast(`Article épinglé dans vos Notes !`, 'succes')
  return note
}

export function toggleArticleEnNote(article: {
  titre: string
  resume?: string
  source_nom?: string
  url?: string
}): boolean {
  const existing = getLocalNotes().find(
    (n) => n.titre === `Presse : ${article.titre}` || (article.url && n.contenu?.includes(article.url))
  )
  if (existing) {
    deleteLocalNote(existing.id)
    notifierChangementDonnees()
    afficherToast(`Article retiré de vos Notes`, 'info')
    return false
  }

  epinglerArticleEnNote(article)
  return true
}

/* =========================================================================
   6. NOTES ➔ AGENDA & DÉTECTION MONTANTS
   ========================================================================= */

export function estRappelNoteActif(note: { titre: string }): boolean {
  return getLocalAgenda().some((e) => e.titre === `Note : ${note.titre}`)
}

export function toggleRappelNote(note: {
  titre: string
  contenu?: string
  categorie?: string
}): boolean {
  const existing = getLocalAgenda().find((e) => e.titre === `Note : ${note.titre}`)
  if (existing) {
    deleteLocalEvenement(existing.id)
    notifierChangementDonnees()
    afficherToast(`Rappel de note annulé`, 'info')
    return false
  }

  const auj = new Date().toISOString().split('T')[0]
  saveLocalEvenement({
    titre: `Note : ${note.titre}`,
    description: note.contenu?.slice(0, 150) || 'Rappel créé depuis la note',
    date_evenement: auj,
    heure_evenement: '10:00',
    est_rappel: true,
    priorite: note.categorie === 'urgent' ? 'urgente' : 'normale',
    repetition: 'AUCUNE',
  })

  notifierChangementDonnees()
  afficherToast(`Rappel ajouté à l'agenda pour aujourd'hui à 10h`, 'succes')
  return true
}

export function estDepenseNoteEnregistree(note: { titre: string }): boolean {
  return getLocalDepenses().some((d) => d.note?.includes(`Créé depuis la note "${note.titre}"`))
}

export function toggleDepenseNote(note: { titre: string; categorie?: string }, montant: number): boolean {
  const existing = getLocalDepenses().find((d) => d.note?.includes(`Créé depuis la note "${note.titre}"`))
  if (existing) {
    deleteLocalDepense(existing.id)
    notifierChangementDonnees()
    afficherToast(`Dépense retirée de Sama Xaalis`, 'info')
    return false
  }

  saveLocalDepense({
    montant_xof: montant,
    categorie: note.categorie === 'courses' ? 'alimentation' : 'autre',
    date_depense: new Date().toISOString().split('T')[0],
    note: `Créé depuis la note "${note.titre}"`,
  })
  notifierChangementDonnees()
  afficherToast(`Dépense de ${montant.toLocaleString('fr-FR')} F ajoutée à Sama Xaalis`, 'succes')
  return true
}

export function detecterMontantTexte(texte: string): number | null {
  if (!texte) return null
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

/* =========================================================================
   8. SÉRIES & LUTTE (VIDÉOS) ➔ AGENDA
   ========================================================================= */

export function getCleVideo(video: { id: string; titre: string }): string {
  return `[Vidéo] ${video.titre}`
}

export function estVideoRappelee(video: { id: string; titre: string }): boolean {
  const cle = getCleVideo(video)
  return getLocalAgenda().some(
    (e) => e.titre.includes(cle) || (e.description && e.description.includes(video.id))
  )
}

export function ajouterRappelVideo(video: {
  id: string
  titre: string
  url: string
  publie_le?: string
}): { success: boolean; message: string } {
  if (estVideoRappelee(video)) {
    return { success: false, message: 'Cette vidéo est déjà dans votre agenda' }
  }

  const maintenant = new Date()
  const heureVisionnage = new Date(maintenant.getTime() + 2 * 3600 * 1000)
  const dateStr = heureVisionnage.toISOString().split('T')[0]
  const heureStr = `${String(heureVisionnage.getHours()).padStart(2, '0')}:00`

  saveLocalEvenement({
    titre: getCleVideo(video),
    description: `Visionnage : ${video.titre}\nLien : ${video.url}\nRef : ${video.id}`,
    date_evenement: dateStr,
    heure_evenement: heureStr,
    est_rappel: true,
  })

  notifierChangementDonnees()
  afficherToast('Rappel vidéo programmé dans l’Agenda', 'succes')
  return { success: true, message: 'Rappel vidéo programmé' }
}

export function supprimerRappelVideo(video: { id: string; titre: string }): { success: boolean; message: string } {
  const cle = getCleVideo(video)
  const item = getLocalAgenda().find(
    (e) => e.titre.includes(cle) || (e.description && e.description.includes(video.id))
  )
  if (item && item.id) {
    deleteLocalEvenement(item.id)
    notifierChangementDonnees()
    afficherToast('Rappel vidéo retiré de l’Agenda', 'info')
    return { success: true, message: 'Rappel vidéo retiré' }
  }
  return { success: false, message: 'Rappel introuvable' }
}

export function toggleRappelVideo(video: {
  id: string
  titre: string
  url: string
  publie_le?: string
}): { success: boolean; actif: boolean; message: string } {
  if (estVideoRappelee(video)) {
    const res = supprimerRappelVideo(video)
    return { success: res.success, actif: false, message: res.message }
  } else {
    const res = ajouterRappelVideo(video)
    return { success: res.success, actif: true, message: res.message }
  }
}
