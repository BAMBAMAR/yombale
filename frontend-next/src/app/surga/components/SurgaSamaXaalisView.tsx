'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import {
  getKalpeOperations,
  getKalpeDettes,
  getKalpeObjectifs,
  calculerSyntheseKalpe,
  type KalpeOperationLocal,
  type KalpeDetteLocal,
  type KalpeObjectifLocal,
  type KalpeSyntheseSurga,
} from '@/lib/surga-kalpe'
import SurgaKalpeJournalTab from './SurgaKalpeJournalTab'
import SurgaKalpeDettesTab from './SurgaKalpeDettesTab'
import SurgaKalpeEpargneTab from './SurgaKalpeEpargneTab'
import SurgaKalpeSaisieModal, { type SaisieMode } from './SurgaKalpeSaisieModal'
import SurgaCalculatorModal from './SurgaCalculatorModal'
import SurgaKalpeQuickActions from './SurgaKalpeQuickActions'

export default function SurgaSamaXaalisView() {
  const [moisSelectionne, setMoisSelectionne] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  )
  const [activeSubTab, setActiveSubTab] = useState<'apercu' | 'journal' | 'dettes' | 'epargne'>('apercu')
  const [operations, setOperations] = useState<KalpeOperationLocal[]>([])
  const [dettes, setDettes] = useState<KalpeDetteLocal[]>([])
  const [objectifs, setObjectifs] = useState<KalpeObjectifLocal[]>([])
  const [synthese, setSynthese] = useState<KalpeSyntheseSurga | null>(null)

  // Modales
  const [isSaisieOpen, setIsSaisieOpen] = useState(false)
  const [saisieMode, setSaisieMode] = useState<SaisieMode>('depense')
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const rechargerDonnees = () => {
    const ops = getKalpeOperations()
    const det = getKalpeDettes()
    const obj = getKalpeObjectifs()
    setOperations(ops)
    setDettes(det)
    setObjectifs(obj)
    setSynthese(calculerSyntheseKalpe(moisSelectionne))
  }

  useEffect(() => {
    rechargerDonnees()
  }, [moisSelectionne])

  const changerMois = (direction: 'prec' | 'suiv') => {
    const [annee, m] = moisSelectionne.split('-').map(Number)
    const d = new Date(annee, m - 1 + (direction === 'prec' ? -1 : 1), 1)
    setMoisSelectionne(d.toISOString().slice(0, 7))
  }

  const libelleMois = useMemo(() => {
    try {
      const [annee, m] = moisSelectionne.split('-').map(Number)
      const d = new Date(annee, m - 1, 1)
      const nom = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      return nom.charAt(0).toUpperCase() + nom.slice(1)
    } catch {
      return moisSelectionne
    }
  }, [moisSelectionne])

  const handleOuvrirSaisie = (mode: SaisieMode) => {
    setSaisieMode(mode)
    setIsSaisieOpen(true)
  }

  const handleSuccessSaisie = (msg: string) => {
    rechargerDonnees()
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 100000,
            backgroundColor: 'var(--surga-primary, #0F172A)',
            color: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={16} color="var(--surga-emerald, #059669)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barre Période & Outils */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => changerMois('prec')}
            aria-label="Mois précédent"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--surga-border, #E2E8F0)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              minHeight: 34,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>
            {libelleMois}
          </span>
          <button
            type="button"
            onClick={() => changerMois('suiv')}
            aria-label="Mois suivant"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--surga-border, #E2E8F0)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              minHeight: 34,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCalcOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--surga-primary, #0F172A)',
            cursor: 'pointer',
            minHeight: 34,
          }}
        >
          <Calculator size={15} color="var(--surga-accent, #D97706)" />
          <span>Calculatrice</span>
        </button>
      </div>

      {/* Cartes de Situation Financière (Sama Xaalis) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {/* Solde Disponible */}
        <div
          style={{
            gridColumn: '1 / -1',
            padding: '16px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Solde Kalpé Disponible
            </span>
            <Wallet size={18} color="var(--surga-accent-glow, #F59E0B)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>
            {(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Total épargne cumulée : {(synthese?.total_epargne || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        {/* Entrées du mois */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <ArrowDownLeft size={14} color="var(--surga-emerald, #059669)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-emerald, #059669)' }}>
              Entrées du mois
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--surga-text1, #0F172A)' }}>
            +{(synthese?.total_entrees_mois || 0).toLocaleString('fr-FR')} F
          </div>
        </div>

        {/* Dépenses du mois */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <ArrowUpRight size={14} color="var(--surga-accent, #D97706)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-accent, #D97706)' }}>
              Dépenses du mois
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--surga-text1, #0F172A)' }}>
            -{(synthese?.total_depenses_mois || 0).toLocaleString('fr-FR')} F
          </div>
        </div>
      </div>

      {/* 4 Boutons d'Action Rapide (Composant modulaire) */}
      <SurgaKalpeQuickActions onOpenSaisie={handleOuvrirSaisie} />

      {/* Navigation des Sous-Onglets */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--surga-border, #E2E8F0)',
          marginBottom: 14,
        }}
      >
        {[
          { id: 'apercu', label: 'Aperçu' },
          { id: 'journal', label: `Journal (${operations.length})` },
          { id: 'dettes', label: `Dettes (${dettes.length})` },
          { id: 'epargne', label: `Épargne (${objectifs.length})` },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid var(--surga-accent, #D97706)' : '3px solid transparent',
                color: isActive ? 'var(--surga-primary, #0F172A)' : 'var(--surga-text3, #94A3B8)',
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center',
                minHeight: 38,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenu des Sous-Onglets */}
      {activeSubTab === 'apercu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Conseil / Alerte budgétaire */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
              border: '1px solid var(--surga-border, #E2E8F0)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <TrendingUp size={16} color="var(--surga-accent, #D97706)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--surga-text1, #0F172A)', lineHeight: 1.4 }}>
              <strong>Point Sama Xaalis :</strong> Votre solde net actuel est de{' '}
              <strong>{(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA</strong>. Pensez à relancer vos{' '}
              <strong>{(synthese?.total_a_recevoir || 0).toLocaleString('fr-FR')} FCFA</strong> de créances en attente.
            </div>
          </div>

          {/* 4 Dernières opérations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>
                Dernières Opérations
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('journal')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--surga-accent, #D97706)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                Voir tout le journal
              </button>
            </div>
            <SurgaKalpeJournalTab operations={operations.slice(0, 4)} onRefresh={rechargerDonnees} />
          </div>
        </div>
      )}

      {activeSubTab === 'journal' && (
        <SurgaKalpeJournalTab operations={operations} onRefresh={rechargerDonnees} />
      )}

      {activeSubTab === 'dettes' && (
        <SurgaKalpeDettesTab dettes={dettes} onRefresh={rechargerDonnees} />
      )}

      {activeSubTab === 'epargne' && (
        <SurgaKalpeEpargneTab
          objectifs={objectifs}
          onOpenAjout={() => handleOuvrirSaisie('epargne')}
          onRefresh={rechargerDonnees}
        />
      )}

      {/* Modale Saisie */}
      <SurgaKalpeSaisieModal
        isOpen={isSaisieOpen}
        initialMode={saisieMode}
        objectifsExistants={objectifs}
        onClose={() => setIsSaisieOpen(false)}
        onSuccess={handleSuccessSaisie}
      />

      {/* Modale Calculatrice */}
      <SurgaCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onInjectMontant={() => {
          setIsCalcOpen(false)
          handleOuvrirSaisie('depense')
        }}
      />
    </div>
  )
}
