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

export function printPDFReport(title: string, subtitle: string, headers: string[], rows: (string | number)[][], summaryHtml?: string, customBodyHtml?: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  const tableHeaders = headers.map(h => `<th style="padding:8px 12px; border:1px solid #cbd5e1; background:#f8fafc; text-align:left; font-size:12px;">${h}</th>`).join('')
  const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="padding:8px 12px; border:1px solid #e2e8f0; font-size:12px;">${c}</td>`).join('')}</tr>`).join('')

  const bodyContent = customBodyHtml || `
    <table>
      <thead><tr>${tableHeaders}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; }
        h1 { margin: 0 0 4px; font-size: 22px; color: #C75B00; }
        p { margin: 0 0 16px; font-size: 13px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
        .summary { margin-bottom: 20px; padding: 16px; background: #fff7f0; border: 1px solid #fed7aa; border-radius: 8px; }
        .client-section { margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; background: #ffffff; }
        .client-header { background: #f8fafc; margin: -16px -16px 14px -16px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; border-top-left-radius: 10px; border-top-right-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          .client-section { page-break-inside: avoid; }
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
      ${bodyContent}
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

export function printBilanComptablePDF({
  boutiqueNom,
  periodeLabel,
  financier,
  inventaire,
  caissiers,
}: {
  boutiqueNom: string
  periodeLabel: string
  financier: {
    ca_total: number
    depenses_total: number
    benefice_net: number
    marge_nette_pct: number
    nb_ventes: number
    panier_moyen: number
    modes_paiement: { mode: string; count: number; total: number }[]
    depenses_par_categorie?: Record<string, number>
    top_produits?: { nom_produit: string; total_vendu: number; ca_genere: number }[]
  }
  inventaire?: {
    total_quantite_stock: number
    valeur_stock_achat: number
    valeur_stock_vente: number
    marge_stock_potentielle: number
    marge_stock_pct: number
  }
  caissiers?: { nom: string; nb_ventes: number; ca_total: number; panier_moyen: number; part_ca_pct: number }[]
}) {
  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (!printWindow) return

  const f = (n: number) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
  const modeLabels: Record<string, string> = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces (Cash)', virement: 'Virement', carte: 'Carte bancaire' }

  const modesHtml = (financier.modes_paiement || []).map(m => `
    <tr>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px;">${modeLabels[m.mode] || m.mode}</td>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; text-align:right;">${m.count}</td>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; text-align:right; font-weight:bold;">${f(m.total)}</td>
    </tr>
  `).join('')

  const caissiersHtml = (caissiers || []).map(c => `
    <tr>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; font-weight:bold;">${c.nom}</td>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; text-align:right;">${c.nb_ventes}</td>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; text-align:right; font-weight:bold; color:#1e3a8a;">${f(c.ca_total)}</td>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; text-align:right;">${f(c.panier_moyen)}</td>
      <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:12px; text-align:right;">${c.part_ca_pct}%</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>Bilan Financier — ${boutiqueNom}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #0f172a; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 20px; }
        h1 { margin: 0 0 4px; font-size: 22px; color: #1e3a5f; }
        .subtitle { margin: 0; font-size: 13px; color: #64748b; }
        .grid-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
        .kpi-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
        .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; }
        .section-title { font-size: 15px; font-weight: bold; color: #1e3a5f; margin: 20px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11.5px; text-align: left; font-weight: bold; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>📊 Bilan Financier & Compte de Résultat</h1>
          <p class="subtitle">Boutique : <strong>${boutiqueNom}</strong> · Période : <strong>${periodeLabel}</strong></p>
        </div>
        <button class="no-print" onclick="window.print()" style="padding:10px 18px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ Imprimer / Sauvegarder PDF</button>
      </div>

      <div class="grid-kpis">
        <div class="kpi-card" style="border-left: 4px solid #1e3a8a;">
          <div class="kpi-label">Chiffre d'Affaires</div>
          <div class="kpi-value" style="color:#1e3a8a;">${f(financier.ca_total)}</div>
          <div style="font-size:10.5px; color:#64748b; margin-top:2px;">${financier.nb_ventes} ventes réalisées</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #dc2626;">
          <div class="kpi-label">Total Dépenses</div>
          <div class="kpi-value" style="color:#dc2626;">${f(financier.depenses_total)}</div>
          <div style="font-size:10.5px; color:#64748b; margin-top:2px;">Charges d'exploitation</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid ${financier.benefice_net >= 0 ? '#16a34a' : '#dc2626'}; background: ${financier.benefice_net >= 0 ? '#f0fdf4' : '#fef2f2'};">
          <div class="kpi-label">Résultat Net (Bénéfice)</div>
          <div class="kpi-value" style="color:${financier.benefice_net >= 0 ? '#15803d' : '#b91c1c'};">${f(financier.benefice_net)}</div>
          <div style="font-size:10.5px; color:${financier.benefice_net >= 0 ? '#166534' : '#991b1b'}; margin-top:2px;">Marge nette : ${financier.marge_nette_pct}%</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #d97706;">
          <div class="kpi-label">Panier Moyen</div>
          <div class="kpi-value" style="color:#b45309;">${f(financier.panier_moyen)}</div>
          <div style="font-size:10.5px; color:#64748b; margin-top:2px;">Par transaction</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <div class="section-title">💳 Répartition des Encaissements</div>
          <table>
            <thead>
              <tr><th>Mode</th><th style="text-align:right;">Nb</th><th style="text-align:right;">Montant</th></tr>
            </thead>
            <tbody>${modesHtml || '<tr><td colspan="3" style="text-align:center; padding:10px; color:#94a3b8;">Aucun encaissement sur la période</td></tr>'}</tbody>
          </table>
        </div>

        <div>
          <div class="section-title">📦 Valorisation du Stock Actuel</div>
          ${inventaire ? `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:12.5px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Articles en stock :</span><strong>${inventaire.total_quantite_stock} unités</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Valeur au coût d'achat :</span><strong>${f(inventaire.valeur_stock_achat)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Valeur marchande potentielle :</span><strong>${f(inventaire.valeur_stock_vente)}</strong></div>
              <div style="display:flex; justify-content:space-between; padding-top:6px; border-top:1px dashed #cbd5e1; color:#16a34a;"><span>Marge brute dormante :</span><strong>${f(inventaire.marge_stock_potentielle)} (${inventaire.marge_stock_pct}%)</strong></div>
            </div>
          ` : '<p style="color:#64748b; font-size:12px;">Non disponible</p>'}
        </div>
      </div>

      ${(caissiers && caissiers.length > 0) ? `
        <div class="section-title">👤 Performances par Vendeur / Caissier</div>
        <table>
          <thead>
            <tr><th>Caissier / Vendeur</th><th style="text-align:right;">Tickets</th><th style="text-align:right;">CA Encaissé</th><th style="text-align:right;">Panier Moyen</th><th style="text-align:right;">Part</th></tr>
          </thead>
          <tbody>${caissiersHtml}</tbody>
        </table>
      ` : ''}

      <div style="margin-top:30px; padding-top:12px; border-top:1px solid #cbd5e1; display:flex; justify-content:space-between; font-size:11px; color:#64748b;">
        <span>Document officiel généré automatiquement par Nopalou POS</span>
        <span>Date d'édition : ${new Date().toLocaleString('fr-FR')}</span>
      </div>

      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

export function printInventairePDF({
  boutiqueNom,
  inventaireStats,
  produits,
}: {
  boutiqueNom: string
  inventaireStats: {
    total_references: number
    total_quantite_stock: number
    valeur_stock_achat: number
    valeur_stock_vente: number
    marge_stock_potentielle: number
  }
  produits: any[]
}) {
  const printWindow = window.open('', '_blank', 'width=950,height=800')
  if (!printWindow) return

  const f = (n: number) => Number(n || 0).toLocaleString('fr-FR') + ' F'

  const prodsHtml = produits.map((p, idx) => `
    <tr>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:center;">${idx + 1}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11.5px; font-weight:bold;">${p.nom}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; color:#64748b;">${p.categorie || '—'}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:center; font-family:monospace;">${p.code_barre || '—'}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:12px; font-weight:bold; text-align:right; color:${p.stock_quantite <= 3 ? '#b45309' : '#0f172a'};">${p.stock_quantite ?? 0}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:right;">${p.prix_achat ? f(p.prix_achat) : '—'}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:right; font-weight:bold;">${p.prix ? f(p.prix) : '—'}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:right; color:#1e3a8a; font-weight:bold;">${f(p.valeur_vente_totale || (p.prix * (p.stock_quantite || 0)))}</td>
      <td style="padding:6px 8px; border:1px solid #cbd5e1; font-size:11px; text-align:center; width:45px;"><span style="display:inline-block; width:14px; height:14px; border:1.5px solid #64748b; border-radius:3px;"></span></td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>Fiche d'Inventaire — ${boutiqueNom}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
        h1 { margin: 0 0 4px; font-size: 20px; color: #0284c7; }
        .summary-bar { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 10px 16px; display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 8px; font-size: 11px; text-align: left; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>📋 Fiche d'Inventaire Physique & Valorisation</h1>
          <p style="margin:0; font-size:12.5px; color:#64748b;">Boutique : <strong>${boutiqueNom}</strong> · Date du pointage : <strong>${new Date().toLocaleDateString('fr-FR')}</strong></p>
        </div>
        <button class="no-print" onclick="window.print()" style="padding:8px 16px; background:#0284c7; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ Imprimer Fiche</button>
      </div>

      <div class="summary-bar">
        <div><strong>${inventaireStats.total_references}</strong> Références</div>
        <div><strong>${inventaireStats.total_quantite_stock}</strong> Pièces en stock</div>
        <div>Coût d'achat total : <strong>${f(inventaireStats.valeur_stock_achat)}</strong></div>
        <div>Valeur vente marchande : <strong style="color:#0369a1;">${f(inventaireStats.valeur_stock_vente)}</strong></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:30px; text-align:center;">#</th>
            <th>Désignation Article</th>
            <th>Catégorie</th>
            <th style="text-align:center;">Code Barre</th>
            <th style="text-align:right;">Stock Système</th>
            <th style="text-align:right;">P. Achat</th>
            <th style="text-align:right;">P. Vente</th>
            <th style="text-align:right;">Valeur Vente</th>
            <th style="text-align:center;">Pointage</th>
          </tr>
        </thead>
        <tbody>${prodsHtml}</tbody>
      </table>

      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Impression et export PDF officiel du Rapport Z / Clôture de Session de Caisse POS
 */
export function printPosSessionRapportZ_PDF({
  boutiqueNom,
  session,
  ventes = [],
}: {
  boutiqueNom: string
  session: any
  ventes?: any[]
}) {
  const printWindow = window.open('', '_blank', 'width=850,height=750')
  if (!printWindow) return

  const f = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA'
  const dateOuv = session.date_ouverture ? new Date(session.date_ouverture).toLocaleString('fr-FR') : '—'
  const dateClot = session.date_cloture ? new Date(session.date_cloture).toLocaleString('fr-FR') : 'En cours'
  const ecart = Number(session.ecart_caisse || 0)

  const ventesRowsHtml = (ventes || []).map((v, i) => `
    <tr>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; text-align:center; font-size:11px;">${i + 1}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; font-weight:700;">${v.reference || '—'}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px;">${v.nom_produit || 'Article'}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; text-align:center;">${v.quantite || 1}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; text-align:right; font-weight:700;">${f(v.montant_total)}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; text-align:center; text-transform:uppercase;">${v.methode_paiement || 'cash'}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>Rapport Z — Session Caisse ${session.id?.slice(0, 8) || ''}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
        .header { border-bottom: 2px solid #C75B00; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        h1 { margin: 0 0 4px; font-size: 20px; color: #C75B00; }
        .grid-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
        .kpi span { font-size: 11px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px; }
        .kpi strong { font-size: 15px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; text-align: left; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>🧾 Rapport Z — Clôture de Caisse POS</h1>
          <p style="margin:0; font-size:12.5px; color:#64748b;">
            Boutique : <strong>${boutiqueNom}</strong> · Caissier : <strong>${session.caissier_nom || 'Caissier Principal'}</strong><br/>
            Ouverture : <strong>${dateOuv}</strong> · Clôture : <strong>${dateClot}</strong>
          </p>
        </div>
        <button class="no-print" onclick="window.print()" style="padding:8px 16px; background:#C75B00; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ Imprimer Rapport</button>
      </div>

      <div class="grid-kpi">
        <div class="kpi">
          <span>Chiffre d'Affaires Total</span>
          <strong style="color:#1e3a8a;">${f(session.ventes_total)}</strong>
        </div>
        <div class="kpi">
          <span>Nombre de Ventes</span>
          <strong>${session.nb_ventes || 0} tickets</strong>
        </div>
        <div class="kpi">
          <span>Fond de Caisse Initial</span>
          <strong>${f(session.fond_caisse_initial)}</strong>
        </div>
        <div class="kpi">
          <span>Encaissements Espèces</span>
          <strong>${f(session.ventes_especes)}</strong>
        </div>
        <div class="kpi">
          <span>Encaissements Wave</span>
          <strong style="color:#0284c7;">${f(session.ventes_wave)}</strong>
        </div>
        <div class="kpi">
          <span>Encaissements Orange Money</span>
          <strong style="color:#ea580c;">${f(session.ventes_orange_money)}</strong>
        </div>
        <div class="kpi">
          <span>Espèces Comptées Physiquement</span>
          <strong>${f(session.especes_comptees)}</strong>
        </div>
        <div class="kpi" style="background:${ecart === 0 ? '#f0fdf4' : ecart > 0 ? '#eff6ff' : '#fef2f2'}; border-color:${ecart === 0 ? '#86efac' : ecart > 0 ? '#93c5fd' : '#fca5a5'};">
          <span>Écart de Caisse Constaté</span>
          <strong style="color:${ecart === 0 ? '#15803d' : ecart > 0 ? '#1d4ed8' : '#b91c1c'};">${ecart >= 0 ? '+' : ''}${f(ecart)}</strong>
        </div>
        <div class="kpi">
          <span>Statut Session</span>
          <strong style="text-transform:uppercase; color:${session.statut === 'cloturee' ? '#15803d' : '#C75B00'};">${session.statut || 'ouverte'}</strong>
        </div>
      </div>

      ${ventes.length > 0 ? `
        <h3 style="font-size:14px; margin:16px 0 6px; color:#1e293b;">📋 Détail des Ventes Réalisées (${ventes.length} articles)</h3>
        <table>
          <thead>
            <tr>
              <th style="width:30px; text-align:center;">#</th>
              <th>Référence</th>
              <th>Produit</th>
              <th style="text-align:center;">Qté</th>
              <th style="text-align:right;">Montant</th>
              <th style="text-align:center;">Règlement</th>
            </tr>
          </thead>
          <tbody>${ventesRowsHtml}</tbody>
        </table>
      ` : ''}

      <div style="margin-top:30px; display:flex; justify-content:space-between; font-size:12px; color:#64748b;">
        <div>Signature du Caissier : ___________________</div>
        <div>Visa du Responsable / Gérant : ___________________</div>
      </div>

      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}



