'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { type AdminPlaceItem } from './AdminPlacesTab'

interface AdminPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  placeEnEdition: AdminPlaceItem | null
  categories: Array<{ id: string; label: string }>
  onSucces: (msg: string) => void
}

export default function AdminPlaceModal({
  isOpen,
  onClose,
  placeEnEdition,
  categories,
  onSucces,
}: AdminPlaceModalProps) {
  const [formNom, setFormNom] = useState('')
  const [formCategorie, setFormCategorie] = useState('restaurant')
  const [formQuartier, setFormQuartier] = useState('Plateau')
  const [formAdresse, setFormAdresse] = useState('')
  const [formBudget, setFormBudget] = useState('5000')
  const [formSpecialite, setFormSpecialite] = useState('')
  const [formResumeHonnete, setFormResumeHonnete] = useState('')
  const [formTel, setFormTel] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [formActif, setFormActif] = useState(true)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (placeEnEdition) {
      setFormNom(placeEnEdition.nom)
      setFormCategorie(placeEnEdition.categorie)
      setFormQuartier(placeEnEdition.quartier)
      setFormAdresse(placeEnEdition.adresse || '')
      setFormBudget(String(placeEnEdition.budget_moyen_xof || 5000))
      setFormSpecialite(placeEnEdition.specialite || '')
      setFormResumeHonnete(placeEnEdition.resume_honnete || '')
      setFormTel(placeEnEdition.contact_tel || '')
      setFormWhatsapp(placeEnEdition.contact_whatsapp || '')
      setFormActif(placeEnEdition.actif)
    } else {
      setFormNom('')
      setFormCategorie('restaurant')
      setFormQuartier('Plateau')
      setFormAdresse('')
      setFormBudget('5000')
      setFormSpecialite('')
      setFormResumeHonnete('')
      setFormTel('')
      setFormWhatsapp('')
      setFormActif(true)
    }
    setErreur(null)
  }, [placeEnEdition, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur(null)

    const payload = {
      nom: formNom,
      categorie: formCategorie,
      quartier: formQuartier,
      adresse: formAdresse || formQuartier,
      budget_moyen_xof: parseInt(formBudget) || 5000,
      specialite: formSpecialite,
      resume_honnete: formResumeHonnete,
      contact_tel: formTel,
      contact_whatsapp: formWhatsapp,
      actif: formActif,
    }

    try {
      const url = placeEnEdition ? `/api/admin/surga/places/${placeEnEdition.id}` : '/api/admin/surga/places'
      const method = placeEnEdition ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        onClose()
        onSucces(placeEnEdition ? 'Adresse mise à jour avec succès' : 'Nouvelle adresse ajoutée avec succès')
      } else {
        setErreur(data.error || 'Erreur lors de l enregistrement')
      }
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            {placeEnEdition ? 'Modifier l adresse' : 'Ajouter une bonne adresse à Dakar'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3, #73675E)' }}
          >
            <X size={18} />
          </button>
        </div>

        {erreur && (
          <div style={{ margin: '12px 20px 0 20px', padding: '8px 12px', borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontSize: 12 }}>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
              Nom de l établissement *
            </label>
            <input
              type="text"
              required
              value={formNom}
              onChange={(e) => setFormNom(e.target.value)}
              placeholder="Ex: Dibiterie Chez Haïssam"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Catégorie *
              </label>
              <select
                value={formCategorie}
                onChange={(e) => setFormCategorie(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Quartier *
              </label>
              <input
                type="text"
                required
                value={formQuartier}
                onChange={(e) => setFormQuartier(e.target.value)}
                placeholder="Ex: Ouakam, Almadies, Plateau"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Budget Moyen (FCFA)
              </label>
              <input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Contact WhatsApp
              </label>
              <input
                type="text"
                value={formWhatsapp}
                onChange={(e) => setFormWhatsapp(e.target.value)}
                placeholder="Ex: 221775123456"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
              Spécialité incontournable *
            </label>
            <input
              type="text"
              required
              value={formSpecialite}
              onChange={(e) => setFormSpecialite(e.target.value)}
              placeholder="Ex: Dibi d agneau braisé au feu de bois avec oignons moutardés"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
              Résumé honnête d avis clients (3 lignes max) *
            </label>
            <textarea
              required
              rows={3}
              value={formResumeHonnete}
              onChange={(e) => setFormResumeHonnete(e.target.value)}
              placeholder="Synthèse honnête des retours : points forts, spécialités et petits bémols constructifs..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="formActif"
              checked={formActif}
              onChange={(e) => setFormActif(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="formActif" style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
              Visible sur l application Surga
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={envoiEnCours}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
