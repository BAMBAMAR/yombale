import { cookies } from 'next/headers'
import AdminWhatsAppTemplatesClient from './AdminWhatsAppTemplatesClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export const metadata = { title: 'Templates WhatsApp — Admin Nopalou' }

export default async function AdminWhatsAppTemplatesPage() {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''

  let templates = []

  try {
    const res = await fetch(`${BACKEND}/api/admin/whatsapp-templates`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      templates = data.templates ?? []
    }
  } catch (err) {
    console.error('[WHATSAPP_TEMPLATES_PAGE_ERR]', err)
  }

  return (
    <div className="admin-content">
      <AdminWhatsAppTemplatesClient initialTemplates={templates} secret={secret} />
    </div>
  )
}
