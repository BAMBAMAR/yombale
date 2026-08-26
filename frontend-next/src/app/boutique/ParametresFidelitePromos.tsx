'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useFormState } from 'react-dom'
import { updateBoutique, createPromotion, deletePromotion, getBoutiquePromotions } from './actions'
import type { ActionState } from '@/lib/backend-fetch'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import { Gift, Percent, Tag, Plus, Trash2, Check, Copy, AlertTriangle, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react'

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

interface MotifRemise {
  id: string
  nom: string
  pct: number
}

const MOTIFS_DEFAUT: MotifRemise[] = [
  { id: 'anti_gaspi', nom: '🍌 Date courte / Anti-gaspi', pct: 30 },
  { id: 'defaut', nom: '📦 Défaut emballage', pct: 15 },
  { id: 'personnel', nom: '👥 Personnel / Employé', pct: 10 },
  { id: 'geste', nom: '👑 Geste commercial', pct: 5 },
]

export default function ParametresFidelitePromos({
  boutique,
  onUpdate,
}: {
  boutique: any
  onUpdate: () => void
}) {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<'fidelite' | 'remises_pos' | 'promotions'>('fidelite')

  // ── État Fidélité & Caisse ──
  const action = updateBoutique.bind(null, boutique.id)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  const [fideliteActif, setFideliteActif] = useState<boolean>(boutique.fidelite_actif !== false)
  const [fideliteType, setFideliteType] = useState<'cagnotte' | 'tampons'>(boutique.fidelite_type || 'cagnotte')
  const [fideliteTaux, setFideliteTaux] = useState<number>(boutique.fidelite_taux_cashback !== undefined ? Number(boutique.fidelite_taux_cashback) : 3)
  const [fideliteTamponsMax, setFideliteTamponsMax] = useState<number>(boutique.fidelite_tampons_max || 10)
  const [fideliteSeuilTampon, setFideliteSeuilTampon] = useState<number>(boutique.fidelite_seuil_tampon || 2000)

  const [remiseMaxCaissier, setRemiseMaxCaissier] = useState<number>(boutique.pos_remise_max_caissier !== undefined ? Number(boutique.pos_remise_max_caissier) : 10)
  const [motifs, setMotifs] = useState<MotifRemise[]>(() => {
    if (boutique.pos_remise_motifs) {
      try {
        return typeof boutique.pos_remise_motifs === 'string'
          ? JSON.parse(boutique.pos_remise_motifs)
          : boutique.pos_remise_motifs
      } catch {}
    }
    return MOTIFS_DEFAUT
  })
  const [nouveauMotifNom, setNouveauMotifNom] = useState('')
  const [nouveauMotifPct, setNouveauMotifPct] = useState(10)

  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    setFideliteActif(boutique.fidelite_actif !== false)
    setFideliteType(boutique.fidelite_type || 'cagnotte')
    setFideliteTaux(boutique.fidelite_taux_cashback !== undefined ? Number(boutique.fidelite_taux_cashback) : 3)
    setFideliteTamponsMax(boutique.fidelite_tampons_max || 10)
    setFideliteSeuilTampon(boutique.fidelite_seuil_tampon || 2000)
    setRemiseMaxCaissier(boutique.pos_remise_max_caissier !== undefined ? Number(boutique.pos_remise_max_caissier) : 10)
    if (boutique.pos_remise_motifs) {
      try {
        const parsed = typeof boutique.pos_remise_motifs === 'string' ? JSON.parse(boutique.pos_remise_motifs) : boutique.pos_remise_motifs
        if (Array.isArray(parsed)) setMotifs(parsed)
      } catch {}
    }
  }, [boutique])

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSavedMessage('✅ Paramètres enregistrés avec succès !')
      onUpdate()
      const tId = setTimeout(() => setSavedMessage(null), 5000)
      return () => clearTimeout(tId)
    }
  }, [state, onUpdate])

  // ── État Promotions ──
  const [promotions, setPromotions] = useState<any[]>([])
  const [loadingPromos, setLoadingPromos] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const promoAction = createPromotion.bind(null, boutique.id)
  const [promoState, promoFormAction] = useFormState<ActionState, FormData>(promoAction, {})

  const chargerPromotions = async () => {
    setLoadingPromos(true)
    try {
      const res = await getBoutiquePromotions(boutique.id)
      if (res.promotions) {
        setPromotions(res.promotions)
      }
    } finally {
      setLoadingPromos(false)
    }
  }

  useEffect(() => {
    if (subTab === 'promotions') {
      chargerPromotions()
    }
  }, [subTab, boutique.id])

  useEffect(() => {
    if (promoState.success) {
      chargerPromotions()
    }
  }, [promoState])

  const handleSupprimerPromo = async (promoId: string) => {
    if (!confirm('Supprimer définitivement ce code promo ?')) return
    const res = await deletePromotion(boutique.id, promoId)
    if (res.success) {
      setPromotions(prev => prev.filter(p => p.id !== promoId))
    } else {
      alert(res.error || 'Erreur lors de la suppression')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleAjouterMotif = () => {
    if (!nouveauMotifNom.trim()) return
    const newId = 'motif_' + Date.now()
    setMotifs(prev => [...prev, { id: newId, nom: nouveauMotifNom.trim(), pct: Number(nouveauMotifPct) || 5 }])
    setNouveauMotifNom('')
    setNouveauMotifPct(10)
  }

  const handleSupprimerMotif = (id: string) => {
    setMotifs(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── SOUS-ONGLETS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSubTab('fidelite')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: subTab === 'fidelite' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: subTab === 'fidelite' ? '#FFF3E8' : '#ffffff',
            color: subTab === 'fidelite' ? 'var(--accent, #C75B00)' : '#475569',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Gift size={16} />
          <span>1. Programme de Fidélité</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('remises_pos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: subTab === 'remises_pos' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: subTab === 'remises_pos' ? '#FFF3E8' : '#ffffff',
            color: subTab === 'remises_pos' ? 'var(--accent, #C75B00)' : '#475569',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={16} />
          <span>2. Règles Caisse & Remises</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('promotions')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: subTab === 'promotions' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: subTab === 'promotions' ? '#FFF3E8' : '#ffffff',
            color: subTab === 'promotions' ? 'var(--accent, #C75B00)' : '#475569',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Tag size={16} />
          <span>3. Codes Promo & Coupons</span>
        </button>
      </div>

      {savedMessage && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', color: '#166534', fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>
          {savedMessage}
        </div>
      )}

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>
          {state.error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 1 : PROGRAMME DE FIDÉLITÉ
          ═══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'fidelite' && (
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Champs masqués pour préserver les autres paramètres */}
          <input type="hidden" name="pos_remise_max_caissier" value={remiseMaxCaissier} />
          <input type="hidden" name="pos_remise_motifs" value={JSON.stringify(motifs)} />

          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎁</span> Statut du Programme de Fidélité
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
                <option value="true">🟢 Programme Actif</option>
                <option value="false">🔴 Programme Désactivé</option>
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
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>💰 Cagnotte Cashback (% sur les achats)</span>
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
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>🎟️ Carte à Tampons (Vignettes)</span>
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
              style={{ padding: '10px 24px', fontWeight: 800, borderRadius: 10 }}
            >
              💾 Enregistrer les paramètres de fidélité
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 2 : RÈGLES DE CAISSE POS & REMISES
          ═══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'remises_pos' && (
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
                  Plafonds & Sécurité des Remises en Caisse (Standard Supermarché)
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
                🏷️ Motifs de Remises Rapides Prédéfinis
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
                  placeholder="Nom du motif (ex: 🌟 Client VIP, 📦 Boîte abîmée...)"
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
                  style={{ padding: '0 16px', fontWeight: 800, borderRadius: 8 }}
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
              style={{ padding: '10px 24px', fontWeight: 800, borderRadius: 10 }}
            >
              💾 Enregistrer les règles de caisse
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 3 : CODES PROMO & COUPONS
          ═══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'promotions' && (
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
                    <option value="pourcentage">📉 Pourcentage (%)</option>
                    <option value="fixe">💰 Montant Fixe (FCFA)</option>
                    <option value="livraison_offerte">🚚 Livraison Offerte</option>
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
                  style={{ padding: '10px 22px', fontWeight: 800, borderRadius: 10 }}
                >
                  <Plus size={16} /> Créer le code promo
                </button>
              </div>
            </form>
          </div>

          {/* Tableau des codes promo */}
          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              📋 Vos Codes Promo Actifs ({promotions.length})
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
                            {p.type_remise === 'livraison_offerte' && <span style={{ fontWeight: 700, color: '#16a34a' }}>🚚 Livraison offerte</span>}
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
      )}
    </div>
  )
}
