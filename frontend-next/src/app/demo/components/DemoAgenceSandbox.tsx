'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  FileText,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react'

export default function DemoAgenceSandbox() {
  const [encaisse, setEncaisse] = useState(false)
  const [quittanceGeneree, setQuittanceGeneree] = useState(false)
  const [lienEnvoye, setLienEnvoye] = useState(false)

  const handleSimulatePayment = () => {
    setEncaisse(true)
    setQuittanceGeneree(true)
  }

  const handleSendLink = () => {
    setLienEnvoye(true)
    setTimeout(() => setLienEnvoye(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 1. KPI Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: 10
        }}
      >
        <div style={{ background: '#1E293B', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>LOTS SOUS MANDAT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', marginTop: 2 }}>18 Biens</div>
          <div style={{ fontSize: 10.5, color: '#10B981' }}>Dakar &amp; Almadies</div>
        </div>

        <div style={{ background: '#1E293B', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>LOYERS ENCAISSÉS</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981', marginTop: 2 }}>
            {encaisse ? '5 200 000 FCFA' : '4 850 000 FCFA'}
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Mois en cours</div>
        </div>

        <div style={{ background: '#1E293B', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>TAUX RECOUVREMENT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: encaisse ? '#10B981' : '#F59E0B', marginTop: 2 }}>
            {encaisse ? '100%' : '93.2%'}
          </div>
          <div style={{ fontSize: 10.5, color: encaisse ? '#10B981' : '#F59E0B' }}>
            {encaisse ? 'Zéro retard' : '1 échéance en attente'}
          </div>
        </div>
      </div>

      {/* 2. Simulation Dossier Locataire Actif */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#60A5FA" />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#F8FAFC' }}>
                Bail F3 Standing — Mermoz Pyrotechnie
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                Locataire : M. Amadou Sow · Loyer : 350 000 FCFA/mois
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 20,
              background: encaisse ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
              color: encaisse ? '#86EFAC' : '#FCD34D',
              border: encaisse ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(245,158,11,0.4)'
            }}
          >
            {encaisse ? 'PAYÉ PAR WAVE' : 'ÉCHÉANCE DU 05/09 EN ATTENTE'}
          </span>
        </div>

        {/* Détails du bail */}
        <div style={{ background: '#0F172A', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>Bail conforme OHADA &amp; Loi Sénégalaise :</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>Actif (Bail N° BL-2026-084)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>Caution consignée :</span>
            <span>700 000 FCFA (2 mois)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>Lien direct de règlement :</span>
            <span style={{ color: '#60A5FA' }}>nopalou.com/payer-loyer/ECH-350K</span>
          </div>
        </div>

        {/* Boutons d'action interactive */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSendLink}
            style={{
              background: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <CreditCard size={14} />
            <span>{lienEnvoye ? 'Lien WhatsApp envoyé !' : 'Envoyer relance Wave 1-clic'}</span>
          </button>

          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={encaisse}
            style={{
              background: encaisse ? '#166534' : '#16A34A',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: encaisse ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <CheckCircle2 size={14} />
            <span>{encaisse ? 'Loyer encaissé (350 000 FCFA)' : 'Simuler encaissement locataire'}</span>
          </button>
        </div>

        {/* Visualisation Quittance générée */}
        {quittanceGeneree && (
          <div
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#86EFAC" />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#86EFAC' }}>
                  Quittance officielle PDFKit générée automatiquement
                </div>
                <div style={{ fontSize: 11, color: '#CBD5E1' }}>
                  Numéro QT-2026-09-084 avec QR Code d&apos;authenticité anti-fraude
                </div>
              </div>
            </div>

            <span style={{ fontSize: 11, fontWeight: 800, color: '#60A5FA', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Download size={13} />
              Téléchargement PDF actif
            </span>
          </div>
        )}
      </div>

      {/* 3. Accès Espace Réel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          Toutes ces fonctionnalités sont disponibles dès le plan Agence Starter gratuit.
        </span>

        <Link
          href="/agence"
          style={{
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>Découvrir l&apos;Espace Agence Pro</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
