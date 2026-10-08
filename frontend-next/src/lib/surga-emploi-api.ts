// frontend-next/src/lib/surga-emploi-api.ts
// Helper d'API pour le pôle Emploi, Profil Pro, CV PDF, Lettres et Documents (Tranches 18 & 19)
// Gestion transparente du token JWT, repli sur Device ID local pour utilisateurs PWA/Invités

export function getSurgaEmploiHeaders(avecJson = true): Record<string, string> {
  const headers: Record<string, string> = {}
  if (avecJson) {
    headers['Content-Type'] = 'application/json'
  }

  if (typeof window !== 'undefined') {
    // 1. Récupération d'un token de session s'il existe
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('surga_token') ||
      localStorage.getItem('nopalou_session') ||
      localStorage.getItem('nopalou_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 2. Identifiant d'appareil / utilisateur Surga stable
    let deviceId = localStorage.getItem('surga_device_id')
    if (!deviceId) {
      deviceId = 'surga_usr_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36)
      try {
        localStorage.setItem('surga_device_id', deviceId)
      } catch {}
    }
    headers['x-surga-user-id'] = deviceId
  }

  return headers
}

export function telechargerBlobPdf(blob: Blob, nomFichier: string): void {
  if (typeof window === 'undefined') return
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier.endsWith('.pdf') ? nomFichier : `${nomFichier}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Une lecture en échec (réseau coupé, statut d'erreur, « success: false ») vaut null. L'ancien repli la changeait
// en objet vide : la fenêtre montrait alors un profil vierge, que l'on pouvait enregistrer par-dessus le vrai.
async function lireEmploi(adresse: string, headers: Record<string, string>): Promise<any | null> {
  try {
    const res = await fetch(adresse, { headers })
    if (!res.ok) return null
    const data = await res.json()
    return data && data.success ? data : null
  } catch {
    return null
  }
}

export async function fetchSurgaEmploiDonnees() {
  const headers = getSurgaEmploiHeaders(true)
  const [resProfil, resDroits, resDocs, resDroitsEntretien] = await Promise.all([
    lireEmploi('/api/surga/emploi/profil', headers),
    lireEmploi('/api/surga/emploi/droits', headers),
    lireEmploi('/api/surga/emploi/documents', headers),
    lireEmploi('/api/surga/emploi/entretien/droits', headers),
  ])

  return {
    // « echec » : au moins une des quatre lectures n'a pas abouti. À distinguer de « pas encore de profil ».
    echec: [resProfil, resDroits, resDocs, resDroitsEntretien].some((r) => r === null),
    profil: resProfil?.success && resProfil.profil ? resProfil.profil : null,
    droits: resDroits?.success && resDroits.droits ? resDroits.droits : null,
    documents: resDocs?.success && Array.isArray(resDocs.documents) ? resDocs.documents : [],
    droitsEntretien: resDroitsEntretien?.success && resDroitsEntretien.droits ? resDroitsEntretien.droits : null,
  }
}
