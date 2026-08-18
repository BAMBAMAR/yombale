import { Metadata } from 'next';
import { verifySession } from '@/lib/dal';
import FormAlerte from '@/components/FormAlerte';
import MesAlertesClient from '@/components/MesAlertesClient';
import PageHeader from '@/components/PageHeader';
import { getServerTranslation } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Mes alertes prix',
  description: 'Gérez vos alertes de baisse de prix — recevez une notification WhatsApp ou email quand un produit baisse.',
};

export default async function MesAlertesPage() {
  const session = await verifySession();
  const { t } = getServerTranslation();

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: t('account.navTitle'), href: '/compte' },
          { label: t('account.navPriceAlerts') }
        ]}
        emoji="🔔"
        titre={t('account.navPriceAlerts')}
        compteur={t('account.alertsSubtitle')}
      />

      <div className="mes-alertes-grid">
        <div>
          <h2>{t('account.createAlert')}</h2>
          <FormAlerte userId={session.userId} />
        </div>

        <div>
          <h2>{t('account.myActiveAlerts')}</h2>
          <MesAlertesClient userId={session.userId} />
        </div>
      </div>
    </div>
  );
}
