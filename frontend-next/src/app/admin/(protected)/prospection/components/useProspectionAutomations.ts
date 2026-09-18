import { useState } from 'react'
import type {
  Lead, BlacklistItem, AddBlacklistFormState, AutoCollecteResult,
  ScrapingResult, RelancesResult, AuditQualiteData, AssainirImmoResult
} from './types'

interface HookParams {
  secret: string
  reloadLeads: () => Promise<void>
  blacklistAddForm: AddBlacklistFormState
  setBlacklistAddForm: React.Dispatch<React.SetStateAction<AddBlacklistFormState>>
  setBlacklist: React.Dispatch<React.SetStateAction<BlacklistItem[]>>
  setShowAddBlacklistModal: (v: boolean) => void
  campaignTargetLeads: Lead[]
  nbDejaContactes: number
  campagneTitre: string
  campagneCanal: 'whatsapp' | 'email'
  campagneMessage: string
  scrapingZone: string
  scrapingLimite: number
  showToast: (msg: string) => void
}

export function useProspectionAutomations({
  secret,
  reloadLeads,
  blacklistAddForm,
  setBlacklistAddForm,
  setBlacklist,
  setShowAddBlacklistModal,
  campaignTargetLeads,
  nbDejaContactes,
  campagneTitre,
  campagneCanal,
  campagneMessage,
  scrapingZone,
  scrapingLimite,
  showToast,
}: HookParams) {
  const [loadingBlacklist, setLoadingBlacklist] = useState(false)
  const [isAddingBlacklist, setIsAddingBlacklist] = useState(false)
  const [isAutoCollecting, setIsAutoCollecting] = useState(false)
  const [collectingTarget, setCollectingTarget] = useState<string | null>(null)
  const [autoCollecteResult, setAutoCollecteResult] = useState<AutoCollecteResult | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [campagnesList, setCampagnesList] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null)
  const [isRelancing, setIsRelancing] = useState(false)
  const [relancesResult, setRelancesResult] = useState<RelancesResult | null>(null)
  const [cronData, setCronData] = useState<any>(null)
  const [loadingCronData, setLoadingCronData] = useState(false)
  const [auditQualiteData, setAuditQualiteData] = useState<AuditQualiteData | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [isAssainissantImmo, setIsAssainissantImmo] = useState(false)
  const [assainirImmoResult, setAssainirImmoResult] = useState<AssainirImmoResult | null>(null)

  const fetchAuditQualite = async () => {
    setIsAuditing(true)
    try {
      const res = await fetch('/api/prospection/audit-qualite', {
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        const data = await res.json()
        setAuditQualiteData(data.audit || data)
      }
    } catch (err) {
      console.warn('[Nopalou:ProspectionClient:fetchAuditQualite]', err)
    } finally {
      setIsAuditing(false)
    }
  }

  const handleAssainirImmo = async () => {
    setIsAssainissantImmo(true)
    setAssainirImmoResult(null)
    try {
      const res = await fetch('/api/prospection/leads/assainir-immo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAssainirImmoResult(data)
        if (data.auditApres) {
          setAuditQualiteData(data.auditApres)
        }
        showToast(`Assainissement terminé : ${data.nomsAssainis} noms corrigés, +${data.leadsImmoImportes} leads immo importés !`)
        await reloadLeads()
      } else {
        showToast(`Erreur assainissement: ${data.error || 'Échec'}`)
      }
    } catch (e: any) {
      showToast(`Erreur réseau: ${e.message}`)
    } finally {
      setIsAssainissantImmo(false)
    }
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
    } catch (err) { console.warn('[Nopalou:ProspectionClient:fetchCronStatus]', err); }
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
        showToast(`Scraping terminé : ${data.ajoutes} nouveaux leads ajoutés`)
        await reloadLeads()
        await fetchCronStatus()
      } else {
        showToast(`Erreur scraping: ${data.error}`)
      }
    } catch (e: any) {
      showToast(`Erreur: ${e.message}`)
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
        showToast(`Relances exécutées : ${total} messages WhatsApp envoyés`)
        await fetchCronStatus()
      } else {
        showToast(`Erreur relances: ${data.error}`)
      }
    } catch (e: any) {
      showToast(`Erreur: ${e.message}`)
    } finally {
      setIsRelancing(false)
    }
  }

  const handleLancerAutoCollecte = async (source: 'all' | 'osm' | 'dorking' = 'all', target: string = 'all') => {
    setIsAutoCollecting(true)
    setCollectingTarget(target)
    setAutoCollecteResult(null)
    try {
      const res = await fetch('/api/prospection/auto-collecte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ source, target }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAutoCollecteResult(data)
        if (data.totalAjoutes > 0) {
          showToast(`Collecte terminée : +${data.totalAjoutes} nouveaux commerces ajoutés !`)
        } else {
          showToast(`Base déjà à jour : ${data.totalTraites || 0} commerces géolocalisés vérifiés (tous déjà présents)`)
        }
        await reloadLeads()
      } else {
        showToast(`Erreur: ${data.error || 'Échec de la collecte'}`)
      }
    } catch (e: any) {
      showToast(`Erreur réseau: ${e.message}`)
    } finally {
      setIsAutoCollecting(false)
      setCollectingTarget(null)
    }
  }

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
    } catch (err) { console.warn('[Nopalou:ProspectionClient:loadBlacklist]', err); }
    finally {
      setLoadingBlacklist(false)
    }
  }

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blacklistAddForm.phone.trim()) {
      showToast('Numéro de téléphone requis')
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
        showToast(`Numéro ${data.phone} inscrit sur la Blacklist`)
        setShowAddBlacklistModal(false)
        setBlacklistAddForm({ phone: '', reason: 'STOP / Opt-Out (WhatsApp)' })
        await loadBlacklist()
        await reloadLeads()
      } else {
        showToast(`${data.error}`)
      }
    } catch (err: any) {
      showToast(`Erreur: ${err.message}`)
    } finally {
      setIsAddingBlacklist(false)
    }
  }

  const handleRemoveBlacklist = async (phone: string) => {
    if (!confirm(`Débloquer et retirer le numéro +${phone} de la liste noire ?`)) return
    try {
      const res = await fetch(`/api/prospection/blacklist/${phone}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        setBlacklist((prev) => prev.filter((b) => b.phone !== phone))
        showToast(`Numéro +${phone} débloqué et retiré de la liste noire`)
        await reloadLeads()
      } else {
        showToast('Erreur lors du déblocage')
      }
    } catch (_) {
      showToast('Erreur réseau')
    }
  }

  const handleLancerCampagne = async (simulation: boolean) => {
    const targetIds = campaignTargetLeads.map((l) => l.id)
    if (!targetIds.length) {
      showToast('Aucun prospect valide ciblé pour cette campagne')
      return
    }

    let confirmMsg = ''
    if (simulation) {
      confirmMsg = `Simuler l'envoi de la campagne sur ${targetIds.length} prospects ciblés ?`
    } else if (nbDejaContactes > 0) {
      confirmMsg = `ATTENTION RELANCE :\n\nCette campagne cible ${targetIds.length} prospects, dont ${nbDejaContactes} DÉJÀ CONTACTÉS auparavant !\n\nConfirmez-vous l'envoi de ce nouveau message à ces ${nbDejaContactes} marchands déjà prospectés ?`
    } else {
      confirmMsg = `LANCER EN RÉEL l'envoi de la campagne sur ${targetIds.length} NOUVEAUX prospects (100% jamais contactés auparavant) ?`
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
          showToast(`${data.resultat.message}`)
        } else {
          showToast(`Campagne terminée : ${data.resultat.nbSucces} envoyés (${data.resultat.nbEchecs} échecs)`)
        }
        await reloadLeads()
      } else {
        showToast(`${data.error}`)
      }
    } catch (e: any) {
      showToast(`Erreur de campagne: ${e.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const loadLogs = async () => {
    setLoadingLogs(true)
    try {
      const [resLogs, resCampagnes] = await Promise.all([
        fetch('/api/prospection/logs', { headers: { 'x-admin-secret': secret } }),
        fetch('/api/prospection/campagnes', { headers: { 'x-admin-secret': secret } }),
      ])
      if (resLogs.ok) {
        const data = await resLogs.json()
        setLogs(data.logs || [])
      }
      if (resCampagnes.ok) {
        const data = await resCampagnes.json()
        setCampagnesList((data.campagnes || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      }
    } catch (err) { console.warn('[Nopalou:ProspectionClient:loadLogs]', err); }
    setLoadingLogs(false)
  }

  return {
    loadingBlacklist,
    isAddingBlacklist,
    isAutoCollecting,
    collectingTarget,
    autoCollecteResult,
    isSending,
    logs,
    campagnesList,
    loadingLogs,
    isScraping,
    scrapingResult,
    isRelancing,
    relancesResult,
    cronData,
    loadingCronData,
    fetchCronStatus,
    handleRunScraping,
    handleRunRelances,
    handleLancerAutoCollecte,
    loadBlacklist,
    handleAddBlacklist,
    handleRemoveBlacklist,
    handleLancerCampagne,
    loadLogs,
    auditQualiteData,
    isAuditing,
    isAssainissantImmo,
    assainirImmoResult,
    fetchAuditQualite,
    handleAssainirImmo,
  }
}
