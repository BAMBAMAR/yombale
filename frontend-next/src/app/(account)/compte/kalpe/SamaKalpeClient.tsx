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

  const handleExportCSV = async () => {
    try {
      const res = await getKalpeOperations({ limit: 1000, contexte })
      if (!res.operations || res.operations.length === 0) {
        toast.info('Aucune opération à exporter')
        return
      }

      const headers = ['Date', 'Type', 'Direction', 'Libellé', 'Catégorie', 'Montant (FCFA)', 'Tiers', 'Contexte']
      const rows = res.operations.map((op) => [
        new Date(op.date_operation).toLocaleDateString('fr-FR'),
        op.type,
        op.direction,
        `"${(op.libelle || '').replace(/"/g, '""')}"`,
        `"${(op.categorie || '').replace(/"/g, '""')}"`,
        op.montant,
        `"${(op.tiers_nom || '').replace(/"/g, '""')}"`,
        op.contexte,
      ])

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `sama_xaalis_export_${contexte}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Export CSV téléchargé avec succès')
    } catch {
      toast.error('Erreur lors de l’export CSV')
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto', paddingBottom: '70px' }}>
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

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8F5F0',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #E8DDD2',
          margin: '16px 0 20px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexWrap: 'nowrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('apercu')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'apercu' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'apercu' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <LayoutDashboard size={15} style={{ flexShrink: 0 }} />
          <span>Aperçu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'journal' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'journal' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <Receipt size={15} style={{ flexShrink: 0 }} />
          <span>Journal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dettes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'dettes' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'dettes' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={15} style={{ flexShrink: 0 }} />
          <span>Créances & Dettes</span>
          {synthese && synthese.nb_creances > 0 && (
            <span
              style={{
                background: activeTab === 'dettes' ? '#C75B00' : '#E8DDD2',
                color: activeTab === 'dettes' ? '#FFFFFF' : '#1C2B4A',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '999px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {synthese.nb_creances}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('epargne')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'epargne' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'epargne' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <Target size={15} style={{ flexShrink: 0 }} />
          <span>Épargne</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'stats' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'stats' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart2 size={15} style={{ flexShrink: 0 }} />
          <span>Statistiques</span>
        </button>
      </div>

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

      {/* Modale Remboursement Dette */}
      {detteToRembourser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(10, 20, 35, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setDetteToRembourser(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px 0' }}>
              Remboursement : {detteToRembourser.tiers_nom}
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px 0' }}>
              Reste à régler : <strong>{detteToRembourser.montant_restant.toLocaleString('fr-FR')} FCFA</strong>
            </p>
            <form onSubmit={handleValiderRemboursement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A' }}>Montant réglé (FCFA)</label>
              <input
                type="number"
                required
                value={montantRemboursement}
                onChange={(e) => setMontantRemboursement(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1.5px solid #E8DDD2',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 800,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setDetteToRembourser(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E8DDD2',
                    background: '#F8F5F0',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0A5C36',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Créer Objectif */}
      {showNewObjectifModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(10, 20, 35, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowNewObjectifModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1C2B4A', margin: '0 0 12px 0' }}>
              Nouvel Objectif d'Épargne
            </h3>
            <form onSubmit={handleCreerObjectif} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                  Nom du projet / de la cagnotte *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tabaski, Achat Scooter, Réserve urgence"
                  value={nouvelObjTitre}
                  onChange={(e) => setNouvelObjTitre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8DDD2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                  Montant visé (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 250000"
                  value={nouvelObjCible}
                  onChange={(e) => setNouvelObjCible(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8DDD2',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 800,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewObjectifModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E8DDD2',
                    background: '#F8F5F0',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#C75B00',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Créer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default SamaKalpeClient
