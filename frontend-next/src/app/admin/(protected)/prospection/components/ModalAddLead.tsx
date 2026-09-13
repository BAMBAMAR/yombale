import React from 'react'
import { X } from 'lucide-react'
import type { AddLeadFormState } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  addForm: AddLeadFormState
  setAddForm: React.Dispatch<React.SetStateAction<AddLeadFormState>>
  onAddSingle: (e: React.FormEvent) => Promise<void>
}

export default function ModalAddLead({
  isOpen,
  onClose,
  addForm,
  setAddForm,
  onAddSingle,
}: Props) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px', maxWidth: 500, width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
            Ajouter un Nouveau Prospect
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onAddSingle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
              Nom de la boutique *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Dakar Fashion Store"
              value={addForm.nom_boutique}
              onChange={(e) => setAddForm({ ...addForm, nom_boutique: e.target.value })}
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
                placeholder="Ex: 77 123 45 67"
                value={addForm.telephone}
                onChange={(e) => setAddForm({ ...addForm, telephone: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Contact Responsable
              </label>
              <input
                type="text"
                placeholder="Ex: Modou Fall"
                value={addForm.contact_nom}
                onChange={(e) => setAddForm({ ...addForm, contact_nom: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Catégorie
              </label>
              <select
                value={addForm.categorie}
                onChange={(e) => setAddForm({ ...addForm, categorie: e.target.value })}
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
                Quartier / Marché
              </label>
              <input
                type="text"
                placeholder="Ex: Sandaga / HLM"
                value={addForm.quartier}
                onChange={(e) => setAddForm({ ...addForm, quartier: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ padding: '10px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
