import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function MerchantComparisonTable() {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 20px' }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Comparatif Objectif
        </span>
        <h2 style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0 6px' }}>
          Pourquoi Choisir Nopalou face aux Alternatives ?
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text2, #5A4E42)' }}>
          Comparez en un coup d&apos;œil ce qui fait la différence pour votre rentabilité au quotidien à Dakar.
        </p>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--navy, #1C2B4A)', width: '28%' }}>Critère Clé</th>
                <th style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--accent, #C75B00)', background: '#FFF7ED', width: '26%' }}>
                  Nopalou Retail &amp; POS
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '15%' }}>WhatsApp Seul</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '15%' }}>Cahier Papier</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '16%' }}>Shopify ($29/m)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Commission sur vos ventes</td>
                <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>0% (Direct Wave/OM)</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>0%</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>0%</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>2% + Frais passerelle</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Caisse POS Hors-Ligne (Sans Net)</td>
                <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>100% Hors-Ligne (PWA)</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>Dépend d&apos;Internet</td>
                <td style={{ padding: '12px 16px', color: '#16A34A' }}>Manuel</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>Connexion requise</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Carnet Dettes &amp; Relance Wave</td>
                <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>Relances 1-Clic Wave</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>Messages manuels</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>Oublis fréquents</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>Non adapté Sénégal</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Matériel supplémentaire requis</td>
                <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>0 F (Votre smartphone)</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>Smartphone</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>Cahier d&apos;écolier</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>PC obligatoire</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Prix d&apos;accès</td>
                <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: 'var(--accent, #C75B00)' }}>Dès 2 500 F/mois (30j offerts)</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>Gratuit (3h perdues/j)</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>Cahier (~1 000 F)</td>
                <td style={{ padding: '12px 16px', color: '#DC2626' }}>29 $ (~18 000 F) + Visa</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
            Consulter l&apos;analyse complète et les études de cas détaillées :
          </span>
          <Link href="/pourquoi-nopalou" style={{ color: 'var(--accent, #C75B00)', fontWeight: 800, fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>Lire le comparatif complet Pourquoi Choisir Nopalou ?</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  )
}
