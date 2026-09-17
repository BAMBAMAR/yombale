import type { Lead, BlacklistItem } from './types'

export function computeFilteredLeads(
  leads: Lead[],
  catFilter: string,
  statutFilter: string,
  sourceFilter: string,
  operateurFilter: string,
  quartierFilter: string,
  search: string,
  sousProfilFilter?: string
): Lead[] {
  return leads.filter((l) => {
    if (catFilter !== 'tous') {
      if (catFilter === 'smartphones' && l.categorie !== 'smartphones' && l.categorie !== 'tech') return false
      else if (catFilter === 'beaute' && l.categorie !== 'beaute' && l.categorie !== 'cosmetique') return false
      else if (catFilter === 'divers' && l.categorie !== 'divers' && l.categorie !== 'mixte') return false
      else if (l.categorie !== catFilter) return false
    }
    if (statutFilter !== 'tous' && l.statut !== statutFilter) return false
    if (sousProfilFilter && sousProfilFilter !== 'tous' && l.sous_profil !== sousProfilFilter) return false
    if (sourceFilter !== 'tous') {
      if (sourceFilter === 'facebook' && !(l.source || '').startsWith('annonce_facebook')) return false
      else if (sourceFilter !== 'facebook' && l.source !== sourceFilter) return false
    }
    if (operateurFilter !== 'tous' && l.operateur !== operateurFilter) return false
    if (quartierFilter !== 'tous' && (l.quartier || '').toLowerCase() !== quartierFilter.toLowerCase()) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const matchNom = (l.nom_boutique || '').toLowerCase().includes(q)
      const matchContact = (l.contact_nom || '').toLowerCase().includes(q)
      const matchTel = (l.telephone || '').includes(q)
      const matchQuartier = (l.quartier || '').toLowerCase().includes(q)
      const matchNotes = (l.notes || '').toLowerCase().includes(q)
      const matchSource = (l.source || '').toLowerCase().includes(q)
      if (!matchNom && !matchContact && !matchTel && !matchQuartier && !matchNotes && !matchSource) return false
    }
    return true
  })
}

export function computeSortedLeads(
  filteredLeads: Lead[],
  sortBy: 'date' | 'priorite' | 'fit' | 'qualite'
): Lead[] {
  const arr = [...filteredLeads]
  const now = Date.now()
  switch (sortBy) {
    case 'priorite':
      return arr.sort((a, b) => {
        const dayA = (now - new Date(a.created_at).getTime()) / 86400000
        const dayB = (now - new Date(b.created_at).getTime()) / 86400000
        const freshA = Math.max(0, 100 - dayA * 0.5)
        const freshB = Math.max(0, 100 - dayB * 0.5)
        const scoreA = (a.fit_score || 0) * (a.score || 0) * freshA
        const scoreB = (b.fit_score || 0) * (b.score || 0) * freshB
        return scoreB - scoreA
      })
    case 'fit':
      return arr.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))
    case 'qualite':
      return arr.sort((a, b) => (b.score || 0) - (a.score || 0))
    case 'date':
    default:
      return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

export function computeCampaignTargetLeads(
  leads: Lead[],
  selectedLeadIds: string[],
  filteredLeads: Lead[],
  campagneLimit: number | 'tous'
): Lead[] {
  let base = selectedLeadIds.length > 0
    ? leads.filter((l) => selectedLeadIds.includes(l.id))
    : filteredLeads

  base = base.filter((l) =>
    l.statut === 'nouveau' &&
    !l.dernier_contact_at &&
    (l.nb_contacts || 0) === 0
  )

  if (campagneLimit !== 'tous' && typeof campagneLimit === 'number') {
    return base.slice(0, campagneLimit)
  }
  return base
}

export function computeUniqueQuartiers(leads: Lead[]): string[] {
  const setQ = new Set<string>()
  leads.forEach((l) => {
    if (l.quartier && l.quartier.trim() && l.quartier !== 'Dakar') {
      setQ.add(l.quartier.trim())
    }
  })
  return ['Dakar', ...Array.from(setQ).sort()]
}

export function computeFilteredBlacklist(
  blacklist: BlacklistItem[],
  blacklistSearch: string
): BlacklistItem[] {
  if (!blacklistSearch.trim()) return blacklist
  const q = blacklistSearch.toLowerCase()
  return blacklist.filter((b) =>
    (b.phone || '').includes(q) ||
    (b.reason || '').toLowerCase().includes(q) ||
    (b.nom_boutique || '').toLowerCase().includes(q) ||
    (b.contact_nom || '').toLowerCase().includes(q) ||
    (b.quartier || '').toLowerCase().includes(q)
  )
}
