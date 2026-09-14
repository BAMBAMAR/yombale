import React from 'react'
import { Pencil, X } from 'lucide-react'
import type { EditLeadFormState } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  editForm: EditLeadFormState
  setEditForm: React.Dispatch<React.SetStateAction<EditLeadFormState>>
  isSavingEdit: boolean
  onSaveEdit: (e: React.FormEvent) => Promise<void>
}

export default function ModalEditLead({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  isSavingEdit,
  onSaveEdit,
}: Props) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 560, width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pencil size={20} color="#2563EB" /> Modifier le Prospect en Base
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
              Nom de la boutique *
            </label>
            <input
              type="text"
              required
              value={editForm.nom_boutique}
              onChange={(e) => setEditForm({ ...editForm, nom_boutique: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Numéro WhatsApp / Tel *
              </label>
              <input
                type="text"
                required
                value={editForm.telephone}
                onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Contact Responsable
              </label>
              <input
                type="text"
                value={editForm.contact_nom}
                onChange={(e) => setEditForm({ ...editForm, contact_nom: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Statut CRM
              </label>
              <select
                value={editForm.statut}
                onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              >
                <option value="nouveau">Nouveau</option>
                <option value="contacte_wa">Contacté WhatsApp</option>
                <option value="contacte_email">Contacté Email</option>
                <option value="en_discussion">En discussion</option>
                <option value="converti">Converti (Boutique Active)</option>
                <option value="desinscrit">Désinscrit / Refus</option>
                <option value="invalide">Invalide / Emploi (Hors Cible)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Catégorie
              </label>
              <select
                value={editForm.categorie}
                onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value="mode">Mode &amp; Habits</option>
                <option value="tech">Téléphonie &amp; Tech</option>
                <option value="superette">Alimentation</option>
                <option value="quincaillerie">Quincaillerie</option>
                <option value="cosmetique">Cosmétique</option>
                <option value="grossiste">Grossiste Chine</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Ville
              </label>
              <input
                type="text"
                value={editForm.ville}
                onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Quartier / Marché
              </label>
              <input
                type="text"
                value={editForm.quartier}
                onChange={(e) => setEditForm({ ...editForm, quartier: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
              Notes CRM internes
            </label>
            <textarea
              rows={3}
              placeholder="Notes de prospection, rappels, détails boutique..."
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              style={{
                padding: '10px 18px', background: '#2563EB', color: '#fff', border: 'none',
                borderRadius: 8, fontWeight: 800, cursor: isSavingEdit ? 'not-allowed' : 'pointer',
              }}
            >
              {isSavingEdit ? 'Sauvegarde...' : 'Mettre à jour en Base'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
