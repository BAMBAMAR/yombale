'use client'

import { useState } from 'react'
import { fcfa } from '@/lib/format'
import { showToast } from '@/context/ToastContext'
import {
  isBluetoothSupported,
  requestBluetoothPrinter,
  sendEscPosToBluetooth,
} from '@/lib/web-bluetooth-printer'
import type { ProduitCaisse } from '../components/PosCatalogueSection'

export function usePosPrinting({
  boutiqueActive,
  formatTicketThermique,
  caissierNom,
  setProduits,
}: {
  boutiqueActive: any
  formatTicketThermique: '80mm' | '58mm'
  caissierNom: string
  setProduits: React.Dispatch<React.SetStateAction<ProduitCaisse[]>>
}) {
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null)
  const [btCharacteristic, setBtCharacteristic] = useState<any>(null)

  async function connecterImprimanteBluetooth() {
    if (!isBluetoothSupported()) {
      showToast(
        "L'API WebBluetooth Direct est supportée sur Chrome et Edge. Le mode impression web standard reste actif.",
        'info',
        'Impression Bluetooth',
        5000
      )
      return
    }
    try {
      const { device, characteristic } = await requestBluetoothPrinter()
      setBtDeviceName(device.name || 'Imprimante POS Bluetooth')
      setBtCharacteristic(characteristic)
      showToast(
        `Imprimante Bluetooth "${device.name || 'POS'}" connectée ! Tickets prêts en 1-clic direct.`,
        'success',
        'Imprimante Connectée'
      )
    } catch (err: any) {
      console.error('[BLUETOOTH PRINT ERR]', err)
      if (err.name !== 'NotFoundError') {
        showToast(`Information Bluetooth : ${err.message || err}`, 'error', 'Bluetooth')
      }
    }
  }

  async function imprimerTicketThermique(vente: any) {
    if (!vente) return

    // Si une imprimante Bluetooth direct est connectée via WebBluetooth
    if (btCharacteristic) {
      try {
        const bqNom = boutiqueActive?.nom || 'NOPALOU BOUTIQUE'
        const items = (vente.ticket || vente.items || []).map((i: any) => ({
          nom: i.produit?.nom || i.nom || 'Article',
          quantite: i.quantite || 1,
          prixUnitaire: i.prixUnitaire || i.prix || 0,
        }))

        await sendEscPosToBluetooth(btCharacteristic, {
          boutiqueNom: bqNom,
          ticketId: vente.id,
          dateStr: vente.date || new Date().toLocaleDateString('fr-FR'),
          caissierNom: vente.caissier || caissierNom,
          items,
          totalNet: vente.total || 0,
          modePaiement: vente.modePaiement || vente.mode || 'ESPECES',
          formatTicket: formatTicketThermique,
        })
        return
      } catch (err: any) {
        console.error('[BT PRINT EXEC ERR]', err)
        showToast("Impression Bluetooth directe interrompue. Basculement vers l'impression standard.", 'warning', 'Impression')
      }
    }

    // Impression Web Standard
    const windowPrint = window.open('', '_blank', 'width=400,height=600')
    if (!windowPrint) {
      window.print()
      return
    }
    const widthMm = formatTicketThermique === '58mm' ? '58mm' : '80mm'
    const bqNom = boutiqueActive?.nom || 'NOPALOU BOUTIQUE'
    const itemsHtml = (vente.ticket || vente.items || [])
      .map(
        (i: any) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 4px 0; text-align: left;">${i.quantite || 1}x ${i.produit?.nom || i.nom}</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">${fcfa(
          (i.prixUnitaire || i.prix || 0) * (i.quantite || 1)
        )}</td>
      </tr>
    `
      )
      .join('')

    windowPrint.document.write(`
      <html>
        <head>
          <title>Ticket de Caisse ESC/POS</title>
          <style>
            @page { size: ${widthMm} auto; margin: 0; }
            body { width: ${widthMm}; margin: 0 auto; padding: 6px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px; text-transform: uppercase;">${bqNom}</div>
          <div class="center" style="font-size: 10px; margin-top: 2px;">Ticket #${vente.id} • ${
      vente.date || new Date().toLocaleDateString('fr-FR')
    }</div>
          <div class="center" style="font-size: 10px;">Caissier: ${vente.caissier || caissierNom}</div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Article</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;" class="bold">
            <span>TOTAL NET :</span>
            <span>${fcfa(vente.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
            <span>Mode Règlement:</span>
            <span>${(vente.modePaiement || vente.mode || 'ESPECES').toUpperCase()}</span>
          </div>
          <div class="divider"></div>
          <div class="center bold" style="margin-top: 8px;">MERCI DE VOTRE VISITE !</div>
          <div class="center" style="font-size: 9px; margin-top: 2px;">Logiciel de Caisse Nopalou POS</div>
        </body>
      </html>
    `)
    windowPrint.document.close()
    windowPrint.focus()
    setTimeout(() => {
      windowPrint.print()
      windowPrint.close()
    }, 250)
  }

  function genererImprimerEtiquetteCodeBarre(e: React.MouseEvent, p: ProduitCaisse) {
    e.stopPropagation()
    let cb = p.code_barre
    if (!cb || cb === 'N/A') {
      const prefixe = '200'
      const corps = Math.floor(100000000 + Math.random() * 900000000).toString()
      const base12 = prefixe + corps
      let somme = 0
      for (let i = 0; i < 12; i++) {
        const val = parseInt(base12[i], 10)
        somme += i % 2 === 0 ? val : val * 3
      }
      const check = (10 - (somme % 10)) % 10
      cb = base12 + check

      setProduits((prev) => prev.map((item) => (item.id === p.id ? { ...item, code_barre: cb } : item)))
    }

    const windowPrint = window.open('', '_blank', 'width=400,height=300')
    if (!windowPrint) return

    const bqNom = boutiqueActive?.nom || 'NOPALOU BOUTIQUE'

    windowPrint.document.write(`
      <html>
        <head>
          <title>Étiquette Code-Barres EAN - ${p.nom}</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            body { width: 50mm; height: 30mm; margin: 0 auto; padding: 4px; font-family: Arial, sans-serif; text-align: center; box-sizing: border-box; }
            .store { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #475569; }
            .nom { font-size: 10px; font-weight: bold; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .prix { font-size: 12px; font-weight: 900; color: #000; margin-bottom: 2px; }
            .code-text { font-size: 10px; font-weight: bold; font-family: monospace; letter-spacing: 2px; margin-top: 4px; border-top: 1px dashed #000; padding-top: 2px; }
          </style>
        </head>
        <body>
          <div class="store">${bqNom}</div>
          <div class="nom">${p.nom}</div>
          <div class="prix">${fcfa(p.prix)}</div>
          <div class="code-text">║▌║█║▌│║▌║▌█ <br/>${cb}</div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 300);
          </script>
        </body>
      </html>
    `)
    windowPrint.document.close()
    windowPrint.focus()
  }

  return {
    btDeviceName,
    connecterImprimanteBluetooth,
    imprimerTicketThermique,
    genererImprimerEtiquetteCodeBarre,
  }
}
