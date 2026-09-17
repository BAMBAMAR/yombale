'use client'

import React, { useState } from 'react'
import {
  Printer,
  Smartphone,
  ScanBarcode,
  Bluetooth,
  CheckCircle2,
  HelpCircle,
  X,
  Zap,
  Radio,
  ExternalLink,
} from 'lucide-react'

interface PosMaterielGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onConnecterBluetooth?: () => Promise<void>
  onTestPrint?: () => Promise<void>
  btDeviceName?: string | null
  formatTicketThermique?: '80mm' | '58mm'
  setFormatTicketThermique?: (f: '80mm' | '58mm') => void
  onOuvrirPairageScanner?: () => void
}

type TabType = 'imprimantes' | 'terminaux' | 'scanners'

export default function PosMaterielGuideModal({
  isOpen,
  onClose,
  onConnecterBluetooth,
  onTestPrint,
  btDeviceName,
  formatTicketThermique: formatTicketThermiqueProp,
  setFormatTicketThermique: setFormatTicketThermiqueProp,
  onOuvrirPairageScanner,
}: PosMaterielGuideModalProps) {
  const [internalFormat, setInternalFormat] = useState<'80mm' | '58mm'>('80mm')
  const formatTicketThermique = formatTicketThermiqueProp || internalFormat
  const setFormatTicketThermique = setFormatTicketThermiqueProp || setInternalFormat
  const [activeTab, setActiveTab] = useState<TabType>('imprimantes')
  const [testPrintLoading, setTestPrintLoading] = useState(false)

  if (!isOpen) return null

  const handleTestPrint = async () => {
    if (!onTestPrint) return
    setTestPrintLoading(true)
    try {
      await onTestPrint()
    } finally {
      setTestPrintLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #E8DDD2',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#FFF7ED',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Printer size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Pack Matériel &amp; Périphériques POS
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Certification matérielle officielle Nopalou Box (Sénégal)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Onglets Métier */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
          <button
            type="button"
            onClick={() => setActiveTab('imprimantes')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'imprimantes' ? 'var(--navy, #1C2B4A)' : '#f8fafc',
              color: activeTab === 'imprimantes' ? '#ffffff' : '#475569',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Printer size={14} />
            <span>Imprimantes Tickets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminaux')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'terminaux' ? 'var(--navy, #1C2B4A)' : '#f8fafc',
              color: activeTab === 'terminaux' ? '#ffffff' : '#475569',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Smartphone size={14} />
            <span>Terminaux Sunmi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scanners')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'scanners' ? 'var(--navy, #1C2B4A)' : '#f8fafc',
              color: activeTab === 'scanners' ? '#ffffff' : '#475569',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <ScanBarcode size={14} />
            <span>Scanners &amp; Douchettes</span>
          </button>
        </div>

        {/* Contenu Onglet 1 : Imprimantes Thermiques */}
        {activeTab === 'imprimantes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                  Statut de l'imprimante thermique Bluetooth :
                </span>
                {btDeviceName ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--price, #0A5C36)',
                      background: '#dcfce7',
                      padding: '3px 8px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={12} /> {btDeviceName}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748b',
                      background: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: 12,
                    }}
                  >
                    Non connectée (Mode navigateur)
                  </span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.45 }}>
                Nopalou POS prend en charge toutes les imprimantes thermiques ESC/POS standards du marché (Xprinter, Sunmi, Netum, Rongta). Vous pouvez imprimer soit en direct par <strong>Bluetooth sans fil</strong> (sur Chrome/Edge), soit via la boîte d'impression native de votre appareil.
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {onConnecterBluetooth && (
                  <button
                    type="button"
                    onClick={onConnecterBluetooth}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--accent, #C75B00)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Bluetooth size={14} />
                    <span>Appairer Imprimante Bluetooth</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={testPrintLoading}
                  style={{
                    padding: '8px 14px',
                    background: '#ffffff',
                    color: 'var(--navy, #1C2B4A)',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Printer size={14} />
                  <span>Imprimer un Ticket Test</span>
                </button>
              </div>
            </div>

            {/* Réglage Largeur Rouleau */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Format du rouleau thermique papier :
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['58mm', '80mm'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormatTicketThermique(fmt)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: formatTicketThermique === fmt ? '1.5px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                      background: formatTicketThermique === fmt ? '#FFF7ED' : '#ffffff',
                      color: formatTicketThermique === fmt ? 'var(--accent, #C75B00)' : '#475569',
                    }}
                  >
                    {fmt} {fmt === '58mm' ? '(Standard portable)' : '(Grand caisse)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenu Onglet 2 : Terminaux Android Sunmi */}
        {activeTab === 'terminaux' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Terminaux Tout-en-Un Certifiés (Sunmi V2, V2 Pro, T2 Lite)
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                Nopalou est optimisé pour fonctionner sur les terminaux Android POS du commerce avec écran tactile et imprimante 58mm intégrée.
              </p>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: 18, fontSize: 12.5, color: '#334155', lineHeight: 1.6 }}>
                <li><strong>Installation PWA en 10 secondes :</strong> Ouvrez Chrome sur le terminal, connectez-vous sur <code>nopalou.com/boutique/caisse</code> et appuyez sur « Ajouter à l'écran d'accueil ».</li>
                <li><strong>Imprimante intégrée :</strong> Activez l'impression directe sans fil ou standard.</li>
                <li><strong>Autonomie batterie :</strong> Idéal pour les vendeurs mobiles, marchés et livraisons.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Contenu Onglet 3 : Scanners & Douchettes */}
        {activeTab === 'scanners' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Douchettes Code-Barres &amp; Smartphone Scanner
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                Scannez vos articles instantanément avec 3 solutions différentes :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Zap size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12.5, color: '#334155' }}>
                    <strong>Douchette USB ou sans fil 2.4GHz :</strong> Branchez simplement le dongle. Les articles bippés s'ajoutent automatiquement au panier en moins d'une demi-seconde.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Radio size={16} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12.5, color: '#334155' }}>
                    <strong>Transformer un Smartphone en Douchette sans fil :</strong> Utilisez la caméra de votre téléphone comme lecteur déporté en scannant le QR code de session.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOuvrirPairageScanner?.()
                }}
                style={{
                  marginTop: 12,
                  padding: '9px 14px',
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Smartphone size={14} />
                <span>Ouvrir le Pairage Smartphone Scanner</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
