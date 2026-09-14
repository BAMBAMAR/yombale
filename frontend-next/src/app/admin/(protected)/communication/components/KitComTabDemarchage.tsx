import React from 'react'
import { Copy, Download, QrCode, Store, CheckCircle2 } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface KitComTabDemarchageProps {
  prixPro: number
  prixBusiness: number
  scriptOralPerso: string
  onCopy: (txt: string, label: string) => void
}

export default function KitComTabDemarchage({
  prixPro,
  prixBusiness,
  scriptOralPerso,
  onCopy,
}: KitComTabDemarchageProps) {
  const argumentsVente = [
    {
      t: 'Caisse Enregistreuse POS Tactile & 3 Scanners',
      d: 'Ventes en magasin, scan Caméra Smartphone, Cloud Sync (<100ms) ou Douchette USB + impression tickets.',
    },
    {
      t: "Mode Caisse PWA Hors-Ligne (Offline First)",
      d: "Continuez d'encaisser même en cas de coupure Internet ou 4G à Dakar. Synchronisation automatique au retour de la connexion.",
    },
    {
      t: 'Factures Proforma & Devis OHADA en PDF',
      d: 'Émission de documents fiscaux sénégalais conformes (NINEA, RCCM, TVA, Timbre fiscal) avec envoi WhatsApp immédiat.',
    },
    {
      t: 'Gestion Fournisseurs & Scan OCR',
      d: "Enregistrez vos fournisseurs, créez des bons de commande et scannez automatiquement les factures d'achat avec l'IA.",
    },
    {
      t: 'Carnet de Dettes Client & Relances WhatsApp',
      d: 'Enregistrement des crédits clients et relance en 1-clic sur WhatsApp avec solde exact et lien de paiement.',
    },
    {
      t: 'Multi-Caissiers & Clôtures de Caisse Z',
      d: 'Chaque vendeur a son code PIN. Historique des ventes, contrôle des écarts de caisse et clôture Z automatique.',
    },
    {
      t: '1er Mois 100% Offert & Remises -25%',
      d: `Démarrez sans payer le 1er mois. Formule Pro à ${fcfa(prixPro)}/mois ou Business à ${fcfa(prixBusiness)}/mois avec jusqu'à 3 mois offerts sur l'abonnement annuel.`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Argumentaire POS & Commerce */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Store size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            7 Arguments Vendeurs POS, OHADA &amp; Magasin
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {argumentsVente.map((a, i) => (
            <div
              key={a.t}
              style={{
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 12,
                padding: 18,
                background: '#fff',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#FFF7ED',
                  color: 'var(--accent, #C75B00)',
                  fontWeight: 900,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{a.t}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{a.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Script Oral Personnalisé */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Script de Présentation Orale (2 min) — Personnalisé Agent
          </h2>
          <button
            type="button"
            onClick={() => onCopy(scriptOralPerso, 'Script Oral')}
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
            Copier Script
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
          {scriptOralPerso}
        </pre>
      </section>

      {/* Sticker & Chevalet QR Code Caisse POS Imprimable */}
      <section>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 16 }}>
          Sticker &amp; Chevalet de Caisse POS Imprimables
        </h2>
        <div
          style={{
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: 14,
            padding: 24,
            background: '#fff',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 180,
              height: 240,
              border: '3px solid var(--accent, #C75B00)',
              borderRadius: 16,
              background: '#FFF7ED',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>Nopalou POS</span>
            <QrCode size={56} color="var(--navy, #1C2B4A)" />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Scannez pour payer par Wave/OM ou voir le catalogue
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
              Sticker de Comptoir Magasin (Format A5 / A6)
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: '0 0 16px' }}>
              À imprimer et coller sur la caisse ou le comptoir des boutiques marchandes pour rassurer les clients et faire scanner le QR Code du magasin.
            </p>
            <a
              href="/assets/flyer-demarchage"
              download="sticker-caisse-nopalou.png"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Download size={15} />
              Télécharger Sticker Imprimable (PNG HD)
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
