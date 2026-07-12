import { Metadata } from 'next';
import { verifySession } from '@/lib/dal';
import FormAlerte from '@/components/FormAlerte';
import MesAlertesClient from '@/components/MesAlertesClient';

export const metadata: Metadata = {
  title: 'Mes alertes prix',
  description: 'Gérez vos alertes de baisse de prix — recevez une notification WhatsApp ou email quand un produit baisse.',
};

export default async function MesAlertesPage() {
  const session = await verifySession();

  return (
    <div className="page-container">
      <h1>Mes alertes prix</h1>
      <p className="subtitle">
        Recevez une alerte WhatsApp ou email quand un prix baisse jusqu&apos;à votre prix cible.
      </p>

      <div className="grid gap-32" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h2>Créer une alerte</h2>
          <FormAlerte userId={session.userId} />
        </div>

        <div>
          <h2>Mes alertes actives</h2>
          <MesAlertesClient userId={session.userId} />
        </div>
      </div>
    </div>
  );
}
