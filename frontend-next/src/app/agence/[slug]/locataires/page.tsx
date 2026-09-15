'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  UserCheck,
  Plus,
  Phone,
  MessageCircle,
  Home,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react'

interface LocataireItem {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  profession?: string
  bail_id?: string
  bien_titre?: string
  bien_quartier?: string
  bien_ville?: string
  loyer_mensuel?: number
  jour_echeance?: number
  date_debut?: string
  statut_paiement?: string
  nb_impayes?: number
}

interface BienOption {
  id: string
  titre: string
  prix_location?: number
  statut_occupation: string
}

export default function LocatairesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [locataires, setLocataires] = useState<LocataireItem[]>([])
  const [biensDispo, setBiensDispo] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    profession: '',
    bien_id: '',
    loyer_mensuel: '',
    charges: '0',
    depot_garantie: '',
    date_debut: new Date().toISOString().split('T')[0],
    duree_mois: '12',
    jour_echeance: '5',
  })

  async function chargerLocataires() {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm-immo/agence/${slug}/contacts?type_contact=locataire`)
      const data = await res.json()
      if (data.success) {
        setLocataires(data.contacts || [])
      }
    } catch (err) {
      console.error('[LOAD_LOCATAIRES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  async function chargerBiens() {
    try {
      const res = await fetch(`/api/biens/agence/${slug}?statut=actif`)
      const data = await res.json()
      if (data.success) {
        setBiensDispo(data.biens || [])
      }
    } catch (err) {
      console.error('[LOAD_BIENS_ERR]', err)
    }
  }

  useEffect(() => {
    if (slug) {
      chargerLocataires()
      chargerBiens()
    }
  }, [slug])

  async function handleCreerLocataire(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) return

    try {
      setSaving(true)
      // 1. Créer le contact locataire
      const resContact = await fetch(`/api/crm-immo/agence/${slug}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom,
          telephone: form.telephone,
          whatsapp: form.whatsapp || form.telephone,
          email: form.email,
          profession: form.profession,
          type_contact: 'locataire',
          statut_crm: 'gagne',
        }),
      })
      const dataContact = await resContact.json()

      // 2. Si un bien est sélectionné, créer le bail directement
      if (dataContact.success && form.bien_id && form.loyer_mensuel) {
        await fetch(`/api/locatif-immo/agence/${slug}/baux`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bien_id: form.bien_id,
            locataire_id: dataContact.contact.id,
            date_debut: form.date_debut,
            duree_mois: parseInt(form.duree_mois, 10) || 12,
            loyer_mensuel: parseFloat(form.loyer_mensuel),
            charges: parseFloat(form.charges) || 0,
            depot_garantie: parseFloat(form.depot_garantie) || 0,
            jour_echeance: parseInt(form.jour_echeance, 10) || 5,
          }),
        })
      }

      setToastMsg('Locataire enregistré avec succès !')
      setShowModal(false)
      setForm({
        nom: '',
        prenom: '',
        telephone: '',
        whatsapp: '',
        email: '',
        profession: '',
        bien_id: '',
        loyer_mensuel: '',
        charges: '0',
        depot_garantie: '',
        date_debut: new Date().toISOString().split('T')[0],
        duree_mois: '12',
        jour_echeance: '5',
      })
      chargerLocataires()
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err) {
      console.error('[CREATE_LOCATAIRE_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  const locatairesFiltres = locataires.filter(l => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      l.nom.toLowerCase().includes(q) ||
      (l.prenom && l.prenom.toLowerCase().includes(q)) ||
      (l.telephone && l.telephone.includes(q))
    )
  })

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Gestion des Locataires</h1>
          <p className="agence-subtitle">Répertoire des locataires sous contrat, suivi des baux et contacts directs.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Nouveau locataire
        </button>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Recherche ── */}
      <div className="agence-card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ padding: '8px 12px' }}
          />
        </div>
      </div>

      {/* ── Liste des Locataires ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des locataires...</p>
        </div>
      ) : locatairesFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun locataire enregistré</p>
          <p style={{ fontSize: 13.5 }}>Ajoutez votre premier locataire pour démarrer le suivi des loyers et quittances.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {locatairesFiltres.map(loc => (
            <div key={loc.id} className="agence-card" style={{ padding: 20, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>
                      {loc.nom} {loc.prenom || ''}
                    </div>
                    {loc.profession && (
                      <span style={{ fontSize: 12, color: '#64748B' }}>{loc.profession}</span>
                    )}
                  </div>
                  <span className="status-badge actif">Locataire Actif</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#475569', marginBottom: 16 }}>
                  {loc.telephone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} />
                      <a href={`tel:${loc.telephone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {loc.telephone}
                      </a>
                    </div>
                  )}
                  {loc.whatsapp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageCircle size={13} color="#16a34a" />
                      <a
                        href={`https://wa.me/${loc.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
                      >
                        WhatsApp Direct
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action WhatsApp */}
              <a
                href={`https://wa.me/${(loc.whatsapp || loc.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Bonjour ${loc.nom}, ceci est un message de votre agence immobilière concernant votre bail locatif.`
                )}`}
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px',
                  borderRadius: 6,
                  background: 'rgba(22, 163, 74, 0.08)',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: 12.5,
                  textDecoration: 'none',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                }}
              >
                <MessageCircle size={14} />
                Écrire sur WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ── Modale Nouveau Locataire & Bail ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Enregistrer un nouveau locataire
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerLocataire}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nom du locataire *</label>
                  <input
                    type="text"
                    required
                    placeholder="Diallo"
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    placeholder="Amadou"
                    value={form.prenom}
                    onChange={e => setForm({ ...form, prenom: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value, whatsapp: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Profession</label>
                  <input
                    type="text"
                    placeholder="Cadre, Enseignant..."
                    value={form.profession}
                    onChange={e => setForm({ ...form, profession: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 14, marginTop: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 10 }}>
                  Rattachement à un bien & Bail (Optionnel)
                </div>

                <div className="form-group">
                  <label className="form-label">Bien loué</label>
                  <select
                    value={form.bien_id}
                    onChange={e => {
                      const bId = e.target.value
                      const selected = biensDispo.find(b => b.id === bId)
                      setForm({
                        ...form,
                        bien_id: bId,
                        loyer_mensuel: selected?.prix_location ? String(selected.prix_location) : form.loyer_mensuel,
                      })
                    }}
                    className="form-select"
                  >
                    <option value="">Sélectionner un bien du portefeuille</option>
                    {biensDispo.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.titre} ({b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} F` : 'Prix libre'})
                      </option>
                    ))}
                  </select>
                </div>

                {form.bien_id && (
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Loyer mensuel (FCFA)</label>
                      <input
                        type="number"
                        value={form.loyer_mensuel}
                        onChange={e => setForm({ ...form, loyer_mensuel: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Jour d'échéance du mois</label>
                      <input
                        type="number"
                        value={form.jour_echeance}
                        onChange={e => setForm({ ...form, jour_echeance: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
