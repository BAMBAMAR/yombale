'use client'
import { useEffect, useState, useRef, useTransition } from 'react'
import {
  listZones, createZone, deleteZone,
  listVentes, declarerVente, deleteVente, updateVente,
  getDashboard, listDepenses, addDepense, deleteDepense, updateDepense,
  updateStock, getBoutiqueProduits
} from './actions'
import { fcfa, fmtDate, fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import { capturerEtOptimiserImageOCR, jouerBipScan } from '@/lib/ocr-helper'

interface Zone    { id: string; nom: string; prix: number }
interface Vente   { id: string; reference: string; nom_produit: string; quantite: number; prix_unitaire: number; frais_livraison: number; montant_total: number; client_nom: string | null; methode_paiement: string; created_at: string; justificatif_url: string | null }
interface Produit { id: string; nom: string; prix: number | null; stock_quantite: number | null; quantite_stock?: number | null }
interface Depense { id: string; montant: number; categorie: string; description: string | null; date_depense: string; justificatif_url: string | null }
interface Dashboard {
  ca_mois: number; ca_mois_precedent: number; nb_ventes_mois: number; ca_total: number
  depenses_mois: number; depenses_total: number; benefice_mois: number
  top_produits: { nom_produit: string; total_vendu: number; ca: number }[]
  stock_alerte: { id: string; nom: string; stock_quantite: number }[]
}

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const inputStyle = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', background: '#fff', boxSizing: 'border-box' as const }
const labelStyle = { fontSize: 13, fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: 4 }

const CAT_DEPENSES = ['loyer', 'stock', 'transport', 'salaires', 'marketing', 'fournitures', 'taxes', 'autre']

// ── Dashboard ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', flex: '1 1 120px', minWidth: 120, boxSizing: 'border-box' }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color ?? '#111' }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

function DashboardView({ boutiqueId }: { boutiqueId: string }) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cacheKey = `nopalou_offline_compta_dash_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed) {
          setData(parsed)
          setLoading(false)
        }
      } catch(e) {}
    }

    getDashboard(boutiqueId)
      .then(d => { 
        if (d) {
          setData(d)
          localStorage.setItem(cacheKey, JSON.stringify(d))
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
      })
  }, [boutiqueId])

  if (loading) return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} aria-busy="true" aria-label="Chargement du tableau de bord comptable">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 86, flex: 1, minWidth: 140, borderRadius: 12 }} />
      ))}
    </div>
  )
  if (!data)   return <p style={{ color: '#dc2626', fontSize: 14 }}>Impossible de charger le tableau de bord.</p>

  const evol = data.ca_mois_precedent > 0
    ? ((data.ca_mois - data.ca_mois_precedent) / data.ca_mois_precedent * 100).toFixed(0)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs principaux */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          label="CA ce mois"
          value={fcfa(data.ca_mois)}
          sub={evol ? `${Number(evol) >= 0 ? '▲' : '▼'} ${Math.abs(Number(evol))}% vs mois dernier` : undefined}
          color="#1d4ed8"
        />
        <KpiCard label="Dépenses mois" value={fcfa(data.depenses_mois)} color="#dc2626" />
        <KpiCard
          label="Bénéfice net"
          value={fcfa(data.benefice_mois)}
          color={data.benefice_mois >= 0 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard label="Ventes mois" value={String(data.nb_ventes_mois)} sub="transactions" />
      </div>

      {/* Top produits */}
      {data.top_produits.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151' }}>🏆 Top produits ce mois</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.top_produits.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#374151' }}>{i + 1}. {p.nom_produit}</span>
                <span style={{ color: '#6b7280' }}>{p.total_vendu} vendu{p.total_vendu > 1 ? 's' : ''} · {fcfa(p.ca)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertes stock */}
      {data.stock_alerte.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>⚠️ Stock bas</p>
          {data.stock_alerte.map(p => (
            <p key={p.id} style={{ margin: '4px 0', fontSize: 13, color: '#b45309' }}>
              {p.nom} — <strong>{p.stock_quantite} restant{p.stock_quantite > 1 ? 's' : ''}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulaire vente ──────────────────────────────────────────────────────────

function VenteForm({ boutiqueId, produits, zones, onDone }: { boutiqueId: string; produits: Produit[]; zones: Zone[]; onDone: () => void }) {
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
    jouerBipScan('succes')
  }

  // ── Scanner EAN ──
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('📷 Initialisation du scanner EAN…')

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) {}
          html5ScannerRef.current = null
        }

        const scanner = new Html5Qrcode('vente-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        }

        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const prodTrouve = produits.find(
            (p: any) =>
              p.barcode?.trim().toLowerCase() === code ||
              p.sku?.trim().toLowerCase() === code ||
              p.id?.trim().toLowerCase() === code
          )

          if (prodTrouve) {
            handleProduit(prodTrouve.id)
            setScannerEanStatus(`✅ Produit trouvé : "${prodTrouve.nom}"`)
            setTimeout(() => arreterScannerEan(), 800)
          } else {
            jouerBipScan('alerte')
            setScannerEanStatus(`⚠️ Code "${decodedText}" inconnu dans le catalogue.`)
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
          setScannerEanStatus('📷 Cadrez le code-barres dans le rectangle.')
        } catch (errEnv) {
          await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
          setScannerEanStatus('📷 Cadrez le code-barres dans le rectangle.')
        }
      } catch (err) {
        setScannerEanStatus('❌ Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) {}
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  // ── Scanner Nom OCR ──
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setStatusScannerNom('📷 Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('❌ Impossible d’accéder à la caméra.')
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
    setStatusScannerNom('🔍 Optimisation & lecture OCR en cours…')

    const imageBase64 = capturerEtOptimiserImageOCR(videoNomRef.current, {
      cropRatioWidth: 0.85,
      cropRatioHeight: 0.60,
      rehausserContraste: true
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('❌ Échec de la capture d’image.')
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
        jouerBipScan('succes')
        setStatusScannerNom(`✅ Nom capturé : "${data.nom}"`)
        setTimeout(() => arreterScannerNom(), 1000)
      } else {
        jouerBipScan('alerte')
        setStatusScannerNom(`⚠️ ${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipScan('alerte')
      setStatusScannerNom('❌ Erreur de lecture OCR.')
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

  const categories = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  const qClean = recherche.trim().toLowerCase()
  const prodsFiltres = produits.filter((p: any) => {
    const matchCat = catFiltre === 'tous' || p.categorie === catFiltre
    const matchText = !qClean ||
      p.nom?.toLowerCase().includes(qClean) ||
      p.categorie?.toLowerCase().includes(qClean) ||
      p.barcode?.toLowerCase().includes(qClean) ||
      p.sku?.toLowerCase().includes(qClean)
    return matchCat && matchText
  })

  const stock = produits.find(p => p.id === produitId)?.stock_quantite

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#0f172a' }}>💰 Déclarer une Vente</p>
        <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
          Vente détaillée
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
            🛍️ Catalogue ({produits.length})
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
            ✍️ Saisie Libre
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
          📷 Scan EAN
        </button>
      </div>

      {modeSelection === 'catalogue' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher dans le catalogue (nom, EAN, SKU)..."
            style={{ ...inputStyle, padding: 8, fontSize: 12.5 }}
          />

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              <button
                type="button"
                onClick={() => setCatFiltre('tous')}
                style={{
                  padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: catFiltre === 'tous' ? '#0284c7' : '#e2e8f0',
                  color: catFiltre === 'tous' ? '#ffffff' : '#475569'
                }}
              >
                Tous
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatFiltre(c)}
                  style={{
                    padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: catFiltre === c ? '#0284c7' : '#e2e8f0',
                    color: catFiltre === c ? '#ffffff' : '#475569',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, background: '#ffffff', padding: 6, borderRadius: 8, border: '1px solid #cbd5e1' }}>
            {prodsFiltres.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>Aucun produit trouvé</div>
            ) : (
              prodsFiltres.map((p: any) => {
                const isSelected = produitId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProduit(p.id)}
                    style={{
                      padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                      background: isSelected ? '#e0f2fe' : 'transparent',
                      border: isSelected ? '1px solid #0284c7' : '1px solid transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0369a1' : '#0f172a' }}>
                      {p.nom} {p.stock_quantite !== null ? `(stock: ${p.stock_quantite})` : ''}
                    </span>
                    <span style={{ fontWeight: 800, color: '#0284c7' }}>{fcfa(p.prix)}</span>
                  </div>
                )
              })
            )}
          </div>
          {stock !== null && stock !== undefined && stock <= 3 && (
            <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>⚠️ Stock bas : {stock} restant{stock > 1 ? 's' : ''}</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={nomLibre}
              onChange={e => setNomLibre(e.target.value)}
              style={{ ...inputStyle, flex: 1, padding: 9 }}
              placeholder="Ex: Réparation téléphone, Robe Wax, Prestation…"
            />
            <button
              type="button"
              onClick={demarrerScannerNom}
              style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📷 Scan Nom
            </button>
          </div>
          {ocrDetections.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ocrDetections.map((txt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNomLibre(txt)}
                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  {txt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Quantité</label>
          <input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Prix unitaire (FCFA)</label>
          <input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {zones.length > 0 && (
        <div>
          <label style={labelStyle}>Zone de livraison</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
            <option value="">— Sans livraison —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fcfa(z.prix)}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nom client</label>
          <input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder="Optionnel" />
        </div>
        <div>
          <label style={labelStyle}>Téléphone client</label>
          <input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Mode de paiement</label>
        <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
          <option value="cash">💵 Espèces</option>
          <option value="wave">🌊 Wave</option>
          <option value="orange_money">🍊 Orange Money</option>
          <option value="virement">🏦 Virement</option>
        </select>
      </div>

      {prix > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 15, fontWeight: 900, color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Vente :</span>
          <span>{fcfa(prix * quantite + (zoneId ? (zones.find(z => z.id === zoneId)?.prix ?? 0) : 0))}</span>
        </div>
      )}

      <div>
        <label style={labelStyle}>Pièce jointe (facture, reçu…)</label>
        <input
          type="file" accept="image/*,application/pdf"
          onChange={e => setFichier(e.target.files?.[0] ?? null)}
          style={{ fontSize: 13, color: '#374151' }}
        />
        {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
      </div>

      <button onClick={submit} disabled={uploading} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 900, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: uploading ? 0.7 : 1 }}>
        {uploading ? 'Envoi du justificatif…' : '✓ Enregistrer la vente'}
      </button>

      {/* Modal Scanner EAN VenteForm */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>📷 Scanner Code-barres (EAN)</h4>
              <button type="button" onClick={arreterScannerEan} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatus}</p>
            <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <div id="vente-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <button type="button" onClick={arreterScannerEan} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 800, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Scanner Nom OCR VenteForm */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>📷 Scanner le Nom du Produit</h4>
              <button type="button" onClick={arreterScannerNom} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNom}</p>
            <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoNomRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '20%', left: '7.5%', width: '85%', height: '60%', border: '2px dashed #38bdf8', borderRadius: 8, pointerEvents: 'none' }} />
            </div>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={capturerNomOCR}
              style={{ width: '100%', padding: '10px', background: ocrLoading ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: ocrLoading ? 'not-allowed' : 'pointer' }}
            >
              {ocrLoading ? '⏳ Analyse en cours…' : '📸 Capturer et Extraire'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ventes ────────────────────────────────────────────────────────────────────

function EditVenteModal({ vente, boutiqueId, onClose, onDone }: { vente: Vente; boutiqueId: string; onClose: () => void; onDone: () => void }) {
  const [nomProduit, setNomProduit] = useState(vente.nom_produit)
  const [quantite, setQuantite] = useState(vente.quantite)
  const [prix, setPrix] = useState(vente.prix_unitaire)
  const [frais, setFrais] = useState(vente.frais_livraison)
  const [clientNom, setClientNom] = useState(vente.client_nom ?? '')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState(vente.methode_paiement)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await updateVente(boutiqueId, vente.id, {
        nom_produit: nomProduit, quantite, prix_unitaire: prix,
        frais_livraison: frais, client_nom: clientNom || undefined,
        client_telephone: clientTel || undefined, methode_paiement: paiement,
      })
      if (res.error) { setError(res.error); return }
      onDone(); onClose()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>Modifier la vente</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>
        {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
        <div>
          <label style={labelStyle}>Produit / service</label>
          <input value={nomProduit} onChange={e => setNomProduit(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Quantité</label><input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Prix unitaire (FCFA)</label><input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} /></div>
        </div>
        <div>
          <label style={labelStyle}>Frais de livraison (FCFA)</label>
          <input type="number" min={0} value={frais} onChange={e => setFrais(Number(e.target.value))} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Nom client</label><input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder="Optionnel" /></div>
          <div><label style={labelStyle}>Téléphone</label><input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="Optionnel" /></div>
        </div>
        <div>
          <label style={labelStyle}>Mode de paiement</label>
          <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
            <option value="cash">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="virement">Virement</option>
          </select>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>
          Nouveau total : {fcfa(prix * quantite + frais)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} style={{ flex: 1, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Enregistrer</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

function VentesView({ boutiqueId }: { boutiqueId: string }) {
  const [ventes, setVentes] = useState<Vente[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingVente, setEditingVente] = useState<Vente | null>(null)
  const [, startTransition] = useTransition()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    const cacheKeyV = `nopalou_offline_compta_ventes_${boutiqueId}`
    const cacheKeyZ = `nopalou_offline_compta_zones_${boutiqueId}`
    const cachedV = localStorage.getItem(cacheKeyV)
    const cachedZ = localStorage.getItem(cacheKeyZ)

    if (cachedV) { try { setVentes(JSON.parse(cachedV)) } catch(e) {} }
    if (cachedZ) { try { setZones(JSON.parse(cachedZ)) } catch(e) {} }

    try {
      const [v, z, p] = await Promise.all([
        listVentes(boutiqueId),
        listZones(boutiqueId),
        getBoutiqueProduits(boutiqueId),
      ])
      if (Array.isArray(v)) { setVentes(v); localStorage.setItem(cacheKeyV, JSON.stringify(v)) }
      if (Array.isArray(z)) { setZones(z); localStorage.setItem(cacheKeyZ, JSON.stringify(z)) }
      if (Array.isArray(p)) setProduits(p)
    } catch (err) {
      console.warn(`📊 [Comptabilité] Mode hors-ligne : utilisation du cache local ventes/zones (${cachedV ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function removeVente(id: string) {
    if (!confirm('Supprimer cette vente ? Elle ne sera plus comptabilisée.')) return
    setDeleting(id)
    startTransition(async () => {
      await deleteVente(boutiqueId, id)
      setDeleting(null)
      load()
    })
  }

  const methodeLabel: Record<string, string> = { cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement' }

  function exportVentesCSV() {
    const headers = ['Référence', 'Produit/Service', 'Quantité', 'Prix Unitaire (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)', 'Client', 'Mode Paiement', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      v.prix_unitaire,
      v.frais_livraison,
      v.montant_total,
      v.client_nom || 'Client Anonyme',
      methodeLabel[v.methode_paiement] || v.methode_paiement,
      fmtDateHeure(v.created_at)
    ])
    exportToCSV(`ventes_boutique_${boutiqueId}`, headers, rows)
  }

  function exportVentesPDF() {
    const headers = ['Réf.', 'Produit', 'Qte', 'Prix Unit.', 'Total', 'Client', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      `${v.prix_unitaire.toLocaleString('fr-FR')} FCFA`,
      `${v.montant_total.toLocaleString('fr-FR')} FCFA`,
      v.client_nom || 'Client Anonyme',
      fmtDateHeure(v.created_at)
    ])
    const totalCA = ventes.reduce((s, v) => s + Number(v.montant_total), 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Bilan des Ventes</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#16a34a;">Total Ventes Enregistrées : ${totalCA.toLocaleString('fr-FR')} FCFA (${ventes.length} transactions)</p>
      </div>
    `
    printPDFReport('Registre & Bilan des Ventes', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {editingVente && <EditVenteModal vente={editingVente} boutiqueId={boutiqueId} onClose={() => setEditingVente(null)} onDone={load} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{ventes.length} vente{ventes.length !== 1 ? 's' : ''} enregistrée{ventes.length !== 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportVentesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 Excel (CSV)
          </button>
          <button onClick={exportVentesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Imprimer PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + Déclarer une vente
          </button>
        </div>
      </div>

      {showForm && (
        <VenteForm boutiqueId={boutiqueId} produits={produits} zones={zones} onDone={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : ventes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          Aucune vente enregistrée. Cliquez sur &quot;+ Déclarer une vente&quot; pour commencer.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ventes.map(v => (
            <div key={v.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{v.nom_produit}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {v.quantite} × {fcfa(v.prix_unitaire)}
                  {v.frais_livraison > 0 ? ` + ${fcfa(v.frais_livraison)} livraison` : ''}
                  {v.client_nom ? ` · ${v.client_nom}` : ''}
                  {' · '}{methodeLabel[v.methode_paiement] ?? v.methode_paiement}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  {fmtDate(v.created_at)} · Réf {v.reference}
                </p>
                {v.justificatif_url && (
                  <a href={v.justificatif_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                    📎 Justificatif ↗
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1d4ed8' }}>{fcfa(v.montant_total)}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <a href={`/boutique/ventes/facture/${boutiqueId}/${v.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6b7280' }}>
                    PDF ↗
                  </a>
                  <button
                    onClick={() => setEditingVente(v)}
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11 }}
                  >✎</button>
                  <button
                    onClick={() => removeVente(v.id)}
                    disabled={deleting === v.id}
                    style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, opacity: deleting === v.id ? 0.5 : 1 }}
                    title="Archiver"
                  >✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dépenses ──────────────────────────────────────────────────────────────────

function DepenseCard({ depense: d, boutiqueId, onDelete, onUpdated }: {
  depense: Depense; boutiqueId: string; onDelete: (id: string) => void; onUpdated: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [eMontant, setEMontant] = useState(String(d.montant))
  const [eCategorie, setECategorie] = useState(d.categorie)
  const [eDesc, setEDesc] = useState(d.description ?? '')
  const [eDate, setEDate] = useState(d.date_depense.slice(0, 10))
  const [eError, setEError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const fileRef = { current: null as HTMLInputElement | null }

  function saveEdit() {
    if (!eMontant || Number(eMontant) <= 0) { setEError('Montant invalide'); return }
    setEError(null)
    startTransition(async () => {
      const res = await updateDepense(boutiqueId, d.id, {
        montant: Number(eMontant), categorie: eCategorie,
        description: eDesc || undefined, date_depense: eDate,
      })
      if (res.error) { setEError(res.error); return }
      setEditing(false); onUpdated()
    })
  }

  async function uploadJustificatif(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('justificatif', file)
      const res = await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${d.id}/justificatif`, {
        method: 'POST', body: form,
      })
      if (res.ok) onUpdated()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px' }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eError && <div style={{ background: '#fef2f2', borderRadius: 6, padding: '6px 10px', color: '#dc2626', fontSize: 12 }}>{eError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Montant (FCFA)</label><input type="number" min={1} value={eMontant} onChange={e => setEMontant(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Date</label><input type="date" value={eDate} onChange={e => setEDate(e.target.value)} style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Catégorie</label>
            <select value={eCategorie} onChange={e => setECategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Description</label><input value={eDesc} onChange={e => setEDesc(e.target.value)} style={inputStyle} placeholder="Optionnel" /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Enregistrer</button>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
          </div>
        </div>
      ) : (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
              {d.categorie}
            </span>
            {d.description && <span style={{ fontSize: 13, color: '#374151' }}>{d.description}</span>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{fmtDate(d.date_depense)}</p>
          {/* Justificatif */}
          <div style={{ marginTop: 6 }}>
            {d.justificatif_url ? (
              <a href={d.justificatif_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                📎 Justificatif ↗
              </a>
            ) : (
              <>
                <input
                  ref={el => { fileRef.current = el }}
                  type="file" accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadJustificatif(f) }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {uploading ? 'Envoi…' : '+ Ajouter justificatif'}
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#dc2626' }}>{fcfa(d.montant)}</span>
          <button onClick={() => setEditing(true)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: 12 }} title="Modifier">✎</button>
          <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} title="Archiver">✕</button>
        </div>
      </div>
      )}
    </div>
  )
}

function DepensesView({ boutiqueId }: { boutiqueId: string }) {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('stock')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Scanner OCR Reçu / Dépense
  const [modalScannerTicket, setModalScannerTicket] = useState(false)
  const videoTicketRef = useRef<HTMLVideoElement | null>(null)
  const streamTicketRef = useRef<MediaStream | null>(null)
  const [ocrDetectionsTicket, setOcrDetectionsTicket] = useState<string[]>([])
  const [statusScannerTicket, setStatusScannerTicket] = useState('')
  const [ocrLoadingTicket, setOcrLoadingTicket] = useState(false)

  const demarrerScannerTicket = async () => {
    setModalScannerTicket(true)
    setOcrDetectionsTicket([])
    setStatusScannerTicket('📷 Cadrez le ticket ou la facturette…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamTicketRef.current = stream
      if (videoTicketRef.current) {
        videoTicketRef.current.srcObject = stream
        await videoTicketRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerTicket('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerTicket = () => {
    if (streamTicketRef.current) {
      streamTicketRef.current.getTracks().forEach(t => t.stop())
      streamTicketRef.current = null
    }
    setModalScannerTicket(false)
  }

  const capturerTicketOCR = async () => {
    if (!videoTicketRef.current) return
    setOcrLoadingTicket(true)
    setStatusScannerTicket('🔍 Lecture OCR du ticket / facturette…')

    const imageBase64 = capturerEtOptimiserImageOCR(videoTicketRef.current, {
      cropRatioWidth: 0.90,
      cropRatioHeight: 0.70,
      rehausserContraste: true
    })

    if (!imageBase64) {
      setOcrLoadingTicket(false)
      setStatusScannerTicket('❌ Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoadingTicket(false)

      if (data.ok && data.nom) {
        setDescription(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetectionsTicket(data.detections)
        }
        jouerBipScan('succes')
        setStatusScannerTicket(`✅ Texte extrait : "${data.nom}"`)
        setTimeout(() => arreterScannerTicket(), 1000)
      } else {
        jouerBipScan('alerte')
        setStatusScannerTicket(`⚠️ ${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoadingTicket(false)
      jouerBipScan('alerte')
      setStatusScannerTicket('❌ Erreur de lecture OCR.')
    }
  }

  async function load() {
    const cacheKey = `nopalou_offline_compta_depenses_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) { try { setDepenses(JSON.parse(cached)) } catch(e) {} }

    try {
      const d = await listDepenses(boutiqueId)
      if (Array.isArray(d)) {
        setDepenses(d)
        localStorage.setItem(cacheKey, JSON.stringify(d))
      }
    } catch (err) {
      console.warn(`📊 [Comptabilité] Mode hors-ligne : utilisation du cache local dépenses (${cached ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!montant || Number(montant) <= 0) { setError('Montant invalide'); return }
    setError(null)
    startTransition(async () => {
      const res = await addDepense(boutiqueId, { montant: Number(montant), categorie, description: description || undefined, date_depense: date })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      setMontant(''); setDescription(''); setFichier(null); setShowForm(false)
      load()
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    startTransition(async () => { await deleteDepense(boutiqueId, id); load() })
  }

  const total = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const now = new Date(); const mois = `${MOIS_NOMS[now.getMonth()]} ${now.getFullYear()}`

  function exportDepensesCSV() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant (FCFA)']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      d.montant
    ])
    exportToCSV(`depenses_boutique_${boutiqueId}`, headers, rows)
  }

  function exportDepensesPDF() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      `${Number(d.montant).toLocaleString('fr-FR')} FCFA`
    ])
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Registre des Dépenses</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#dc2626;">Total Dépenses : ${total.toLocaleString('fr-FR')} FCFA (${depenses.length} entrées)</p>
      </div>
    `
    printPDFReport('Registre des Dépenses', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Total affiché : <strong style={{ color: '#dc2626' }}>{fcfa(total)}</strong></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportDepensesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 Excel (CSV)
          </button>
          <button onClick={exportDepensesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Imprimer PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + Ajouter une dépense
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Montant (FCFA) *</label>
              <input type="number" min={1} value={montant} onChange={e => setMontant(e.target.value)} style={inputStyle} placeholder="Ex: 25000" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Catégorie</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Description / Motif</label>
              <button
                type="button"
                onClick={demarrerScannerTicket}
                style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                📷 Scan Reçu (OCR)
              </button>
            </div>
            <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="Ex: Achat stock riz, Livraison DHL…" />
            {ocrDetectionsTicket.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {ocrDetectionsTicket.map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDescription(txt)}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Pièce jointe (facture, reçu…)</label>
            <input
              type="file" accept="image/*,application/pdf"
              onChange={e => setFichier(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13, color: '#374151' }}
            />
            {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={submit} disabled={uploading} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? 'Envoi du justificatif…' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              Annuler
            </button>
          </div>

          {/* Modal Scanner Ticket OCR */}
          {modalScannerTicket && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>📷 Scanner Reçu / Facturette</h4>
                  <button type="button" onClick={arreterScannerTicket} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerTicket}</p>
                <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <video ref={videoTicketRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed #38bdf8', borderRadius: 8, pointerEvents: 'none' }} />
                </div>
                <button
                  type="button"
                  disabled={ocrLoadingTicket}
                  onClick={capturerTicketOCR}
                  style={{ width: '100%', padding: '10px', background: ocrLoadingTicket ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: ocrLoadingTicket ? 'not-allowed' : 'pointer' }}
                >
                  {ocrLoadingTicket ? '⏳ Analyse en cours…' : '📸 Capturer et Extraire'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : depenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          Aucune dépense enregistrée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {depenses.map(d => (
            <DepenseCard key={d.id} depense={d} boutiqueId={boutiqueId} onDelete={remove} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export function StockView({ boutiqueId }: { boutiqueId: string }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [stockVal, setStockVal] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutiqueId)
      if (prods && prods.length > 0) {
        setProduits(prods)
      } else {
        // Fallback si vide + potentiellement hors ligne
        const cache = localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`)
        if (cache) {
          try {
            const parsed = JSON.parse(cache)
            if (Array.isArray(parsed)) setProduits(parsed)
          } catch {}
        }
      }
    } catch (e) {
      console.warn("StockView offline fallback", e)
      const cache = localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`)
      if (cache) {
        try {
          const parsed = JSON.parse(cache)
          if (Array.isArray(parsed)) setProduits(parsed)
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function saveStock(produitId: string) {
    const val = stockVal[produitId]
    if (val === undefined || val === '') return
    startTransition(async () => {
      await updateStock(boutiqueId, produitId, Number(val))
      setEditing(null)
      load()
    })
  }

  function exportStockCSV() {
    const headers = ['ID Produit', 'Nom Produit', 'Prix (FCFA)', 'Quantité en Stock', 'Statut Stock']
    const rows = produits.map(p => [
      p.id,
      p.nom,
      p.prix || 0,
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? 'STOCK BAS' : 'DISPONIBLE'
    ])
    exportToCSV(`inventaire_stock_${boutiqueId}`, headers, rows)
  }

  function exportStockPDF() {
    const headers = ['ID', 'Nom Produit', 'Prix', 'Stock Restant', 'Statut']
    const rows = produits.map(p => [
      p.id.slice(0, 8),
      p.nom,
      p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—',
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '⚠️ BAS' : '✅ OK'
    ])
    printPDFReport('Inventaire État des Stocks', `Boutique ${boutiqueId}`, headers, rows)
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>

  if (produits.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
      Aucun produit dans le catalogue. Ajoutez des produits via l&apos;onglet &quot;Catalogue produits&quot;.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Inventaire ({produits.length} références)</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportStockCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 Excel (CSV)
          </button>
          <button onClick={exportStockPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Imprimer PDF
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {produits.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>ID: {p.id.slice(0, 8)}</p>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              {p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—'}
            </div>
          </div>
          {editing === p.id ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                value={stockVal[p.id] ?? ((p.quantite_stock ?? p.stock_quantite) ?? '')}
                onChange={e => setStockVal(prev => ({ ...prev, [p.id]: e.target.value }))}
                style={{ ...inputStyle, width: 80 }}
                autoFocus
              />
              <button onClick={() => saveStock(p.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: (p.quantite_stock ?? p.stock_quantite) === null ? '#f1f5f9' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#fef2f2' : '#dcfce7',
                color: (p.quantite_stock ?? p.stock_quantite) === null ? '#9ca3af' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#dc2626' : '#16a34a',
              }}>
                {(p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : `${(p.quantite_stock ?? p.stock_quantite)} en stock`}
              </span>
              <button onClick={() => { setEditing(p.id); setStockVal(prev => ({ ...prev, [p.id]: String((p.quantite_stock ?? p.stock_quantite) ?? '') })) }}
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                Modifier
              </button>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  )
}

// ── Saisie Express ───────────────────────────────────────────────────────────

// ── Saisie Express ───────────────────────────────────────────────────────────

function SaisieExpressView({ boutiqueId }: { boutiqueId: string }) {
  const [mode, setMode] = useState<'vente' | 'depense'>('vente')
  const [produits, setProduits] = useState<Produit[]>([])
  
  // Modes d'ajout Vente Express
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'libre'>('catalogue')
  const [rechercheProduit, setRechercheProduit] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('tous')

  // Panier Mixte Vente Express
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({}) // produitId -> qte
  const [itemsCustomPanier, setItemsCustomPanier] = useState<Array<{ id: string; nom: string; prix: number; quantite: number }>>([])

  // Saisie Libre
  const [libelleCustomInput, setLibelleCustomInput] = useState('')
  const [prixCustomInput, setPrixCustomInput] = useState('')
  const [qteCustomInput, setQteCustomInput] = useState(1)

  // Paramètres Vente
  const [methodePaiement, setMethodePaiement] = useState('especes')
  const [clientNom, setClientNom] = useState('')
  
  // Dépense
  const [montantDepense, setMontantDepense] = useState('')
  const [catDepense, setCatDepense] = useState('stock')
  const [descDepense, setDescDepense] = useState('')

  const [loading, setLoading] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState('')

  // Scanner EAN Caméra
  const [modalScannerEan, setModalScannerEan] = useState(false)
  const [scannerEanStatus, setScannerEanStatus] = useState('Initialisation du scanner EAN…')
  const [scanContinu, setScanContinu] = useState(true)
  const html5ScannerRef = useRef<any>(null)

  // Scanner Nom OCR Caméra
  const [modalScannerNom, setModalScannerNom] = useState(false)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [statusScannerNom, setStatusScannerNom] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => {
    getBoutiqueProduits(boutiqueId).then(p => setProduits(p || [])).catch(() => {})
  }, [boutiqueId])

  // ── Actions Panier Catalogue ──────────────────────────────────────────────
  const handleAjouterProduitCatalogue = (p: any, delta = 1) => {
    setPanierProduits(prev => {
      const current = prev[p.id] || 0
      const next = current + delta
      const copy = { ...prev }
      if (next <= 0) {
        delete copy[p.id]
      } else {
        copy[p.id] = next
      }
      return copy
    })
    jouerBipScan('succes')
  }

  // ── Actions Panier Saisie Libre ───────────────────────────────────────────
  const handleAjouterItemLibre = () => {
    const libelle = libelleCustomInput.trim()
    const prix = Number(prixCustomInput)
    const qte = Number(qteCustomInput) || 1

    if (!libelle) {
      alert('Veuillez saisir le nom ou libellé de l’article.')
      return
    }
    if (isNaN(prix) || prix <= 0) {
      alert('Veuillez saisir un prix unitaire valide (> 0).')
      return
    }

    setItemsCustomPanier(prev => [
      ...prev,
      {
        id: 'custom_' + Date.now(),
        nom: libelle,
        prix: prix,
        quantite: qte
      }
    ])

    jouerBipScan('succes')
    setLibelleCustomInput('')
    setPrixCustomInput('')
    setQteCustomInput(1)
  }

  const handleViderPanier = () => {
    if (Object.keys(panierProduits).length === 0 && itemsCustomPanier.length === 0) return
    if (confirm('Voulez-vous vider tous les articles de cette vente ?')) {
      setPanierProduits({})
      setItemsCustomPanier([])
    }
  }

  // ── Scanner EAN Caméra ───────────────────────────────────────────────────
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('📷 Initialisation du scanner EAN…')

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) {}
          html5ScannerRef.current = null
        }

        const container = document.getElementById('compta-ean-scanner-reader')
        if (!container) return

        const scanner = new Html5Qrcode('compta-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        }

        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const prodTrouve = produits.find(
            (p: any) =>
              p.barcode?.trim().toLowerCase() === code ||
              p.sku?.trim().toLowerCase() === code ||
              p.id?.trim().toLowerCase() === code
          )

          if (prodTrouve) {
            handleAjouterProduitCatalogue(prodTrouve, 1)
            setScannerEanStatus(`✅ Produit ajouté : "${prodTrouve.nom}" (${fcfa(prodTrouve.prix_promo || prodTrouve.prix || 0)})`)
            if (!scanContinu) {
              setTimeout(() => arreterScannerEan(), 800)
            }
          } else {
            jouerBipScan('alerte')
            setScannerEanStatus(`⚠️ Code "${decodedText}" inconnu dans le catalogue.`)
            if (confirm(`Code-barres "${decodedText}" non trouvé. L'ajouter comme article libre ?`)) {
              setLibelleCustomInput(`Article EAN-${decodedText}`)
              setModeSaisie('libre')
              arreterScannerEan()
            }
          }
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('📷 Caméra active ! Placez le code-barres dans le cadre.')
        } catch (errEnv) {
          await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
          setScannerEanStatus('📷 Caméra active ! Placez le code-barres dans le cadre.')
        }
      } catch (err) {
        setScannerEanStatus('❌ Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) {}
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  // ── Scanner Nom OCR Caméra ───────────────────────────────────────────────
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setStatusScannerNom('📷 Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('❌ Impossible d’accéder à la caméra.')
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
    setStatusScannerNom('🔍 Optimisation de l’image & lecture OCR…')

    const imageBase64 = capturerEtOptimiserImageOCR(videoNomRef.current, {
      cropRatioWidth: 0.85,
      cropRatioHeight: 0.60,
      rehausserContraste: true
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('❌ Échec de la capture d’image.')
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
        setLibelleCustomInput(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipScan('succes')
        setStatusScannerNom(`✅ Nom capturé : "${data.nom}"`)
        setTimeout(() => arreterScannerNom(), 1000)
      } else {
        jouerBipScan('alerte')
        setStatusScannerNom(`⚠️ ${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipScan('alerte')
      setStatusScannerNom('❌ Erreur de lecture OCR. Réessayez.')
    }
  }

  // ── Calcul des Totaux Panier Mixte ────────────────────────────────────────
  const totalPanierCatalogue = Object.entries(panierProduits).reduce((sum, [pId, qte]) => {
    const p = produits.find(item => item.id === pId)
    const prixU = p ? Number(p.prix || 0) : 0
    return sum + (prixU * qte)
  }, 0)

  const totalPanierCustom = itemsCustomPanier.reduce((sum, item) => sum + (item.prix * item.quantite), 0)
  const totalVente = totalPanierCatalogue + totalPanierCustom
  const nbArticlesTotal = Object.values(panierProduits).reduce((a, b) => a + b, 0) + itemsCustomPanier.reduce((a, b) => a + b.quantite, 0)

  // ── Soumission de la Vente Express ────────────────────────────────────────
  const handleValiderVenteRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nbArticlesTotal === 0) {
      alert('Veuillez ajouter au moins un produit du catalogue ou un article libre au panier.')
      return
    }

    setLoading(true)
    let erreurs = 0

    // 1. Enregistrer les articles catalogue
    for (const [pId, qte] of Object.entries(panierProduits)) {
      if (qte <= 0) continue
      const prod = produits.find(p => p.id === pId)
      const res = await declarerVente(boutiqueId, {
        produit_id: pId,
        quantite: qte,
        prix_unitaire: Number(prod?.prix || 0),
        methode_paiement: methodePaiement,
        client_nom: clientNom.trim() || undefined,
      })
      if (!res.success) erreurs++
    }

    // 2. Enregistrer les articles libres
    for (const item of itemsCustomPanier) {
      const res = await declarerVente(boutiqueId, {
        nom_produit: item.nom,
        quantite: item.quantite,
        prix_unitaire: item.prix,
        methode_paiement: methodePaiement,
        client_nom: clientNom.trim() || undefined,
      })
      if (!res.success) erreurs++
    }

    setLoading(false)
    if (erreurs === 0) {
      setMsgSuccess(`⚡ Vente de ${nbArticlesTotal} article(s) (${fcfa(totalVente)}) enregistrée avec succès !`)
      setPanierProduits({})
      setItemsCustomPanier([])
      setClientNom('')
      setTimeout(() => setMsgSuccess(''), 3500)
    } else {
      alert('Certaines lignes de vente n’ont pas pu être enregistrées.')
    }
  }

  // ── Soumission Dépense ────────────────────────────────────────────────────
  const handleValiderDepenseRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    const mNum = Number(montantDepense) || 0
    if (mNum <= 0) {
      alert('Veuillez saisir un montant valide.')
      return
    }

    setLoading(true)
    const res = await addDepense(boutiqueId, {
      montant: mNum,
      categorie: catDepense,
      description: descDepense.trim() || undefined,
    })

    setLoading(false)
    if (res.success) {
      setMsgSuccess('⚡ Dépense enregistrée avec succès !')
      setMontantDepense('')
      setDescDepense('')
      setTimeout(() => setMsgSuccess(''), 3000)
    } else {
      alert(res.error || 'Erreur lors de l’enregistrement')
    }
  }

  // Filtrage Catalogue
  const categoriesCatalogue = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  const qModal = rechercheProduit.trim().toLowerCase()
  const produitsFiltres = produits.filter((p: any) => {
    const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
    const matchText = !qModal ||
      p.nom?.toLowerCase().includes(qModal) ||
      p.categorie?.toLowerCase().includes(qModal) ||
      p.barcode?.toLowerCase().includes(qModal) ||
      p.sku?.toLowerCase().includes(qModal)
    return matchCat && matchText
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Selector Mode Vente / Dépense */}
      <div style={{ display: 'flex', gap: 10, background: '#f1f5f9', padding: 6, borderRadius: 16, border: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={() => setMode('vente')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'vente' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: mode === 'vente' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'vente' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ + Vente Rapide (Encaissement)
        </button>

        <button
          type="button"
          onClick={() => setMode('depense')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'depense' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: mode === 'depense' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'depense' ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ - Dépense Rapide (Sortie Caisse)
        </button>
      </div>

      {msgSuccess && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
          {msgSuccess}
        </div>
      )}

      {mode === 'vente' ? (
        <form onSubmit={handleValiderVenteRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 Encaissement Vente Directe (Catalogue & Libre)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Ajout par Catalogue, Saisie Libre et Scan EAN / Code-barres
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              ⚡ Saisie 1-Clic Sans POS
            </span>
          </div>

          {/* ── Onglets de Sélection : Catalogue vs Saisie Libre vs Scan EAN ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12, flex: 1 }}>
              <button
                type="button"
                onClick={() => setModeSaisie('catalogue')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                  color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                🛍️ Catalogue ({produits.length})
              </button>
              <button
                type="button"
                onClick={() => setModeSaisie('libre')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: modeSaisie === 'libre' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'libre' ? 800 : 600,
                  color: modeSaisie === 'libre' ? '#0f172a' : '#64748b',
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: modeSaisie === 'libre' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                ✍️ Saisie Libre / Prestation
              </button>
            </div>

            <button
              type="button"
              onClick={demarrerScannerEan}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '9px 14px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              📷 Scan EAN
            </button>
          </div>

          {/* ── Mode 1 : Recherche & Grille Catalogue ──────────────────────── */}
          {modeSaisie === 'catalogue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Barre de recherche */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={rechercheProduit}
                  onChange={e => setRechercheProduit(e.target.value)}
                  placeholder="🔍 Rechercher un produit par nom, référence, code-barres EAN..."
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {rechercheProduit && (
                  <button
                    type="button"
                    onClick={() => setRechercheProduit('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Catégories */}
              {categoriesCatalogue.length > 0 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  <button
                    type="button"
                    onClick={() => setCategorieFiltre('tous')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: categorieFiltre === 'tous' ? '#0284c7' : '#f1f5f9',
                      color: categorieFiltre === 'tous' ? '#ffffff' : '#475569'
                    }}
                  >
                    Tous ({produits.length})
                  </button>
                  {categoriesCatalogue.map(cat => {
                    const count = produits.filter((p: any) => p.categorie === cat).length
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategorieFiltre(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11.5,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          background: categorieFiltre === cat ? '#0284c7' : '#f1f5f9',
                          color: categorieFiltre === cat ? '#ffffff' : '#475569'
                        }}
                      >
                        {cat} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Grille Produits */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
                maxHeight: 220,
                overflowY: 'auto',
                padding: 2
              }}>
                {produitsFiltres.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: '24px 10px' }}>
                    {produits.length === 0
                      ? 'Aucun produit dans le catalogue. Utilisez la saisie libre.'
                      : 'Aucun produit ne correspond à cette recherche.'}
                  </div>
                ) : (
                  produitsFiltres.map((p: any) => {
                    const qte = panierProduits[p.id] || 0
                    const prixAff = Number(p.prix_promo || p.prix || 0)
                    const stock = p.stock_quantite ?? p.quantite_stock

                    return (
                      <div
                        key={p.id}
                        style={{
                          background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                          border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '8px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease-in-out'
                        }}
                      >
                        <div
                          onClick={() => handleAjouterProduitCatalogue(p, 1)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nom}>
                            {p.nom}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                            <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900 }}>
                              {fcfa(prixAff)}
                            </span>
                            {stock !== undefined && stock !== null && (
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: stock > 0 ? '#10b981' : '#ef4444' }}>
                                {stock > 0 ? `${stock} en stock` : 'Rupture'}
                              </span>
                            )}
                          </div>
                        </div>

                        {qte > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAjouterProduitCatalogue(p, -1)
                              }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Diminuer la quantité (-1)"
                            >
                              -
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', minWidth: 16, textAlign: 'center' }}>
                              {qte}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAjouterProduitCatalogue(p, 1)
                              }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#e0f2fe', color: '#0284c7', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Augmenter la quantité (+1)"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAjouterProduitCatalogue(p, 1)}
                            style={{ marginTop: 6, padding: '3px 6px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                          >
                            ➕ Ajouter
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Mode 2 : Saisie Libre (Hors Catalogue) ────────────────────── */}
          {modeSaisie === 'libre' && (
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0 }}>
                  ✍️ Article ou prestation hors catalogue :
                </label>
                <button
                  type="button"
                  onClick={demarrerScannerNom}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  📷 Scan Nom (OCR)
                </button>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Désignation / Libellé de l’article *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Réparation téléphone, Robe sur-mesure, Vente occasionnelle..."
                  value={libelleCustomInput}
                  onChange={e => setLibelleCustomInput(e.target.value)}
                  style={{ ...inputStyle, borderRadius: 8, padding: 10 }}
                />
              </div>

              {ocrDetections.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>💡 Détections OCR :</span>
                  {ocrDetections.map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLibelleCustomInput(txt)}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Prix Unitaire (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 15000"
                    value={prixCustomInput}
                    onChange={e => setPrixCustomInput(e.target.value)}
                    style={{ ...inputStyle, borderRadius: 8, padding: 10, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Qté *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qteCustomInput}
                    onChange={e => setQteCustomInput(Number(e.target.value))}
                    style={{ ...inputStyle, borderRadius: 8, padding: 10, fontWeight: 700 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAjouterItemLibre}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ➕ Ajouter
                </button>
              </div>
            </div>
          )}

          {/* ── Résumé du Panier Mixte de la Vente Directe ────────────────── */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0369a1' }}>
                🛒 Articles dans la vente ({nbArticlesTotal} articles • Total : {fcfa(totalVente)}) :
              </span>
              {nbArticlesTotal > 0 && (
                <button
                  type="button"
                  onClick={handleViderPanier}
                  style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
                >
                  🗑️ Vider le panier
                </button>
              )}
            </div>

            {nbArticlesTotal === 0 ? (
              <div style={{ padding: '16px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>
                Aucun article sélectionné. Cliquez sur un produit ou saisissez un article libre ci-dessus.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {/* Articles Catalogue */}
                {Object.entries(panierProduits).filter(([_, qte]) => qte > 0).map(([pId, qte]) => {
                  const prodObj = produits.find((p: any) => p.id === pId)
                  if (!prodObj) return null
                  const unitPrice = Number(prodObj.prix || 0)
                  const subtotal = unitPrice * qte

                  return (
                    <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid #e0f2fe', fontSize: 12.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, background: '#f0fdf4', color: '#16a34a', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>Catalogue</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{prodObj.nom}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#0284c7', fontWeight: 800 }}>
                          {qte} × {fcfa(unitPrice)} = {fcfa(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAjouterProduitCatalogue(prodObj, -qte)}
                          style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Supprimer cet article"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Articles Libres */}
                {itemsCustomPanier.map((item, idx) => {
                  const subtotal = item.prix * item.quantite
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px dashed #0284c7', fontSize: 12.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>Libre</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.nom}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#0284c7', fontWeight: 800 }}>
                          {item.quantite} × {fcfa(item.prix)} = {fcfa(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemsCustomPanier(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Supprimer cet article"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mode de Paiement & Client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Mode de Paiement Reçu</label>
              <select
                value={methodePaiement}
                onChange={e => setMethodePaiement(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              >
                <option value="especes">💵 Espèces (Cash)</option>
                <option value="wave">🌊 Wave Senegal</option>
                <option value="orange_money">🍊 Orange Money</option>
                <option value="carte">💳 Carte Bancaire</option>
                <option value="cheque">📜 Chèque</option>
              </select>
            </div>

            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Nom du Client (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Client comptoir"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              />
            </div>
          </div>

          {/* Total Calculé en Direct */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Encaissé ({nbArticlesTotal} articles)</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fcfa(totalVente)}</span>
          </div>

          <button
            type="submit"
            disabled={loading || nbArticlesTotal === 0}
            style={{
              background: nbArticlesTotal === 0 ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 20px',
              fontWeight: 900,
              fontSize: 15,
              cursor: nbArticlesTotal === 0 ? 'not-allowed' : 'pointer',
              boxShadow: nbArticlesTotal === 0 ? 'none' : '0 6px 18px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '⏳ Enregistrement...' : `⚡ Valider l'Encaissement (${fcfa(totalVente)})`}
          </button>
        </form>
      ) : (
        <form onSubmit={handleValiderDepenseRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              💸 Déclaration d&apos;une Sortie de Caisse / Dépense
            </h3>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 12, border: '1px solid #fecaca' }}>
              ⚡ Débit Rapide
            </span>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Montant de la Dépense (FCFA) *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="Ex: 5000"
              value={montantDepense}
              onChange={e => setMontantDepense(e.target.value)}
              style={{ ...inputStyle, borderRadius: 12, padding: 14, fontSize: 18, fontWeight: 900, color: '#dc2626' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Catégorie</label>
              <select
                value={catDepense}
                onChange={e => setCatDepense(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              >
                <option value="stock">📦 Achat de Stock / Marchandises</option>
                <option value="loyer">🏠 Loyer Local / Boutique</option>
                <option value="salaire">👥 Salaire & Avances Personnel</option>
                <option value="transport">🚚 Transport & Logistique</option>
                <option value="factures">💡 Électricité, Eau & Internet</option>
                <option value="marketing">📣 Publicité & Réseaux Sociaux</option>
                <option value="autre">🔖 Autre Charge Divers</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569', margin: 0 }}>Motif / Description (Optionnel)</label>
                <button
                  type="button"
                  onClick={demarrerScannerNom}
                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📷 Scan Reçu (OCR)
                </button>
              </div>
              <input
                type="text"
                placeholder="Ex: Facture Senelec, Achat sacs plastique"
                value={descDepense}
                onChange={e => setDescDepense(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              />
              {ocrDetections.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {ocrDetections.map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDescDepense(txt)}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 20px',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '⏳ Enregistrement...' : '⚡ Enregistrer la Dépense'}
          </button>
        </form>
      )}

      {/* ── Modal Scanner EAN Caméra Compta ────────────────────────────── */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>📷 Scanner Code-barres (EAN)</h4>
              <button type="button" onClick={arreterScannerEan} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatus}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div id="compta-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                <input type="checkbox" checked={scanContinu} onChange={e => setScanContinu(e.target.checked)} />
                Scanner en continu
              </label>
              <button type="button" onClick={arreterScannerEan} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Scanner Nom OCR Caméra Compta ──────────────────────────── */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>📷 Scanner le Nom du Produit</h4>
              <button type="button" onClick={arreterScannerNom} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNom}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoNomRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '20%', left: '7.5%', width: '85%', height: '60%', border: '2px dashed #38bdf8', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                  Cadrez le nom au centre
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={capturerNomOCR}
              style={{ width: '100%', padding: '12px', background: ocrLoading ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: ocrLoading ? 'not-allowed' : 'pointer' }}
            >
              {ocrLoading ? '⏳ Analyse OCR en cours...' : '📸 Capturer et Extraire le Nom'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Comptabilite({ boutiqueId, initialTab = 'dashboard' }: { boutiqueId: string; initialTab?: 'dashboard' | 'express' | 'ventes' | 'depenses' }) {
  const [tab, setTab] = useState<'dashboard' | 'express' | 'ventes' | 'depenses'>(initialTab)

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  const tabBtn = (t: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(t)} style={{
      padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: tab === t ? 700 : 500,
      color: tab === t ? '#C75B00' : '#6b7280',
      borderBottom: tab === t ? '2px solid #C75B00' : '2px solid transparent',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  )

  return (
    <div>
      <div className="nopalou-scroll-tabs" style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {tabBtn('dashboard', '📊 Tableau de bord')}
        {tabBtn('express',   '⚡ Saisie Express (Ventes & Dépenses)')}
        {tabBtn('ventes',    '💰 Ventes')}
        {tabBtn('depenses',  '📉 Dépenses')}
      </div>

      {tab === 'dashboard' && <DashboardView boutiqueId={boutiqueId} />}
      {tab === 'express'   && <SaisieExpressView boutiqueId={boutiqueId} />}
      {tab === 'ventes'    && <VentesView    boutiqueId={boutiqueId} />}
      {tab === 'depenses'  && <DepensesView  boutiqueId={boutiqueId} />}
    </div>
  )
}

// ── Zones de livraison ────────────────────────────────────────────────────────

export function ZonesView({ boutiqueId }: { boutiqueId: string }) {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [, startTransition] = useTransition()

  async function load() { setLoading(true); const z = await listZones(boutiqueId); setZones(z); setLoading(false) }
  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!nom.trim() || !prix) return
    startTransition(async () => {
      await createZone(boutiqueId, nom.trim(), Number(prix))
      setNom(''); setPrix(''); setShowForm(false); load()
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    startTransition(async () => { await deleteZone(boutiqueId, id); load() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{zones.length} zone{zones.length !== 1 ? 's' : ''} de livraison</p>
        <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
          + Ajouter une zone
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nom de la zone</label>
            <input value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Ex: Dakar Plateau, Banlieue…" />
          </div>
          <div style={{ width: 130 }}>
            <label style={labelStyle}>Frais (FCFA)</label>
            <input type="number" min={0} value={prix} onChange={e => setPrix(e.target.value)} style={inputStyle} placeholder="0" />
          </div>
          <button onClick={submit} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Ajouter</button>
        </div>
      )}

      {loading ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p> : zones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          Aucune zone de livraison. Ajoutez-en pour calculer les frais automatiquement.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zones.map(z => (
            <div key={z.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{z.nom}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{fcfa(z.prix)}</span>
                <button onClick={() => remove(z.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
