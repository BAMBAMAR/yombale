'use client'
import { useState, useEffect } from 'react'
import { CATEGORIES } from '@/lib/categories'
import { useTranslation } from '@/i18n/context'
import { Package, FileSpreadsheet, CheckCircle2, AlertTriangle, Sparkles, Upload, ArrowRight, X } from 'lucide-react'

interface TemplateProduit {
  id: string
  nom: string
  description: string
  categorie: string
  photo_defaut: string
}

interface SaisieProduit {
  template: TemplateProduit
  selectionne: boolean
  prix: string
  quantite: number
}

interface LigneFichier {
  id: string
  nom: string
  prix: number
  quantite: number
  categorie: string
  code_barre?: string
  description?: string
  image_url?: string
  valide: boolean
  avertissement?: string
}

interface DiagnosticImport {
  plateforme: string
  totalDetecte: number
  prets: number
  avertissements: number
  colonnesDetectees: {
    nom: string
    prix: string
    stock: string
    categorie: string
    code_barre: string
  }
}

// ── Fonctions utilitaires de parsing intelligent ─────────────────────────────

function detecterSeparateur(texte: string): string {
  const premiereLigne = texte.split(/\r?\n/)[0] || ''
  const pointVirgule = (premiereLigne.match(/;/g) || []).length
  const virgule = (premiereLigne.match(/,/g) || []).length
  const tabulation = (premiereLigne.match(/\t/g) || []).length
  const pipe = (premiereLigne.match(/\|/g) || []).length

  if (pointVirgule >= virgule && pointVirgule >= tabulation && pointVirgule >= pipe && pointVirgule > 0) return ';'
  if (tabulation >= virgule && tabulation >= pointVirgule && tabulation > 0) return '\t'
  if (pipe >= virgule && pipe > 0) return '|'
  return ','
}

function decouperLigneCSV(ligne: string, sep: string): string[] {
  const result: string[] = []
  let enQuotes = false
  let buffer = ''
  
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i]
    if (c === '"') {
      if (enQuotes && ligne[i + 1] === '"') {
        buffer += '"'
        i++
      } else {
        enQuotes = !enQuotes
      }
    } else if (c === sep && !enQuotes) {
      result.push(buffer.trim())
      buffer = ''
    } else {
      buffer += c
    }
  }
  result.push(buffer.trim())
  return result.map(s => s.replace(/^["']|["']$/g, '').trim())
}

function normaliserChaine(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
}

function nettoyerPrix(val: string): number {
  if (!val) return 0
  let cleaned = val.replace(/FCFA|CFA|XOF|EUR|USD|\$|€|[\s\xa0]/gi, '').trim()
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }
  const num = parseFloat(cleaned)
  return isNaN(num) || num < 0 ? 0 : Math.round(num)
}

export default function BatchImportModal({
  boutiqueId,
  onClose,
  onSuccess,
}: {
  boutiqueId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const { t, isRtl } = useTranslation()
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

  function telechargerModeleCSV() {
    const csvContent = "\uFEFF" + [
      "Nom du Produit;Prix FCFA;Quantité Stock;Catégorie;Code-Barres EAN-13",
      "Sac de Riz Parfumé 25kg;17500;50;alimentation;6001234567891",
      "Huile Dinor 5L;9500;20;alimentation;6009876543210",
      "Lait Bonnet Rouge En Poudre 400g;2800;35;alimentation;6005554443332",
      "Savon Diama 200g;350;100;maison;6001112223334",
      "Piles AA Duracell Paquet de 4;2500;15;electronique;6008887776665"
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modele_import_catalogue_nopalou.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Moteur d'Import Intelligent & Multi-Plateforme ──────────────────────────
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setNomFichier(file.name)
    setError(null)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length <= 1) {
          setError('Le fichier est vide ou ne contient aucune ligne valide.')
          return
        }

        const sep = detecterSeparateur(text)
        const headerRow = decouperLigneCSV(lines[0], sep).map(h => normaliserChaine(h))

        // Détection de la plateforme source
        let plateformeDetectee = 'Fichier Excel / CSV standard 📊'
        const headerText = headerRow.join(' ')
        if (headerText.includes('variant price') || headerText.includes('body html') || headerText.includes('handle')) {
          plateformeDetectee = 'Boutique Shopify 🛍️'
        } else if (headerText.includes('post title') || headerText.includes('regular price') || headerText.includes('product cat')) {
          plateformeDetectee = 'Catalogue WooCommerce 🛒'
        } else if (headerText.includes('prix de vente ttc') || headerText.includes('nom *') || headerText.includes('reference #')) {
          plateformeDetectee = 'Catalogue PrestaShop 🏪'
        } else if (headerText.includes('designation') || headerText.includes('pu') || headerText.includes('qte')) {
          plateformeDetectee = 'Tableur Excel / Google Sheets 📑'
        }

        // Mapping automatique des colonnes
        let colNom = -1
        let colPrix = -1
        let colStock = -1
        let colCat = -1
        let colCodeBarre = -1
        let colDesc = -1
        let colImage = -1

        headerRow.forEach((h, idx) => {
          if (colNom === -1 && /^(nom|designation|article|title|titre|libelle|product name|item|produit)$/i.test(h)) colNom = idx
          else if (colNom === -1 && (h.includes('nom') || h.includes('title') || h.includes('designation'))) colNom = idx

          if (colPrix === -1 && /^(prix|price|pu|montant|tarif|prix fcfa|variant price|unit price|selling price|valeur|regular price)$/i.test(h)) colPrix = idx
          else if (colPrix === -1 && (h.includes('prix') || h.includes('price') || h.includes('tarif'))) colPrix = idx

          if (colStock === -1 && /^(quantite|qty|qte|stock|inventory|variant inventory qty|disponible|nombre|quantite stock)$/i.test(h)) colStock = idx
          else if (colStock === -1 && (h.includes('stock') || h.includes('qty') || h.includes('quantite'))) colStock = idx

          if (colCat === -1 && /^(categorie|category|rayon|famille|type|custom product type|rubrique)$/i.test(h)) colCat = idx
          else if (colCat === -1 && (h.includes('cat') || h.includes('type') || h.includes('rayon'))) colCat = idx

          if (colCodeBarre === -1 && /^(code barre|code_barre|code barres|code-barres|barcode|ean|ean13|upc|sku|reference|ref|variant sku)$/i.test(h)) colCodeBarre = idx
          else if (colCodeBarre === -1 && (h.includes('barre') || h.includes('ean') || h.includes('sku') || h.includes('ref'))) colCodeBarre = idx

          if (colDesc === -1 && (h.includes('description') || h.includes('details') || h.includes('body'))) colDesc = idx
          if (colImage === -1 && (h.includes('image') || h.includes('photo') || h.includes('src'))) colImage = idx
        })

        // Fallbacks si non trouvé dans les en-têtes
        const hasHeader = colNom !== -1 || colPrix !== -1 || headerText.includes('nom') || headerText.includes('prix')
        if (!hasHeader) {
          colNom = 0
          colPrix = 1
          colStock = 2
          colCat = 3
          colCodeBarre = 4
        } else {
          if (colNom === -1) colNom = 0
          if (colPrix === -1) colPrix = 1
        }

        const startIdx = hasHeader ? 1 : 0
        const parsed: LigneFichier[] = []
        let readyCount = 0
        let warnCount = 0

        for (let i = startIdx; i < lines.length; i++) {
          const cols = decouperLigneCSV(lines[i], sep)
          if (cols.length === 0 || !cols.some(c => c.trim())) continue

          const nom = cols[colNom] || ''
          if (!nom.trim()) continue

          const prix = colPrix !== -1 && cols[colPrix] ? nettoyerPrix(cols[colPrix]) : 0
          const quantite = colStock !== -1 && cols[colStock] ? Math.max(1, Number(cols[colStock].replace(/\D/g, '')) || 10) : 10
          const categorie = colCat !== -1 && cols[colCat] ? normaliserChaine(cols[colCat]) : 'mixte'
          const code_barre = colCodeBarre !== -1 && cols[colCodeBarre] ? cols[colCodeBarre].trim() : undefined
          const description = colDesc !== -1 && cols[colDesc] ? cols[colDesc].trim() : undefined
          const image_url = colImage !== -1 && cols[colImage] ? cols[colImage].trim() : undefined

          let avertissement: string | undefined
          if (prix === 0) {
            avertissement = 'Prix non détecté (défini à 0 FCFA)'
            warnCount++
          } else {
            readyCount++
          }

          parsed.push({
            id: `csv-${i}`,
            nom,
            prix,
            quantite,
            categorie: categorie || 'mixte',
            code_barre,
            description,
            image_url,
            valide: true,
            avertissement,
          })
        }

        if (parsed.length === 0) {
          setError('Aucun produit n\'a pu être extrait. Vérifiez que votre fichier contient au moins une colonne avec les noms de produits.')
          return
        }

        setLignesFichier(parsed)
        setDiagnostic({
          plateforme: plateformeDetectee,
          totalDetecte: parsed.length,
          prets: readyCount,
          avertissements: warnCount,
          colonnesDetectees: {
            nom: colNom !== -1 && headerRow[colNom] ? headerRow[colNom] : `Colonne ${colNom + 1}`,
            prix: colPrix !== -1 && headerRow[colPrix] ? headerRow[colPrix] : `Colonne ${colPrix + 1}`,
            stock: colStock !== -1 && headerRow[colStock] ? headerRow[colStock] : 'Auto (10 par défaut)',
            categorie: colCat !== -1 && headerRow[colCat] ? headerRow[colCat] : 'Générale',
            code_barre: colCodeBarre !== -1 && headerRow[colCodeBarre] ? headerRow[colCodeBarre] : 'Non renseigné',
          }
        })
      } catch (err: any) {
        setError('Impossible d\'analyser le fichier. Format non reconnu.')
      }
    }

    reader.readAsText(file)
  }

  useEffect(() => {
    fetch('/api/boutiques/catalogues-standards')
      .then(res => res.json())
      .then(data => {
        if (data.catalogues) {
          setCatalogues(data.catalogues)
          const initialSaisies: Record<string, SaisieProduit> = {}
          Object.values(data.catalogues).flat().forEach((t: any) => {
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
      return all.filter(t => {
        if (/\s\(\d+\)$/.test(t.nom)) return false
        return t.nom.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      })
    }
    const currentList = getTemplatesForCategory(categorieActive)
    return currentList.filter(t => !/\s\(\d+\)$/.test(t.nom))
  })()

  function toggleSelection(id: string) {
    setSaisies(prev => ({
      ...prev,
      [id]: { ...prev[id], selectionne: !prev[id].selectionne }
    }))
  }

  function updatePrix(id: string, val: string) {
    setSaisies(prev => ({
      ...prev,
      [id]: { ...prev[id], prix: val, selectionne: true }
    }))
  }

  function updateQuantite(id: string, val: number) {
    setSaisies(prev => ({
      ...prev,
      [id]: { ...prev[id], quantite: Math.max(1, val) }
    }))
  }

  const produitsAEnvoyer = modeImport === 'catalogue'
    ? Object.values(saisies).filter(s => s.selectionne && Number(s.prix) >= 0)
    : lignesFichier

  const nbArticlesSelectionnes = modeImport === 'catalogue'
    ? produitsAEnvoyer.length
    : lignesFichier.length

  async function validerBatch() {
    let payload: any[] = []

    if (modeImport === 'catalogue') {
      if (produitsAEnvoyer.length === 0) {
        setError('Veuillez cocher au moins 1 produit avec un prix valide')
        return
      }
      payload = produitsAEnvoyer.map(s => ({
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
      payload = lignesFichier.map(l => ({
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
        setSuccessMsg(`Importation en cours... (${Math.min(i + CHUNK_SIZE, payload.length)} / ${payload.length} produits)`)
        const res = await fetch(`/api/boutiques/${boutiqueId}/produits/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ produits: chunk }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur lors de l’importation')
        totalImported += (data.count || chunk.length)
      }

      setSuccessMsg(`🎉 Félicitations ! ${totalImported} produit(s) ont été importés avec succès dans votre boutique.`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (e: any) {
      setError(e.message || 'Erreur serveur lors de l’importation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 820,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }} onClick={e => e.stopPropagation()}>

        {/* En-tête avec sélecteur de méthode */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--orange2, #FFF3E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent, #C75B00)' }}>
                <Package size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  Importer plusieurs produits
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
                  Ajoutez facilement votre catalogue sans tout ressaisir un par un
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
              <X size={16} />
            </button>
          </div>

          {/* Onglets Méthodes d'import */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
            <button
              onClick={() => setModeImport('catalogue')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 9, border: 'none',
                background: modeImport === 'catalogue' ? '#fff' : 'transparent',
                color: modeImport === 'catalogue' ? 'var(--accent, #C75B00)' : '#64748B',
                fontWeight: modeImport === 'catalogue' ? 800 : 600, fontSize: 13, cursor: 'pointer',
                boxShadow: modeImport === 'catalogue' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={16} />
              <span>1. Modèles prêts à l'emploi</span>
            </button>
            <button
              onClick={() => setModeImport('fichier')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 9, border: 'none',
                background: modeImport === 'fichier' ? '#fff' : 'transparent',
                color: modeImport === 'fichier' ? '#1D4ED8' : '#64748B',
                fontWeight: modeImport === 'fichier' ? 800 : 600, fontSize: 13, cursor: 'pointer',
                boxShadow: modeImport === 'fichier' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <FileSpreadsheet size={16} />
              <span>2. Importer un fichier (Excel / CSV / Shopify)</span>
            </button>
          </div>
        </div>

        {/* Navigation des catégories en mode catalogue standard */}
        {modeImport === 'catalogue' && (
          <div style={{
            display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto', flexShrink: 0,
            borderBottom: '1px solid #e5e7eb', background: '#fff', alignItems: 'center',
          }}>
            <button
              key="tous"
              type="button"
              onClick={() => setCategorieActive('tous')}
              style={{
                padding: '8px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
                background: categorieActive === 'tous' ? 'var(--accent, #C75B00)' : '#f1f5f9',
                color: categorieActive === 'tous' ? '#fff' : '#475569',
                fontWeight: categorieActive === 'tous' ? 800 : 600, fontSize: 12.5, cursor: 'pointer',
                flexShrink: 0, transition: 'all 0.15s ease',
              }}
            >
              Tous les rayons
            </button>
            {CATEGORIES.filter(c => c.value !== 'mixte').map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategorieActive(c.value)}
                style={{
                  padding: '8px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
                  background: categorieActive === c.value ? 'var(--accent, #C75B00)' : '#f1f5f9',
                  color: categorieActive === c.value ? '#fff' : '#475569',
                  fontWeight: categorieActive === c.value ? 800 : 600, fontSize: 12.5, cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.15s ease',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Contenu principal */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {modeImport === 'fichier' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Bannière de téléchargement du modèle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFDF9', border: '1.5px solid #FED7AA', padding: '14px 18px', borderRadius: 14, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#9A3412' }}>
                    💡 Vous partez de zéro ou d'un carnet papier ?
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#C2410C' }}>
                    Téléchargez notre modèle de tableau simplifié pré-rempli avec des exemples.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={telechargerModeleCSV}
                  className="btn-npl btn-npl-secondary btn-npl-sm"
                  style={{ borderColor: '#FED7AA', color: '#9A3412', background: '#FFF7ED', fontWeight: 800 }}
                >
                  Télécharger le modèle (.CSV)
                </button>
              </div>

              {/* Zone Glisser-Déposer File Input */}
              <div style={{
                border: '2px dashed #93C5FD', background: '#EFF6FF', borderRadius: 16,
                padding: '30px 20px', textAlign: 'center', position: 'relative',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#1D4ED8' }}>
                  <Upload size={24} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 16, color: '#1E3A8A' }}>
                  Déposez votre fichier ici (Excel, CSV, Shopify, WooCommerce)
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#3B82F6', maxWidth: 480, marginInline: 'auto' }}>
                  Nopalou détecte automatiquement vos colonnes (Nom, Prix, Stock, Catégorie) sans aucune configuration technique requise.
                </p>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#1D4ED8', color: '#ffffff', padding: '10px 22px', borderRadius: 10,
                  fontSize: 13.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,78,216,0.25)'
                }}>
                  <span>Choisir un fichier</span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {nomFichier && (
                  <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                    📄 Fichier sélectionné : {nomFichier}
                  </p>
                )}
              </div>

              {/* Diagnostic Zero-Stress & Prévisualisation */}
              {diagnostic && lignesFichier.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16 }}>🎉</span>
                        <span style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                          {diagnostic.totalDetecte} articles détectés
                        </span>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                          {diagnostic.plateforme}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>
                        ✓ {diagnostic.prets} prêts à être importés {diagnostic.avertissements > 0 ? `· ⚠ ${diagnostic.avertissements} sans prix` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => { setLignesFichier([]); setDiagnostic(null); setNomFichier(null) }}
                      style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Supprimer la sélection
                    </button>
                  </div>

                  {/* Tableau d'aperçu des 5 premiers articles */}
                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 750 }}>
                          <th style={{ padding: '8px 12px' }}>Nom du produit</th>
                          <th style={{ padding: '8px 12px' }}>Prix FCFA</th>
                          <th style={{ padding: '8px 12px' }}>Stock</th>
                          <th style={{ padding: '8px 12px' }}>Catégorie</th>
                          <th style={{ padding: '8px 12px' }}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignesFichier.slice(0, 6).map((l, idx) => (
                          <tr key={l.id} style={{ borderBottom: idx < 5 ? '1px solid #F1F5F9' : 'none' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1E293B' }}>{l.nom}</td>
                            <td style={{ padding: '9px 12px', fontWeight: 800, color: l.prix > 0 ? '#16A34A' : '#D97706' }}>
                              {l.prix.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td style={{ padding: '9px 12px', color: '#64748B' }}>{l.quantite}</td>
                            <td style={{ padding: '9px 12px', color: '#64748B', textTransform: 'capitalize' }}>{l.categorie}</td>
                            <td style={{ padding: '9px 12px' }}>
                              {l.prix > 0 ? (
                                <span style={{ color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  ✓ Prêt
                                </span>
                              ) : (
                                <span style={{ color: '#D97706', fontSize: 11, fontWeight: 700 }}>
                                  ⚠ Sans prix
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {lignesFichier.length > 6 && (
                    <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#94A3B8', textAlign: 'center' }}>
                      ... et {lignesFichier.length - 6} autres articles prêts à être importés
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Chargement des modèles de catalogue...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Barre de Recherche dans le catalogue */}
              <input
                type="text"
                placeholder="Rechercher un modèle de produit (ex: Riz, iPhone, Robe, Savon...)"
                value={rechercheCatalogue}
                onChange={e => setRechercheCatalogue(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #D1D5DB',
                  fontSize: 14, background: '#fff', boxSizing: 'border-box', outline: 'none',
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 12 }}>
                {templatesAffiches.map(tItem => {
                  const item = saisies[tItem.id]
                  if (!item) return null
                  return (
                    <div
                      key={tItem.id}
                      style={{
                        background: '#fff', border: item.selectionne ? '2px solid var(--accent, #C75B00)' : '1px solid #E2E8F0',
                        borderRadius: 14, padding: 12, display: 'flex', gap: 12, alignItems: 'center',
                        boxShadow: item.selectionne ? '0 4px 14px rgba(199,91,0,.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.selectionne}
                        onChange={() => toggleSelection(tItem.id)}
                        style={{ width: 18, height: 18, accentColor: '#C75B00', cursor: 'pointer' }}
                      />

                      <img
                        src={tItem.photo_defaut}
                        alt={tItem.nom}
                        style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', background: '#F1F5F9' }}
                      />

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 750, fontSize: 13.5, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tItem.nom}
                        </p>
                        
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <input
                              type="number"
                              placeholder="Prix FCFA (ex: 2500)"
                              value={item.prix}
                              onChange={e => updatePrix(tItem.id, e.target.value)}
                              style={{
                                width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB',
                                borderRadius: 8, fontSize: 12.5, fontWeight: 700, boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div style={{ width: 65 }}>
                            <input
                              type="number"
                              min={1}
                              title="Quantité en stock"
                              value={item.quantite}
                              onChange={e => updateQuantite(tItem.id, Number(e.target.value))}
                              style={{
                                width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB',
                                borderRadius: 8, fontSize: 12.5, textAlign: 'center', boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modale */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13.5, fontWeight: 750, color: '#334155' }}>
            <span>{nbArticlesSelectionnes} article(s) sélectionné(s)</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#64748b' }}
            >
              Annuler
            </button>
            <button
              onClick={validerBatch}
              disabled={submitting || nbArticlesSelectionnes === 0}
              style={{
                padding: '12px 24px', background: nbArticlesSelectionnes > 0 ? 'var(--accent, #C75B00)' : '#cbd5e1',
                color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800,
                cursor: nbArticlesSelectionnes > 0 ? 'pointer' : 'not-allowed',
                boxShadow: nbArticlesSelectionnes > 0 ? '0 4px 14px rgba(199,91,0,0.3)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {submitting ? 'Importation en cours...' : `Importer dans ma boutique (${nbArticlesSelectionnes}) 🚀`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
