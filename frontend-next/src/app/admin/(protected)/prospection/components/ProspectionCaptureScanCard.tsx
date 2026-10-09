'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Camera, Image as ImageIcon, Sparkles, Check, Phone, Tag, AlertCircle, RefreshCw, ArrowRight, User } from 'lucide-react'

interface Props {
  secret: string
  onLeadImported?: () => void
}

interface ScannedLead {
  nom_boutique: string
  contact_nom: string | null
  telephone: string
  telephone_brut: string
  telephone_formate: string
  operateur: string
  categorie: string
  ville: string
  quartier: string
  source: string
  notes: string
}

export default function ProspectionCaptureScanCard({ secret, onLeadImported }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Résultat de l'analyse OCR
  const [scannedLeads, setScannedLeads] = useState<ScannedLead[]>([])
  const [pseudoDetecte, setPseudoDetecte] = useState<string | null>(null)
  const [estTikTokLive, setEstTikTokLive] = useState(false)
  const [rawOcrText, setRawOcrText] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Écouteur global pour le copier-coller (Ctrl+V) d'images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            chargerFichierImage(file)
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const chargerFichierImage = (file: File) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setScannedLeads([])
    setPseudoDetecte(null)
    setRawOcrText(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      chargerFichierImage(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      chargerFichierImage(files[0])
    }
  }

  const handleScannerCapture = async () => {
    if (!imagePreview) {
      setErrorMsg('Veuillez sélectionner ou coller une capture d\'écran d\'abord.')
      return
    }

    setIsScanning(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/prospection/leads/scan-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          imageBase64: imagePreview,
          autoInserer: false,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l\'analyse de la capture.')
      }

      if (!data.leads || data.leads.length === 0) {
        setErrorMsg('Aucun numéro sénégalais détecté sur l\'image. Vérifiez la lisibilité du sticker.')
        setRawOcrText(data.texteOcr || null)
        return
      }

      setScannedLeads(data.leads)
      setPseudoDetecte(data.pseudoDetecte || null)
      setEstTikTokLive(Boolean(data.estTikTokLive))
      setRawOcrText(data.texteOcr || null)
      setSuccessMsg(`${data.leads.length} numéro(s) extrait(s) et normalisé(s) avec succès !`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau'
      setErrorMsg(msg)
    } finally {
      setIsScanning(false)
    }
  }

  const handleEnregistrerLead = async (lead: ScannedLead, index: number) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/prospection/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          nom_boutique: lead.nom_boutique,
          contact_nom: lead.contact_nom,
          telephone: lead.telephone,
          telephone_brut: lead.telephone_brut,
          operateur: lead.operateur,
          categorie: lead.categorie,
          ville: lead.ville,
          quartier: lead.quartier,
          source: lead.source,
          notes: lead.notes,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(`Lead "${lead.nom_boutique}" ajouté au CRM !`)
        // Retirer de la liste
        setScannedLeads((prev) => prev.filter((_, i) => i !== index))
        if (onLeadImported) {
          onLeadImported()
        }
      } else {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec enregistrement'
      setErrorMsg(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const updateLeadField = (index: number, field: keyof ScannedLead, value: string) => {
    setScannedLeads((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    )
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 900,
            color: '#1C2B4A',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Camera size={20} color="#C75B00" /> Scanner de Captures TikTok &amp; Réseaux
        </h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            background: 'rgba(199, 91, 0, 0.1)',
            color: '#C75B00',
            padding: '3px 8px',
            borderRadius: 6,
          }}
        >
          OCR &amp; Dé-obfuscation Anti-Ban
        </span>
      </div>

      <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.45 }}>
        Glissez une capture d&apos;écran de Live TikTok, WhatsApp Status ou faites directement <strong>Ctrl+V</strong>. Le système déchiffre les numéros obfusqués (ex: <em>77$175&amp;59&amp;35</em>, <em>778303832##</em>, <em>78-207-94-34</em>) et extrait le pseudo du vendeur.
      </p>

      {/* Zone de drop & preview */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !imagePreview && fileInputRef.current?.click()}
        style={{
          border: '2px dashed #CBD5E1',
          borderRadius: 12,
          padding: imagePreview ? '12px' : '28px 16px',
          textAlign: 'center',
          background: '#F8FAFC',
          cursor: imagePreview ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {imagePreview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img
              src={imagePreview}
              alt="Aperçu capture"
              style={{
                maxHeight: 220,
                maxWidth: '100%',
                borderRadius: 8,
                objectFit: 'contain',
                border: '1px solid #E2E8F0',
              }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleScannerCapture}
                disabled={isScanning}
                style={{
                  background: '#0A5C36',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isScanning ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Analyse OCR en cours...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Déchiffrer la capture
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null)
                  setScannedLeads([])
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Changer d&apos;image
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ImageIcon size={32} color="#94A3B8" />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
              Glissez une image ici ou faites <kbd style={{ background: '#E2E8F0', padding: '2px 5px', borderRadius: 4 }}>Ctrl + V</kbd>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              Formats supportés : JPEG, PNG, WebP (Captures d&apos;écran)
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Leads détectés */}
      {scannedLeads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Prospect(s) extrait(s) :</span>
            {estTikTokLive && (
              <span style={{ fontSize: 11, background: '#0F172A', color: '#F8FAFC', padding: '2px 6px', borderRadius: 4 }}>
                Live TikTok {pseudoDetecte ? `@${pseudoDetecte}` : ''}
              </span>
            )}
          </div>

          {scannedLeads.map((lead, idx) => (
            <div
              key={idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>
                    Nom / Boutique
                  </label>
                  <input
                    type="text"
                    value={lead.nom_boutique}
                    onChange={(e) => updateLeadField(idx, 'nom_boutique', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>
                    Téléphone (+221)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="text"
                      value={lead.telephone_formate}
                      readOnly
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#F1F5F9', fontWeight: 800 }}
                    />
                    <span style={{ fontSize: 11, background: '#E2E8F0', padding: '4px 6px', borderRadius: 4, whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {lead.operateur}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>
                    Catégorie
                  </label>
                  <select
                    value={lead.categorie}
                    onChange={(e) => updateLeadField(idx, 'categorie', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="mode">Mode &amp; Prêt-à-porter</option>
                    <option value="tech">Téléphonie &amp; Tech</option>
                    <option value="maison">Maison &amp; Tapis</option>
                    <option value="cosmetique">Cosmétique &amp; Beauté</option>
                    <option value="grossiste">Grossiste Chine</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>
                    Sticker d&apos;origine
                  </label>
                  <span style={{ fontSize: 12, color: '#64748B', display: 'block', padding: '6px 0', fontFamily: 'monospace' }}>
                    {lead.telephone_brut}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEnregistrerLead(lead, idx)}
                disabled={isSaving}
                style={{
                  background: '#1C2B4A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <ArrowRight size={15} /> Ajouter ce Prospect au CRM
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
