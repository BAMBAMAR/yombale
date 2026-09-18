'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, ArrowRight, ShieldCheck, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react'

export default function HeroAgenceHeaderView() {
  return (
    <div style={{ width: '100%', textAlign: 'center', maxWidth: 840, margin: '0 auto 16px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(10, 92, 54, 0.1)',
          color: 'var(--price, #0A5C36)',
          padding: '4px 14px',
          borderRadius: 20,
          fontSize: 11.5,
          fontWeight: 800,
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <Building2 size={13} color="var(--price, #0A5C36)" />
        <span>Espace Agences Immobilières, Administrateurs de Biens &amp; Bailleurs</span>
      </div>

      <h2
        style={{
          fontSize: 'clamp(20px, 3.2vw, 32px)',
          fontWeight: 900,
          color: 'var(--navy, #1C2B4A)',
          margin: '0 0 10px',
          lineHeight: 1.22,
          letterSpacing: '-0.02em'
        }}
      >
        L&apos;ERP Immobilier du Sénégal : Baux, Quittances, Bailleurs &amp; Loyers sur{' '}
        <span style={{ color: '#10b981' }}>Wave &amp; WhatsApp</span>
      </h2>

      <p
        style={{
          fontSize: 14,
          color: 'var(--text-subtle, #5A4E42)',
          maxWidth: 680,
          margin: '0 auto 20px',
          lineHeight: 1.5
        }}
      >
        Pilotez vos mandats, automatisez les quittances de loyer PDF certifiées OHADA avec QR code et reversez les loyers nets aux propriétaires sans litiges.
      </p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          href="/inscription?role=agence&redirect=/agence"
          style={{
            background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
            color: '#FFFFFF',
            padding: '10px 24px',
            borderRadius: 30,
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(199,91,0,0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>Créer mon agence (30 jours offerts)</span>
          <ArrowRight size={15} />
        </Link>

        <Link
          href="/agences"
          style={{
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            padding: '10px 20px',
            borderRadius: 30,
            fontSize: 13.5,
            fontWeight: 800,
            textDecoration: 'none',
            border: '1.5px solid var(--border, #E8DDD2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Building2 size={15} color="var(--accent, #C75B00)" />
          <span>Annuaire des agences</span>
        </Link>

        <Link
          href="/payer-loyer"
          style={{
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            padding: '10px 20px',
            borderRadius: 30,
            fontSize: 13.5,
            fontWeight: 800,
            textDecoration: 'none',
            border: '1.5px solid var(--border, #E8DDD2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <CreditCard size={15} color="#10b981" />
          <span>Espace locataire (Payer un loyer)</span>
        </Link>
      </div>

      <div style={{
        marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-subtle, #5A4E42)', fontWeight: 700
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckCircle2 size={14} color="var(--price, #0A5C36)" />
          <span>Plan Agence Starter 100% gratuit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckCircle2 size={14} color="var(--price, #0A5C36)" />
          <span>Quittances conformes avec QR Code</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckCircle2 size={14} color="var(--price, #0A5C36)" />
          <span>Reversements nets aux bailleurs</span>
        </div>
      </div>
    </div>
  )
}
