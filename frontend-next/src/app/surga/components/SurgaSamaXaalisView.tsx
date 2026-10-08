'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp } from 'lucide-react'
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
import {
  isXaalisMasque,
  toggleXaalisMasque,
  hasXaalisPin,
  isXaalisVerrouille,
  verrouillerXaalisSession,
} from '@/lib/surga-xaalis-security'
import { reprendreMontantCalcule } from '@/lib/surga-calculator'
import SurgaKalpeJournalTab from './SurgaKalpeJournalTab'
import SurgaKalpeDettesTab from './SurgaKalpeDettesTab'
import SurgaKalpeEpargneTab from './SurgaKalpeEpargneTab'
import SurgaKalpeSaisieModal, { type SaisieMode } from './SurgaKalpeSaisieModal'
import SurgaCalculatorModal from './SurgaCalculatorModal'
import SurgaKalpeQuickActions from './SurgaKalpeQuickActions'
import SurgaXaalisPinModal, { type PinModalMode } from './SurgaXaalisPinModal'
import SurgaXaalisLockedScreen from './SurgaXaalisLockedScreen'
import SurgaXaalisSummaryCards from './SurgaXaalisSummaryCards'
import SurgaXaalisHeaderBar from './SurgaXaalisHeaderBar'

export default function SurgaSamaXaalisView() {
  const [moisSelectionne, setMoisSelectionne] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  )
  const [activeSubTab, setActiveSubTab] = useState<'apercu' | 'journal' | 'dettes' | 'epargne'>('apercu')
  const [operations, setOperations] = useState<KalpeOperationLocal[]>([])
  const [dettes, setDettes] = useState<KalpeDetteLocal[]>([])
  const [objectifs, setObjectifs] = useState<KalpeObjectifLocal[]>([])
  const [synthese, setSynthese] = useState<KalpeSyntheseSurga | null>(null)

  // Confidentialité & Sécurité par Code PIN
  const [masque, setMasque] = useState(false)
  const [protegeParPin, setProtegeParPin] = useState(false)
  const [verrouille, setVerrouille] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('unlock')

  // Modales
  const [isSaisieOpen, setIsSaisieOpen] = useState(false)
  const [saisieMode, setSaisieMode] = useState<SaisieMode>('depense')
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [montantCalcule, setMontantCalcule] = useState<number | null>(null)
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

  const synchroniserSecurite = useCallback(() => {
    setMasque(isXaalisMasque())
    setProtegeParPin(hasXaalisPin())
    setVerrouille(isXaalisVerrouille())
  }, [])

  useEffect(() => {
    rechargerDonnees()
    synchroniserSecurite()
    const handleSecuriteChange = () => {
      synchroniserSecurite()
      rechargerDonnees()
    }
    window.addEventListener('surga-xaalis-privacy-change', handleSecuriteChange)
    return () => window.removeEventListener('surga-xaalis-privacy-change', handleSecuriteChange)
  }, [moisSelectionne, synchroniserSecurite])

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

  // SRG-A2-007 : un montant calculé ailleurs dans Surga (« Utiliser ») ouvre la saisie d'une dépense déjà remplie.
  useEffect(() => {
    if (verrouille) return
    const repris = reprendreMontantCalcule()
    if (repris) { setMontantCalcule(repris); setSaisieMode('depense'); setIsSaisieOpen(true) }
  }, [verrouille])

  const handleSuccessSaisie = (msg: string) => {
    rechargerDonnees()
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  const handleActionPin = () => {
    if (protegeParPin) {
      if (!verrouille) {
        verrouillerXaalisSession()
        setNotification('Sama Xaalis reverrouillé avec succès.')
        setTimeout(() => setNotification(null), 3000)
      } else {
        setPinModalMode('unlock')
        setPinModalOpen(true)
      }
    } else {
      setPinModalMode('setup')
      setPinModalOpen(true)
    }
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
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          {notification}
        </div>
      )}

      {/* Barre d'Outils Haut */}
      <SurgaXaalisHeaderBar
        libelleMois={libelleMois}
        masque={masque}
        protegeParPin={protegeParPin}
        verrouille={verrouille}
        onChangerMois={changerMois}
        onToggleMasque={() => toggleXaalisMasque()}
        onActionPin={handleActionPin}
        onOpenCalc={() => setIsCalcOpen(true)}
      />

      {/* Écran Protecteur si Sama Xaalis est Verrouillé */}
      {verrouille ? (
        <SurgaXaalisLockedScreen
          onUnlock={() => {
            setPinModalMode('unlock')
            setPinModalOpen(true)
          }}
        />
      ) : (
        <>
          {/* Cartes de Situation Financière avec Masquage Confidentiel */}
          <SurgaXaalisSummaryCards synthese={synthese} masque={masque} />

          {/* 4 Boutons d'Action Rapide */}
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
                    borderBottom: isActive ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
                    color: isActive ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
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
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(28, 43, 74, 0.04)',
                  border: '1px solid var(--surga-border, #E2E8F0)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <TrendingUp size={16} color="var(--accent, #C75B00)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', lineHeight: 1.4 }}>
                  <strong>Point Sama Xaalis :</strong> Votre solde net actuel est de{' '}
                  <strong>{masque ? '•••••• FCFA' : `${(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA`}</strong>. Pensez à relancer vos{' '}
                  <strong>{masque ? '•••••• FCFA' : `${(synthese?.total_a_recevoir || 0).toLocaleString('fr-FR')} FCFA`}</strong> de créances en attente.
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
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
                      color: 'var(--surga-accent-ink, #A64B08)',
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
        </>
      )}

      {/* Modale Saisie */}
      <SurgaKalpeSaisieModal
        isOpen={isSaisieOpen}
        initialMode={saisieMode}
        objectifsExistants={objectifs}
        onClose={() => { setIsSaisieOpen(false); setMontantCalcule(null) }}
        onSuccess={handleSuccessSaisie}
        montantInitial={montantCalcule ?? undefined}
      />

      {/* Modale Calculatrice */}
      <SurgaCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onInjectMontant={(montant) => {
          setIsCalcOpen(false)
          setMontantCalcule(montant)
          handleOuvrirSaisie('depense')
        }}
      />

      {/* Modale Code PIN */}
      <SurgaXaalisPinModal
        isOpen={pinModalOpen}
        mode={pinModalMode}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => {
          setPinModalOpen(false)
          synchroniserSecurite()
          rechargerDonnees()
          if (pinModalMode === 'setup') {
            setNotification('Code PIN configuré avec succès ! Sama Xaalis est désormais sécurisé.')
          } else if (pinModalMode === 'unlock') {
            setNotification('Sama Xaalis déverrouillé.')
          } else if (pinModalMode === 'disable') {
            setNotification('Code PIN désactivé.')
          }
          setTimeout(() => setNotification(null), 3500)
        }}
      />
    </div>
  )
}
