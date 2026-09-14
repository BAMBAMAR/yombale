/**
 * Utilitaire d'exportation CSV et Excel pour Nopalou
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface WaveBulkItem {
  reference: string
  boutique_nom: string
  mobile: string
  montant_net: number
}

function formatPhoneE164(phone: string): string {
  let cleaned = String(phone || '').replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('00221')) cleaned = '+' + cleaned.slice(2)
    else if (cleaned.startsWith('221')) cleaned = '+' + cleaned
    else if (cleaned.length === 9) cleaned = '+221' + cleaned
    else cleaned = '+' + cleaned
  }
  return cleaned
}

/**
 * Exporte un lot de reversements au format exact exigé par la plateforme Wave Business pour le paiement en masse.
 */
export function exportWaveBulkPaymentCSV(filename: string, items: WaveBulkItem[]) {
  const headers = [
    'Nom du client',
    'Numéro de téléphone',
    'Montant',
    'Devise (optionnel)',
    'Raison du paiement (optionnel)',
    'Numéro d\'identification national (optionnel)',
    'Référence (optionnel)'
  ]

  const rows = items.map(item => {
    const nomClient = String(item.boutique_nom || 'Marchand').replace(/"/g, '""')
    const telephone = formatPhoneE164(item.mobile)
    const montant = Math.round(Number(item.montant_net) || 0)
    const devise = 'XOF'
    const raisonBrute = `Reversement Nopalou ${item.reference}`
    const raison = raisonBrute.slice(0, 40).replace(/"/g, '""')
    const nationalId = ''
    const reference = `REV-${item.reference}`.replace(/"/g, '""')

    return [nomClient, telephone, montant, devise, raison, nationalId, reference]
  })

  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\r\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_WAVE_BULK_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporte un lot de reversements au format Microsoft Excel (.xls) exigé par la plateforme Wave Business.
 */
export function exportWaveBulkPaymentXLS(filename: string, items: WaveBulkItem[]) {
  const headers = [
    'Nom du client',
    'Numéro de téléphone',
    'Montant',
    'Devise (optionnel)',
    'Raison du paiement (optionnel)',
    'Numéro d\'identification national (optionnel)',
    'Référence (optionnel)'
  ]

  const rows = items.map(item => {
    const nomClient = String(item.boutique_nom || 'Marchand')
    const telephone = formatPhoneE164(item.mobile)
    const montant = Math.round(Number(item.montant_net) || 0)
    const devise = 'XOF'
    const raison = `Reversement Nopalou ${item.reference}`.slice(0, 40)
    const nationalId = ''
    const reference = `REV-${item.reference}`

    return [nomClient, telephone, montant, devise, raison, nationalId, reference]
  })

  const headerHtml = headers.map(h => `<th style="background:#f1f5f9; font-weight:bold; border:1px solid #cbd5e1; text-align:left; padding:8px 12px;">${h}</th>`).join('')
  const rowsHtml = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #cbd5e1; padding:8px 12px;">${c}</td>`).join('')}</tr>`).join('')

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Wave Bulk Payout</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_WAVE_BULK_${new Date().toISOString().slice(0, 10)}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface SyscohadaVente {
  id: string
  reference: string
  date: string
  nom_produit: string
  quantite: number
  montant_total: number
  methode_paiement: string | null
  client_nom?: string | null
}

/**
 * Exporte le Journal Général des Ventes au format officiel SYSCOHADA révisé (OHADA),
 * directement exploitable par les logiciels comptables (Sage, Saari, Odoo, QuickBooks).
 */
export function exportSyscohadaGeneralLedgerCSV(
  boutiqueNom: string,
  periodeLabel: string,
  ventes: SyscohadaVente[]
) {
  const headers = [
    'Date Écriture',
    'N° Pièce / Référence',
    'Code Journal',
    'N° Compte Général',
    'Intitulé du Compte',
    'Libellé de l\'Écriture',
    'Débit (FCFA)',
    'Crédit (FCFA)',
    'Mode Règlement',
    'Tiers / Client',
  ]

  const rows: (string | number)[][] = []

  for (const v of ventes) {
    const dateFormatted = v.date ? new Date(v.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')
    const ref = v.reference || v.id.slice(0, 8)
    const mode = (v.methode_paiement || 'cash').toLowerCase()
    const client = v.client_nom || 'Client Comptoir'
    const montant = Number(v.montant_total) || 0

    // Détermination compte de trésorerie / tiers (Débit) selon Plan Comptable SYSCOHADA
    let compteTresorerie = '571000'
    let intituleTresorerie = 'Caisse Centrale Espèces'
    if (mode === 'wave') {
      compteTresorerie = '521100'
      intituleTresorerie = 'Banque / Compte Wave Business'
    } else if (mode === 'orange_money' || mode === 'om') {
      compteTresorerie = '521200'
      intituleTresorerie = 'Banque / Compte Orange Money'
    } else if (mode === 'credit') {
      compteTresorerie = '411100'
      intituleTresorerie = 'Clients - Créances sur Ventes'
    } else if (mode === 'virement' || mode === 'cb') {
      compteTresorerie = '521000'
      intituleTresorerie = 'Banque / Établissements Financiers'
    }

    // Écriture 1 : Débit Compte Trésorerie ou Tiers (Entrée d'argent ou créance)
    rows.push([
      dateFormatted,
      ref,
      'VT', // Journal des Ventes
      compteTresorerie,
      intituleTresorerie,
      `Encaissement Vente #${ref} - ${v.nom_produit}`,
      montant,
      0,
      mode.toUpperCase(),
      client,
    ])

    // Écriture 2 : Crédit Compte 701 (Ventes de Marchandises)
    rows.push([
      dateFormatted,
      ref,
      'VT',
      '701000',
      'Ventes de Marchandises dans la Région (SYSCOHADA)',
      `Chiffre d'affaires Vente #${ref} - ${v.nom_produit} (x${v.quantite})`,
      0,
      montant,
      mode.toUpperCase(),
      client,
    ])
  }

  exportToCSV(`Grand_Livre_SYSCOHADA_${(boutiqueNom || 'Boutique').replace(/\s+/g, '_')}_${periodeLabel}`, headers, rows)
}
