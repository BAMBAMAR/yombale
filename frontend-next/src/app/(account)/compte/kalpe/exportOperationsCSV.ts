import { getKalpeOperations } from './actions'
import type { ContexteType } from './types'

type Toast = { info: (m: string) => void; success: (m: string) => void; error: (m: string) => void }

/** Export CSV du journal Sama Xaalis (séparé de SamaKalpeClient pour respecter le seuil de 450 lignes). */
export async function exporterOperationsCSV(contexte: ContexteType, toast: Toast) {
    try {
      const res = await getKalpeOperations({ limit: 1000, contexte })
      if (!res.operations || res.operations.length === 0) {
        toast.info('Aucune opération à exporter')
        return
      }

      const headers = ['Date', 'Type', 'Direction', 'Libellé', 'Catégorie', 'Montant (FCFA)', 'Tiers', 'Contexte']
      const rows = res.operations.map((op) => [
        new Date(op.date_operation).toLocaleDateString('fr-FR'),
        op.type,
        op.direction,
        `"${(op.libelle || '').replace(/"/g, '""')}"`,
        `"${(op.categorie || '').replace(/"/g, '""')}"`,
        op.montant,
        `"${(op.tiers_nom || '').replace(/"/g, '""')}"`,
        op.contexte,
      ])

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `sama_xaalis_export_${contexte}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Export CSV téléchargé avec succès')
    } catch {
      toast.error('Erreur lors de l’export CSV')
    }
}
