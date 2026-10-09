import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Redirection vers Surga Admin',
  robots: 'noindex, nofollow',
}

export default function SurgaAdminRedirectPage() {
  redirect('/admin/surga')
}
