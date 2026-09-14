'use client'

import React, { useState } from 'react'
import {
  Plus,
  ChevronDown,
  Package,
  Settings,
  Search,
  CheckSquare,
  Square,
  X,
} from 'lucide-react'

interface CatalogueToolbarProps {
  totalCount: number
  filtreStock: 'tous' | 'en_stock' | 'rupture'
  setFiltreStock: (val: 'tous' | 'en_stock' | 'rupture') => void
  filtreStatut: 'tous' | 'synchronise' | 'en_attente' | 'echec' | 'jamais_partage'
  setFiltreStatut: (val: 'tous' | 'synchronise' | 'en_attente' | 'echec' | 'jamais_partage') => void
  rechercheTexte: string
  setRechercheTexte: (val: string) => void
  triOption: 'recent' | 'ancien' | 'prix_asc' | 'prix_desc' | 'stock_rupture' | 'stock_dispo' | 'alpha'
  setTriOption: (val: any) => void
  categoriesDisponibles: string[]
  filtreCategorie: string
  setFiltreCategorie: (val: string) => void
  selectedCount: number
  filteredCount: number
  onToggleSelectAll: () => void
  onAjouterProduitRapide: () => void
  onAjouterProduitDetaille: () => void
  onImporterCSV: () => void
  countEnStock: number
  countRupture: number
  countWhatsApp: number
}

export default function CatalogueToolbar({
  totalCount,
  filtreStock,
  setFiltreStock,
  filtreStatut,
  setFiltreStatut,
  rechercheTexte,
  setRechercheTexte,
  triOption,
  setTriOption,
  categoriesDisponibles,
  filtreCategorie,
  setFiltreCategorie,
  selectedCount,
  filteredCount,
  onToggleSelectAll,
  onAjouterProduitRapide,
  onAjouterProduitDetaille,
  onImporterCSV,
  countEnStock,
  countRupture,
  countWhatsApp,
}: CatalogueToolbarProps) {
  const [showMenuOptionsCatalogue, setShowMenuOptionsCatalogue] = useState(false)

  return (
    <div className="bq-toolbar-compact" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Ligne 1 : Bouton principal dominant + Menu d'options compact */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          type="button"
          onClick={onAjouterProduitRapide}
          className="btn-npl btn-npl-primary"
          style={{
            flex: 1,
            height: 36,
            padding: '0 14px',
            fontSize: 12.5,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 8,
            boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
            background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Ajouter un produit</span>
        </button>

        {/* Menu déroulant compact pour les options secondaires */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setShowMenuOptionsCatalogue(!showMenuOptionsCatalogue)}
            className="btn-npl btn-npl-secondary"
            style={{
              height: 36,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Plus d'actions (Import CSV, ajout détaillé)"
          >
            <span>⋯ Plus</span>
            <ChevronDown size={13} />
          </button>

          {showMenuOptionsCatalogue && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setShowMenuOptionsCatalogue(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 50,
                  minWidth: 240,
                  background: '#ffffff',
                  border: '1px solid var(--border, #E8DDD2)',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuOptionsCatalogue(false)
                    onImporterCSV()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <Package size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Importer CSV / Excel</span>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                      Ajout par lot de produits
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuOptionsCatalogue(false)
                    onAjouterProduitDetaille()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <Settings size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Ajout détaillé & Variantes</span>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                      Tailles, couleurs, fiches complètes
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ligne 2 : Omni-Recherche & Filtres SaaS */}
      {totalCount > 0 && (
        <div className="saas-toolbar-container">
          {/* Pilules de filtres rapides */}
          <div className="saas-filter-pills" style={{ marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => {
                setFiltreStock('tous')
                setFiltreStatut('tous')
              }}
              className={`saas-filter-pill ${filtreStock === 'tous' && filtreStatut === 'tous' ? 'active' : ''}`}
            >
              Tous ({totalCount})
            </button>

            <button
              type="button"
              onClick={() => setFiltreStock(filtreStock === 'en_stock' ? 'tous' : 'en_stock')}
              className={`saas-filter-pill ${filtreStock === 'en_stock' ? 'active' : ''}`}
            >
              En stock ({countEnStock})
            </button>

            <button
              type="button"
              onClick={() => setFiltreStock(filtreStock === 'rupture' ? 'tous' : 'rupture')}
              className={`saas-filter-pill ${filtreStock === 'rupture' ? 'warning-active' : ''}`}
              style={{
                color: filtreStock !== 'rupture' && countRupture > 0 ? '#ea580c' : undefined,
                borderColor: filtreStock !== 'rupture' && countRupture > 0 ? '#fed7aa' : undefined,
                background: filtreStock !== 'rupture' && countRupture > 0 ? '#fff7ed' : undefined,
              }}
            >
              Ruptures ({countRupture})
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltreStatut(filtreStatut === 'synchronise' ? 'tous' : 'synchronise')
              }
              className={`saas-filter-pill ${filtreStatut === 'synchronise' ? 'active' : ''}`}
            >
              WhatsApp ({countWhatsApp})
            </button>
          </div>

          <div className="saas-search-wrap saas-toolbar-full">
            <Search size={14} className="saas-search-icon" />
            <input
              type="text"
              placeholder={`Rechercher parmi ${totalCount} produit${totalCount > 1 ? 's' : ''}…`}
              value={rechercheTexte}
              onChange={(e) => setRechercheTexte(e.target.value)}
              className="saas-search-input"
            />
            {rechercheTexte && (
              <button
                type="button"
                onClick={() => setRechercheTexte('')}
                className="saas-search-clear"
                title="Effacer la recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="saas-toolbar-grid">
            {/* Tri multi-critères */}
            <select
              value={triOption}
              onChange={(e) => setTriOption(e.target.value as any)}
              className="saas-select-control"
              title="Trier les produits"
            >
              <option value="recent">Plus récents</option>
              <option value="ancien">Plus anciens</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
              <option value="stock_rupture">Ruptures d&apos;abord</option>
              <option value="stock_dispo">En stock d&apos;abord</option>
              <option value="alpha">Nom (A-Z)</option>
            </select>

            {/* Filtre Stock */}
            <select
              value={filtreStock}
              onChange={(e) => setFiltreStock(e.target.value as any)}
              className="saas-select-control"
              title="Filtrer par disponibilité stock"
            >
              <option value="tous">Tous stocks</option>
              <option value="en_stock">En stock</option>
              <option value="rupture">Rupture</option>
            </select>

            {/* Statut WhatsApp */}
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as typeof filtreStatut)}
              className="saas-select-control"
              title="Filtrer par statut WhatsApp"
            >
              <option value="tous">Statut: Tous</option>
              <option value="synchronise">Sur WhatsApp</option>
              <option value="en_attente">En attente</option>
              <option value="echec">Échec synchro</option>
              <option value="jamais_partage">Non partagés</option>
            </select>

            {/* Catégories */}
            {categoriesDisponibles.length > 1 && (
              <select
                value={filtreCategorie}
                onChange={(e) => setFiltreCategorie(e.target.value)}
                className="saas-select-control"
                title="Filtrer par catégorie"
              >
                <option value="toutes">Catégories: Toutes</option>
                {categoriesDisponibles.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Bouton Tout cocher */}
            {filteredCount > 0 && (
              <button
                type="button"
                onClick={onToggleSelectAll}
                className={`saas-toolbar-btn ${selectedCount > 0 ? 'selected' : ''}`}
                title={selectedCount === filteredCount ? 'Tout désélectionner' : 'Tout cocher'}
              >
                {selectedCount === filteredCount ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{selectedCount === filteredCount ? 'Désélectionner' : 'Tout cocher'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
