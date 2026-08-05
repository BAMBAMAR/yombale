'use client'

import { useFormState } from 'react-dom'
import { useEffect, useState, useRef } from 'react'
import { updateBoutique } from './actions'
import type { ActionState } from '@/lib/backend-fetch'

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#fff' }
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 }
const sectionStyle: React.CSSProperties = { borderTop: '1px solid #e5e7eb', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }
const sectionTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#1e3a5f', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }
const helpText: React.CSSProperties = { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.4 }

const CGV_DEFAUT = `CONDITIONS GÉNÉRALES DE VENTE

1. PAIEMENT : Sauf accord contraire, le règlement est exigible à réception de facture. Tout retard de paiement entraîne de plein droit l'application de pénalités de retard au taux de 1,5% par mois.

2. LIVRAISON : Les délais de livraison sont donnés à titre indicatif. Tout retard ne peut donner lieu à dommages et intérêts ni à annulation de commande.

3. RÉSERVE DE PROPRIÉTÉ : Les marchandises restent la propriété du vendeur jusqu'au paiement intégral du prix.

4. RÉCLAMATION : Toute réclamation doit être formulée par écrit dans un délai de 48h suivant la livraison.

5. JURIDICTION : En cas de litige, les tribunaux de Dakar sont seuls compétents, conformément au droit OHADA.`

export default function ParametresFiscalite({ boutique, onUpdate }: { boutique: any; onUpdate: () => void }) {
  const action = updateBoutique.bind(null, boutique.id)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  const [regime, setRegime] = useState(boutique.regime_fiscal || 'reel')
  const [conditionsVente, setConditionsVente] = useState(boutique.conditions_vente || '')
  const [prixTvaIncluse, setPrixTvaIncluse] = useState<boolean>(boutique.prix_tva_incluse !== false)
  const [timbreFiscalApplicable, setTimbreFiscalApplicable] = useState<boolean>(boutique.timbre_fiscal_applicable === true)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    setRegime(boutique.regime_fiscal || 'reel')
    setConditionsVente(boutique.conditions_vente || '')
    setPrixTvaIncluse(boutique.prix_tva_incluse !== false)
    setTimbreFiscalApplicable(boutique.timbre_fiscal_applicable === true)
  }, [boutique])

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSavedMessage('✅ Paramètres juridiques et fiscaux enregistrés avec succès !')
      onUpdate()
      const t = setTimeout(() => setSavedMessage(null), 6000)
      return () => clearTimeout(t)
    }
  }, [state, onUpdate])

  return (
    <div style={{ maxWidth: 700, background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚖️ Paramètres Fiscalité & Infos Légales
        </h3>

        {savedMessage && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', color: '#166534', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{savedMessage}</span>
          </div>
        )}
        
        {state.error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>
            {state.error}
          </div>
        )}

        {/* Hidden inputs to keep other boutique details unchanged */}
        <input type="hidden" name="nom" value={boutique.nom} />
        <input type="hidden" name="description" value={boutique.description || ''} />
        <input type="hidden" name="telephone" value={boutique.telephone || ''} />
        <input type="hidden" name="adresse" value={boutique.adresse || ''} />
        <input type="hidden" name="slug" value={boutique.slug || ''} />
        <input type="hidden" name="facebook" value={boutique.facebook || ''} />
        <input type="hidden" name="instagram" value={boutique.instagram || ''} />
        <input type="hidden" name="tiktok" value={(boutique as any).tiktok || ''} />
        <input type="hidden" name="whatsapp" value={boutique.whatsapp || ''} />

        {/* ══════════ SECTION 1 — CONFIGURATION FISCALE ══════════ */}
        <div style={sectionStyle}>
          <h4 style={{ ...sectionTitleStyle, borderTop: 'none', paddingTop: 0 }}>📊 Régime & Application de la TVA</h4>
          
          <div>
            <label style={labelStyle}>Régime fiscal de l'entreprise *</label>
            <select 
              name="regime_fiscal" 
              value={regime} 
              onChange={e => setRegime(e.target.value)}
              style={inputStyle}
            >
              <option value="reel">Régime Réel / Général (Assujetti à la TVA 18%)</option>
              <option value="non_assujetti">Régime de la Franche / Non Assujetti (Exonéré de TVA selon Art. 286 CGI)</option>
              <option value="exonere">Exonération Fiscale Spécifique (Agrément Code des Investissements)</option>
            </select>
          </div>

          {regime === 'reel' && (
            <div>
              <label style={labelStyle}>Taux de TVA par défaut (%)</label>
              <input 
                type="number" 
                name="tva_taux_defaut" 
                defaultValue={boutique.tva_taux_defaut ?? 18} 
                step="0.1"
                style={inputStyle}
              />
              <p style={helpText}>
                Taux appliqué par défaut au Sénégal et dans l'UEMOA (généralement 18%).
              </p>
            </div>
          )}

          {regime === 'reel' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <input type="hidden" name="prix_tva_incluse" value={prixTvaIncluse ? 'true' : 'false'} />
              <input 
                type="checkbox" 
                id="prix_tva_incluse_cb"
                checked={prixTvaIncluse} 
                onChange={e => setPrixTvaIncluse(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div>
                <label htmlFor="prix_tva_incluse_cb" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
                  Mes prix de vente en catalogue incluent déjà la TVA (Prix TTC)
                </label>
                <p style={{ ...helpText, margin: '2px 0 0 0' }}>
                  Si décoché, la caisse calculera les prix HT + TVA en sus.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <input type="hidden" name="timbre_fiscal_applicable" value={timbreFiscalApplicable ? 'true' : 'false'} />
            <input 
              type="checkbox" 
              id="timbre_fiscal_applicable_cb"
              checked={timbreFiscalApplicable}
              onChange={e => setTimbreFiscalApplicable(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <label htmlFor="timbre_fiscal_applicable_cb" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
                Appliquer le timbre fiscal de 1% sur les règlements en espèces (Cash)
              </label>
              <p style={{ ...helpText, margin: '2px 0 0 0' }}>
                Calcul automatique de 1% (plafonné à 5 000 FCFA) requis par la réglementation fiscale pour les paiements en cash.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ SECTION 2 — IDENTITÉ JURIDIQUE ══════════ */}
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>📋 Identité Juridique</h4>
          <p style={{ ...helpText, margin: '-6px 0 4px 0' }}>
            Ces informations apparaîtront sur vos factures, devis et proformas. Obligatoire pour les documents conformes OHADA.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>N° RCCM</label>
              <input 
                type="text" 
                name="rccm" 
                defaultValue={boutique.rccm || ''} 
                style={inputStyle} 
                placeholder="SN-DKR-2024-A-12345"
              />
              <p style={helpText}>Registre du Commerce et du Crédit Mobilier</p>
            </div>

            <div>
              <label style={labelStyle}>N° NINEA</label>
              <input 
                type="text" 
                name="ninea" 
                defaultValue={boutique.ninea || ''} 
                style={inputStyle} 
                placeholder="12345678 K 2"
              />
              <p style={helpText}>Numéro d'Identification Nationale</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Forme Juridique</label>
              <select 
                name="forme_juridique" 
                defaultValue={boutique.forme_juridique || ''} 
                style={inputStyle}
              >
                <option value="">— Non renseignée —</option>
                <option value="EI">Entreprise Individuelle (EI)</option>
                <option value="SARL">SARL</option>
                <option value="SA">Société Anonyme (SA)</option>
                <option value="SAS">SAS</option>
                <option value="SUARL">SUARL</option>
                <option value="SNC">Société en Nom Collectif (SNC)</option>
                <option value="GIE">Groupement d'Intérêt Économique (GIE)</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Capital Social</label>
              <input 
                type="text" 
                name="capital_social" 
                defaultValue={boutique.capital_social || ''} 
                style={inputStyle} 
                placeholder="1 000 000 FCFA"
              />
            </div>
          </div>
        </div>

        {/* ══════════ SECTION 3 — COORDONNÉES BANCAIRES ══════════ */}
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>🏦 Coordonnées Bancaires</h4>
          <p style={{ ...helpText, margin: '-6px 0 4px 0' }}>
            Vos coordonnées bancaires pour les règlements par virement. Affichées en bas de vos factures.
          </p>

          <div>
            <label style={labelStyle}>Informations bancaires</label>
            <textarea 
              name="compte_bancaire" 
              defaultValue={boutique.compte_bancaire || ''} 
              style={textareaStyle} 
              placeholder={"Banque : CBAO Groupe Attijariwafa\nIBAN : SN08 SN00 0123 4567 8901 2345 6789\nCode SWIFT : CBAOSNDA\nTitulaire : VOTRE NOM / RAISON SOCIALE"}
              rows={4}
            />
          </div>
        </div>

        {/* ══════════ SECTION 4 — CONDITIONS DE VENTE ══════════ */}
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>📄 Conditions Générales de Vente</h4>
          <p style={{ ...helpText, margin: '-6px 0 4px 0' }}>
            Texte affiché en bas de vos documents commerciaux (factures, devis, proformas).
          </p>

          <div>
            <label style={labelStyle}>Conditions de vente</label>
            <textarea 
              name="conditions_vente" 
              value={conditionsVente}
              onChange={e => setConditionsVente(e.target.value)}
              style={{ ...textareaStyle, minHeight: 160 }} 
              rows={8}
            />
            {!conditionsVente && (
              <button
                type="button"
                onClick={() => setConditionsVente(CGV_DEFAUT)}
                style={{
                  marginTop: 8, padding: '6px 14px', borderRadius: 6,
                  background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                📝 Utiliser le modèle standard OHADA
              </button>
            )}
          </div>

          <div>
            <label style={labelStyle}>Pied de page personnalisé (optionnel)</label>
            <textarea 
              name="pied_de_page_document" 
              defaultValue={boutique.pied_de_page_document || ''} 
              style={textareaStyle} 
              placeholder="Ex: Merci pour votre confiance ! — www.votre-site.com"
              rows={2}
            />
            <p style={helpText}>Texte libre ajouté tout en bas de chaque document PDF généré.</p>
          </div>
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #1e3a5f 0%, #111827 100%)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 6 }}
        >
          💾 Enregistrer les paramètres
        </button>
      </form>
    </div>
  )
}
