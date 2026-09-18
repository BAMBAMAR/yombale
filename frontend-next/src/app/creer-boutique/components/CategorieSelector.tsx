'use client'

import React, { useState, useMemo } from 'react'
import {
  Layers,
  Shirt,
  Smartphone,
  ShoppingBag,
  Tv,
  Sparkles,
  Store,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  Plus,
  Wrench,
  Car,
  Home,
  Gem,
  HeartPulse,
  Utensils,
  Dumbbell,
  Wheat,
  Briefcase,
  HelpCircle,
} from 'lucide-react'
import { CATEGORIES, POPULAR_CATEGORY_VALUES, cleanCategoryLabel } from '@/lib/categories'

interface CategorieSelectorProps {
  value: string
  onChange: (value: string) => void
  name?: string
  label?: string
  description?: string
  required?: boolean
}

// Icônes vectorielles Lucide associées aux catégories principales & populaires
const POPULAR_ICONS: Record<string, React.ReactNode> = {
  mode: <Shirt size={18} strokeWidth={2.2} />,
  smartphones: <Smartphone size={18} strokeWidth={2.2} />,
  alimentation: <ShoppingBag size={18} strokeWidth={2.2} />,
  'tv-electro': <Tv size={18} strokeWidth={2.2} />,
  beaute: <Sparkles size={18} strokeWidth={2.2} />,
  mixte: <Store size={18} strokeWidth={2.2} />,
}

// Icônes vectorielles pour les autres catégories courantes
const OTHER_ICONS: Record<string, React.ReactNode> = {
  quincaillerie: <Wrench size={16} strokeWidth={2} />,
  'auto-moto': <Car size={16} strokeWidth={2} />,
  maison: <Home size={16} strokeWidth={2} />,
  bijouterie: <Gem size={16} strokeWidth={2} />,
  'sante-pharma': <HeartPulse size={16} strokeWidth={2} />,
  services: <Briefcase size={16} strokeWidth={2} />,
  sport: <Dumbbell size={16} strokeWidth={2} />,
  'produits-agricoles': <Wheat size={16} strokeWidth={2} />,
  maraichage: <Wheat size={16} strokeWidth={2} />,
  elevage: <Wheat size={16} strokeWidth={2} />,
}

export default function CategorieSelector({
  value,
  onChange,
  name = 'categorie',
  label = "Secteur d'activité :",
  description = "Choisissez le secteur principal de votre commerce. Vous pourrez le modifier ultérieurement.",
  required = false,
}: CategorieSelectorProps) {
  // Les 6 catégories populaires
  const popularCategories = useMemo(() => {
    return CATEGORIES.filter((c) =>
      (POPULAR_CATEGORY_VALUES as readonly string[]).includes(c.value)
    )
  }, [])

  // Le reste des catégories
  const otherCategories = useMemo(() => {
    return CATEGORIES.filter(
      (c) => !(POPULAR_CATEGORY_VALUES as readonly string[]).includes(c.value)
    )
  }, [])

  // Vérifier si la catégorie actuellement sélectionnée fait partie des "autres"
  const isSelectedInOthers = useMemo(() => {
    return otherCategories.some((c) => c.value === value)
  }, [otherCategories, value])

  // L'accordéon est ouvert si demandé OU si la sélection courante est dans les "autres"
  const [isExpanded, setIsExpanded] = useState<boolean>(isSelectedInOthers)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Catégories filtrées par la recherche dans le reste
  const filteredOtherCategories = useMemo(() => {
    if (!searchQuery.trim()) return otherCategories
    const q = searchQuery.toLowerCase().trim()
    return otherCategories.filter((c) =>
      cleanCategoryLabel(c.label).toLowerCase().includes(q)
    )
  }, [otherCategories, searchQuery])

  // Catégorie couramment sélectionnée
  const currentCategoryObj = useMemo(() => {
    return CATEGORIES.find((c) => c.value === value) || null
  }, [value])

  return (
    <div
      style={{
        background: '#f8fafc',
        padding: '20px 20px 22px',
        borderRadius: 18,
        border: '1.5px solid #e2e8f0',
        marginBottom: 20,
      }}
    >
      <input type="hidden" name={name} value={value} required={required} />

      {/* En-tête avec label & description */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            marginBottom: 4,
          }}
        >
          <Layers size={18} color="var(--accent, #C75B00)" />
          <span>{label}</span>
        </label>
        {description && (
          <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>

      {/* 1. LISTE RESTREINTE : Les 6 Catégories Populaires */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {popularCategories.map((c) => {
          const isSelected = value === c.value
          const icon = POPULAR_ICONS[c.value] || <Store size={18} />
          const cleanName = cleanCategoryLabel(c.label)

          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 14,
                cursor: 'pointer',
                border: isSelected
                  ? '2px solid var(--accent, #C75B00)'
                  : '1.5px solid #cbd5e1',
                background: isSelected ? '#FFF3E8' : '#ffffff',
                color: isSelected ? 'var(--accent, #C75B00)' : '#1e293b',
                fontWeight: isSelected ? 800 : 700,
                fontSize: 13,
                textAlign: 'left',
                boxShadow: isSelected
                  ? '0 4px 14px rgba(199, 91, 0, 0.15)'
                  : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.18s ease-in-out',
                position: 'relative',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    color: isSelected ? 'var(--accent, #C75B00)' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {icon}
                </span>
                <span>{cleanName}</span>
              </span>

              {isSelected && (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--accent, #C75B00)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: 6,
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Badge indicateur si une catégorie du "reste" est active */}
      {isSelectedInOthers && currentCategoryObj && (
        <div
          style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            borderRadius: 12,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <Check size={14} strokeWidth={3} />
          <span>Secteur spécifique actif : {cleanCategoryLabel(currentCategoryObj.label)}</span>
        </div>
      )}

      {/* 2. BOUTON TOGGLE : Voir le reste des catégories */}
      <div style={{ marginTop: 6 }}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 12,
            border: isExpanded ? '1.5px solid #94a3b8' : '1.5px dashed #94a3b8',
            background: isExpanded ? '#f1f5f9' : '#ffffff',
            color: '#334155',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s ease-in-out',
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              <span>Masquer les autres secteurs</span>
            </>
          ) : (
            <>
              <Plus size={15} color="var(--accent, #C75B00)" strokeWidth={2.5} />
              <span>
                Voir tous les autres secteurs d&apos;activité ({otherCategories.length} catégories supplémentaires)
              </span>
              <ChevronDown size={16} />
            </>
          )}
        </button>
      </div>

      {/* 3. SECTION ÉTENDUE : Le reste des catégories avec filtre instantané */}
      {isExpanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Barre de recherche instantanée */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un secteur (ex: Auto, Santé, Quincaillerie, Bijoux...)"
              style={{
                width: '100%',
                padding: '9px 14px 9px 34px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                color: '#0f172a',
                outline: 'none',
                background: '#ffffff',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Grille de puces pour le reste des catégories */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              maxHeight: 240,
              overflowY: 'auto',
              padding: '4px 2px',
            }}
          >
            {filteredOtherCategories.length > 0 ? (
              filteredOtherCategories.map((c) => {
                const isSelected = value === c.value
                const icon = OTHER_ICONS[c.value] || <HelpCircle size={14} />
                const cleanName = cleanCategoryLabel(c.label)

                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onChange(c.value)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      border: isSelected
                        ? '1.5px solid var(--accent, #C75B00)'
                        : '1px solid #cbd5e1',
                      background: isSelected ? '#FFF3E8' : '#ffffff',
                      color: isSelected ? 'var(--accent, #C75B00)' : '#334155',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: 12,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        color: isSelected ? 'var(--accent, #C75B00)' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {icon}
                    </span>
                    <span>{cleanName}</span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                )
              })
            ) : (
              <p style={{ margin: 8, fontSize: 12, color: '#94a3b8' }}>
                Aucune catégorie trouvée pour &ldquo;{searchQuery}&rdquo;.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
