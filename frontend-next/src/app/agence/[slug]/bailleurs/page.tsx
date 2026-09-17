'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Users,
  Plus,
  UserCheck,
  Building2,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Download,
} from 'lucide-react'
import BailleurCardItem from './components/BailleurCardItem'
import { getImmoAuthHeaders, getImmoAuthToken } from '@/lib/immo-auth'
import { ModalEditerBailleur, BailleurEditData } from './components/ModalEditerBailleur'
import { ModalNouveauBailleur } from './components/ModalNouveauBailleur'
import { AgenceTableToolbar, SortOption } from '../../components/AgenceTableToolbar'
import { AgenceBatchActionBar, BatchActionItem } from '../../components/AgenceBatchActionBar'
import { exportDataToCsv } from '@/lib/immo-csv-export'

interface Proprietaire {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  type_bailleur: string
  adresse?: string
  iban?: string
  notes?: string
  nb_biens_total: number
  nb_biens_loues: number
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'nom_asc', label: 'Nom (A - Z)' },
  { value: 'nom_desc', label: 'Nom (Z - A)' },
  { value: 'biens_desc', label: 'Nombre de biens confiés' },
]

export default function BailleursPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres, Recherche, Tri
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [currentSort, setCurrentSort] = useState('nom_asc')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Sélections et Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modales
  const [showModalNouveau, setShowModalNouveau] = useState(false)
  const [bailleurAEditer, setBailleurAEditer] = useState<BailleurEditData | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const token = getImmoAuthToken()

  async function chargerBailleurs() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setProprietaires(data.proprietaires || [])
      }
    } catch (err) {
      console.error('[LOAD_BAILLEURS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerBailleurs()
  }, [slug])

  // Filtrage et Tri
  const proprietairesFiltres = useMemo(() => {
    let list = [...proprietaires]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        p =>
          p.nom.toLowerCase().includes(q) ||
          (p.prenom && p.prenom.toLowerCase().includes(q)) ||
          (p.telephone && p.telephone.includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q))
      )
    }

    if (filterType !== 'tous') {
      list = list.filter(p => p.type_bailleur === filterType)
    }

    // Tri
    list.sort((a, b) => {
      let cmp = 0
      if (currentSort.startsWith('nom')) {
        cmp = a.nom.localeCompare(b.nom)
        if (currentSort === 'nom_desc' || sortDirection === 'desc') cmp = -cmp
      } else if (currentSort.startsWith('biens')) {
        cmp = Number(b.nb_biens_total || 0) - Number(a.nb_biens_total || 0)
        if (sortDirection === 'asc') cmp = -cmp
      }
      return cmp
    })

    return list
  }, [proprietaires, searchTerm, filterType, currentSort, sortDirection])

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  function handleSelectAll() {
    if (selectedIds.length === proprietairesFiltres.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(proprietairesFiltres.map(p => p.id))
    }
  }

  function handleBatchExportCsv() {
    const items = selectedIds.length > 0 ? proprietaires.filter(p => selectedIds.includes(p.id)) : proprietairesFiltres
    exportDataToCsv('repertoire-bailleurs-proprietaires', [
      { header: 'Nom', key: 'nom' },
      { header: 'Prénom', key: 'prenom' },
      { header: 'Téléphone', key: 'telephone' },
      { header: 'Email', key: 'email' },
      { header: 'Type Bailleur', key: 'type_bailleur' },
      { header: 'Biens Confiés', key: 'nb_biens_total' },
      { header: 'Biens Loués', key: 'nb_biens_loues' },
      { header: 'Adresse', key: 'adresse' },
    ], items)
  }

  function handleBatchContactWhatsApp() {
    const contacts = proprietaires.filter(p => selectedIds.includes(p.id) && (p.whatsapp || p.telephone))
    if (contacts.length === 0) {
      alert('Aucun numéro de téléphone WhatsApp disponible pour les propriétaires sélectionnés.')
      return
    }
    const premier = contacts[0]
    const tel = (premier.whatsapp || premier.telephone || '').replace(/\D/g, '')
    const cleanTel = tel.length === 9 ? `221${tel}` : tel
    const msg = `Bonjour ${premier.prenom ? `${premier.prenom} ` : ''}${premier.nom}, message de suivi de votre agence concernant vos biens en mandat de gestion.`
    const waUrl = `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
    setToastMsg(`Discussion ouverte pour ${premier.nom}. ${contacts.length - 1} autre(s) propriétaire(s) sélectionné(s).`)
  }

  const batchActions: BatchActionItem[] = [
    {
      id: 'contact_wa',
      label: 'Contacter WhatsApp',
      icon: MessageCircle,
      onClick: handleBatchContactWhatsApp,
      variant: 'success',
    },
    {
      id: 'export_csv',
      label: 'Exporter CSV',
      icon: Download,
      onClick: handleBatchExportCsv,
    },
  ]

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Bailleurs & Propriétaires</h1>
          <p className="agence-subtitle">Gérez les propriétaires mandants et leurs biens confiés à l&apos;agence.</p>
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
          <span>Ajouter un propriétaire</span>
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
        searchPlaceholder="Rechercher par nom, téléphone, email..."
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        sortDirection={sortDirection}
        onToggleSortDirection={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
        totalCount={proprietaires.length}
        filteredCount={proprietairesFiltres.length}
        hasActiveFilters={Boolean(searchTerm || filterType !== 'tous')}
        onResetFilters={() => {
          setSearchTerm('')
          setFilterType('tous')
        }}
      >
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
        >
          <option value="tous">Tous types de bailleurs</option>
          <option value="particulier">Particulier</option>
          <option value="societe">Société / Entreprise</option>
        </select>

        {proprietairesFiltres.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              background: selectedIds.length === proprietairesFiltres.length ? 'var(--navy, #1C2B4A)' : '#fff',
              color: selectedIds.length === proprietairesFiltres.length ? '#fff' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {selectedIds.length === proprietairesFiltres.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        )}
      </AgenceTableToolbar>

      {/* ── Liste des Bailleurs ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des propriétaires mandants...</p>
        </div>
      ) : proprietairesFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun propriétaire trouvé</p>
          <p style={{ fontSize: 13.5 }}>Modifiez votre recherche ou enregistrez votre premier bailleur.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 14,
          }}
        >
          {proprietairesFiltres.map((p) => (
            <BailleurCardItem
              key={p.id}
              bailleur={p}
              slug={slug}
              token={token}
              isSelected={selectedIds.includes(p.id)}
              onToggleSelect={handleToggleSelect}
              onEdit={setBailleurAEditer}
            />
          ))}
        </div>
      )}


      {/* ── Barre d'Actions par Lot ── */}
      <AgenceBatchActionBar
        selectedCount={selectedIds.length}
        totalCount={proprietairesFiltres.length}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        labelSingulier="propriétaire sélectionné"
        labelPluriel="propriétaires sélectionnés"
      />

      {/* Modales */}
      {showModalNouveau && (
        <ModalNouveauBailleur
          slug={slug}
          isOpen={showModalNouveau}
          onClose={() => setShowModalNouveau(false)}
          onSuccess={() => {
            setShowModalNouveau(false)
            setToastMsg('Nouveau bailleur mandant enregistré avec succès.')
            chargerBailleurs()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}

      {bailleurAEditer && (
        <ModalEditerBailleur
          slug={slug}
          isOpen={Boolean(bailleurAEditer)}
          bailleur={bailleurAEditer}
          onClose={() => setBailleurAEditer(null)}
          onSuccess={() => {
            setBailleurAEditer(null)
            setToastMsg('Fiche du bailleur mise à jour avec succès.')
            chargerBailleurs()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}
    </div>
  )
}
