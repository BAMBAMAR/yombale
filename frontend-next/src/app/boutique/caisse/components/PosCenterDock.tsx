'use client'

import React from 'react'
import PosNumpad from './PosNumpad'
import { Tag, Users, PauseCircle, Calculator } from 'lucide-react'

interface PosCenterDockProps {
  layoutColCentrale?: boolean
  remisePourcentage: number
  clientFidelite: any | null
  panierLength: number
  showNumpad?: boolean
  onOuvrirModalRemise?: () => void
  ouvrirModalRemise?: () => void
  onOpenModalFidelite?: () => void
  setModalFidelite?: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void)
  onMettrePanierEnAttente?: () => void
  mettrePanierEnAttente?: () => void
  onToggleNumpad?: () => void
  onAjouterParCodeBarre?: (code: string) => void
  onSearchOrAddBarcode?: (code: string) => void
  setModalCarnet?: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void)
}

export default function PosCenterDock({
  layoutColCentrale,
  remisePourcentage,
  clientFidelite,
  panierLength,
  showNumpad = true,
  onOuvrirModalRemise,
  ouvrirModalRemise,
  onOpenModalFidelite,
  setModalFidelite,
  onMettrePanierEnAttente,
  mettrePanierEnAttente,
  onToggleNumpad,
  onAjouterParCodeBarre,
  onSearchOrAddBarcode,
  setModalCarnet,
}: PosCenterDockProps) {
  const handleBarcode = onAjouterParCodeBarre || onSearchOrAddBarcode || (() => {})
  const handleRemise = onOuvrirModalRemise || ouvrirModalRemise || (() => {})
  const handleFidelite = onOpenModalFidelite || (() => setModalFidelite?.(true))
  const handleAttente = onMettrePanierEnAttente || mettrePanierEnAttente || (() => {})
  return (
    <div
      className="caisse-center-dock no-print"
      style={{
        padding: '12px 10px',
        background: 'var(--pos-surface)',
        borderRight: '1px solid var(--pos-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
        boxSizing: 'border-box',
        minWidth: 260,
        maxWidth: 300,
      }}
    >
      {/* Pavé Numérique Pro Docké */}
      <PosNumpad isDocked={true} onSearchOrAddBarcode={handleBarcode} />

      {/* Raccourcis et Actions Métier Rapides */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'var(--pos-text2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Raccourcis Opérations
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            type="button"
            onClick={handleRemise}
            style={{
              padding: '9px 6px',
              borderRadius: 8,
              border: '1px solid var(--pos-border)',
              background: remisePourcentage > 0 ? 'var(--pos-primary-bg)' : 'var(--pos-surface2)',
              color: remisePourcentage > 0 ? 'var(--pos-primary)' : 'var(--pos-text)',
              fontWeight: 800,
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              boxShadow: 'var(--pos-shadow)',
            }}
            title="Appliquer une remise commerciale (Superviseur)"
          >
            <Tag size={13} />
            <span>Remise</span>
          </button>

          <button
            type="button"
            onClick={handleFidelite}
            style={{
              padding: '9px 6px',
              borderRadius: 8,
              border: '1px solid var(--pos-border)',
              background: clientFidelite ? 'var(--pos-primary-bg)' : 'var(--pos-surface2)',
              color: clientFidelite ? 'var(--pos-primary)' : 'var(--pos-text)',
              fontWeight: 800,
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              boxShadow: 'var(--pos-shadow)',
            }}
            title="Identifier un client fidélité par numéro WhatsApp"
          >
            <Users size={13} />
            <span>Fidélité</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            type="button"
            onClick={handleAttente}
            disabled={panierLength === 0}
            style={{
              padding: '9px 6px',
              borderRadius: 8,
              border: '1px solid var(--pos-border)',
              background: 'var(--pos-surface2)',
              color: 'var(--pos-text)',
              fontWeight: 800,
              fontSize: 11.5,
              cursor: panierLength === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: panierLength === 0 ? 0.6 : 1,
              boxShadow: 'var(--pos-shadow)',
            }}
            title="Mettre ce panier en attente pour servir un autre client"
          >
            <PauseCircle size={13} />
            <span>En attente</span>
          </button>

          <button
            type="button"
            onClick={onToggleNumpad}
            style={{
              padding: '9px 6px',
              borderRadius: 8,
              border: '1px solid var(--pos-border)',
              background: showNumpad ? 'var(--pos-primary-bg)' : 'var(--pos-surface2)',
              color: showNumpad ? 'var(--pos-primary)' : 'var(--pos-text)',
              fontWeight: 800,
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              boxShadow: 'var(--pos-shadow)',
            }}
            title="Afficher/Masquer le pavé de calcul rapide"
          >
            <Calculator size={13} />
            <span>Calcul</span>
          </button>
        </div>
      </div>
    </div>
  )
}
