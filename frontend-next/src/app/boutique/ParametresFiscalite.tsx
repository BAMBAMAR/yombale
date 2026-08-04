'use client'

import { useFormState } from 'react-dom'
import { useEffect, useState } from 'react'
import { updateBoutique } from './actions'
import type { ActionState } from '@/lib/backend-fetch'

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }

export default function ParametresFiscalite({ boutique, onUpdate }: { boutique: any; onUpdate: () => void }) {
  const action = updateBoutique.bind(null, boutique.id)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})

  const [regime, setRegime] = useState(boutique.regime_fiscal || 'reel')

  useEffect(() => {
    if (state.success) {
      alert('Paramètres fiscaux enregistrés avec succès !')
      onUpdate()
    }
  }, [state.success, onUpdate])

  return (
    <div style={{ maxWidth: 600, background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚖️ Configuration de la Fiscalité
        </h3>
        
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
        <input type="hidden" name="tiktok" value={boutique.tiktok || ''} />

        <div>
          <label style={labelStyle}>Régime Fiscal de la Boutique</label>
          <select 
            name="regime_fiscal" 
            value={regime} 
            onChange={e => setRegime(e.target.value)}
            style={inputStyle}
          >
            <option value="non_assujetti">Non assujetti (Mention TVA non applicable - CGU)</option>
            <option value="reel">Réel Simplifié / Normal (TVA standard applicable)</option>
            <option value="exonere">Exonéré (Entreprise exonérée de TVA)</option>
          </select>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {regime === 'non_assujetti' && "La mention légale 'TVA non applicable - article 286 du CGI' sera ajoutée automatiquement sur vos factures."}
            {regime === 'reel' && "La TVA sera calculée sur les lignes de ventes et les factures."}
            {regime === 'exonere' && "Toutes les ventes sont traitées comme exonérées d'office."}
          </p>
        </div>

        {regime === 'reel' && (
          <div>
            <label style={labelStyle}>Taux de TVA par défaut (%)</label>
            <input 
              type="number" 
              name="tva_taux_defaut" 
              step="0.01" 
              defaultValue={Number(boutique.tva_taux_defaut ?? 18.00)} 
              style={inputStyle} 
              placeholder="Ex: 18.00"
            />
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              Taux appliqué par défaut au Sénégal et dans l'UEMOA (généralement 18%).
            </p>
          </div>
        )}

        {regime === 'reel' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <input 
              type="checkbox" 
              name="prix_tva_incluse" 
              id="prix_tva_incluse"
              defaultChecked={boutique.prix_tva_incluse !== false} 
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <label htmlFor="prix_tva_incluse" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
                Mes prix de vente en catalogue incluent déjà la TVA (Prix TTC)
              </label>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                Si décoché, la caisse calculera les prix HT + TVA en sus.
              </p>
            </div>
            <input type="hidden" name="prix_tva_incluse_hidden" value="true" />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid #f3f4f6' }}>
          <input 
            type="checkbox" 
            name="timbre_fiscal_applicable" 
            id="timbre_fiscal_applicable"
            defaultChecked={boutique.timbre_fiscal_applicable === true} 
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <div>
            <label htmlFor="timbre_fiscal_applicable" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
              Appliquer le timbre fiscal de 1% sur les règlements en espèces (Cash)
            </label>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
              Calcul automatique de 1% (plafonné à 5 000 FCFA) requis par la réglementation fiscale pour les paiements en cash.
            </p>
          </div>
          <input type="hidden" name="timbre_fiscal_applicable_hidden" value="true" />
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #1e3a5f 0%, #111827 100%)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 10 }}
        >
          Enregistrer la fiscalité
        </button>
      </form>
    </div>
  )
}
