'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AccountMobileHeader() {
  const pathname = usePathname()
  if (pathname === '/compte') return null

  return (
    <div className="account-mobile-header">
      <Link href="/compte" className="account-back-link">
        ← Retour à mon compte
      </Link>
    </div>
  )
}
