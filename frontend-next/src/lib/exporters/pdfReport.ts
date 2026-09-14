export interface PrintPDFReportOptions {
  title: string
  subtitle?: string
  headers?: string[]
  tableHeaders?: string[]
  rows?: (string | number)[][]
  tableRows?: (string | number)[][]
  summaryHtml?: string
  summaryCards?: Array<{ label: string; value: string; color?: string }>
  customBodyHtml?: string
}

export function printPDFReport(
  titleOrOptions: string | PrintPDFReportOptions,
  subtitleArg?: string,
  headersArg?: string[],
  rowsArg?: (string | number)[][],
  summaryHtmlArg?: string,
  customBodyHtmlArg?: string
) {
  let title = ''
  let subtitle = ''
  let headers: string[] = []
  let rows: (string | number)[][] = []
  let summaryHtml = ''
  let customBodyHtml: string | undefined

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title || ''
    subtitle = titleOrOptions.subtitle || ''
    headers = titleOrOptions.tableHeaders || titleOrOptions.headers || []
    rows = titleOrOptions.tableRows || titleOrOptions.rows || []
    customBodyHtml = titleOrOptions.customBodyHtml
    if (titleOrOptions.summaryCards && titleOrOptions.summaryCards.length > 0) {
      summaryHtml = `
        <div class="summary" style="display: flex; gap: 16px; flex-wrap: wrap;">
          ${titleOrOptions.summaryCards
            .map(
              (card) => `
            <div style="flex: 1; min-width: 160px; padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">${card.label}</div>
              <div style="font-size: 18px; font-weight: 800; color: ${card.color || '#1e293b'}; margin-top: 4px;">${card.value}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
    } else {
      summaryHtml = titleOrOptions.summaryHtml || ''
    }
  } else {
    title = titleOrOptions || ''
    subtitle = subtitleArg || ''
    headers = headersArg || []
    rows = rowsArg || []
    summaryHtml = summaryHtmlArg || ''
    customBodyHtml = customBodyHtmlArg
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  const tableHeaders = headers.map(h => `<th style="padding:8px 12px; border:1px solid #cbd5e1; background:#f8fafc; text-align:left; font-size:12px;">${h}</th>`).join('')
  const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="padding:8px 12px; border:1px solid #e2e8f0; font-size:12px;">${c}</td>`).join('')}</tr>`).join('')

  const bodyContent = customBodyHtml || `
    ${summaryHtml}
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
        <button class="no-print" onclick="window.print()" style="padding:10px 18px; background:#C75B00; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Imprimer / Sauvegarder PDF</button>
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
