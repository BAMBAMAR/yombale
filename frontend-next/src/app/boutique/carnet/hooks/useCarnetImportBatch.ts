'use client'

import { useState } from 'react'

interface UseCarnetImportBatchProps {
  boutiqueId: string
  onImportSuccess: () => Promise<void>
}

export function useCarnetImportBatch({ boutiqueId, onImportSuccess }: UseCarnetImportBatchProps) {
  const [showModalImportClients, setShowModalImportClients] = useState(false)
  const [clientsAImporter, setClientsAImporter] = useState<
    Array<{ nom: string; telephone: string; solde: number; adresse?: string; plafond_max?: number }>
  >([])
  const [importingClients, setImportingClients] = useState(false)
  const [importClientsError, setImportClientsError] = useState<string | null>(null)
  const [importClientsSuccess, setImportClientsSuccess] = useState<string | null>(null)

  const telechargerModeleClientsCSV = () => {
    const entetes = ['Nom', 'Telephone', 'Solde_Initial', 'Adresse', 'Plafond_Max']
    const exemple = ['Mamadou Diallo', '771234567', '15000', 'Medina Rue 6', '200000']
    const contenu = [entetes.join(';'), exemple.join(';')].join('\n')
    const blob = new Blob(['\ufeff' + contenu], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modele_import_clients_nopalou.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClientFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportClientsError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split(/\r?\n/).filter((line) => line.trim())
        if (lines.length <= 1) {
          setImportClientsError('Fichier vide ou format non valide')
          return
        }

        const sep = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ','
        const startIdx =
          lines[0].toLowerCase().includes('nom') || lines[0].toLowerCase().includes('client') ? 1 : 0
        const parsed: any[] = []

        for (let i = startIdx; i < lines.length; i++) {
          const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''))
          if (cols.length >= 1 && cols[0]) {
            const nom = cols[0]
            const telephone = cols[1] || 'Non renseigné'
            const soldeRaw = cols[2] ? cols[2].replace(/FCFA|CFA|[\s\xa0]/gi, '').replace(',', '.') : '0'
            const solde = parseFloat(soldeRaw) || 0
            const adresse = cols[3] || undefined
            const plafond_max = cols[4] ? Number(cols[4]) || 200000 : 200000

            parsed.push({ nom, telephone, solde, adresse, plafond_max })
          }
        }

        if (parsed.length === 0) {
          setImportClientsError('Aucun client valide trouvé.')
        } else {
          setClientsAImporter(parsed)
        }
      } catch {
        setImportClientsError('Impossible de lire le fichier.')
      }
    }
    reader.readAsText(file)
  }

  const validerImportClients = async () => {
    if (clientsAImporter.length === 0) return
    setImportingClients(true)
    setImportClientsError(null)
    setImportClientsSuccess(null)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/import-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients: clientsAImporter }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportClientsSuccess(
          `${data.imported || clientsAImporter.length} client(s) importé(s) avec succès !`
        )
        setClientsAImporter([])
        await onImportSuccess()
        setTimeout(() => setShowModalImportClients(false), 1500)
      } else {
        setImportClientsError(data.error || 'Erreur lors de l’importation.')
      }
    } catch {
      setImportClientsError('Erreur réseau lors de l’import.')
    } finally {
      setImportingClients(false)
    }
  }

  return {
    showModalImportClients,
    setShowModalImportClients,
    clientsAImporter,
    importingClients,
    importClientsError,
    importClientsSuccess,
    telechargerModeleClientsCSV,
    handleClientFileUpload,
    validerImportClients,
  }
}
