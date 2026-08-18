import type { Metadata } from 'next'
import MotDePasseOublieClient from './MotDePasseOublieClient'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: 'noindex',
}

export default function MotDePasseOubliePage() {
  return <MotDePasseOublieClient />
}
