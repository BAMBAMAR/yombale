import React from 'react'
import Link from 'next/link'
import { ExternalLink, BookOpen } from 'lucide-react'

export default function ForceDeVenteTabGuide() {
  const modules = [
    { num: '1', title: 'Ouverture de Compte & Boutique', desc: 'Inscription en 1 min par numéro WhatsApp, configuration du logo, nom et coordonnées.' },
    { num: '2', title: 'Gestion du Catalogue & Variantes', desc: 'Ajout manuel, import Excel en 1 clic, génération de codes-barres EAN-13 GS1.' },
    { num: '3', title: 'Caisse POS Tactile & Hors-Ligne', desc: 'Fonctionne sans internet (PWA), 3 scanners (Caméra, Cloud, USB), clôture Z.' },
    { num: '4', title: 'Carnet de Dettes & Relance WA', desc: 'Enregistrement des crédits clients, solde en direct, relance automatique WhatsApp.' },
    { num: '5', title: 'Factures & Devis Légaux OHADA', desc: 'PDF officiels avec NINEA, RCCM et TVA 18% téléchargeables en 10 secondes.' },
    { num: '6', title: 'Fournisseurs & Scan OCR', desc: "Scan OCR des factures d'achat fournisseur pour incrémentation automatique du stock." },
    { num: '7', title: 'Commandes Web & Paniers', desc: 'Réception des commandes sur WhatsApp sans aucune commission, relance des paniers.' },
    { num: '8', title: 'Marketing, QR Code & Stories', desc: 'Générateur de stories 1080×1920 en marque blanche et QR Code de comptoir.' },
  ]

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <BookOpen size={20} color="var(--navy, #1C2B4A)" />
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Guide d&apos;Utilisation Simplifié Intégré
            </h2>
          </div>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Ce guide est également accessible publiquement sur{' '}
            <Link href="/guide-utilisation" target="_blank" style={{ color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
              nopalou.com/guide-utilisation
            </Link>
            .
          </p>
        </div>
        <Link
          href="/guide-utilisation"
          target="_blank"
          style={{
            padding: '10px 18px',
            background: 'var(--accent, #C75B00)',
            color: '#fff',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 13,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Ouvrir la page dédiée <ExternalLink size={16} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {modules.map(g => (
          <div key={g.num} style={{ background: '#F8FAFC', border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: '16px' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent, #C75B00)', display: 'block', marginBottom: 4 }}>
              Module {g.num} : {g.title}
            </span>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{g.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
