'use client'

import React from 'react'
import { Image as ImageIcon, Link as LinkIcon, Calendar } from 'lucide-react'

export interface PublicationFormData {
  message: string
  lien: string
  image_url: string
  publier_instagram: boolean
  date_publication: string
}

interface PublicationFormProps {
  form: PublicationFormData
  setForm: React.Dispatch<React.SetStateAction<PublicationFormData>>
  editId: string | null
  isPending: boolean
  err: string
  ok: string
  onSubmit: () => void
  onCancel: () => void
}

export function PublicationForm({
  form,
  setForm,
  editId,
  isPending,
  err,
  ok,
  onSubmit,
  onCancel,
}: PublicationFormProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        border: editId ? '2px solid #c75b00' : '1px solid #e2e8f0',
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1c2b4a', margin: '0 0 14px' }}>
        {editId ? 'Modifier la publication' : 'Créer une nouvelle publication'}
      </h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
          Message de la publication *
        </label>
        <textarea
          rows={5}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Rédigez votre publication avec vos hashtags (#Nopalou #Sénégal #Dakar #BonPlan)..."
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <ImageIcon size={13} /> URL de l&apos;image (obligatoire pour Instagram)
          </label>
          <input
            type="text"
            value={form.image_url}
            onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            placeholder="https://res.cloudinary.com/..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 13 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <LinkIcon size={13} /> Lien de redirection (optionnel)
          </label>
          <input
            type="text"
            value={form.lien}
            onChange={e => setForm(f => ({ ...f, lien: e.target.value }))}
            placeholder="https://nopalou.com/..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <Calendar size={13} /> Date de publication programmée (optionnel)
        </label>
        <input
          type="datetime-local"
          value={form.date_publication}
          onChange={e => setForm(f => ({ ...f, date_publication: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 13 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input
          type="checkbox"
          id="ig_check"
          checked={form.publier_instagram}
          disabled={!form.image_url}
          onChange={e => setForm(f => ({ ...f, publier_instagram: e.target.checked }))}
          style={{ width: 16, height: 16, cursor: form.image_url ? 'pointer' : 'not-allowed' }}
        />
        <label
          htmlFor="ig_check"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: form.image_url ? '#1c2b4a' : '#94a3b8',
            cursor: form.image_url ? 'pointer' : 'not-allowed',
          }}
        >
          Publier simultanément sur le compte Instagram lié (nécessite une image)
        </label>
      </div>

      {err && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      {ok && <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 10 }}>{ok}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !form.message.trim()}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: 'none',
            background: '#c75b00',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Créer le brouillon'}
        </button>
        {editId && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}
