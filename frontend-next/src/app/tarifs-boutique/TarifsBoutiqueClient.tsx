'use client'

import React, { useState } from 'react'
import TarifsPublicsSelector, { DynamicPlan } from './TarifsPublicsSelector'
import TarifsMatriceDetaillee from './TarifsMatriceDetaillee'
import TarifsMatriceDetailleeImmo from './components/TarifsMatriceDetailleeImmo'
import TarifsComparatifShopify from './components/TarifsComparatifShopify'
import TarifsComparatifImmo from './components/TarifsComparatifImmo'

interface TarifsBoutiqueClientProps {
  initialSecteur?: 'commerce' | 'immo'
  initialPlans?: DynamicPlan[]
}

const FAQ_COMMERCE_ITEMS = [
  {
    q: 'Combien coûte la création d’une boutique en ligne sur Nopalou ?',
    a: 'La création de boutique démarre dès 2.500 FCFA par mois avec la formule Boutique Taf Taf, avec 30 jours 100% offerts sans engagement. Vous profitez de 0% de commission sur vos ventes et des encaissements directs par Wave ou Orange Money.'
  },
  {
    q: 'Pourquoi Nopalou est la meilleure alternative à Shopify au Sénégal ?',
    a: 'Contrairement à Shopify qui exige une carte bancaire en dollars ($29/mois + frais de transaction) et n’intègre pas nativement Wave ou Orange Money, Nopalou est 100% conçu pour le Sénégal : paiements locaux directs, commandes WhatsApp, caisse tactile POS magasin et référencement gratuit sur le comparateur de prix N°1.'
  },
  {
    q: 'Puis-je migrer mon catalogue Shopify, WooCommerce ou Excel en 1 clic ?',
    a: 'Oui ! Grâce au moteur d’import intelligent Nopalou, vous pouvez glisser-déposer votre fichier d’export Shopify, WooCommerce ou Excel : vos titres, prix, stocks et photos sont reconnus automatiquement sans aucune ressaisie.'
  },
  {
    q: 'Puis-je gérer ma boutique entièrement par WhatsApp sans ordinateur ?',
    a: 'Absolument ! Vous pouvez ouvrir votre boutique en 30 secondes en envoyant un message WhatsApp, ajouter des produits en envoyant une simple photo et le prix, consulter votre bilan du jour et suivre votre carnet de dettes directement dans la conversation WhatsApp.'
  },
  {
    q: 'Comment mes clients paient-ils sur ma boutique ?',
    a: 'Vos clients commandent directement sur votre boutique ou via WhatsApp. Ils peuvent vous régler via Wave, Orange Money, Free Money ou en espèces à la livraison. Vous recevez 100% des fonds instantanément sur votre propre compte.'
  },
  {
    q: 'Est-il nécessaire d’avoir des compétences informatiques ?',
    a: 'Aucune compétence technique n’est nécessaire ! L’espace marchand a été pensé pour le « zéro apprentissage » avec 6 onglets essentiels simples et un accompagnement WhatsApp permanent.'
  },
]

const FAQ_IMMO_ITEMS = [
  {
    q: 'Combien coûte Nopalou pour une agence immobilière ou un gestionnaire locatif ?',
    a: 'Le plan Agence Essentiel est 100% gratuit sans limitation de durée et inclut jusqu\'à 5 négociateurs, la gestion des mandats et la génération de baux conformes OHADA. Pour automatiser les encaissements de loyers par Wave et les relances WhatsApp, le plan Agence Pro est à 10.000 FCFA/mois avec 30 jours offerts.'
  },
  {
    q: 'Les baux et quittances de loyer sont-ils conformes au droit sénégalais (OHADA) ?',
    a: 'Oui, rigoureusement. Tous les modèles de baux d\'habitation et commerciaux respectent la législation sénégalaise en vigueur. Chaque quittance émise dispose d\'un QR Code cryptographique infalsifiable permettant de vérifier instantanément sa validité juridique.'
  },
  {
    q: 'Comment les locataires règlent-ils leur loyer chaque mois ?',
    a: 'Chaque locataire reçoit son avis d\'échéance par WhatsApp ou SMS avec un lien direct sécurisé (/payer-loyer). Il peut payer en 1 clic via Wave ou Orange Money depuis son smartphone. La quittance officielle lui est délivrée immédiatement dès encaissement.'
  },
  {
    q: 'Comment s\'effectue la reddition des comptes aux propriétaires bailleurs ?',
    a: 'Nopalou calcule automatiquement vos honoraires de gérance convenus au mandat et édite le relevé de gestion mensuel net. Vous reversez le solde au propriétaire par virement bancaire ou transfert direct en 1 clic.'
  },
  {
    q: 'Puis-je administrer plusieurs succursales ou agences secondaires ?',
    a: 'Oui ! La formule Réseau Multi-Agences permet de piloter plusieurs agences réparties sur Dakar (Almadies, Plateau, Ouakam), Saly, Thiès ou Saint-Louis avec des rôles collaborateurs personnalisés, un reporting groupe consolidé et la gestion des royalties.'
  },
  {
    q: 'Puis-je importer mon portefeuille existant de biens et locataires ?',
    a: 'Oui, notre équipe technique vous assiste pour importer vos données (fiches locataires, contrats, baux en cours) depuis vos fichiers Excel ou anciens logiciels sans interruption d\'activité.'
  },
]

export default function TarifsBoutiqueClient({
  initialSecteur = 'commerce',
  initialPlans = [],
}: TarifsBoutiqueClientProps) {
  const [secteur, setSecteur] = useState<'commerce' | 'immo'>(initialSecteur)

  const handleSecteurChange = (newSecteur: 'commerce' | 'immo') => {
    setSecteur(newSecteur)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('secteur', newSecteur)
        window.history.replaceState(null, '', url.toString())
      } catch {
        // Fallback transparent
      }
    }
  }

  const currentFaq = secteur === 'commerce' ? FAQ_COMMERCE_ITEMS : FAQ_IMMO_ITEMS

  return (
    <>
      {/* ── FORFAITS CARDS (Overlapping header) ── */}
      <section style={{ maxWidth: 1200, margin: '-80px auto 40px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <TarifsPublicsSelector
          initialSecteur={initialSecteur}
          secteur={secteur}
          onSecteurChange={handleSecteurChange}
          initialPlans={initialPlans}
        />
      </section>

      {/* ── MATRICE DÉTAILLÉE DYNAMIQUE (COMMERCE VS IMMO) ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 20px' }}>
        {secteur === 'commerce' ? (
          <TarifsMatriceDetaillee />
        ) : (
          <TarifsMatriceDetailleeImmo />
        )}
      </section>

      {/* ── COMPARATIF & WORKFLOW DYNAMIQUE (SHOPIFY VS ERP IMMO) ── */}
      {secteur === 'commerce' ? (
        <TarifsComparatifShopify />
      ) : (
        <TarifsComparatifImmo />
      )}

      {/* ── FAQ ACCORDION DYNAMIQUE ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 32, color: 'var(--navy, #1C2B4A)' }}>
          {secteur === 'commerce' ? 'Questions Fréquentes (FAQ Vendeurs)' : 'Questions Fréquentes (FAQ Agences & Gestion Locative)'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {currentFaq.map((item, index) => (
            <details
              key={`${secteur}-${index}`}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '18px 22px',
                border: '1.5px solid var(--border, #E8DDD2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
              }}
            >
              <summary style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy, #1C2B4A)', outline: 'none' }}>
                {item.q}
              </summary>
              <p style={{ marginTop: 12, color: 'var(--text-subtle, #5A4E42)', fontSize: 14.5, lineHeight: 1.65, margin: '12px 0 0' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
