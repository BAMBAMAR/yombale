'use client';

// frontend-next/src/app/surga/components/SurgaDashboardTools.tsx
// Outils personnels du tableau de bord Surga (raccourcis Dépenses, Notes, Calculatrice, Agenda, Commande vocale)
// Modularité stricte < 450 lignes, zéro émoji, tokens CSS officiels

import React from 'react';
import {
  Wallet,
  FileText,
  Calculator,
  Calendar,
  Mic,
  ArrowRight,
} from 'lucide-react';
import type { SurgaTab } from './SurgaBottomNav';
import type { SurgaDepensesStats } from '@/lib/surga-offline-sync';
import { isXaalisMasque } from '@/lib/surga-xaalis-security';

interface SurgaDashboardToolsProps {
  soldeKalpeFormate?: string;
  statsApercu?: SurgaDepensesStats | null;
  nbNotes: number;
  nbAgenda: number;
  onNavigateTab: (tab: SurgaTab) => void;
  onOpenCalc: () => void;
  onOpenVoice: () => void;
  onReinitialiser?: () => void;
}

export default function SurgaDashboardTools({
  soldeKalpeFormate,
  statsApercu,
  nbNotes,
  nbAgenda,
  onNavigateTab,
  onOpenCalc,
  onOpenVoice,
  onReinitialiser,
}: SurgaDashboardToolsProps) {
  const [masque, setMasque] = React.useState(false);

  React.useEffect(() => {
    setMasque(isXaalisMasque());
    const handlePrivacy = () => setMasque(isXaalisMasque());
    window.addEventListener('surga-xaalis-privacy-change', handlePrivacy);
    return () => window.removeEventListener('surga-xaalis-privacy-change', handlePrivacy);
  }, []);
  return (
    <div style={{ margin: '20px 0 10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
          Vos outils personnels
        </h2>
        <button
          type="button"
          onClick={onOpenVoice}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--surga-accent-ink, #A64B08)',
            background: 'rgba(199, 91, 0, 0.08)',
            border: 'none',
            padding: '5px 10px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <Mic size={14} />
          <span>Commande vocale</span>
        </button>
      </div>

      {/* Item 1 : Dépenses du mois */}
      <div
        className="surga-item-row"
        onClick={() => onNavigateTab('depenses')}
        style={{ cursor: 'pointer', width: '100%' }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(10,92,54,0.1)',
            color: 'var(--price, #0A5C36)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Wallet size={18} />
        </div>
        <div className="surga-item-content">
          <div className="surga-item-line1">Sama Xaalis (Portefeuille)</div>
          <div className="surga-item-line2">
            <span className="surga-price-tag">
              {masque ? '•••••• FCFA' : (soldeKalpeFormate || statsApercu?.total_formate || '0 FCFA')}
            </span>
            <span>• Suivi entrées &amp; dépenses</span>
          </div>
        </div>
        <ArrowRight size={16} color="var(--text3, #73675E)" />
      </div>

      {/* Item 2 : Notes récentes */}
      <div
        className="surga-item-row"
        onClick={() => onNavigateTab('notes')}
        style={{ cursor: 'pointer', width: '100%' }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(28,43,74,0.08)',
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileText size={18} />
        </div>
        <div className="surga-item-content">
          <div className="surga-item-line1">Carnet de notes</div>
          <div className="surga-item-line2">
            <span>{nbNotes > 0 ? `${nbNotes} note${nbNotes > 1 ? 's' : ''} enregistrée${nbNotes > 1 ? 's' : ''}` : 'Prêt pour vos dictées ou saisies'}</span>
          </div>
        </div>
        <ArrowRight size={16} color="var(--text3, #73675E)" />
      </div>

      {/* Item 3 : Calculatrice déterministe */}
      <div
        className="surga-item-row"
        onClick={onOpenCalc}
        style={{ cursor: 'pointer', width: '100%' }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(199,91,0,0.08)',
            color: 'var(--surga-accent-ink, #A64B08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Calculator size={18} />
        </div>
        <div className="surga-item-content">
          <div className="surga-item-line1">Calculatrice exacte</div>
          <div className="surga-item-line2">
            <span>Moteur arithmétique déterministe local</span>
          </div>
        </div>
        <ArrowRight size={16} color="var(--text3, #73675E)" />
      </div>

      {/* Item 4 : Agenda & Rappels du jour */}
      <div
        className="surga-item-row"
        onClick={() => onNavigateTab('agenda')}
        style={{ cursor: 'pointer', width: '100%' }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(28,43,74,0.08)',
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Calendar size={18} />
        </div>
        <div className="surga-item-content">
          <div className="surga-item-line1">Agenda &amp; Rappels</div>
          <div className="surga-item-line2">
            <span>{nbAgenda > 0 ? `${nbAgenda} rappel${nbAgenda > 1 ? 's' : ''} prévu${nbAgenda > 1 ? 's' : ''} aujourd’hui` : 'Prévoyez vos rendez-vous'}</span>
          </div>
        </div>
        <ArrowRight size={16} color="var(--text3, #73675E)" />
      </div>
    </div>
  );
}
