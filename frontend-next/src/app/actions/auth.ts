'use server'
import { redirect } from 'next/navigation'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { backendFetch } from '@/lib/backend-fetch'

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
    })
  } catch (e) {
    console.error('[LOGIN]', e instanceof Error ? e.message : e)
    return { error: 'Erreur de connexion au serveur' }
  }

  redirect('/compte')
}

// ── Inscription ──────────────────────────────────────────────────
export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const nom = formData.get('nom')?.toString().trim() ?? ''
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!nom || !email || !password) return { error: 'Tous les champs sont requis' }
  if (password.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères' }

  try {
    const res = await fetch(`${API}/api/auth/inscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, mot_de_passe: password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? 'Erreur lors de l\'inscription' }

    await createSession({
      userId: data.user.id,
      nom: data.user.nom,
      email: data.user.email,
    })
  } catch (e) {
    console.error('[SIGNUP]', e instanceof Error ? e.message : e)
    return { error: 'Erreur de connexion au serveur' }
  }

  redirect('/compte')
}

// ── Déconnexion ──────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/')
}

// ── Mise à jour profil ───────────────────────────────────────────
export async function updateProfil(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const nom   = formData.get('nom')?.toString().trim() ?? ''
  const email = formData.get('email')?.toString().trim() ?? ''

  if (!nom && !email) return { error: 'Remplissez au moins un champ' }

  try {
    const res = await backendFetch('/api/auth/profil', {
      method: 'PUT',
      body: JSON.stringify({ ...(nom && { nom }), ...(email && { email }) }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.errors?.[0]?.msg ?? data.error ?? 'Erreur lors de la mise à jour' }

    const current = await getSession()
    if (current) {
      await createSession({ userId: current.userId, nom: data.user.nom, email: data.user.email })
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
