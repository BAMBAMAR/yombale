'use client'

import React, { useState } from 'react'
import { X, ArrowDownLeft, ArrowUpRight, Users, PiggyBank, Calendar, FileText } from 'lucide-react'
import {
  type KalpeDirection,
  type KalpeModePaiement,
  saveKalpeOperation,
  saveKalpeDette,
  saveKalpeObjectif,
  verserKalpeObjectif,
  type KalpeObjectifLocal,
} from '@/lib/surga-kalpe'

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
        // Enregistrer également une opération de sortie du disponible vers l'épargne
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
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
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
        }}
      >
        {/* En-tête avec choix de mode */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setMode('entree'); setCategorie(CATEGORIES_ENTREE[0]) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mode === 'entree' ? 'var(--price, #0A5C36)' : 'var(--bg, #F8F5F0)',
                color: mode === 'entree' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              }}
            >
              <ArrowDownLeft size={14} />
              <span>Entrée</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('depense'); setCategorie(CATEGORIES_DEPENSE[0]) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mode === 'depense' ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
                color: mode === 'depense' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              }}
            >
              <ArrowUpRight size={14} />
              <span>Dépense</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('dette')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mode === 'dette' ? 'var(--accent, #C75B00)' : 'var(--bg, #F8F5F0)',
                color: mode === 'dette' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              }}
            >
              <Users size={14} />
              <span>Dette/Créance</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('epargne')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mode === 'epargne' ? '#2563EB' : 'var(--bg, #F8F5F0)',
                color: mode === 'epargne' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              }}
            >
              <PiggyBank size={14} />
              <span>Épargne</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text3, #73675E)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps de formulaire */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Montant principal */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
              Montant (FCFA) *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="Ex: 15000"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 18,
                fontWeight: 800,
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                backgroundColor: 'var(--bg, #F8F5F0)',
                color: 'var(--navy, #1C2B4A)',
                outline: 'none',
              }}
            />
          </div>

          {/* Mode Entrée / Dépense */}
          {(mode === 'entree' || mode === 'depense') && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Catégorie
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    backgroundColor: '#FFFFFF',
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Moyen de paiement
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'wave', label: 'Wave' },
                    { id: 'om', label: 'Orange Money' },
                    { id: 'cash', label: 'Espèces (Cash)' },
                  ].map((mp) => (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => setModePaiement(mp.id as KalpeModePaiement)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${modePaiement === mp.id ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)'}`,
                        backgroundColor: modePaiement === mp.id ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                        color: modePaiement === mp.id ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                        cursor: 'pointer',
                      }}
                    >
                      {mp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
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
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                  }}
                />
              </div>
            </>
          )}

          {/* Mode Dette / Créance */}
          {mode === 'dette' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Type d’opération
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setDirectionDette('a_recevoir')}
                    style={{
                      padding: '8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1px solid ${directionDette === 'a_recevoir' ? 'var(--price, #0A5C36)' : 'var(--border, #E8DDD2)'}`,
                      backgroundColor: directionDette === 'a_recevoir' ? 'var(--price, #0A5C36)' : '#FFFFFF',
                      color: directionDette === 'a_recevoir' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                      cursor: 'pointer',
                    }}
                  >
                    On me doit (À recevoir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectionDette('a_payer')}
                    style={{
                      padding: '8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1px solid ${directionDette === 'a_payer' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                      backgroundColor: directionDette === 'a_payer' ? 'var(--accent, #C75B00)' : '#FFFFFF',
                      color: directionDette === 'a_payer' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                      cursor: 'pointer',
                    }}
                  >
                    Je dois (À payer)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Nom de la personne ou entreprise *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ibrahima Fall"
                  value={tiersNom}
                  onChange={(e) => setTiersNom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                  Numéro de téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +221 77 000 00 00"
                  value={tiersTel}
                  onChange={(e) => setTiersTel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                  }}
                />
              </div>
            </>
          )}

          {/* Mode Épargne */}
          {mode === 'epargne' && (
            <>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setTypeActionEpargne('verser')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1px solid ${typeActionEpargne === 'verser' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)'}`,
                    backgroundColor: typeActionEpargne === 'verser' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: typeActionEpargne === 'verser' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                    cursor: 'pointer',
                  }}
                >
                  Ajouter un versement
                </button>
                <button
                  type="button"
                  onClick={() => setTypeActionEpargne('creer')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1px solid ${typeActionEpargne === 'creer' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)'}`,
                    backgroundColor: typeActionEpargne === 'creer' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: typeActionEpargne === 'creer' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                    cursor: 'pointer',
                  }}
                >
                  Créer un objectif
                </button>
              </div>

              {typeActionEpargne === 'verser' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                    Sélectionner l’objectif *
                  </label>
                  <select
                    value={objectifSelectionneId}
                    onChange={(e) => setObjectifSelectionneId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: 13,
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {objectifsExistants.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.titre} (Cible: {obj.montant_cible.toLocaleString('fr-FR')} FCFA)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                      Titre de l’objectif *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Achat matériel, Tabaski, Permis..."
                      value={titreNouvelObjectif}
                      onChange={(e) => setTitreNouvelObjectif(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 13,
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
                      Montant cible total (FCFA) *
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 300000"
                      value={montantCibleNouvelObjectif}
                      onChange={(e) => setMontantCibleNouvelObjectif(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 13,
                        borderRadius: 8,
                        border: '1px solid var(--border, #E8DDD2)',
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Date de l'opération */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 4 }}>
              Date
            </label>
            <input
              type="date"
              value={dateOperation}
              onChange={(e) => setDateOperation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
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
                borderRadius: 8,
                border: 'none',
                backgroundColor:
                  mode === 'entree'
                    ? 'var(--price, #0A5C36)'
                    : mode === 'depense'
                    ? 'var(--navy, #1C2B4A)'
                    : mode === 'dette'
                    ? 'var(--accent, #C75B00)'
                    : '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
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
