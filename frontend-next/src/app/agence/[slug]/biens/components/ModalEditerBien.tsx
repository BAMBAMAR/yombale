'use client'

import React, { useState } from 'react'
import { X, Home, Building2, MapPin, DollarSign, Layers } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface BienToEdit {
  id: string
  reference?: string
  titre: string
  type_bien: string
  sous_type?: string
  ville: string
  quartier?: string
  adresse?: string
  surface_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  nb_sdb?: number
  etage?: number
  statut_occupation: string
  prix_location?: number
  prix_vente?: number
  charges?: number
  depot_garantie?: number
  meuble?: boolean
  ascenseur?: boolean
  parking?: boolean
  gardien?: boolean
  piscine?: boolean
  terrasse?: boolean
  balcon?: boolean
  climatisation?: boolean
  description?: string
  notes_internes?: string
}

interface ModalEditerBienProps {
  slug: string
  bien: BienToEdit
  onClose: () => void
  onSuccess: (updated: any) => void
}

const COMMODITES = [
  { key: 'meuble', label: 'Meublé' },
  { key: 'climatisation', label: 'Climatisation' },
  { key: 'parking', label: 'Parking' },
  { key: 'gardien', label: 'Gardien 24/7' },
  { key: 'ascenseur', label: 'Ascenseur' },
  { key: 'piscine', label: 'Piscine' },
  { key: 'balcon', label: 'Balcon' },
  { key: 'terrasse', label: 'Terrasse' },
]

export default function ModalEditerBien({ slug, bien, onClose, onSuccess }: ModalEditerBienProps) {
  const isInitialLocation = Boolean(bien.prix_location)
  const [transactionType, setTransactionType] = useState<'location' | 'vente'>(isInitialLocation ? 'location' : 'vente')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    titre: bien.titre || '',
    type_bien: bien.type_bien || 'appartement',
    ville: bien.ville || 'Dakar',
    quartier: bien.quartier || '',
    adresse: bien.adresse || '',
    prix_location: bien.prix_location ? String(bien.prix_location) : '',
    prix_vente: bien.prix_vente ? String(bien.prix_vente) : '',
    charges: bien.charges ? String(bien.charges) : '0',
    depot_garantie: bien.depot_garantie ? String(bien.depot_garantie) : '',
    surface_m2: bien.surface_m2 ? String(bien.surface_m2) : '',
    nb_pieces: bien.nb_pieces ? String(bien.nb_pieces) : '1',
    nb_chambres: bien.nb_chambres ? String(bien.nb_chambres) : '1',
    nb_sdb: bien.nb_sdb ? String(bien.nb_sdb) : '1',
    etage: bien.etage !== undefined && bien.etage !== null ? String(bien.etage) : '',
    statut_occupation: bien.statut_occupation || 'disponible',
    meuble: Boolean(bien.meuble),
    ascenseur: Boolean(bien.ascenseur),
    parking: Boolean(bien.parking),
    gardien: Boolean(bien.gardien),
    piscine: Boolean(bien.piscine),
    terrasse: Boolean(bien.terrasse),
    balcon: Boolean(bien.balcon),
    climatisation: Boolean(bien.climatisation),
    description: bien.description || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre.trim()) {
      setErrorMsg('Le titre du bien est obligatoire.')
      return
    }

    try {
      setSaving(true)
      setErrorMsg(null)

      const payload = {
        titre: form.titre.trim(),
        type_bien: form.type_bien,
        ville: form.ville.trim(),
        quartier: form.quartier.trim() || null,
        adresse: form.adresse.trim() || null,
        prix_location: transactionType === 'location' ? (parseFloat(form.prix_location) || null) : null,
        prix_vente: transactionType === 'vente' ? (parseFloat(form.prix_vente) || null) : null,
        charges: transactionType === 'location' ? (parseFloat(form.charges) || 0) : 0,
        depot_garantie: transactionType === 'location' ? (parseFloat(form.depot_garantie) || 0) : 0,
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
        piscine: form.piscine,
        terrasse: form.terrasse,
        balcon: form.balcon,
        climatisation: form.climatisation,
        description: form.description.trim() || null,
      }

      const res = await fetch(`/api/biens/agence/${slug}/${bien.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.bien)
      } else {
        setErrorMsg(data.error || 'Erreur lors de la modification du bien')
      }
    } catch (err: any) {
      setErrorMsg('Erreur de connexion lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28, 43, 74, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 14, maxWidth: 680, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid var(--border, #E8DDD2)' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border, #E8DDD2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>Modifier le bien immobilier</h2>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Réf : {bien.reference || bien.id.slice(0, 8)} • Mises à jour propagées au site</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>{errorMsg}</div>
          )}

          {/* Type d'opération */}
          <div style={{ display: 'flex', gap: 10, background: '#FAF8F5', padding: 6, borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
            {(['location', 'vente'] as const).map(type => (
              <button key={type} type="button" onClick={() => setTransactionType(type)} style={{ flex: 1, padding: '8px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: transactionType === type ? 'var(--navy, #1C2B4A)' : 'transparent', color: transactionType === type ? '#FFFFFF' : 'var(--navy, #1C2B4A)' }}>
                {type === 'location' ? 'Location' : 'Vente directe'}
              </button>
            ))}
          </div>

          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Titre du bien *</label>
              <input type="text" required value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Type de bien</label>
              <select value={form.type_bien} onChange={e => setForm({ ...form, type_bien: e.target.value })} className="form-select">
                <option value="appartement">Appartement</option>
                <option value="villa">Villa / Maison</option>
                <option value="studio">Studio / Chambre</option>
                <option value="bureau">Bureau / Local commercial</option>
                <option value="terrain">Terrain</option>
                <option value="immeuble">Immeuble</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ville *</label>
              <input type="text" required value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} className="form-input" />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Quartier</label>
              <input type="text" value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} className="form-input" placeholder="ex: Almadies, Mermoz..." />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse précise</label>
              <input type="text" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="form-input" placeholder="Rue, N° porte..." />
            </div>
          </div>

          {/* Prix & Conditions financières */}
          <div style={{ background: '#F8F5F0', padding: 14, borderRadius: 10, border: '1px solid var(--border, #E8DDD2)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 10 }}>Conditions Financières</div>
            {transactionType === 'location' ? (
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Loyer mensuel (FCFA) *</label>
                  <input type="number" required value={form.prix_location} onChange={e => setForm({ ...form, prix_location: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Charges (FCFA)</label>
                  <input type="number" value={form.charges} onChange={e => setForm({ ...form, charges: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dépôt garantie (FCFA)</label>
                  <input type="number" value={form.depot_garantie} onChange={e => setForm({ ...form, depot_garantie: e.target.value })} className="form-input" />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Prix de vente (FCFA) *</label>
                <input type="number" required value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: e.target.value })} className="form-input" />
              </div>
            )}
          </div>

          {/* Caractéristiques */}
          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">Surface (m²)</label>
              <input type="number" value={form.surface_m2} onChange={e => setForm({ ...form, surface_m2: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Pièces</label>
              <input type="number" value={form.nb_pieces} onChange={e => setForm({ ...form, nb_pieces: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Chambres</label>
              <input type="number" value={form.nb_chambres} onChange={e => setForm({ ...form, nb_chambres: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Étage</label>
              <input type="number" value={form.etage} onChange={e => setForm({ ...form, etage: e.target.value })} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Statut d'occupation</label>
            <select value={form.statut_occupation} onChange={e => setForm({ ...form, statut_occupation: e.target.value })} className="form-select">
              <option value="disponible">Disponible immédiatement</option>
              <option value="loue">Loué (Bail actif)</option>
              <option value="sous_compromis">Sous compromis</option>
              <option value="vendu">Vendu</option>
              <option value="travaux">En rénovation / travaux</option>
            </select>
          </div>

          {/* Commodités & Équipements */}
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Commodités & Équipements</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {COMMODITES.map(c => (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: (form as any)[c.key] ? 'rgba(10, 92, 54, 0.08)' : '#FAF8F5', border: (form as any)[c.key] ? '1px solid #BBF7D0' : '1px solid var(--border, #E8DDD2)', color: (form as any)[c.key] ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)', fontWeight: (form as any)[c.key] ? 700 : 500 }}>
                  <input type="checkbox" checked={(form as any)[c.key]} onChange={e => setForm({ ...form, [c.key]: e.target.checked })} />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description commerciale</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-textarea" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, background: '#FAF8F5', border: '1px solid var(--border, #E8DDD2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--accent, #C75B00)', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
