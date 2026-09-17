'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE_SECRET = 'nopalou_admin'
const COOKIE_JWT    = 'nopalou_admin_jwt'
const COOKIE        = COOKIE_SECRET

export interface AdminUserSession {
  id: string
  nom: string
  email: string
  role: 'super_admin' | 'admin_operationnel' | 'support_client' | 'moderateur' | 'finance'
  permissions: string[]
}

export async function getAdminToken(): Promise<string | undefined> {
  const jar = await cookies()
  return jar.get(COOKIE_JWT)?.value || jar.get(COOKIE_SECRET)?.value
}

export async function getAdminSession(): Promise<AdminUserSession | null> {
  const jar = await cookies()
  const jwt = jar.get(COOKIE_JWT)?.value
  const secret = jar.get(COOKIE_SECRET)?.value

  if (jwt && jwt.startsWith('eyJ')) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/auth/me`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Cookie': `${COOKIE_JWT}=${jwt}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) return data.user
      }
    } catch {
      // Backend injoignable
    }
  }

  if (secret) {
    return {
      id: 'break-glass-admin',
      nom: 'Super Administrateur',
      email: 'admin@nopalou.com',
      role: 'super_admin',
      permissions: ['*'],
    }
  }

  return null
}

function adminHeaders(secretOrJwt?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secretOrJwt) {
    if (secretOrJwt.startsWith('eyJ')) {
      headers['Authorization'] = `Bearer ${secretOrJwt}`
      headers['Cookie'] = `${COOKIE_JWT}=${secretOrJwt}`
    }
    headers['X-Admin-Secret'] = secretOrJwt
  }
  return headers
}

// ── Login ──────────────────────────────────────────────────────────
export async function adminLogin(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string ?? '').trim()
  const motDePasse = (formData.get('mot_de_passe') as string ?? (formData.get('password') as string ?? '')).trim()
  const secret = (formData.get('secret') as string ?? '').trim()

  const jar = await cookies()

  // 1. Authentification nominative (Email + Mot de passe)
  if (email && motDePasse) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          jar.set(COOKIE_JWT, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 12,
          })
          jar.set(COOKIE_SECRET, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 12,
          })
          redirect('/admin')
        }
      } else {
        redirect('/admin/login?error=secret_incorrect')
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
      redirect('/admin/login?error=erreur_serveur')
    }
  }

  // 2. Authentification par Secret Master (Break-glass & E2E Tests)
  if (secret) {
    const envSecret = process.env.ADMIN_SECRET
    if (envSecret && secret === envSecret) {
      jar.set(COOKIE_SECRET, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12,
      })
      redirect('/admin')
    }

    try {
      const res = await fetch(`${BACKEND}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          jar.set(COOKIE_JWT, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 12,
          })
          jar.set(COOKIE_SECRET, secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 12,
          })
          redirect('/admin')
        }
      } else if (res.status === 401 || res.status === 403) {
        redirect('/admin/login?error=secret_incorrect')
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    }

    // Fallback de compatibilité (si le backend distant n'est pas encore redéployé)
    try {
      const r = await fetch(`${BACKEND}/api/annonces/admin/en-attente`, {
        headers: { 'X-Admin-Secret': secret },
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      })

      if (r.status === 401 || r.status === 403) redirect('/admin/login?error=secret_incorrect')
      if (r.ok) {
        jar.set(COOKIE_SECRET, secret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 8,
        })
        redirect('/admin')
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    }

    redirect('/admin/login?error=secret_incorrect')
  }

  redirect('/admin/login?error=secret_requis')
}

// ── Logout ─────────────────────────────────────────────────────────
export async function adminLogout(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE_SECRET)
  jar.delete(COOKIE_JWT)
  redirect('/admin/login')
}

// ── Modérer annonce classifiée ──────────────────────────────────────
export async function modererAnnonce(
  id: string,
  action: 'approuver' | 'rejeter'
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body = action === 'approuver'
    ? { actif: true,  rejete: false }
    : { actif: false, rejete: true  }

  const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  revalidatePath('/admin/annonces')
  revalidatePath('/annonces')
  return {}
}

// ── Booster annonce classifiée (7 jours ou personnalisé) ────────────
export async function boosterAnnonce(
  id: string,
  jours = 7
): Promise<{ error?: string; boost_until?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/annonces/admin/${id}/boost`, {
    method: 'POST',
    headers: adminHeaders(secret),
    body: JSON.stringify({ jours }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors du boost de l\'annonce' }
  const data = await r.json()
  revalidatePath('/admin/annonces')
  revalidatePath('/annonces')
  return { boost_until: data.annonce?.boost_until }
}

// ── Modérer partenaire ─────────────────────────────────────────────
export async function modererPartenaire(
  id: string,
  statut: 'approuve' | 'rejete'
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/partenaires/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ statut }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Activer sponsoring immo ─────────────────────────────────────────
export async function activerSponsoring(
  id: string | number
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const sponsorisee_jusqu_au = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ sponsorisee: true, sponsorisee_jusqu_au }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de l\'activation du sponsoring' }
  return {}
}

// ── Modérer boutique (activer/désactiver) ───────────────────────────
export async function modererBoutique(
  id: string,
  actif: boolean
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/boutiques/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ actif }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Sponsoriser boutique ─────────────────────────────────────────────
export async function activerSponsoringBoutique(
  id: string,
  activer: boolean
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body = activer
    ? { sponsorise: true, sponsor_jusqu_au: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() }
    : { sponsorise: false, sponsor_jusqu_au: null }

  const r = await fetch(`${BACKEND}/api/boutiques/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors du sponsoring' }
  return {}
}

// ── Modérer annonce immo ────────────────────────────────────────────
export async function modererImmo(
  id: number,
  actif: boolean,
  motif_rejet?: string
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body: Record<string, unknown> = { actif }
  if (!actif && motif_rejet !== undefined) {
    body.rejete      = true
    body.motif_rejet = motif_rejet
  } else if (actif) {
    body.rejete      = false
    body.motif_rejet = null
  }

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Supprimer annonce classifiée ───────────────────────────────────
export async function supprimerAnnonce(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/admin/annonces')
  revalidatePath('/annonces')
  return {}
}

// ── Batch Actions Annonces ──────────────────────────────────────────
export async function batchModererAnnonces(ids: string[], action: 'approuver' | 'rejeter'): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await modererAnnonce(id, action)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/annonces')
  return { successCount, errors }
}

export async function batchSupprimerAnnonces(ids: string[]): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await supprimerAnnonce(id)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/annonces')
  return { successCount, errors }
}

// ── Supprimer boutique ──────────────────────────────────────────────
export async function supprimerBoutique(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/boutiques/admin/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression de la boutique' }
  revalidatePath('/admin/boutiques')
  return {}
}

// ── Batch Actions Boutiques ─────────────────────────────────────────
export async function batchModererBoutiques(ids: string[], actif: boolean): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await modererBoutique(id, actif)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/boutiques')
  return { successCount, errors }
}

export async function batchSupprimerBoutiques(ids: string[]): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await supprimerBoutique(id)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/boutiques')
  return { successCount, errors }
}

// ── Supprimer immo ──────────────────────────────────────────────────
export async function supprimerImmo(id: number | string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression immo' }
  revalidatePath('/admin/immo')
  return {}
}

// ── Batch Actions Immo ──────────────────────────────────────────────
export async function batchModererImmo(
  ids: (number | string)[],
  action: 'valider' | 'desactiver' | 'sponsoriser' | 'supprimer'
): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0

  for (const id of ids) {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id
    let res: { error?: string } = {}
    if (action === 'valider') {
      res = await modererImmo(numId, true)
    } else if (action === 'desactiver') {
      res = await modererImmo(numId, false)
    } else if (action === 'sponsoriser') {
      res = await activerSponsoring(numId)
    } else if (action === 'supprimer') {
      res = await supprimerImmo(numId)
    }

    if (res.error) errors++
    else successCount++
  }

  revalidatePath('/admin/immo')
  return { successCount, errors }
}

// ── Supprimer Partenaire ────────────────────────────────────────────
export async function supprimerPartenaire(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/partenaires/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/admin/partenaires')
  return {}
}

// ── Batch Actions Partenaires ───────────────────────────────────────
export async function batchModererPartenaires(
  ids: string[],
  action: 'approuver' | 'rejeter' | 'supprimer'
): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    let res: { error?: string } = {}
    if (action === 'approuver') res = await modererPartenaire(id, 'approuve')
    else if (action === 'rejeter') res = await modererPartenaire(id, 'rejete')
    else if (action === 'supprimer') res = await supprimerPartenaire(id)

    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/partenaires')
  return { successCount, errors }
}

// ── Batch Actions Comptes ───────────────────────────────────────────
export async function batchModererComptes(
  ids: string[],
  action: 'suspendre' | 'reactiver' | 'supprimer'
): Promise<{ successCount: number; errors: number }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { successCount: 0, errors: ids.length }

  let successCount = 0
  let errors = 0

  for (const id of ids) {
    let url = `${BACKEND}/api/admin/utilisateurs/${id}/suspendre`
    let method = 'PUT'

    if (action === 'reactiver') {
      url = `${BACKEND}/api/admin/utilisateurs/${id}/reactiver`
    } else if (action === 'supprimer') {
      url = `${BACKEND}/api/admin/utilisateurs/${id}/marquer-supprime`
      method = 'POST'
    }

    try {
      const r = await fetch(url, {
        method,
        headers: adminHeaders(secret),
        cache: 'no-store',
      })
      if (r.ok) successCount++
      else errors++
    } catch {
      errors++
    }
  }

  revalidatePath('/admin/comptes')
  return { successCount, errors }
}

// ── Reversements Wave Marchands 1-Clic ──────────────────────────────
export async function fetchReversementsDus(): Promise<{ reversements?: any[]; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/comptabilite/admin/reversements-dus`, {
      headers: adminHeaders(secret),
      cache: 'no-store',
    })
    if (!r.ok) return { error: 'Erreur lors du chargement' }
    return await r.json()
  } catch (err: any) {
    return { error: err.message || 'Erreur réseau' }
  }
}

export async function effectuerReversementWave(commandeId: string): Promise<{ success?: boolean; error?: string; payout?: any; net_amount?: number; mobile?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/comptabilite/admin/reversements/${commandeId}/payer`, {
      method: 'POST',
      headers: adminHeaders(secret),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors du transfert Wave' }
    revalidatePath('/admin/reversements')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function validerLotReversementsWave(ids: string[]): Promise<{ success?: boolean; count?: number; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/comptabilite/admin/reversements/valider-lot`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ ids }),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de la validation du lot' }
    revalidatePath('/admin/reversements')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── Relance & Onboarding Catalogue Marchands ──────────────────────────────
export async function relancerCatalogueBoutique(
  boutiqueId: string,
  messageCustom?: string,
  titreCustom?: string
): Promise<{ success?: boolean; result?: any; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ boutiqueId, messageCustom, titreCustom }),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de l\'envoi de la relance' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function batchRelancerCatalogueBoutiques(
  boutiqueIds: string[],
  messageCustom?: string,
  titreCustom?: string
): Promise<{ success?: boolean; successCount?: number; errorCount?: number; errors?: any[]; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ boutiqueIds, messageCustom, titreCustom }),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de la relance groupée' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function getRelanceCatalogueConfig(): Promise<{
  config?: {
    actif: boolean
    seuil: number
    delai_heures: number
    intervalle_jours: number
    titre: string
    template: string
  }
  stats?: Record<string, number>
  boutiquesEligibles?: Array<{
    id: string
    nom: string
    slug: string
    nb_produits: number
    telephone: string
    created_at: string
    derniere_relance_catalogue_at?: string | null
    nb_relances_catalogue?: number
  }>
  error?: string
}> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/config`, {
      headers: adminHeaders(secret),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur chargement configuration' }
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function updateRelanceCatalogueConfig(payload: {
  actif?: boolean
  seuil?: number
  delai_heures?: number
  intervalle_jours?: number
  titre?: string
  template?: string
}): Promise<{ success?: boolean; message?: string; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/config`, {
      method: 'PUT',
      headers: adminHeaders(secret),
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de la sauvegarde de la configuration' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function executerCronRelanceCatalogueAction(): Promise<{
  success?: boolean
  count?: number
  successCount?: number
  errorCount?: number
  errors?: any[]
  message?: string
  error?: string
}> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/executer-cron`, {
      method: 'POST',
      headers: adminHeaders(secret),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de l\'exécution du cron' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── 1. Équipe & RBAC ──────────────────────────────────────────────
export async function adminGetEquipe(): Promise<{ success?: boolean; membres?: any[]; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur récupération équipe' }
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminCreerMembreEquipe(payload: {
  nom: string
  email: string
  motDePasse: string
  role: string
  telephone?: string
}): Promise<{ success?: boolean; membre?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe`, {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur création membre' }
    revalidatePath('/admin/equipe-admin')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminModifierMembreEquipe(
  id: string,
  payload: { nom?: string; email?: string; role?: string; actif?: boolean; motDePasse?: string }
): Promise<{ success?: boolean; membre?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe/${id}`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur mise à jour membre' }
    revalidatePath('/admin/equipe-admin')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminSupprimerMembreEquipe(id: string): Promise<{ success?: boolean; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur suppression membre' }
    revalidatePath('/admin/equipe-admin')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── 2. Modération Produits Marchands & POS ─────────────────────────
export async function adminModererProduit(
  id: string,
  payload: { actif?: boolean; prix?: number; stock?: number }
): Promise<{ success?: boolean; produit?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/produits/${id}/moderation`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modération produit' }
    revalidatePath('/admin/produits')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── 3. POS Sessions Superviseur ────────────────────────────────────
export async function adminFermerSessionPOS(
  sessionId: string,
  payload: { notes?: string }
): Promise<{ success?: boolean; session?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/pos/sessions/${sessionId}/force-fermeture`, {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur clôture session' }
    revalidatePath('/admin/pos')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── 4. Carnet de dettes & Crédits Clients ──────────────────────────
export async function adminAjusterCreditClient(
  clientId: string,
  payload: { limite_credit?: number; actif?: boolean }
): Promise<{ success?: boolean; client?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/credits/clients/${clientId}`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur mise à jour client crédit' }
    revalidatePath('/admin/carnet-dettes')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── 5. Immobilier Global ───────────────────────────────────────────
export async function adminModererAgence(
  agenceId: string,
  payload: { statut: 'active' | 'suspendue' | 'en_attente'; note_verification?: string }
): Promise<{ success?: boolean; agence?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/immo-global/agences/${agenceId}/statut`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modération agence' }
    revalidatePath('/admin/immo/agences')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminModererBien(
  bienId: string,
  payload: { statut: string }
): Promise<{ success?: boolean; bien?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/immo-global/biens/${bienId}/statut`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modération bien' }
    revalidatePath('/admin/immo/biens')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}




