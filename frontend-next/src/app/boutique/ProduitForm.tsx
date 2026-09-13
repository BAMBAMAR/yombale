'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useFormState } from 'react-dom'
import { createProduit, updateProduit } from './actions'
import type { ActionState } from '@/lib/backend-fetch'
import { useTranslation } from '@/i18n/context'
import {
  champVisibleSelonVariante,
  nomParDefautPourCategorie,
} from './boutiqueHelpers'
import type { Produit } from './boutiqueTypes'
import { Mic, Scan, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

// Modular subcomponents & helpers
import { inputStyle, labelStyle } from './produits/constants'
import { CaracteristiquesFields } from './produits/CaracteristiquesFields'
import { ProduitFormPhotos } from './produits/ProduitFormPhotos'
import { ProduitFormAdvancedOptions } from './produits/ProduitFormAdvancedOptions'
import { ProduitFormScannersModal } from './produits/ProduitFormScannersModal'
import { ProduitFormSubmitBar } from './produits/ProduitFormSubmitBar'
import { useProduitFormScanners } from './produits/hooks/useProduitFormScanners'
import { useProduitFormVariantes } from './produits/hooks/useProduitFormVariantes'

export { inputStyle, labelStyle, CaracteristiquesFields }

function ProduitForm({
  boutiqueId,
  boutiqueCat,
  produit,
  modeInitial = 'rapide',
  onCancel,
  onSuccess,
}: {
  boutiqueId: string
  boutiqueCat?: string | null
  produit?: Produit
  modeInitial?: 'rapide' | 'detaille'
  onCancel: () => void
  onSuccess: (produitCree?: any) => void
}) {
  const { t } = useTranslation() as { t: any }
  const action = produit ? updateProduit.bind(null, boutiqueId, produit.id) : createProduit.bind(null, boutiqueId)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  const [enStock, setEnStock] = useState(produit?.en_stock !== false)
  const [cat, setCat] = useState(produit?.categorie ?? boutiqueCat ?? '')
  const [carac, setCarac] = useState<Record<string, string>>(produit?.caracteristiques ?? {})
  const [showAdvanced, setShowAdvanced] = useState<boolean>(!!produit)

  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imagesExistantes, setImagesExistantes] = useState<string[]>(produit?.images ?? [])

  const [nomForm, setNomForm] = useState<string>(
    produit?.nom ?? (modeInitial === 'rapide' ? nomParDefautPourCategorie(cat) : '')
  )
  const [codeBarreForm, setCodeBarreForm] = useState<string>((produit as any)?.code_barre || '')
  const [prixForm, setPrixForm] = useState<string>(produit?.prix != null ? String(produit.prix) : '')
  const [prixAchatForm, setPrixAchatForm] = useState<string>(
    (produit as any)?.prix_achat != null ? String((produit as any).prix_achat) : ''
  )
  const [stockQuantiteForm, setStockQuantiteForm] = useState<string>(
    (produit as any)?.quantite_stock != null
      ? String((produit as any).quantite_stock)
      : produit?.stock_quantite != null
      ? String(produit.stock_quantite)
      : ''
  )
  const [prixBarreForm, setPrixBarreForm] = useState<string>(produit?.prix_barre != null ? String(produit.prix_barre) : '')
  const [descForm, setDescForm] = useState<string>(produit?.description ?? '')

  useEffect(() => {
    if (produit?.nom) setNomForm(produit.nom)
    setCodeBarreForm((produit as any)?.code_barre || '')
    if (produit?.prix != null) setPrixForm(String(produit.prix))
    if ((produit as any)?.prix_achat != null) setPrixAchatForm(String((produit as any).prix_achat))
    if ((produit as any)?.quantite_stock != null) setStockQuantiteForm(String((produit as any).quantite_stock))
    else if (produit?.stock_quantite != null) setStockQuantiteForm(String(produit.stock_quantite))
    else setStockQuantiteForm('')
    if (produit?.prix_barre != null) setPrixBarreForm(String(produit.prix_barre))
    if (produit?.description != null) setDescForm(produit.description)
  }, [produit])

  useEffect(() => {
    if (cat && !nomForm) {
      setNomForm(nomParDefautPourCategorie(cat))
    }
  }, [cat])

  // Hook Scanners & Dictée Vocale
  const scanners = useProduitFormScanners({
    nomForm,
    setNomForm,
    setPrixForm,
    setCodeBarreForm,
  })

  // Hook Variantes & SKU Matrix
  const variantesState = useProduitFormVariantes({
    produit,
    nomForm,
    prixForm,
    stockQuantiteForm,
  })

  useEffect(() => {
    setCarac(prev => {
      let changed = false
      const next = { ...prev }
      for (const champ of ['taille', 'couleur', 'stockage'] as const) {
        if (!champVisibleSelonVariante(champ, variantesState.typesDejaUtilises) && champ in next) {
          delete next[champ]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [variantesState.typesDejaUtilises.size, Array.from(variantesState.typesDejaUtilises).join(',')])

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const produitFormTopRef = useRef<HTMLDivElement>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSuccessMsg(produit ? 'Produit modifié avec succès !' : 'Produit ajouté au catalogue avec succès !')
      if (produitFormTopRef.current) {
        produitFormTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onSuccess((state as any)?.produit)
      const tId = setTimeout(() => setSuccessMsg(null), 6000)
      return () => clearTimeout(tId)
    } else if (state.error && handledRef.current !== state) {
      handledRef.current = state
      if (produitFormTopRef.current) {
        produitFormTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [state, produit, onSuccess])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  function handleMagicImportSuccess(data: any) {
    if (data.titre) setNomForm(data.titre)
    if (data.prix > 0) setPrixForm(String(data.prix))
    if (data.prix_achat > 0) setPrixAchatForm(String(data.prix_achat))
    if (data.prix_barre > 0) setPrixBarreForm(String(data.prix_barre))
    if (data.description) setDescForm(data.description)
    if (data.categorie && data.categorie !== 'divers') setCat(data.categorie)
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      setImagesExistantes(data.images)
    }
    setShowAdvanced(true)
  }

  const hasCaracFields = cat && cat !== 'autre' && showAdvanced

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60 }}>
      <div ref={produitFormTopRef} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
          {produit ? t('shop.editProductTitle') : 'Ajouter un produit (Mode Rapide 10s)'}
        </h3>
        {!produit && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: 20 }}>
            3 champs suffisent pour vendre
          </span>
        )}
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', color: '#166534', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{successMsg}</span>
        </div>
      )}

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
          {state.error}
        </div>
      )}

      {/* Champs cachés pour le formulaire */}
      <input type="hidden" name="images" value={JSON.stringify(imagesExistantes)} />
      <input type="hidden" name="categorie" value={cat} />
      <input type="hidden" name="code_barre" value={codeBarreForm} />
      <input type="hidden" name="quantite_stock" value={stockQuantiteForm} />
      <input type="hidden" name="caracteristiques" value={JSON.stringify(carac)} />
      <input type="hidden" name="variantes" value={JSON.stringify(variantesState.variantes.filter(v => v.nom.trim() && v.valeurs.length > 0))} />
      <input type="hidden" name="variantes_skus" value={JSON.stringify(variantesState.variantesSkus)} />
      <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />

      {/* ── 1. PHOTOS DU PRODUIT ── */}
      <ProduitFormPhotos
        imagesExistantes={imagesExistantes}
        setImagesExistantes={setImagesExistantes}
        photos={photos}
        setPhotos={setPhotos}
        previews={previews}
        setPreviews={setPreviews}
      />

      {/* ── 2. NOM DU PRODUIT ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: scanners.isListeningNom ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
          padding: 16,
          boxShadow: scanners.isListeningNom ? '0 4px 18px rgba(234, 88, 12, 0.15)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
          <label className="npl-label-airy" style={{ margin: 0 }}>
            Nom du produit <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <span style={{ fontSize: 12, color: '#ea580c', fontWeight: 700 }}>
            Dictez en Wolof ou Français (« Nom seul » ou « Nom + Prix »)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            name="nom"
            required
            maxLength={300}
            value={nomForm}
            onChange={e => setNomForm(e.target.value)}
            className="npl-input-airy"
            style={{ flex: '1 1 200px' }}
            placeholder="Ex: Robe Bazin Brodé / Lait Candia 1L..."
          />

          <button
            type="button"
            onClick={scanners.demarrerEcouteVocaleNom}
            className="npl-btn npl-btn-md"
            style={{
              flex: '0 0 auto',
              height: 48,
              whiteSpace: 'nowrap',
              borderRadius: 12,
              padding: '0 16px',
              fontWeight: 800,
              background: scanners.isListeningNom ? '#ea580c' : '#fff7ed',
              color: scanners.isListeningNom ? '#ffffff' : '#c2410c',
              border: scanners.isListeningNom ? '2px solid #9a3412' : '1.5px solid #fdba74',
              boxShadow: scanners.isListeningNom ? '0 0 0 4px rgba(234, 88, 12, 0.25)' : 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            title={scanners.isListeningNom ? "Arrêter l'écoute" : "Dicter le nom ou le nom + prix"}
          >
            <Mic size={16} />
            <span>{scanners.isListeningNom ? 'Écoute…' : 'Dicter'}</span>
          </button>

          <button
            type="button"
            onClick={() => scanners.demarrerFormScanner('nom')}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', height: 48, whiteSpace: 'nowrap', borderRadius: 12, padding: '0 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Scanner le nom écrit sur l'emballage du produit"
          >
            <Scan size={16} />
            <span>Scan Nom</span>
          </button>
        </div>

        {scanners.isListeningNom && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 12.5, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
            <span>Écoute en cours… Dites le nom (ex: <em>« Robe Bazin »</em>) ou avec le prix (ex: <em>« Robe Bazin 15 000 »</em>)</span>
          </div>
        )}

        {scanners.voiceNomFeedback && (
          <div
            style={{
              marginTop: 10,
              padding: '9px 13px',
              background: scanners.voiceNomFeedback.includes('bloqué') || scanners.voiceNomFeedback.includes('indisponible') || scanners.voiceNomFeedback.includes('Erreur')
                ? '#fef2f2'
                : '#f0fdf4',
              border: scanners.voiceNomFeedback.includes('bloqué') || scanners.voiceNomFeedback.includes('indisponible') || scanners.voiceNomFeedback.includes('Erreur')
                ? '1.5px solid #fecaca'
                : '1px solid #bbf7d0',
              borderRadius: 8,
              fontSize: 12.5,
              color: scanners.voiceNomFeedback.includes('bloqué') || scanners.voiceNomFeedback.includes('indisponible') || scanners.voiceNomFeedback.includes('Erreur')
                ? '#991b1b'
                : '#166534',
              fontWeight: 700,
            }}
          >
            {scanners.voiceNomFeedback}
          </div>
        )}
      </div>

      {/* ── 3. PRIX DE VENTE (FCFA) ── */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 16 }}>
        <label className="npl-label-airy">
          Prix de vente (FCFA) <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            name="prix"
            type="number"
            min={0}
            required
            value={prixForm}
            onChange={e => setPrixForm(e.target.value)}
            className="npl-input-airy"
            style={{ fontSize: 18, fontWeight: 800, paddingRight: 70, color: '#0f172a' }}
            placeholder="Ex: 15 000"
          />
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b', fontSize: 13, pointerEvents: 'none' }}>
            FCFA
          </span>
        </div>
      </div>

      {/* ── ACCORDÉON PROGRESSIVE DISCLOSURE : OPTIONS AVANCÉES ── */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="npl-accordion-btn"
        style={{ marginTop: 4, padding: '14px 18px', borderRadius: 14, border: '1.5px solid #cbd5e1' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
          <Sparkles size={18} color="#1d4ed8" />
          <span>
            <strong style={{ display: 'block', fontSize: 13.5, color: '#0f172a' }}>
              Options avancées (Stock, Catégorie, Variantes, EAN, Description, Import)
            </strong>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
              {showAdvanced ? 'Cliquez pour masquer les champs secondaires' : 'Facultatif — à renseigner si nécessaire'}
            </span>
          </span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 4 }}>
          {showAdvanced ? <><ChevronUp size={16} /> Replier</> : <><ChevronDown size={16} /> Déplier</>}
        </span>
      </button>

      {showAdvanced && (
        <ProduitFormAdvancedOptions
          produit={produit}
          cat={cat}
          setCat={setCat}
          setCarac={setCarac}
          carac={carac}
          handleCarac={handleCarac}
          hasCaracFields={hasCaracFields}
          codeBarreForm={codeBarreForm}
          setCodeBarreForm={setCodeBarreForm}
          stockQuantiteForm={stockQuantiteForm}
          setStockQuantiteForm={setStockQuantiteForm}
          prixAchatForm={prixAchatForm}
          setPrixAchatForm={setPrixAchatForm}
          prixBarreForm={prixBarreForm}
          setPrixBarreForm={setPrixBarreForm}
          prixForm={prixForm}
          enStock={enStock}
          setEnStock={setEnStock}
          descForm={descForm}
          setDescForm={setDescForm}
          scanners={scanners}
          handleMagicImportSuccess={handleMagicImportSuccess}
          variantesState={variantesState}
          t={t}
        />
      )}

      {/* Modal Scanner Caméra (Scan Nom ou Scan EAN) */}
      <ProduitFormScannersModal
        modalFormScanner={scanners.modalFormScanner}
        scannerTarget={scanners.scannerTarget}
        scannerStatus={scanners.scannerStatus}
        imageFligeeNom={scanners.imageFligeeNom}
        setImageFligeeNom={scanners.setImageFligeeNom}
        videoFormRef={scanners.videoFormRef}
        ocrLoading={scanners.ocrLoading}
        capturerEtLireNomTexte={scanners.capturerEtLireNomTexte}
        nomForm={nomForm}
        setNomForm={setNomForm}
        arreterFormScanner={scanners.arreterFormScanner}
        ocrDetections={scanners.ocrDetections}
      />

      {/* ── BARRE D'ACTION STICKY EN BAS ── */}
      <ProduitFormSubmitBar
        isEditing={!!produit}
        onCancel={onCancel}
        t={t}
      />
    </form>
  )
}

export default ProduitForm
export { ProduitForm }
