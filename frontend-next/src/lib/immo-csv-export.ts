// frontend-next/src/lib/immo-csv-export.ts
// Utilitaire d'export CSV sécurisé avec BOM UTF-8 pour Excel & Google Sheets

import { showToast } from '@/context/ToastContext'

export interface CsvColumn<T = any> {
  header: string
  key?: keyof T | string
  formatter?: (item: T) => string | number | null | undefined
}

/**
 * Exporte une liste d'éléments sous forme de fichier CSV avec encodage UTF-8 (BOM)
 * garantissant un affichage parfait des caractères accentués sous Microsoft Excel.
 */
export function exportDataToCsv<T = any>(
  filename: string,
  columns: CsvColumn<T>[],
  data: T[]
): void {
  if (!data || data.length === 0) {
    showToast('Aucune donnée à exporter.', 'warning')
    return
  }

  // 1. En-têtes CSV
  const headerRow = columns
    .map(col => `"${String(col.header).replace(/"/g, '""')}"`)
    .join(';')

  // 2. Lignes de données
  const rows = data.map(item => {
    return columns
      .map(col => {
        let val: any
        if (col.formatter) {
          val = col.formatter(item)
        } else if (col.key) {
          val = (item as any)[col.key]
        }
        if (val === null || val === undefined) val = ''
        // Nettoyage et échappement des guillemets
        return `"${String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
      })
      .join(';')
  })

  // 3. BOM UTF-8 (\uFEFF)
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  // 4. Téléchargement via ancre éphémère
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Version polymorphe : accepte soit (filename, columns, data) soit (data, filename)
 */
export function exportToCsv<T = any>(
  arg1: string | T[],
  arg2?: CsvColumn<T>[] | string,
  arg3?: T[]
): void {
  if (Array.isArray(arg1)) {
    const data = arg1
    const filename = (typeof arg2 === 'string' ? arg2 : 'export.csv')
    if (data.length === 0) {
      showToast('Aucune donnée à exporter.', 'warning')
      return
    }
    const headers = Object.keys(data[0] || {})
    const cols: CsvColumn<any>[] = headers.map((h) => ({ header: h, key: h }))
    return exportDataToCsv(filename, cols, data)
  }
  return exportDataToCsv(arg1 as string, (arg2 || []) as CsvColumn<T>[], arg3 || [])
}
