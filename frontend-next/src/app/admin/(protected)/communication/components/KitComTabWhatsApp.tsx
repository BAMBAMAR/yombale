import React from 'react'
import { MessageSquare, Send, ExternalLink, Bot, ShoppingBag, Bell, BookOpen } from 'lucide-react'

export default function KitComTabWhatsApp() {
  const piliers = [
    {
      t: 'Recherche Unifiée Instantanée',
      d: 'Tapez "iPhone 15" -> renvoie les prix comparés marketplace, boutiques Nopalou et biens immo.',
      icon: <Bot size={20} color="#25D366" />,
    },
    {
      t: 'Panier Multi-Produits (Meta)',
      d: 'Composez un panier avec plusieurs articles depuis le catalogue WhatsApp et envoyez en 1 clic.',
      icon: <ShoppingBag size={20} color="#25D366" />,
    },
    {
      t: 'Alertes Baisse de Prix',
      d: "Recevez un message WhatsApp automatique dès qu'un produit atteint votre prix cible.",
      icon: <Bell size={20} color="#25D366" />,
    },
    {
      t: 'Carnet Dettes POS Client',
      d: 'Le marchand enregistre le crédit et le client reçoit son récapitulatif par message WhatsApp.',
      icon: <BookOpen size={20} color="#25D366" />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <MessageSquare size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            4 Piliers du Chatbot WhatsApp Meta (24h/24)
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {piliers.map(f => (
            <div
              key={f.t}
              style={{
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 12,
                padding: 18,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {f.icon}
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#25D366' }}>{f.t}</p>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div
          style={{
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: 14,
            padding: 24,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 20,
              background: '#25D366',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={44} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Tester le Bot WhatsApp Nopalou
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B' }}>Numéro officiel : +221 70 871 79 42</p>
            <a
              href="https://wa.me/221708717942"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                background: '#25D366',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Envoyer &quot;MENU&quot; sur WhatsApp <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
