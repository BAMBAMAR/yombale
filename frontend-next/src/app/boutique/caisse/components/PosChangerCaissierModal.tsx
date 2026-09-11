'use client'

import React, { useState, useEffect } from 'react'
import { User, Shield, Lock, X, Check, ArrowLeft, KeyRound, Settings, LogOut } from 'lucide-react'

export interface CaissierItem {
  id: string
  nom: string
  prenom?: string
  role: 'caissier' | 'superviseur' | 'admin'
  code_pin?: string
  actif?: boolean
}

interface PosChangerCaissierModalProps {
  isOpen: boolean
  onClose: () => void
  caissierActuelNom: string
  roleActif: 'caissier' | 'superviseur'
  caissiersList: CaissierItem[]
  onValiderChangement: (caissier: CaissierItem, pin: string) => boolean | { ok: boolean; error?: string }
  onVerrouillerTerminal: () => void
  onOuvrirConfigEquipe?: () => void
  onDeconnexion?: () => void
  isTerminalMode?: boolean
}

export default function PosChangerCaissierModal({
  isOpen,
  onClose,
  caissierActuelNom,
  roleActif,
  caissiersList,
  onValiderChangement,
  onVerrouillerTerminal,
  onOuvrirConfigEquipe,
  onDeconnexion,
  isTerminalMode = false,
}: PosChangerCaissierModalProps) {
  const [caissierCible, setCaissierCible] = useState<CaissierItem | null>(null)
  const [pinSaisi, setPinSaisi] = useState<string>('')
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setCaissierCible(null)
      setPinSaisi('')
      setErreur(null)
    }
  }, [isOpen])

  // Auto-validation du PIN dès 4 chiffres
  useEffect(() => {
    if (caissierCible && pinSaisi.length === 4) {
      validerPin()
    }
  }, [pinSaisi])

  if (!isOpen) return null

  function validerPin() {
    if (!caissierCible) return
    const res = onValiderChangement(caissierCible, pinSaisi)
    const isOk = typeof res === 'boolean' ? res : res.ok
    if (isOk) {
      onClose()
    } else {
      const errMsg = typeof res === 'object' && res.error ? res.error : 'Code PIN incorrect'
      setErreur(errMsg)
      setPinSaisi('')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 460,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1C2B4A 0%, #0f172a 100%)',
            color: '#ffffff',
            borderTopLeftRadius: 19,
            borderTopRightRadius: 19,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {caissierCible ? (
              <button
                type="button"
                onClick={() => {
                  setCaissierCible(null)
                  setPinSaisi('')
                  setErreur(null)
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <span style={{ fontSize: 20 }}>👤</span>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
                {caissierCible ? `Code PIN : ${caissierCible.prenom || ''} ${caissierCible.nom}` : 'Changer de Caissier'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
                {caissierCible
                  ? 'Tapez votre code secret à 4 chiffres'
                  : 'Sélectionnez le profil pour basculer la session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              width: 32,
              height: 32,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Corps de la modale */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bannière Caissier Actuel */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Session Active
                </span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 850, color: '#0f172a' }}>
                  {caissierActuelNom}
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                background: roleActif === 'superviseur' ? '#fef3c7' : '#e0f2fe',
                color: roleActif === 'superviseur' ? '#92400e' : '#0369a1',
              }}
            >
              {roleActif === 'superviseur' ? '👑 Gérant' : '👤 Caissier'}
            </span>
          </div>

          {!caissierCible ? (
            /* ÉTAPE 1 : LISTE DES CAISSIERS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
                Membres de l&apos;équipe configurés ({caissiersList.length}) :
              </span>

              {caissiersList.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  Aucun caissier spécifique configuré. Vous utilisez le compte Gérant par défaut.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {caissiersList.map((c) => {
                    const isCurrent =
                      caissierActuelNom.includes(c.nom) ||
                      (c.prenom && caissierActuelNom.includes(c.prenom))
                    const isSuper = c.role === 'superviseur' || c.role === 'admin'

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCaissierCible(c)
                          setPinSaisi('')
                          setErreur(null)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: isCurrent ? '2px solid #C75B00' : '1.5px solid #e2e8f0',
                          background: isCurrent ? '#FFF3E8' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: isSuper ? '#FEF3C7' : '#F1F5F9',
                              color: isSuper ? '#D97706' : '#1C2B4A',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              fontWeight: 900,
                            }}
                          >
                            {isSuper ? '👑' : '👤'}
                          </div>
                          <div>
                            <span style={{ fontSize: 13.5, fontWeight: 850, color: '#0f172a', display: 'block' }}>
                              {c.prenom} {c.nom}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                              {isSuper ? 'Gérant / Superviseur' : 'Caissier Magasin'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#166534',
                                background: '#DCFCE7',
                                padding: '2px 8px',
                                borderRadius: 6,
                              }}
                            >
                              Connecté
                            </span>
                          )}
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00' }}>
                            Choisir →
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Bouton Verrouiller */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onVerrouillerTerminal()
                  }}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Lock size={14} color="#ea580c" />
                  <span>Verrouiller / Passer la main</span>
                </button>

                {onOuvrirConfigEquipe && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onOuvrirConfigEquipe()
                    }}
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #fed7aa',
                      background: '#fff7ed',
                      color: '#c2410c',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Settings size={14} />
                    <span>Gérer l&apos;équipe & PINs</span>
                  </button>
                )}
              </div>

              {onDeconnexion && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onDeconnexion()
                  }}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'background 0.15s ease',
                  }}
                >
                  <LogOut size={14} />
                  <span>Déconnexion du compte Nopalou (Quitter)</span>
                </button>
              )}
            </div>
          ) : (
            /* ÉTAPE 2 : SAISIE CODE PIN */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <KeyRound size={18} color="#C75B00" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  Code PIN de {caissierCible.prenom} {caissierCible.nom}
                </span>
              </div>

              {/* Pastilles PIN */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {[0, 1, 2, 3].map((i) => {
                  const isFilled = pinSaisi.length > i
                  return (
                    <div
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: isFilled ? '#C75B00' : '#f1f5f9',
                        border: isFilled ? '2px solid #C75B00' : '2px solid #cbd5e1',
                        transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  )
                })}
              </div>

              {erreur && (
                <div
                  style={{
                    color: '#dc2626',
                    fontSize: 12.5,
                    fontWeight: 800,
                    marginBottom: 10,
                    background: '#fef2f2',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #fecaca',
                  }}
                >
                  {erreur}
                </div>
              )}

              {/* Clavier Tactile Rapide */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', maxWidth: 280, marginBottom: 12 }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      if (val === 'C') {
                        setPinSaisi('')
                        setErreur(null)
                      } else if (val === '⌫') {
                        setPinSaisi((p) => p.slice(0, -1))
                        setErreur(null)
                      } else if (pinSaisi.length < 4) {
                        setPinSaisi((p) => p + val)
                        setErreur(null)
                      }
                    }}
                    style={{
                      padding: '14px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 10,
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: 17,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCaissierCible(null)
                  setPinSaisi('')
                  setErreur(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px 12px',
                }}
              >
                ← Choisir un autre profil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
