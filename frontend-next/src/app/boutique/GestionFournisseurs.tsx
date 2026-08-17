'use client'

import { useEffect, useState, useRef } from 'react'
import {
  getFournisseurs,
  creerFournisseur,
  modifierFournisseur,
  supprimerFournisseur,
  getCommandesFournisseurs,
  creerCommandeFournisseur,
  modifierCommandeFournisseur,
  recevoirCommandeFournisseur,
  supprimerCommandeFournisseur,
  uploadJustificatifAchat,
  getBoutiqueProduits
} from './actions'
import { fcfa } from '@/lib/format'
import { StockView } from './Comptabilite'
import SearchableProductSelect from '@/components/SearchableProductSelect'
import { capturerEtOptimiserImageOCR, jouerBipScan } from '@/lib/ocr-helper'

export default function GestionFournisseurs({ boutiqueId }: { boutiqueId: string }) {
  const [subTab, setSubTab] = useState<'stock' | 'fournisseurs' | 'commandes'>('stock')
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [commandes, setCommandes] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Modals state
  const [modalFOUOuvert, setModalFOUOuvert] = useState<boolean>(false)
  const [modalCMDOuvert, setModalCMDOuvert] = useState<boolean>(false)
  const [cmdDetailsModal, setCmdDetailsModal] = useState<any | null>(null)
  const [modalRecevoirCmd, setModalRecevoirCmd] = useState<any | null>(null)
  const [receptionJustificatifUrl, setReceptionJustificatifUrl] = useState<string>('')
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)

  // Form Fournisseur State
  const [fouEditId, setFouEditId] = useState<string | null>(null)
  const [fouNom, setFouNom] = useState<string>('')
  const [fouTel, setFouTel] = useState<string>('')
  const [fouEmail, setFouEmail] = useState<string>('')
  const [fouAdr, setFouAdr] = useState<string>('')

  // Form Commande State
  const [cmdEditId, setCmdEditId] = useState<string | null>(null)
  const [cmdFournisseurId, setCmdFournisseurId] = useState<string>('')
  const [cmdJustificatifUrl, setCmdJustificatifUrl] = useState<string>('')
  const [cmdLignes, setCmdLignes] = useState<Array<{ produitId: string; nomLibre?: string; quantite: number; prixAchat: number }>>([])

  // Scanner EAN & Scan Nom pour Fournisseurs
  const [modalScannerEanCmd, setModalScannerEanCmd] = useState(false)
  const [scannerEanStatusCmd, setScannerEanStatusCmd] = useState('Initialisation...')
  const html5ScannerCmdRef = useRef<any>(null)

  const [modalScannerNomCmd, setModalScannerNomCmd] = useState(false)
  const [statusScannerNomCmd, setStatusScannerNomCmd] = useState('')
  const [ocrLoadingCmd, setOcrLoadingCmd] = useState(false)
  const [idxLigneScanNom, setIdxLigneScanNom] = useState<number | null>(null)
  const videoNomCmdRef = useRef<HTMLVideoElement | null>(null)
  const streamNomCmdRef = useRef<MediaStream | null>(null)

  const demarrerScannerEanCmd = async () => {
    setModalScannerEanCmd(true)
    setScannerEanStatusCmd('📷 Initialisation du scanner EAN…')
    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerCmdRef.current) {
          try {
            await html5ScannerCmdRef.current.stop()
            html5ScannerCmdRef.current.clear()
          } catch (e) {}
          html5ScannerCmdRef.current = null
        }
        const container = document.getElementById('fou-ean-scanner-reader')
        if (!container) return
        const scanner = new Html5Qrcode('fou-ean-scanner-reader')
        html5ScannerCmdRef.current = scanner
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
            setCmdLignes(prev => {
              const existIdx = prev.findIndex(l => l.produitId === prodTrouve.id)
              if (existIdx >= 0) {
                const copy = [...prev]
                copy[existIdx].quantite += 1
                return copy
              }
              return [...prev, { produitId: prodTrouve.id, quantite: 1, prixAchat: Number(prodTrouve.prix || 0) }]
            })
            jouerBipScan('succes')
            setScannerEanStatusCmd(`✅ Produit ajouté : "${prodTrouve.nom}"`)
          } else {
            jouerBipScan('alerte')
            setScannerEanStatusCmd(`⚠️ Code "${decodedText}" non trouvé.`)
            if (confirm(`Code "${decodedText}" inconnu dans le catalogue. Ajouter en article libre ?`)) {
              setCmdLignes(prev => [...prev, { produitId: 'custom', nomLibre: `Article EAN-${decodedText}`, quantite: 1, prixAchat: 0 }])
              arreterScannerEanCmd()
            }
          }
        }
        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatusCmd('📷 Caméra active ! Placez le code-barres dans le cadre.')
        } catch (errEnv) {
          await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
          setScannerEanStatusCmd('📷 Caméra active ! Placez le code-barres dans le cadre.')
        }
      } catch (err) {
        setScannerEanStatusCmd('❌ Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEanCmd = () => {
    if (html5ScannerCmdRef.current) {
      try {
        html5ScannerCmdRef.current.stop()
        html5ScannerCmdRef.current.clear()
      } catch (e) {}
      html5ScannerCmdRef.current = null
    }
    setModalScannerEanCmd(false)
  }

  const demarrerScannerNomCmd = async (ligneIdx: number) => {
    setIdxLigneScanNom(ligneIdx)
    setModalScannerNomCmd(true)
    setStatusScannerNomCmd('📷 Cadrez le nom sur l’emballage…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamNomCmdRef.current = stream
      if (videoNomCmdRef.current) {
        videoNomCmdRef.current.srcObject = stream
        await videoNomCmdRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNomCmd('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNomCmd = () => {
    if (streamNomCmdRef.current) {
      streamNomCmdRef.current.getTracks().forEach(t => t.stop())
      streamNomCmdRef.current = null
    }
    setModalScannerNomCmd(false)
  }

  const capturerNomOCRCmd = async () => {
    if (!videoNomCmdRef.current) return
    setOcrLoadingCmd(true)
    setStatusScannerNomCmd('🔍 Optimisation de l’image & lecture OCR…')
    const imageBase64 = capturerEtOptimiserImageOCR(videoNomCmdRef.current, {
      cropRatioWidth: 0.85,
      cropRatioHeight: 0.60,
      rehausserContraste: true
    })
    if (!imageBase64) {
      setOcrLoadingCmd(false)
      setStatusScannerNomCmd('❌ Échec de la capture.')
      return
    }
    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoadingCmd(false)
      if (data.ok && data.nom) {
        if (idxLigneScanNom !== null) {
          handleModifierLigneCmd(idxLigneScanNom, 'nomLibre', data.nom)
        }
        jouerBipScan('succes')
        setStatusScannerNomCmd(`✅ Nom capturé : "${data.nom}"`)
        setTimeout(() => arreterScannerNomCmd(), 1000)
      } else {
        jouerBipScan('alerte')
        setStatusScannerNomCmd(`⚠️ ${data.error || 'Aucun nom lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoadingCmd(false)
      jouerBipScan('alerte')
      setStatusScannerNomCmd('❌ Erreur de lecture OCR. Réessayez.')
    }
  }

  // Search & Filters State
  const [rechercheFournisseur, setRechercheFournisseur] = useState<string>('')
  const [rechercheCommande, setRechercheCommande] = useState<string>('')
  const [filtreStatutCmd, setFiltreStatutCmd] = useState<string>('tous')

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const chargerDonnees = async () => {
    const cacheKeyFous = `nopalou_offline_fournisseurs_${boutiqueId}`
    const cacheKeyCmds = `nopalou_offline_cmd_fournisseurs_${boutiqueId}`
    const cacheKeyProds = `nopalou_offline_prods_${boutiqueId}`

    const cFous = localStorage.getItem(cacheKeyFous)
    if (cFous) { try { setFournisseurs(JSON.parse(cFous)) } catch(e) {} }
    const cCmds = localStorage.getItem(cacheKeyCmds)
    if (cCmds) { try { setCommandes(JSON.parse(cCmds)) } catch(e) {} }
    const cProds = localStorage.getItem(cacheKeyProds)
    if (cProds) { try { setProduits(JSON.parse(cProds)) } catch(e) {} }

    if (!cFous || !cCmds) setLoading(true)

    try {
      const [fous, cmds] = await Promise.all([
        getFournisseurs(boutiqueId),
        getCommandesFournisseurs(boutiqueId)
      ])
      setFournisseurs(fous)
      setCommandes(cmds)
      localStorage.setItem(cacheKeyFous, JSON.stringify(fous))
      localStorage.setItem(cacheKeyCmds, JSON.stringify(cmds))

      // Charger les produits de la boutique pour les sélectionner dans la ligne de commande
      const prods = await getBoutiqueProduits(boutiqueId)
      setProduits(prods || [])
      localStorage.setItem(cacheKeyProds, JSON.stringify(prods || []))
    } catch (err) {
      console.error('Erreur chargement donnees fournisseurs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  const handleSoumettreFormFournisseur = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fouNom) return

    try {
      setIsSubmitting(true)
      const payload = {
        nom: fouNom,
        telephone: fouTel,
        email: fouEmail,
        adresse: fouAdr
      }

      let res: any
      if (fouEditId) {
        res = await modifierFournisseur(boutiqueId, fouEditId, payload)
      } else {
        res = await creerFournisseur(boutiqueId, payload)
      }

      if (res.error) {
        alert(res.error)
      } else {
        alert(fouEditId ? 'Fournisseur modifié avec succès !' : 'Fournisseur ajouté avec succès !')
        setModalFOUOuvert(false)
        resetFouForm()
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ouvrirEditionFournisseur = (f: any) => {
    setFouEditId(f.id)
    setFouNom(f.nom || '')
    setFouTel(f.telephone || '')
    setFouEmail(f.email || '')
    setFouAdr(f.adresse || '')
    setModalFOUOuvert(true)
  }

  const handleCreerCommande = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cmdFournisseurId) {
      alert('Veuillez sélectionner un fournisseur.')
      return
    }
    if (cmdLignes.length === 0) {
      alert('Veuillez ajouter au moins un produit à la commande.')
      return
    }

    try {
      setIsSubmitting(true)
      const itemsFormates = cmdLignes.map(l => {
        const prod = produits.find(p => p.id === l.produitId)
        return {
          id: l.produitId,
          nom: prod ? prod.nom : 'Produit inconnu',
          quantite: l.quantite,
          prix_achat: l.prixAchat
        }
      })

      const payload = {
        fournisseur_id: cmdFournisseurId,
        items: itemsFormates,
        justificatif_url: cmdJustificatifUrl || null
      }

      const res = cmdEditId
        ? await modifierCommandeFournisseur(boutiqueId, cmdEditId, payload)
        : await creerCommandeFournisseur(boutiqueId, payload)

      if (res.error) {
        alert(res.error)
      } else {
        alert(cmdEditId ? 'Bon de commande modifié avec succès !' : 'Bon de commande créé avec succès !')
        setModalCMDOuvert(false)
        resetCmdForm()
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ouvrirModalReception = (cmd: any) => {
    setModalRecevoirCmd(cmd)
    setReceptionJustificatifUrl(cmd.justificatif_url || '')
  }

  const handleConfirmerReception = async () => {
    if (!modalRecevoirCmd) return
    try {
      setIsSubmitting(true)
      const res = await recevoirCommandeFournisseur(boutiqueId, modalRecevoirCmd.id, {
        statut: 'recue',
        justificatif_url: receptionJustificatifUrl || null
      })
      if (res.error) {
        alert(res.error)
      } else {
        alert('Commande réceptionnée et stocks mis à jour !')
        setModalRecevoirCmd(null)
        setCmdDetailsModal(null)
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadFileCommande = async (e: React.ChangeEvent<HTMLInputElement>, isReception: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingFile(true)
      const fd = new FormData()
      fd.append('justificatif', file)
      const res = await uploadJustificatifAchat(boutiqueId, fd)
      if (res.error) alert(res.error)
      else if (res.url) {
        if (isReception) {
          setReceptionJustificatifUrl(res.url)
        } else {
          setCmdJustificatifUrl(res.url)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Erreur lors du téléchargement du fichier')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSupprimerCommande = async (cmdId: string, ref: string) => {
    if (!confirm(`Supprimer la commande d'achat ${ref} ?`)) return
    try {
      const res = await supprimerCommandeFournisseur(boutiqueId, cmdId)
      if (res.error) {
        alert(res.error)
      } else {
        alert('Commande supprimée avec succès !')
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSupprimerFournisseur = async (fId: string, nom: string) => {
    if (!confirm(`Supprimer le fournisseur ${nom} ?`)) return
    try {
      const res = await supprimerFournisseur(boutiqueId, fId)
      if (res.error) {
        alert(res.error)
      } else {
        alert('Fournisseur supprimé avec succès !')
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const resetFouForm = () => {
    setFouEditId(null)
    setFouNom('')
    setFouTel('')
    setFouEmail('')
    setFouAdr('')
  }

  const resetCmdForm = () => {
    setCmdEditId(null)
    setCmdFournisseurId('')
    setCmdJustificatifUrl('')
    setCmdLignes([])
  }

  const ouvrirEditionCommande = (cmd: any) => {
    setCmdEditId(cmd.id)
    setCmdFournisseurId(cmd.fournisseur_id || '')
    setCmdJustificatifUrl(cmd.justificatif_url || '')
    const items = typeof cmd.items === 'string' ? JSON.parse(cmd.items || '[]') : (cmd.items || [])
    setCmdLignes(items.map((i: any) => ({
      produitId: i.id || i.produitId || '',
      quantite: Number(i.quantite || 1),
      prixAchat: Number(i.prix_achat || i.prixAchat || i.prix || 0)
    })))
    setModalCMDOuvert(true)
  }

  const handleAjouterLigneCmd = () => {
    setCmdLignes(prev => [...prev, { produitId: '', quantite: 1, prixAchat: 0 }])
  }

  const handleModifierLigneCmd = (index: number, champ: string, valeur: any) => {
    setCmdLignes(prev => prev.map((l, i) => {
      if (i === index) {
        return { ...l, [champ]: valeur }
      }
      return l
    }))
  }

  const handleSupprimerLigneCmd = (index: number) => {
    setCmdLignes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: 16, paddingBottom: 4 }}>
        <button
          onClick={() => setSubTab('stock')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'stock' ? 700 : 500,
            color: subTab === 'stock' ? '#C75B00' : '#475569', borderBottom: subTab === 'stock' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          📦 Stock Physique
        </button>
        <button
          onClick={() => setSubTab('fournisseurs')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'fournisseurs' ? 700 : 500,
            color: subTab === 'fournisseurs' ? '#C75B00' : '#475569', borderBottom: subTab === 'fournisseurs' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          👤 Fournisseurs
        </button>
        <button
          onClick={() => setSubTab('commandes')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'commandes' ? 700 : 500,
            color: subTab === 'commandes' ? '#C75B00' : '#475569', borderBottom: subTab === 'commandes' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          📝 Achats / Bons de Commande
        </button>
      </div>

      {subTab === 'stock' && <StockView boutiqueId={boutiqueId} />}

      {subTab === 'fournisseurs' && (
        <>
          {/* Outils & Recherche Fournisseur */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <input
              type="text"
              value={rechercheFournisseur}
              onChange={e => setRechercheFournisseur(e.target.value)}
              placeholder="🔍 Rechercher par nom, téléphone, email, adresse..."
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 260, flex: 1, outline: 'none' }}
            />
            <button
              onClick={() => { resetFouForm(); setModalFOUOuvert(true); }}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ➕ Ajouter Fournisseur
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>Chargement des fournisseurs...</p>
          ) : (() => {
            const qFou = rechercheFournisseur.trim().toLowerCase()
            const fournisseursFiltrés = fournisseurs.filter((f: any) =>
              !qFou ||
              f.nom?.toLowerCase().includes(qFou) ||
              f.telephone?.includes(qFou) ||
              f.email?.toLowerCase().includes(qFou) ||
              f.adresse?.toLowerCase().includes(qFou)
            )

            if (fournisseursFiltrés.length === 0) {
              return (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  👤 Aucun fournisseur trouvé.
                </div>
              )
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fournisseursFiltrés.map((f: any) => (
                <div key={f.id} style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{f.nom}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: '#6b7280' }}>
                        {f.telephone && <span>📞 {f.telephone}</span>}
                        {f.email && <span>✉️ {f.email}</span>}
                        {f.adresse && <span>📍 {f.adresse}</span>}
                        {!f.telephone && !f.email && !f.adresse && <span style={{ fontStyle: 'italic' }}>Aucune info de contact</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => ouvrirEditionFournisseur(f)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleSupprimerFournisseur(f.id, f.nom)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
        </>
      )}

      {subTab === 'commandes' && (
        <>
          {/* Outils, Recherche & Filtres Bons de Commande */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={rechercheCommande}
                onChange={e => setRechercheCommande(e.target.value)}
                placeholder="🔍 Rechercher par référence, fournisseur..."
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, flex: 1, outline: 'none' }}
              />
              <select
                value={filtreStatutCmd}
                onChange={e => setFiltreStatutCmd(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', outline: 'none' }}
              >
                <option value="tous">Touts les statuts</option>
                <option value="attente">⏳ En attente</option>
                <option value="recue">✅ Reçue</option>
              </select>
            </div>
            <button
              onClick={() => { resetCmdForm(); setModalCMDOuvert(true); }}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ➕ Créer Bon de Commande
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>Chargement des commandes d’achats...</p>
          ) : (() => {
            const qCmd = rechercheCommande.trim().toLowerCase()
            const commandesFiltrées = commandes.filter((cmd: any) => {
              const isRecue = cmd.statut === 'recu' || cmd.statut === 'recue'
              const matchStatut = filtreStatutCmd === 'tous' || (filtreStatutCmd === 'recue' ? isRecue : !isRecue)
              const fouNom = (fournisseurs.find(f => f.id === cmd.fournisseur_id)?.nom || '').toLowerCase()
              const matchSearch = !qCmd || cmd.reference?.toLowerCase().includes(qCmd) || fouNom.includes(qCmd)
              return matchStatut && matchSearch
            })

            if (commandesFiltrées.length === 0) {
              return (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  📝 Aucune commande d’achat trouvée.
                </div>
              )
            }

            return (
              <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Référence</th>
                      <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Fournisseur</th>
                      <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Total Achat</th>
                      <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Statut</th>
                      <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandesFiltrées.map((cmd: any) => {
                    const fou = fournisseurs.find(f => f.id === cmd.fournisseur_id)
                    const totalVal = Number(cmd.montant_total ?? cmd.total_achat ?? 0)
                    const rawDate = cmd.created_at || cmd.date_commande || cmd.date_livraison
                    const dateFmt = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR') : '—'
                    const isRecue = cmd.statut === 'recu' || cmd.statut === 'recue'
                    return (
                      <tr key={cmd.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 12, fontWeight: 700 }}>{cmd.reference}</td>
                        <td style={{ padding: 12 }}>{fou ? fou.nom : 'Inconnu'}</td>
                        <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(totalVal)}</td>
                        <td style={{ padding: 12 }}>{dateFmt}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: isRecue ? '#d1fae5' : '#fee2e2',
                            color: isRecue ? '#065f46' : '#9a3412'
                          }}>
                            {isRecue ? 'REÇUE' : 'EN ATTENTE'}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            {!isRecue && (
                              <button
                                onClick={() => ouvrirModalReception(cmd)}
                                style={{ padding: '5px 10px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                📥 Réceptionner
                              </button>
                            )}
                            {!isRecue && (
                              <button
                                onClick={() => ouvrirEditionCommande(cmd)}
                                style={{ padding: '5px 10px', borderRadius: 6, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                ✏️ Modifier
                              </button>
                            )}
                            <button
                              onClick={() => setCmdDetailsModal(cmd)}
                              style={{ padding: '5px 10px', borderRadius: 6, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              👁️ Détails
                            </button>
                            <button
                              onClick={() => handleSupprimerCommande(cmd.id, cmd.reference)}
                              style={{ padding: '5px 10px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              title="Supprimer la commande"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })()}
        </>
      )}

      {/* Modal Fournisseur */}
      {modalFOUOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>{fouEditId ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</h3>
            <form onSubmit={handleSoumettreFormFournisseur} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nom / Raison Sociale *</label>
                <input required value={fouNom} onChange={e => setFouNom(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: ETS Diouf & Frères" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Téléphone</label>
                <input value={fouTel} onChange={e => setFouTel(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: +221 77 123 45 67" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Email</label>
                <input type="email" value={fouEmail} onChange={e => setFouEmail(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: contact@dioufetfreres.sn" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Adresse</label>
                <input value={fouAdr} onChange={e => setFouAdr(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: Sandaga, Dakar" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <button type="button" onClick={() => setModalFOUOuvert(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? (fouEditId ? 'Modification...' : 'Ajout en cours...') : (fouEditId ? 'Enregistrer' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Commande */}
      {modalCMDOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {cmdEditId ? 'Modifier le bon de commande d’achat' : 'Nouveau bon de commande d’achat'}
            </h3>
            <form onSubmit={handleCreerCommande} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Sélectionner le fournisseur *</label>
                <select value={cmdFournisseurId} onChange={e => setCmdFournisseurId(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} required>
                  <option value="">-- Choisir un fournisseur --</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  📎 Document justificatif (Facture / Reçu PDF ou photo)
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleUploadFileCommande(e, false)}
                    style={{ fontSize: 13 }}
                    disabled={uploadingFile}
                  />
                  {uploadingFile && <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>⏳ Envoi du fichier...</span>}
                </div>
                {cmdJustificatifUrl && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✅ Document justificatif attaché</span>
                    <a href={cmdJustificatifUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
                      👁️ Consulter ↗
                    </a>
                    <button type="button" onClick={() => setCmdJustificatifUrl('')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700, marginLeft: 'auto' }}>
                      ✕ Supprimer
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>Le document sera automatiquement rattaché à la dépense comptable lors de la réception.</p>
              </div>

              {/* Lignes d’achats */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Articles à commander</h4>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>Sélectionnez un produit du catalogue ou saisissez un article libre hors catalogue.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={demarrerScannerEanCmd} style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      📷 Scan EAN
                    </button>
                    <button type="button" onClick={handleAjouterLigneCmd} style={{ padding: '6px 12px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      ➕ Ajouter un article
                    </button>
                  </div>
                </div>

                {cmdLignes.length === 0 ? (
                  <div style={{ padding: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                    Aucun article dans ce bon de commande. Cliquez sur <strong>➕ Ajouter un article</strong> pour commencer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {cmdLignes.map((ligne, idx) => {
                      const isCatalogProd = produits.some(p => p.id === ligne.produitId) && ligne.produitId !== 'custom'
                      const estCustom = !isCatalogProd || ligne.produitId === 'custom'

                      return (
                        <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Ligne 1: Sélection/Désignation + Supprimer */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                                Article / Désignation * <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>(Article {idx + 1})</span>
                              </label>
                              <button type="button" onClick={() => handleSupprimerLigneCmd(idx)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                ✕ Supprimer
                              </button>
                            </div>

                            <SearchableProductSelect
                              produits={produits}
                              value={isCatalogProd ? ligne.produitId : 'custom'}
                              onChange={(pId) => handleModifierLigneCmd(idx, 'produitId', pId)}
                              placeholder="🔍 Rechercher un produit à commander..."
                            />

                            {estCustom && (
                              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                <input
                                  type="text"
                                  value={ligne.nomLibre || ''}
                                  onChange={e => handleModifierLigneCmd(idx, 'nomLibre', e.target.value)}
                                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #0284c7', fontSize: 13, background: '#f0f9ff', color: '#0f172a' }}
                                  placeholder="Tapez le nom / la désignation de l'article..."
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => demarrerScannerNomCmd(idx)}
                                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                  📷 Scan Nom
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Ligne 2: Quantité et Prix Achat Unit avec libellés clairs */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 10, alignItems: 'end' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                                Quantité *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={ligne.quantite}
                                onChange={e => handleModifierLigneCmd(idx, 'quantite', Number(e.target.value))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#ffffff' }}
                                placeholder="Quantité"
                                required
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                                Prix Achat Unit. (FCFA) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={ligne.prixAchat}
                                onChange={e => handleModifierLigneCmd(idx, 'prixAchat', Number(e.target.value))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#ffffff' }}
                                placeholder="Prix unitaire"
                                required
                              />
                            </div>

                            <div style={{ textAlign: 'right', paddingBottom: 6 }}>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Total Ligne</div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#047857' }}>
                                {fcfa((Number(ligne.quantite) || 0) * (Number(ligne.prixAchat) || 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <button type="button" onClick={() => setModalCMDOuvert(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? (cmdEditId ? 'Modification...' : 'Création...') : (cmdEditId ? 'Enregistrer les modifications' : 'Créer Bon de Commande')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Commande Stock */}
      {cmdDetailsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Bon de Commande : {cmdDetailsModal.reference}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  Fournisseur : <strong>{fournisseurs.find(f => f.id === cmdDetailsModal.fournisseur_id)?.nom || 'Inconnu'}</strong>
                </p>
              </div>
              <button
                onClick={() => setCmdDetailsModal(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            {/* Informations synthétiques */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Statut</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: (cmdDetailsModal.statut === 'recu' || cmdDetailsModal.statut === 'recue') ? '#065f46' : '#9a3412' }}>
                  {(cmdDetailsModal.statut === 'recu' || cmdDetailsModal.statut === 'recue') ? '✅ REÇUE' : '⏳ EN ATTENTE'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Date de création</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {new Date(cmdDetailsModal.created_at || cmdDetailsModal.date_commande || Date.now()).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Montant Total</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#047857' }}>
                  {fcfa(cmdDetailsModal.montant_total ?? cmdDetailsModal.total_achat ?? 0)}
                </div>
              </div>
              {cmdDetailsModal.justificatif_url && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Pièce Justificative</div>
                  <a href={cmdDetailsModal.justificatif_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    📎 Voir le justificatif ↗
                  </a>
                </div>
              )}
            </div>

            {/* Tableau des articles commandés */}
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1f2937' }}>Détail des articles commandés</h4>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: 10, color: '#374151', fontWeight: 700 }}>Article</th>
                    <th style={{ padding: 10, color: '#374151', fontWeight: 700, textAlign: 'right' }}>Quantité</th>
                    <th style={{ padding: 10, color: '#374151', fontWeight: 700, textAlign: 'right' }}>P.U. Achat</th>
                    <th style={{ padding: 10, color: '#374151', fontWeight: 700, textAlign: 'right' }}>Total Ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {(typeof cmdDetailsModal.items === 'string' ? JSON.parse(cmdDetailsModal.items || '[]') : (cmdDetailsModal.items || [])).map((item: any, idx: number) => {
                    const pObj = produits.find(p => p.id === item.id || p.id === item.produitId)
                    const nomArt = item.nom || pObj?.nom || 'Article inconnu'
                    const qteArt = Number(item.quantite || 1)
                    const puArt = Number(item.prix_achat || item.prixAchat || item.prix || 0)
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 10, fontWeight: 600 }}>{nomArt}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>{qteArt}</td>
                        <td style={{ padding: 10, textAlign: 'right' }}>{fcfa(puArt)}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>{fcfa(puArt * qteArt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {!(cmdDetailsModal.statut === 'recu' || cmdDetailsModal.statut === 'recue') && (
                <button
                  onClick={() => {
                    const target = cmdDetailsModal
                    setCmdDetailsModal(null)
                    ouvrirModalReception(target)
                  }}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  📥 Réceptionner maintenant
                </button>
              )}
              <button
                onClick={() => setCmdDetailsModal(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réception de Commande Stock */}
      {modalRecevoirCmd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 550, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Réceptionner la commande {modalRecevoirCmd.reference}
            </h3>
            <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 16px', lineHeight: 1.5 }}>
              La confirmation de cette réception augmentera automatiquement les quantités en stock de vos produits et générera une dépense comptable d'achat de <strong>{fcfa(modalRecevoirCmd.montant_total ?? modalRecevoirCmd.total_achat ?? 0)}</strong>.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                📎 Pièce justificative de réception (Facture fournisseur / Bon de livraison PDF ou photo)
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleUploadFileCommande(e, true)}
                  style={{ fontSize: 13 }}
                  disabled={uploadingFile}
                />
                {uploadingFile && <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>⏳ Envoi du fichier...</span>}
              </div>
              {receptionJustificatifUrl && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✅ Justificatif de réception attaché</span>
                  <a href={receptionJustificatifUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
                    👁️ Consulter ↗
                  </a>
                  <button type="button" onClick={() => setReceptionJustificatifUrl('')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700, marginLeft: 'auto' }}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setModalRecevoirCmd(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmerReception}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                {isSubmitting ? 'Réception en cours...' : '✅ Confirmer la Réception'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner EAN Fournisseur */}
      {modalScannerEanCmd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>📷 Scanner Code-barres (EAN)</h4>
              <button type="button" onClick={arreterScannerEanCmd} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatusCmd}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div id="fou-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={arreterScannerEanCmd} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner Nom OCR Fournisseur */}
      {modalScannerNomCmd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>📷 Scanner le Nom du Produit</h4>
              <button type="button" onClick={arreterScannerNomCmd} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNomCmd}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoNomCmdRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '20%', left: '7.5%', width: '85%', height: '60%', border: '2px dashed #38bdf8', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                  Cadrez le nom au centre
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={ocrLoadingCmd}
              onClick={capturerNomOCRCmd}
              style={{ width: '100%', padding: '12px', background: ocrLoadingCmd ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: ocrLoadingCmd ? 'not-allowed' : 'pointer' }}
            >
              {ocrLoadingCmd ? '⏳ Analyse OCR en cours...' : '📸 Capturer et Extraire le Nom'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
