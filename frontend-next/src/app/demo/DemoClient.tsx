'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Store, Briefcase } from 'lucide-react'
import {
  PublicSettings,
  DemoExplanation,
  PosCartItem,
  ChatMessage,
  StickerProduct,
  RelanceClient,
  DemoHeader,
  DemoHero,
  DemoMerchantSandbox,
  DemoAcheteurSandbox,
  DemoApporteurSandbox,
  DemoCalculator,
  DemoModals
} from './components'

export type { PublicSettings }

interface DemoClientProps {
  initialRef?: string
  initialRole?: 'acheteur' | 'marchand' | 'apporteur'
  initialSettings?: PublicSettings
}

export default function DemoClient({
  initialRef = '',
  initialRole = 'acheteur',
  initialSettings = {},
}: DemoClientProps) {
  // State variables
  const [activeRole, setActiveRole] = useState<'acheteur' | 'marchand' | 'apporteur'>(initialRole)
  const [referralCode, setReferralCode] = useState<string>(initialRef)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const [showShareModal, setShowShareModal] = useState<boolean>(false)

  // Dynamic Settings State
  const [settings, setSettings] = useState<PublicSettings>(initialSettings)

  // Active Tooltip / Button Explanation Modal State
  const [activeExplanation, setActiveExplanation] = useState<DemoExplanation | null>(null)

  // Apporteur Calculator State
  const [nbBoutiquesPro, setNbBoutiquesPro] = useState<number>(10)
  const [nbBoutiquesBusiness, setNbBoutiquesBusiness] = useState<number>(5)

  // Merchant Sandbox Modal States
  const [showStickerModal, setShowStickerModal] = useState<boolean>(false)
  const [stickerProd, setStickerProd] = useState<StickerProduct | null>(null)

  const [showWaRelanceModal, setShowWaRelanceModal] = useState<boolean>(false)
  const [relanceClient, setRelanceClient] = useState<RelanceClient | null>(null)

  const [showScanModal, setShowScanModal] = useState<boolean>(false)
  const [showCloudScannerModal, setShowCloudScannerModal] = useState<boolean>(false)

  // Merchant POS Cart state
  const [posCart, setPosCart] = useState<PosCartItem[]>([
    { id: '1', name: 'Sac de Riz Parfumé 50kg', price: 22500, qty: 1, ean: '2008492019482' },
    { id: '2', name: 'Huile Dinor 5L', price: 7500, qty: 2, ean: '2004928104829' },
  ])

  // WhatsApp simulation chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Bonjour ! Bienvenue sur Nopalou WhatsApp . Que recherchez-vous aujourd\'hui ? (ex: Riz 50kg, iPhone 15, Forfait Orange 5Go, Appartement Mermoz)', time: '10:00' },
  ])
  const [chatInput, setChatInput] = useState('')

  // Fetch dynamic settings from API on mount
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.ok ? res.json() : null)
      .then((data: PublicSettings | null) => {
        if (data) {
          setSettings(prev => ({ ...prev, ...data }))
        }
      })
      .catch(() => {})
  }, [])

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const shareableUrl = currentHost + '/demo?role=' + activeRole + (referralCode ? '&ref=' + referralCode : '')

  const handleRoleChange = (role: 'acheteur' | 'marchand' | 'apporteur') => {
    setActiveRole(role)
  }

  // DYNAMIC PRICING AND COMMISSION VALUES FROM BACKEND SETTINGS
  const prixPro = Number(settings.plan_pro_prix) || 5000
  const prixBusiness = Number(settings.plan_business_prix) || 10000
  const tauxCommissionPourcent = Number(settings.apporteur_taux_commission) || 20
  const tauxCommissionDecimal = tauxCommissionPourcent / 100
  const labelPro = settings.plan_pro_label || 'Boutique Pro'
  const labelBusiness = settings.plan_business_label || 'Boutique Business'

  const commissionProParUnite = Math.round(prixPro * tauxCommissionDecimal)
  const commissionBusinessParUnite = Math.round(prixBusiness * tauxCommissionDecimal)

  const caTotalGenerer = (nbBoutiquesPro * prixPro) + (nbBoutiquesBusiness * prixBusiness)
  const commissionMensuelle = Math.round(caTotalGenerer * tauxCommissionDecimal)
  const commissionAnnuelle = commissionMensuelle * 12

  const totalPosCart = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = chatInput.trim()
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeNow }])
    setChatInput('')

    setTimeout(() => {
      let botReply = '3 résultats trouvés pour "' + userMsg + '" au meilleur prix :\n\n1. Auchan Dakar : 21 900 FCFA\n2. Boutique Touba Express (Vendeur Pro) : 21 500 FCFA (En stock)\n\nAppuyez sur [Commander] pour commander par Wave ou Orange Money !'
      
      if (userMsg.toLowerCase().includes('immo') || userMsg.toLowerCase().includes('appartement')) {
        botReply = '2 Appartements trouvés à Mermoz & Almadies :\n• Studio meublé Mermoz : 250 000 FCFA/mois\n• F3 Almadies : 450 000 FCFA/mois\n\nContact direct bailleur certifié sur Nopalou !'
      } else if (userMsg.toLowerCase().includes('telecom') || userMsg.toLowerCase().includes('forfait') || userMsg.toLowerCase().includes('orange')) {
        botReply = 'Meilleur Pass Internet actuellement :\n• Orange Pass Max 10Go / 30j : 5 000 FCFA\n• Free Sénégal Illimité Week-end : 3 000 FCFA\n\nComparez les 25 forfaits sur nopalou.com/telecom !'
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    }, 600)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }

  const handleShareWhatsApp = () => {
    const message = 'Découvre Nopalou, la plateforme tout-en-un au Sénégal ! \n\n- Comparateur de prix & Forfaits Telecom\n- Caisse enregistreuse POS & Carnet de crédits marchands\n- Assistant WhatsApp Bot 24/7\n- Programme Apporteur (' + tauxCommissionPourcent + '% commission récurrente)\n\nTest la démo interactive ici : ' + shareableUrl
    const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(message)
    window.open(url, '_blank')
  }

  const handleSimulateScanItem = () => {
    setShowScanModal(true)
    setTimeout(() => {
      setPosCart(prev => [
        ...prev,
        { id: String(Date.now()), name: 'Lait Bonnet Rouge 400g', price: 1200, qty: 1, ean: '2009841029412' }
      ])
    }, 1500)
  }

  const handleScrollToSimulator = () => {
    const el = document.getElementById('simulateur-section')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="page-container" style={{ paddingTop: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Navigation & Header */}
        <DemoHeader
          labelPro={labelPro}
          activeExplanation={activeExplanation}
          onCloseExplanation={() => setActiveExplanation(null)}
        />

        {/* Hero de présentation */}
        <DemoHero
          tauxCommissionPourcent={tauxCommissionPourcent}
          onScrollToSimulator={handleScrollToSimulator}
        />

        {/* Simulateur Live à 3 Parcours */}
        <section id="simulateur-section" style={{ display: 'flex', flexDirection: 'column', gap: 18, scrollMarginTop: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ alignSelf: 'flex-start', background: '#FFF7ED', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              SIMULATEUR D&apos;ÉCRAN BAC À SABLE PAS-À-PAS
            </span>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
              Choisissez un profil pour tester l&apos;interface réelle
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
              Cliquez sur les onglets et les boutons pour tester les fonctionnalités en direct.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 8,
              background: 'var(--card)',
              padding: 6,
              borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleChange('acheteur')}
              style={{
                background: activeRole === 'acheteur' ? 'linear-gradient(90deg, #C75B00, #EA580C)' : 'var(--bg)',
                color: activeRole === 'acheteur' ? '#FFF' : 'var(--text1)',
                border: activeRole === 'acheteur' ? 'none' : '1px solid var(--border)',
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3
              }}
            >
              <ShoppingCart size={18} />
              <span>1. Parcours Acheteur Malin</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'acheteur' ? 0.9 : 0.7, fontWeight: 400 }}>
                Comparateur &amp; WhatsApp
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('marchand')}
              style={{
                background: activeRole === 'marchand' ? 'linear-gradient(90deg, #0D9488, #10B981)' : 'var(--bg)',
                color: activeRole === 'marchand' ? '#FFF' : 'var(--text1)',
                border: activeRole === 'marchand' ? 'none' : '1px solid var(--border)',
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Store size={18} />
              <span>2. Parcours Marchand POS</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'marchand' ? 0.9 : 0.7, fontWeight: 400 }}>
                Caisse POS, Scan EAN-13 &amp; Dettes
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('apporteur')}
              style={{
                background: activeRole === 'apporteur' ? 'linear-gradient(90deg, #7C3AED, #6366F1)' : 'var(--bg)',
                color: activeRole === 'apporteur' ? '#FFF' : 'var(--text1)',
                border: activeRole === 'apporteur' ? 'none' : '1px solid var(--border)',
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Briefcase size={18} />
              <span>3. Parcours Apporteur d&apos;Affaires</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'apporteur' ? 0.9 : 0.7, fontWeight: 400 }}>
                Commissions {tauxCommissionPourcent}% &amp; Kit Commercial
              </span>
            </button>
          </div>

          {/* SIMULATOR SCREEN FRAME */}
          <div
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: '#0F172A',
              overflow: 'hidden',
              boxShadow: 'var(--shadow2)',
              color: '#FFFFFF'
            }}
          >
            {/* Window header */}
            <div
              style={{
                background: '#020617',
                padding: '10px 14px',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginLeft: 8 }}>
                  nopalou.com/demo/{activeRole}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', background: '#1E293B', padding: '3px 10px', borderRadius: 20 }}>
                MODE SIMULATION : {activeRole.toUpperCase()}
              </span>
            </div>

            {/* Window body */}
            <div style={{ padding: '20px 16px', minHeight: 380 }}>
              {activeRole === 'marchand' && (
                <DemoMerchantSandbox
                  posCart={posCart}
                  totalPosCart={totalPosCart}
                  onSimulateScanItem={handleSimulateScanItem}
                  onOpenCloudScanner={() => setShowCloudScannerModal(true)}
                  onOpenSticker={p => {
                    setStickerProd(p)
                    setShowStickerModal(true)
                  }}
                  onOpenRelance={c => {
                    setRelanceClient(c)
                    setShowWaRelanceModal(true)
                  }}
                  onSelectExplanation={exp => setActiveExplanation(exp)}
                />
              )}

              {activeRole === 'acheteur' && (
                <DemoAcheteurSandbox
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  onChatInputChange={val => setChatInput(val)}
                  onSendChat={handleSendChat}
                />
              )}

              {activeRole === 'apporteur' && <DemoApporteurSandbox />}
            </div>
          </div>
        </section>

        {/* Calculateur de Gains Apporteur Dynamique */}
        <DemoCalculator
          tauxCommissionPourcent={tauxCommissionPourcent}
          labelPro={labelPro}
          prixPro={prixPro}
          nbBoutiquesPro={nbBoutiquesPro}
          onNbBoutiquesProChange={val => setNbBoutiquesPro(val)}
          commissionProParUnite={commissionProParUnite}
          labelBusiness={labelBusiness}
          prixBusiness={prixBusiness}
          nbBoutiquesBusiness={nbBoutiquesBusiness}
          onNbBoutiquesBusinessChange={val => setNbBoutiquesBusiness(val)}
          commissionBusinessParUnite={commissionBusinessParUnite}
          commissionMensuelle={commissionMensuelle}
          commissionAnnuelle={commissionAnnuelle}
          onBecomeApporteur={() => {
            setActiveRole('apporteur')
            handleScrollToSimulator()
          }}
        />
      </div>

      {/* Modals de Démo */}
      <DemoModals
        showStickerModal={showStickerModal}
        stickerProd={stickerProd}
        onCloseSticker={() => setShowStickerModal(false)}
        showWaRelanceModal={showWaRelanceModal}
        relanceClient={relanceClient}
        onCloseWaRelance={() => setShowWaRelanceModal(false)}
        showScanModal={showScanModal}
        onCloseScan={() => setShowScanModal(false)}
        showCloudScannerModal={showCloudScannerModal}
        onCloseCloudScanner={() => setShowCloudScannerModal(false)}
        showShareModal={showShareModal}
        onCloseShare={() => setShowShareModal(false)}
        referralCode={referralCode}
        onReferralCodeChange={code => setReferralCode(code)}
        shareableUrl={shareableUrl}
        copiedLink={copiedLink}
        onCopyLink={handleCopyLink}
        onShareWhatsApp={handleShareWhatsApp}
      />
    </div>
  )
}
