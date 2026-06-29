'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export interface ActionState { error?: string; success?: boolean; info?: string }

export async function activerPlanTest(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const jar = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const email = (formData.get('email') as string)?.trim()
  const plan  = formData.get('plan') as string
  const jours = Number(formData.get('jours')) || 30

  if (!email) return { error: 'Email requis' }
  if (!['pro', 'business'].includes(plan)) return { error: 'Plan invalide' }

  try {
    const res = await fetch(`${BACKEND}/api/abonnements/admin/activer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({ email, plan, jours }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath('/admin/abonnements')
    return {
      success: true,
      info: `Plan ${plan.toUpperCase()} activé pour ${email} (${jours} jours)`,
    }
  } catch {
    return { error: 'Erreur de connexion au backend' }
  }
}
