/**
 * Web Bluetooth ESC/POS Thermal Printer Service (58mm / 80mm)
 * Compatible with Android Chrome, Edge, and desktop browsers supporting Web Bluetooth.
 */

export interface PosTicketItem {
  nom: string
  quantite: number
  prixUnitaire: number
}

export interface PosTicketData {
  boutiqueNom: string
  ticketId: string | number
  dateStr?: string
  caissierNom?: string
  items: PosTicketItem[]
  totalNet: number
  modePaiement?: string
  formatTicket?: '58mm' | '80mm'
}

export function isBluetoothSupported(): boolean {
  return typeof window !== 'undefined' && 'bluetooth' in navigator
}

// Known thermal printer BLE service UUIDs
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000e0ff-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
]

export async function requestBluetoothPrinter(): Promise<{
  device: any
  characteristic: any
}> {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth non supporté par ce navigateur.')
  }

  const device: any = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: KNOWN_PRINTER_SERVICES,
  })

  const server = await device.gatt.connect()
  const services = await server.getPrimaryServices()
  let characteristic = null

  for (const service of services) {
    const characteristics = await service.getCharacteristics()
    for (const c of characteristics) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        characteristic = c
        break
      }
    }
    if (characteristic) break
  }

  if (!characteristic) {
    throw new Error("Imprimante trouvée mais canal d'écriture ESC/POS non détecté.")
  }

  return { device, characteristic }
}

/**
 * Format string as padded ESC/POS line
 */
function padLine(left: string, right: string, maxLen: number): string {
  const availableSpace = maxLen - left.length - right.length
  if (availableSpace <= 0) {
    return left.substring(0, maxLen - right.length - 1) + ' ' + right
  }
  return left + ' '.repeat(availableSpace) + right
}

/**
 * Generates raw ESC/POS binary buffer
 */
export function buildEscPosPayload(data: PosTicketData): Uint8Array {
  const is58 = data.formatTicket !== '80mm'
  const maxChars = is58 ? 32 : 48

  const ESC = '\x1B'
  const GS = '\x1D'

  let text = ''
  // 1. Initialisation ESC @
  text += `${ESC}@`

  // 2. En-tête centré, double hauteur pour le nom
  text += `${ESC}a\x01` // Centré
  text += `${GS}!\x11${data.boutiqueNom}\n${GS}!\x00`
  text += `Ticket #${data.ticketId} - ${data.dateStr || new Date().toLocaleDateString('fr-FR')}\n`
  if (data.caissierNom) {
    text += `Caissier: ${data.caissierNom}\n`
  }
  text += '-'.repeat(maxChars) + '\n'

  // 3. Articles (aligné à gauche)
  text += `${ESC}a\x00` // Gauche
  for (const item of data.items) {
    const totalItem = (item.prixUnitaire * item.quantite).toLocaleString('fr-FR') + ' F'
    const itemPrefix = `${item.quantite}x ${item.nom}`
    text += padLine(itemPrefix, totalItem, maxChars) + '\n'
  }

  // 4. Séparateur & Total Net (Gras, grand)
  text += '-'.repeat(maxChars) + '\n'
  text += `${ESC}a\x02` // Droite
  text += `${ESC}E\x01` // Bold ON
  const totalFormatted = `${data.totalNet.toLocaleString('fr-FR')} FCFA`
  text += `TOTAL NET : ${totalFormatted}\n`
  text += `${ESC}E\x00` // Bold OFF

  // 5. Mode de règlement & Pied de ticket
  text += `${ESC}a\x01` // Centré
  text += `Mode : ${(data.modePaiement || 'ESPECES').toUpperCase()}\n`
  text += '-'.repeat(maxChars) + '\n'
  text += 'MERCI DE VOTRE CONFIANCE !\n'
  text += 'Nopalou POS · Caisse Rapide\n'

  // 6. Saut de lignes & Découpe automatique du papier
  text += '\n\n\n\n'
  text += `${GS}V\x41\x00` // Cut paper command

  const encoder = new TextEncoder()
  return encoder.encode(text)
}

/**
 * Send bytes in chunks of 512 bytes to BLE GATT characteristic
 */
export async function sendEscPosToBluetooth(
  characteristic: any,
  data: PosTicketData
): Promise<void> {
  const bytes = buildEscPosPayload(data)
  const chunkSize = 512
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk)
    } else {
      await characteristic.writeValue(chunk)
    }
  }
}
