'use client'

import React, { useState, useEffect } from 'react'
import { useScrollNudge } from '@/hooks/useScrollNudge'
import { useTranslation } from '@/i18n/context'
import ComptaBilanView from './components/ComptaBilanView'
import ComptaZonesView from './comptabilite/components/ComptaZonesView'
import { ComptaStockView } from './comptabilite/components/ComptaStockView'
import { ComptaSaisieExpressView } from './comptabilite/components/ComptaSaisieExpressView'
import { ComptaRapportsZView } from './comptabilite/components/ComptaRapportsZView'
import ComptaInventaireView from './comptabilite/components/ComptaInventaireView'
import ComptaPerformancesCaissiersView from './comptabilite/components/ComptaPerformancesCaissiersView'
import { ComptaVentesView } from './comptabilite/components/ComptaVentesView'
import { ComptaDepensesView } from './comptabilite/components/ComptaDepensesView'

// Re-exports for full backward compatibility
export { default as ZonesView } from './comptabilite/components/ComptaZonesView'
export { ComptaStockView as StockView } from './comptabilite/components/ComptaStockView'
export { ComptaSaisieExpressView as SaisieExpressView } from './comptabilite/components/ComptaSaisieExpressView'
export { ComptaRapportsZView as RapportsZView } from './comptabilite/components/ComptaRapportsZView'
export { default as InventaireView } from './comptabilite/components/ComptaInventaireView'
export { default as PerformancesCaissiersView } from './comptabilite/components/ComptaPerformancesCaissiersView'
export { ComptaVentesView as VentesView } from './comptabilite/components/ComptaVentesView'
export { ComptaDepensesView as DepensesView } from './comptabilite/components/ComptaDepensesView'
export { default as BilanView } from './components/ComptaBilanView'

export type TabType = 'bilan' | 'sessions' | 'inventaire' | 'caissiers' | 'express' | 'ventes' | 'depenses' | 'zones'

interface ComptabiliteProps {
  boutiqueId: string
  boutiqueNom?: string
  initialTab?: 'dashboard' | 'bilan' | 'sessions' | 'inventaire' | 'caissiers' | 'express' | 'ventes' | 'depenses' | 'zones'
}

export default function Comptabilite({
  boutiqueId,
  boutiqueNom = 'Ma Boutique',
  initialTab = 'bilan'
}: ComptabiliteProps) {
  const resolvedTab = (initialTab === 'dashboard' ? 'bilan' : initialTab) as TabType
  const [tab, setTab] = useState<TabType>(resolvedTab)
  const { scrollRef: comptaTabRef, scrollToCenter: scrollComptaToCenter } = useScrollNudge()
  const { t } = useTranslation()

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab === 'dashboard' ? 'bilan' : (initialTab as TabType))
    }
  }, [initialTab])

  const tabBtn = (tId: typeof tab, label: string) => (
    <button
      key={tId}
      type="button"
      onClick={(e) => {
        setTab(tId)
        scrollComptaToCenter(e.currentTarget)
      }}
      style={{
        padding: '10px 18px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: tab === tId ? 800 : 600,
        color: tab === tId ? '#C75B00' : '#64748b',
        borderBottom: tab === tId ? '3px solid #C75B00' : '3px solid transparent',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div
        ref={comptaTabRef}
        className="nopalou-scroll-tabs horizontal-scroll-fade"
        style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 20,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          gap: 4
        }}
      >
        {tabBtn('bilan', 'Bilan & Rentabilité')}
        {tabBtn('ventes', 'Journal des Ventes')}
        {tabBtn('depenses', 'Dépenses')}
        {tabBtn('sessions', 'Clôtures Caisse (Rapport Z)')}
        {(tab === 'inventaire' || tab === 'caissiers' || tab === 'zones') && (
          tabBtn(tab, tab === 'inventaire' ? 'Inventaire' : tab === 'caissiers' ? 'Caissiers' : 'Zones de Livraison')
        )}
      </div>

      {tab === 'bilan'      && <ComptaBilanView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'ventes'     && <ComptaVentesView boutiqueId={boutiqueId} />}
      {tab === 'depenses'   && <ComptaDepensesView boutiqueId={boutiqueId} />}
      {tab === 'sessions'   && <ComptaRapportsZView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'inventaire' && <ComptaInventaireView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'caissiers'  && <ComptaPerformancesCaissiersView boutiqueId={boutiqueId} boutiqueNom={boutiqueNom} />}
      {tab === 'express'    && <ComptaSaisieExpressView boutiqueId={boutiqueId} />}
      {tab === 'zones'      && <ComptaZonesView boutiqueId={boutiqueId} />}
    </div>
  )
}
