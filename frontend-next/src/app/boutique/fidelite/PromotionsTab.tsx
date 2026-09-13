'use client'

import React from 'react'
import { Tag, Plus, Check, Copy, Trash2 } from 'lucide-react'
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

interface PromotionsTabProps {
  promoFormAction: (payload: FormData) => void
  promoState: any
  promotions: any[]
  loadingPromos: boolean
  copiedCode: string | null
  handleCopyCode: (code: string) => void
  handleSupprimerPromo: (id: string) => void
}

export default function PromotionsTab({
  promoFormAction,
  promoState,
  promotions,
  loadingPromos,
  copiedCode,
  handleCopyCode,
  handleSupprimerPromo,
}: PromotionsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Formulaire de création d'un code promo */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Tag size={22} style={{ color: 'var(--accent, #C75B00)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Créer un Nouveau Code Promo / Coupon
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Générez un code réducteur que vos clients peuvent saisir au moment de commander sur votre boutique en ligne ou en caisse.
            </p>
          </div>
        </div>

        {promoState.error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            {promoState.error}
          </div>
        )}

        <form action={promoFormAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Code Promo *</label>
              <input
                name="code"
                required
                placeholder="Ex: BIENVENUE10, SOLDES2026"
                style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}
              />
              <p style={helpText}>Majuscules et chiffres recommandés.</p>
            </div>

            <div>
              <label style={labelStyle}>Type de Réduction *</label>
              <select name="type_remise" defaultValue="pourcentage" style={{ ...inputStyle, fontWeight: 700 }}>
                <option value="pourcentage">Pourcentage (%)</option>
                <option value="fixe">Montant Fixe (FCFA)</option>
                <option value="livraison_offerte">Livraison Offerte</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Valeur de la Réduction *</label>
              <input
                type="number"
                name="valeur"
                min="0"
                step="1"
                defaultValue={10}
                required
                style={{ ...inputStyle, fontWeight: 700 }}
              />
              <p style={helpText}>Ex : 10 pour 10%, ou 2000 pour 2 000 FCFA.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Montant Minimum d&apos;Achat (FCFA)</label>
              <input
                type="number"
                name="min_achat"
                min="0"
                step="500"
                defaultValue={0}
                style={inputStyle}
              />
              <p style={helpText}>0 pour aucune condition de montant.</p>
            </div>

            <div>
              <label style={labelStyle}>Limite Totale d&apos;Utilisations</label>
              <input
                type="number"
                name="limite_utilisation"
                min="1"
                placeholder="Illimité"
                style={inputStyle}
              />
              <p style={helpText}>Laissez vide pour un usage illimité.</p>
            </div>

            <div>
              <label style={labelStyle}>Date d&apos;Expiration (Optionnel)</label>
              <input
                type="date"
                name="fin"
                style={inputStyle}
              />
              <p style={helpText}>Laissez vide pour un code permanent.</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              type="submit"
              className="npl-btn npl-btn-brand npl-btn-md"
              style={{ padding: '10px 22px', fontWeight: 800, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> Créer le code promo
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des codes promo */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
          Vos Codes Promo Actifs ({promotions.length})
        </h3>

        {loadingPromos ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Chargement des promotions...</p>
        ) : promotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1.5px dashed #cbd5e1' }}>
            <Tag size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Aucun code promo créé pour l&apos;instant.</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Utilisez le formulaire ci-dessus pour lancer votre première promotion.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '10px 12px' }}>Code</th>
                  <th style={{ padding: '10px 12px' }}>Réduction</th>
                  <th style={{ padding: '10px 12px' }}>Min. Achat</th>
                  <th style={{ padding: '10px 12px' }}>Utilisations</th>
                  <th style={{ padding: '10px 12px' }}>Expiration</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => {
                  const isExpired = p.fin && new Date(p.fin) < new Date()
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(p.code)}
                            style={{ background: 'none', border: 'none', color: copiedCode === p.code ? '#16a34a' : '#64748b', cursor: 'pointer', padding: 2 }}
                            title="Copier le code"
                          >
                            {copiedCode === p.code ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.type_remise === 'pourcentage' && <span style={{ fontWeight: 700, color: '#dc2626' }}>-{p.valeur}%</span>}
                        {p.type_remise === 'fixe' && <span style={{ fontWeight: 700, color: '#dc2626' }}>-{fcfa(Number(p.valeur))}</span>}
                        {p.type_remise === 'livraison_offerte' && <span style={{ fontWeight: 700, color: '#16a34a' }}>Livraison offerte</span>}
                      </td>
                      <td style={{ padding: '12px', color: '#475569' }}>
                        {Number(p.min_achat) > 0 ? fcfa(Number(p.min_achat)) : 'Aucun'}
                      </td>
                      <td style={{ padding: '12px', color: '#475569' }}>
                        {p.fois_utilise || 0} {p.limite_utilisation ? `/ ${p.limite_utilisation}` : ''}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isExpired ? (
                          <span style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Expiré le {new Date(p.fin).toLocaleDateString('fr-FR')}
                          </span>
                        ) : p.fin ? (
                          <span style={{ fontSize: 12, color: '#475569' }}>
                            Jusqu&apos;au {new Date(p.fin).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Permanent
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleSupprimerPromo(p.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                          title="Supprimer ce code promo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
