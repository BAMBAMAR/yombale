'use client'

import React, { useState } from 'react'
import {
  type KalpeModePaiement,
  saveKalpeOperation,
  saveKalpeDette,
  saveKalpeObjectif,
  verserKalpeObjectif,
  type KalpeObjectifLocal,
} from '@/lib/surga-kalpe'
import SurgaKalpeModeTabs from './SurgaKalpeModeTabs'
import SurgaKalpeDetteFields from './SurgaKalpeDetteFields'
import SurgaKalpeEpargneFields from './SurgaKalpeEpargneFields'

export type SaisieMode = 'entree' | 'depense' | 'dette' | 'epargne'

interface SurgaKalpeSaisieModalProps {
  isOpen: boolean
  initialMode: SaisieMode
  objectifsExistants: KalpeObjectifLocal[]
  onClose: () => void
  onSuccess: (message: string) => void
}

const CATEGORIES_ENTREE = [
  'Prestation / Salaire',
  'Vente de produit',
  'Transfert reçu',
  'Cadeau / Aide',
  'Autre revenu',
]

const CATEGORIES_DEPENSE = [
  'Alimentation / Courses',
  'Transport / Car rapide / Taxi',
  'Énergie / Woyofal / Senelec',
  'Eau / Sen\'Eau',
  'Santé / Pharmacie',
  'Loyer / Logement',
  'Crédit / Forfait Internet',
  'Famille / Dépense sociale',
  'Autre dépense',
]

export default function SurgaKalpeSaisieModal({
  isOpen,
  initialMode,
  objectifsExistants,
  onClose,
  onSuccess,
}: SurgaKalpeSaisieModalProps) {
  const [mode, setMode] = useState<SaisieMode>(initialMode)
  const [montant, setMontant] = useState('')
  const [libelle, setLibelle] = useState('')
  const [categorie, setCategorie] = useState(
    initialMode === 'entree' ? CATEGORIES_ENTREE[0] : CATEGORIES_DEPENSE[0]
  )
  const [dateOperation, setDateOperation] = useState(() => new Date().toISOString().slice(0, 10))
  const [modePaiement, setModePaiement] = useState<KalpeModePaiement>('wave')

  // Spécifique Dettes
  const [tiersNom, setTiersNom] = useState('')
  const [tiersTel, setTiersTel] = useState('')
  const [directionDette, setDirectionDette] = useState<'a_recevoir' | 'a_payer'>('a_recevoir')
  const [dateEcheance, setDateEcheance] = useState('')

  // Spécifique Épargne
  const [typeActionEpargne, setTypeActionEpargne] = useState<'verser' | 'creer'>('verser')
  const [objectifSelectionneId, setObjectifSelectionneId] = useState<string>(
    objectifsExistants[0]?.id || ''
  )
  const [titreNouvelObjectif, setTitreNouvelObjectif] = useState('')
  const [montantCibleNouvelObjectif, setMontantCibleNouvelObjectif] = useState('')

  if (!isOpen) return null

  const handleModeChange = (newMode: SaisieMode) => {
    setMode(newMode)
    if (newMode === 'entree') setCategorie(CATEGORIES_ENTREE[0])
    if (newMode === 'depense') setCategorie(CATEGORIES_DEPENSE[0])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valMontant = parseFloat(montant.replace(/\s+/g, ''))
    if (isNaN(valMontant) || valMontant <= 0) {
      alert('Veuillez saisir un montant valide')
      return
    }

    if (mode === 'entree') {
      saveKalpeOperation({
        direction: 'entree',
        type: 'revenu',
        montant: valMontant,
        categorie,
        libelle: libelle.trim() || categorie,
        mode_paiement: modePaiement,
        date_operation: dateOperation,
      })
      onSuccess(`Entrée de ${valMontant.toLocaleString('fr-FR')} FCFA enregistrée`)
    } else if (mode === 'depense') {
      saveKalpeOperation({
        direction: 'sortie',
        type: 'depense',
        montant: valMontant,
        categorie,
        libelle: libelle.trim() || categorie,
        mode_paiement: modePaiement,
        date_operation: dateOperation,
      })
      onSuccess(`Dépense de ${valMontant.toLocaleString('fr-FR')} FCFA enregistrée`)
    } else if (mode === 'dette') {
      if (!tiersNom.trim()) {
        alert('Veuillez indiquer le nom de la personne ou entreprise')
        return
      }
      saveKalpeDette({
        tiers_nom: tiersNom.trim(),
        tiers_telephone: tiersTel.trim() || undefined,
        montant_initial: valMontant,
        direction: directionDette,
        date_pret: dateOperation,
        date_echeance: dateEcheance || undefined,
        note: libelle.trim() || undefined,
      })
      const typeMsg = directionDette === 'a_recevoir' ? 'Créance à recevoir' : 'Dette à payer'
      onSuccess(`${typeMsg} de ${valMontant.toLocaleString('fr-FR')} FCFA enregistrée`)
    } else if (mode === 'epargne') {
      if (typeActionEpargne === 'verser') {
        if (!objectifSelectionneId) {
          alert('Veuillez sélectionner un objectif d’épargne')
          return
        }
        verserKalpeObjectif(objectifSelectionneId, valMontant)
        saveKalpeOperation({
          direction: 'sortie',
          type: 'versement_epargne',
          montant: valMontant,
          categorie: 'Épargne & Cagnottes',
          libelle: `Versement épargne`,
          mode_paiement: modePaiement,
          date_operation: dateOperation,
        })
        onSuccess(`Versement de ${valMontant.toLocaleString('fr-FR')} FCFA ajouté à l’épargne`)
      } else {
        const cible = parseFloat(montantCibleNouvelObjectif.replace(/\s+/g, ''))
        if (!titreNouvelObjectif.trim() || isNaN(cible) || cible <= 0) {
          alert('Veuillez indiquer un titre et un montant cible')
          return
        }
        saveKalpeObjectif({
          titre: titreNouvelObjectif.trim(),
          montant_cible: cible,
          categorie: 'Projet personnel',
          date_echeance: dateEcheance || undefined,
        })
        onSuccess(`Nouvel objectif « ${titreNouvelObjectif} » créé`)
      }
    }

    onClose()
  }

  const getButtonBg = () => {
    switch (mode) {
      case 'entree': return 'var(--surga-emerald, #059669)'
      case 'depense': return 'var(--surga-primary, #0F172A)'
      case 'dette': return 'var(--surga-accent, #D97706)'
      case 'epargne': return '#2563EB'
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          border: '1px solid var(--surga-border, #E2E8F0)',
        }}
      >
        <SurgaKalpeModeTabs
          mode={mode}
          onSelectMode={handleModeChange}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Montant principal avec inputMode="numeric" */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
              Montant (FCFA) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              autoComplete="off"
              placeholder="Ex: 15000"
              value={montant}
              onChange={(e) => setMontant(e.target.value.replace(/[^0-9]/g, ''))}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 18,
                fontWeight: 800,
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                backgroundColor: 'var(--surga-bg, #F8FAFC)',
                color: 'var(--surga-primary, #0F172A)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Mode Entrée / Dépense */}
          {(mode === 'entree' || mode === 'depense') && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
                  Catégorie
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid var(--surga-border, #E2E8F0)',
                    backgroundColor: 'var(--surga-surface, #FFFFFF)',
                    boxSizing: 'border-box',
                  }}
                >
                  {(mode === 'entree' ? CATEGORIES_ENTREE : CATEGORIES_DEPENSE).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
                  Moyen de paiement
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'wave', label: 'Wave' },
                    { id: 'om', label: 'Orange Money' },
                    { id: 'cash', label: 'Espèces' },
                  ].map((mp) => (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => setModePaiement(mp.id as KalpeModePaiement)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        minHeight: 42,
                        border: `1px solid ${modePaiement === mp.id ? 'var(--surga-primary, #0F172A)' : 'var(--surga-border, #E2E8F0)'}`,
                        backgroundColor: modePaiement === mp.id ? 'var(--surga-primary, #0F172A)' : '#FFFFFF',
                        color: modePaiement === mp.id ? '#FFFFFF' : 'var(--surga-text2, #475569)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {mp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
                  Libellé ou Note
                </label>
                <input
                  type="text"
                  placeholder="Ex: Achat fournitures, Vente robe..."
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid var(--surga-border, #E2E8F0)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}

          {/* Mode Dette / Créance */}
          {mode === 'dette' && (
            <SurgaKalpeDetteFields
              directionDette={directionDette}
              setDirectionDette={setDirectionDette}
              tiersNom={tiersNom}
              setTiersNom={setTiersNom}
              tiersTel={tiersTel}
              setTiersTel={setTiersTel}
              dateEcheance={dateEcheance}
              setDateEcheance={setDateEcheance}
            />
          )}

          {/* Mode Épargne */}
          {mode === 'epargne' && (
            <SurgaKalpeEpargneFields
              typeActionEpargne={typeActionEpargne}
              setTypeActionEpargne={setTypeActionEpargne}
              objectifsExistants={objectifsExistants}
              objectifSelectionneId={objectifSelectionneId}
              setObjectifSelectionneId={setObjectifSelectionneId}
              titreNouvelObjectif={titreNouvelObjectif}
              setTitreNouvelObjectif={setTitreNouvelObjectif}
              montantCibleNouvelObjectif={montantCibleNouvelObjectif}
              setMontantCibleNouvelObjectif={setMontantCibleNouvelObjectif}
            />
          )}

          {/* Date de l'opération */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
              Date
            </label>
            <input
              type="date"
              value={dateOperation}
              onChange={(e) => setDateOperation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Bouton d'enregistrement */}
          <div style={{ marginTop: 10 }}>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: getButtonBg(),
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 800,
                minHeight: 46,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
