import { useState } from 'react'
import type { Lead, StatsLeads, EditLeadFormState, AddLeadFormState, TabType } from './types'

interface HookParams {
  secret: string
  leads: Lead[]
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  stats: StatsLeads
  setStats: React.Dispatch<React.SetStateAction<StatsLeads>>
  limit: number | string
  editForm: EditLeadFormState
  setShowEditModal: (v: boolean) => void
  selectedLeadIds: string[]
  setSelectedLeadIds: React.Dispatch<React.SetStateAction<string[]>>
  rawImportText: string
  setRawImportText: (v: string) => void
  importCat: string
  importVille: string
  importQuartier: string
  setActiveTab: (t: TabType) => void
  addForm: AddLeadFormState
  setAddForm: React.Dispatch<React.SetStateAction<AddLeadFormState>>
  setShowAddModal: (v: boolean) => void
  showToast: (msg: string) => void
}

export function useProspectionLeads({
  secret,
  setLeads,
  stats,
  setStats,
  limit,
  editForm,
  setShowEditModal,
  selectedLeadIds,
  setSelectedLeadIds,
  rawImportText,
  setRawImportText,
  importCat,
  importVille,
  importQuartier,
  setActiveTab,
  addForm,
  setAddForm,
  setShowAddModal,
  showToast,
}: HookParams) {
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isAutoSourcing, setIsAutoSourcing] = useState(false)
  const [isCleaningLeads, setIsCleaningLeads] = useState(false)

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
    } catch (err) { console.warn('[Nopalou:ProspectionClient:reloadLeads]', err); }
    finally {
      setLoadingLeads(false)
    }
  }

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
        showToast('Prospect mis à jour avec succès dans la base !')
        setShowEditModal(false)
        await reloadLeads()
      } else {
        showToast(`${data.error || `Erreur de modification (${res.status})`}`)
      }
    } catch (err: any) {
      showToast(`Erreur: ${err.message || 'Erreur de connexion'}`)
    } finally {
      setIsSavingEdit(false)
    }
  }

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
        showToast('Statut du prospect mis à jour')
      } else {
        showToast(`${data.error || 'Erreur lors de la mise à jour'}`)
      }
    } catch (err: any) {
      showToast(`Erreur: ${err.message || 'Erreur de connexion'}`)
    }
  }

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
        showToast('Prospect supprimé')
        await reloadLeads()
      } else {
        showToast(`${data.error || 'Erreur lors de la suppression'}`)
      }
    } catch (err: any) {
      showToast(`Erreur: ${err.message || 'Erreur de connexion'}`)
    }
  }

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
        showToast(`${selectedLeadIds.length} prospects supprimés`)
      }
    } catch (err) { console.warn('[Nopalou:ProspectionClient:handleBatchDelete]', err); }
  }

  const handleAutoSource = async () => {
    setIsAutoSourcing(true)
    try {
      const res = await fetch('/api/prospection/leads/auto-source', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Auto-sourcing terminé : ${data.inseres} nouveaux leads ajoutés (${data.doublons} déjà existants)`)
        await reloadLeads()
      } else {
        showToast(`Erreur: ${data.error}`)
      }
    } catch (e: any) {
      showToast(`Échec de l'auto-sourcing: ${e.message}`)
    } finally {
      setIsAutoSourcing(false)
    }
  }

  const handleImportVrac = async () => {
    if (!rawImportText.trim()) {
      showToast('Veuillez coller du texte ou une liste de numéros')
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
        showToast(`${data.inseres} nouveaux prospects importés avec succès (${data.doublons} doublons ignorés)`)
        setRawImportText('')
        await reloadLeads()
        setActiveTab('crm')
      } else {
        showToast(`${data.error}`)
      }
    } catch (e: any) {
      showToast(`Erreur d'importation: ${e.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleNettoyerLeads = async () => {
    setIsCleaningLeads(true)
    try {
      const res = await fetch('/api/prospection/leads/nettoyer', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        showToast(data.message || 'Base de leads nettoyée et enrichie avec succès !')
        await reloadLeads()
      } else {
        showToast(`${data.error || 'Erreur lors du nettoyage'}`)
      }
    } catch (e: any) {
      showToast(`Échec du nettoyage: ${e.message}`)
    } finally {
      setIsCleaningLeads(false)
    }
  }

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
        showToast('Prospect ajouté avec succès !')
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
        showToast(`${data.error}`)
      }
    } catch (err: any) {
      showToast(`${err.message}`)
    }
  }

  return {
    loadingLeads,
    isSavingEdit,
    isImporting,
    isAutoSourcing,
    isCleaningLeads,
    reloadLeads,
    handleSaveEdit,
    handleStatutChange,
    handleDeleteLead,
    handleBatchDelete,
    handleAutoSource,
    handleImportVrac,
    handleNettoyerLeads,
    handleAddSingle,
  }
}
