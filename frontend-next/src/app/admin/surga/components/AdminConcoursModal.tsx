'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { type AdminConcoursItem } from './AdminConcoursTab'

interface AdminConcoursModalProps {
  isOpen: boolean
  onClose: () => void
  concoursEnEdition: AdminConcoursItem | null
  onSucces: (msg: string) => void
}

export default function AdminConcoursModal({
  isOpen,
  onClose,
  concoursEnEdition,
  onSucces,
}: AdminConcoursModalProps) {
  const [formTitre, setFormTitre] = useState('')
  const [formSigle, setFormSigle] = useState('')
  const [formOrganisme, setFormOrganisme] = useState('')
  const [formCategorie, setFormCategorie] = useState('fonction_publique')
  const [formNiveau, setFormNiveau] = useState('Baccalauréat')
  const [formAgeMax, setFormAgeMax] = useState('33')
  const [formFrais, setFormFrais] = useState('5000')
  const [formStatut, setFormStatut] = useState<'ouvert' | 'a_venir' | 'cloture'>('ouvert')
  const [formDateCloture, setFormDateCloture] = useState('')
  const [formDateEpreuves, setFormDateEpreuves] = useState('')
  const [formPieces, setFormPieces] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (concoursEnEdition) {
      setFormTitre(concoursEnEdition.titre)
      setFormSigle(concoursEnEdition.sigle || '')
      setFormOrganisme(concoursEnEdition.organisme)
      setFormCategorie(concoursEnEdition.categorie)
      setFormNiveau(concoursEnEdition.niveau_requis)
      setFormAgeMax(concoursEnEdition.age_max ? String(concoursEnEdition.age_max) : '')
      setFormFrais(String(concoursEnEdition.frais_dossier_xof || 5000))
      setFormStatut(concoursEnEdition.statut as any)
      setFormDateCloture(concoursEnEdition.date_cloture ? concoursEnEdition.date_cloture.slice(0, 10) : '')
      setFormDateEpreuves(concoursEnEdition.date_epreuves ? concoursEnEdition.date_epreuves.slice(0, 10) : '')
      setFormPieces(Array.isArray(concoursEnEdition.pieces_a_fournir) ? concoursEnEdition.pieces_a_fournir.join('\n') : '')
    } else {
      setFormTitre('')
      setFormSigle('')
      setFormOrganisme('')
      setFormCategorie('fonction_publique')
      setFormNiveau('Baccalauréat')
      setFormAgeMax('33')
      setFormFrais('5000')
      setFormStatut('ouvert')
      setFormDateCloture(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
      setFormDateEpreuves('')
      setFormPieces('Demande manuscrite timbrée\nExtrait de casier judiciaire (bulletin n°3)\nCertificat de nationalité sénégalaise\nCopie légalisée du diplôme')
    }
    setErreur(null)
  }, [concoursEnEdition, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur(null)

    const piecesArray = formPieces
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)

    const payload = {
      titre: formTitre,
      sigle: formSigle || null,
      organisme: formOrganisme,
      categorie: formCategorie,
      niveau_requis: formNiveau,
      age_max: formAgeMax ? parseInt(formAgeMax) : null,
      frais_dossier_xof: parseInt(formFrais) || 0,
      statut: formStatut,
      date_cloture: formDateCloture,
      date_epreuves: formDateEpreuves || null,
      pieces_a_fournir: piecesArray,
    }

    try {
      const url = concoursEnEdition ? `/api/admin/surga/concours/${concoursEnEdition.id}` : '/api/admin/surga/concours'
      const method = concoursEnEdition ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        onClose()
        onSucces(concoursEnEdition ? 'Concours mis à jour avec succès' : 'Nouveau concours publié avec succès')
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
          maxWidth: 560,
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
            {concoursEnEdition ? 'Modifier le concours' : 'Publier un concours national'}
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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Intitulé complet du concours *
              </label>
              <input
                type="text"
                required
                value={formTitre}
                onChange={(e) => setFormTitre(e.target.value)}
                placeholder="Ex: Concours Direct d Entrée à l ENA"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Sigle officiel
              </label>
              <input
                type="text"
                value={formSigle}
                onChange={(e) => setFormSigle(e.target.value)}
                placeholder="Ex: ENA, CREM"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Organisme / Ministère *
              </label>
              <input
                type="text"
                required
                value={formOrganisme}
                onChange={(e) => setFormOrganisme(e.target.value)}
                placeholder="Ex: Ministère de la Fonction Publique"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Niveau Requis
              </label>
              <input
                type="text"
                value={formNiveau}
                onChange={(e) => setFormNiveau(e.target.value)}
                placeholder="Ex: Licence, Master, Baccalauréat"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Date de clôture *
              </label>
              <input
                type="date"
                required
                value={formDateCloture}
                onChange={(e) => setFormDateCloture(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Frais de dossier (FCFA)
              </label>
              <input
                type="number"
                value={formFrais}
                onChange={(e) => setFormFrais(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
                Statut *
              </label>
              <select
                value={formStatut}
                onChange={(e) => setFormStatut(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
              >
                <option value="ouvert">Ouvert</option>
                <option value="a_venir">À venir</option>
                <option value="cloture">Clôturé</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
              Pièces administratives à fournir (1 par ligne)
            </label>
            <textarea
              rows={4}
              value={formPieces}
              onChange={(e) => setFormPieces(e.target.value)}
              placeholder="Extrait de casier judiciaire&#10;Certificat de nationalité sénégalaise&#10;Copie légalisée du diplôme"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
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
                backgroundColor: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {envoiEnCours ? 'Publication...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
