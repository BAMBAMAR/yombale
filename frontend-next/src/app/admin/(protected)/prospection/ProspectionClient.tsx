'use client'

import { useState, useMemo } from 'react'
import {
  Users, UserPlus, Send, History, Sparkles, Filter, Search,
  Download, Trash2, Phone, MessageSquare, ExternalLink, CheckCircle2,
  Copy, RefreshCw, Layers, ShieldCheck, Zap, Pencil, Ban, ShieldAlert,
  Check, X, Lock, Unlock, SlidersHorizontal, RotateCcw, AlertTriangle
} from 'lucide-react'
import type { Lead, StatsLeads, TemplateMsg, DorkingRequete, BlacklistItem } from './page'

interface Props {
  initialLeads: Lead[]
  initialStats: StatsLeads
  templates: TemplateMsg[]
  dorking: DorkingRequete[]
  secret: string
}

type TabType = 'crm' | 'import' | 'campagnes' | 'logs' | 'control' | 'blacklist'

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nouveau: { label: 'Nouveau', color: '#2563EB', bg: '#EFF6FF' },
  contacte_wa: { label: 'Contacté WhatsApp', color: '#16A34A', bg: '#F0FDF4' },
  contacte_email: { label: 'Contacté Email', color: '#7C3AED', bg: '#F5F3FF' },
  en_discussion: { label: 'En Discussion', color: '#D97706', bg: '#FFFBEB' },
  converti: { label: 'Converti (Boutique Active)', color: '#059669', bg: '#ECFDF5' },
  desinscrit: { label: 'Désinscrit / Refus', color: '#DC2626', bg: '#FEF2F2' },
  invalide: { label: 'Invalide / Emploi (Hors Cible)', color: '#64748B', bg: '#F1F5F9' },
}

const OPERATEUR_COLORS: Record<string, { color: string; bg: string }> = {
  Orange: { color: '#C75B00', bg: '#FFF7ED' },
  'Free (Yas)': { color: '#2563EB', bg: '#EFF6FF' },
  Expresso: { color: '#9333EA', bg: '#FAF5FF' },
  Promobile: { color: '#16A34A', bg: '#F0FDF4' },
  Autre: { color: '#64748B', bg: '#F1F5F9' },
}

const CATEGORIES_OPTIONS = [
  { value: 'tous', label: 'Toutes les catégories' },
  { value: 'mode', label: '👗 Mode & Prêt-à-porter' },
  { value: 'auto-moto', label: '🚗 Véhicules & Auto-Moto' },
  { value: 'immo', label: '🏠 Immobilier & Terrains' },
  { value: 'smartphones', label: '📱 Téléphonie & Tech' },
  { value: 'tv-electro', label: '📺 Électroménager & TV' },
  { value: 'informatique', label: '💻 Informatique & Ordis' },
  { value: 'maison', label: '🛋️ Maison & Ameublement' },
  { value: 'beaute', label: '💄 Cosmétique & Beauté' },
  { value: 'superette', label: '🛒 Alimentation & Supérette' },
  { value: 'quincaillerie', label: '🔨 Quincaillerie & BTP' },
  { value: 'grossiste', label: '📦 Grossistes & Import Chine' },
  { value: 'services', label: '🛠️ Services & Prestations' },
  { value: 'divers', label: '🛍️ Commerce Général / Mixte' },
  { value: 'emploi', label: '💼 Offres & Demandes d\'Emploi' },
]

const SOURCES_OPTIONS = [
  { value: 'tous', label: 'Toutes les sources' },
  { value: 'annonces_classifiees', label: '🏷️ Annonces Nopalou' },
  { value: 'scraper_auto', label: '🤖 Scraper Automatisé' },
  { value: 'facebook', label: '👥 Groupes Facebook Dakar' },
  { value: 'import_vrac', label: '📥 Import Vrac' },
  { value: 'manuel', label: '✍️ Ajout Manuel' },
]

const OPERATEURS_OPTIONS = [
  { value: 'tous', label: 'Tous les opérateurs' },
  { value: 'Orange', label: '🟠 Orange' },
  { value: 'Free (Yas)', label: '🔴 Free (Yas)' },
  { value: 'Expresso', label: '🟣 Expresso' },
  { value: 'Promobile', label: '🟢 Promobile' },
]

export default function ProspectionClient({
  initialLeads,
  initialStats,
  templates,
  dorking,
  secret,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('crm')
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [stats, setStats] = useState<StatsLeads>(initialStats)
  const [toast, setToast] = useState<string | null>(null)

  // Limite d'affichage CRM (Origine des 200) & Pagination
  const [limit, setLimit] = useState<number | string>(200)
  const [loadingLeads, setLoadingLeads] = useState(false)

  // Modal Modification / Édition Lead en Base
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    nom_boutique: '',
    contact_nom: '',
    telephone: '',
    email: '',
    categorie: 'mode',
    ville: 'Dakar',
    quartier: 'Dakar',
    statut: 'nouveau',
    notes: '',
  })

  // Blacklist (Liste Noire) & Désinscriptions
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [loadingBlacklist, setLoadingBlacklist] = useState(false)
  const [blacklistSearch, setBlacklistSearch] = useState('')
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false)
  const [isAddingBlacklist, setIsAddingBlacklist] = useState(false)
  const [blacklistAddForm, setBlacklistAddForm] = useState({
    phone: '',
    reason: 'STOP / Opt-Out (WhatsApp)',
  })

  // Filtres CRM & Campagnes
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('tous')
  const [statutFilter, setStatutFilter] = useState('nouveau')
  const [sourceFilter, setSourceFilter] = useState('tous')
  const [operateurFilter, setOperateurFilter] = useState('tous')
  const [quartierFilter, setQuartierFilter] = useState('tous')
  const [campagneLimit, setCampagneLimit] = useState<number | 'tous'>(50)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])

  // Modal Ajout Unique
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    nom_boutique: '',
    contact_nom: '',
    telephone: '',
    email: '',
    categorie: 'mode',
    ville: 'Dakar',
    quartier: 'Dakar',
    notes: '',
  })

  // Import Vrac
  const [rawImportText, setRawImportText] = useState('')
  const [importCat, setImportCat] = useState('mode')
  const [importVille, setImportVille] = useState('Dakar')
  const [importQuartier, setImportQuartier] = useState('Dakar')
  const [isImporting, setIsImporting] = useState(false)

  // Auto-Sourcing & Nettoyage IA
  const [isAutoSourcing, setIsAutoSourcing] = useState(false)
  const [isCleaningLeads, setIsCleaningLeads] = useState(false)

  // Campagne Dispatcher
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMsg>(templates[0] || {
    id: 'custom',
    titre: 'Message Personnalisé',
    canal: 'whatsapp',
    categorie: 'general',
    texte: 'Salam {nom_boutique} ! Découvrez notre solution : https://nopalou.com'
  })
  const [campagneMessage, setCampagneMessage] = useState(selectedTemplate.texte)
  const [campagneCanal, setCampagneCanal] = useState<'whatsapp' | 'email'>('whatsapp')
  const [campagneTitre, setCampagneTitre] = useState('Campagne WhatsApp Prospection Dakar')
  const [isSending, setIsSending] = useState(false)

  // Logs
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Centre de Contrôle & Crons
  const [scrapingZone, setScrapingZone] = useState('Sandaga')
  const [scrapingLimite, setScrapingLimite] = useState(30)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapingResult, setScrapingResult] = useState<any>(null)

  const [isRelancing, setIsRelancing] = useState(false)
  const [relancesResult, setRelancesResult] = useState<any>(null)

  const [cronData, setCronData] = useState<any>(null)
  const [loadingCronData, setLoadingCronData] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const fetchCronStatus = async () => {
    setLoadingCronData(true)
    try {
      const res = await fetch('/api/prospection/crons/status', {
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        const data = await res.json()
        setCronData(data)
      }
    } catch (_) {}
    finally {
      setLoadingCronData(false)
    }
  }

  const handleRunScraping = async () => {
    setIsScraping(true)
    setScrapingResult(null)
    try {
      const res = await fetch('/api/prospection/scraper/lancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ zone: scrapingZone, limite: scrapingLimite }),
      })
      const data = await res.json()
      if (res.ok) {
        setScrapingResult(data)
        showToast(`🎉 Scraping terminé : ${data.ajoutes} nouveaux leads ajoutés`)
        await reloadLeads()
        await fetchCronStatus()
      } else {
        showToast(`❌ Erreur scraping: ${data.error}`)
      }
    } catch (e: any) {
      showToast(`❌ Erreur: ${e.message}`)
    } finally {
      setIsScraping(false)
    }
  }

  const handleRunRelances = async (type: string = 'tout') => {
    setIsRelancing(true)
    setRelancesResult(null)
    try {
      const res = await fetch('/api/prospection/relances/lancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (res.ok) {
        setRelancesResult(data)
        const total = (data.resultats?.marchands?.stats?.total || 0) + (data.resultats?.dettes?.relancesEnvoyees || 0)
        showToast(`✅ Relances exécutées : ${total} messages WhatsApp envoyés`)
        await fetchCronStatus()
      } else {
        showToast(`❌ Erreur relances: ${data.error}`)
      }
    } catch (e: any) {
      showToast(`❌ Erreur: ${e.message}`)
    } finally {
      setIsRelancing(false)
    }
  }

  const reloadLeads = async (customLimit?: number | string) => {
    setLoadingLeads(true)
    const currentLimit = customLimit !== undefined ? customLimit : limit
    try {
      const url = currentLimit === 'tout'
        ? `/api/prospection/leads?limit=5000`
        : `/api/prospection/leads?limit=${currentLimit}`
      const res = await fetch(url, {
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setStats(data.stats || stats)
      }
    } catch (_) {}
    finally {
      setLoadingLeads(false)
    }
  }

  // Ouverture de la modale de modification d'un prospect
  const handleOpenEditModal = (lead: Lead) => {
    setEditForm({
      id: lead.id,
      nom_boutique: lead.nom_boutique || '',
      contact_nom: lead.contact_nom || '',
      telephone: lead.telephone || '',
      email: lead.email || '',
      categorie: lead.categorie || 'mode',
      ville: lead.ville || 'Dakar',
      quartier: lead.quartier || 'Dakar',
      statut: lead.statut || 'nouveau',
      notes: lead.notes || '',
    })
    setShowEditModal(true)
  }

  // Sauvegarde des modifications d'un lead en base
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.id) return
    setIsSavingEdit(true)
    try {
      const res = await fetch(`/api/prospection/leads/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(editForm),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === editForm.id ? { ...l, ...data } : l)))
        showToast('✅ Prospect mis à jour avec succès dans la base !')
        setShowEditModal(false)
        await reloadLeads()
      } else {
        showToast(`❌ ${data.error || `Erreur de modification (${res.status})`}`)
      }
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message || 'Erreur de connexion'}`)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Chargement de la liste noire
  const loadBlacklist = async () => {
    setLoadingBlacklist(true)
    try {
      const res = await fetch('/api/prospection/blacklist', {
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        const data = await res.json()
        setBlacklist(data.blacklist || [])
      }
    } catch (_) {}
    finally {
      setLoadingBlacklist(false)
    }
  }

  // Ajout manuel d'un numéro à la blacklist
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blacklistAddForm.phone.trim()) {
      showToast('⚠️ Numéro de téléphone requis')
      return
    }
    setIsAddingBlacklist(true)
    try {
      const res = await fetch('/api/prospection/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(blacklistAddForm),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`🚫 Numéro ${data.phone} inscrit sur la Blacklist`)
        setShowAddBlacklistModal(false)
        setBlacklistAddForm({ phone: '', reason: 'STOP / Opt-Out (WhatsApp)' })
        await loadBlacklist()
        await reloadLeads()
      } else {
        showToast(`❌ ${data.error}`)
      }
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`)
    } finally {
      setIsAddingBlacklist(false)
    }
  }

  // Retrait / Déblocage d'un numéro de la blacklist
  const handleRemoveBlacklist = async (phone: string) => {
    if (!confirm(`Débloquer et retirer le numéro +${phone} de la liste noire ?`)) return
    try {
      const res = await fetch(`/api/prospection/blacklist/${phone}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        setBlacklist((prev) => prev.filter((b) => b.phone !== phone))
        showToast(`🔓 Numéro +${phone} débloqué et retiré de la liste noire`)
        await reloadLeads()
      } else {
        showToast('❌ Erreur lors du déblocage')
      }
    } catch (_) {
      showToast('❌ Erreur réseau')
    }
  }

  // Filtrage local de la blacklist
  const filteredBlacklist = blacklist.filter((b) => {
    if (!blacklistSearch.trim()) return true
    const q = blacklistSearch.toLowerCase()
    return (
      (b.phone || '').includes(q) ||
      (b.reason || '').toLowerCase().includes(q) ||
      (b.nom_boutique || '').toLowerCase().includes(q) ||
      (b.contact_nom || '').toLowerCase().includes(q) ||
      (b.quartier || '').toLowerCase().includes(q)
    )
  })

  // Export CSV de la blacklist
  const exportBlacklistCSV = () => {
    const headers = ['Numéro Téléphone', 'Raison / Motif', 'Date Ajout', 'Boutique Associée', 'Contact', 'Catégorie', 'Quartier']
    const rows = filteredBlacklist.map((b) => [
      `"+${b.phone}"`,
      `"${b.reason || 'optout'}"`,
      `"${new Date(b.created_at).toLocaleString('fr-FR')}"`,
      `"${b.nom_boutique || 'Inconnu'}"`,
      `"${b.contact_nom || ''}"`,
      `"${b.categorie || ''}"`,
      `"${b.quartier || b.ville || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `blacklist_nopalou_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Listes dynamiques des quartiers et sources détectés dans la base
  const uniqueQuartiers = useMemo(() => {
    const setQ = new Set<string>()
    leads.forEach((l) => {
      if (l.quartier && l.quartier.trim() && l.quartier !== 'Dakar') {
        setQ.add(l.quartier.trim())
      }
    })
    return ['Dakar', ...Array.from(setQ).sort()]
  }, [leads])

  const uniqueSources = useMemo(() => {
    const setS = new Set<string>()
    leads.forEach((l) => {
      if (l.source && l.source.trim()) {
        if (l.source.startsWith('annonce_facebook')) {
          setS.add('facebook')
        } else {
          setS.add(l.source.trim())
        }
      }
    })
    return Array.from(setS).sort()
  }, [leads])

  // Filtrage local multicritère (Catégorie, Statut, Source, Opérateur, Quartier, Recherche texte)
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // Catégorie
      if (catFilter !== 'tous') {
        if (catFilter === 'smartphones' && l.categorie !== 'smartphones' && l.categorie !== 'tech') return false
        else if (catFilter === 'beaute' && l.categorie !== 'beaute' && l.categorie !== 'cosmetique') return false
        else if (catFilter === 'divers' && l.categorie !== 'divers' && l.categorie !== 'mixte') return false
        else if (l.categorie !== catFilter) return false
      }
      // Statut
      if (statutFilter !== 'tous' && l.statut !== statutFilter) return false
      // Source
      if (sourceFilter !== 'tous') {
        if (sourceFilter === 'facebook' && !(l.source || '').startsWith('annonce_facebook')) return false
        else if (sourceFilter !== 'facebook' && l.source !== sourceFilter) return false
      }
      // Opérateur
      if (operateurFilter !== 'tous' && l.operateur !== operateurFilter) return false
      // Quartier
      if (quartierFilter !== 'tous' && (l.quartier || '').toLowerCase() !== quartierFilter.toLowerCase()) return false

      // Recherche libre (nom, contact, téléphone, quartier, note, etc.)
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchNom = (l.nom_boutique || '').toLowerCase().includes(q)
        const matchContact = (l.contact_nom || '').toLowerCase().includes(q)
        const matchTel = (l.telephone || '').includes(q)
        const matchQuartier = (l.quartier || '').toLowerCase().includes(q)
        const matchNotes = (l.notes || '').toLowerCase().includes(q)
        const matchSource = (l.source || '').toLowerCase().includes(q)
        if (!matchNom && !matchContact && !matchTel && !matchQuartier && !matchNotes && !matchSource) return false
      }
      return true
    })
  }, [leads, catFilter, statutFilter, sourceFilter, operateurFilter, quartierFilter, search])

  // Audience cible réelle pour la campagne (prend en compte la sélection manuelle OU les filtres, avec limite)
  const campaignTargetLeads = useMemo(() => {
    let base = selectedLeadIds.length > 0
      ? leads.filter((l) => selectedLeadIds.includes(l.id))
      : filteredLeads
    
    // Exclure systématiquement les désinscrits et invalides des campagnes
    base = base.filter((l) => l.statut !== 'desinscrit' && l.statut !== 'invalide')

    if (campagneLimit !== 'tous' && typeof campagneLimit === 'number') {
      return base.slice(0, campagneLimit)
    }
    return base
  }, [leads, selectedLeadIds, filteredLeads, campagneLimit])

  // Compteurs de sécurité Anti-Doublon / Anti-Harcèlement
  const nbDejaContactes = useMemo(() => {
    return campaignTargetLeads.filter((l) => l.statut !== 'nouveau').length
  }, [campaignTargetLeads])

  const nbNouveaux = useMemo(() => {
    return campaignTargetLeads.filter((l) => l.statut === 'nouveau').length
  }, [campaignTargetLeads])

  // Réinitialisation de tous les filtres
  const handleResetFilters = () => {
    setSearch('')
    setCatFilter('tous')
    setStatutFilter('nouveau')
    setSourceFilter('tous')
    setOperateurFilter('tous')
    setQuartierFilter('tous')
    setSelectedLeadIds([])
  }

  // Sélections
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(filteredLeads.map((l) => l.id))
    } else {
      setSelectedLeadIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Changement de statut unitaire
  const handleStatutChange = async (leadId: string, newStatut: string) => {
    try {
      const res = await fetch(`/api/prospection/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ statut: newStatut }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, statut: newStatut } : l))
        )
        showToast('✅ Statut du prospect mis à jour')
      } else {
        showToast(`❌ ${data.error || 'Erreur lors de la mise à jour'}`)
      }
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message || 'Erreur de connexion'}`)
    }
  }

  // Suppression unitaire
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Supprimer ce prospect de la base ?')) return
    try {
      const res = await fetch(`/api/prospection/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId))
        showToast('✅ Prospect supprimé')
        await reloadLeads()
      } else {
        showToast(`❌ ${data.error || 'Erreur lors de la suppression'}`)
      }
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message || 'Erreur de connexion'}`)
    }
  }

  // Suppression groupée
  const handleBatchDelete = async () => {
    if (!selectedLeadIds.length) return
    if (!confirm(`Supprimer les ${selectedLeadIds.length} prospects sélectionnés ?`)) return
    try {
      const res = await fetch('/api/prospection/leads/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ids: selectedLeadIds }),
      })
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => !selectedLeadIds.includes(l.id)))
        setSelectedLeadIds([])
        showToast(`✅ ${selectedLeadIds.length} prospects supprimés`)
      }
    } catch (_) {}
  }

  // Auto-Sourcing
  const handleAutoSource = async () => {
    setIsAutoSourcing(true)
    try {
      const res = await fetch('/api/prospection/leads/auto-source', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`🎉 Auto-sourcing terminé : ${data.inseres} nouveaux leads ajoutés (${data.doublons} déjà existants)`)
        await reloadLeads()
      } else {
        showToast(`❌ Erreur: ${data.error}`)
      }
    } catch (e: any) {
      showToast(`❌ Échec de l'auto-sourcing: ${e.message}`)
    } finally {
      setIsAutoSourcing(false)
    }
  }

  // Import Vrac
  const handleImportVrac = async () => {
    if (!rawImportText.trim()) {
      showToast('⚠️ Veuillez coller du texte ou une liste de numéros')
      return
    }
    setIsImporting(true)
    try {
      const res = await fetch('/api/prospection/leads/import-vrac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          rawText: rawImportText,
          categorie: importCat,
          ville: importVille,
          quartier: importQuartier,
          source: 'import_vrac',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`🎉 ${data.inseres} nouveaux prospects importés avec succès (${data.doublons} doublons ignorés)`)
        setRawImportText('')
        await reloadLeads()
        setActiveTab('crm')
      } else {
        showToast(`❌ ${data.error}`)
      }
    } catch (e: any) {
      showToast(`❌ Erreur d'importation: ${e.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  // Nettoyage et Enrichissement IA de la base CRM
  const handleNettoyerLeads = async () => {
    setIsCleaningLeads(true)
    try {
      const res = await fetch('/api/prospection/leads/nettoyer', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        showToast(data.message || '🎉 Base de leads nettoyée et enrichie avec succès !')
        await reloadLeads()
      } else {
        showToast(`❌ ${data.error || 'Erreur lors du nettoyage'}`)
      }
    } catch (e: any) {
      showToast(`❌ Échec du nettoyage: ${e.message}`)
    } finally {
      setIsCleaningLeads(false)
    }
  }

  // Ajout Manuel
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/prospection/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ Prospect ajouté avec succès !')
        setShowAddModal(false)
        setAddForm({
          nom_boutique: '',
          contact_nom: '',
          telephone: '',
          email: '',
          categorie: 'mode',
          ville: 'Dakar',
          quartier: 'Dakar',
          notes: '',
        })
        await reloadLeads()
      } else {
        showToast(`❌ ${data.error}`)
      }
    } catch (err: any) {
      showToast(`❌ ${err.message}`)
    }
  }

  // Lancement de Campagne
  const handleLancerCampagne = async (simulation: boolean) => {
    const targetIds = campaignTargetLeads.map((l) => l.id)
    if (!targetIds.length) {
      showToast('⚠️ Aucun prospect valide ciblé pour cette campagne')
      return
    }

    let confirmMsg = ''
    if (simulation) {
      confirmMsg = `🧪 Simuler l'envoi de la campagne sur ${targetIds.length} prospects ciblés ?`
    } else if (nbDejaContactes > 0) {
      confirmMsg = `⚠️ ATTENTION RELANCE :\n\nCette campagne cible ${targetIds.length} prospects, dont ${nbDejaContactes} DÉJÀ CONTACTÉS auparavant !\n\nConfirmez-vous l'envoi de ce nouveau message à ces ${nbDejaContactes} marchands déjà prospectés ?`
    } else {
      confirmMsg = `🚀 LANCER EN RÉEL l'envoi de la campagne sur ${targetIds.length} NOUVEAUX prospects (100% jamais contactés auparavant) ?`
    }

    if (!confirm(confirmMsg)) {
      return
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/prospection/campagnes/lancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          titre: campagneTitre,
          canal: campagneCanal,
          templateMessage: campagneMessage,
          leadIds: targetIds,
          simulation,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.resultat?.en_arriere_plan) {
          showToast(`🎉 ${data.resultat.message}`)
        } else {
          showToast(`🎉 Campagne terminée : ${data.resultat.nbSucces} envoyés (${data.resultat.nbEchecs} échecs)`)
        }
        await reloadLeads()
      } else {
        showToast(`❌ ${data.error}`)
      }
    } catch (e: any) {
      showToast(`❌ Erreur de campagne: ${e.message}`)
    } finally {
      setIsSending(false)
    }
  }

  // Chargement des logs
  const loadLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch('/api/prospection/logs', {
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (_) {}
    setLoadingLogs(false)
  }

  // Vérification de la légitimité d'un nom pour éviter le spam générique ("Salam Mode !")
  const estNomPropreAuthentique = (nom?: string | null) => {
    if (!nom || typeof nom !== 'string') return false
    const str = nom.trim()
    if (str.length < 2 || str.length > 35) return false
    const low = str.toLowerCase()
    const GENERIQUES = [
      'votre boutique', 'boutique', 'commerce & boutique', 'commerce', 'vendeur', 'vendeuse',
      'responsable', 'partenaire', 'cher commerçant', 'client', 'particulier', 'prospect',
      'mode', 'boutique mode', 'vendeur mode', 'véhicules', 'vehicules', 'vendeur véhicules',
      'agence immobilière', 'agence immobiliere', 'immo', 'immobilier', 'téléphonie & tech',
      'telephonie & tech', 'tech', 'téléphonie', 'telephonie', 'informatique', 'boutique informatique',
      'électroménager', 'electromenager', 'boutique électroménager', 'maison & ameublement',
      'maison', 'ameublement', 'alimentation & supérette', 'alimentation', 'superette',
      'beauté & cosmétique', 'beaute & cosmetique', 'grossiste arrivages', 'grossiste',
      'services', 'service', 'de livraison', 'enseigne', 'divers', 'mixte', 'général', 'general'
    ]
    if (GENERIQUES.includes(low)) return false
    if (/^(boutique|vendeur|commerce|magasin|agence|groupe|grossiste)\s+(mode|tech|informatique|auto|immo|véhicules|vehicules|electromenager|beaute|maison|alimentation)$/i.test(str)) return false
    if (/\d{3,}/.test(str) || /\//.test(str) || /wa\.me/i.test(str) || /@/.test(str)) return false
    if (/^(dakar|senegal|thies|mbour|touba)[,\s]/i.test(str)) return false
    if (/\b(disponible|disponibi|livraison|groupée|groupee|arrivage|promo|hyundai|tucson|lite\s*5g|galaxy|iphone|peugeot|terrain|appartement|chambre)\b/i.test(str)) return false
    return true
  }

  // Formatage grammatical naturel du quartier
  const formatQuartierStr = (q?: string | null) => {
    if (!q || q === 'Dakar' || q === 'Tout Dakar & Régions') return 'à Dakar'
    const qLow = q.toLowerCase()
    if (qLow.startsWith('hlm') || qLow.includes('almadies') || qLow.includes('mamelles') || qLow.includes('maristes') || qLow.includes('parcelles')) {
      return `aux ${q}`
    }
    return `à ${q}`
  }

  // Résolution Spintax pour la prévisualisation temps réel
  const parseClientSpintax = (texte: string) => {
    if (!texte) return ''
    let res = texte
    let hasSpintax = true
    let iterations = 0
    while (hasSpintax && iterations < 10) {
      iterations++
      hasSpintax = false
      res = res.replace(/\{([^{}]+)\}/g, (match, choices) => {
        const lower = choices.toLowerCase().trim()
        if (
          lower === 'nom_boutique' || lower === 'prenom' || lower === 'quartier' ||
          lower === 'secteur' || lower === 'telephone' || lower === 'lien_demo' ||
          lower === 'lien_boutique' || lower === 'lien_tarifs' || lower === 'salutation'
        ) {
          return match
        }
        if (!choices.includes('|')) return match
        hasSpintax = true
        const options = choices.split('|')
        return options[0].trim()
      })
    }
    return res
  }

  // Interpolation de prévisualisation naturelle et humaine
  const previewLead = filteredLeads[0] || {
    nom_boutique: 'Dakar Chic Boutique',
    contact_nom: 'Fatou',
    quartier: 'HLM 5',
    categorie: 'mode',
    telephone: '221771234567',
  }

  const rawNom = (previewLead.nom_boutique || '').trim()
  const rawPrenom = (previewLead.contact_nom || '').trim()
  const estNomAuth = estNomPropreAuthentique(rawNom)
  const estPrenomAuth = estNomPropreAuthentique(rawPrenom)
  const salutationTarget = estPrenomAuth ? rawPrenom : (estNomAuth ? rawNom : null)

  let previewText = parseClientSpintax(campagneMessage)

  // Salutation intelligente
  if (/\{salutation\}/i.test(previewText)) {
    previewText = previewText.replace(/\{salutation\}/gi, salutationTarget ? `Salam ${salutationTarget} ! 👋` : 'Salam ! 👋')
  }

  previewText = previewText
    .replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*\(\s*\{nom_boutique\}\s*\)\s*!/gi, (_m, salut) => {
      if (estPrenomAuth && estNomAuth) return `${salut} ${rawPrenom} (${rawNom}) !`
      if (salutationTarget) return `${salut} ${salutationTarget} !`
      return `${salut} !`
    })
    .replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{nom_boutique\}\s*!/gi, (_m, salut) => {
      return salutationTarget ? `${salut} ${salutationTarget} !` : `${salut} !`
    })
    .replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*!/gi, (_m, salut) => {
      return salutationTarget ? `${salut} ${salutationTarget} !` : `${salut} !`
    })
    .replace(/\{nom_boutique\}/gi, estNomAuth ? rawNom : 'votre boutique')
    .replace(/\{prenom\}/gi, estPrenomAuth ? rawPrenom : 'cher commerçant')
    .replace(/\{quartier\}/gi, formatQuartierStr(previewLead.quartier))
    .replace(/\{secteur\}/gi, previewLead.categorie || 'commerce')
    .replace(/\{telephone\}/gi, previewLead.telephone ? `+${previewLead.telephone}` : '')
    .replace(/\{lien_demo\}/gi, 'https://nopalou.com/guide-creer-boutique')
    .replace(/\{lien_boutique\}/gi, 'https://nopalou.com/creer-boutique')
    .replace(/\{lien_tarifs\}/gi, 'https://nopalou.com/tarifs-boutique')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  // Export CSV
  const exportLeadsCSV = () => {
    const headers = ['Nom Boutique', 'Contact', 'Téléphone', 'Opérateur', 'Email', 'Catégorie', 'Quartier', 'Statut', 'Source']
    const rows = filteredLeads.map((l) => [
      `"${l.nom_boutique || ''}"`,
      `"${l.contact_nom || ''}"`,
      `"${l.telephone || ''}"`,
      `"${l.operateur || ''}"`,
      `"${l.email || ''}"`,
      `"${l.categorie || ''}"`,
      `"${l.quartier || ''}"`,
      `"${l.statut || ''}"`,
      `"${l.source || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `leads_prospection_nopalou_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('📥 Fichier CSV exporté avec succès !')
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 80px', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1C2B4A', color: '#fff', padding: '12px 24px',
          borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {toast}
        </div>
      )}

      {/* Header Principal */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
        borderRadius: 20, padding: '32px 36px', color: '#fff', marginBottom: 28,
        border: '2px solid rgba(22,163,74,0.3)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(22,163,74,0.15)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.2)', padding: '6px 14px', borderRadius: 20, marginBottom: 12 }}>
          <Zap size={16} color="#4ADE80" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#DCFCE7', letterSpacing: '0.05em' }}>
            AUTOMATISATION &amp; PROSPECTION COMMERCIALE SÉNÉGAL
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 8px' }}>
              🎯 CRM Leads &amp; Moteur de Prospection Automatisée
            </h1>
            <p style={{ fontSize: 15, color: '#CBD5E1', maxWidth: 840, lineHeight: 1.5, margin: 0 }}>
              Collectez des contacts qualifiés de commerçants à Dakar, normalisez les numéros (+221 Orange / Free / Expresso), générez des requêtes Dorking et dispatchez des messages WhatsApp &amp; E-mail personnalisés.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleNettoyerLeads}
              disabled={isCleaningLeads}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', border: 'none', padding: '12px 18px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: isCleaningLeads ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              }}
            >
              <Sparkles size={18} />
              <span>{isCleaningLeads ? 'Nettoyage en cours...' : '✨ Nettoyer & Enrichir Base'}</span>
            </button>

            <button
              onClick={handleAutoSource}
              disabled={isAutoSourcing}
              style={{
                background: '#16A34A', color: '#fff', border: 'none', padding: '12px 18px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: isAutoSourcing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              }}
            >
              <Sparkles size={18} />
              <span>{isAutoSourcing ? 'Auto-Sourcing...' : '⚡ Auto-Sourcing'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 18px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <UserPlus size={18} />
              <span>+ Nouveau Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes KPIs Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Prospects Collectés', val: stats.total, color: '#1C2B4A', bg: '#F8FAFC', icon: Users },
          { label: 'Nouveaux à Contacter', val: stats.nouveaux, color: '#2563EB', bg: '#EFF6FF', icon: UserPlus },
          { label: 'Prospects Contactés', val: stats.contactes, color: '#C75B00', bg: '#FFF7ED', icon: Send },
          { label: 'Boutiques Converties', val: stats.convertis, color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle2 },
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
              padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  {kpi.label}
                </span>
                <span style={{ fontSize: 28, fontWeight: 900, color: kpi.color }}>
                  {kpi.val}
                </span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={kpi.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Onglets Navigation (6 Tabs - SaaS Style) */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', background: '#F8FAFC',
        padding: '6px', borderRadius: 16, marginBottom: 28, border: '1px solid #E2E8F0'
      }}>
        {[
          { id: 'crm', label: `📋 1. Base CRM Leads (${stats.total || filteredLeads.length})`, icon: Users },
          { id: 'import', label: '📥 2. Collecteur & Import Vrac', icon: Layers },
          { id: 'campagnes', label: '💬 3. Dispatcher & Campagnes', icon: Send },
          { id: 'logs', label: '📊 4. Historique d\'Envois', icon: History },
          { id: 'control', label: '🎛️ 5. Centre de Contrôle & Crons', icon: ShieldCheck },
          { id: 'blacklist', label: `🚫 6. Liste Noire (${stats.blacklist !== undefined ? stats.blacklist : blacklist.length})`, icon: Ban },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as TabType)
                if (t.id === 'logs') loadLogs()
                if (t.id === 'control') fetchCronStatus()
                if (t.id === 'blacklist') loadBlacklist()
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontSize: 14, fontWeight: isActive ? 800 : 600,
                color: isActive ? '#16A34A' : '#64748B',
                background: isActive ? '#ffffff' : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              <Icon size={18} color={isActive ? '#16A34A' : '#64748B'} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 1 : BASE CRM LEADS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'crm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Barre de Filtres & Actions Avancées */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {/* Ligne 1 : Recherche & Boutons d'Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                <Search size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, contact, téléphone, quartier, mot-clé..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1',
                    fontSize: 14, outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Charger :</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      const val = e.target.value === 'tout' ? 'tout' : Number(e.target.value)
                      setLimit(val)
                      reloadLeads(val)
                    }}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, background: '#fff' }}
                  >
                    <option value={50}>50 leads</option>
                    <option value={100}>100 leads</option>
                    <option value={200}>200 leads</option>
                    <option value={500}>500 leads</option>
                    <option value={1000}>1000 leads</option>
                    <option value="tout">Tous (Base complète)</option>
                  </select>
                </div>

                <button
                  onClick={handleNettoyerLeads}
                  disabled={isCleaningLeads}
                  style={{
                    padding: '8px 14px', background: '#F0FDF4', border: '1px solid #86EFAC',
                    borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: isCleaningLeads ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, color: '#166534',
                  }}
                  title="Reclassement automatique des véhicules, immobilier, tech, suppression des faux noms et annonces emploi"
                >
                  <Sparkles size={15} color="#16A34A" /> {isCleaningLeads ? 'Nettoyage en cours...' : '🧹 Nettoyer & Reclasser CRM'}
                </button>

                <button
                  onClick={exportLeadsCSV}
                  style={{
                    padding: '8px 14px', background: '#F8FAFC', border: '1px solid #CBD5E1',
                    borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, color: '#334155',
                  }}
                >
                  <Download size={15} /> Export CSV ({filteredLeads.length})
                </button>

                {selectedLeadIds.length > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    style={{
                      padding: '8px 14px', background: '#FEE2E2', border: '1px solid #F87171',
                      borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626',
                    }}
                  >
                    <Trash2 size={15} /> Supprimer ({selectedLeadIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Ligne 2 : Sélecteurs de Segmentation Fine */}
            <div style={{
              display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
              paddingTop: 12, borderTop: '1px solid #F1F5F9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 13, fontWeight: 700 }}>
                <SlidersHorizontal size={15} color="#16A34A" /> Filtres :
              </div>

              {/* Catégorie */}
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1',
                  fontSize: 12, fontWeight: 700, background: catFilter !== 'tous' ? '#EFF6FF' : '#fff',
                  color: catFilter !== 'tous' ? '#1D4ED8' : '#1E293B',
                }}
              >
                {CATEGORIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Statut */}
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1',
                  fontSize: 12, fontWeight: 700, background: statutFilter !== 'tous' ? '#EFF6FF' : '#fff',
                  color: statutFilter !== 'tous' ? '#1D4ED8' : '#1E293B',
                }}
              >
                <option value="tous">🎯 Tous les statuts</option>
                <option value="nouveau">🔹 Nouveau</option>
                <option value="contacte_wa">🟢 Contacté WhatsApp</option>
                <option value="en_discussion">🟠 En discussion</option>
                <option value="converti">✅ Converti (Actif)</option>
                <option value="desinscrit">⛔ Désinscrit</option>
                <option value="invalide">⚪ Invalide (Emploi / Hors Cible)</option>
              </select>

              {/* Source */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1',
                  fontSize: 12, fontWeight: 700, background: sourceFilter !== 'tous' ? '#EFF6FF' : '#fff',
                  color: sourceFilter !== 'tous' ? '#1D4ED8' : '#1E293B',
                }}
              >
                {SOURCES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Opérateur */}
              <select
                value={operateurFilter}
                onChange={(e) => setOperateurFilter(e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1',
                  fontSize: 12, fontWeight: 700, background: operateurFilter !== 'tous' ? '#EFF6FF' : '#fff',
                  color: operateurFilter !== 'tous' ? '#1D4ED8' : '#1E293B',
                }}
              >
                {OPERATEURS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Quartier */}
              <select
                value={quartierFilter}
                onChange={(e) => setQuartierFilter(e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1',
                  fontSize: 12, fontWeight: 700, background: quartierFilter !== 'tous' ? '#EFF6FF' : '#fff',
                  color: quartierFilter !== 'tous' ? '#1D4ED8' : '#1E293B',
                }}
              >
                <option value="tous">📍 Tous les quartiers ({uniqueQuartiers.length})</option>
                {uniqueQuartiers.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>

              {/* Bouton Réinitialiser si filtres actifs */}
              {(search || catFilter !== 'tous' || statutFilter !== 'tous' || sourceFilter !== 'tous' || operateurFilter !== 'tous' || quartierFilter !== 'tous') && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    padding: '6px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1',
                    borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#DC2626', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <RotateCcw size={13} /> Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Indicateur de volume et pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            padding: '4px 8px', fontSize: 12, color: '#64748B',
          }}>
            <div>
              Affichage de <strong>{filteredLeads.length}</strong> prospect{filteredLeads.length > 1 ? 's' : ''} sur <strong>{stats.total || leads.length}</strong> au total dans la base.
              {loadingLeads && <span style={{ marginLeft: 8, color: '#2563EB', fontWeight: 700 }}>Chargement...</span>}
            </div>
            {stats.desinscrits ? (
              <span style={{ color: '#DC2626', fontWeight: 700, background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>
                🚫 {stats.desinscrits} désinscrit{stats.desinscrits > 1 ? 's' : ''} (exclus des envois)
              </span>
            ) : null}
          </div>

          {/* Tableau des Prospects */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '14px 16px', width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Boutique &amp; Contact</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Numéro &amp; Opérateur</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Catégorie / Zone</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Source</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions 1-Clic</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                        Aucun prospect trouvé. Utilisez <strong>« ⚡ Auto-Sourcing Annonces »</strong> ou <strong>« 📥 Import Vrac »</strong> pour alimenter votre base.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id)
                      const st = STATUT_LABELS[lead.statut] || STATUT_LABELS.nouveau
                      const op = OPERATEUR_COLORS[lead.operateur] || OPERATEUR_COLORS.Autre
                      const waDirectUrl = `https://wa.me/${lead.telephone}?text=${encodeURIComponent(
                        `Salam ${lead.nom_boutique} ! J'ai vu vos magnifiques articles. Avez-vous pensé à créer votre boutique en ligne avec paiement Wave direct et 0% commission ? 30 jours offerts : https://nopalou.com`
                      )}`

                      return (
                        <tr
                          key={lead.id}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isSelected ? '#F0FDF4' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(lead.id)}
                            />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <strong style={{ fontSize: 14, color: '#1C2B4A', display: 'block' }}>
                              {lead.nom_boutique}
                            </strong>
                            {lead.contact_nom && (
                              <span style={{ fontSize: 12, color: '#64748B' }}>👤 {lead.contact_nom}</span>
                            )}
                            {lead.notes && (
                              <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', fontStyle: 'italic', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                📝 {lead.notes}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800, color: '#1C2B4A' }}>+{lead.telephone}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                                background: op.bg, color: op.color,
                              }}>
                                {lead.operateur}
                              </span>
                            </div>
                            {lead.email && (
                              <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>✉️ {lead.email}</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', textTransform: 'capitalize' }}>
                              🏷️ {lead.categorie}
                            </span>
                            <span style={{ fontSize: 12, color: '#94A3B8' }}>📍 {lead.quartier || lead.ville}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <select
                              value={lead.statut}
                              onChange={(e) => handleStatutChange(lead.id, e.target.value)}
                              style={{
                                padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                                background: st.bg, color: st.color, border: `1px solid ${st.color}40`,
                                cursor: 'pointer', outline: 'none',
                              }}
                            >
                              <option value="nouveau">Nouveau</option>
                              <option value="contacte_wa">Contacté WA</option>
                              <option value="contacte_email">Contacté Email</option>
                              <option value="en_discussion">En discussion</option>
                              <option value="converti">Converti</option>
                              <option value="desinscrit">Désinscrit</option>
                              <option value="invalide">Invalide</option>
                            </select>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: 11, color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
                              {lead.source}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8 }}>
                              <button
                                onClick={() => handleOpenEditModal(lead)}
                                title="Modifier ce prospect dans la base"
                                style={{
                                  padding: '8px', background: '#F8FAFC', color: '#64748b', border: '1px solid #e2e8f0',
                                  borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
                                  transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                              >
                                <Pencil size={15} />
                              </button>
                              <a
                                href={waDirectUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: '8px 14px', background: '#16A34A', color: '#fff', borderRadius: 8,
                                  fontSize: 13, fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)', transition: 'transform 0.1s'
                                }}
                              >
                                <MessageSquare size={15} /> Relancer
                              </a>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                title="Supprimer ce prospect"
                                style={{
                                  padding: '8px', background: '#FEE2E2', color: '#DC2626', border: 'none',
                                  borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 2 : COLLECTEUR & IMPORT AUTOMATIQUE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'import' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Bloc 1 : Importateur de texte brut & Groupes WhatsApp */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={20} color="#16A34A" /> Importeur Intelligent (Numéros &amp; Textes en Vrac)
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              Collez une liste de contacts exportés d&apos;un groupe WhatsApp, d&apos;un fichier CSV ou d&apos;un message brut. Le système extrait et normalise automatiquement les numéros <strong>+221 (Orange, Free, Expresso)</strong> sans doublon.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea
                rows={8}
                placeholder={`Collez vos contacts ici, par exemple :
Fatou Mode HLM - 77 123 45 67
Ibrahima Tech Sandaga - 78 555 44 33
+221 76 987 65 43, contact@boutique.sn
Boutique Parcelles, 70 111 22 33`}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1',
                  fontSize: 13, fontFamily: 'monospace', outline: 'none', resize: 'vertical',
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Catégorie par défaut
                  </label>
                  <select
                    value={importCat}
                    onChange={(e) => setImportCat(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="mode">Mode &amp; Prêt-à-porter</option>
                    <option value="tech">Téléphonie &amp; Tech</option>
                    <option value="superette">Alimentation</option>
                    <option value="quincaillerie">Quincaillerie</option>
                    <option value="cosmetique">Cosmétique</option>
                    <option value="grossiste">Grossiste Chine</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Ville
                  </label>
                  <input
                    type="text"
                    value={importVille}
                    onChange={(e) => setImportVille(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Quartier / Marché
                  </label>
                  <input
                    type="text"
                    value={importQuartier}
                    onChange={(e) => setImportQuartier(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <button
                onClick={handleImportVrac}
                disabled={isImporting}
                style={{
                  background: '#16A34A', color: '#fff', border: 'none', padding: '12px 18px',
                  borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: isImporting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isImporting ? 'Extraction en cours...' : '⚡ Extraire & Importer les Leads'}
              </button>
            </div>
          </div>

          {/* Bloc 2 : Requêtes Google Dorking & Réseaux Sociaux */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={20} color="#C75B00" /> Générateur de Requêtes Dorking (Dakar &amp; Sénégal)
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              Cliquez pour lancer des recherches ciblées sur Google, Instagram et TikTok qui révèlent directement les numéros WhatsApp de vendeurs à Dakar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dorking.map((req, idx) => (
                <div key={idx} style={{
                  background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                  padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <strong style={{ fontSize: 13, color: '#1C2B4A', display: 'block', marginBottom: 2 }}>
                      {req.titre}
                    </strong>
                    <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                      {req.plateforme} · {req.query.slice(0, 45)}...
                    </span>
                  </div>

                  <a
                    href={req.urlGoogle}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 12px', background: '#FFF7ED', color: '#C75B00',
                      border: '1px solid #FED7AA', borderRadius: 8, fontSize: 12,
                      fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    Ouvrir <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 3 : DISPATCHER DE CAMPAGNES & TEMPLATES
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'campagnes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* Éditeur de Campagne */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={20} color="#16A34A" /> Configuration de la Campagne de Prospection
            </h2>

            {/* Bloc de Paramétrage du Ciblage & Audience */}
            <div style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px',
              marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Filter size={15} color="#16A34A" /> 1. Paramétrer l&apos;Audience Cible :
                </span>
                
                <span style={{
                  fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                  background: campaignTargetLeads.length > 0 ? '#DCFCE7' : '#FEE2E2',
                  color: campaignTargetLeads.length > 0 ? '#166534' : '#991B1B',
                }}>
                  🎯 {campaignTargetLeads.length} prospect{campaignTargetLeads.length > 1 ? 's' : ''} ciblé{campaignTargetLeads.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Statut de Protection Anti-Doublon & Déjà Contactés */}
              {nbDejaContactes > 0 ? (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#991B1B' }}>
                      ⚠️ {nbDejaContactes} prospect{nbDejaContactes > 1 ? 's' : ''} DÉJÀ CONTACTÉ{nbDejaContactes > 1 ? 'S' : ''} dans cette sélection
                    </div>
                    <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 1 }}>
                      Ils ont déjà reçu un message WhatsApp lors d&apos;une campagne précédente. Ils ne sont inclus que parce que vous avez explicitement élargi le filtre de statut ou coché leurs cases.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>
                    🛡️ <strong>Protection Anti-Doublon Active :</strong> 100% des {campaignTargetLeads.length} prospects ciblés sont <strong>NOUVEAUX</strong> (jamais contactés). Aucun marchand déjà prospecté ne sera relancé sans votre accord.
                  </span>
                </div>
              )}

              {selectedLeadIds.length > 0 ? (
                <div style={{
                  padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                  borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                    📌 Mode Sélection Manuelle : <strong>{selectedLeadIds.length}</strong> prospect{selectedLeadIds.length > 1 ? 's' : ''} coché{selectedLeadIds.length > 1 ? 's' : ''} dans la table.
                  </span>
                  <button
                    onClick={() => setSelectedLeadIds([])}
                    style={{
                      padding: '4px 10px', background: '#fff', border: '1px solid #93C5FD',
                      borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#2563EB', cursor: 'pointer',
                    }}
                  >
                    Basculer sur les filtres
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                  {/* Catégorie avec Auto-Sélection de Template */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                      Catégorie Métier
                    </label>
                    <select
                      value={catFilter}
                      onChange={(e) => {
                        const newCat = e.target.value
                        setCatFilter(newCat)
                        // Auto-sélection du template métier le plus adapté
                        let matching = templates.find((t) => t.categorie === newCat)
                        if (!matching) {
                          if (newCat === 'tous' || newCat === 'general' || newCat === 'divers') {
                            matching = templates.find((t) => t.id === 'commerce_general' || t.id === 'carnet_dettes')
                          } else if (newCat === 'auto-moto') {
                            matching = templates.find((t) => t.id === 'auto_vehicules')
                          } else if (newCat === 'immo') {
                            matching = templates.find((t) => t.id === 'immo_agences')
                          } else if (newCat === 'tech' || newCat === 'smartphones' || newCat === 'informatique' || newCat === 'tv-electro') {
                            matching = templates.find((t) => t.id === 'tech_telephonie')
                          } else if (newCat === 'grossiste') {
                            matching = templates.find((t) => t.id === 'sourcing_alibaba')
                          } else if (newCat === 'mode') {
                            matching = templates.find((t) => t.id === 'mode_pret_a_porter')
                          }
                        }
                        if (matching) {
                          setSelectedTemplate(matching)
                          setCampagneMessage(matching.texte)
                          setCampagneCanal(matching.canal as any)
                        }
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                    >
                      {CATEGORIES_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Statut */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                      Statut
                    </label>
                    <select
                      value={statutFilter}
                      onChange={(e) => setStatutFilter(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                    >
                      <option value="nouveau">🔹 Nouveau (Recommandé)</option>
                      <option value="tous">🎯 Tous les statuts</option>
                      <option value="contacte_wa">🟢 Contacté WhatsApp</option>
                      <option value="en_discussion">🟠 En discussion</option>
                      <option value="converti">✅ Converti</option>
                    </select>
                  </div>

                  {/* Source */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                      Source
                    </label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                    >
                      {SOURCES_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Opérateur */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                      Opérateur
                    </label>
                    <select
                      value={operateurFilter}
                      onChange={(e) => setOperateurFilter(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                    >
                      {OPERATEURS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quartier */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                      Quartier / Marché
                    </label>
                    <select
                      value={quartierFilter}
                      onChange={(e) => setQuartierFilter(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                    >
                      <option value="tous">📍 Tous les quartiers</option>
                      {uniqueQuartiers.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  {/* Limite d'envoi / Volume */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                      Volume à envoyer
                    </label>
                    <select
                      value={campagneLimit}
                      onChange={(e) => setCampagneLimit(e.target.value === 'tous' ? 'tous' : Number(e.target.value))}
                      style={{
                        width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1',
                        fontSize: 12, fontWeight: 800, color: '#166534', background: '#F0FDF4',
                      }}
                    >
                      <option value="tous">Tous les ciblés ({filteredLeads.filter(l => l.statut !== 'desinscrit' && l.statut !== 'invalide').length})</option>
                      <option value={10}>10 prospects</option>
                      <option value={25}>25 prospects</option>
                      <option value={50}>50 prospects (Recommandé / jour)</option>
                      <option value={100}>100 prospects</option>
                      <option value={200}>200 prospects</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 6 }}>
                  2. Titre de la Campagne
                </label>
                <input
                  type="text"
                  value={campagneTitre}
                  onChange={(e) => setCampagneTitre(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 6 }}>
                  3. Choisir un Modèle Pré-Rédigé Adapté au Marché Sénégalais
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplate(tpl)
                        setCampagneMessage(tpl.texte)
                        setCampagneCanal(tpl.canal as any)
                      }}
                      style={{
                        padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                        border: selectedTemplate.id === tpl.id ? '2px solid #16A34A' : '1px solid #E2E8F0',
                        background: selectedTemplate.id === tpl.id ? '#F0FDF4' : '#F8FAFC',
                        color: selectedTemplate.id === tpl.id ? '#166534' : '#1C2B4A',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {tpl.titre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alerte de cohérence Métier vs Template */}
              {catFilter === 'auto-moto' && /tailles|modèles|collections|robes|vêtements/i.test(campagneMessage) && (
                <div style={{
                  background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                    ⚠️ Vous ciblez les <strong>Véhicules</strong> mais le message sélectionné parle de <strong>Mode / Vêtements</strong>.
                  </span>
                  <button
                    onClick={() => {
                      const autoTpl = templates.find((t) => t.id === 'auto_vehicules')
                      if (autoTpl) {
                        setSelectedTemplate(autoTpl)
                        setCampagneMessage(autoTpl.texte)
                      }
                    }}
                    style={{
                      padding: '4px 12px', background: '#fff', border: '1px solid #F59E0B',
                      borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#B45309', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    Appliquer le template Véhicules 🚗
                  </button>
                </div>
              )}

              {catFilter === 'immo' && /tailles|modèles|collections|robes|vêtements/i.test(campagneMessage) && (
                <div style={{
                  background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                    ⚠️ Vous ciblez l'<strong>Immobilier</strong> mais le message sélectionné parle de <strong>Mode / Vêtements</strong>.
                  </span>
                  <button
                    onClick={() => {
                      const immoTpl = templates.find((t) => t.id === 'immo_agences')
                      if (immoTpl) {
                        setSelectedTemplate(immoTpl)
                        setCampagneMessage(immoTpl.texte)
                      }
                    }}
                    style={{
                      padding: '4px 12px', background: '#fff', border: '1px solid #F59E0B',
                      borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#B45309', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    Appliquer le template Immobilier 🏠
                  </button>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 6 }}>
                  4. Corps du Message (Variables : {'{nom_boutique}'}, {'{prenom}'}, {'{quartier}'}, {'{lien_boutique}'} | Spintax Anti-Spam : {'{Salam|Bonjour|Hello}'})
                </label>
                <textarea
                  rows={9}
                  value={campagneMessage}
                  onChange={(e) => setCampagneMessage(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1',
                    fontSize: 13, outline: 'none', lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleLancerCampagne(true)}
                  disabled={isSending}
                  style={{
                    flex: 1, padding: '12px 18px', background: '#F8FAFC', color: '#1C2B4A',
                    border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  🧪 Tester en Mode Simulation
                </button>

                <button
                  onClick={() => handleLancerCampagne(false)}
                  disabled={isSending}
                  style={{
                    flex: 1, padding: '12px 18px', background: '#16A34A', color: '#fff',
                    border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14,
                    cursor: isSending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                  }}
                >
                  {isSending ? 'Envoi en cours...' : '🚀 Lancer la Campagne Réelle'}
                </button>
              </div>
            </div>
          </div>

          {/* Aperçu en direct du message rendu */}
          <div style={{ background: '#FFF7ED', border: '2px solid #FFEDD5', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#C75B00', margin: '0 0 12px' }}>
              📱 Aperçu WhatsApp Réel (Destinataire Exemple : {previewLead.nom_boutique})
            </h2>

            <div style={{
              background: '#DCF8C6', borderRadius: 12, padding: '16px', color: '#000',
              fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {previewText}
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #FED7AA' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#9A3412', display: 'block', marginBottom: 4 }}>
                💡 Recommandations Anti-Ban WhatsApp Sénégal :
              </span>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                <li>Envoyez par vagues de 30 à 50 contacts par jour.</li>
                <li>Le système applique automatiquement une temporisation de 1.5s entre chaque message.</li>
                <li>Privilégiez les messages chaleureux mentionnant le nom de la boutique.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 4 : HISTORIQUE & LOGS D'ENVOIS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={20} color="#64748B" /> Journal des Messages &amp; Campagnes Envoyés
            </h2>
            <button
              onClick={loadLogs}
              style={{
                padding: '6px 12px', background: '#F8FAFC', border: '1px solid #CBD5E1',
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <RefreshCw size={13} /> Actualiser
            </button>
          </div>

          {loadingLogs ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>Chargement des logs...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>Aucun message envoyé pour l&apos;instant.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Destinataire</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Canal</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Extrait Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1C2B4A' }}>
                        {log.nom_boutique || log.destinataire}
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: 11, fontWeight: 800 }}>
                        {log.canal}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                          background: log.statut === 'envoye' ? '#DCFCE7' : log.statut === 'simule' ? '#EFF6FF' : '#FEE2E2',
                          color: log.statut === 'envoye' ? '#166534' : log.statut === 'simule' ? '#1E40AF' : '#991B1B',
                        }}>
                          {log.statut}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message_envoye}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 5 : CENTRE DE CONTRÔLE & CRONS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'control' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Actions & Refresh */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 4px' }}>
                🎛️ Centre de Contrôle &amp; Automatisations en Direct
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Déclenchez manuellement le scraping de prospection, lancez les vagues de relance WhatsApp et suivez l&apos;état des crons d&apos;arrière-plan.
              </p>
            </div>

            <button
              onClick={fetchCronStatus}
              disabled={loadingCronData}
              style={{
                background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px 16px',
                borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <RefreshCw size={16} className={loadingCronData ? 'animate-spin' : ''} />
              <span>{loadingCronData ? 'Actualisation...' : 'Actualiser le statut'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            {/* CARTE 1 : SCRAPER DE PROSPECTION DAKAR */}
            <div style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                    🚀 Scraping &amp; Sourcing de Marchés
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Collecte de commerces ciblés par zone
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Zone / Marché cible
                  </label>
                  <select
                    value={scrapingZone}
                    onChange={(e) => setScrapingZone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="Sandaga">Marché Sandaga (Tech / Téléphonie)</option>
                    <option value="HLM">Marché HLM (Mode / Bazin)</option>
                    <option value="Centenaire">Centenaire / Allées (Grossistes Chine)</option>
                    <option value="Colobane">Colobane (Électronique)</option>
                    <option value="Plateau">Dakar Plateau (Boutiques &amp; Luxe)</option>
                    <option value="Maristes">Les Maristes (Alimentation &amp; Supérettes)</option>
                    <option value="Tilène">Marché Tilène (Cosmétique &amp; Beauté)</option>
                    <option value="Thiès">Thiès (Commerce Général)</option>
                    <option value="Touba">Touba (Commerces &amp; Quincaillerie)</option>
                    <option value="all">🌐 Tout Dakar &amp; Régions</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Limite
                  </label>
                  <select
                    value={scrapingLimite}
                    onChange={(e) => setScrapingLimite(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value={10}>10 leads</option>
                    <option value={30}>30 leads</option>
                    <option value={50}>50 leads</option>
                    <option value={100}>100 leads</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunScraping}
                disabled={isScraping}
                style={{
                  padding: '12px 18px', background: '#2563EB', color: '#fff', border: 'none',
                  borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: isScraping ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Zap size={18} />
                <span>{isScraping ? 'Scraping en cours...' : 'Lancer le Scraping Immédiat'}</span>
              </button>

              {scrapingResult && (
                <div style={{
                  padding: 14,
                  background: scrapingResult.succes === false ? '#FEF2F2' : '#EFF6FF',
                  border: scrapingResult.succes === false ? '1px solid #FECACA' : '1px solid #BFDBFE',
                  borderRadius: 10,
                  fontSize: 13,
                  color: scrapingResult.succes === false ? '#991B1B' : '#1E40AF',
                }}>
                  <strong>{scrapingResult.succes === false ? '❌ Erreur de Scraping :' : '✅ Résultat du Scraping :'}</strong>
                  {scrapingResult.error ? (
                    <p style={{ margin: '4px 0 0' }}>{scrapingResult.error}</p>
                  ) : (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                      <li><strong>{scrapingResult.ajoutes}</strong> nouveaux leads injectés dans le CRM</li>
                      <li><strong>{scrapingResult.ignores}</strong> doublons ou numéros invalides écartés</li>
                      <li>Total annonces analysées : <strong>{scrapingResult.totalScrapes ?? 0}</strong></li>
                      <li>Zone traitée : <strong>{scrapingResult.zone}</strong></li>
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* CARTE 2 : DÉCLENCHEUR DES RELANCES AUTOMATIQUES */}
            <div style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={22} color="#16A34A" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                    🔔 Relances Automatisées WhatsApp
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Dettes clients &amp; Abonnements marchands
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => handleRunRelances('marchands')}
                  disabled={isRelancing}
                  style={{
                    padding: '11px 16px', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#1E293B',
                    borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: isRelancing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>⏰ Relances Marchands (J+1, J+7, J+25)</span>
                  <span style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>Exécuter</span>
                </button>

                <button
                  onClick={() => handleRunRelances('dettes')}
                  disabled={isRelancing}
                  style={{
                    padding: '11px 16px', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#1E293B',
                    borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: isRelancing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>📒 Relances Carnet de Dettes (&quot;Bor&quot;)</span>
                  <span style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>Exécuter</span>
                </button>

                <button
                  onClick={() => handleRunRelances('tout')}
                  disabled={isRelancing}
                  style={{
                    padding: '12px 18px', background: '#16A34A', color: '#fff', border: 'none',
                    borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: isRelancing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
                  }}
                >
                  <RefreshCw size={18} className={isRelancing ? 'animate-spin' : ''} />
                  <span>{isRelancing ? 'Envoi en cours...' : '⚡ Tout Exécuter Maintenant'}</span>
                </button>
              </div>

              {relancesResult && (
                <div style={{ padding: 14, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, fontSize: 13, color: '#065F46' }}>
                  <strong>✅ Rapport d&apos;exécution des relances :</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                    {relancesResult.resultats?.marchands?.stats && (
                      <li>
                        Marchands relancés : <strong>{relancesResult.resultats.marchands.stats.total}</strong> (J+1: {relancesResult.resultats.marchands.stats.j1}, J+7: {relancesResult.resultats.marchands.stats.j7}, J+25: {relancesResult.resultats.marchands.stats.j25})
                      </li>
                    )}
                    {relancesResult.resultats?.dettes && (
                      <li>
                        Clients débiteurs relancés : <strong>{relancesResult.resultats.dettes.relancesEnvoyees}</strong>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3 : ASSISTANT MARCHAND & SÉCURITÉ */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={22} color="#9333EA" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                  🤖 Assistant Marchand WhatsApp (&quot;Bot Taf-Taf&quot; &amp; &quot;+produit&quot;)
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Commandes conversationnelles directes et gestion de catalogue
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>🏪</span>
                  <strong style={{ fontSize: 14, color: '#1E293B' }}>Création de Boutique en 30s</strong>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Un commerçant tape <code>créer boutique</code> sur WhatsApp. Le bot lui demande son nom, quartier et secteur, puis génère automatiquement sa vitrine en ligne avec 30 jours offerts.
                </p>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '3px 8px', borderRadius: 6 }}>
                  🟢 Opérationnel 24h/24
                </span>
              </div>

              <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>🛍️</span>
                  <strong style={{ fontSize: 14, color: '#1E293B' }}>Ajout de Produit Sécurisé (+produit)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Un marchand tape <code>+produit</code> pour ajouter un article à son catalogue. Le système vérifie en base que son numéro est bien celui du propriétaire avant d&apos;autoriser l&apos;ajout.
                </p>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
                  🔒 Contrôle de Propriété Sécurisé
                </span>
              </div>

              <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>🛡️</span>
                  <strong style={{ fontSize: 14, color: '#1E293B' }}>Désinscription Stricte (STOP)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Si un destinataire répond <code>STOP</code>, son numéro est immédiatement inscrit dans la table de blacklist et marqué <em>désinscrit</em> dans le CRM. Aucun message futur ne lui est envoyé.
                </p>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '3px 8px', borderRadius: 6 }}>
                  🚫 Blacklist Instantanée
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4 : MONITORING DES CRONS SYSTÈME */}
          {cronData && (
            <div style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                  📊 État des Crons d&apos;Arrière-Plan &amp; Statistiques Globales
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Blacklist active : <strong>{cronData.stats?.blacklist || 0}</strong> numéros protégés
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {cronData.crons && Object.entries(cronData.crons).map(([key, item]: [string, any]) => (
                  <div key={key} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, color: '#1E293B' }}>{item.nom}</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>
                        {item.statut}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 6px' }}>{item.description}</p>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Fréquence : {item.frequence}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 6 : LISTE NOIRE & BLACKLIST WHATSAPP
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'blacklist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* En-tête & Actions Blacklist */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ban size={22} color="#DC2626" /> Gestion de la Liste Noire &amp; Conformité Anti-Spam
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Tous les numéros ayant répondu <code>STOP</code> sur WhatsApp ou désinscrits manuellement sont enregistrés ici.
                Le système vérifie cette liste et <strong>bloque tout envoi automatique ou relance</strong> vers ces contacts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={loadBlacklist}
                disabled={loadingBlacklist}
                style={{
                  background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px 16px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <RefreshCw size={16} className={loadingBlacklist ? 'animate-spin' : ''} />
                <span>{loadingBlacklist ? 'Actualisation...' : 'Actualiser'}</span>
              </button>

              <button
                onClick={exportBlacklistCSV}
                style={{
                  background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px 16px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowAddBlacklistModal(true)}
                style={{
                  background: '#DC2626', color: '#fff', border: 'none', padding: '10px 18px',
                  borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
                }}
              >
                <ShieldAlert size={16} />
                <span>+ Ajouter à la Blacklist</span>
              </button>
            </div>
          </div>

          {/* Barre de Recherche Blacklist */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '14px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
              <Search size={18} color="#94A3B8" />
              <input
                type="text"
                placeholder="Rechercher par numéro de téléphone, motif, nom de boutique ou contact..."
                value={blacklistSearch}
                onChange={(e) => setBlacklistSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>

            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
              <strong>{filteredBlacklist.length}</strong> numéro{filteredBlacklist.length > 1 ? 's' : ''} sur liste noire
            </span>
          </div>

          {/* Tableau Blacklist */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Numéro Blacklisté</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Boutique / Contact Lié</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Motif du Blocage</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Date d&apos;Inscription</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Statut Sécurité</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlacklist.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                        {loadingBlacklist ? 'Chargement de la liste noire...' : 'Aucun numéro sur la liste noire.'}
                      </td>
                    </tr>
                  ) : (
                    filteredBlacklist.map((item) => (
                      <tr key={item.phone} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong style={{ fontSize: 14, color: '#DC2626' }}>+{item.phone}</strong>
                            {item.operateur && (
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626' }}>
                                {item.operateur}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {item.nom_boutique ? (
                            <div>
                              <strong style={{ color: '#1C2B4A' }}>{item.nom_boutique}</strong>
                              {item.contact_nom && <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>👤 {item.contact_nom}</span>}
                              {item.quartier && <span style={{ fontSize: 11, color: '#94A3B8' }}>📍 {item.quartier}</span>}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Non renseigné dans le CRM</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                            background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
                            display: 'inline-block',
                          }}>
                            {item.reason === 'optout' ? 'STOP WhatsApp (Opt-Out)' : item.reason}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748B' }}>
                          {new Date(item.created_at).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                            background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <Lock size={12} /> Bloqué (0 envoi)
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleRemoveBlacklist(item.phone)}
                            title="Débloquer et retirer de la liste noire"
                            style={{
                              padding: '6px 12px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                              borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Unlock size={13} /> Débloquer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION PROSPECT EN BASE */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 560, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pencil size={20} color="#2563EB" /> Modifier le Prospect en Base
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nom_boutique}
                  onChange={(e) => setEditForm({ ...editForm, nom_boutique: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Numéro WhatsApp / Tel *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.telephone}
                    onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Contact Responsable
                  </label>
                  <input
                    type="text"
                    value={editForm.contact_nom}
                    onChange={(e) => setEditForm({ ...editForm, contact_nom: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Statut CRM
                  </label>
                  <select
                    value={editForm.statut}
                    onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="contacte_wa">Contacté WhatsApp</option>
                    <option value="contacte_email">Contacté Email</option>
                    <option value="en_discussion">En discussion</option>
                    <option value="converti">Converti (Boutique Active)</option>
                    <option value="desinscrit">Désinscrit / Refus</option>
                    <option value="invalide">Invalide / Emploi (Hors Cible)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Catégorie
                  </label>
                  <select
                    value={editForm.categorie}
                    onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="mode">Mode &amp; Habits</option>
                    <option value="tech">Téléphonie &amp; Tech</option>
                    <option value="superette">Alimentation</option>
                    <option value="quincaillerie">Quincaillerie</option>
                    <option value="cosmetique">Cosmétique</option>
                    <option value="grossiste">Grossiste Chine</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Ville
                  </label>
                  <input
                    type="text"
                    value={editForm.ville}
                    onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Quartier / Marché
                  </label>
                  <input
                    type="text"
                    value={editForm.quartier}
                    onChange={(e) => setEditForm({ ...editForm, quartier: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Notes CRM internes
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes de prospection, rappels, détails boutique..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    padding: '10px 18px', background: '#2563EB', color: '#fff', border: 'none',
                    borderRadius: 8, fontWeight: 800, cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSavingEdit ? 'Sauvegarde...' : '💾 Mettre à jour en Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT NUMÉRO BLACKLIST */}
      {showAddBlacklistModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 480, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={22} /> Inscrire un Numéro sur la Blacklist
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBlacklistModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Numéro de Téléphone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 77 123 45 67 ou 221771234567"
                  value={blacklistAddForm.phone}
                  onChange={(e) => setBlacklistAddForm({ ...blacklistAddForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Motif / Raison du blocage
                </label>
                <select
                  value={blacklistAddForm.reason}
                  onChange={(e) => setBlacklistAddForm({ ...blacklistAddForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="STOP / Opt-Out (WhatsApp)">STOP / Opt-Out (Demande WhatsApp)</option>
                  <option value="Plainte / Refus explicite">Plainte / Refus explicite</option>
                  <option value="Numéro erroné / Invalide">Numéro erroné / Invalide</option>
                  <option value="Désinscription manuelle Admin">Désinscription manuelle Admin</option>
                  <option value="Hors Cible">Hors Cible / Particulier</option>
                </select>
              </div>

              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                ℹ️ Ce numéro sera immédiatement exclu de toutes les campagnes futures, relances et notifications WhatsApp.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddBlacklistModal(false)}
                  style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingBlacklist}
                  style={{
                    padding: '10px 18px', background: '#DC2626', color: '#fff', border: 'none',
                    borderRadius: 8, fontWeight: 800, cursor: isAddingBlacklist ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isAddingBlacklist ? 'Ajout...' : '🚫 Inscrire en Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT PROSPECT UNIQUE */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 500, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px' }}>
              ➕ Ajouter un Nouveau Prospect
            </h3>

            <form onSubmit={handleAddSingle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dakar Fashion Store"
                  value={addForm.nom_boutique}
                  onChange={(e) => setAddForm({ ...addForm, nom_boutique: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Numéro WhatsApp / Tel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 77 123 45 67"
                    value={addForm.telephone}
                    onChange={(e) => setAddForm({ ...addForm, telephone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Contact Responsable
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Modou Fall"
                    value={addForm.contact_nom}
                    onChange={(e) => setAddForm({ ...addForm, contact_nom: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Catégorie
                  </label>
                  <select
                    value={addForm.categorie}
                    onChange={(e) => setAddForm({ ...addForm, categorie: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="mode">Mode &amp; Habits</option>
                    <option value="tech">Téléphonie &amp; Tech</option>
                    <option value="superette">Alimentation</option>
                    <option value="quincaillerie">Quincaillerie</option>
                    <option value="cosmetique">Cosmétique</option>
                    <option value="grossiste">Grossiste Chine</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    Quartier / Marché
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sandaga / HLM"
                    value={addForm.quartier}
                    onChange={(e) => setAddForm({ ...addForm, quartier: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
