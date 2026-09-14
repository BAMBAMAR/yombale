'use client'

import { useState, useEffect } from 'react'
import type { TemplateProduit, SaisieProduit, LigneFichier, DiagnosticImport } from './types'
import { parseCSVContent } from './csvHelpers'

const categoryAliases: Record<string, string[]> = {
  electronique: ['smartphones', 'informatique', 'electronique', 'high-tech'],
  alimentation: ['alimentation', 'epicerie', 'supermarche'],
  maison: ['maison', 'electromenager', 'bricolage'],
  mode: ['mode', 'vetements', 'chaussures'],
  elevage: ['elevage', 'animaux', 'agriculture'],
  sante: ['beaute', 'sante', 'hygiene'],
  parfum: ['parfum', 'parfumerie', 'fragrances'],
  optique: ['optique', 'lunettes'],
  services: ['services', 'prestation'],
}

export function useBatchImportData({
  boutiqueId,
  onSuccess,
}: {
  boutiqueId: string
  onSuccess: () => void
}) {
  const [modeImport, setModeImport] = useState<'catalogue' | 'fichier'>('catalogue')
  const [categorieActive, setCategorieActive] = useState<string>('alimentation')
  const [catalogues, setCatalogues] = useState<Record<string, TemplateProduit[]>>({})
  const [saisies, setSaisies] = useState<Record<string, SaisieProduit>>({})
  const [lignesFichier, setLignesFichier] = useState<LigneFichier[]>([])
  const [diagnostic, setDiagnostic] = useState<DiagnosticImport | null>(null)
  const [nomFichier, setNomFichier] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [rechercheCatalogue, setRechercheCatalogue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/boutiques/catalogues-standards')
      .then((res) => res.json())
      .then((data) => {
        if (data.catalogues) {
          setCatalogues(data.catalogues)
          const initialSaisies: Record<string, SaisieProduit> = {}
          Object.values(data.catalogues)
            .flat()
            .forEach((t: any) => {
              initialSaisies[t.id] = {
                template: t,
                selectionne: false,
                prix: '',
                quantite: 10,
              }
            })
          setSaisies(initialSaisies)
        } else if (data.error) {
          setError(data.error)
        }
      })
      .catch(() => setError('Impossible de charger le catalogue standard'))
      .finally(() => setLoading(false))
  }, [])

  const getTemplatesForCategory = (catKey: string): TemplateProduit[] => {
    if (catKey === 'tous') {
      return Object.values(catalogues).flat()
    }
    const keysToMatch = categoryAliases[catKey] || [catKey]
    const result: TemplateProduit[] = []
    for (const k of keysToMatch) {
      if (Array.isArray(catalogues[k])) {
        result.push(...catalogues[k])
      }
    }
    if (result.length === 0 && Array.isArray(catalogues[catKey])) {
      return catalogues[catKey]
    }
    return result
  }

  const templatesAffiches = (() => {
    const q = rechercheCatalogue.trim().toLowerCase()
    if (q) {
      const all = Object.values(catalogues).flat()
      return all.filter((t) => {
        if (/\s\(\d+\)$/.test(t.nom)) return false
        return t.nom.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      })
    }
    const currentList = getTemplatesForCategory(categorieActive)
    return currentList.filter((t) => !/\s\(\d+\)$/.test(t.nom))
  })()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setNomFichier(file.name)
    setError(null)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const texte = event.target?.result as string
        const { parsed, diagnostic: diag, error: parseErr } = parseCSVContent(texte)
        if (parseErr) {
          setError(parseErr)
          return
        }
        setLignesFichier(parsed)
        setDiagnostic(diag)
      } catch {
        setError("Impossible d'analyser le fichier. Format non reconnu.")
      }
    }
    reader.readAsText(file)
  }

  const toggleSelection = (id: string) => {
    setSaisies((prev) => ({
      ...prev,
      [id]: { ...prev[id], selectionne: !prev[id].selectionne },
    }))
  }

  const updatePrix = (id: string, val: string) => {
    setSaisies((prev) => ({
      ...prev,
      [id]: { ...prev[id], prix: val, selectionne: true },
    }))
  }

  const updateQuantite = (id: string, val: number) => {
    setSaisies((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantite: Math.max(1, val) },
    }))
  }

  const clearFileSelection = () => {
    setLignesFichier([])
    setDiagnostic(null)
    setNomFichier(null)
  }

  const produitsAEnvoyer =
    modeImport === 'catalogue'
      ? Object.values(saisies).filter((s) => s.selectionne && Number(s.prix) >= 0)
      : lignesFichier

  const nbArticlesSelectionnes =
    modeImport === 'catalogue' ? produitsAEnvoyer.length : lignesFichier.length

  const validerBatch = async () => {
    let payload: any[] = []

    if (modeImport === 'catalogue') {
      if (produitsAEnvoyer.length === 0) {
        setError('Veuillez cocher au moins 1 produit avec un prix valide')
        return
      }
      payload = produitsAEnvoyer.map((s) => ({
        nom: (s as SaisieProduit).template.nom,
        description: (s as SaisieProduit).template.description,
        categorie: (s as SaisieProduit).template.categorie,
        prix: Number((s as SaisieProduit).prix),
        quantite_stock: (s as SaisieProduit).quantite,
        photo_defaut: (s as SaisieProduit).template.photo_defaut,
        images: [(s as SaisieProduit).template.photo_defaut],
        en_stock: true,
      }))
    } else {
      if (lignesFichier.length === 0) {
        setError('Veuillez téléverser un fichier contenant des articles')
        return
      }
      payload = lignesFichier.map((l) => ({
        nom: l.nom,
        prix: l.prix,
        quantite_stock: l.quantite,
        categorie: l.categorie,
        code_barre: l.code_barre,
        description: l.description,
        images: l.image_url ? [l.image_url] : [],
        en_stock: true,
      }))
    }

    setError(null)
    setSubmitting(true)

    const CHUNK_SIZE = 50
    let totalImported = 0

    try {
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        const chunk = payload.slice(i, i + CHUNK_SIZE)
        setSuccessMsg(
          `Importation en cours... (${Math.min(i + CHUNK_SIZE, payload.length)} / ${
            payload.length
          } produits)`
        )
        const res = await fetch(`/api/boutiques/${boutiqueId}/produits/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ produits: chunk }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur lors de l’importation')
        totalImported += data.count || chunk.length
      }

      setSuccessMsg(
        `Félicitations ! ${totalImported} produit(s) ont été importés avec succès dans votre boutique.`
      )
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement des produits')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    modeImport,
    setModeImport,
    categorieActive,
    setCategorieActive,
    saisies,
    lignesFichier,
    diagnostic,
    nomFichier,
    loading,
    submitting,
    rechercheCatalogue,
    setRechercheCatalogue,
    error,
    successMsg,
    templatesAffiches,
    nbArticlesSelectionnes,
    handleFileUpload,
    toggleSelection,
    updatePrix,
    updateQuantite,
    clearFileSelection,
    validerBatch,
  }
}
