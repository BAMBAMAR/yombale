'use client'

import { useState, useEffect } from 'react'
import type { TypeVarianteId } from '../../boutiqueHelpers'
import type { Produit, Variante, VarianteSku } from '../../boutiqueTypes'
import { TYPES_VARIANTE } from '../constants'

interface UseProduitFormVariantesProps {
  produit?: Produit
  nomForm: string
  prixForm: string
  stockQuantiteForm: string
}

export function useProduitFormVariantes({
  produit,
  nomForm,
  prixForm,
  stockQuantiteForm,
}: UseProduitFormVariantesProps) {
  const [variantes, setVariantes] = useState<Variante[]>(produit?.variantes ?? [])
  const [nomsPersonnalises, setNomsPersonnalises] = useState<Record<number, string>>({})
  const [variantesSkus, setVariantesSkus] = useState<VarianteSku[]>(produit?.variantes_skus ?? [])

  const typesDejaUtilises = new Set(
    variantes
      .map(v => v.typeId)
      .filter((t): t is TypeVarianteId => !!t && t !== 'autre')
  )
  const typesDisponibles = TYPES_VARIANTE.filter(t => t.repetable || !typesDejaUtilises.has(t.id))

  function ajouterOption(typeId: TypeVarianteId) {
    const type = TYPES_VARIANTE.find(t => t.id === typeId)!
    setVariantes(prev => [...prev, { nom: type.nomVariante, valeurs: [], typeId: type.id }])
  }

  function renommerOptionPersonnalisee(index: number, nom: string) {
    setNomsPersonnalises(prev => ({ ...prev, [index]: nom }))
    setVariantes(prev => prev.map((v, i) => (i === index ? { ...v, nom } : v)))
  }

  function retirerOption(index: number) {
    setVariantes(prev => prev.filter((_, i) => i !== index))
    setNomsPersonnalises(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  function toggleValeur(index: number, valeur: string) {
    setVariantes(prev =>
      prev.map((v, i) => {
        if (i !== index) return v
        if (v.valeurs.includes(valeur)) return { ...v, valeurs: v.valeurs.filter((x: string) => x !== valeur) }
        return { ...v, valeurs: [...v.valeurs, valeur] }
      })
    )
  }

  // ── Matrice 3D de Variantes (Combinaisons Cartésiennes, SKU & Stocks) ────────
  useEffect(() => {
    const optionsValides = variantes.filter(o => o.nom && o.nom.trim() && o.valeurs && o.valeurs.length > 0)
    if (optionsValides.length === 0) {
      setVariantesSkus([])
      return
    }

    // Produit cartésien multi-dimensions (Taille × Couleur × Matière...)
    const combinaisons = optionsValides.reduce<Record<string, string>[]>(
      (acc, opt) => {
        const res: Record<string, string>[] = []
        for (const comb of acc) {
          for (const val of opt.valeurs) {
            res.push({ ...comb, [opt.nom.trim()]: val })
          }
        }
        return res
      },
      [{}]
    )

    setVariantesSkus(prev => {
      const basePrix = Number(prixForm) || produit?.prix || 0
      const baseStock = Number(stockQuantiteForm) || 0
      const slugProduit = (nomForm || 'ART').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROD'

      return combinaisons.map((comb, idx) => {
        const existing =
          prev.find((item: VarianteSku) => {
            const keys = Object.keys(comb)
            const itemKeys = Object.keys(item.attributs || {})
            return keys.length === itemKeys.length && keys.every(k => item.attributs[k] === comb[k])
          }) ||
          (produit?.variantes_skus || []).find((item: VarianteSku) => {
            const keys = Object.keys(comb)
            const itemKeys = Object.keys(item.attributs || {})
            return keys.length === itemKeys.length && keys.every(k => item.attributs[k] === comb[k])
          })

        if (existing) {
          return {
            ...existing,
            attributs: comb,
            ordre: idx,
          }
        }

        const codeSuffix = Object.values(comb)
          .map(v => String(v).slice(0, 3).toUpperCase())
          .join('-')
        const autoSku = `${slugProduit}-${codeSuffix}`

        return {
          sku: autoSku,
          code_barre: '',
          attributs: comb,
          prix: basePrix,
          stock_quantite: baseStock,
          actif: true,
          ordre: idx,
        }
      })
    })
  }, [variantes, nomForm, prixForm, stockQuantiteForm, produit?.variantes_skus, produit?.prix])

  function updateVarianteSku(index: number, champ: keyof VarianteSku, val: any) {
    setVariantesSkus(prev => prev.map((item, i) => (i === index ? { ...item, [champ]: val } : item)))
  }

  function alignerTousLesPrix() {
    const p = Number(prixForm) || produit?.prix || 0
    setVariantesSkus(prev => prev.map(item => ({ ...item, prix: p })))
  }

  function alignerTousLesStocks() {
    const s = Number(stockQuantiteForm) || 0
    setVariantesSkus(prev => prev.map(item => ({ ...item, stock_quantite: s })))
  }

  function regenererTousLesSkus() {
    const slugProduit = (nomForm || 'ART').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROD'
    setVariantesSkus(prev =>
      prev.map(item => {
        const codeSuffix = Object.values(item.attributs || {})
          .map((v: any) => String(v).slice(0, 3).toUpperCase())
          .join('-')
        return {
          ...item,
          sku: `${slugProduit}-${codeSuffix}`,
        }
      })
    )
  }

  function genererEanPourVariante(index: number) {
    const prefix = '200' + Math.floor(Math.random() * 900000000 + 100000000).toString()
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(prefix[i], 10) * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    const code = prefix + checkDigit
    updateVarianteSku(index, 'code_barre', code)
  }

  return {
    variantes,
    setVariantes,
    nomsPersonnalises,
    variantesSkus,
    setVariantesSkus,
    typesDejaUtilises,
    typesDisponibles,
    ajouterOption,
    renommerOptionPersonnalisee,
    retirerOption,
    toggleValeur,
    updateVarianteSku,
    alignerTousLesPrix,
    alignerTousLesStocks,
    regenererTousLesSkus,
    genererEanPourVariante,
  }
}
