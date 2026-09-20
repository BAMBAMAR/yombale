'use client'

import React from 'react'
import type { KalpeObjectif } from '../types'
import type { SaisieMode } from './KalpeSaisieModeTabs'

export const CATEGORIES_DEPENSE = [
  'Alimentation',
  'Transport',
  'Loyer & Charges',
  'Factures (Senelec/Woyofal)',
  'Santé',
  'Famille & Teranga',
  'Fournisseur / Stock',
  'Autre',
]

export const CATEGORIES_REVENU = [
  'Salaire',
  'Prestation',
  'Vente',
  'Transfert reçu',
  'Tontine',
  'Autre',
]

interface KalpeSaisieFormFieldsProps {
  mode: SaisieMode
  detteSens: 'a_recevoir' | 'a_payer'
  setDetteSens: (sens: 'a_recevoir' | 'a_payer') => void
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
}

export function KalpeSaisieFormFields({
  mode,
  detteSens,
  setDetteSens,
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                Nom de la personne *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Moussa Diop"
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
                Téléphone (WhatsApp)
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

      {/* Libellé / Note optionnelle */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
          Libellé / Note (facultatif)
        </label>
        <input
          type="text"
          placeholder={mode === 'vente_express' ? 'Ex: Robe Wax ou Prestation coiffure' : 'Ex: Déjeuner, Ticket car, Matériel...'}
          value={libelle}
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
