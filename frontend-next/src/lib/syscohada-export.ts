/**
 * Module d'Exportation Comptable SYSCOHADA (Norme OHADA Révisée)
 * Compatible avec les logiciels ERP leaders : Sage Saari, Odoo, FEC DGI.
 */

export interface TransactionComptable {
  id: string
  date: string // YYYY-MM-DD ou ISO
  reference?: string
  clientNom?: string
  fournisseurNom?: string
  montantTotal: number
  montantTva?: number
  tauxTva?: number // Ex: 0.18 pour TVA Sénégal
  modePaiement: 'cash' | 'wave' | 'orange_money' | 'virement' | 'carte' | 'credit' | string
  type: 'vente' | 'depense' | 'acompte'
  libelle?: string
}

export interface EcritureSyscohada {
  journalCode: string // 'VT' (Ventes), 'CA' (Caisse), 'BQ' (Banque/Mobile Money), 'OD' (Opérations Diverses)
  date: string // DD/MM/YYYY
  numeroPiece: string
  compteGeneral: string // Ex: 701100, 571100, 521100, 411100, 443100
  compteTiers?: string
  libelle: string
  debit: number
  credit: number
}

/**
 * Mappe les modes de règlement vers les comptes de trésorerie SYSCOHADA
 */
export function getCompteTresorerieSyscohada(mode: string): string {
  const m = String(mode || '').toLowerCase()
  if (m === 'cash' || m === 'especes') return '571100' // Caisse Siège
  if (m === 'wave') return '521200' // Banque / Établissement Mobile Money Wave
  if (m === 'orange_money' || m === 'om') return '521300' // Établissement Mobile Money Orange Money
  if (m === 'virement' || m === 'cheque') return '521100' // Banque commerciale
  if (m === 'carte') return '521400' // Terminal de Paiement Électronique (TPE)
  if (m === 'credit' || m === 'dette') return '411100' // Clients ordinaires
  return '571100'
}

/**
 * Génère les écritures comptables en partie double à partir des ventes et dépenses
 */
export function genererEcrituresSyscohada(
  transactions: TransactionComptable[],
  regimeFiscal: 'simplifie' | 'reel' = 'simplifie'
): EcritureSyscohada[] {
  const ecritures: EcritureSyscohada[] = []

  for (const t of transactions) {
    const montant = Math.round(Number(t.montantTotal) || 0)
    if (montant <= 0) continue

    const dateObj = new Date(t.date)
    const dateFormatee = !isNaN(dateObj.getTime())
      ? `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`
      : new Date().toLocaleDateString('fr-FR')

    const piece = t.reference || t.id.slice(-8).toUpperCase()

    if (t.type === 'vente') {
      const compteTresorerie = getCompteTresorerieSyscohada(t.modePaiement)
      const libelleVente = t.libelle || `Vente ${t.clientNom ? t.clientNom : 'Comptoir'} #${piece}`

      if (regimeFiscal === 'reel' && t.tauxTva && t.tauxTva > 0) {
        // Régime Réel avec TVA 18%
        const montantHT = Math.round(montant / (1 + t.tauxTva))
        const montantTVA = montant - montantHT

        // Débit Trésorerie ou Client (TTC)
        ecritures.push({
          journalCode: compteTresorerie.startsWith('571') ? 'CA' : compteTresorerie.startsWith('521') ? 'BQ' : 'VT',
          date: dateFormatee,
          numeroPiece: piece,
          compteGeneral: compteTresorerie,
          compteTiers: t.modePaiement === 'credit' ? t.clientNom : undefined,
          libelle: libelleVente,
          debit: montant,
          credit: 0,
        })

        // Crédit Vente de Marchandises 701100 (HT)
        ecritures.push({
          journalCode: 'VT',
          date: dateFormatee,
          numeroPiece: piece,
          compteGeneral: '701100',
          libelle: `Chiffre d'affaires HT - ${piece}`,
          debit: 0,
          credit: montantHT,
        })

        // Crédit TVA Facturée 443100
        ecritures.push({
          journalCode: 'VT',
          date: dateFormatee,
          numeroPiece: piece,
          compteGeneral: '443100',
          libelle: `TVA collectée 18% - ${piece}`,
          debit: 0,
          credit: montantTVA,
        })
      } else {
        // Régime Simplifié (TVA non applicable)
        // Débit Trésorerie ou Client (Total)
        ecritures.push({
          journalCode: compteTresorerie.startsWith('571') ? 'CA' : compteTresorerie.startsWith('521') ? 'BQ' : 'VT',
          date: dateFormatee,
          numeroPiece: piece,
          compteGeneral: compteTresorerie,
          compteTiers: t.modePaiement === 'credit' ? t.clientNom : undefined,
          libelle: libelleVente,
          debit: montant,
          credit: 0,
        })

        // Crédit Ventes de Marchandises 701100 (Total)
        ecritures.push({
          journalCode: 'VT',
          date: dateFormatee,
          numeroPiece: piece,
          compteGeneral: '701100',
          libelle: `Vente de marchandises - ${piece}`,
          debit: 0,
          credit: montant,
        })
      }
    } else if (t.type === 'depense') {
      const compteTresorerie = getCompteTresorerieSyscohada(t.modePaiement)
      const libelleDepense = t.libelle || `Dépense exploitation #${piece}`

      // Débit Charge d'exploitation 605100 / 601100
      ecritures.push({
        journalCode: 'AC',
        date: dateFormatee,
        numeroPiece: piece,
        compteGeneral: '605100',
        libelle: libelleDepense,
        debit: montant,
        credit: 0,
      })

      // Crédit Trésorerie
      ecritures.push({
        journalCode: compteTresorerie.startsWith('571') ? 'CA' : 'BQ',
        date: dateFormatee,
        numeroPiece: piece,
        compteGeneral: compteTresorerie,
        libelle: `Règlement ${libelleDepense}`,
        debit: 0,
        credit: montant,
      })
    }
  }

  return ecritures
}

/**
 * Exporte les écritures au format CSV Sage Saari standard
 */
export function exportSageCSV(ecritures: EcritureSyscohada[], nomFichier = 'NOPALOU_SAGE_SYSCOHADA') {
  const headers = [
    'Code Journal',
    'Date',
    'N° Pièce',
    'N° Compte Général',
    'Compte Tiers',
    'Libellé Écriture',
    'Débit (FCFA)',
    'Crédit (FCFA)'
  ]

  const rows = ecritures.map(e => [
    `"${e.journalCode}"`,
    `"${e.date}"`,
    `"${e.numeroPiece}"`,
    `"${e.compteGeneral}"`,
    `"${e.compteTiers || ''}"`,
    `"${e.libelle.replace(/"/g, '""')}"`,
    e.debit > 0 ? e.debit : '',
    e.credit > 0 ? e.credit : ''
  ])

  const csvContent = [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n')

  telechargerFichier(csvContent, `${nomFichier}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Exporte au format Fichier des Écritures Comptables (FEC) conforme DGI / OHADA
 */
export function exportFEC(ecritures: EcritureSyscohada[], nomFichier = 'NOPALOU_FEC_SYSCOHADA') {
  const headers = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'ValidDate'
  ]

  const libellesComptes: Record<string, string> = {
    '701100': 'Ventes de marchandises',
    '411100': 'Clients ordinaires',
    '443100': 'TVA facturée sur ventes',
    '571100': 'Caisse centrale',
    '521100': 'Banque commerciale',
    '521200': 'Wave Mobile Money',
    '521300': 'Orange Money',
    '521400': 'Carte bancaire TPE',
    '605100': 'Achats de matières & fournitures',
  }

  const rows = ecritures.map((e, idx) => [
    e.journalCode,
    e.journalCode === 'VT' ? 'Ventes' : e.journalCode === 'CA' ? 'Caisse' : 'Banque',
    idx + 1,
    e.date.split('/').reverse().join(''), // Format YYYYMMDD
    e.compteGeneral,
    libellesComptes[e.compteGeneral] || 'Compte opérationnel',
    e.compteTiers || '',
    e.numeroPiece,
    e.date.split('/').reverse().join(''),
    `"${e.libelle.replace(/"/g, '""')}"`,
    e.debit > 0 ? e.debit.toFixed(2) : '0.00',
    e.credit > 0 ? e.credit.toFixed(2) : '0.00',
    e.date.split('/').reverse().join('')
  ])

  const tsvContent = [
    headers.join('\t'),
    ...rows.map(r => r.join('\t'))
  ].join('\r\n')

  telechargerFichier(tsvContent, `${nomFichier}_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8;')
}

/**
 * Exporte au format JSON pour intégration Odoo 16/17 (account.move)
 */
export function exportOdooJSON(ecritures: EcritureSyscohada[], nomBoutique: string) {
  // Regroupement par numéro de pièce
  const parPiece = new Map<string, EcritureSyscohada[]>()
  for (const e of ecritures) {
    if (!parPiece.has(e.numeroPiece)) parPiece.set(e.numeroPiece, [])
    parPiece.get(e.numeroPiece)!.push(e)
  }

  const odooMoves = Array.from(parPiece.entries()).map(([piece, lines]) => ({
    name: piece,
    ref: `Nopalou POS - ${nomBoutique}`,
    date: lines[0].date.split('/').reverse().join('-'), // YYYY-MM-DD
    journal_id: lines[0].journalCode === 'VT' ? 'Customer Invoices' : 'Cash',
    line_ids: lines.map(l => ({
      account_code: l.compteGeneral,
      name: l.libelle,
      debit: l.debit,
      credit: l.credit,
      partner_name: l.compteTiers || false,
    }))
  }))

  const jsonStr = JSON.stringify({
    version: '1.0',
    system: 'NOPALOU_COMMERCE_OS',
    norme: 'SYSCOHADA',
    boutique: nomBoutique,
    generated_at: new Date().toISOString(),
    moves: odooMoves
  }, null, 2)

  telechargerFichier(jsonStr, `NOPALOU_ODOO_${nomBoutique.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8;')
}

function telechargerFichier(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
