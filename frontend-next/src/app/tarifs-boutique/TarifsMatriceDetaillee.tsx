'use client'

import React, { useState } from 'react'
import { Check, X, ChevronDown, Sparkles } from 'lucide-react'

interface FeatureRow {
  nom: string
  detail: string
  gratuit: boolean | string
  tafTaf: boolean | string
  pro: boolean | string
  business: boolean | string
}

interface FeatureSection {
  categorie: string
  items: FeatureRow[]
}

const MATRICE_SECTIONS: FeatureSection[] = [
  {
    categorie: 'Vitrine Web & Vente WhatsApp',
    items: [
      { nom: 'Boutique en ligne responsive', detail: 'URL dédiée nopalou.com/boutiques/[nom]', gratuit: true, tafTaf: true, pro: true, business: true },
      { nom: 'Panier web & Commande WhatsApp', detail: 'Commandes pré-remplies directement sur votre WhatsApp', gratuit: false, tafTaf: true, pro: true, business: true },
      { nom: 'QR Code de boutique', detail: 'Téléchargeable pour vos flyers, emballages et réseaux', gratuit: true, tafTaf: true, pro: true, business: true },
      { nom: 'Assistant Bot WhatsApp Nopalou', detail: 'Recherche de prix, bilan du jour et alertes stock', gratuit: false, tafTaf: true, pro: true, business: true },
      { nom: 'Référencement sur le comparateur', detail: 'Visibilité de vos articles auprès de milliers d\'acheteurs', gratuit: 'Standard', tafTaf: 'Actif', pro: 'Prioritaire', business: 'VIP Sponsorisé' },
    ]
  },
  {
    categorie: 'Caisse Enregistreuse POS (Magasin Physique)',
    items: [
      { nom: 'Caisse tactile magasin (POS)', detail: 'Sur smartphone, tablette ou ordinateur PC', gratuit: false, tafTaf: false, pro: true, business: true },
      { nom: 'Mode 100% Hors-Ligne (Offline-First)', detail: 'Fonctionne même lors des coupures de courant ou d\'Internet', gratuit: false, tafTaf: false, pro: true, business: true },
      { nom: 'Scan codes-barres par caméra', detail: 'Reconnaissance EAN-13 / Code 128 avec l\'appareil photo', gratuit: false, tafTaf: false, pro: true, business: true },
      { nom: 'Impression tickets thermiques (58/80mm)', detail: 'Compatible imprimantes Bluetooth et USB', gratuit: false, tafTaf: false, pro: true, business: true },
      { nom: 'Multi-Caissiers & Codes PIN', detail: 'Accès vendeur individuel et traçabilité des encaissements', gratuit: false, tafTaf: false, pro: '3 caissiers', business: '10 caissiers' },
      { nom: 'Clôtures de caisse journalières (Rapports Z)', detail: 'Comptage d\'espèces, calcul des écarts et export de caisse', gratuit: false, tafTaf: false, pro: true, business: true },
    ]
  },
  {
    categorie: 'Carnet de Dettes & Relations Clients',
    items: [
      { nom: 'Carnet de dettes client ("Bor")', detail: 'Suivi rigoureux des créances et acomptes par client', gratuit: false, tafTaf: true, pro: true, business: true },
      { nom: 'Relance WhatsApp 1-Clic avec lien Wave', detail: 'Message personnalisé avec solde exact et lien direct Wave', gratuit: false, tafTaf: false, pro: true, business: true },
      { nom: 'Relances WhatsApp automatiques programmées', detail: 'Envoi automatique avant et après l\'échéance du crédit', gratuit: false, tafTaf: false, pro: false, business: true },
      { nom: 'Relance automatique des paniers abandonnés', detail: 'Récupération automatique des ventes non finalisées sur WhatsApp', gratuit: false, tafTaf: false, pro: false, business: true },
    ]
  },
  {
    categorie: 'Catalogue, Stocks & Logistique',
    items: [
      { nom: 'Nombre de produits inclus', detail: 'Photos, descriptions, déclinaisons et prix barrés', gratuit: '10 produits', tafTaf: '50 produits', pro: '300 produits', business: '2 000 produits' },
      { nom: 'Import multi-plateformes (Shopify, WooCommerce, Excel)', detail: 'Migration de catalogue en 1 clic sans ressaisie', gratuit: false, tafTaf: true, pro: true, business: true },
      { nom: 'Baguette Magique (AliExpress, Alibaba, SHEIN)', detail: 'Recopie automatique des photos, titres et fiches articles', gratuit: false, tafTaf: true, pro: true, business: true },
      { nom: 'Multi-Entrepôts & Dépôts physiques', detail: 'Ventilation par boutique et transferts de stocks inter-sites', gratuit: false, tafTaf: false, pro: false, business: true },
      { nom: 'Gestion des commandes & Dispatch Livreur Tiak-Tiak', detail: 'Transmission des coordonnées de livraison par WhatsApp', gratuit: false, tafTaf: false, pro: true, business: true },
    ]
  },
  {
    categorie: 'Documents Officiels, Comptabilité & Intégrations',
    items: [
      { nom: 'Factures & Devis PDF pro (Normes OHADA)', detail: 'Génération instantanée avec logo, NINEA, RCCM et TVA', gratuit: false, tafTaf: false, pro: true, business: true },
      { nom: 'Comptabilité & Marge Nette réelle', detail: 'Suivi des dépenses, recettes et bénéfice net marchand', gratuit: false, tafTaf: false, pro: 'Basique', business: 'Avancée' },
      { nom: 'Portail Développeur Clés API REST & Webhooks', detail: 'Intégration sur mesure avec vos logiciels de gestion tiers', gratuit: false, tafTaf: false, pro: false, business: true },
      { nom: 'Account Manager VIP dédié 7j/7', detail: 'Ligne directe prioritaire avec un technicien Nopalou', gratuit: false, tafTaf: false, pro: false, business: true },
    ]
  }
]

export default function TarifsMatriceDetaillee() {
  const [open, setOpen] = useState(true)

  function renderValue(val: boolean | string) {
    if (typeof val === 'string') {
      return (
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1C2B4A' }}>
          {val}
        </span>
      )
    }
    if (val === true) {
      return (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={14} strokeWidth={3} />
        </div>
      )
    }
    return (
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} strokeWidth={2.5} />
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', borderRadius: 24, border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      
      {/* Header dépliable */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '24px 28px',
          background: '#FFFFFF',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF3E8', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Tableau Comparatif Détaillé de Toutes les Fonctionnalités
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text2, #5A4E42)' }}>
              Transparence totale : découvrez tout ce qui est inclus dans chaque formule, sans mauvaise surprise.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent, #C75B00)', fontWeight: 800, fontSize: 13 }}>
          <span>{open ? 'Masquer le tableau' : 'Voir le tableau complet'}</span>
          <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {open && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'center', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAF8F5', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 900, color: 'var(--navy, #1C2B4A)', width: '40%' }}>
                  Fonctionnalités réelles Nopalou
                </th>
                <th style={{ padding: '16px 14px', fontWeight: 800, color: '#64748B', width: '15%' }}>
                  Gratuit
                </th>
                <th style={{ padding: '16px 14px', fontWeight: 900, color: '#0A5C36', background: '#F0FDF4', width: '15%' }}>
                  Taf Taf (2.5k)
                </th>
                <th style={{ padding: '16px 14px', fontWeight: 900, color: 'var(--accent, #C75B00)', background: '#FFF7ED', width: '15%' }}>
                  Pro (5k) ★
                </th>
                <th style={{ padding: '16px 14px', fontWeight: 900, color: 'var(--navy, #1C2B4A)', background: '#F8FAFC', width: '15%' }}>
                  Business (10k)
                </th>
              </tr>
            </thead>
            <tbody>
              {MATRICE_SECTIONS.map((sec, secIdx) => (
                <React.Fragment key={secIdx}>
                  <tr style={{ background: '#F8F5F0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                    <td colSpan={5} style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 900, fontSize: 12, color: 'var(--navy, #1C2B4A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {sec.categorie}
                    </td>
                  </tr>
                  {sec.items.map((item, itemIdx) => (
                    <tr key={itemIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13.5 }}>{item.nom}</div>
                        <div style={{ color: '#64748B', fontSize: 11.5, marginTop: 2 }}>{item.detail}</div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>{renderValue(item.gratuit)}</td>
                      <td style={{ padding: '14px 10px', background: '#FAFCF8' }}>{renderValue(item.tafTaf)}</td>
                      <td style={{ padding: '14px 10px', background: '#FFFDF9' }}>{renderValue(item.pro)}</td>
                      <td style={{ padding: '14px 10px', background: '#FAFAFC' }}>{renderValue(item.business)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
