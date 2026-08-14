/**
 * Utilitaire d'exportation de données pour Nopalou (Excel / CSV & PDF / Impression)
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

export function printPDFReport(title: string, subtitle: string, headers: string[], rows: (string | number)[][], summaryHtml?: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  const tableHeaders = headers.map(h => `<th style="padding:8px 12px; border:1px solid #cbd5e1; background:#f8fafc; text-align:left; font-size:12px;">${h}</th>`).join('')
  const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="padding:8px 12px; border:1px solid #e2e8f0; font-size:12px;">${c}</td>`).join('')}</tr>`).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; }
        h1 { margin: 0 0 4px; font-size: 22px; color: #C75B00; }
        p { margin: 0 0 16px; font-size: 13px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .summary { margin-bottom: 20px; padding: 16px; background: #fff7f0; border: 1px solid #fed7aa; border-radius: 8px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <div>
          <h1>${title}</h1>
          <p>${subtitle} · Généré le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        <button class="no-print" onclick="window.print()" style="padding:10px 18px; background:#C75B00; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ Imprimer / Sauvegarder PDF</button>
      </div>
      ${summaryHtml || ''}
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
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
    // Wave limite la raison à 40 caractères max pour l'intégration SMS
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

