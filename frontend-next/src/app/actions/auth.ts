'use server'
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'

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

// ── Types ────────────────────────────────────────────────────────
export interface AuthState {
  error?: string
  message?: string
}
