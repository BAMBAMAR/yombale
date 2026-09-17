import { Search, SlidersHorizontal, Sparkles, Download, Trash2, RotateCcw, Ban } from 'lucide-react'
import type { Lead } from './types'
import { CATEGORIES_OPTIONS, SOURCES_OPTIONS, OPERATEURS_OPTIONS, SOUS_PROFILS_OPTIONS } from './utils'
import ProspectionCrmTable from './ProspectionCrmTable'

interface Props {
  leads: Lead[]
  filteredLeads: Lead[]
  sortedFilteredLeads: Lead[]
  selectedLeadIds: string[]
  search: string
  setSearch: (s: string) => void
  limit: number | string
  setLimit: (l: number | string) => void
  loadingLeads: boolean
  catFilter: string
  setCatFilter: (c: string) => void
  sousProfilFilter: string
  setSousProfilFilter: (sp: string) => void
  statutFilter: string
  setStatutFilter: (s: string) => void
  sourceFilter: string
  setSourceFilter: (s: string) => void
  operateurFilter: string
  setOperateurFilter: (o: string) => void
  quartierFilter: string
  setQuartierFilter: (q: string) => void
  sortBy: 'date' | 'priorite' | 'fit' | 'qualite'
  setSortBy: (s: 'date' | 'priorite' | 'fit' | 'qualite') => void
  uniqueQuartiers: string[]
  totalLeadsCount: number
  desinscritsCount: number
  isCleaningLeads: boolean
  onReloadLeads: (customLimit?: number | string) => Promise<void>
  onNettoyerLeads: () => void
  onExportCSV: () => void
  onBatchDelete: () => void
  onResetFilters: () => void
  onSelectAll: (checked: boolean) => void
  onToggleSelect: (id: string) => void
  onStatutChange: (leadId: string, newStatut: string) => void
  onDeleteLead: (leadId: string) => void
  onOpenEditModal: (lead: Lead) => void
}

export default function ProspectionTabCrm({
  leads,
  filteredLeads,
  sortedFilteredLeads,
  selectedLeadIds,
  search,
  setSearch,
  limit,
  setLimit,
  loadingLeads,
  catFilter,
  setCatFilter,
  sousProfilFilter,
  setSousProfilFilter,
  statutFilter,
  setStatutFilter,
  sourceFilter,
  setSourceFilter,
  operateurFilter,
  setOperateurFilter,
  quartierFilter,
  setQuartierFilter,
  sortBy,
  setSortBy,
  uniqueQuartiers,
  totalLeadsCount,
  desinscritsCount,
  isCleaningLeads,
  onReloadLeads,
  onNettoyerLeads,
  onExportCSV,
  onBatchDelete,
  onResetFilters,
  onSelectAll,
  onToggleSelect,
  onStatutChange,
  onDeleteLead,
  onOpenEditModal,
}: Props) {
  const hasActiveFilters = Boolean(
    search ||
    catFilter !== 'tous' ||
    sousProfilFilter !== 'tous' ||
    statutFilter !== 'tous' ||
    sourceFilter !== 'tous' ||
    operateurFilter !== 'tous' ||
    quartierFilter !== 'tous'
  )

  return (
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
                  onReloadLeads(val)
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
              onClick={onNettoyerLeads}
              disabled={isCleaningLeads}
              style={{
                padding: '8px 14px', background: '#F0FDF4', border: '1px solid #86EFAC',
                borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: isCleaningLeads ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, color: '#166534',
              }}
              title="Reclassement automatique des véhicules, immobilier, tech, suppression des faux noms et annonces emploi"
            >
              <Sparkles size={15} color="#16A34A" /> {isCleaningLeads ? 'Nettoyage en cours...' : 'Nettoyer & Reclasser CRM'}
            </button>

            <button
              onClick={onExportCSV}
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
                onClick={onBatchDelete}
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

          {/* Sous-Profil Métier (Agences, Courtiers, etc.) */}
          <select
            value={sousProfilFilter}
            onChange={(e) => setSousProfilFilter(e.target.value)}
            style={{
              padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1',
              fontSize: 12, fontWeight: 700, background: sousProfilFilter !== 'tous' ? '#EFF6FF' : '#fff',
              color: sousProfilFilter !== 'tous' ? '#1D4ED8' : '#1E293B',
            }}
          >
            {SOUS_PROFILS_OPTIONS.map((opt) => (
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
            <option value="tous">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="contacte_wa">Contacté WhatsApp</option>
            <option value="en_discussion">En discussion</option>
            <option value="converti">Converti (Actif)</option>
            <option value="sans_reponse">Sans réponse (J+14)</option>
            <option value="desinscrit">Désinscrit</option>
            <option value="invalide">Invalide (Emploi / Hors Cible)</option>
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
            <option value="tous">Tous les quartiers ({uniqueQuartiers.length})</option>
            {uniqueQuartiers.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          {/* Tri par Priorité */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priorite' | 'fit' | 'qualite')}
            style={{
              padding: '7px 10px', borderRadius: 8, border: '1px solid #16A34A',
              fontSize: 12, fontWeight: 700, background: '#F0FDF4', color: '#16A34A',
            }}
          >
            <option value="priorite">Priorité Commerciale</option>
            <option value="fit">Nopalou Fit Score</option>
            <option value="qualite">Score Qualité</option>
            <option value="date">Date Ajout</option>
          </select>

          {/* Bouton Réinitialiser si filtres actifs */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
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
          Affichage de <strong>{filteredLeads.length}</strong> prospect{filteredLeads.length > 1 ? 's' : ''} sur <strong>{totalLeadsCount || leads.length}</strong> au total dans la base.
          {loadingLeads && <span style={{ marginLeft: 8, color: '#2563EB', fontWeight: 700 }}>Chargement...</span>}
        </div>
        {desinscritsCount ? (
          <span style={{ color: '#DC2626', fontWeight: 700, background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>
            <Ban size={13} style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline' }} />{desinscritsCount} désinscrit{desinscritsCount > 1 ? 's' : ''} (exclus des envois)
          </span>
        ) : null}
      </div>

      {/* Tableau des Prospects */}
      <ProspectionCrmTable
        filteredLeads={filteredLeads}
        sortedFilteredLeads={sortedFilteredLeads}
        selectedLeadIds={selectedLeadIds}
        onSelectAll={onSelectAll}
        onToggleSelect={onToggleSelect}
        onStatutChange={onStatutChange}
        onDeleteLead={onDeleteLead}
        onOpenEditModal={onOpenEditModal}
      />
    </div>
  )
}
