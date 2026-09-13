'use client'

import React from 'react'
import { ShieldCheck, Trash2, Plus, Save } from 'lucide-react'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  outline: 'none',
  background: '#ffffff',
  color: '#0f172a',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const helpText: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginTop: 4,
  lineHeight: 1.4,
}

export interface MotifRemise {
  id: string
  nom: string
  pct: number
}

interface RemisesPosTabProps {
  formAction: (payload: FormData) => void
  fideliteActif: boolean
  fideliteType: string
  fideliteTaux: number
  fideliteTamponsMax: number
  fideliteSeuilTampon: number
  remiseMaxCaissier: number
  setRemiseMaxCaissier: (val: number) => void
  motifs: MotifRemise[]
  handleSupprimerMotif: (id: string) => void
  nouveauMotifNom: string
  setNouveauMotifNom: (val: string) => void
  nouveauMotifPct: number
  setNouveauMotifPct: (val: number) => void
  handleAjouterMotif: () => void
}

export default function RemisesPosTab({
  formAction,
  fideliteActif,
  fideliteType,
  fideliteTaux,
  fideliteTamponsMax,
  fideliteSeuilTampon,
  remiseMaxCaissier,
  setRemiseMaxCaissier,
  motifs,
  handleSupprimerMotif,
  nouveauMotifNom,
  setNouveauMotifNom,
  nouveauMotifPct,
  setNouveauMotifPct,
  handleAjouterMotif,
}: RemisesPosTabProps) {
  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Champs masqués pour préserver la fidélité */}
      <input type="hidden" name="fidelite_actif" value={fideliteActif ? 'true' : 'false'} />
      <input type="hidden" name="fidelite_type" value={fideliteType} />
      <input type="hidden" name="fidelite_taux_cashback" value={fideliteTaux} />
      <input type="hidden" name="fidelite_tampons_max" value={fideliteTamponsMax} />
      <input type="hidden" name="fidelite_seuil_tampon" value={fideliteSeuilTampon} />
      <input type="hidden" name="pos_remise_motifs" value={JSON.stringify(motifs)} />

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <ShieldCheck size={22} style={{ color: 'var(--accent, #C75B00)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Plafonds &amp; Sécurité des Remises en Caisse (Standard Supermarché)
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Protégez vos marges en limitant le pouvoir de remise accordé aux caissiers sans accord du responsable.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 360, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <label style={labelStyle}>Remise Maximale Autorisée par le Caissier (%)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              name="pos_remise_max_caissier"
              min="0"
              max="100"
              value={remiseMaxCaissier}
              onChange={e => setRemiseMaxCaissier(Number(e.target.value))}
              style={{ ...inputStyle, width: 140, fontWeight: 700 }}
            />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>%</span>
          </div>
          <p style={helpText}>
            Toute remise supérieure à ce pourcentage exigera l&apos;approbation du superviseur (code PIN ou rôle admin).
          </p>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            Motifs de Remises Rapides Prédéfinis
          </h4>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b' }}>
            Ces raccourcis apparaissent sur le clavier de la caisse POS pour justifier immédiatement les rabais accordés.
          </p>

          {/* Liste des motifs existants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {motifs.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{m.nom}</span>
                  <span style={{ fontSize: 11.5, background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                    -{m.pct}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSupprimerMotif(m.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                  title="Supprimer ce motif"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Ajouter un motif */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: '#f1f5f9', padding: 12, borderRadius: 10 }}>
            <input
              type="text"
              placeholder="Nom du motif (ex: Client VIP, Boîte abîmée...)"
              value={nouveauMotifNom}
              onChange={e => setNouveauMotifNom(e.target.value)}
              style={{ ...inputStyle, flex: 2, minWidth: 200 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 100 }}>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="%"
                value={nouveauMotifPct}
                onChange={e => setNouveauMotifPct(Number(e.target.value))}
                style={{ ...inputStyle, textAlign: 'center', fontWeight: 700 }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>%</span>
            </div>
            <button
              type="button"
              onClick={handleAjouterMotif}
              className="npl-btn npl-btn-secondary npl-btn-sm"
              style={{ padding: '0 16px', fontWeight: 800, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={15} /> Ajouter
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          className="npl-btn npl-btn-brand npl-btn-md"
          style={{ padding: '10px 24px', fontWeight: 800, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Save size={16} />
          <span>Enregistrer les règles de caisse</span>
        </button>
      </div>
    </form>
  )
}
