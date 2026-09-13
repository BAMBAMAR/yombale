'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import ExternalImg from '@/components/ExternalImg'
import { createBoutique, updateBoutique } from '../actions'
import type { ActionState } from '@/lib/backend-fetch'
import { CATEGORIES } from '@/lib/categories'
import type { Boutique } from '../types'
import { Download, Save } from 'lucide-react'

const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  background: '#fff',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600 as const,
  color: '#374151',
  display: 'block' as const,
  marginBottom: 4,
}

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      style={{
        padding: '10px 24px',
        background: pending ? '#94a3b8' : '#1d4ed8',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        cursor: pending ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Save size={16} />
      <span>{pending ? 'En cours…' : label}</span>
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        margin: '4px 0 0',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: 8,
      }}
    >
      {children}
    </p>
  )
}

export default function BoutiqueForm({
  boutique,
  onCancel,
  onSuccess,
  codeApporteurDefaut,
}: {
  boutique?: Boutique
  onCancel: () => void
  onSuccess: () => void
  codeApporteurDefaut?: string
}) {
  const action = boutique ? updateBoutique.bind(null, boutique.id) : createBoutique
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})
  const [modeSelect, setModeSelect] = useState<'hybride_pos' | 'pure_player'>(
    boutique?.mode_fonctionnement || 'hybride_pos'
  )
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const formTopRef = useRef<HTMLDivElement>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSuccessMsg(
        boutique
          ? 'Paramètres de la boutique enregistrés avec succès !'
          : 'Boutique créée avec succès !'
      )
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onSuccess()
      const t = setTimeout(() => setSuccessMsg(null), 6000)
      return () => clearTimeout(t)
    } else if (state.error && handledRef.current !== state) {
      handledRef.current = state
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [state, boutique, onSuccess])

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 }}>
      <div ref={formTopRef} />
      <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 18, margin: 0 }}>
        {boutique ? 'Modifier la boutique' : 'Créer une boutique'}
      </h2>

      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#166534',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <span>{successMsg}</span>
        </div>
      )}

      {state.error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#dc2626',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {state.error}
        </div>
      )}

      <SectionTitle>Comment fonctionne votre boutique ?</SectionTitle>
      <input type="hidden" name="mode_fonctionnement" value={modeSelect} />
      <div>
        <label style={labelStyle}>Choisissez la configuration de votre tableau de bord</label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginTop: 6,
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              borderRadius: 8,
              border: '2px solid ' + (modeSelect === 'hybride_pos' ? '#16a34a' : '#e5e7eb'),
              background: modeSelect === 'hybride_pos' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              value="hybride_pos"
              checked={modeSelect === 'hybride_pos'}
              onChange={() => setModeSelect('hybride_pos')}
              style={{ display: 'none' }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: '#1C2B4A',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Magasin + Vente en ligne
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Vendez en boutique avec la caisse, gérez vos dettes clients et recevez aussi des commandes en ligne.
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              borderRadius: 8,
              border: '2px solid ' + (modeSelect === 'pure_player' ? '#C75B00' : '#e5e7eb'),
              background: modeSelect === 'pure_player' ? '#fff7ed' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              value="pure_player"
              checked={modeSelect === 'pure_player'}
              onChange={() => setModeSelect('pure_player')}
              style={{ display: 'none' }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: '#C75B00',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              100% Vente en ligne
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Votre boutique est uniquement en ligne. Vous recevez des commandes par le site et WhatsApp.
            </span>
          </label>
        </div>
      </div>

      <SectionTitle>Informations</SectionTitle>

      <div>
        <label style={labelStyle}>Nom de la boutique *</label>
        <input
          name="nom"
          required
          maxLength={200}
          defaultValue={boutique?.nom}
          style={inputStyle}
          placeholder="Ex: Tech Dakar"
        />
      </div>
      {!boutique && (
        <div>
          <label style={labelStyle}>Code apporteur (si recommandé par quelqu&apos;un)</label>
          <input
            name="code_apporteur"
            maxLength={20}
            defaultValue={codeApporteurDefaut}
            style={inputStyle}
            placeholder="Ex: A3F9K2"
          />
        </div>
      )}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={boutique?.description ?? ''}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Décrivez votre boutique…"
        />
      </div>
      <div>
        <label style={labelStyle}>Catégorie principale</label>
        <select name="categorie" defaultValue={boutique?.categorie ?? ''} style={inputStyle}>
          <option value="">— Sélectionner —</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
          Définit votre rayon principal dans l&apos;annuaire Nopalou et adapte automatiquement les attributs suggérés lors
          de l&apos;ajout de nouveaux produits.
        </p>
      </div>
      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Adresse</label>
          <input
            name="adresse"
            defaultValue={boutique?.adresse ?? ''}
            style={inputStyle}
            placeholder="Av. Cheikh Anta Diop"
          />
        </div>
        <div>
          <label style={labelStyle}>Ville</label>
          <input
            name="ville"
            defaultValue={boutique?.ville ?? 'Dakar'}
            style={inputStyle}
            placeholder="Dakar"
          />
        </div>
      </div>

      <SectionTitle>Contact</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Téléphone</label>
          <input
            name="telephone"
            type="tel"
            defaultValue={boutique?.telephone ?? ''}
            style={inputStyle}
            placeholder="77 000 00 00"
          />
        </div>
        <div>
          <label style={labelStyle}>WhatsApp</label>
          <input
            name="whatsapp"
            type="tel"
            defaultValue={boutique?.whatsapp ?? ''}
            style={inputStyle}
            placeholder="77 000 00 00"
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Site web</label>
        <input
          name="site_web"
          type="url"
          defaultValue={boutique?.site_web ?? ''}
          style={inputStyle}
          placeholder="https://votresite.com"
        />
      </div>
      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Page Facebook</label>
          <input
            name="facebook"
            type="url"
            defaultValue={boutique?.facebook ?? ''}
            style={inputStyle}
            placeholder="https://facebook.com/…"
          />
        </div>
        <div>
          <label style={labelStyle}>Instagram</label>
          <input
            name="instagram"
            type="url"
            defaultValue={boutique?.instagram ?? ''}
            style={inputStyle}
            placeholder="https://instagram.com/…"
          />
        </div>
      </div>
      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>TikTok</label>
          <input
            name="tiktok"
            type="url"
            defaultValue={(boutique as any)?.tiktok ?? ''}
            style={inputStyle}
            placeholder="https://www.tiktok.com/@maboutique"
          />
        </div>
        <div>
          <label style={labelStyle}>YouTube</label>
          <input
            name="youtube"
            type="url"
            defaultValue={(boutique as any)?.youtube ?? ''}
            style={inputStyle}
            placeholder="https://www.youtube.com/@machannel"
          />
        </div>
      </div>

      <SectionTitle>Publicité en ligne (optionnel)</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Meta Facebook Pixel ID</label>
          <input
            name="meta_pixel_id"
            defaultValue={boutique?.meta_pixel_id ?? ''}
            style={inputStyle}
            placeholder="Ex: 123456789012345"
          />
        </div>
        <div>
          <label style={labelStyle}>
            TikTok Pixel ID
            <span
              style={{
                fontSize: 10,
                background: '#fef3c7',
                color: '#92400e',
                padding: '2px 6px',
                borderRadius: 4,
                marginLeft: 6,
                fontWeight: 700,
              }}
            >
              Pixel Actif · Sync Catalogue Direct (Bientôt)
            </span>
          </label>
          <input
            name="tiktok_pixel_id"
            defaultValue={boutique?.tiktok_pixel_id ?? ''}
            style={inputStyle}
            placeholder="Ex: C1234567890ABC"
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Google Analytics GA4 ID</label>
        <input
          name="ga4_id"
          defaultValue={boutique?.ga4_id ?? ''}
          style={inputStyle}
          placeholder="Ex: G-XYZ1234567"
        />
      </div>

      <SectionTitle>Visibilité de votre boutique</SectionTitle>
      <div>
        <label style={labelStyle}>Visibilité publique de votre boutique</label>
        <select
          name="actif"
          defaultValue={boutique?.actif !== false ? 'true' : 'false'}
          style={inputStyle}
        >
          <option value="true">Active (Visible dans le catalogue public et la recherche Nopalou)</option>
          <option value="false">Désactivée (Masquée du catalogue public et hors-ligne pour les clients)</option>
        </select>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
          Une boutique désactivée ne sera plus visible par les visiteurs sur /boutiques mais reste totalement accessible pour votre gestion interne et votre caisse POS.
        </p>
      </div>

      <SectionTitle>Adresse web de votre boutique</SectionTitle>

      <div>
        <label style={labelStyle}>URL de votre boutique</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <span
            style={{
              padding: '10px 12px',
              background: '#f3f4f6',
              borderRight: '1px solid #d1d5db',
              fontSize: 13,
              color: '#6b7280',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            nopalou.com/boutiques/
          </span>
          <input
            name="slug"
            defaultValue={boutique?.slug ?? ''}
            style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }}
            placeholder="mon-nom-de-boutique"
            maxLength={80}
            onChange={(e) => {
              e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
          Lettres minuscules, chiffres et tirets uniquement. Laissez vide pour générer automatiquement depuis le nom.
        </p>
      </div>

      <SectionTitle>Photos</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Logo (max 5 Mo)</label>
          <input name="logo" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.logo_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <ExternalImg
                src={boutique.logo_url}
                alt="Logo"
                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
              />
              <span style={{ fontSize: 11, color: '#6b7280' }}>Logo actuel</span>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Photo de couverture (max 5 Mo)</label>
          <input name="cover" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.cover_url && (
            <div style={{ marginTop: 6, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <ExternalImg
                src={boutique.cover_url}
                alt="Couverture"
                style={{ width: '100%', height: 50, objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      <SectionTitle>Export & Portabilité des données</SectionTitle>
      <div
        style={{
          background: '#FFFDF9',
          border: '1.5px solid #FED7AA',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#9A3412' }}>
            Sauvegarder l&apos;intégralité de ma boutique
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#C2410C' }}>
            Téléchargez en 1 clic vos produits, clients, dettes, commandes et historique en fichier JSON sécurisé.
          </p>
        </div>
        <a
          href={`/api/boutiques/${boutique?.id}/export-complet`}
          download
          className="btn-npl btn-npl-secondary btn-npl-sm"
          style={{
            borderColor: '#FED7AA',
            color: '#9A3412',
            background: '#FFF7ED',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Download size={14} />
          <span>Exporter ma boutique (.JSON)</span>
        </a>
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 12,
          zIndex: 40,
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: 12,
          boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 20,
        }}
      >
        <SubmitButton label={boutique ? 'Enregistrer la boutique' : 'Créer la boutique'} />
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
