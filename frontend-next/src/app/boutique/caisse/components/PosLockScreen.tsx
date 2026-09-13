'use client'

import React from 'react'
import { Shield, KeyRound, ArrowLeft, LogOut, Copy, Store } from 'lucide-react'
import PosLockPinPad from './PosLockPinPad'
import PosLockCaissierGrid from './PosLockCaissierGrid'

interface PosLockScreenProps {
  boutiques: Array<{ id: string; nom: string; logo?: string | null }>
  boutiqueActiveId: string
  activeBoutiqueObj?: { id: string; nom: string; logo?: string | null } | null
  initialToken?: string | null
  caissiersList: any[]
  authLock?: {
    profilChoisiPourPin?: any | null
    caissierSelectionneId?: string
    codePinSaisi?: string
    pinError?: string | null
    setProfilChoisiPourPin?: (c: any | null) => void
    setCaissierSelectionneId?: (id: string) => void
    setCodePinSaisi?: React.Dispatch<React.SetStateAction<string>> | ((s: string) => void) | any
    setPinError?: (err: string | null) => void
  } | any
  profilChoisiPourPin?: any | null
  caissierSelectionneId?: string
  codePinSaisi?: string
  pinError?: string | null
  setProfilChoisiPourPin?: (c: any | null) => void
  setCaissierSelectionneId?: (id: string) => void
  setCodePinSaisi?: React.Dispatch<React.SetStateAction<string>>
  setPinError?: (err: string | null) => void
  onOpenConfigPin: () => void
  onSeDeconnecterCompte: () => void
  modalesGestionPin: React.ReactNode
}

export default function PosLockScreen(props: PosLockScreenProps) {
  const {
    boutiques,
    boutiqueActiveId,
    activeBoutiqueObj,
    initialToken,
    caissiersList,
    authLock,
    onOpenConfigPin,
    onSeDeconnecterCompte,
    modalesGestionPin,
  } = props

  const profilChoisiPourPin = authLock ? authLock.profilChoisiPourPin : props.profilChoisiPourPin
  const caissierSelectionneId = (authLock ? authLock.caissierSelectionneId : props.caissierSelectionneId) || ''
  const codePinSaisi = (authLock ? authLock.codePinSaisi : props.codePinSaisi) || ''
  const pinError = authLock ? authLock.pinError : (props.pinError ?? null)
  const setProfilChoisiPourPin = authLock ? authLock.setProfilChoisiPourPin : (props.setProfilChoisiPourPin || (() => {}))
  const setCaissierSelectionneId = authLock ? authLock.setCaissierSelectionneId : (props.setCaissierSelectionneId || (() => {}))
  const setCodePinSaisi = authLock ? authLock.setCodePinSaisi : (props.setCodePinSaisi || (() => {}))
  const setPinError = authLock ? authLock.setPinError : (props.setPinError || (() => {}))

  const bqName = boutiques.find((b) => b.id === boutiqueActiveId)?.nom || boutiques[0]?.nom || ''
  const caissiersActifs = caissiersList.filter((c: any) => c.actif !== false)

  const vueChoixCaissier = caissiersActifs.length > 1 && !profilChoisiPourPin
  const cibleCaissier =
    profilChoisiPourPin ||
    (caissiersActifs.length === 1
      ? caissiersActifs[0]
      : caissierSelectionneId
      ? caissiersActifs.find((c) => c.id === caissierSelectionneId)
      : caissiersActifs[0])

  return (
    <div
      style={{
        background: 'var(--pos-bg)',
        color: 'var(--pos-text)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          background: 'var(--pos-surface, #ffffff)',
          border: '2px solid var(--pos-primary, #ea580c)',
          borderRadius: 24,
          padding: '28px 24px',
          width: '100%',
          maxWidth: vueChoixCaissier ? 480 : 400,
          textAlign: 'center',
          boxShadow: 'var(--pos-shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          transition: 'max-width 0.2s ease',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo Boutique */}
        {activeBoutiqueObj?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeBoutiqueObj.logo}
            alt={bqName}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              objectFit: 'cover',
              margin: '0 auto 10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: 24,
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(199,91,0,0.3)',
            }}
          >
            {bqName ? bqName.charAt(0).toUpperCase() : <Store size={26} />}
          </div>
        )}
        <h2 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 900, color: 'var(--pos-navy, #0f172a)' }}>
          Caisse POS {bqName ? `· ${bqName}` : 'Nopalou'}
        </h2>

        {/* Bannière Mode */}
        {initialToken ? (
          <div
            style={{
              margin: '0 0 14px',
              padding: '7px 12px',
              borderRadius: 10,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: 12,
              color: '#1e40af',
              lineHeight: 1.35,
              textAlign: 'center',
            }}
          >
            <strong>Terminal Dédié Magasin (Mode Autonome)</strong>
            <br />
            <span style={{ fontSize: 11, color: '#3b82f6' }}>
              Aucun compte connecté sur cet appareil. Vos paramètres et finances sont 100% isolés et protégés.
            </span>
          </div>
        ) : (
          <div
            style={{
              margin: '0 0 14px',
              padding: '7px 12px',
              borderRadius: 10,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              fontSize: 12,
              color: '#9a3412',
              lineHeight: 1.35,
              textAlign: 'center',
            }}
          >
            <strong>Session Gérant Connectée</strong>
            <br />
            <span style={{ fontSize: 11, color: '#c2410c' }}>
              Pour une tablette partagée avec vos caissiers, utilisez le <strong>Lien Terminal Dédié</strong> sans session gérant.
            </span>
          </div>
        )}

        {/* VUE 1 : GRILLE DE SÉLECTION « QUI ENCAISSE ? » (Quand > 1 caissier) */}
        {vueChoixCaissier ? (
          <PosLockCaissierGrid
            caissiersActifs={caissiersActifs}
            onSelectCaissier={(c) => {
              setCaissierSelectionneId(c.id)
              setProfilChoisiPourPin(c)
              setCodePinSaisi('')
              setPinError(null)
            }}
            onOpenConfigPin={onOpenConfigPin}
          />
        ) : (
          /* VUE 2 : SAISIE DU CODE PIN POUR LE CAISSIER CHOISI */
          <div>
            {caissiersActifs.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setProfilChoisiPourPin(null)
                    setCodePinSaisi('')
                    setPinError(null)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '5px 10px',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Choisir un autre profil</span>
                </button>
              </div>
            )}

            {cibleCaissier && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 14,
                  background: cibleCaissier.role === 'superviseur' ? '#fff7ed' : '#eff6ff',
                  border: cibleCaissier.role === 'superviseur' ? '1.5px solid #fed7aa' : '1.5px solid #bfdbfe',
                  marginBottom: 14,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background:
                      cibleCaissier.role === 'superviseur'
                        ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {cibleCaissier.role === 'superviseur' ? (
                    <Shield size={18} />
                  ) : cibleCaissier.prenom ? (
                    cibleCaissier.prenom.charAt(0).toUpperCase()
                  ) : (
                    ''
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: 'var(--pos-navy, #0f172a)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cibleCaissier.prenom ? `${cibleCaissier.prenom} ${cibleCaissier.nom || ''}`.trim() : cibleCaissier.nom}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: cibleCaissier.role === 'superviseur' ? '#c2410c' : '#1d4ed8',
                      fontWeight: 700,
                    }}
                  >
                    {cibleCaissier.role === 'superviseur' ? 'Gérant / Superviseur' : 'Caissier'} · Tapez votre code PIN
                  </div>
                </div>
              </div>
            )}

            <PosLockPinPad
              codePinSaisi={codePinSaisi}
              pinError={pinError}
              setCodePinSaisi={setCodePinSaisi}
              setPinError={setPinError}
            />

            <button
              type="button"
              onClick={onOpenConfigPin}
              style={{
                marginTop: 6,
                background: 'none',
                border: 'none',
                color: 'var(--pos-primary, #ea580c)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 8,
              }}
            >
              <KeyRound size={13} />
              <span>Gérant : Gérer l&apos;équipe & codes PIN</span>
            </button>
          </div>
        )}

        {/* Actions de sortie et lien terminal */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px solid var(--pos-border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {!initialToken && (
            <button
              type="button"
              onClick={() => {
                const activeB = boutiques.find((b) => b.id === boutiqueActiveId) || boutiques[0]
                const tok = (activeB as any)?.caisse_token || boutiqueActiveId
                if (tok && typeof window !== 'undefined') {
                  const terminalUrl = `${window.location.origin}/boutique/caisse?token=${tok}`
                  navigator.clipboard.writeText(terminalUrl)
                  alert(
                    `Lien Terminal Dédié copié !\n\nOuvrez ce lien sur la tablette ou l'ordinateur de vos caissiers pour qu'ils travaillent sans avoir accès à votre compte :\n${terminalUrl}`
                  )
                }
              }}
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <Copy size={13} />
              <span>Copier le Lien Terminal Caissier (Pour tablette)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSeDeconnecterCompte}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            <LogOut size={13} />
            <span>Déconnexion du compte Nopalou (Quitter)</span>
          </button>
        </div>
      </div>

      {modalesGestionPin}
    </div>
  )
}
