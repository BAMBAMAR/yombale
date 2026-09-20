'use client'

import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import {
  ajouterKalpeOperation,
  ajouterKalpeDette,
  verserKalpeObjectif,
} from '../actions'
import type { KalpeObjectif } from '../types'
import { useToast } from '@/context/ToastContext'
import { KalpeSaisieModeTabs, type SaisieMode } from './KalpeSaisieModeTabs'
import {
  KalpeSaisieFormFields,
  CATEGORIES_DEPENSE,
  CATEGORIES_REVENU,
} from './KalpeSaisieFormFields'
import { KalpeSaisieMontant } from './KalpeSaisieMontant'
import { useKalpeVoice } from './useKalpeVoice'

export type { SaisieMode }

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

  // Dictée vocale bilingue Wolof / Français
  const { isListening, voiceFeedback, setVoiceFeedback, toggleListening } = useKalpeVoice({
    mode,
    isOpen,
    autoStartVoice,
    setMontant,
    setLibelle,
    setCategorie,
    setMode,
    setTiersNom,
    setDetteSens,
  })

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
    }
  }, [isOpen, initialMode, initialContexte, initialDetteSens, objectifs, setVoiceFeedback])

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
        <KalpeSaisieModeTabs mode={mode} setMode={setMode} setContexte={setContexte} />

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
          <KalpeSaisieMontant
            montant={montant}
            setMontant={setMontant}
            isListening={isListening}
            toggleListening={toggleListening}
            voiceFeedback={voiceFeedback}
            handleQuickAddMontant={handleQuickAddMontant}
          />

          {/* Form Fields: Specific to Mode */}
          <KalpeSaisieFormFields
            mode={mode}
            detteSens={detteSens}
            setDetteSens={setDetteSens}
            tiersNom={tiersNom}
            setTiersNom={setTiersNom}
            tiersTel={tiersTel}
            setTiersTel={setTiersTel}
            dateEcheance={dateEcheance}
            setDateEcheance={setDateEcheance}
            selectedObjectifId={selectedObjectifId}
            setSelectedObjectifId={setSelectedObjectifId}
            objectifs={objectifs}
            categorie={categorie}
            setCategorie={setCategorie}
            libelle={libelle}
            setLibelle={setLibelle}
          />

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
