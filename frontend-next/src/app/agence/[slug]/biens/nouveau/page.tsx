'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Home, ArrowLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export default function NouveauBienPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [operationType, setOperationType] = useState<'location' | 'vente'>('location')

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
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      {/* ── En-tête ── */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/agence/${slug}/biens`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#64748B',
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={16} />
          Retour au portefeuille
        </Link>
        <h1 className="agence-title">Ajouter un bien immobilier</h1>
        <p className="agence-subtitle">Remplissez les détails du bien pour l'intégrer à votre gestion d'agence.</p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Type d'opération & Titre ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Home size={18} />
              Informations Principales
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type d'opération *</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setOperationType('location')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: operationType === 'location' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                  background: operationType === 'location' ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
                  color: operationType === 'location' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                }}
              >
                Location (Loyer mensuel)
              </button>
              <button
                type="button"
                onClick={() => setOperationType('vente')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: operationType === 'vente' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                  background: operationType === 'vente' ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
                  color: operationType === 'vente' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                }}
              >
                Vente (Prix d'achat)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Titre du bien *</label>
            <input
              type="text"
              required
              placeholder="Ex: Superbe Appartement F4 Vue Mer - Almadies"
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-grid-2">
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

        {/* ── Localisation ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">Localisation</div>
          </div>

          <div className="form-grid-3">
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
        </div>

        {/* ── Caractéristiques & Équipements ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">Caractéristiques & Équipements</div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Surface (m²)</label>
              <input
                type="number"
                placeholder="Ex: 120"
                value={form.surface_m2}
                onChange={e => setForm({ ...form, surface_m2: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre de pièces</label>
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

          {/* Checkboxes équipements */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            {[
              { key: 'meuble', label: 'Meublé' },
              { key: 'climatisation', label: 'Climatisé' },
              { key: 'gardien', label: 'Gardiennage' },
              { key: 'parking', label: 'Parking' },
              { key: 'ascenseur', label: 'Ascenseur' },
              { key: 'piscine', label: 'Piscine' },
            ].map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={(form as any)[item.key]}
                  onChange={e => setForm({ ...form, [item.key]: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent, #C75B00)' }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Boutons d'Action ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
          <Link
            href={`/agence/${slug}/biens`}
            style={{
              padding: '11px 20px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '11px 24px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer le bien'}
          </button>
        </div>
      </form>
    </div>
  )
}
