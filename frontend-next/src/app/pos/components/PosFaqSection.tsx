'use client'

import React from 'react'

export const POS_FAQ = [
  {
    q: "Quel est le prix d'une caisse enregistreuse au Sénégal ?",
    a: "Alors qu'une caisse tactile traditionnelle coûte entre 300 000 et 800 000 FCFA à Dakar, Nopalou POS ne nécessite aucun matériel dédié et est incluse dans la formule Boutique Pro (dès 3 750 FCFA/mois en formule annuelle, ou 5 000 FCFA/mois avec 30 jours 100% offerts). Elle fonctionne sur votre smartphone, tablette ou ordinateur."
  },
  {
    q: "Pourquoi Nopalou est la meilleure caisse enregistreuse pour petit commerce ?",
    a: "Nopalou est spécialement conçue pour les commerces, boutiques et magasins à Dakar : elle fonctionne même lors des coupures de réseau Internet (hors-ligne), gère les espèces et la monnaie, intègre le carnet de dettes clients ('Bor') avec relances Wave 1-clic et permet d'encaisser par Wave et Orange Money sans commission."
  },
  {
    q: "Dois-je acheter un terminal ou du matériel de caisse coûteux ?",
    a: "Non ! Nopalou POS fonctionne sur le matériel que vous possédez déjà : n'importe quel smartphone Android, iPhone, tablette ou ordinateur portable. Si vous avez déjà une douchette USB ou une imprimante thermique Bluetooth (58mm/80mm), elles sont 100% compatibles."
  },
  {
    q: "Comment la caisse fonctionne-t-elle sans connexion Internet ?",
    a: "Grâce à notre technologie Progressive Web App (PWA) Offline-First, l'ensemble de votre catalogue et de vos prix est enregistré en mémoire locale sécurisée sur votre appareil. Vous encaissez vos clients, calculez la monnaie et imprimez les tickets sans aucune interruption de service. La synchronisation s'effectue automatiquement dès le retour du réseau."
  },
  {
    q: "Puis-je gérer plusieurs caissiers ou vendeurs avec des accès séparés ?",
    a: "Oui, la formule Pro et Business intègre la gestion multi-caissiers avec code PIN à 4 chiffres. Vous pouvez suivre les ventes réalisées par chaque membre de l'équipe et générer un rapport de clôture de caisse Z individuel en fin de journée."
  },
  {
    q: "Les factures et reçus sont-ils conformes aux règles sénégalaises ?",
    a: "Absolument. Vous pouvez renseigner votre NINEA, RCCM, adresse légale et taux de TVA. Les reçus et factures PDF émis respectent les standards comptables OHADA et peuvent être imprimés ou envoyés directement au client par WhatsApp."
  }
]

export function PosFaqSection() {
  return (
    <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 20px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', color: '#1C2B4A', marginBottom: 36 }}>
        Questions Fréquentes sur la Caisse Enregistreuse Nopalou
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {POS_FAQ.map((item, idx) => (
          <details
            key={idx}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '18px 24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer'
            }}
          >
            <summary style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', outline: 'none' }}>
              {item.q}
            </summary>
            <p style={{ marginTop: 14, color: '#475569', fontSize: 14.5, lineHeight: 1.6, margin: '14px 0 0' }}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
