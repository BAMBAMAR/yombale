import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  CreditCard,
  FileCheck2,
  ArrowRight,
  HelpCircle,
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react'
import PayerLoyerForm from './components/PayerLoyerForm'

export const metadata: Metadata = {
  title: 'Payer mon Loyer en Ligne (Wave & Orange Money) — Nopalou Immo',
  description: 'Portail sécurisé de règlement de loyer au Sénégal : payez en 1 clic avec Wave ou Orange Money et téléchargez votre quittance certifiée conforme.',
  keywords: [
    'payer loyer dakar',
    'paiement loyer wave sénégal',
    'quittance de loyer dakar',
    'nopalou immo paiement loyer',
    'loyer orange money sénégal'
  ],
}

export default function PayerLoyerHubPage() {
  return (
    <main
      style={{
        minHeight: '85vh',
        background: 'var(--bg, #F8F5F0)',
        padding: '36px 16px 60px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#DCFCE7',
              color: 'var(--price, #0A5C36)',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 12,
              border: '1px solid #BBF7D0'
            }}
          >
            <ShieldCheck size={14} color="var(--price, #0A5C36)" />
            <span>PORTAIL OFFICIEL LOCATAIRE SÉCURISÉ</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 10px',
              lineHeight: 1.25
            }}
          >
            Paiement de Loyer 1-Clic
          </h1>

          <p
            style={{
              fontSize: 14.5,
              color: 'var(--text-subtle, #5A4E42)',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.5
            }}
          >
            Réglez votre loyer mensuel par Wave ou Orange Money et obtenez immédiatement votre quittance officielle certifiée avec QR Code.
          </p>
        </div>

        {/* Formulaire de saisie du code échéance */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: '24px 20px',
            border: '1px solid var(--border, #E8DDD2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            marginBottom: 28
          }}
        >
          <PayerLoyerForm />
        </div>

        {/* 3 Garanties Locataire */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: 12,
            marginBottom: 28
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '14px 12px',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}
            >
              <CreditCard size={18} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 2 }}>
              Wave &amp; OM Directs
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle, #5A4E42)' }}>
              Aucun frais supplémentaire
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '14px 12px',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#DCFCE7',
                color: 'var(--price, #0A5C36)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}
            >
              <FileCheck2 size={18} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 2 }}>
              Quittance Instantanée
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle, #5A4E42)' }}>
              PDF officiel horodaté
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '14px 12px',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FEF3C7',
                color: '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}
            >
              <Clock size={18} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 2 }}>
              Avis Automatique
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle, #5A4E42)' }}>
              Agence &amp; bailleur notifiés
            </div>
          </div>
        </div>

        {/* Accès direct pour locataires enregistrés */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #111a2e 100%)',
            borderRadius: 16,
            padding: '18px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
              Vous avez un compte locataire Nopalou ?
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              Retrouvez l&apos;historique complet de tous vos baux et quittances.
            </div>
          </div>

          <Link
            href="/compte?tab=mes-locations"
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0
            }}
          >
            <span>Mon Espace Locataire</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </main>
  )
}
