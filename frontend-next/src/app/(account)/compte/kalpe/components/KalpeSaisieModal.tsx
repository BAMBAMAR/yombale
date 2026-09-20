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
  getMessageErreurMicro,
  parseSaisieExpressIntent,
  parseDetteIntent,
} from '@/lib/voice-assistant'

type SaisieMode = 'revenu' | 'depense' | 'dette' | 'epargne' | 'vente_express'

interface KalpeSaisieModalProps {
  isOpen: boolean
  initialMode?: SaisieMode
  initialContexte?: 'personnel' | 'activite'
  initialDetteSens?: 'a_recevoir' | 'a_payer'
  autoStartVoice?: boolean
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
  initialDetteSens = 'a_recevoir',
  autoStartVoice = false,
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
  const [detteSens, setDetteSens] = useState<'a_recevoir' | 'a_payer'>(initialDetteSens)
  const [selectedObjectifId, setSelectedObjectifId] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
  const listenerRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  // Dictée vocale bilingue Wolof / Français
  const toggleListening = async () => {
    if (isListening) {
      if (listenerRef.current) {
        try {
          listenerRef.current.stop()
        } catch (err) {
          console.warn('[KalpeVoice] stop error:', err)
        }
      }
      setIsListening(false)
      return
    }

    setVoiceFeedback(null)

    const perm = await demanderPermissionMicrophone()
    if (!perm.ok) {
      setIsListening(false)
      const msg = getMessageErreurMicro(perm.error || 'not-allowed')
      setVoiceFeedback(msg)
      toast.error(msg)
      return
    }

    const rec = createVoiceListener({
      lang: 'fr-FR',
      onStart: () => {
        setIsListening(true)
        setVoiceFeedback('Écoute en cours (Wolof / Français)... Parlez maintenant')
      },
      onResult: (transcript, alts) => {
        setIsListening(false)
        setVoiceFeedback(`Reconnu : "${transcript}"`)

        if (mode === 'dette') {
          const parsed = parseDetteIntent(transcript, [], alts || [])
          if (parsed.montant) setMontant(String(parsed.montant))
          if (parsed.nomClient) setTiersNom(parsed.nomClient)
          if (parsed.type === 'vente_credit') setDetteSens('a_recevoir')
          else if (parsed.type === 'remboursement') setDetteSens('a_payer')
          toast.success(
            `Dette détectée : ${parsed.montant ? parsed.montant.toLocaleString('fr-FR') + ' FCFA' : ''} ${
              parsed.nomClient ? '• ' + parsed.nomClient : ''
            }`
          )
        } else {
          const parsed = parseSaisieExpressIntent(transcript, mode === 'depense' ? 'depense' : 'vente')
          if (parsed.montant && parsed.montant > 0) setMontant(String(parsed.montant))
          const desc = parsed.libelleProduit || parsed.description
          if (desc) setLibelle(desc)
          if (parsed.categorie) setCategorie(parsed.categorie)
          if (parsed.mode === 'depense') setMode('depense')
          else if (parsed.mode === 'vente') setMode('revenu')
          toast.success(
            `Opération reconnue : ${parsed.montant ? parsed.montant.toLocaleString('fr-FR') + ' FCFA' : ''} ${
              desc ? '• ' + desc : ''
            }`
          )
        }
      },
      onError: (err) => {
        setIsListening(false)
        const msg = getMessageErreurMicro(err)
        setVoiceFeedback(msg)
        console.warn('[KalpeVoice] recognition error:', err)
      },
      onEnd: () => {
        setIsListening(false)
      },
    })

    if (rec) {
      listenerRef.current = rec
      try {
        rec.start()
        setIsListening(true)
        setVoiceFeedback('Écoute en cours (Wolof / Français)... Parlez maintenant')
      } catch (e: any) {
        setIsListening(false)
        const msg = getMessageErreurMicro(e?.name || 'not-allowed')
        setVoiceFeedback(msg)
        toast.error(msg)
      }
    } else {
      setIsListening(false)
      const msg = "La reconnaissance vocale n'est pas supportée par ce navigateur. Utilisez Chrome, Edge ou Safari."
      setVoiceFeedback(msg)
      toast.info(msg)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setContexte(initialContexte)
      if (initialDetteSens) setDetteSens(initialDetteSens)
      setMontant('')
      setLibelle('')
      setTiersNom('')
      setTiersTel('')
      setDateEcheance('')
      setVoiceFeedback(null)
      if (initialMode === 'depense') setCategorie(CATEGORIES_DEPENSE[0])
      else if (initialMode === 'revenu') setCategorie(CATEGORIES_REVENU[0])
      else if (initialMode === 'epargne' && objectifs.length > 0) setSelectedObjectifId(objectifs[0].id)

      if (autoStartVoice) {
        const timer = setTimeout(() => {
          toggleListening()
        }, 250)
        return () => clearTimeout(timer)
      }
    }
    return () => {
      if (listenerRef.current) {
        try {
          listenerRef.current.stop()
        } catch (err) {
          console.warn('[KalpeVoice] Cleanup error:', err)
        }
        listenerRef.current = null
      }
    }
  }, [isOpen, initialMode, initialContexte, initialDetteSens, autoStartVoice, objectifs])

  if (!isOpen) return null

  const handleQuickAddMontant = (val: number) => {
    const current = parseInt(montant || '0', 10) || 0
    setMontant(String(current + val))
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
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#F8F5F0',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            flexWrap: 'nowrap',
            borderBottom: '1px solid #E8DDD2',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('depense')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'depense' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
              background: mode === 'depense' ? '#FFF3EB' : '#FFFFFF',
              color: mode === 'depense' ? '#C75B00' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              overflow: 'visible',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowUpRight size={14} style={{ flexShrink: 0 }} />
            <span>Dépense</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('revenu')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'revenu' ? '1.5px solid #0A5C36' : '1px solid #E8DDD2',
              background: mode === 'revenu' ? '#E9F6ED' : '#FFFFFF',
              color: mode === 'revenu' ? '#0A5C36' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              overflow: 'visible',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowDownLeft size={14} style={{ flexShrink: 0 }} />
            <span>Reçu</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('dette')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'dette' ? '1.5px solid #1C2B4A' : '1px solid #E8DDD2',
              background: mode === 'dette' ? '#ECEFF5' : '#FFFFFF',
              color: mode === 'dette' ? '#1C2B4A' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              overflow: 'visible',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={14} style={{ flexShrink: 0 }} />
            <span>Dette / Crédit</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('epargne')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'epargne' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
              background: mode === 'epargne' ? '#FFF3EB' : '#FFFFFF',
              color: mode === 'epargne' ? '#C75B00' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              overflow: 'visible',
              transition: 'all 0.15s ease',
            }}
          >
            <Target size={14} style={{ flexShrink: 0 }} />
            <span>Épargne</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('vente_express')
              setContexte('activite')
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: mode === 'vente_express' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
              background: mode === 'vente_express' ? '#FFF3EB' : '#FFFFFF',
              color: mode === 'vente_express' ? '#C75B00' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              overflow: 'visible',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={14} style={{ flexShrink: 0 }} />
            <span>Vente Express</span>
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isListening ? '#DC2626' : '#FFF7ED',
                  color: isListening ? '#FFFFFF' : '#C75B00',
                  border: isListening ? '1.5px solid #DC2626' : '1px solid #FED7AA',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isListening ? '0 0 10px rgba(220, 38, 38, 0.4)' : 'none',
                }}
              >
                {isListening ? <MicOff size={14} style={{ flexShrink: 0 }} /> : <Mic size={14} style={{ flexShrink: 0 }} />}
                <span>{isListening ? 'Arrêter écoute' : 'Dicter vocal'}</span>
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
                  fontSize: '11.5px',
                  color: isListening ? '#C75B00' : '#0A5C36',
                  background: isListening ? '#FFF7ED' : '#ECFDF5',
                  border: isListening ? '1px solid #FED7AA' : '1px solid #A7F3D0',
                  padding: '6px 10px',
                  borderRadius: 8,
                  marginTop: '8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isListening ? (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#DC2626',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Check size={14} style={{ color: '#0A5C36', flexShrink: 0 }} />
                )}
                <span>{voiceFeedback}</span>
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
