'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Home, Plus, CheckCircle2, Archive, Trash2, Globe, Download } from 'lucide-react'
import ModalEditerBien from './components/ModalEditerBien'
import BienCardMobile, { BienItem } from './components/BienCardMobile'
import TableBiensDesktop from './components/TableBiensDesktop'
import { AgenceTableToolbar, SortOption } from '../../components/AgenceTableToolbar'
import { AgenceBatchActionBar, BatchActionItem } from '../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

const SORT_OPTIONS: SortOption[] = [

  { value: 'date_desc', label: 'Plus récents en premier' },
  { value: 'date_asc', label: 'Plus anciens en premier' },
  { value: 'prix_desc', label: 'Prix le plus élevé' },
  { value: 'prix_asc', label: 'Prix le plus bas' },
  { value: 'titre_asc', label: 'Titre (A - Z)' },
  { value: 'surface_desc', label: 'Surface m² (décroissante)' },
]

export default function BiensListPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [biens, setBiens] = useState<BienItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres, Recherche, Tri
  const [filterType, setFilterType] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSort, setCurrentSort] = useState('date_desc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sélections & Actions par Lot
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExecutingBatch, setIsExecutingBatch] = useState(false)

  // Modales & Toasts
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [bienAEditer, setBienAEditer] = useState<any | null>(null)

  async function chargerBiens() {
    try {
      setLoading(true)
      const res = await fetch(`/api/biens/agence/${slug}?statut=tous&limit=200`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setBiens(data.biens || [])
      }
    } catch (err) {
      console.error('[LOAD_BIENS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerBiens()
  }, [slug])

  async function handlePublierAnnonce(bienId: string) {
    try {
      setPublishingId(bienId)
      const res = await fetch(`/api/biens/agence/${slug}/${bienId}/publier`, {
        method: 'POST',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Annonce publiée avec succès sur Nopalou Immobilier !')
        chargerBiens()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[PUBLISH_ERR]', err)
    } finally {
      setPublishingId(null)
    }
  }

  async function handleDupliquer(bienId: string) {
    try {
      const res = await fetch(`/api/biens/agence/${slug}/${bienId}/dupliquer`, {
        method: 'POST',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Bien dupliqué avec succès !')
        chargerBiens()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[DUPLIQUER_ERR]', err)
    }
  }

  async function handleArchiver(bienId: string) {
    try {
      const res = await fetch(`/api/biens/agence/${slug}/${bienId}/archiver`, {
        method: 'POST',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Statut du bien mis à jour.')
        chargerBiens()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[ARCHIVER_ERR]', err)
    }
  }

  async function handleSupprimer(bienId: string) {
    if (!window.confirm('Voulez-vous vraiment supprimer ce bien immobilier ?')) return
    try {
      const res = await fetch(`/api/biens/agence/${slug}/${bienId}`, {
        method: 'DELETE',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Bien supprimé.')
        chargerBiens()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[SUPPRIMER_ERR]', err)
    }
  }

  // Filtrage et Tri en mémoire
  const biensFiltres = useMemo(() => {
    let list = [...biens]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        b =>
          b.titre.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          b.ville.toLowerCase().includes(q) ||
          (b.quartier && b.quartier.toLowerCase().includes(q))
      )
    }

    if (filterType !== 'tous') {
      list = list.filter(b => b.type_bien === filterType)
    }

    if (filterStatut !== 'tous') {
      list = list.filter(b => b.statut_occupation === filterStatut)
    }

    // Tri
    list.sort((a, b) => {
      let cmp = 0
      const prixA = a.prix_location || a.prix_vente || 0
      const prixB = b.prix_location || b.prix_vente || 0

      if (currentSort.startsWith('prix')) {
        cmp = prixB - prixA
        if (currentSort === 'prix_asc' || sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('surface')) {
        cmp = Number(b.surface_m2 || 0) - Number(a.surface_m2 || 0)
        if (sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('titre')) {
        cmp = a.titre.localeCompare(b.titre)
        if (sortDirection === 'desc') cmp = -cmp
      } else {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        cmp = dateB - dateA
        if (currentSort === 'date_asc' || sortDirection === 'asc') cmp = -cmp
      }
      return cmp
    })

    return list
  }, [biens, searchTerm, filterType, filterStatut, currentSort, sortDirection])

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  function handleSelectAll() {
    if (selectedIds.length === biensFiltres.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(biensFiltres.map(b => b.id))
    }
  }

  function handleSortColumn(key: string) {
    if (currentSort === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setCurrentSort(key)
      setSortDirection('desc')
    }
  }

  // Actions Batch
  async function executeBatchAction(action: 'publier' | 'archiver' | 'supprimer') {
    if (action === 'supprimer' && !confirm(`Supprimer définitivement les ${selectedIds.length} biens sélectionnés ?`)) return
    try {
      setIsExecutingBatch(true)
      const res = await fetch(`/api/biens/agence/${slug}/batch`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action, bienIds: selectedIds }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(data.message || 'Action exécutée avec succès.')
        setSelectedIds([])
        chargerBiens()
        setTimeout(() => setToastMsg(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExecutingBatch(false)
    }
  }

  function handleBatchExportCsv() {
    const items = selectedIds.length > 0 ? biens.filter((b) => selectedIds.includes(b.id)) : biensFiltres
    exportDataToCsv(
      'portefeuille-biens-immo',
      [
        { header: 'Référence', key: 'reference' },
        { header: 'Titre', key: 'titre' },
        { header: 'Type', key: 'type_bien' },
        { header: 'Ville', key: 'ville' },
        { header: 'Quartier', key: 'quartier' },
        { header: 'Statut Occupation', key: 'statut_occupation' },
        { header: 'Prix Location FCFA', key: 'prix_location' },
        { header: 'Prix Vente FCFA', key: 'prix_vente' },
        { header: 'Surface m2', key: 'surface_m2' },
      ],
      items
    )
  }

  const batchActions: BatchActionItem[] = [
    {
      id: 'publier',
      label: 'Publier Marketplace',
      icon: Globe,
      onClick: () => executeBatchAction('publier'),
      variant: 'primary',
    },
    {
      id: 'archiver',
      label: 'Archiver',
      icon: Archive,
      onClick: () => executeBatchAction('archiver'),
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
      onClick: () => executeBatchAction('supprimer'),
      variant: 'danger',
    },
  ]


  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Portefeuille de Biens</h1>
          <p className="agence-subtitle">Gérez vos propriétés, suivez leur occupation et publiez sur la marketplace.</p>
        </div>

        <Link
          href={`/agence/${slug}/biens/nouveau`}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Plus size={18} />
          <span>Ajouter un bien</span>
        </Link>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Toolbar : Recherche, Tri & Filtres ── */}
      <AgenceTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Rechercher par titre, quartier, ville, référence..."
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        sortDirection={sortDirection}
        onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
        totalCount={biens.length}
        filteredCount={biensFiltres.length}
        hasActiveFilters={Boolean(searchTerm || filterType !== 'tous' || filterStatut !== 'tous')}
        onResetFilters={() => {
          setSearchTerm('')
          setFilterType('tous')
          setFilterStatut('tous')
        }}
      >
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
        >
          <option value="tous">Tous types de biens</option>
          <option value="appartement">Appartement</option>
          <option value="villa">Villa</option>
          <option value="studio">Studio</option>
          <option value="terrain">Terrain</option>
          <option value="bureau">Bureau / Local</option>
        </select>

        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
        >
          <option value="tous">Tous statuts d&apos;occupation</option>
          <option value="disponible">Disponible</option>
          <option value="loue">Loué</option>
          <option value="vendu">Vendu</option>
        </select>
      </AgenceTableToolbar>

      {/* ── Tableau des Biens ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des biens...</p>
        </div>
      ) : biensFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Home size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun bien trouvé</p>
          <p style={{ fontSize: 13.5 }}>Modifiez votre recherche ou ajoutez un nouveau bien immobilier.</p>
        </div>
      ) : (
        <>
          {/* ── Vue Mobile : Cartes Dédiées (< 768px) ── */}
          <div className="immo-mobile-only" style={{ flexDirection: 'column' }}>
            {biensFiltres.map(bien => (
              <BienCardMobile
                key={bien.id}
                slug={slug}
                bien={bien}
                onEdit={b => setBienAEditer(b)}
                onDuplicate={id => handleDupliquer(id)}
                onArchive={id => handleArchiver(id)}
                onDelete={id => handleSupprimer(id)}
                onPublish={id => handlePublierAnnonce(id)}
                isPublishing={publishingId === bien.id}
                isSelected={selectedIds.includes(bien.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>

          {/* ── Vue Desktop : Tableau Complet (>= 768px) ── */}
          <TableBiensDesktop
            biens={biensFiltres}
            selectedIds={selectedIds}
            currentSort={currentSort}
            sortDirection={sortDirection}
            onSortColumn={handleSortColumn}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onEdit={setBienAEditer}
            onDupliquer={handleDupliquer}
            onSupprimer={handleSupprimer}
            onPublier={handlePublierAnnonce}
            publishingId={publishingId}
          />
        </>
      )}


      {/* ── Barre d'Actions par Lot (Batch Actions) ── */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.length}
        totalCount={biensFiltres.length}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        isExecuting={isExecutingBatch}
        labelSingulier="bien sélectionné"
        labelPluriel="biens sélectionnés"
      />

      {bienAEditer && (
        <ModalEditerBien
          slug={slug}
          bien={bienAEditer}
          onClose={() => setBienAEditer(null)}
          onSuccess={() => {
            setBienAEditer(null)
            chargerBiens()
          }}
        />
      )}
    </div>
  )
}
