'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, UploadCloud, Users } from 'lucide-react'

export default function TarifsComparatifShopify() {
  return (
    <>
      {/* ── COMPARATIF DIRECT NOPALOU VS SHOPIFY & WOOCOMMERCE ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Comparatif</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#1C2B4A', marginTop: 10 }}>
            Pourquoi abandonner Shopify au Sénégal ?
          </h2>
        </div>

        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontWeight: 800, color: '#334155' }}>Critères clés</th>
                <th style={{ padding: '16px 20px', fontWeight: 900, color: '#C75B00', background: '#fff7ed', fontSize: 16 }}>Nopalou SaaS</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: '#64748b' }}>Shopify</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Coût d&apos;entrée</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Dès 2.500 FCFA (1m offert)</td>
                <td style={{ padding: '16px 24px', color: '#64748b' }}>29$ / mois (~18.000 FCFA)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Carte bancaire requise</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>NON (Abonnement par Wave)</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>OUI (Visa / Mastercard)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Paiement Client (Wave/OM)</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Natif (Encaissement direct)</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Via intégrateurs (Difficile)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Commission sur ventes</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>0% Commission</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>2% à 5% par transaction</td>
              </tr>
              <tr>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Vente WhatsApp</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>100% Intégré</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Non / Plugins payants</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── BANDEAU MIGRATION 1-CLIC SHOPIFY / WOOCOMMERCE / EXCEL ── */}
        <div
          style={{
            marginTop: 24,
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
            borderRadius: 18,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 24px rgba(28,43,74,0.12)'
          }}
        >
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <UploadCloud size={18} color="#fed7aa" />
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Vous avez déjà une boutique ou un fichier Excel ?
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              Ne perdez aucune donnée : importez vos articles, prix et photos depuis un export <strong>Shopify, WooCommerce ou Excel</strong> en 2 minutes sans rien ressaisir.
            </p>
          </div>

          <Link
            href="/migration"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(199,91,0,0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Migrer mon catalogue</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── SECTION SOURCING ALIBABA / ALIEXPRESS ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 40px', padding: '0 20px' }}>
        <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>
            Vous achetez sur Alibaba ou AliExpress ? Vendez facilement au Sénégal !
          </h2>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>
            De nombreux commerçants à Dakar s&apos;approvisionnent en gros sur <strong>Alibaba, AliExpress, Shein ou 1688</strong> pour revendre des vêtements, téléphones, cosmétiques et accessoires. Avec Nopalou :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#1C2B4A', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 8 }}>1</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Sourcing en gros</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Commandez vos articles sur Alibaba/AliExpress à prix de gros.</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#C75B00', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 8 }}>2</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Boutique Nopalou</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Publiez votre catalogue en 2 min avec vos prix en FCFA.</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#0A5C36', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 8 }}>3</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Vente WhatsApp</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Recevez l&apos;argent directement par Wave ou Orange Money à la commande.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANDEAU PROGRAMME APPORTEUR D'AFFAIRES (20% RÉCURRENT) ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 60px', padding: '0 20px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF7ED 100%)',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1.5px solid #FED7AA',
            boxShadow: '0 4px 16px rgba(199,91,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(199,91,0,0.12)', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Recommandez Nopalou et touchez 20% de commission à vie
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.5 }}>
              Vous connaissez des commerçants ou des agences immobilières à Dakar ? Partagez votre lien de parrainage et touchez chaque mois 20% de leurs abonnements directement sur votre compte Wave.
            </p>
          </div>

          <Link
            href="/compte/apporteur"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Rejoindre le programme</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  )
}
