'use client'

import React, { useState, useMemo } from 'react'
import type {
  Lead, StatsLeads, TemplateMsg, BlacklistItem, TabType,
  EditLeadFormState, AddLeadFormState, AddBlacklistFormState, ProspectionProps
} from './components'
import {
  generatePreviewText, exportLeadsCSV, exportBlacklistCSV,
  computeFilteredLeads, computeSortedLeads, computeCampaignTargetLeads,
  computeUniqueQuartiers, computeFilteredBlacklist,
  useProspectionLeads, useProspectionAutomations,
  ProspectionHeader, ProspectionTabBar, ProspectionTabCrm,
  ProspectionTabImport, ProspectionTabCampagnes, ProspectionTabLogs,
  ProspectionTabControl, ProspectionTabBlacklist,
  ModalEditLead, ModalAddBlacklist, ModalAddLead
} from './components'

export default function ProspectionClient({
  initialLeads,
  initialStats,
  templates,
  dorking,
  secret,
}: ProspectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('crm')
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [stats, setStats] = useState<StatsLeads>(initialStats)
  const [toast, setToast] = useState<string | null>(null)
  const [limit, setLimit] = useState<number | string>(200)

  // Modales
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<EditLeadFormState>({
    id: '', nom_boutique: '', contact_nom: '', telephone: '',
    email: '', categorie: 'mode', ville: 'Dakar', quartier: 'Dakar',
    statut: 'nouveau', notes: '',
  })

  // Blacklist
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [blacklistSearch, setBlacklistSearch] = useState('')
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false)
  const [blacklistAddForm, setBlacklistAddForm] = useState<AddBlacklistFormState>({
    phone: '', reason: 'STOP / Opt-Out (WhatsApp)',
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
  const [sortBy, setSortBy] = useState<'date' | 'priorite' | 'fit' | 'qualite'>('priorite')

  // Modal Ajout Unique
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<AddLeadFormState>({
    nom_boutique: '', contact_nom: '', telephone: '', email: '',
    categorie: 'mode', ville: 'Dakar', quartier: 'Dakar', notes: '',
  })

  // Import Vrac
  const [rawImportText, setRawImportText] = useState('')
  const [importCat, setImportCat] = useState('mode')
  const [importVille, setImportVille] = useState('Dakar')
  const [importQuartier, setImportQuartier] = useState('Dakar')

  // Campagne Dispatcher
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMsg>(templates[0] || {
    id: 'custom', titre: 'Message Personnalisé', canal: 'whatsapp',
    categorie: 'general', texte: 'Salam {nom_boutique} ! Découvrez notre solution : https://nopalou.com'
  })
  const [campagneMessage, setCampagneMessage] = useState(selectedTemplate.texte)
  const [campagneCanal, setCampagneCanal] = useState<'whatsapp' | 'email'>('whatsapp')
  const [campagneTitre, setCampagneTitre] = useState('Campagne WhatsApp Prospection Dakar')

  // Scraping
  const [scrapingZone, setScrapingZone] = useState('Sandaga')
  const [scrapingLimite, setScrapingLimite] = useState(30)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Filtrage et tris mémoïsés
  const filteredLeads = useMemo(() => {
    return computeFilteredLeads(leads, catFilter, statutFilter, sourceFilter, operateurFilter, quartierFilter, search)
  }, [leads, catFilter, statutFilter, sourceFilter, operateurFilter, quartierFilter, search])

  const sortedFilteredLeads = useMemo(() => {
    return computeSortedLeads(filteredLeads, sortBy)
  }, [filteredLeads, sortBy])

  const campaignTargetLeads = useMemo(() => {
    return computeCampaignTargetLeads(leads, selectedLeadIds, filteredLeads, campagneLimit)
  }, [leads, selectedLeadIds, filteredLeads, campagneLimit])

  const nbDejaContactes = useMemo(() => {
    return campaignTargetLeads.filter((l) => l.statut !== 'nouveau').length
  }, [campaignTargetLeads])

  const uniqueQuartiers = useMemo(() => computeUniqueQuartiers(leads), [leads])

  const filteredBlacklist = useMemo(() => {
    return computeFilteredBlacklist(blacklist, blacklistSearch)
  }, [blacklist, blacklistSearch])

  const previewLead = filteredLeads[0] || {
    nom_boutique: 'Dakar Chic Boutique', contact_nom: 'Fatou',
    quartier: 'HLM 5', categorie: 'mode', telephone: '221771234567',
  }

  const previewText = useMemo(() => {
    return generatePreviewText(campagneMessage, previewLead)
  }, [campagneMessage, previewLead])

  // Custom hooks
  const leadOps = useProspectionLeads({
    secret, leads, setLeads, stats, setStats, limit,
    editForm, setShowEditModal, selectedLeadIds, setSelectedLeadIds,
    rawImportText, setRawImportText, importCat, importVille, importQuartier,
    setActiveTab, addForm, setAddForm, setShowAddModal, showToast,
  })

  const autoOps = useProspectionAutomations({
    secret, reloadLeads: leadOps.reloadLeads, blacklistAddForm, setBlacklistAddForm,
    setBlacklist, setShowAddBlacklistModal, campaignTargetLeads, nbDejaContactes,
    campagneTitre, campagneCanal, campagneMessage, scrapingZone, scrapingLimite, showToast,
  })

  const handleOpenEditModal = (lead: Lead) => {
    setEditForm({
      id: lead.id, nom_boutique: lead.nom_boutique || '', contact_nom: lead.contact_nom || '',
      telephone: lead.telephone || '', email: lead.email || '', categorie: lead.categorie || 'mode',
      ville: lead.ville || 'Dakar', quartier: lead.quartier || 'Dakar', statut: lead.statut || 'nouveau',
      notes: lead.notes || '',
    })
    setShowEditModal(true)
  }

  const handleResetFilters = () => {
    setSearch('')
    setCatFilter('tous')
    setStatutFilter('nouveau')
    setSourceFilter('tous')
    setOperateurFilter('tous')
    setQuartierFilter('tous')
    setSelectedLeadIds([])
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 80px', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
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

      <ProspectionHeader
        stats={stats}
        isCleaningLeads={leadOps.isCleaningLeads}
        isAutoSourcing={leadOps.isAutoSourcing}
        onNettoyerLeads={leadOps.handleNettoyerLeads}
        onAutoSource={leadOps.handleAutoSource}
        onOpenAddModal={() => setShowAddModal(true)}
      />

      <ProspectionTabBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          if (tab === 'logs') autoOps.loadLogs()
          if (tab === 'control') autoOps.fetchCronStatus()
          if (tab === 'blacklist') autoOps.loadBlacklist()
        }}
        totalLeads={stats.total || filteredLeads.length}
        blacklistCount={stats.blacklist !== undefined ? stats.blacklist : blacklist.length}
      />

      {activeTab === 'crm' && (
        <ProspectionTabCrm
          leads={leads}
          filteredLeads={filteredLeads}
          sortedFilteredLeads={sortedFilteredLeads}
          selectedLeadIds={selectedLeadIds}
          search={search}
          setSearch={setSearch}
          limit={limit}
          setLimit={setLimit}
          loadingLeads={leadOps.loadingLeads}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          statutFilter={statutFilter}
          setStatutFilter={setStatutFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          operateurFilter={operateurFilter}
          setOperateurFilter={setOperateurFilter}
          quartierFilter={quartierFilter}
          setQuartierFilter={setQuartierFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          uniqueQuartiers={uniqueQuartiers}
          totalLeadsCount={stats.total || leads.length}
          desinscritsCount={stats.desinscrits}
          isCleaningLeads={leadOps.isCleaningLeads}
          onReloadLeads={leadOps.reloadLeads}
          onNettoyerLeads={leadOps.handleNettoyerLeads}
          onExportCSV={() => exportLeadsCSV(filteredLeads)}
          onBatchDelete={leadOps.handleBatchDelete}
          onResetFilters={handleResetFilters}
          onSelectAll={(checked) => setSelectedLeadIds(checked ? filteredLeads.map((l) => l.id) : [])}
          onToggleSelect={(id) => setSelectedLeadIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])}
          onStatutChange={leadOps.handleStatutChange}
          onDeleteLead={leadOps.handleDeleteLead}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {activeTab === 'import' && (
        <ProspectionTabImport
          rawImportText={rawImportText}
          setRawImportText={setRawImportText}
          importCat={importCat}
          setImportCat={setImportCat}
          importVille={importVille}
          setImportVille={setImportVille}
          importQuartier={importQuartier}
          setImportQuartier={setImportQuartier}
          isImporting={leadOps.isImporting}
          onImportVrac={leadOps.handleImportVrac}
          isAutoCollecting={autoOps.isAutoCollecting}
          collectingTarget={autoOps.collectingTarget}
          autoCollecteResult={autoOps.autoCollecteResult}
          onLancerAutoCollecte={autoOps.handleLancerAutoCollecte}
          dorking={dorking}
        />
      )}

      {activeTab === 'campagnes' && (
        <ProspectionTabCampagnes
          campaignTargetLeads={campaignTargetLeads}
          nbDejaContactes={nbDejaContactes}
          selectedLeadIds={selectedLeadIds}
          setSelectedLeadIds={setSelectedLeadIds}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          statutFilter={statutFilter}
          setStatutFilter={setStatutFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          operateurFilter={operateurFilter}
          setOperateurFilter={setOperateurFilter}
          quartierFilter={quartierFilter}
          setQuartierFilter={setQuartierFilter}
          campagneLimit={campagneLimit}
          setCampagneLimit={setCampagneLimit}
          eligibleLeadsCount={filteredLeads.filter((l) => l.statut !== 'desinscrit' && l.statut !== 'invalide').length}
          uniqueQuartiers={uniqueQuartiers}
          campagneTitre={campagneTitre}
          setCampagneTitre={setCampagneTitre}
          templates={templates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          campagneMessage={campagneMessage}
          setCampagneMessage={setCampagneMessage}
          setCampagneCanal={setCampagneCanal}
          isSending={autoOps.isSending}
          onLancerCampagne={autoOps.handleLancerCampagne}
          previewLead={previewLead}
          previewText={previewText}
        />
      )}

      {activeTab === 'logs' && (
        <ProspectionTabLogs
          loadingLogs={autoOps.loadingLogs}
          campagnesList={autoOps.campagnesList}
          logs={autoOps.logs}
          onRefreshLogs={autoOps.loadLogs}
        />
      )}

      {activeTab === 'control' && (
        <ProspectionTabControl
          loadingCronData={autoOps.loadingCronData}
          onFetchCronStatus={autoOps.fetchCronStatus}
          scrapingZone={scrapingZone}
          setScrapingZone={setScrapingZone}
          scrapingLimite={scrapingLimite}
          setScrapingLimite={setScrapingLimite}
          isScraping={autoOps.isScraping}
          scrapingResult={autoOps.scrapingResult}
          onRunScraping={autoOps.handleRunScraping}
          isRelancing={autoOps.isRelancing}
          relancesResult={autoOps.relancesResult}
          onRunRelances={autoOps.handleRunRelances}
          cronData={autoOps.cronData}
        />
      )}

      {activeTab === 'blacklist' && (
        <ProspectionTabBlacklist
          loadingBlacklist={autoOps.loadingBlacklist}
          onRefreshBlacklist={autoOps.loadBlacklist}
          onExportCSV={() => exportBlacklistCSV(filteredBlacklist)}
          onOpenAddModal={() => setShowAddBlacklistModal(true)}
          blacklistSearch={blacklistSearch}
          setBlacklistSearch={setBlacklistSearch}
          filteredBlacklist={filteredBlacklist}
          onRemoveBlacklist={autoOps.handleRemoveBlacklist}
        />
      )}

      <ModalEditLead
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        isSavingEdit={leadOps.isSavingEdit}
        onSaveEdit={leadOps.handleSaveEdit}
      />

      <ModalAddBlacklist
        isOpen={showAddBlacklistModal}
        onClose={() => setShowAddBlacklistModal(false)}
        blacklistAddForm={blacklistAddForm}
        setBlacklistAddForm={setBlacklistAddForm}
        isAddingBlacklist={autoOps.isAddingBlacklist}
        onAddBlacklist={autoOps.handleAddBlacklist}
      />

      <ModalAddLead
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        addForm={addForm}
        setAddForm={setAddForm}
        onAddSingle={leadOps.handleAddSingle}
      />
    </div>
  )
}
