'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Download, Trash2, CheckCheck, MessageCircle, CreditCard, Zap } from 'lucide-react'
import CreditsHeader from './components/CreditsHeader'
import { ParametresEchelonnementImmo } from './components/ParametresEchelonnementImmo'
import { ModalCreerCredit } from './components/ModalCreerCredit'
import { ModalNouveauCreditWave } from './components/ModalNouveauCreditWave'
import { CreditCardItem, CreditItem } from './components/CreditCardItem'
import { AgenceTableToolbar, SortOption } from '../../components/AgenceTableToolbar'
import { AgenceBatchActionBar, BatchActionItem } from '../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface BienOption {
  id: string
  titre: string
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'solde_desc', label: 'Solde restant (élevé)' },
  { value: 'solde_asc', label: 'Solde restant (faible)' },
  { value: 'total_desc', label: 'Montant total (élevé)' },
  { value: 'nom_asc', label: 'Bénéficiaire (A - Z)' },
]

export default function AgenceCreditsPage() {

  const params = useParams()
  const slug = params?.slug as string

  const [activeTab, setActiveTab] = useState<'plans' | 'parametres'>('plans')
  const [credits, setCredits] = useState<CreditItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)

  // Modales
  const [showModalSimple, setShowModalSimple] = useState(false)
  const [showModalWave, setShowModalWave] = useState(false)

  // Filtres, Recherche, Tri
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterType, setFilterType] = useState('tous')
  const [currentSort, setCurrentSort] = useState('solde_desc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sélection & Actions par Lot
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExecutingBatch, setIsExecutingBatch] = useState(false)

  // En cours
  const [encaissementId, setEncaissementId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resCredits, resBiens] = await Promise.all([
        fetch(`/api/credits-immo/agence/${slug}`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
      ])
      const dataC = await resCredits.json()
      const dataB = await resBiens.json()

      if (dataC.success) setCredits(dataC.credits || [])
      if (dataB.success) setBiens(dataB.biens || [])
    } catch (err) {
      console.error('[LOAD_CREDITS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleEncaisserEcheance(creditId: string, numeroEcheance: number, montant: number) {
    try {
      setEncaissementId(`${creditId}-${numeroEcheance}`)
      const res = await fetch(`/api/credits-immo/agence/${slug}/${creditId}/encaisser-echeance`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          numero_echeance: numeroEcheance,
          mode_paiement: 'wave',
          montant,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setToastMsg(`Échéance #${numeroEcheance} encaissée avec succès !`)
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      } else {
        alert(data.error || 'Erreur lors de l\'encaissement')
      }
    } catch (err) {
      console.error('[ENCAISSER_ERR]', err)
    } finally {
      setEncaissementId(null)
    }
  }

  // Filtrage et Tri
  const creditsFiltres = useMemo(() => {
    let result = [...credits]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        c =>
          c.beneficiaire_nom.toLowerCase().includes(q) ||
          (c.beneficiaire_tel && c.beneficiaire_tel.includes(q)) ||
          (c.bien_titre && c.bien_titre.toLowerCase().includes(q))
      )
    }

    if (filterStatut !== 'tous') {
      result = result.filter(c => c.statut === filterStatut)
    }

    if (filterType !== 'tous') {
      result = result.filter(c => c.type_credit === filterType)
    }

    // Tri
    result.sort((a, b) => {
      let cmp = 0
      if (currentSort.startsWith('solde')) {
        cmp = Number(b.solde_restant || 0) - Number(a.solde_restant || 0)
        if (currentSort === 'solde_asc' || sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('total')) {
        cmp = Number(b.montant_total || 0) - Number(a.montant_total || 0)
        if (sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('nom')) {
        cmp = a.beneficiaire_nom.localeCompare(b.beneficiaire_nom)
        if (sortDirection === 'desc') cmp = -cmp
      }
      return cmp
    })

    return result
  }, [credits, searchTerm, filterStatut, filterType, currentSort, sortDirection])

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  function handleSelectAll() {
    if (selectedIds.length === creditsFiltres.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(creditsFiltres.map(c => c.id))
    }
  }

  // Actions Batch
  async function handleBatchSolder() {
    if (!confirm(`Confirmez-vous le solde de ${selectedIds.length} plan(s) de financement ?`)) return
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/credits-immo/agence/${slug}/batch`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'solder', creditIds: selectedIds }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Plans marqués comme soldés.')
        setSelectedIds([])
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  async function handleBatchSupprimer() {
    if (!confirm(`Attention : supprimer définitivement ces ${selectedIds.length} plan(s) de financement ?`)) return
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/credits-immo/agence/${slug}/batch`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'supprimer', creditIds: selectedIds }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Plans supprimés.')
        setSelectedIds([])
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  function handleBatchExportCsv() {
    const itemsToExport = selectedIds.length > 0
      ? credits.filter(c => selectedIds.includes(c.id))
      : creditsFiltres

    exportDataToCsv('credits-plans-financement', [
      { header: 'Bénéficiaire', key: 'beneficiaire_nom' },
      { header: 'Téléphone', key: 'beneficiaire_tel' },
      { header: 'Bien Rattaché', key: 'bien_titre' },
      { header: 'Type Opération', key: 'type_credit' },
      { header: 'Montant Total FCFA', key: 'montant_total' },
      { header: 'Apport Initial FCFA', key: 'apport_initial' },
      { header: 'Solde Restant FCFA', key: 'solde_restant' },
      { header: 'Nb Échéances', key: 'nb_echeances' },
      { header: 'Statut', key: 'statut' },
    ], itemsToExport)
  }

  function handleBatchRelanceWhatsApp() {
    const clientsAvecSolde = credits.filter(c => selectedIds.includes(c.id) && c.solde_restant > 0 && c.beneficiaire_tel)
    if (clientsAvecSolde.length === 0) {
      alert('Aucun des clients sélectionnés n\'a de solde restant ou de numéro de téléphone renseigné.')
      return
    }
    // Ouvre la première relance et notifie
    const premier = clientsAvecSolde[0]
    const tel = premier.beneficiaire_tel?.replace(/\D/g, '') || ''
    const waUrl = `https://wa.me/${tel.length === 9 ? `221${tel}` : tel}?text=${encodeURIComponent(`Bonjour ${premier.beneficiaire_nom}, rappel de votre financement Nopalou : solde restant de ${Number(premier.solde_restant).toLocaleString('fr-FR')} FCFA.`)}`
    window.open(waUrl, '_blank')
    setToastMsg(`Relance ouverte pour ${premier.beneficiaire_nom}. ${clientsAvecSolde.length - 1} autre(s) client(s) sélectionné(s).`)
  }

  const batchActions: BatchActionItem[] = [
    {
      id: 'relance_wa',
      label: 'Relance WhatsApp',
      icon: MessageCircle,
      onClick: handleBatchRelanceWhatsApp,
      variant: 'success',
    },
    {
      id: 'solder',
      label: 'Marquer Soldé(s)',
      icon: CheckCheck,
      onClick: handleBatchSolder,
      variant: 'primary',
    },
    {
      id: 'export_csv',
      label: 'Exporter CSV',
      icon: Download,
      onClick: handleBatchExportCsv,
    },
    {
      id: 'supprimer',
      label: 'Supprimer',
      icon: Trash2,
      onClick: handleBatchSupprimer,
      variant: 'danger',
    },
  ]

  const totalFinancement = credits.reduce((acc, c) => acc + Number(c.montant_total || 0), 0)
  const totalRestant = credits.reduce((acc, c) => acc + Number(c.solde_restant || 0), 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── En-tête de la Page, Onglets et KPIs ── */}
      <CreditsHeader
        totalCredits={credits.length}
        totalFinancement={totalFinancement}
        totalRestant={totalRestant}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenWaveModal={() => setShowModalWave(true)}
        onOpenSimpleModal={() => setShowModalSimple(true)}
        toastMsg={toastMsg}
      />

      {activeTab === 'parametres' ? (
        <ParametresEchelonnementImmo slug={slug} />
      ) : (
        <>
          {/* ── Toolbar : Recherche, Tri & Filtres ── */}

          <AgenceTableToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par bénéficiaire, téléphone, bien..."
            sortOptions={SORT_OPTIONS}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            sortDirection={sortDirection}
            onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
            totalCount={credits.length}
            filteredCount={creditsFiltres.length}
            hasActiveFilters={Boolean(searchTerm || filterStatut !== 'tous' || filterType !== 'tous')}
            onResetFilters={() => {
              setSearchTerm('')
              setFilterStatut('tous')
              setFilterType('tous')
            }}
          >
            {/* Filtre Statut */}
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">En cours</option>
              <option value="solde">Soldés</option>
            </select>

            {/* Filtre Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
            >
              <option value="tous">Toutes les opérations</option>
              <option value="caution_echelonnee">Caution étalée</option>
              <option value="acompte_reservation">Acompte réservation</option>
              <option value="terrain_parcelles">Terrain / Parcelles</option>
              <option value="vefa">VEFA</option>
            </select>

            {/* Tout sélectionner */}
            {creditsFiltres.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border, #E8DDD2)',
                  background: selectedIds.length === creditsFiltres.length ? 'var(--navy, #1C2B4A)' : '#fff',
                  color: selectedIds.length === creditsFiltres.length ? '#fff' : 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {selectedIds.length === creditsFiltres.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            )}
          </AgenceTableToolbar>

          {/* ── Liste des Plans ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <p>Chargement des plans de financement...</p>
            </div>
          ) : creditsFiltres.length === 0 ? (
            <div className="agence-card" style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <CreditCard size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16, margin: 0 }}>
                Aucun plan d&apos;échelonnement trouvé
              </p>
              <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 18px' }}>
                Proposez à vos locataires ou acheteurs d&apos;étaler leur caution ou achat avec un lien Wave direct.
              </p>
              <button
                type="button"
                onClick={() => setShowModalWave(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--accent, #C75B00)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Zap size={15} />
                <span>Créer un financement Wave</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {creditsFiltres.map(cr => (
                <CreditCardItem
                  key={cr.id}
                  slug={slug}
                  credit={cr}
                  isSelected={selectedIds.includes(cr.id)}
                  onToggleSelect={handleToggleSelect}
                  onEncaisserEcheance={handleEncaisserEcheance}
                  encaissementId={encaissementId}
                />
              ))}
            </div>
          )}

          {/* ── Barre d'Actions par Lot (Batch Actions) ── */}
          <AgenceBatchActionBar
            selectedCount={selectedIds.length}
            totalCount={creditsFiltres.length}
            onClearSelection={() => setSelectedIds([])}
            actions={batchActions}
            isExecuting={isExecutingBatch}
            labelSingulier="plan sélectionné"
            labelPluriel="plans sélectionnés"
          />
        </>
      )}

      {/* Modale Nouveau Financement & Lien Wave */}
      <ModalNouveauCreditWave
        slug={slug}
        biens={biens}
        isOpen={showModalWave}
        onClose={() => setShowModalWave(false)}
        onSuccess={() => {
          chargerDonnees()
        }}
      />

      {/* Modale Standard */}
      {showModalSimple && (
        <ModalCreerCredit
          slug={slug}
          biens={biens}
          onClose={() => setShowModalSimple(false)}
          onSuccess={() => {
            setShowModalSimple(false)
            chargerDonnees()
          }}
        />
      )}
    </div>
  )
}
