'use client'

import React from 'react'
import { User, Building2 } from 'lucide-react'
import type { KalpeObjectif } from '../types'
import type { SaisieMode } from './KalpeSaisieModeTabs'

export const CATEGORIES_DEPENSE = [
  'Alimentation & Marché',
  'Transport & Déplacement',
  'Carburant & Essence',
  'École & Scolarité',
  'Pressing & Blanchisserie',
  'Factures (Senelec/Woyofal/Eau)',
  'Loyer & Charges',
  'Communication & Forfait',
  'Santé & Pharmacie',
  'Habillement & Couture',
  'Famille & Teranga',
  'Fournisseur & Stock',
  'Dons & Culte',
  'Autre',
]

export const CATEGORIES_REVENU = [
  'Salaire & Emploi',
  'Prestation & Service',
  'Vente & Commerce',
  'Transfert reçu (Wave/OM)',
  'Tontine',
  'Loyer perçu',
  'Autre',
]

interface KalpeSaisieFormFieldsProps {
  mode: SaisieMode
  detteSens: 'a_recevoir' | 'a_payer'
  setDetteSens: (sens: 'a_recevoir' | 'a_payer') => void
  tiersType?: 'particulier' | 'entreprise'
  setTiersType?: (val: 'particulier' | 'entreprise') => void
  tiersNom: string
  setTiersNom: (val: string) => void
  tiersTel: string
  setTiersTel: (val: string) => void
  dateEcheance: string
  setDateEcheance: (val: string) => void
  selectedObjectifId: string
  setSelectedObjectifId: (val: string) => void
  objectifs: KalpeObjectif[]
  categorie: string
  setCategorie: (val: string) => void
  libelle: string
  setLibelle: (val: string) => void
  dateOperation?: string
  setDateOperation?: (val: string) => void
  moyenPaiement?: string
  setMoyenPaiement?: (val: string) => void
}

export function KalpeSaisieFormFields({
  mode,
  detteSens,
  setDetteSens,
  tiersType = 'particulier',
  setTiersType,
  tiersNom,
  setTiersNom,
  tiersTel,
  setTiersTel,
  dateEcheance,
  setDateEcheance,
  selectedObjectifId,
  setSelectedObjectifId,
  objectifs,
  categorie,
  setCategorie,
  libelle,
  setLibelle,
  dateOperation = '',
  setDateOperation,
  moyenPaiement = '',
  setMoyenPaiement,
}: KalpeSaisieFormFieldsProps) {
  return (
    <>
      {/* Champs spécifiques : Dette / Créance */}
      {mode === 'dette' && (
        <>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
              Sens de la créance :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDetteSens('a_recevoir')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: detteSens === 'a_recevoir' ? '1.5px solid #0A5C36' : '1px solid #E8DDD2',
                  background: detteSens === 'a_recevoir' ? '#E9F6ED' : '#FFFFFF',
                  color: detteSens === 'a_recevoir' ? '#0A5C36' : '#555',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                On me doit (À recevoir)
              </button>
              <button
                type="button"
                onClick={() => setDetteSens('a_payer')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: detteSens === 'a_payer' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
                  background: detteSens === 'a_payer' ? '#FFF3EB' : '#FFFFFF',
                  color: detteSens === 'a_payer' ? '#C75B00' : '#555',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Je dois (À payer)
              </button>
            </div>
          </div>

          {/* Type de Tiers : Particulier ou Entreprise / Société / Entité */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
              Type de tiers concerné :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTiersType?.('particulier')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: tiersType === 'particulier' ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid #E8DDD2',
                  background: tiersType === 'particulier' ? '#F1F5F9' : '#FFFFFF',
                  color: tiersType === 'particulier' ? 'var(--navy, #1C2B4A)' : '#64748B',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <User size={14} strokeWidth={2.4} />
                <span>Particulier (Personne)</span>
              </button>
              <button
                type="button"
                onClick={() => setTiersType?.('entreprise')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: tiersType === 'entreprise' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #E8DDD2',
                  background: tiersType === 'entreprise' ? '#FFF7ED' : '#FFFFFF',
                  color: tiersType === 'entreprise' ? 'var(--accent, #C75B00)' : '#64748B',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Building2 size={14} strokeWidth={2.4} />
                <span>Entreprise / Entité</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                {tiersType === 'entreprise' ? "Nom de l'entreprise ou entité *" : "Nom de la personne *"}
              </label>
              <input
                type="text"
                required
                placeholder={tiersType === 'entreprise' ? "Ex: École Sainte-Marie, Senelec, Pressing..." : "Ex: Moussa Diop"}
                value={tiersNom}
                onChange={(e) => setTiersNom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #E8DDD2',
                  borderRadius: '8px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                {tiersType === 'entreprise' ? "Contact / Téléphone" : "Téléphone (WhatsApp)"}
              </label>
              <input
                type="tel"
                placeholder="77 000 00 00"
                value={tiersTel}
                onChange={(e) => setTiersTel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #E8DDD2',
                  borderRadius: '8px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
              Date d'échéance (facultative)
            </label>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #E8DDD2',
                borderRadius: '8px',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </>
      )}

      {/* Champs spécifiques : Épargne */}
      {mode === 'epargne' && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '6px' }}>
            Choisir l'objectif d'épargne cible *
          </label>
          {objectifs.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#C75B00', background: '#FFF3EB', padding: '10px', borderRadius: '8px' }}>
              Aucun objectif actif. Créez d'abord un objectif dans l'onglet Épargne.
            </div>
          ) : (
            <select
              value={selectedObjectifId}
              onChange={(e) => setSelectedObjectifId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E8DDD2',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {objectifs.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.titre} (Déjà {obj.montant_actuel.toLocaleString('fr-FR')} / {obj.montant_cible.toLocaleString('fr-FR')} F)
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Catégories Dépense / Revenu */}
      {(mode === 'depense' || mode === 'revenu') && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '6px' }}>
            Catégorie
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(mode === 'depense' ? CATEGORIES_DEPENSE : CATEGORIES_REVENU).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategorie(cat)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: categorie === cat ? '1.5px solid #1C2B4A' : '1px solid #E8DDD2',
                  background: categorie === cat ? '#1C2B4A' : '#F8F5F0',
                  color: categorie === cat ? '#FFFFFF' : '#444',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date et moyen de paiement (dictables : « hier », « le 3 octobre », « par Wave ») */}
      {mode !== 'dette' && mode !== 'epargne' && setDateOperation && setMoyenPaiement && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
              Date (aujourd'hui par défaut)
            </label>
            <input
              type="date"
              value={dateOperation}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateOperation(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E8DDD2', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
              Moyen de paiement
            </label>
            <select
              value={moyenPaiement}
              onChange={(e) => setMoyenPaiement(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8DDD2', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
            >
              <option value="">Non précisé</option>
              {['Espèces', 'Wave', 'Orange Money', 'Carte', 'Virement / chèque'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Libellé / Note optionnelle */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
          Libellé / Note (facultatif)
        </label>
        <input
          type="text"
          placeholder={mode === 'vente_express' ? 'Ex: Robe Wax ou Prestation coiffure' : 'Ex: Déjeuner, Ticket car, Matériel...'}
          value={libelle}
          maxLength={120}
          onChange={(e) => setLibelle(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            border: '1.5px solid #E8DDD2',
            borderRadius: '8px',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </>
  )
}
