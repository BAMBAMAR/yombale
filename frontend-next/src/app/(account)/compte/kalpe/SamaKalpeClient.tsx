'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  Receipt,
  Users,
  Target,
  BarChart2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import type {
  ContexteType,
  KalpeEtat,
  KalpeSynthese,
  KalpeObjectif,
  KalpeOperation,
  KalpeDette,
} from './types'
import {
  getKalpeEtat,
  getKalpeSynthese,
  getKalpeObjectifs,
  getKalpeOperations,
  getKalpeDettes,
  supprimerKalpeOperation,
  rembourserKalpeDette,
  creerKalpeObjectif,
} from './actions'
import KalpeHeader from './components/KalpeHeader'
import KalpeSituationCards from './components/KalpeSituationCards'
import KalpeQuickActions from './components/KalpeQuickActions'
import KalpeConseilsBanner from './components/KalpeConseilsBanner'
import KalpeOperationsJournal from './components/KalpeOperationsJournal'
import KalpeDettesSection from './components/KalpeDettesSection'
import KalpeEpargneSection from './components/KalpeEpargneSection'
import KalpeStatsSection from './components/KalpeStatsSection'
import { KalpeSaisieModal } from './components/KalpeSaisieModal'
import { KalpeActivationCard } from './components/KalpeActivationCard'
import { exporterOperationsCSV } from './exportOperationsCSV'
import { KalpeSubTabs } from './components/KalpeSubTabs'
import { KalpeModalRemboursement } from './components/KalpeModalRemboursement'
import { KalpeModalObjectif } from './components/KalpeModalObjectif'
import { useToast } from '@/context/ToastContext'

interface SamaKalpeClientProps {
  initialContexte?: ContexteType
  initialTab?: 'apercu' | 'journal' | 'dettes' | 'epargne' | 'stats'
}

export function SamaKalpeClient({
  initialContexte = 'all',
  initialTab = 'apercu',
}: SamaKalpeClientProps) {
  const { toast } = useToast()
  const [contexte, setContexte] = useState<ContexteType>(initialContexte)
  const [activeTab, setActiveTab] = useState<'apercu' | 'journal' | 'dettes' | 'epargne' | 'stats'>(initialTab)

  const [etat, setEtat] = useState<KalpeEtat | null>(null)
  const [synthese, setSynthese] = useState<KalpeSynthese | null>(null)
  const [objectifs, setObjectifs] = useState<KalpeObjectif[]>([])
  const [dettes, setDettes] = useState<KalpeDette[]>([])
  const [operations, setOperations] = useState<KalpeOperation[]>([])
  const [operationsTotal, setOperationsTotal] = useState(0)
  const [activeTypeFilter, setActiveTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Modale Saisie
  const [isSaisieOpen, setIsSaisieOpen] = useState(false)
  const [saisieMode, setSaisieMode] = useState<'revenu' | 'depense' | 'dette' | 'epargne' | 'vente_express'>('depense')
  const [saisieDetteSens, setSaisieDetteSens] = useState<'a_recevoir' | 'a_payer'>('a_recevoir')
  const [autoStartVoice, setAutoStartVoice] = useState(false)

  // Modale Remboursement Dette Rapide
  const [detteToRembourser, setDetteToRembourser] = useState<KalpeDette | null>(null)
  const [montantRemboursement, setMontantRemboursement] = useState('')

  // Modale Création Nouvel Objectif Épargne
  const [showNewObjectifModal, setShowNewObjectifModal] = useState(false)
  const [nouvelObjTitre, setNouvelObjTitre] = useState('')
  const [nouvelObjCible, setNouvelObjCible] = useState('')

  const chargerDonnees = useCallback(async () => {
    // 1. Initialisation instantanée depuis l'instantané hors-ligne
    const cachedStr = typeof window !== 'undefined' ? localStorage.getItem('nopalou_offline_kalpe_snapshot') : null
    let hasSnapshot = false
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr)
        if (cached.etat) setEtat(cached.etat)
        if (cached.synthese) setSynthese(cached.synthese)
        if (Array.isArray(cached.objectifs)) setObjectifs(cached.objectifs)
        if (Array.isArray(cached.dettes)) setDettes(cached.dettes)
        if (Array.isArray(cached.operations)) {
          setOperations(cached.operations)
          setOperationsTotal(cached.operationsTotal || cached.operations.length)
        }
        hasSnapshot = true
        setLoading(false)
      } catch (_) {}
    }

    if (!hasSnapshot) setLoading(true)

    try {
      const [resEtat, resSynthese, resObjectifs, resDettes, resOps] = await Promise.all([
        getKalpeEtat(),
        getKalpeSynthese(contexte),
        getKalpeObjectifs(),
        getKalpeDettes({ contexte }),
        getKalpeOperations({
          contexte,
          type: activeTypeFilter || undefined,
          q: searchQuery || undefined,
          limit: 30,
        }),
      ])
      setEtat(resEtat)
      setSynthese(resSynthese)
      setObjectifs(resObjectifs)
      setDettes(resDettes)
      setOperations(resOps.operations)
      setOperationsTotal(resOps.total)

      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_offline_kalpe_snapshot', JSON.stringify({
          etat: resEtat,
          synthese: resSynthese,
          objectifs: resObjectifs,
          dettes: resDettes,
          operations: resOps.operations,
          operationsTotal: resOps.total,
        }))
      }
    } catch (err) {
      console.warn('Erreur chargement Sama Xaalis (mode hors-ligne):', err)
      if (!hasSnapshot) {
        toast.error('Mode hors-ligne : données du kalpé indisponibles')
      }
    } finally {
      setLoading(false)
    }
  }, [contexte, activeTypeFilter, searchQuery, toast])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  const handleOpenSaisie = (
    mode: 'revenu' | 'depense' | 'dette' | 'epargne' | 'vente_express',
    detteSens?: 'a_recevoir' | 'a_payer',
    startVoice?: boolean
  ) => {
    setSaisieMode(mode)
    if (detteSens) setSaisieDetteSens(detteSens)
    setAutoStartVoice(Boolean(startVoice))
    setIsSaisieOpen(true)
  }

  // Écoute des actions contextuelles déclenchées depuis le bouton FAB central (+) du compte
  useEffect(() => {
    const handleContextualAction = (e: Event) => {
      const custom = e as CustomEvent<{ action: string; sens?: 'a_recevoir' | 'a_payer' }>
      const act = custom.detail?.action
      if (!act) return

      if (act === 'dicter') {
        handleOpenSaisie('depense', undefined, true)
      } else if (act === 'nouvel_objectif') {
        setShowNewObjectifModal(true)
      } else if (act === 'creance') {
        handleOpenSaisie('dette', 'a_recevoir')
      } else if (act === 'dette') {
        handleOpenSaisie('dette', 'a_payer')
      } else if (act === 'depense' || act === 'revenu' || act === 'vente_express' || act === 'epargne') {
        handleOpenSaisie(act)
      }
    }

    window.addEventListener('sama-xaalis:action', handleContextualAction)
    return () => window.removeEventListener('sama-xaalis:action', handleContextualAction)
  }, [])

  const handleDeleteOperation = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cette opération ?')) return
    const res = await supprimerKalpeOperation(id)
    if (res.success) {
      toast.success('Opération supprimée')
      chargerDonnees()
    } else {
      toast.error(res.error || 'Impossible de supprimer')
    }
  }

  const handleValiderRemboursement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detteToRembourser) return
    const m = parseInt(montantRemboursement, 10)
    if (!m || m <= 0) {
      toast.error('Montant invalide')
      return
    }
    const res = await rembourserKalpeDette(detteToRembourser.id, { montant: m })
    if (res.success) {
      toast.success(res.message || 'Remboursement enregistré !')
      setDetteToRembourser(null)
      setMontantRemboursement('')
      chargerDonnees()
    } else {
      toast.error(res.error || 'Erreur lors du règlement')
    }
  }

  const handleCreerObjectif = async (e: React.FormEvent) => {
    e.preventDefault()
    const cible = parseInt(nouvelObjCible, 10)
    if (!nouvelObjTitre.trim() || !cible || cible <= 0) {
      toast.error('Veuillez remplir un titre et un montant cible valide')
      return
    }
    const res = await creerKalpeObjectif({
      titre: nouvelObjTitre.trim(),
      montant_cible: cible,
    })
    if (res.success) {
      toast.success('Objectif créé avec succès !')
      setShowNewObjectifModal(false)
      setNouvelObjTitre('')
      setNouvelObjCible('')
      chargerDonnees()
    } else {
      toast.error(res.error || 'Erreur création objectif')
    }
  }

  const handleExportCSV = () => exporterOperationsCSV(contexte, toast)

  return (
    <div style={{ width: '100%', minWidth: 0, paddingBottom: '70px', boxSizing: 'border-box' }}>
      {/* Header */}
      <KalpeHeader
        contexte={contexte}
        onSelectContexte={setContexte}
        hasBoutique={Boolean(etat?.hasBoutique)}
        onToggleVoice={() => handleOpenSaisie('depense', undefined, true)}
        onExportCSV={handleExportCSV}
      />

      {/* Activation card if not active */}
      {etat && !etat.actif && <KalpeActivationCard onActivated={chargerDonnees} />}

      <KalpeSubTabs activeTab={activeTab} setActiveTab={setActiveTab} synthese={synthese} />

      {/* Tab Content */}
      {activeTab === 'apercu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Situation Cards */}
          <KalpeSituationCards synthese={synthese} loading={loading} />

          {/* Quick Actions 1-Tap */}
          <KalpeQuickActions
            onOpenSaisie={handleOpenSaisie}
            hasBoutique={Boolean(etat?.hasBoutique)}
          />

          {/* Conseils Factual Banner */}
          {synthese && synthese.conseils && <KalpeConseilsBanner conseils={synthese.conseils} />}

          {/* Mini Journal Récent */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E8DDD2',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                Dernières opérations
              </h3>
              <button
                onClick={() => setActiveTab('journal')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#C75B00',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                Voir tout le journal <ArrowRight size={13} />
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#888' }}>
                Chargement...
              </div>
            ) : !synthese?.operations_recentes || synthese.operations_recentes.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                Aucune opération enregistrée pour le moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {synthese.operations_recentes.slice(0, 5).map((op) => (
                  <div
                    key={op.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#F8F5F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: op.direction === 'entree' ? '#E9F6ED' : '#FFF3EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {op.direction === 'entree' ? (
                          <TrendingUp size={14} color="#0A5C36" />
                        ) : (
                          <TrendingDown size={14} color="#C75B00" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C2B4A' }}>
                          {op.libelle}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {new Date(op.date_operation).toLocaleDateString('fr-FR')} · {op.categorie} ·{' '}
                          <span style={{ fontWeight: 600 }}>{op.contexte}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: op.direction === 'entree' ? '#0A5C36' : '#1C2B4A',
                      }}
                    >
                      {op.direction === 'entree' ? '+' : '-'}
                      {op.montant.toLocaleString('fr-FR')} F
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <KalpeOperationsJournal
          operations={operations}
          total={operationsTotal}
          loading={loading}
          onDeleteOperation={handleDeleteOperation}
          onFilterType={(t) => setActiveTypeFilter(t)}
          activeTypeFilter={activeTypeFilter}
          onSearch={(q) => setSearchQuery(q)}
        />
      )}

      {activeTab === 'dettes' && (
        <KalpeDettesSection
          dettes={dettes}
          loading={loading}
          onAddDette={() => handleOpenSaisie('dette')}
          onRembourser={(d) => {
            setDetteToRembourser(d)
            setMontantRemboursement(String(d.montant_restant))
          }}
        />
      )}

      {activeTab === 'epargne' && (
        <KalpeEpargneSection
          objectifs={objectifs}
          loading={loading}
          onAddObjectif={() => setShowNewObjectifModal(true)}
          onVerserObjectif={() => handleOpenSaisie('epargne')}
        />
      )}

      {activeTab === 'stats' && (
        <KalpeStatsSection
          initialContexte={contexte}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Saisie Modal */}
      <KalpeSaisieModal
        isOpen={isSaisieOpen}
        initialMode={saisieMode}
        initialContexte={contexte === 'activite' ? 'activite' : 'personnel'}
        initialDetteSens={saisieDetteSens}
        autoStartVoice={autoStartVoice}
        objectifs={objectifs}
        onClose={() => setIsSaisieOpen(false)}
        onSuccess={chargerDonnees}
      />

      <KalpeModalRemboursement detteToRembourser={detteToRembourser} montantRemboursement={montantRemboursement} setMontantRemboursement={setMontantRemboursement} setDetteToRembourser={setDetteToRembourser} handleValiderRemboursement={handleValiderRemboursement} />

      <KalpeModalObjectif showNewObjectifModal={showNewObjectifModal} setShowNewObjectifModal={setShowNewObjectifModal} nouvelObjTitre={nouvelObjTitre} setNouvelObjTitre={setNouvelObjTitre} nouvelObjCible={nouvelObjCible} setNouvelObjCible={setNouvelObjCible} handleCreerObjectif={handleCreerObjectif} />
    </div>
  )
}
export default SamaKalpeClient