'use client'

import React, { useState, useMemo } from 'react'
import {
  TabType,
  CategorieCommerce,
  StatutEquipement,
  ForceDeVenteProps,
  getMatriceData,
  ForceDeVenteHeader,
  ForceDeVenteTabBar,
  ForceDeVenteTabStrategie,
  ForceDeVenteTabFormation,
  ForceDeVenteTabPitchs,
  ForceDeVenteTabGuide,
  ForceDeVenteTabSupports,
  ForceDeVenteTabGenerateur,
  ForceDeVenteTabSimulateur,
} from './components'

export default function ForceDeVenteClient({
  prixDecouverte = 2500,
  prixPro = 5000,
  prixBusiness = 10000,
  tauxApporteur = 20,
}: ForceDeVenteProps) {
  const [activeTab, setActiveTab] = useState<TabType>('strategie')
  const [toast, setToast] = useState<string | null>(null)

  // Matrice Pitchs & Objections State
  const [selectedCat, setSelectedCat] = useState<CategorieCommerce>('superette')
  const [selectedEquip, setSelectedEquip] = useState<StatutEquipement>('sans_app')

  // Personnalisation Agent State
  const [agentNom, setAgentNom] = useState('Mamadou Diallo')
  const [agentPhone, setAgentPhone] = useState('771234567')
  const [agentCode, setAgentCode] = useState('AGENT-DKR')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt)
    showToast(`${label} copié dans le presse-papier !`)
  }

  const matriceData = useMemo(() => getMatriceData(prixPro), [prixPro])

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '24px 20px 80px',
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--navy, #1C2B4A)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {toast}
        </div>
      )}

      {/* Header Principal */}
      <ForceDeVenteHeader />

      {/* Navigation Onglets (7 Tabs) */}
      <ForceDeVenteTabBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Onglet 1 : Stratégie & Quadrillage Terrain */}
      {activeTab === 'strategie' && <ForceDeVenteTabStrategie />}

      {/* Onglet 2 : Académie & Formation Commerciale */}
      {activeTab === 'formation' && <ForceDeVenteTabFormation />}

      {/* Onglet 3 : Matrice Interactive Pitchs & Objections */}
      {activeTab === 'pitchs' && (
        <ForceDeVenteTabPitchs
          matriceData={matriceData}
          selectedCat={selectedCat}
          onSelectCat={setSelectedCat}
          selectedEquip={selectedEquip}
          onSelectEquip={setSelectedEquip}
          onCopy={copyToClipboard}
        />
      )}

      {/* Onglet 4 : Guide Marchand Simplifié */}
      {activeTab === 'guide' && <ForceDeVenteTabGuide />}

      {/* Onglet 5 : Supports Print HD */}
      {activeTab === 'supports' && (
        <ForceDeVenteTabSupports agentCode={agentCode} agentPhone={agentPhone} agentNom={agentNom} />
      )}

      {/* Onglet 6 : Kit Personnalisé Agent */}
      {activeTab === 'generateur' && (
        <ForceDeVenteTabGenerateur
          agentNom={agentNom}
          onAgentNomChange={setAgentNom}
          agentPhone={agentPhone}
          onAgentPhoneChange={setAgentPhone}
          agentCode={agentCode}
          onAgentCodeChange={setAgentCode}
          onCopy={copyToClipboard}
        />
      )}

      {/* Onglet 7 : Simulateur de Rémunération */}
      {activeTab === 'simulateur' && (
        <ForceDeVenteTabSimulateur
          prixDecouverte={prixDecouverte}
          prixPro={prixPro}
          prixBusiness={prixBusiness}
          tauxApporteur={tauxApporteur}
        />
      )}
    </div>
  )
}
