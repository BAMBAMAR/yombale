'use client'

import React, { useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  r: string
}

const FAQS: FaqItem[] = [
  {
    q: "Ai-je besoin d'acheter un terminal ou du matériel de caisse coûteux ?",
    r: "Non, aucun matériel coûteux n'est requis. La caisse Nopalou s'exécute directement sur votre smartphone Android, iPhone, tablette ou PC. Votre téléphone devient votre terminal de caisse complet."
  },
  {
    q: "Est-ce que la caisse fonctionne sans connexion Internet (hors-ligne) ?",
    r: "Oui, à 100% ! Vous pouvez encaisser vos clients au marché même en coupure totale de réseau Sonatel, Yas ou électricité. Dès le retour du réseau, vos ventes se synchronisent automatiquement sans doublon."
  },
  {
    q: "Comment est-ce que je reçois l'argent de mes clients ?",
    r: "L'argent de vos ventes par Wave ou Orange Money arrive directement sur votre propre compte marchand Wave/OM. Nopalou ne prélève aucune commission sur vos transactions (0%). Vous encaissez 100% de ce que vous vendez."
  },
  {
    q: "Comment fonctionne le carnet de dettes client ('Bor') ?",
    r: "Vous enregistrez chaque vente à crédit en tapant le nom et le numéro du client. Nopalou calcule automatiquement le solde restant. En un clic, vous pouvez envoyer une relance polie sur WhatsApp avec un lien Wave permettant au client de vous rembourser immédiatement."
  },
  {
    q: "Puis-je imprimer des tickets thermiques de caisse ?",
    r: "Oui. Nopalou est compatible avec toutes les imprimantes thermiques Bluetooth et USB de 58mm et 80mm. Vous pouvez aussi envoyer le ticket de caisse directement sur le WhatsApp du client pour économiser le papier."
  },
  {
    q: "Puis-je importer mon catalogue existant depuis Excel ou Shopify ?",
    r: "Oui ! En 1 clic, notre module de migration récupère votre fichier Shopify (products_export.csv), WooCommerce ou tableau Excel (.xlsx/.csv). Vos photos, prix FCFA et stocks sont importés sans aucune ressaisie."
  }
]

export default function MerchantFaqAccordion() {
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0)

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '24px 20px',
        marginBottom: 36
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <HelpCircle size={22} color="var(--accent, #C75B00)" />
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          Questions fréquentes des commerçants
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FAQS.map((faq, index) => {
          const estOuvert = faqOuverte === index
          return (
            <div
              key={index}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'all 0.15s ease'
              }}
            >
              <button
                type="button"
                onClick={() => setFaqOuverte(estOuvert ? null : index)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: estOuvert ? '#F8FAFC' : '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--navy, #1C2B4A)',
                  fontWeight: 800,
                  fontSize: 13.5
                }}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: estOuvert ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                />
              </button>
              {estOuvert && (
                <div style={{ padding: '12px 16px 16px', fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.5, background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                  {faq.r}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
