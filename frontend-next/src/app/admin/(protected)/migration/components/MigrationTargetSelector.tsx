import React from 'react'
import { Store, Layers, Percent, Calculator } from 'lucide-react'
import { Boutique, Categorie } from './types'

interface MigrationTargetSelectorProps {
  boutiques: Boutique[] | undefined
  categories: Categorie[] | undefined
  loadingBoutiques: boolean
  selectedBoutiqueId: string
  onSelectBoutiqueId: (id: string) => void
  selectedCategorieId: string
  onSelectCategorieId: (id: string) => void
  margePct: number
  onMargePctChange: (pct: number) => void
  arrondi: number
  onArrondiChange: (arr: number) => void
}

export default function MigrationTargetSelector({
  boutiques,
  categories,
  loadingBoutiques,
  selectedBoutiqueId,
  onSelectBoutiqueId,
  selectedCategorieId,
  onSelectCategorieId,
  margePct,
  onMargePctChange,
  arrondi,
  onArrondiChange,
}: MigrationTargetSelectorProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: '16px 20px',
        border: '1px solid var(--border, #e2e8f0)',
        marginBottom: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
          }}
        >
          <Store size={14} color="var(--navy, #1C2B4A)" />
          1. Boutique Cible Nopalou
        </label>
        <select
          value={selectedBoutiqueId}
          onChange={e => onSelectBoutiqueId(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
            fontWeight: 600,
            background: '#f8fafc',
          }}
        >
          {loadingBoutiques && !boutiques?.length && <option value="">Chargement des boutiques...</option>}
          {!loadingBoutiques && (!boutiques || boutiques.length === 0) && (
            <option value="">Aucune boutique trouvée</option>
          )}
          {boutiques?.map(b => (
            <option key={b.id} value={b.id}>
              {b.nom} ({b.nb_produits} produits) {b.telephone ? `— ${b.telephone}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
          }}
        >
          <Layers size={14} color="var(--navy, #1C2B4A)" />
          2. Rayon / Catégorie par défaut
        </label>
        <select
          value={selectedCategorieId}
          onChange={e => onSelectCategorieId(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
            background: '#ffffff',
          }}
        >
          <option value="">-- Détection automatique / Sans catégorie --</option>
          {categories?.map(c => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
          }}
        >
          <Percent size={14} color="var(--navy, #1C2B4A)" />
          3. Majoration / Marge (%)
        </label>
        <input
          type="number"
          value={margePct}
          onChange={e => onMargePctChange(parseFloat(e.target.value) || 0)}
          placeholder="0% (prix d'origine)"
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
          }}
        >
        </input>
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
          }}
        >
          <Calculator size={14} color="var(--navy, #1C2B4A)" />
          4. Arrondi Psychologique (FCFA)
        </label>
        <select
          value={arrondi}
          onChange={e => onArrondiChange(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
          }}
        >
          <option value={0}>Aucun (prix exact)</option>
          <option value={100}>100 FCFA (ex: 4 820 vers 4 900)</option>
          <option value={500}>500 FCFA (ex: 4 820 vers 5 000)</option>
          <option value={1000}>1 000 FCFA (ex: 14 300 vers 15 000)</option>
        </select>
      </div>
    </div>
  )
}
