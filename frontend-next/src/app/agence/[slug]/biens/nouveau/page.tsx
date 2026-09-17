'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Home,
  ArrowLeft,
  Camera,
  Video,
  MapPin,
  FileText,
  AlertCircle,
  Sliders
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import BienPhotoUploader from '../components/BienPhotoUploader'
import BienVideoUploader from '../components/BienVideoUploader'
import BienCommoditesSelector, { CommoditesState } from '../components/BienCommoditesSelector'

export default function NouveauBienPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [operationType, setOperationType] = useState<'location' | 'vente'>('location')
  const [photos, setPhotos] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])

  const [form, setForm] = useState({
    titre: '',
    type_bien: 'appartement',
    ville: 'Dakar',
    quartier: '',
    adresse: '',
    surface_m2: '',
    nb_pieces: '2',
    nb_chambres: '1',
    nb_sdb: '1',
    prix_location: '',
    prix_vente: '',
    charges: '',
    depot_garantie: '',
    meuble: false,
    ascenseur: false,
    parking: false,
    gardien: false,
    climatisation: false,
    piscine: false,
    description: '',
    notes_internes: '',
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
        ...form,
        prix_location: operationType === 'location' ? form.prix_location : null,
        prix_vente: operationType === 'vente' ? form.prix_vente : null,
        photos,
        videos,
      }

      const res = await fetch(`/api/biens/agence/${slug}`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Erreur lors de l'enregistrement du bien.")
        return
      }

      router.push(`/agence/${slug}/biens`)
    } catch (err) {
      console.error('[SAVE_BIEN_ERR]', err)
      setErrorMsg('Erreur de communication avec le serveur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── En-tête Mobile-First ── */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href={`/agence/${slug}/biens`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 700,
            color: '#64748B',
            textDecoration: 'none',
            marginBottom: 6,
          }}
        >
          <ArrowLeft size={15} />
          Retour au portefeuille
        </Link>
        <h1 className="agence-title" style={{ fontSize: 22 }}>Ajouter un bien immobilier</h1>
        <p className="agence-subtitle" style={{ fontSize: 13 }}>
          Création rapide depuis le terrain avec photos directes par smartphone et vidéos.
        </p>
      </div>

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
            marginBottom: 16,
          }}
        >
          <AlertCircle size={17} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── 1. Type & Opération ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Home size={17} color="var(--accent, #C75B00)" />
              Opération & Type de bien
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type d&apos;opération *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setOperationType('location')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: operationType === 'location' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                  background: operationType === 'location' ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
                  color: operationType === 'location' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                  minHeight: 46,
                }}
              >
                Location
              </button>
              <button
                type="button"
                onClick={() => setOperationType('vente')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: operationType === 'vente' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                  background: operationType === 'vente' ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
                  color: operationType === 'vente' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                  minHeight: 46,
                }}
              >
                Vente
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Titre du bien *</label>
            <input
              type="text"
              required
              placeholder="Ex: Villa F5 Standing avec Jardin - Almadies"
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type de bien *</label>
              <select
                value={form.type_bien}
                onChange={e => setForm({ ...form, type_bien: e.target.value })}
                className="form-select"
              >
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="studio">Studio / Chambre</option>
                <option value="terrain">Terrain</option>
                <option value="bureau">Bureau / Local commercial</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {operationType === 'location' ? 'Loyer mensuel (FCFA) *' : 'Prix de vente (FCFA) *'}
              </label>
              <input
                type="number"
                required
                placeholder={operationType === 'location' ? '450000' : '85000000'}
                value={operationType === 'location' ? form.prix_location : form.prix_vente}
                onChange={e =>
                  operationType === 'location'
                    ? setForm({ ...form, prix_location: e.target.value })
                    : setForm({ ...form, prix_vente: e.target.value })
                }
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* ── 2. Photos du bien (Smartphone Ready) ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Camera size={17} color="var(--accent, #C75B00)" />
              Photos du bien
            </div>
          </div>
          <BienPhotoUploader slug={slug} photos={photos} onChange={setPhotos} />
        </div>

        {/* ── 3. Vidéos & Visite Virtuelle ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Video size={17} color="var(--accent, #C75B00)" />
              Vidéos & Visite Virtuelle
            </div>
          </div>
          <BienVideoUploader slug={slug} videos={videos} onChange={setVideos} />
        </div>

        {/* ── 4. Localisation ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <MapPin size={17} color="var(--accent, #C75B00)" />
              Localisation
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Ville *</label>
              <select
                value={form.ville}
                onChange={e => setForm({ ...form, ville: e.target.value })}
                className="form-select"
              >
                <option value="Dakar">Dakar</option>
                <option value="Thiès">Thiès</option>
                <option value="Saly">Saly / Mbour</option>
                <option value="Saint-Louis">Saint-Louis</option>
                <option value="Ziguinchor">Ziguinchor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quartier</label>
              <input
                type="text"
                placeholder="Ex: Almadies, Ngor, Mermoz, Fann..."
                value={form.quartier}
                onChange={e => setForm({ ...form, quartier: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse / Rue</label>
            <input
              type="text"
              placeholder="Ex: Rue 10 angle Boulevard..."
              value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        {/* ── 5. Caractéristiques & Équipements ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Sliders size={17} color="var(--accent, #C75B00)" />
              Caractéristiques & Équipements
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Surface (m²)</label>
              <input
                type="number"
                placeholder="120"
                value={form.surface_m2}
                onChange={e => setForm({ ...form, surface_m2: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pièces</label>
              <input
                type="number"
                value={form.nb_pieces}
                onChange={e => setForm({ ...form, nb_pieces: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Chambres</label>
              <input
                type="number"
                value={form.nb_chambres}
                onChange={e => setForm({ ...form, nb_chambres: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <BienCommoditesSelector
            values={{
              meuble: form.meuble,
              climatisation: form.climatisation,
              gardien: form.gardien,
              parking: form.parking,
              ascenseur: form.ascenseur,
              piscine: form.piscine,
            }}
            onChange={handleCommoditeChange}
          />
        </div>

        {/* ── 6. Description ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <FileText size={17} color="var(--accent, #C75B00)" />
              Description & Prestations
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              rows={3}
              placeholder="Décrivez les atouts majeurs, proximité des écoles/commerces, finitions..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="form-textarea"
            />
          </div>
        </div>

        {/* ── 7. Boutons d'Action ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 16 }}>
          <Link
            href={`/agence/${slug}/biens`}
            style={{
              padding: '12px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13.5,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 46,
            }}
          >
            Annuler
          </Link>

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
            {saving ? 'Enregistrement…' : 'Enregistrer le bien'}
          </button>
        </div>
      </form>
    </div>
  )
}
