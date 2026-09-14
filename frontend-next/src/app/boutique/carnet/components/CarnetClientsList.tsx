'use client'

import React from 'react'
import { Mic, Plus, Search } from 'lucide-react'
import type { ClientCredit } from '../types'
import CarnetClientCardItem from './CarnetClientCardItem'

interface CarnetClientsListProps {
  isMobile: boolean
  clients: ClientCredit[]
  clientsFiltres: ClientCredit[]
  clientSelectionne: ClientCredit | null
  loading: boolean
  recherche: string
  setRecherche: (q: string) => void
  filtreStatus: 'tous' | 'retard' | 'credits'
  setFiltreStatus: (f: 'tous' | 'retard' | 'credits') => void
  menuOuvertClientId: string | null
  setMenuOuvertClientId: (id: string | null) => void
  isListeningVoice: boolean
  voiceFeedback: string | null
  nbClientsDebiteurs: number
  t: (key: string) => string
  onDemarrerEcouteVocale: () => void
  onOuvrirModalNouveauClient: () => void
  onOuvrirFicheClient: (c: ClientCredit) => void
  onOuvrirModalEditClient: (c: ClientCredit) => void
  onOuvrirModalTransaction: (type: 'vente_credit' | 'remboursement', c: ClientCredit) => void
  onRelancerWhatsApp: (c: ClientCredit) => void
  onChangerStatutClient: (c: ClientCredit, statut: 'actif' | 'bloque' | 'archive') => void
  onSupprimerClient: (c: ClientCredit) => void
}

export default function CarnetClientsList({
  isMobile,
  clients,
  clientsFiltres,
  clientSelectionne,
  loading,
  recherche,
  setRecherche,
  filtreStatus,
  setFiltreStatus,
  menuOuvertClientId,
  setMenuOuvertClientId,
  isListeningVoice,
  voiceFeedback,
  nbClientsDebiteurs,
  t,
  onDemarrerEcouteVocale,
  onOuvrirModalNouveauClient,
  onOuvrirFicheClient,
  onOuvrirModalEditClient,
  onOuvrirModalTransaction,
  onRelancerWhatsApp,
  onChangerStatutClient,
  onSupprimerClient,
}: CarnetClientsListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Barre de Recherche & Filtres */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: '1 1 240px',
            minWidth: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                minHeight: 42,
              }}
            />
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <button
            type="button"
            onClick={onDemarrerEcouteVocale}
            title={
              isListeningVoice
                ? "Arrêter l'écoute"
                : "Recherche ou dette vocale (ex: 'Dette Moussa 10 000', 'Bor Fatou 5000')"
            }
            style={{
              height: 42,
              padding: '0 14px',
              borderRadius: 12,
              border: isListeningVoice ? '2px solid #ea580c' : '1px solid #cbd5e1',
              background: isListeningVoice ? '#fff7ed' : '#ffffff',
              color: isListeningVoice ? '#ea580c' : '#475569',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isListeningVoice ? '0 0 0 3px rgba(234, 88, 12, 0.25)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Mic size={16} />
            <span>{isListeningVoice ? 'Écoute…' : 'Vocal'}</span>
          </button>
        </div>

        {voiceFeedback && (
          <div
            style={{
              width: '100%',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '6px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            {voiceFeedback}
          </div>
        )}

        <div
          className="horizontal-scroll-fade"
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            maxWidth: '100%',
            paddingBottom: 2,
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            alignItems: 'center',
          }}
        >
          {[
            { id: 'tous', label: `Tous (${clients.length})` },
            { id: 'retard', label: `Doivent la boutique (${nbClientsDebiteurs})` },
            { id: 'credits', label: `En avance (${clients.filter((c) => Number(c.solde) < 0).length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltreStatus(f.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: filtreStatus === f.id ? '2px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #e2e8f0)',
                background: filtreStatus === f.id ? 'var(--navy, #1C2B4A)' : 'var(--card, #ffffff)',
                color: filtreStatus === f.id ? '#ffffff' : 'var(--text2, #64748b)',
                fontSize: 12.5,
                fontWeight: 750,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 34,
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des cartes clients */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 14 }}>
          {t('common.loading')}
        </div>
      ) : clientsFiltres.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 16px',
            background: '#ffffff',
            borderRadius: 16,
            border: '2px dashed #cbd5e1',
            color: '#64748b',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{t('shop.noCustomersFound')}</p>
          <p style={{ margin: '4px 0 14px', fontSize: 12.5, color: '#94a3b8' }}>
            {t('shop.addFirstCustomerPrompt')}
          </p>
          <button
            type="button"
            onClick={onOuvrirModalNouveauClient}
            style={{
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={14} />
            <span>{t('shop.createCustomerShortBtn')}</span>
          </button>
        </div>
      ) : (
        clientsFiltres.map((c) => (
          <CarnetClientCardItem
            key={c.id}
            client={c}
            isMobile={isMobile}
            isActif={clientSelectionne?.id === c.id}
            isMenuOpen={menuOuvertClientId === c.id}
            t={t}
            onToggleMenu={() => setMenuOuvertClientId(menuOuvertClientId === c.id ? null : c.id)}
            onCloseMenu={() => setMenuOuvertClientId(null)}
            onOuvrirFicheClient={onOuvrirFicheClient}
            onOuvrirModalEditClient={onOuvrirModalEditClient}
            onOuvrirModalTransaction={onOuvrirModalTransaction}
            onRelancerWhatsApp={onRelancerWhatsApp}
            onChangerStatutClient={onChangerStatutClient}
            onSupprimerClient={onSupprimerClient}
          />
        ))
      )}
    </div>
  )
}
