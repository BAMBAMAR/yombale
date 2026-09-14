'use client'

import React, { useState, useRef, useTransition } from 'react'
import { Produit, Zone } from '../types'
import { declarerVente } from '../../actions'
import { fcfa, inputStyle, labelStyle } from '../utils'
import { useTranslation } from '@/i18n/context'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import { ComptaVenteFormScanners } from './ComptaVenteFormScanners'
import { ComptaVenteFormProductSelector } from './ComptaVenteFormProductSelector'

interface ComptaVenteFormProps {
  boutiqueId: string
  produits: Produit[]
  zones: Zone[]
  onDone: () => void
}

export function ComptaVenteForm({ boutiqueId, produits, zones, onDone }: ComptaVenteFormProps) {
  const { t } = useTranslation()
  const [modeSelection, setModeSelection] = useState<'catalogue' | 'libre'>('catalogue')
  const [recherche, setRecherche] = useState('')
  const [catFiltre, setCatFiltre] = useState('tous')

  const [produitId, setProduitId] = useState('')
  const [nomLibre, setNomLibre] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prix, setPrix] = useState<number>(0)
  const [zoneId, setZoneId] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState('cash')
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Scanner EAN
  const [modalScannerEan, setModalScannerEan] = useState(false)
  const [scannerEanStatus, setScannerEanStatus] = useState('Initialisation…')
  const html5ScannerRef = useRef<any>(null)

  // Scanner Nom OCR
  const [modalScannerNom, setModalScannerNom] = useState(false)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [statusScannerNom, setStatusScannerNom] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  function handleProduit(id: string) {
    setProduitId(id)
    const p = produits.find(p => p.id === id)
    if (p?.nom) setNomLibre(p.nom)
    if (p?.prix) setPrix(p.prix)
    jouerBipEtVibrer('succes')
  }

  // ── Scanner EAN ──
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('Initialisation du scanner EAN…')

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) { console.warn('[Nopalou:ComptaVenteForm:EAN]', e) }
          html5ScannerRef.current = null
        }

        const scanner = new Html5Qrcode('vente-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const prodTrouve = produits.find(
            (p: any) =>
              p.barcode?.trim().toLowerCase() === code ||
              p.sku?.trim().toLowerCase() === code ||
              p.id?.trim().toLowerCase() === code ||
              p.code_barre?.trim().toLowerCase() === code
          )

          if (prodTrouve) {
            handleProduit(prodTrouve.id)
            jouerBipEtVibrer('succes')
            setScannerEanStatus(`Produit trouvé : "${prodTrouve.nom}"`)
            setTimeout(() => arreterScannerEan(), 600)
          } else {
            jouerBipEtVibrer('alerte')
            setScannerEanStatus(`Code "${decodedText}" inconnu dans le catalogue.`)
            if (confirm(`Code-barres "${decodedText}" non trouvé. L'ajouter comme article libre ?`)) {
              setProduitId('')
              setNomLibre(`Article EAN-${decodedText}`)
              setModeSelection('libre')
              arreterScannerEan()
            }
          }
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('Cadrez le code-barres dans le rectangle.')
        } catch (errEnv) {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {})
            setScannerEanStatus('Caméra active ! Placez le code-barres.')
          } catch (errUser) {
            setScannerEanStatus('Impossible d’accéder à la caméra.')
          }
        }
      } catch (err) {
        setScannerEanStatus('Erreur de chargement du module de scan.')
      }
    }, 250)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) { console.warn('[Nopalou:ComptaVenteForm:EANStop]', e) }
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  // ── Scanner Nom OCR ──
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setStatusScannerNom('Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNom = () => {
    if (streamNomRef.current) {
      streamNomRef.current.getTracks().forEach(t => t.stop())
      streamNomRef.current = null
    }
    setModalScannerNom(false)
  }

  const capturerNomOCR = async () => {
    if (!videoNomRef.current) return
    setOcrLoading(true)
    setStatusScannerNom('Analyse OCR en cours…')

    const imageBase64 = capturerZoneViseurExacte(videoNomRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setNomLibre(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNom(`Nom capturé : "${data.nom}"`)
        setTimeout(() => arreterScannerNom(), 1000)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNom(`${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNom('Erreur de lecture OCR.')
    }
  }

  function submit() {
    if (prix <= 0) {
      setError('Veuillez renseigner un prix unitaire valide (> 0).')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await declarerVente(boutiqueId, {
        produit_id: produitId || undefined,
        nom_produit: produitId ? undefined : (nomLibre.trim() || 'Produit'),
        quantite, prix_unitaire: prix,
        zone_livraison_id: zoneId || undefined,
        client_nom: clientNom.trim() || undefined,
        client_telephone: clientTel.trim() || undefined,
        methode_paiement: paiement,
      })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/ventes/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      onDone()
    })
  }



  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#0f172a' }}>{t('shop.declareSaleBtn')}</p>
        <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
          {t('shop.transactionSale')}
        </span>
      </div>

      {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13, fontWeight: 700 }}>{error}</div>}

      {/* Onglets de sélection du produit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, background: '#e2e8f0', padding: 3, borderRadius: 10, flex: 1 }}>
          <button
            type="button"
            onClick={() => setModeSelection('catalogue')}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
              background: modeSelection === 'catalogue' ? '#ffffff' : 'transparent',
              fontWeight: modeSelection === 'catalogue' ? 800 : 600,
              color: modeSelection === 'catalogue' ? '#0f172a' : '#64748b',
              fontSize: 12.5, cursor: 'pointer'
            }}
          >
            {t('shop.catalogModeTab')} ({produits.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setModeSelection('libre')
              setProduitId('')
            }}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
              background: modeSelection === 'libre' ? '#ffffff' : 'transparent',
              fontWeight: modeSelection === 'libre' ? 800 : 600,
              color: modeSelection === 'libre' ? '#0f172a' : '#64748b',
              fontSize: 12.5, cursor: 'pointer'
            }}
          >
            {t('shop.manualModeTab')}
          </button>
        </div>

        <button
          type="button"
          onClick={demarrerScannerEan}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#0284c7', color: '#fff', border: 'none',
            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer'
          }}
        >
          {t('shop.scanEanBtn')}
        </button>
      </div>

      <ComptaVenteFormProductSelector
        modeSelection={modeSelection}
        produits={produits}
        produitId={produitId}
        onSelectProduit={handleProduit}
        recherche={recherche}
        setRecherche={setRecherche}
        catFiltre={catFiltre}
        setCatFiltre={setCatFiltre}
        nomLibre={nomLibre}
        setNomLibre={setNomLibre}
        ocrDetections={ocrDetections}
        onDemarrerScannerNom={demarrerScannerNom}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('shop.quantityLabel')}</label>
          <input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('shop.unitPriceLabel')}</label>
          <input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {zones.length > 0 && (
        <div>
          <label style={labelStyle}>{t('shop.deliveryZoneLabel')}</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
            <option value="">— {t('common.none')} —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fcfa(z.prix)}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ ...labelStyle, marginBottom: 4, display: 'block' }}>{t('shop.customerFullNameLabel')} <span style={{ fontWeight: 400, color: '#64748b' }}>({t('common.optional')})</span></label>
          <input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder="Client comptoir" />
        </div>
        <div>
          <label style={{ ...labelStyle, marginBottom: 4, display: 'block' }}>{t('shop.customerPhoneLabel')} <span style={{ fontWeight: 400, color: '#64748b' }}>({t('common.optional')})</span></label>
          <input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{t('shop.paymentModePrompt')}</label>
        <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
          <option value="cash">Espèces</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
          <option value="virement">Virement</option>
        </select>
      </div>

      {prix > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 15, fontWeight: 900, color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('shop.totalSales')} :</span>
          <span>{fcfa(prix * quantite + (zoneId ? (zones.find(z => z.id === zoneId)?.prix ?? 0) : 0))}</span>
        </div>
      )}

      <div>
        <label style={labelStyle}>{t('shop.attachReceiptLabel')}</label>
        <input
          type="file" accept="image/*,application/pdf"
          onChange={e => setFichier(e.target.files?.[0] ?? null)}
          style={{ fontSize: 13, color: '#374151' }}
        />
        {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
      </div>

      <button onClick={submit} disabled={uploading} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 900, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: uploading ? 0.7 : 1 }}>
        {uploading ? t('common.loading') : `✓ ${t('shop.saveSaleBtn')}`}
      </button>

      <ComptaVenteFormScanners
        modalScannerEan={modalScannerEan}
        scannerEanStatus={scannerEanStatus}
        onCloseEan={arreterScannerEan}
        modalScannerNom={modalScannerNom}
        statusScannerNom={statusScannerNom}
        ocrLoading={ocrLoading}
        videoNomRef={videoNomRef}
        onCloseNom={arreterScannerNom}
        onCaptureNomOCR={capturerNomOCR}
      />
    </div>
  )
}
