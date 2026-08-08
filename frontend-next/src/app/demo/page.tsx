import { Metadata } from 'next';
import DemoClient from './DemoClient';
import { apiFetch } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Démo Commerciale Interactive | Nopalou — Le Super-Écosystème E-commerce au Sénégal',
  description: 'Découvrez la démo interactive de Nopalou : Comparateur de prix, Caisse POS marchand avec carnet de crédit/dette, Bot WhatsApp commercial et programme Apporteur d\'affaires 10% récurrent.',
  keywords: [
    'Nopalou',
    'Démo commerciale',
    'Comparateur de prix Sénégal',
    'Caisse POS Dakar',
    'Carnet de crédit client',
    'Bot WhatsApp e-commerce',
    'Apporteur d affaires Sénégal',
    'Boutique en ligne Dakar',
  ],
  openGraph: {
    title: 'Démo Commerciale Interactive Nopalou',
    description: 'Explorez les 3 parcours interactifs : Acheteur, Marchand et Apporteur d\'affaires. Testez la caisse POS, le comparateur et gagnez des commissions récurrentes.',
    url: 'https://nopalou.com/demo',
    siteName: 'Nopalou',
    locale: 'fr_SN',
    type: 'website',
  },
};

interface DemoPageProps {
  searchParams: Promise<{ ref?: string; role?: string; tab?: string }>;
}

export interface PublicSettings {
  plan_pro_prix?: string;
  plan_business_prix?: string;
  plan_pro_label?: string;
  plan_business_label?: string;
  apporteur_taux_commission?: string;
  paiement_wave?: string;
  paiement_orange?: string;
  reduc_3_mois?: string;
  reduc_6_mois?: string;
  reduc_12_mois?: string;
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const initialRef = params.ref?.trim().toUpperCase() || '';
  const initialRole = (params.role?.toLowerCase() as 'acheteur' | 'marchand' | 'apporteur') || 'acheteur';

  let initialSettings: PublicSettings = {
    plan_pro_prix: '5000',
    plan_business_prix: '10000',
    plan_pro_label: 'Boutique Pro',
    plan_business_label: 'Boutique Business',
    apporteur_taux_commission: '20',
    paiement_wave: 'true',
    paiement_orange: 'true',
  };

  try {
    const fetchedSettings = await apiFetch<PublicSettings>('/settings/public');
    if (fetchedSettings) {
      initialSettings = { ...initialSettings, ...fetchedSettings };
    }
  } catch (err) {
    // Fallback aux valeurs par défaut si l'API backend n'est pas encore disponible
  }

  return (
    <main style={{ background: 'var(--bg, #F8F5F0)', minHeight: '100vh', paddingBottom: '40px' }}>
      <DemoClient
        initialRef={initialRef}
        initialRole={initialRole}
        initialSettings={initialSettings}
      />
    </main>
  );
}
