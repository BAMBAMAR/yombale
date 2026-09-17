'use client'

import React, { useState } from 'react'
import { Camera, Video, AlertCircle, Loader2 } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import BienPhotoUploader from './BienPhotoUploader'
import BienVideoUploader from './BienVideoUploader'
import BienSectionOperation from './BienSectionOperation'
import BienSectionLocalisation from './BienSectionLocalisation'
import BienSectionCaracteristiques from './BienSectionCaracteristiques'
import BienSectionFinances from './BienSectionFinances'
import BienSectionDescription from './BienSectionDescription'
import { CommoditesState } from './BienCommoditesSelector'

export interface BienFormData {
  id?: string
  reference?: string
  titre?: string
  type_bien?: string
  sous_type?: string
  ville?: string
  quartier?: string
  adresse?: string
  surface_m2?: number | string
  nb_pieces?: number | string
  nb_chambres?: number | string
  nb_sdb?: number | string
  etage?: number | string
  statut_occupation?: string
  prix_location?: number | string
  prix_vente?: number | string
  charges?: number | string
  depot_garantie?: number | string
  meuble?: boolean
  ascenseur?: boolean
  parking?: boolean
  gardien?: boolean
  climatisation?: boolean
  piscine?: boolean
  photos?: string[] | string
  videos?: string[] | string
  description?: string
  notes_internes?: string
}

interface BienFormProps {
  slug: string
  initialBien?: BienFormData | null
  onSuccess: (savedBien: any) => void
  onCancel?: () => void
  isModal?: boolean
}

function parseArrayField(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return val.trim() ? [val.trim()] : []
    }
  }
  return []
}

export default function BienForm({
  slug,
  initialBien,
  onSuccess,
  onCancel,
  isModal = false,
}: BienFormProps) {
  const isEdit = Boolean(initialBien?.id)

  const [operationType, setOperationType] = useState<'location' | 'vente'>(() => {
    if (initialBien?.prix_location) return 'location'
    if (initialBien?.prix_vente) return 'vente'
    return 'location'
  })

  const [photos, setPhotos] = useState<string[]>(() => parseArrayField(initialBien?.photos))
  const [videos, setVideos] = useState<string[]>(() => parseArrayField(initialBien?.videos))

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    titre: initialBien?.titre || '',
    type_bien: initialBien?.type_bien || 'appartement',
    ville: initialBien?.ville || 'Dakar',
    quartier: initialBien?.quartier || '',
    adresse: initialBien?.adresse || '',
    surface_m2: initialBien?.surface_m2 !== undefined && initialBien?.surface_m2 !== null ? String(initialBien.surface_m2) : '',
    nb_pieces: initialBien?.nb_pieces !== undefined && initialBien?.nb_pieces !== null ? String(initialBien.nb_pieces) : '2',
    nb_chambres: initialBien?.nb_chambres !== undefined && initialBien?.nb_chambres !== null ? String(initialBien.nb_chambres) : '1',
    nb_sdb: initialBien?.nb_sdb !== undefined && initialBien?.nb_sdb !== null ? String(initialBien.nb_sdb) : '1',
    etage: initialBien?.etage !== undefined && initialBien?.etage !== null ? String(initialBien.etage) : '',
    statut_occupation: initialBien?.statut_occupation || 'disponible',
    prix_location: initialBien?.prix_location ? String(initialBien.prix_location) : '',
    prix_vente: initialBien?.prix_vente ? String(initialBien.prix_vente) : '',
    charges: initialBien?.charges ? String(initialBien.charges) : '',
    depot_garantie: initialBien?.depot_garantie ? String(initialBien.depot_garantie) : '',
    meuble: Boolean(initialBien?.meuble),
    ascenseur: Boolean(initialBien?.ascenseur),
    parking: Boolean(initialBien?.parking),
    gardien: Boolean(initialBien?.gardien),
    climatisation: Boolean(initialBien?.climatisation),
    piscine: Boolean(initialBien?.piscine),
    description: initialBien?.description || '',
    notes_internes: initialBien?.notes_internes || '',
  })

  function handleCommoditeChange(key: keyof CommoditesState, checked: boolean) {
    setForm(prev => ({ ...prev, [key]: checked }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!form.titre.trim()) {
      setErrorMsg('Le titre du bien est obligatoire.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        titre: form.titre.trim(),
        type_bien: form.type_bien,
        ville: form.ville.trim(),
        quartier: form.quartier.trim() || null,
        adresse: form.adresse.trim() || null,
        prix_location: operationType === 'location' ? (parseFloat(form.prix_location) || null) : null,
        prix_vente: operationType === 'vente' ? (parseFloat(form.prix_vente) || null) : null,
        charges: operationType === 'location' ? (parseFloat(form.charges) || 0) : 0,
        depot_garantie: operationType === 'location' ? (parseFloat(form.depot_garantie) || 0) : 0,
        surface_m2: form.surface_m2 ? parseFloat(form.surface_m2) : null,
        nb_pieces: form.nb_pieces ? parseInt(form.nb_pieces, 10) : 1,
        nb_chambres: form.nb_chambres ? parseInt(form.nb_chambres, 10) : 1,
        nb_sdb: form.nb_sdb ? parseInt(form.nb_sdb, 10) : 1,
        etage: form.etage !== '' ? parseInt(form.etage, 10) : null,
        statut_occupation: form.statut_occupation,
        meuble: form.meuble,
        ascenseur: form.ascenseur,
        parking: form.parking,
        gardien: form.gardien,
        climatisation: form.climatisation,
        piscine: form.piscine,
        description: form.description.trim() || null,
        notes_internes: form.notes_internes.trim() || null,
        photos,
        videos,
      }

      const url = isEdit
        ? `/api/biens/agence/${slug}/${initialBien!.id}`
        : `/api/biens/agence/${slug}`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || (isEdit ? 'Erreur lors de la modification du bien.' : "Erreur lors de l'enregistrement du bien."))
        return
      }

      onSuccess(data.bien)
    } catch (err) {
      console.error('[BIEN_FORM_ERR]', err)
      setErrorMsg('Erreur de communication avec le serveur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {errorMsg && (
        <div
          style={{
            padding: '12px 14px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={17} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 1. Opération & Type de bien ── */}
      <BienSectionOperation
        operationType={operationType}
        onOperationTypeChange={setOperationType}
        titre={form.titre}
        onTitreChange={val => setForm(p => ({ ...p, titre: val }))}
        typeBien={form.type_bien}
        onTypeBienChange={val => setForm(p => ({ ...p, type_bien: val }))}
        prixLocation={form.prix_location}
        onPrixLocationChange={val => setForm(p => ({ ...p, prix_location: val }))}
        prixVente={form.prix_vente}
        onPrixVenteChange={val => setForm(p => ({ ...p, prix_vente: val }))}
      />

      {/* ── 2. Photos du bien (Smartphone Ready) ── */}
      <div className="agence-card" style={{ marginBottom: 0 }}>
        <div className="agence-card-header">
          <div className="agence-card-title">
            <Camera size={17} color="var(--accent, #C75B00)" />
            Photos du bien (Smartphone Ready)
          </div>
        </div>
        <BienPhotoUploader slug={slug} photos={photos} onChange={setPhotos} />
      </div>

      {/* ── 3. Vidéos & Visite Virtuelle ── */}
      <div className="agence-card" style={{ marginBottom: 0 }}>
        <div className="agence-card-header">
          <div className="agence-card-title">
            <Video size={17} color="var(--accent, #C75B00)" />
            Vidéos & Visite Virtuelle
          </div>
        </div>
        <BienVideoUploader slug={slug} videos={videos} onChange={setVideos} />
      </div>

      {/* ── 4. Localisation ── */}
      <BienSectionLocalisation
        ville={form.ville}
        onVilleChange={val => setForm(p => ({ ...p, ville: val }))}
        quartier={form.quartier}
        onQuartierChange={val => setForm(p => ({ ...p, quartier: val }))}
        adresse={form.adresse}
        onAdresseChange={val => setForm(p => ({ ...p, adresse: val }))}
      />

      {/* ── 5. Caractéristiques & Équipements ── */}
      <BienSectionCaracteristiques
        surfaceM2={form.surface_m2}
        onSurfaceM2Change={val => setForm(p => ({ ...p, surface_m2: val }))}
        nbPieces={form.nb_pieces}
        onNbPiecesChange={val => setForm(p => ({ ...p, nb_pieces: val }))}
        nbChambres={form.nb_chambres}
        onNbChambresChange={val => setForm(p => ({ ...p, nb_chambres: val }))}
        nbSdb={form.nb_sdb}
        onNbSdbChange={val => setForm(p => ({ ...p, nb_sdb: val }))}
        etage={form.etage}
        onEtageChange={val => setForm(p => ({ ...p, etage: val }))}
        statutOccupation={form.statut_occupation}
        onStatutOccupationChange={val => setForm(p => ({ ...p, statut_occupation: val }))}
        commodites={{
          meuble: form.meuble,
          climatisation: form.climatisation,
          gardien: form.gardien,
          parking: form.parking,
          ascenseur: form.ascenseur,
          piscine: form.piscine,
        }}
        onCommoditeChange={handleCommoditeChange}
      />

      {/* ── 6. Conditions Financières Détaillées (Location) ── */}
      {operationType === 'location' && (
        <BienSectionFinances
          charges={form.charges}
          onChargesChange={val => setForm(p => ({ ...p, charges: val }))}
          depotGarantie={form.depot_garantie}
          onDepotGarantieChange={val => setForm(p => ({ ...p, depot_garantie: val }))}
        />
      )}

      {/* ── 7. Description & Prestations ── */}
      <BienSectionDescription
        description={form.description}
        onDescriptionChange={val => setForm(p => ({ ...p, description: val }))}
        notesInternes={form.notes_internes}
        onNotesInternesChange={val => setForm(p => ({ ...p, notes_internes: val }))}
      />

      {/* ── 8. Boutons d'Action ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: onCancel ? '1fr 2fr' : '1fr',
          gap: 10,
          marginTop: isModal ? 8 : 16,
          position: isModal ? 'sticky' : 'static',
          bottom: 0,
          background: isModal ? '#FFFFFF' : 'transparent',
          paddingTop: isModal ? 12 : 0,
          borderTop: isModal ? '1px solid var(--border, #E8DDD2)' : 'none',
          zIndex: 10,
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 46,
            }}
          >
            Annuler
          </button>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            minHeight: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enregistrement…</span>
            </>
          ) : (
            <span>{isEdit ? 'Sauvegarder les modifications' : 'Enregistrer le bien'}</span>
          )}
        </button>
      </div>
    </form>
  )
}
