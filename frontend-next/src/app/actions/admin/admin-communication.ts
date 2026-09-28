'use server'

import { revalidatePath } from 'next/cache'
import { getAdminToken } from './admin-auth'
import { BACKEND, adminHeaders } from './admin-common'
import { type SocialLinkItem, DEFAULT_SOCIAL_LINKS } from '@/app/admin/(protected)/communication/components/types'

export async function adminGetSocialLinks(): Promise<{ success: boolean; links: SocialLinkItem[]; error?: string }> {
  const token = await getAdminToken()
  try {
    const res = await fetch(`${BACKEND}/api/settings`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    if (!res.ok) {
      return { success: true, links: DEFAULT_SOCIAL_LINKS }
    }
    const data = await res.json()
    if (data?.nopalou_social_links) {
      try {
        const parsed = typeof data.nopalou_social_links === 'string'
          ? JSON.parse(data.nopalou_social_links)
          : data.nopalou_social_links
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { success: true, links: parsed }
        }
      } catch {}
    }
    return { success: true, links: DEFAULT_SOCIAL_LINKS }
  } catch (err: any) {
    return { success: true, links: DEFAULT_SOCIAL_LINKS, error: err.message }
  }
}

export async function adminSaveSocialLinks(
  links: SocialLinkItem[]
): Promise<{ success: boolean; links?: SocialLinkItem[]; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { success: false, error: 'Non authentifié' }

  try {
    const res = await fetch(`${BACKEND}/api/settings`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify({
        nopalou_social_links: JSON.stringify(links),
      }),
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur lors de la sauvegarde des réseaux sociaux' }
    }
    revalidatePath('/admin/communication')
    revalidatePath('/')
    return { success: true, links }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau' }
  }
}

export async function adminResetSocialLinks(): Promise<{ success: boolean; links?: SocialLinkItem[]; error?: string }> {
  return adminSaveSocialLinks(DEFAULT_SOCIAL_LINKS)
}

