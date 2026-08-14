import { Metadata } from 'next';
import { verifySession } from '@/lib/dal';
import FormAlerte from '@/components/FormAlerte';
import MesAlertesClient from '@/components/MesAlertesClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Mes alertes prix',
  description: 'Gérez vos alertes de baisse de prix — recevez une notification WhatsApp ou email quand un produit baisse.',
};

export default async function MesAlertesPage() {
  const session = await verifySession();

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Mon compte', href: '/compte' },
          { label: 'Mes alertes prix' }
        ]}
        emoji="🔔"
        titre="Mes alertes prix"
        compteur="Recevez une alerte WhatsApp ou email quand un prix baisse jusqu'à votre prix cible."
      />

      <div className="mes-alertes-grid">
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
