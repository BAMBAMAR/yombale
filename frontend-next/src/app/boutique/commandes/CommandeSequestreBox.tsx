'use client'

import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { Commande } from './types'

interface CommandeSequestreBoxProps {
  commande: Commande
  onUpdate: () => void
}

export default function CommandeSequestreBox({
  commande,
  onUpdate,
}: CommandeSequestreBoxProps) {
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinSaisi, setPinSaisi] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinErreur, setPinErreur] = useState<string | null>(null)

  const isSequestreBloque =
    commande.statut_sequestre === 'bloque' ||
    (commande as any).statut_sequestre === 'bloque'

  if (!isSequestreBloque) return null

  async function debloquerSequestre() {
    if (!pinSaisi.trim()) {
      setPinErreur('Veuillez entrer le code PIN secret à 4 chiffres fourni par le client.')
      return
    }
    try {
      setPinLoading(true)
      setPinErreur(null)
      const res = await fetch('/api/paiement-sequestre/debloquer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: commande.reference,
          codePin: pinSaisi.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPinErreur(data.error || 'Code PIN incorrect')
        return
      }
      alert(data.message || 'Fonds débloqués avec succès ! Commande validée comme livrée.')
      setShowPinModal(false)
      onUpdate()
    } catch {
      setPinErreur('Erreur réseau lors de la validation du code PIN')
    } finally {
      setPinLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#f0fdf4',
        border: '1.5px solid #86efac',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} style={{ color: '#16a34a' }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#166534' }}>
              Nopalou Pay Safe — Paiement sous séquestre
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#15803d' }}>
              Les fonds sont sécurisés. Demandez le code PIN à 4 chiffres au client lors de la
              remise du colis pour débloquer le paiement.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowPinModal(!showPinModal)
            setPinErreur(null)
            setPinSaisi('')
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#16a34a',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Valider Code PIN Livreur</span>
        </button>
      </div>

      {showPinModal && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid #bbf7d0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
            Saisir le Code PIN à 4 chiffres remis par le client :
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              maxLength={6}
              value={pinSaisi}
              onChange={(e) => setPinSaisi(e.target.value)}
              placeholder="Ex : 4819"
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #86efac',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 2,
                width: 120,
                textAlign: 'center',
              }}
            />
            <button
              type="button"
              onClick={debloquerSequestre}
              disabled={pinLoading}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#15803d',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                cursor: pinLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {pinLoading ? 'Vérification…' : 'Débloquer les fonds ✓'}
            </button>
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: 12,
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
          {pinErreur && (
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
              {pinErreur}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
