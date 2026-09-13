import React from 'react'
import { Copy, FileText, ExternalLink, Percent, TrendingUp } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface KitComTabApporteurProps {
  prixDecouverte: number
  prixPro: number
  prixBusiness: number
  tauxApporteur: number
  apporteurTextePerso: string
  onCopy: (txt: string, label: string) => void
}

export default function KitComTabApporteur({
  prixDecouverte,
  prixPro,
  prixBusiness,
  tauxApporteur,
  apporteurTextePerso,
  onCopy,
}: KitComTabApporteurProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Grille Commission Unique Sync DB */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Percent size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Grille de Commission Récurrente ({tauxApporteur}%)
          </h2>
        </div>
        <div
          style={{
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
            marginBottom: 16,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border, #E2E8F0)' }}>
                <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Formule Recrutée</th>
                <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Prix Mensuel</th>
                <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Vos Gains / Mois ({tauxApporteur}%)</th>
                <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Gain sur Paiement Annuel (-25%)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: 12, fontWeight: 700 }}>Boutique Taf Taf</td>
                <td style={{ padding: 12 }}>{fcfa(prixDecouverte)}/mois</td>
                <td style={{ padding: 12, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                  {fcfa(Math.round((prixDecouverte * tauxApporteur) / 100))}/mois
                </td>
                <td style={{ padding: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
                  {fcfa(Math.round((prixDecouverte * 12 * 0.75 * tauxApporteur) / 100))} / an
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: 12, fontWeight: 700 }}>Boutique Pro</td>
                <td style={{ padding: 12 }}>{fcfa(prixPro)}/mois</td>
                <td style={{ padding: 12, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                  {fcfa(Math.round((prixPro * tauxApporteur) / 100))}/mois
                </td>
                <td style={{ padding: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
                  {fcfa(Math.round((prixPro * 12 * 0.75 * tauxApporteur) / 100))} / an
                </td>
              </tr>
              <tr>
                <td style={{ padding: 12, fontWeight: 700 }}>Boutique Business</td>
                <td style={{ padding: 12 }}>{fcfa(prixBusiness)}/mois</td>
                <td style={{ padding: 12, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                  {fcfa(Math.round((prixBusiness * tauxApporteur) / 100))}/mois
                </td>
                <td style={{ padding: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
                  {fcfa(Math.round((prixBusiness * 12 * 0.75 * tauxApporteur) / 100))} / an
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remises multi-durées appliquées aux commerçants */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            fontSize: 13,
            color: '#475569',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Remises commerçants :</span>
          <span>3 mois (-10%)</span>
          <span>·</span>
          <span>6 mois (-15%)</span>
          <span>·</span>
          <span style={{ fontWeight: 800, color: 'var(--accent, #C75B00)' }}>12 mois (-25% / 3 mois offerts)</span>
        </div>
      </section>

      {/* Texte de Recrutement Personnalisé */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Texte de Recrutement Apporteur (Personnalisé)
          </h2>
          <button
            type="button"
            onClick={() => onCopy(apporteurTextePerso, 'Texte Recrutement')}
            style={{
              padding: '6px 14px',
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Copy size={12} />
            Copier Texte
          </button>
        </div>
        <pre
          style={{
            fontSize: 13,
            color: 'var(--navy, #1C2B4A)',
            whiteSpace: 'pre-wrap',
            background: '#F8FAFC',
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: 10,
            padding: 20,
            margin: 0,
            lineHeight: 1.8,
            fontFamily: 'inherit',
          }}
        >
          {apporteurTextePerso}
        </pre>
      </section>

      {/* Lien Brochure PDF */}
      <section>
        <div
          style={{
            border: '1.5px solid #25D366',
            background: '#F0FDF4',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FileText size={18} color="#166534" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#166534' }}>
                Brochure PDF Apporteur (13 Pages)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#15803D' }}>
              Présentation complète imprimable pour démarcher votre réseau.
            </p>
          </div>
          <a
            href="/brochure-apporteur.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 18px',
              background: '#25D366',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Ouvrir Brochure PDF <ExternalLink size={14} />
          </a>
        </div>
      </section>
    </div>
  )
}
