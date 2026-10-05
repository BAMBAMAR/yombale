'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  PiggyBank,
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
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={16} color="var(--price, #0A5C36)" />
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
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 6,
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {libelleMois}
          </span>
          <button
            type="button"
            onClick={() => changerMois('suiv')}
            aria-label="Mois suivant"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 6,
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
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
            padding: '6px 10px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
        >
          <Calculator size={14} color="var(--accent, #C75B00)" />
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
            padding: '14px 16px',
            borderRadius: 12,
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase' }}>
              Solde Kalpé Disponible
            </span>
            <Wallet size={18} color="var(--accent, #C75B00)" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>
            {(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
            Total épargne cumulée : {(synthese?.total_epargne || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        {/* Entrées du mois */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <ArrowDownLeft size={14} color="var(--price, #0A5C36)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--price, #0A5C36)' }}>
              Entrées du mois
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text1, #1A1612)' }}>
            +{(synthese?.total_entrees_mois || 0).toLocaleString('fr-FR')} F
          </div>
        </div>

        {/* Dépenses du mois */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <ArrowUpRight size={14} color="var(--accent, #C75B00)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)' }}>
              Dépenses du mois
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text1, #1A1612)' }}>
            -{(synthese?.total_depenses_mois || 0).toLocaleString('fr-FR')} F
          </div>
        </div>
      </div>

      {/* 4 Boutons d'Action Rapide */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => handleOuvrirSaisie('entree')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            gap: 4,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(10,92,54,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownLeft size={16} color="var(--price, #0A5C36)" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1, #1A1612)' }}>+ Entrée</span>
        </button>

        <button
          type="button"
          onClick={() => handleOuvrirSaisie('depense')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            gap: 4,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(28,43,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={16} color="var(--navy, #1C2B4A)" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1, #1A1612)' }}>- Dépense</span>
        </button>

        <button
          type="button"
          onClick={() => handleOuvrirSaisie('dette')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            gap: 4,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(199,91,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={16} color="var(--accent, #C75B00)" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1, #1A1612)' }}>Dette</span>
        </button>

        <button
          type="button"
          onClick={() => handleOuvrirSaisie('epargne')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            gap: 4,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PiggyBank size={16} color="#2563EB" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text1, #1A1612)' }}>Épargne</span>
        </button>
      </div>

      {/* Navigation des Sous-Onglets */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #E8DDD2)',
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
                padding: '8px 4px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
                color: isActive ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center',
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
              backgroundColor: 'rgba(28,43,74,0.04)',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <TrendingUp size={16} color="var(--accent, #C75B00)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: 'var(--text1, #1A1612)', lineHeight: 1.4 }}>
              <strong>Point Sama Xaalis :</strong> Votre solde net actuel est de{' '}
              <strong>{(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA</strong>. Pensez à relancer vos{' '}
              <strong>{(synthese?.total_a_recevoir || 0).toLocaleString('fr-FR')} FCFA</strong> de créances en attente.
            </div>
          </div>

          {/* 4 Dernières opérations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Dernières Opérations
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('journal')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent, #C75B00)',
                  cursor: 'pointer',
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
        onInjectMontant={(val) => {
          setIsCalcOpen(false)
          handleOuvrirSaisie('depense')
        }}
      />
    </div>
  )
}
