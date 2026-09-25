'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Users,
  Plus,
  UserCheck,
  Building2,
  CheckCircle2,
  Download,
  MessageCircle,
  Trash2
} from 'lucide-react'
import LocataireCardItem from './components/LocataireCardItem'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { ModalNouveauLocataire, BienOption } from './components/ModalNouveauLocataire'
import { ModalEditerLocataire, LocataireEditData, BailData } from './components/ModalEditerLocataire'
import { AgenceTableToolbar, SortOption } from '../../components/AgenceTableToolbar'
import { AgenceBatchActionBar, BatchActionItem } from '../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'
import { showToast } from '@/context/ToastContext'

interface LocataireItem {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  profession?: string
  notes?: string
  bail_id?: string
  bien_titre?: string
  bien_quartier?: string
  bien_ville?: string
  loyer_mensuel?: number
  jour_echeance?: number
  date_debut?: string
  statut_paiement?: string
  nb_impayes?: number
  nb_baux?: number
  nb_baux_actifs?: number
  baux?: BailData[]
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'nom_asc', label: 'Nom (A - Z)' },
  { value: 'nom_desc', label: 'Nom (Z - A)' },
  { value: 'impayes_desc', label: 'Retards / Impayés en premier' },
  { value: 'loyer_desc', label: 'Loyer mensuel le plus élevé' },
]

export default function LocatairesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [locataires, setLocataires] = useState<LocataireItem[]>([])
  const [biensDispo, setBiensDispo] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres, Recherche, Tri
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [currentSort, setCurrentSort] = useState('nom_asc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Sélections et Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modales
  const [showModalNouveau, setShowModalNouveau] = useState(false)
  const [locataireAEditer, setLocataireAEditer] = useState<LocataireEditData | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerLocataires() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts?type_contact=locataire`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setLocataires(data.contacts || [])
      }
    } catch (err) {
      console.error('[LOAD_LOCATAIRES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  async function chargerBiens() {
    try {
      const res = await fetch(`/api/biens/agence/${slug}?statut=actif`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setBiensDispo(data.biens || [])
      }
    } catch (err) {
      console.error('[LOAD_BIENS_ERR]', err)
    }
  }

  useEffect(() => {
    if (slug) {
      chargerLocataires()
      chargerBiens()
    }
  }, [slug])

  // Filtrage et Tri
  const locatairesFiltres = useMemo(() => {
    let list = [...locataires]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        l =>
          l.nom.toLowerCase().includes(q) ||
          (l.prenom && l.prenom.toLowerCase().includes(q)) ||
          (l.telephone && l.telephone.includes(q)) ||
          (l.bien_titre && l.bien_titre.toLowerCase().includes(q))
      )
    }

    if (filterStatut === 'avec_bail') {
      list = list.filter(l => Boolean(l.bail_id || l.bien_titre))
    } else if (filterStatut === 'sans_bail') {
      list = list.filter(l => !l.bail_id && !l.bien_titre)
    } else if (filterStatut === 'impayes') {
      list = list.filter(l => Number(l.nb_impayes || 0) > 0)
    }

    // Tri
    list.sort((a, b) => {
      let cmp = 0
      if (currentSort.startsWith('nom')) {
        cmp = a.nom.localeCompare(b.nom)
        if (currentSort === 'nom_desc' || sortDirection === 'desc') cmp = -cmp
      } else if (currentSort.startsWith('impayes')) {
        cmp = Number(b.nb_impayes || 0) - Number(a.nb_impayes || 0)
        if (sortDirection === 'asc') cmp = -cmp
      } else if (currentSort.startsWith('loyer')) {
        cmp = Number(b.loyer_mensuel || 0) - Number(a.loyer_mensuel || 0)
        if (sortDirection === 'asc') cmp = -cmp
      }
      return cmp
    })

    return list
  }, [locataires, searchTerm, filterStatut, currentSort, sortDirection])

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  function handleSelectAll() {
    if (selectedIds.length === locatairesFiltres.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(locatairesFiltres.map(l => l.id))
    }
  }

  function handleBatchExportCsv() {
    const items = selectedIds.length > 0 ? locataires.filter(l => selectedIds.includes(l.id)) : locatairesFiltres
    exportDataToCsv('repertoire-locataires', [
      { header: 'Nom', key: 'nom' },
      { header: 'Prénom', key: 'prenom' },
      { header: 'Téléphone', key: 'telephone' },
      { header: 'Email', key: 'email' },
      { header: 'Profession', key: 'profession' },
      { header: 'Bien Loué', key: 'bien_titre' },
      { header: 'Loyer Mensuel', key: 'loyer_mensuel' },
      { header: 'Nombre Impayés', key: 'nb_impayes' },
    ], items)
  }

  function handleBatchRelanceWhatsApp() {
    const locs = locataires.filter(l => selectedIds.includes(l.id) && (l.whatsapp || l.telephone))
    if (locs.length === 0) {
      showToast('Aucun numéro de téléphone WhatsApp disponible pour les locataires sélectionnés.', 'warning', 'Relance WhatsApp')
      return
    }
    const premier = locs[0]
    const tel = (premier.whatsapp || premier.telephone || '').replace(/\D/g, '')
    const cleanTel = tel.length === 9 ? `221${tel}` : tel
    const msg = `Bonjour ${premier.prenom ? `${premier.prenom} ` : ''}${premier.nom}, nous vous contactons depuis votre agence concernant votre gestion locative.`
    const waUrl = `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
    setToastMsg(`Discussion ouverte pour ${premier.nom}. ${locs.length - 1} autre(s) locataire(s) sélectionné(s).`)
  }

  async function handleDeleteLocataire(id: string, nom: string) {
    if (!confirm(`Souhaitez-vous supprimer ou archiver le locataire "${nom}" ?\n\nNote : S'il possède un historique de bail ou de quittance, il sera automatiquement archivé afin de préserver l'intégrité comptable et légale de l'agence.`)) {
      return
    }

    try {
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts/${id}`, {
        method: 'DELETE',
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        showToast(data.error || 'Erreur lors de la suppression.', 'error', 'Action impossible')
        return
      }
      showToast(data.message || 'Locataire supprimé / archivé avec succès.', 'success', 'Gestion locataires')
      await chargerLocataires()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur réseau.', 'error', 'Erreur')
    }
  }

  async function handleBatchDeleteLocataires() {
    if (selectedIds.length === 0) return
    if (!confirm(`Supprimer ou archiver les ${selectedIds.length} locataire(s) sélectionné(s) ?\nLes locataires avec baux seront archivés, les dossiers vides seront supprimés.`)) {
      return
    }

    try {
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts/batch-delete`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        showToast(data.error || 'Erreur lors du traitement groupé.', 'error', 'Erreur')
        return
      }
      showToast(data.message, 'success', 'Traitement groupé')
      setSelectedIds([])
      await chargerLocataires()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur réseau.', 'error', 'Erreur')
    }
  }

  const batchActions: BatchActionItem[] = [
    {
      id: 'relance_wa',
      label: 'Relancer WhatsApp',
      icon: MessageCircle,
      onClick: handleBatchRelanceWhatsApp,
      variant: 'success',
    },
    {
      id: 'export_csv',
      label: 'Exporter CSV',
      icon: Download,
      onClick: handleBatchExportCsv,
    },
    {
      id: 'batch_delete',
      label: 'Supprimer / Archiver',
      icon: Trash2,
      onClick: handleBatchDeleteLocataires,
      variant: 'danger',
    },
  ]

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Gestion des Locataires</h1>
          <p className="agence-subtitle">Répertoire des locataires sous contrat, suivi des baux et contacts directs.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModalNouveau(true)}
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
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          <span>Nouveau locataire</span>
        </button>
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
        searchPlaceholder="Rechercher par nom, prénom, téléphone, bien..."
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        sortDirection={sortDirection}
        onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
        totalCount={locataires.length}
        filteredCount={locatairesFiltres.length}
        hasActiveFilters={Boolean(searchTerm || filterStatut !== 'tous')}
        onResetFilters={() => {
          setSearchTerm('')
          setFilterStatut('tous')
        }}
      >
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
        >
          <option value="tous">Tous les locataires</option>
          <option value="avec_bail">Avec bail actif</option>
          <option value="impayes">Avec impayés / retards</option>
          <option value="sans_bail">Sans bail rattaché</option>
        </select>

        {locatairesFiltres.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              background: selectedIds.length === locatairesFiltres.length ? 'var(--navy, #1C2B4A)' : '#fff',
              color: selectedIds.length === locatairesFiltres.length ? '#fff' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {selectedIds.length === locatairesFiltres.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        )}
      </AgenceTableToolbar>

      {/* ── Liste des Locataires ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des locataires...</p>
        </div>
      ) : locatairesFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun locataire trouvé</p>
          <p style={{ fontSize: 13.5 }}>Modifiez votre recherche ou enregistrez un nouveau locataire.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {locatairesFiltres.map((loc) => (
            <LocataireCardItem
              key={loc.id}
              locataire={loc}
              isSelected={selectedIds.includes(loc.id)}
              onToggleSelect={handleToggleSelect}
              onEdit={setLocataireAEditer}
              onDelete={handleDeleteLocataire}
            />
          ))}
        </div>

      )}

      {/* ── Barre d'Actions par Lot ── */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.length}
        totalCount={locatairesFiltres.length}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        labelSingulier="locataire sélectionné"
        labelPluriel="locataires sélectionnés"
      />

      {/* Modales */}
      {showModalNouveau && (
        <ModalNouveauLocataire
          slug={slug}
          isOpen={showModalNouveau}
          biensDispo={biensDispo}
          onClose={() => setShowModalNouveau(false)}
          onSuccess={() => {
            setShowModalNouveau(false)
            setToastMsg('Nouveau locataire enregistré avec succès.')
            chargerLocataires()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}

      {locataireAEditer && (
        <ModalEditerLocataire
          slug={slug}
          isOpen={Boolean(locataireAEditer)}
          locataire={locataireAEditer}
          biensDispo={biensDispo}
          onClose={() => setLocataireAEditer(null)}
          onSuccess={() => {
            setLocataireAEditer(null)
            setToastMsg('Fiche locataire et baux mis à jour.')
            chargerLocataires()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}
    </div>
  )
}
