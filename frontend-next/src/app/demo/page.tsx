import { Metadata } from 'next';
import DemoClient from './DemoClient';

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

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const initialRef = params.ref?.trim().toUpperCase() || '';
  const initialRole = (params.role?.toLowerCase() as 'acheteur' | 'marchand' | 'apporteur') || 'acheteur';
  const initialTab = params.tab?.toLowerCase() || 'features';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white font-sans pb-20">
      <DemoClient initialRef={initialRef} initialRole={initialRole} initialTab={initialTab} />
    </main>
  );
}
