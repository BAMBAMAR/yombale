import type { LigneFichier, DiagnosticImport } from './types'

export function detecterSeparateur(texte: string): string {
  const premiereLigne = texte.split(/\r?\n/)[0] || ''
  const pointVirgule = (premiereLigne.match(/;/g) || []).length
  const virgule = (premiereLigne.match(/,/g) || []).length
  const tabulation = (premiereLigne.match(/\t/g) || []).length
  const pipe = (premiereLigne.match(/\|/g) || []).length

  if (pointVirgule >= virgule && pointVirgule >= tabulation && pointVirgule >= pipe && pointVirgule > 0)
    return ';'
  if (tabulation >= virgule && tabulation >= pointVirgule && tabulation > 0) return '\t'
  if (pipe >= virgule && pipe > 0) return '|'
  return ','
}

export function decouperLigneCSV(ligne: string, sep: string): string[] {
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
  return result.map((s) => s.replace(/^["']|["']$/g, '').trim())
}

export function normaliserChaine(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
}

export function nettoyerPrix(val: string): number {
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

export function telechargerModeleCSV() {
  const csvContent =
    '\uFEFF' +
    [
      'Nom du Produit;Prix FCFA;Quantité Stock;Catégorie;Code-Barres EAN-13',
      'Sac de Riz Parfumé 25kg;17500;50;alimentation;6001234567891',
      'Huile Dinor 5L;9500;20;alimentation;6009876543210',
      'Lait Bonnet Rouge En Poudre 400g;2800;35;alimentation;6005554443332',
      'Savon Diama 200g;350;100;maison;6001112223334',
      'Piles AA Duracell Paquet de 4;2500;15;electronique;6008887776665',
    ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'modele_import_catalogue_nopalou.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function parseCSVContent(texte: string): {
  parsed: LigneFichier[]
  diagnostic: DiagnosticImport | null
  error?: string
} {
  const lines = texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) {
    return { parsed: [], diagnostic: null, error: 'Le fichier sélectionné est complètement vide.' }
  }

  const sep = detecterSeparateur(texte)
  const headerRow = decouperLigneCSV(lines[0], sep)
  const headerText = lines[0].toLowerCase()

  let plateformeDetectee = 'Fichier CSV / Excel Standard'
  if (headerText.includes('handle') && (headerText.includes('variant') || headerText.includes('vendor'))) {
    plateformeDetectee = 'Shopify Export CSV'
  } else if (headerText.includes('post_title') || headerText.includes('regular_price')) {
    plateformeDetectee = 'WooCommerce Export'
  } else if (headerText.includes('code_barre') || headerText.includes('nopalou')) {
    plateformeDetectee = 'Modèle Nopalou POS'
  }

  let colNom = -1
  let colPrix = -1
  let colStock = -1
  let colCat = -1
  let colCodeBarre = -1
  let colDesc = -1
  let colImage = -1

  headerRow.forEach((col, idx) => {
    const h = col.toLowerCase().trim()
    if (colNom === -1 && /^(nom|title|product name|nom du produit|designation|article|libelle)$/i.test(h))
      colNom = idx
    else if (colNom === -1 && (h.includes('nom') || h.includes('title') || h.includes('designation')))
      colNom = idx

    if (
      colPrix === -1 &&
      /^(prix|price|pu|montant|tarif|prix fcfa|variant price|unit price|selling price|valeur|regular price)$/i.test(
        h
      )
    )
      colPrix = idx
    else if (colPrix === -1 && (h.includes('prix') || h.includes('price') || h.includes('tarif')))
      colPrix = idx

    if (
      colStock === -1 &&
      /^(quantite|qty|qte|stock|inventory|variant inventory qty|disponible|nombre|quantite stock)$/i.test(
        h
      )
    )
      colStock = idx
    else if (colStock === -1 && (h.includes('stock') || h.includes('qty') || h.includes('quantite')))
      colStock = idx

    if (
      colCat === -1 &&
      /^(categorie|category|rayon|famille|type|custom product type|rubrique)$/i.test(h)
    )
      colCat = idx
    else if (colCat === -1 && (h.includes('cat') || h.includes('type') || h.includes('rayon')))
      colCat = idx

    if (
      colCodeBarre === -1 &&
      /^(code barre|code_barre|code barres|code-barres|barcode|ean|ean13|upc|sku|reference|ref|variant sku)$/i.test(
        h
      )
    )
      colCodeBarre = idx
    else if (
      colCodeBarre === -1 &&
      (h.includes('barre') || h.includes('ean') || h.includes('sku') || h.includes('ref'))
    )
      colCodeBarre = idx

    if (colDesc === -1 && (h.includes('description') || h.includes('details') || h.includes('body')))
      colDesc = idx
    if (colImage === -1 && (h.includes('image') || h.includes('photo') || h.includes('src')))
      colImage = idx
  })

  const hasHeader =
    colNom !== -1 || colPrix !== -1 || headerText.includes('nom') || headerText.includes('prix')
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
    if (cols.length === 0 || !cols.some((c) => c.trim())) continue

    const nom = cols[colNom] || ''
    if (!nom.trim()) continue

    const prix = colPrix !== -1 && cols[colPrix] ? nettoyerPrix(cols[colPrix]) : 0
    const quantite =
      colStock !== -1 && cols[colStock]
        ? Math.max(1, Number(cols[colStock].replace(/\D/g, '')) || 10)
        : 10
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
    return {
      parsed: [],
      diagnostic: null,
      error:
        'Aucun produit n’a pu être extrait. Vérifiez que votre fichier contient au moins une colonne avec les noms de produits.',
    }
  }

  const diagnostic: DiagnosticImport = {
    plateforme: plateformeDetectee,
    totalDetecte: parsed.length,
    prets: readyCount,
    avertissements: warnCount,
    colonnesDetectees: {
      nom: colNom !== -1 && headerRow[colNom] ? headerRow[colNom] : `Colonne ${colNom + 1}`,
      prix: colPrix !== -1 && headerRow[colPrix] ? headerRow[colPrix] : `Colonne ${colPrix + 1}`,
      stock: colStock !== -1 && headerRow[colStock] ? headerRow[colStock] : 'Auto (10 par défaut)',
      categorie: colCat !== -1 && headerRow[colCat] ? headerRow[colCat] : 'Générale',
      code_barre:
        colCodeBarre !== -1 && headerRow[colCodeBarre] ? headerRow[colCodeBarre] : 'Non renseigné',
    },
  }

  return { parsed, diagnostic }
}
