import type { Lead, BlacklistItem } from './types'

export const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nouveau: { label: 'Nouveau', color: '#2563EB', bg: '#EFF6FF' },
  contacte_wa: { label: 'Contacté WhatsApp', color: '#16A34A', bg: '#F0FDF4' },
  contacte_email: { label: 'Contacté Email', color: '#7C3AED', bg: '#F5F3FF' },
  en_discussion: { label: 'En Discussion', color: '#D97706', bg: '#FFFBEB' },
  converti: { label: 'Converti (Boutique Active)', color: '#059669', bg: '#ECFDF5' },
  desinscrit: { label: 'Désinscrit / Refus', color: '#DC2626', bg: '#FEF2F2' },
  invalide: { label: 'Invalide / Emploi (Hors Cible)', color: '#64748B', bg: '#F1F5F9' },
}

export const OPERATEUR_COLORS: Record<string, { color: string; bg: string }> = {
  Orange: { color: '#C75B00', bg: '#FFF7ED' },
  'Free (Yas)': { color: '#2563EB', bg: '#EFF6FF' },
  Expresso: { color: '#9333EA', bg: '#FAF5FF' },
  Promobile: { color: '#16A34A', bg: '#F0FDF4' },
  Autre: { color: '#64748B', bg: '#F1F5F9' },
}

export const CATEGORIES_OPTIONS = [
  { value: 'tous', label: 'Toutes les catégories' },
  { value: 'mode', label: 'Mode & Prêt-à-porter' },
  { value: 'auto-moto', label: 'Véhicules & Auto-Moto' },
  { value: 'immo', label: 'Immobilier & Terrains' },
  { value: 'smartphones', label: 'Téléphonie & Tech' },
  { value: 'tv-electro', label: 'Électroménager & TV' },
  { value: 'informatique', label: 'Informatique & Ordis' },
  { value: 'maison', label: 'Maison & Ameublement' },
  { value: 'beaute', label: 'Cosmétique & Beauté' },
  { value: 'superette', label: 'Alimentation & Supérette' },
  { value: 'quincaillerie', label: 'Quincaillerie & BTP' },
  { value: 'grossiste', label: 'Grossistes & Import Chine' },
  { value: 'services', label: 'Services & Prestations' },
  { value: 'divers', label: 'Commerce Général / Mixte' },
  { value: 'emploi', label: 'Offres & Demandes d\'Emploi' },
]

export const SOURCES_OPTIONS = [
  { value: 'tous', label: 'Toutes les sources' },
  { value: 'annonces_classifiees', label: 'Annonces Nopalou' },
  { value: 'scraper_auto', label: 'Scraper Automatisé' },
  { value: 'facebook', label: 'Groupes Facebook Dakar' },
  { value: 'import_vrac', label: 'Import Vrac' },
  { value: 'manuel', label: 'Ajout Manuel' },
]

export const OPERATEURS_OPTIONS = [
  { value: 'tous', label: 'Tous les opérateurs' },
  { value: 'Orange', label: 'Orange' },
  { value: 'Free (Yas)', label: 'Free (Yas)' },
  { value: 'Expresso', label: 'Expresso' },
  { value: 'Promobile', label: 'Promobile' },
]

export function estNomPropreAuthentique(nom?: string | null): boolean {
  if (!nom || typeof nom !== 'string') return false
  const str = nom.trim()
  if (str.length < 2 || str.length > 35) return false
  const low = str.toLowerCase()
  const GENERIQUES = [
    'votre boutique', 'boutique', 'commerce & boutique', 'commerce', 'vendeur', 'vendeuse',
    'responsable', 'partenaire', 'cher commerçant', 'client', 'particulier', 'prospect',
    'mode', 'boutique mode', 'vendeur mode', 'véhicules', 'vehicules', 'vendeur véhicules',
    'agence immobilière', 'agence immobiliere', 'immo', 'immobilier', 'téléphonie & tech',
    'telephonie & tech', 'tech', 'téléphonie', 'telephonie', 'informatique', 'boutique informatique',
    'électroménager', 'electromenager', 'boutique électroménager', 'maison & ameublement',
    'maison', 'ameublement', 'alimentation & supérette', 'alimentation', 'superette',
    'beauté & cosmétique', 'beaute & cosmetique', 'grossiste arrivages', 'grossiste',
    'services', 'service', 'de livraison', 'enseigne', 'divers', 'mixte', 'général', 'general'
  ]
  if (GENERIQUES.includes(low)) return false
  if (/^(boutique|vendeur|commerce|magasin|agence|groupe|grossiste)\s+(mode|tech|informatique|auto|immo|véhicules|vehicules|electromenager|beaute|maison|alimentation)$/i.test(str)) return false
  if (/\d{3,}/.test(str) || /\//.test(str) || /wa\.me/i.test(str) || /@/.test(str)) return false
  if (/^(dakar|senegal|thies|mbour|touba)[,\s]/i.test(str)) return false
  if (/\b(disponible|disponibi|livraison|groupée|groupee|arrivage|promo|hyundai|tucson|lite\s*5g|galaxy|iphone|peugeot|terrain|appartement|chambre)\b/i.test(str)) return false
  return true
}

export function formatQuartierStr(q?: string | null): string {
  if (!q || q === 'Dakar' || q === 'Tout Dakar & Régions') return 'à Dakar'
  const qLow = q.toLowerCase()
  if (qLow.startsWith('hlm') || qLow.includes('almadies') || qLow.includes('mamelles') || qLow.includes('maristes') || qLow.includes('parcelles')) {
    return `aux ${q}`
  }
  return `à ${q}`
}

export function parseClientSpintax(texte: string): string {
  if (!texte) return ''
  let res = texte
  let hasSpintax = true
  let iterations = 0
  while (hasSpintax && iterations < 10) {
    iterations++
    hasSpintax = false
    res = res.replace(/\{([^{}]+)\}/g, (match, choices) => {
      const lower = choices.toLowerCase().trim()
      if (
        lower === 'nom_boutique' || lower === 'prenom' || lower === 'quartier' ||
        lower === 'secteur' || lower === 'telephone' || lower === 'lien_demo' ||
        lower === 'lien_boutique' || lower === 'lien_tarifs' || lower === 'salutation'
      ) {
        return match
      }
      if (!choices.includes('|')) return match
      hasSpintax = true
      const options = choices.split('|')
      return options[0].trim()
    })
  }
  return res
}

export function generatePreviewText(
  campagneMessage: string,
  previewLead: {
    nom_boutique?: string | null
    contact_nom?: string | null
    quartier?: string | null
    categorie?: string | null
    telephone?: string | null
  }
): string {
  const rawNom = (previewLead.nom_boutique || '').trim()
  const rawPrenom = (previewLead.contact_nom || '').trim()
  const estNomAuth = estNomPropreAuthentique(rawNom)
  const estPrenomAuth = estNomPropreAuthentique(rawPrenom)
  const salutationTarget = estPrenomAuth ? rawPrenom : (estNomAuth ? rawNom : null)

  let previewText = parseClientSpintax(campagneMessage)

  if (/\{salutation\}/i.test(previewText)) {
    previewText = previewText.replace(/\{salutation\}/gi, salutationTarget ? `Salam ${salutationTarget} ! ` : 'Salam ! ')
  }

  previewText = previewText
    .replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*\(\s*\{nom_boutique\}\s*\)\s*!/gi, (_m, salut) => {
      if (estPrenomAuth && estNomAuth) return `${salut} ${rawPrenom} (${rawNom}) !`
      if (salutationTarget) return `${salut} ${salutationTarget} !`
      return `${salut} !`
    })
    .replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{nom_boutique\}\s*!/gi, (_m, salut) => {
      return salutationTarget ? `${salut} ${salutationTarget} !` : `${salut} !`
    })
    .replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*!/gi, (_m, salut) => {
      return salutationTarget ? `${salut} ${salutationTarget} !` : `${salut} !`
    })
    .replace(/\{nom_boutique\}/gi, estNomAuth ? rawNom : 'votre boutique')
    .replace(/\{prenom\}/gi, estPrenomAuth ? rawPrenom : 'cher commerçant')
    .replace(/\{quartier\}/gi, formatQuartierStr(previewLead.quartier))
    .replace(/\{secteur\}/gi, previewLead.categorie || 'commerce')
    .replace(/\{telephone\}/gi, previewLead.telephone ? `+${previewLead.telephone}` : '')
    .replace(/\{lien_demo\}/gi, 'https://nopalou.com/guide-creer-boutique')
    .replace(/\{lien_boutique\}/gi, 'https://nopalou.com/creer-boutique')
    .replace(/\{lien_tarifs\}/gi, 'https://nopalou.com/tarifs-boutique')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  return previewText
}

export function exportLeadsCSV(filteredLeads: Lead[]): void {
  const headers = ['Nom Boutique', 'Contact', 'Téléphone', 'Opérateur', 'Email', 'Catégorie', 'Quartier', 'Statut', 'Source']
  const rows = filteredLeads.map((l) => [
    `"${l.nom_boutique || ''}"`,
    `"${l.contact_nom || ''}"`,
    `"${l.telephone || ''}"`,
    `"${l.operateur || ''}"`,
    `"${l.email || ''}"`,
    `"${l.categorie || ''}"`,
    `"${l.quartier || ''}"`,
    `"${l.statut || ''}"`,
    `"${l.source || ''}"`,
  ])
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `leads_prospection_nopalou_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportBlacklistCSV(filteredBlacklist: BlacklistItem[]): void {
  const headers = ['Numéro Téléphone', 'Raison / Motif', 'Date Ajout', 'Boutique Associée', 'Contact', 'Catégorie', 'Quartier']
  const rows = filteredBlacklist.map((b) => [
    `"+${b.phone}"`,
    `"${b.reason || 'optout'}"`,
    `"${new Date(b.created_at).toLocaleString('fr-FR')}"`,
    `"${b.nom_boutique || 'Inconnu'}"`,
    `"${b.contact_nom || ''}"`,
    `"${b.categorie || ''}"`,
    `"${b.quartier || b.ville || ''}"`,
  ])
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `blacklist_nopalou_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
