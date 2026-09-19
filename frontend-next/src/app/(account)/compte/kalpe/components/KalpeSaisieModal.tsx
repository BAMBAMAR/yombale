'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Mic,
  MicOff,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Target,
  Zap,
  Check,
} from 'lucide-react'
import {
  ajouterKalpeOperation,
  ajouterKalpeDette,
  verserKalpeObjectif,
} from '../actions'
import type { KalpeObjectif } from '../types'
import { useToast } from '@/context/ToastContext'
import {
  createVoiceListener,
  demanderPermissionMicrophone,
  parseSaisieExpressIntent,
  parseDetteIntent,
} from '@/lib/voice-assistant'

type SaisieMode = 'revenu' | 'depense' | 'dette' | 'epargne' | 'vente_express'

interface KalpeSaisieModalProps {
  isOpen: boolean
  initialMode?: SaisieMode
  initialContexte?: 'personnel' | 'activite'
  objectifs?: KalpeObjectif[]
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES_DEPENSE = [
  'Alimentation',
  'Transport',
  'Loyer & Charges',
  'Factures (Senelec/Woyofal)',
  'Santé',
  'Famille & Teranga',
  'Fournisseur / Stock',
  'Autre',
]

const CATEGORIES_REVENU = [
  'Salaire',
  'Prestation',
  'Vente',
  'Transfert reçu',
  'Tontine',
  'Autre',
]

export function KalpeSaisieModal({
  isOpen,
  initialMode = 'depense',
  initialContexte = 'personnel',
  objectifs = [],
  onClose,
  onSuccess,
}: KalpeSaisieModalProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<SaisieMode>(initialMode)
  const [contexte, setContexte] = useState<'personnel' | 'activite'>(initialContexte)

  const [montant, setMontant] = useState<string>('')
  const [categorie, setCategorie] = useState<string>('')
  const [libelle, setLibelle] = useState<string>('')
  const [tiersNom, setTiersNom] = useState<string>('')
  const [tiersTel, setTiersTel] = useState<string>('')
  const [dateEcheance, setDateEcheance] = useState<string>('')
  const [detteSens, setDetteSens] = useState<'a_recevoir' | 'a_payer'>('a_recevoir')
  const [selectedObjectifId, setSelectedObjectifId] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
  const listenerRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setContexte(initialContexte)
      setMontant('')
      setLibelle('')
      setTiersNom('')
      setTiersTel('')
      setDateEcheance('')
      setVoiceFeedback(null)
      if (initialMode === 'depense') setCategorie(CATEGORIES_DEPENSE[0])
      else if (initialMode === 'revenu') setCategorie(CATEGORIES_REVENU[0])
      else if (initialMode === 'epargne' && objectifs.length > 0) setSelectedObjectifId(objectifs[0].id)
    }
    return () => {
      if (listenerRef.current) {
        listenerRef.current.stop()
        listenerRef.current = null
      }
    }
  }, [isOpen, initialMode, initialContexte, objectifs])

  if (!isOpen) return null

  const handleQuickAddMontant = (val: number) => {
    const current = parseInt(montant || '0', 10) || 0
    setMontant(String(current + val))
  }

  // Dictée vocale bilingue
  const toggleListening = async () => {
    if (isListening) {
      if (listenerRef.current) listenerRef.current.stop()
      setIsListening(false)
      return
    }

    const hasPerm = await demanderPermissionMicrophone()
    if (!hasPerm) {
      toast.error('Permission micro refusée')
      return
    }

    setIsListening(true)
    setVoiceFeedback('Écoute en cours (Wolof / Français)... Parlez')

    listenerRef.current = createVoiceListener({
      onResult: (transcript, isFinal) => {
        setVoiceFeedback(transcript)
        if (isFinal) {
          setIsListening(false)
          if (mode === 'dette') {
            const parsed = parseDetteIntent(transcript)
            if (parsed.montant) setMontant(String(parsed.montant))
            if (parsed.nomClient) setTiersNom(parsed.nomClient)
            if (parsed.type === 'vente_credit') setDetteSens('a_recevoir')
            else if (parsed.type === 'remboursement') setDetteSens('a_payer')
            toast.success(`Dette détectée : ${parsed.montant ? parsed.montant + ' F' : ''} ${parsed.nomClient || ''}`)
          } else {
            const parsed = parseSaisieExpressIntent(transcript, mode === 'depense' ? 'depense' : 'vente')
            if (parsed.montant) setMontant(String(parsed.montant))
            const desc = parsed.libelleProduit || parsed.description
            if (desc) setLibelle(desc)
            if (parsed.mode === 'depense') setMode('depense')
            else if (parsed.mode === 'vente') setMode('revenu')
            toast.success(`Montant détecté : ${parsed.montant} FCFA`)
          }
        }
      },
      onError: () => {
        setIsListening(false)
        setVoiceFeedback(null)
      },
      onEnd: () => {
        setIsListening(false)
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericMontant = parseInt(montant.replace(/\s+/g, ''), 10)
    if (!numericMontant || numericMontant <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    setLoading(true)
    try {
      if (mode === 'dette') {
        if (!tiersNom.trim()) {
          toast.error('Veuillez préciser le nom de la personne')
          setLoading(false)
          return
        }
        const res = await ajouterKalpeDette({
          tiers_nom: tiersNom.trim(),
          tiers_telephone: tiersTel.trim() || undefined,
          montant: numericMontant,
          direction: detteSens,
          date_echeance: dateEcheance || undefined,
          note: libelle.trim() || undefined,
          contexte,
        })
        if (!res.success) {
          toast.error(res.error || 'Erreur lors de l’enregistrement')
          setLoading(false)
          return
        }
        toast.success(detteSens === 'a_recevoir' ? 'Créance enregistrée !' : 'Dette enregistrée !')
      } else if (mode === 'epargne') {
        if (!selectedObjectifId) {
          toast.error('Veuillez sélectionner un objectif')
          setLoading(false)
          return
        }
        const res = await verserKalpeObjectif(selectedObjectifId, {
          montant: numericMontant,
          note: libelle.trim() || 'Versement épargne',
        })
        if (!res.success) {
          toast.error(res.error || 'Erreur versement')
          setLoading(false)
          return
        }
        toast.success(res.message || 'Versement enregistré !')
      } else {
        const opType = mode === 'vente_express' ? 'vente_express' : mode
        const res = await ajouterKalpeOperation({
          type: opType,
          montant: numericMontant,
          categorie: categorie || (mode === 'depense' ? 'Autre' : 'Vente'),
          libelle: libelle.trim() || (mode === 'depense' ? 'Dépense' : 'Entrée'),
          contexte,
          tiers_nom: tiersNom.trim() || undefined,
          tiers_tel: tiersTel.trim() || undefined,
        })
        if (!res.success) {
          toast.error(res.error || 'Erreur enregistrement')
          setLoading(false)
          return
        }
        toast.success(mode === 'depense' ? 'Dépense enregistrée !' : 'Revenu enregistré !')
      }

      onSuccess()
      onClose()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 20, 35, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drawer */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E8DDD2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#F0ECE4',
                color: '#1C2B4A',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              Saisie rapide
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C2B4A' }}>Sama Xaalis</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F8F5F0',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#555',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 16px',
            background: '#F8F5F0',
            overflowX: 'auto',
            borderBottom: '1px solid #E8DDD2',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('depense')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'depense' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
              background: mode === 'depense' ? '#FFF3EB' : '#FFFFFF',
              color: mode === 'depense' ? '#C75B00' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowUpRight size={14} /> Dépense
          </button>
          <button
            type="button"
            onClick={() => setMode('revenu')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'revenu' ? '1.5px solid #0A5C36' : '1px solid #E8DDD2',
              background: mode === 'revenu' ? '#E9F6ED' : '#FFFFFF',
              color: mode === 'revenu' ? '#0A5C36' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowDownLeft size={14} /> Reçu
          </button>
          <button
            type="button"
            onClick={() => setMode('dette')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'dette' ? '1.5px solid #1C2B4A' : '1px solid #E8DDD2',
              background: mode === 'dette' ? '#ECEFF5' : '#FFFFFF',
              color: mode === 'dette' ? '#1C2B4A' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Users size={14} /> Dette / Crédit
          </button>
          <button
            type="button"
            onClick={() => setMode('epargne')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'epargne' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
              background: mode === 'epargne' ? '#FFF3EB' : '#FFFFFF',
              color: mode === 'epargne' ? '#C75B00' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Target size={14} /> Épargne
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('vente_express')
              setContexte('activite')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'vente_express' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
              background: mode === 'vente_express' ? '#FFF3EB' : '#FFFFFF',
              color: mode === 'vente_express' ? '#C75B00' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={14} /> Vente Express
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px 20px 24px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Contexte Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>Contexte de l'opération :</span>
            <div style={{ display: 'flex', gap: '4px', background: '#F8F5F0', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setContexte('personnel')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: contexte === 'personnel' ? '#1C2B4A' : 'transparent',
                  color: contexte === 'personnel' ? '#FFFFFF' : '#666',
                }}
              >
                Personnel
              </button>
              <button
                type="button"
                onClick={() => setContexte('activite')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: contexte === 'activite' ? '#C75B00' : 'transparent',
                  color: contexte === 'activite' ? '#FFFFFF' : '#666',
                }}
              >
                Activité
              </button>
            </div>
          </div>

          {/* Saisie Montant Principal */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A' }}>Montant (FCFA)</label>
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isListening ? '#DC2626' : '#F8F5F0',
                  color: isListening ? '#FFFFFF' : '#1C2B4A',
                  border: '1px solid #E8DDD2',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                {isListening ? 'Arrêter micro' : 'Dicter vocal'}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="Ex: 5000"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#1C2B4A',
                  padding: '10px 14px',
                  border: '1.5px solid #E8DDD2',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#888',
                }}
              >
                FCFA
              </span>
            </div>

            {/* Voice Feedback */}
            {voiceFeedback && (
              <div
                style={{
                  fontSize: '11px',
                  color: isListening ? '#C75B00' : '#0A5C36',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                {voiceFeedback}
              </div>
            )}

            {/* Chips Montants Rapides */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[500, 1000, 2000, 5000, 10000, 25000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddMontant(val)}
                  style={{
                    background: '#F8F5F0',
                    border: '1px solid #E8DDD2',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1C2B4A',
                    cursor: 'pointer',
                  }}
                >
                  +{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields: Specific to Mode */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: mode === 'depense' ? '#C75B00' : mode === 'revenu' ? '#0A5C36' : '#1C2B4A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '13px 20px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <Check size={18} />
            {loading ? 'Enregistrement...' : 'Valider l’opération'}
          </button>
        </form>
      </div>
    </div>
  )
}
