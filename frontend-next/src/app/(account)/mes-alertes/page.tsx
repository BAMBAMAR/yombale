import { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import AlertesClientTab from '../compte/tabs/AlertesClientTab'

export const metadata: Metadata = {
  title: 'Mes alertes prix — Nopalou',
  description: 'Gérez vos alertes de baisse de prix — recevez une notification WhatsApp ou email quand un produit baisse.',
}

export default async function MesAlertesPage() {
  const session = await verifySession()

  return (
    <div style={{ padding: '20px' }}>
      <AlertesClientTab userId={session.userId} />
    </div>
  )
}
