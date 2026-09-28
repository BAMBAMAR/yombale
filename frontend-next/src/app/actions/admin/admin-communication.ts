'use server'

import { revalidatePath } from 'next/cache'
import { getAdminToken } from './admin-auth'
import { BACKEND, adminHeaders } from './admin-common'
import type { SocialLinkItem } from '@/app/admin/(protected)/communication/components/types'

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  { id: 'tiktok', name: 'TikTok Officiel', handle: '@nopalou.com', url: 'https://www.tiktok.com/@nopalou.com', code: 'TT', bg: '#000000', color: '#ffffff', actif: true, ordre: 1, description: 'Vidéos démos & astuces commerçants' },
  { id: 'whatsapp_channel', name: 'Canal WhatsApp', handle: 'Canal Nopalou.com', url: 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33', code: 'WA', bg: '#25D366', color: '#ffffff', actif: true, ordre: 2, description: 'Canal officiel des alertes et bons plans' },
  { id: 'facebook', name: 'Facebook Page', handle: 'Nopalou Sénégal', url: 'https://www.facebook.com/profile.php?id=61591675701726', code: 'FB', bg: '#1877F2', color: '#ffffff', actif: true, ordre: 3, description: 'Actualités, communauté et événements' },
  { id: 'instagram', name: 'Instagram', handle: '@nopalousn', url: 'https://www.instagram.com/nopalousn/', code: 'IG', bg: '#E4405F', color: '#ffffff', actif: true, ordre: 4, description: 'Photos boutiques, carrousels et stories' },
  { id: 'twitter', name: 'Twitter / X', handle: '@nopalou_sn', url: 'https://x.com/nopalou_sn', code: 'X', bg: '#0f172a', color: '#ffffff', actif: true, ordre: 5, description: 'Fil d\'actualités et mises à jour produit' },
  { id: 'whatsapp_support', name: 'WhatsApp Support', handle: '+221 70 871 79 42', url: 'https://wa.me/221708717942', code: 'SP', bg: '#128C7E', color: '#ffffff', actif: true, ordre: 6, description: 'Ligne directe assistance marchands & acheteurs' },
]

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

