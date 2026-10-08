'use server'
import { redirect } from 'next/navigation'
import { createSession, deleteSession, getSession, versionDuJeton } from '@/lib/session'
import { verifierJetonSession } from '@/lib/session-verify'
import { backendFetch } from '@/lib/backend-fetch'
import { validerForceMotDePasse } from '@/lib/password-validator'

const API = process.env.BACKEND_URL ?? 'http://localhost:3000'

// ── Connexion ────────────────────────────────────────────────────
export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) return { error: 'Email et mot de passe requis' }

  try {
    const res = await fetch(`${API}/api/auth/connexion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mot_de_passe: password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Identifiants invalides' }

    await createSession({
      userId: data.user.id,
      nom: data.user.nom,
      email: data.user.email,
      telephone: data.user.telephone,
      jwtVersion: versionDuJeton(data.token),
    })
  } catch (e) {
    console.error('[LOGIN]', e instanceof Error ? e.message : e)
    return { error: 'Erreur de connexion au serveur' }
  }

  const redirectTarget = formData.get('redirect')?.toString().trim()
  redirect(redirectTarget && redirectTarget.startsWith('/') ? redirectTarget : '/compte')
}

// ── Inscription ──────────────────────────────────────────────────
export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const nom = formData.get('nom')?.toString().trim() ?? ''
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const telephone = formData.get('telephone')?.toString().trim() ?? ''

  if (!nom || !email || !password) return { error: 'Tous les champs sont requis' }
  const checkPwd = validerForceMotDePasse(password)
  if (!checkPwd.valide) return { error: checkPwd.message }

  try {
    const res = await fetch(`${API}/api/auth/inscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, mot_de_passe: password, telephone: telephone || undefined }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erreur lors de l\'inscription' }

    await createSession({
      userId: data.user.id,
      nom: data.user.nom,
      email: data.user.email,
      telephone: data.user.telephone,
      jwtVersion: versionDuJeton(data.token),
    })
  } catch (e) {
    console.error('[SIGNUP]', e instanceof Error ? e.message : e)
    return { error: 'Erreur de connexion au serveur' }
  }

  const plan = formData.get('plan')?.toString().trim()
  const duree = formData.get('duree')?.toString().trim() || '1'
  const redirectTargetSignup = formData.get('redirect')?.toString().trim()

  if (plan && ['pro', 'business', 'decouverte', 'immo_pro', 'immo_multi_agence'].includes(plan)) {
    redirect(`/boutique/abonnement?plan=${encodeURIComponent(plan)}&duree=${encodeURIComponent(duree)}${redirectTargetSignup ? `&redirect=${encodeURIComponent(redirectTargetSignup)}` : ''}`)
  }

  redirect(redirectTargetSignup && redirectTargetSignup.startsWith('/') ? redirectTargetSignup : '/compte')
}

// ── Déconnexion ──────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/')
}

// ── Mise à jour profil ───────────────────────────────────────────
export async function updateProfil(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const nom       = formData.get('nom')?.toString().trim() ?? ''
  const email     = formData.get('email')?.toString().trim() ?? ''
  const telephone = formData.get('telephone')?.toString().trim() ?? ''

  if (!nom && !email && !telephone) return { error: 'Remplissez au moins un champ' }

  try {
    const res = await backendFetch('/api/auth/profil', {
      method: 'PUT',
      body: JSON.stringify({
        ...(nom && { nom }),
        ...(email && { email }),
        ...(telephone !== undefined && { telephone }),
      }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.errors?.[0]?.msg ?? data.error ?? 'Erreur lors de la mise à jour' }

    const current = await getSession()
    if (current) {
      await createSession({
        userId: current.userId,
        nom: data.user.nom,
        email: data.user.email,
        telephone: data.user.telephone,
        jwtVersion: current.jwtVersion,
      })
    }
    return { message: 'Profil mis à jour ✓' }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

// ── Renvoi email de vérification ─────────────────────────────────
export async function renvoyerEmailVerification(): Promise<AuthState> {
  try {
    const res = await backendFetch('/api/auth/renvoyer-verification', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data.error ?? 'Impossible d\'envoyer l\'email.' }
    return { message: 'Email de vérification envoyé ✓ Vérifiez votre boîte mail.' }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

// ── Types ────────────────────────────────────────────────────────
export interface AuthState {
  error?: string
  message?: string
}

// Server Action appelable par n'importe quel client : n'accepte QUE un jeton signé par le backend.
// Jamais d'objet ni de payload non vérifié (sinon prise de contrôle de compte par simple userId).
export async function setAuthCookieAction(token: unknown) {
  if (typeof token !== 'string') {
    console.error('[setAuthCookieAction] Jeton absent ou invalide')
    return
  }
  const payload = await verifierJetonSession(token)
  if (!payload) {
    console.error('[setAuthCookieAction] Signature du jeton invalide')
    return
  }
  await createSession({
    userId: String(payload.userId || payload.id),
    nom: (payload.nom as string) || '',
    email: (payload.email as string) || '',
    telephone: (payload.telephone as string) || '',
    jwtVersion: typeof payload.jwtVersion === 'number' ? payload.jwtVersion : undefined,
  })
}

// ── Suppression de compte autonome (RGPD Art. 17) ───────────────────
export async function supprimerCompteAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const motDePasse = formData.get('mot_de_passe')?.toString() ?? ''
  const confirmation = formData.get('confirmation')?.toString()?.trim() ?? ''

  if (confirmation.toUpperCase() !== 'SUPPRIMER') {
    return { error: 'Veuillez taper "SUPPRIMER" pour valider la demande.' }
  }

  try {
    const res = await backendFetch('/api/auth/supprimer-compte', {
      method: 'POST',
      body: JSON.stringify({ mot_de_passe: motDePasse, confirmation }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: data.error ?? 'Impossible de supprimer le compte' }
    }
    // Nettoyer la session Next.js
    await deleteSession()
    return { message: data.message ?? 'Demande de suppression enregistrée.' }
  } catch (e) {
    console.error('[SUPPRIMER COMPTE ACTION]', e)
    return { error: 'Erreur de communication avec le serveur.' }
  }
}

// ── Annuler la suppression du compte ─────────────────────────────────
export async function annulerSuppressionAction(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await backendFetch('/api/auth/annuler-suppression', {
      method: 'POST',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error ?? 'Impossible d\'annuler la suppression.' }
    }
    return { success: true, message: data.message ?? 'Suppression annulée avec succès.' }
  } catch (e) {
    console.error('[ANNULER SUPPRESSION ACTION]', e)
    return { success: false, error: 'Erreur réseau.' }
  }
}

// ── Statut de suppression du compte ─────────────────────────────────
export async function getStatutSuppressionAction(): Promise<{
  en_cours_de_suppression: boolean
  supprime_le?: string | null
  supprime_par_utilisateur?: boolean
  jours_restants?: number | null
  date_limite?: string | null
}> {
  try {
    const res = await backendFetch('/api/auth/statut-suppression')
    if (!res.ok) return { en_cours_de_suppression: false }
    return await res.json()
  } catch {
    return { en_cours_de_suppression: false }
  }
}


