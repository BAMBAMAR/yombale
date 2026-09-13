import React from 'react'
import { Download } from 'lucide-react'

interface ForceDeVenteTabSupportsProps {
  agentCode: string
  agentPhone: string
  agentNom: string
}

export default function ForceDeVenteTabSupports({
  agentCode,
  agentPhone,
  agentNom,
}: ForceDeVenteTabSupportsProps) {
  const supports = [
    {
      title: 'Flyer Démarchage A5',
      format: '1240 × 1748 px (A5 HD)',
      desc: 'Flyer prospect pour commerçants : 30j offerts, Caisse Offline, 0% com, QR démo.',
      url: `/assets/flyer-commercial-a5?code=${agentCode}&phone=${agentPhone}&nom=${encodeURIComponent(agentNom)}`,
    },
    {
      title: 'Fiche Tarifs Officielle A4',
      format: '1240 × 1754 px (A4 HD)',
      desc: 'Grille tarifaire complète : Taf Taf (2 500 F), Pro (5 000 F), Business (10 000 F).',
      url: `/assets/fiche-tarifs-a4?code=${agentCode}&phone=${agentPhone}`,
    },
    {
      title: 'Mémo de Poche Commercial',
      format: '1050 × 1485 px (Format poche)',
      desc: 'Guide de survie de poche : pitchs éclair, 10 objections, étapes onboarding 3 min.',
      url: `/assets/memo-poche-commercial?nom=${encodeURIComponent(agentNom)}&code=${agentCode}`,
    },
    {
      title: 'Badge Accréditation Agent',
      format: '1050 × 650 px (Carte/Badge)',
      desc: 'Badge officiel de représentant Nopalou avec QR code et ID agent.',
      url: `/assets/badge-commercial?nom=${encodeURIComponent(agentNom)}&code=${agentCode}&phone=${agentPhone}`,
    },
    {
      title: 'Affiche Vitrine Partenaire',
      format: '1240 × 1748 px (Affiche comptoir)',
      desc: 'Affiche "Boutique Partenaire - Commandez sur WhatsApp" à poser sur le comptoir.',
      url: `/assets/affiche-vitrine?boutique=${encodeURIComponent('BOUTIQUE PARTENAIRE')}&phone=${agentPhone}`,
    },
    {
      title: 'Poster Écosystème Global',
      format: '1200 × 1600 px (HD)',
      desc: "Vue d'ensemble 360° : Acheteur, Caisse POS, Dettes, WhatsApp, 20% parrainage.",
      url: '/assets/poster-ecosysteme',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
          Galerie des Supports Imprimables Haute Résolution (Print HD)
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
          Tous les visuels sont générés dynamiquement en haute résolution, prêts pour l&apos;imprimerie ou le partage
          numérique.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {supports.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 14,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--accent, #C75B00)',
                    background: '#FFF7ED',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  {s.format}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '8px 0 4px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', lineHeight: 1.4 }}>{s.desc}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--navy, #1C2B4A)',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={14} /> Aperçu HD
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
