'use client'

import React from 'react'
import { Sparkles, Save } from 'lucide-react'
import { fcfa } from '@/lib/format'

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

interface FideliteTabProps {
  formAction: (payload: FormData) => void
  remiseMaxCaissier: number
  motifs: any[]
  fideliteActif: boolean
  setFideliteActif: (actif: boolean) => void
  fideliteType: 'cagnotte' | 'tampons'
  setFideliteType: (type: 'cagnotte' | 'tampons') => void
  fideliteTaux: number
  setFideliteTaux: (taux: number) => void
  fideliteTamponsMax: number
  setFideliteTamponsMax: (max: number) => void
  fideliteSeuilTampon: number
  setFideliteSeuilTampon: (seuil: number) => void
}

export default function FideliteTab({
  formAction,
  remiseMaxCaissier,
  motifs,
  fideliteActif,
  setFideliteActif,
  fideliteType,
  setFideliteType,
  fideliteTaux,
  setFideliteTaux,
  fideliteTamponsMax,
  setFideliteTamponsMax,
  fideliteSeuilTampon,
  setFideliteSeuilTampon,
}: FideliteTabProps) {
  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Champs masqués pour préserver les autres paramètres */}
      <input type="hidden" name="pos_remise_max_caissier" value={remiseMaxCaissier} />
      <input type="hidden" name="pos_remise_motifs" value={JSON.stringify(motifs)} />

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Statut du Programme de Fidélité
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Permet à vos clients d&apos;accumuler des avantages automatiquement lors de leurs achats en caisse ou sur votre boutique.
            </p>
          </div>

          <select
            name="fidelite_actif"
            value={fideliteActif ? 'true' : 'false'}
            onChange={e => setFideliteActif(e.target.value === 'true')}
            style={{ ...inputStyle, width: 'auto', fontWeight: 700, padding: '8px 14px' }}
          >
            <option value="true">Programme Actif</option>
            <option value="false">Programme Désactivé</option>
          </select>
        </div>

        {fideliteActif && (
          <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <label style={labelStyle}>Mécanique de récompense client</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 8 }}>
              {/* Option A : Cashback */}
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                borderRadius: 12,
                border: fideliteType === 'cagnotte' ? '2px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                background: fideliteType === 'cagnotte' ? '#FFF9F5' : '#ffffff',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="fidelite_type"
                    value="cagnotte"
                    checked={fideliteType === 'cagnotte'}
                    onChange={() => setFideliteType('cagnotte')}
                  />
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Cagnotte Cashback (% sur les achats)</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                  Chaque dépense crédite un pourcentage directement dans le solde FCFA du client, utilisable comme moyen de paiement en caisse.
                </span>
              </label>

              {/* Option B : Tampons */}
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                borderRadius: 12,
                border: fideliteType === 'tampons' ? '2px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                background: fideliteType === 'tampons' ? '#FFF9F5' : '#ffffff',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="fidelite_type"
                    value="tampons"
                    checked={fideliteType === 'tampons'}
                    onChange={() => setFideliteType('tampons')}
                  />
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Carte à Tampons (Vignettes)</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                  Le client reçoit des tampons virtuels selon le montant de ses achats. Une fois la carte remplie, il gagne un cadeau ou un bon d&apos;achat.
                </span>
              </label>
            </div>

            {/* Détails de la mécanique choisie */}
            {fideliteType === 'cagnotte' ? (
              <div style={{ marginTop: 20, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ maxWidth: 320 }}>
                  <label style={labelStyle}>Taux de Cashback Reversé (%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      name="fidelite_taux_cashback"
                      min="0.5"
                      max="50"
                      step="0.5"
                      value={fideliteTaux}
                      onChange={e => setFideliteTaux(Number(e.target.value))}
                      style={{ ...inputStyle, width: 140, fontWeight: 700 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>%</span>
                  </div>
                  <p style={helpText}>Recommandé : 2% à 5% pour le commerce de détail.</p>
                </div>

                <div style={{ marginTop: 12, padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 12.5, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Exemple :</strong> Pour un achat de <strong>10 000 FCFA</strong>, votre client accumule automatiquement <strong>{fcfa(10000 * (fideliteTaux / 100))}</strong> dans sa cagnotte WhatsApp.
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 20, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Montant d&apos;achat pour 1 tampon (FCFA)</label>
                    <input
                      type="number"
                      name="fidelite_seuil_tampon"
                      min="500"
                      step="500"
                      value={fideliteSeuilTampon}
                      onChange={e => setFideliteSeuilTampon(Number(e.target.value))}
                      style={{ ...inputStyle, fontWeight: 700 }}
                    />
                    <p style={helpText}>Ex : 1 tampon tous les 2 000 FCFA dépensés.</p>
                  </div>

                  <div>
                    <label style={labelStyle}>Nombre de tampons requis (Objectif)</label>
                    <input
                      type="number"
                      name="fidelite_tampons_max"
                      min="3"
                      max="50"
                      value={fideliteTamponsMax}
                      onChange={e => setFideliteTamponsMax(Number(e.target.value))}
                      style={{ ...inputStyle, fontWeight: 700 }}
                    />
                    <p style={helpText}>Ex : Carte de 10 tampons pour un cadeau.</p>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 12.5, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Exemple :</strong> Un client qui achète pour <strong>6 500 FCFA</strong> recevra <strong>{Math.floor(6500 / Math.max(1, fideliteSeuilTampon))} tampons</strong>. Dès <strong>{fideliteTamponsMax} tampons</strong>, sa carte est complétée.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          className="npl-btn npl-btn-brand npl-btn-md"
          style={{ padding: '10px 24px', fontWeight: 800, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Save size={16} />
          <span>Enregistrer les paramètres de fidélité</span>
        </button>
      </div>
    </form>
  )
}
