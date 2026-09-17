'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  X,
  HelpCircle
} from 'lucide-react'

interface BadgePaySafeProps {
  type?: 'produit' | 'immo'
  compact?: boolean
}

export default function BadgePaySafe({ type = 'produit', compact = false }: BadgePaySafeProps) {
  const [modalOuverte, setModalOuverte] = useState(false)

  const isImmo = type === 'immo'

  return (
    <>
      {/* Badge Cliquable */}
      <button
        type="button"
        onClick={() => setModalOuverte(true)}
        aria-label="En savoir plus sur le paiement sécurisé Nopalou Pay Safe"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: compact ? '8px 12px' : '10px 14px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
          border: '1.5px solid #A7F3D0',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 3px rgba(16, 185, 129, 0.08)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: compact ? 26 : 30,
              height: compact ? 26 : 30,
              borderRadius: '50%',
              background: '#0A5C36',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={compact ? 15 : 18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: compact ? 11.5 : 12.5,
                  fontWeight: 900,
                  color: '#0A5C36',
                  letterSpacing: '-0.01em'
                }}
              >
                Nopalou Pay Safe
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  background: '#DCFCE7',
                  color: '#15803D',
                  padding: '1px 6px',
                  borderRadius: 6
                }}
              >
                Séquestre Garanti
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: compact ? 10.5 : 11,
                color: '#166534',
                fontWeight: 600
              }}
            >
              {isImmo
                ? 'Loyer & caution protégés jusqu’à remise des clés'
                : 'Fonds bloqués jusqu’à vérification physique du colis'}
            </p>
          </div>
        </div>

        <div style={{ color: '#0A5C36', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Comment ça marche ?</span>
          <HelpCircle size={14} />
        </div>
      </button>

      {/* Modale d'explication du Séquestre Nopalou Pay Safe */}
      {modalOuverte && (
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
            padding: 16
          }}
          onClick={() => setModalOuverte(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 500,
              border: '1px solid #E8DDD2',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxHeight: '90vh',
              overflowY: 'auto',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Entête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(10, 92, 54, 0.1)',
                    color: '#0A5C36',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1C2B4A' }}>
                    Garantie Nopalou Pay Safe
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Protection anti-fraude et séquestre certifié au Sénégal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                aria-label="Fermer"
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
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Introduction rassurante */}
            <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.45 }}>
              Fini les angoisses d&apos;acompte versé sans recevoir votre commande ou votre logement. Grâce au compte de cantonnement sécurisé de Nopalou, vos fonds sont préservés jusqu&apos;à votre validation explicite.
            </p>

            {/* 4 Étapes Clés */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Étape 1 */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#DBEAFE',
                    color: '#1D4ED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: 13
                  }}
                >
                  1
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: '#1C2B4A' }}>
                    Paiement Mobile Money (Wave / Orange Money)
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    Vous effectuez votre paiement officiel en 1 clic. Le commerçant ou bailleur est notifié instantanément de la réservation.
                  </p>
                </div>
              </div>

              {/* Étape 2 */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#FEF3C7',
                    color: '#B45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: 13
                  }}
                >
                  2
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: '#1C2B4A' }}>
                    Fonds bloqués sous Séquestre Nopalou
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    L&apos;argent ne va pas directement sur le compte du vendeur. Il reste consigné sur notre compte séquestre bancaire indépendant.
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#EDE8E1',
                    color: '#1C2B4A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: 13
                  }}
                >
                  3
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: '#1C2B4A' }}>
                    {isImmo ? 'Visite & Remise des Clés' : 'Livraison & Contrôle du Colis'}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    {isImmo
                      ? 'Vous visitez le bien, signez le bail et recevez les clés. Vous disposez d’un code PIN secret de validation.'
                      : 'Le livreur Tiak-Tiak arrive. Vous déballez le colis et vérifiez la totale conformité de l’article avec l’annonce.'}
                  </p>
                </div>
              </div>

              {/* Étape 4 */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: 13
                  }}
                >
                  4
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: '#1C2B4A' }}>
                    Libération du Paiement ou Remboursement 24h
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    Tout est conforme ? Le vendeur reçoit son argent. Un problème ou produit non conforme ? Notre support basé à Dakar bloque le paiement et vous rembourse intégralement.
                  </p>
                </div>
              </div>
            </div>

            {/* Note de réassurance */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <CheckCircle2 size={18} color="#0A5C36" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                Service client réactif sur WhatsApp 7j/7 pour toute médiation.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setModalOuverte(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: '#1C2B4A',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              J&apos;ai compris, continuer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
