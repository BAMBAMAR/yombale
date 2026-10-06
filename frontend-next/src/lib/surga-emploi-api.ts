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

export async function fetchSurgaEmploiDonnees() {
  const headers = getSurgaEmploiHeaders(true)
  const [resProfil, resDroits, resDocs, resDroitsEntretien] = await Promise.all([
    fetch('/api/surga/emploi/profil', { headers }).then((r) => r.json()).catch(() => ({})),
    fetch('/api/surga/emploi/droits', { headers }).then((r) => r.json()).catch(() => ({})),
    fetch('/api/surga/emploi/documents', { headers }).then((r) => r.json()).catch(() => ({})),
    fetch('/api/surga/emploi/entretien/droits', { headers }).then((r) => r.json()).catch(() => ({})),
  ])

  return {
    profil: resProfil?.success && resProfil.profil ? resProfil.profil : null,
    droits: resDroits?.success && resDroits.droits ? resDroits.droits : null,
    documents: resDocs?.success && Array.isArray(resDocs.documents) ? resDocs.documents : [],
    droitsEntretien: resDroitsEntretien?.success && resDroitsEntretien.droits ? resDroitsEntretien.droits : null,
  }
}
