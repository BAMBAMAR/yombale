'use client'

import React, { useState } from 'react'
import {
  BarChart3,
  Activity,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Eye,
  MousePointer,
  ShoppingCart,
  Layers,
  Info
} from 'lucide-react'

const GA_MEASUREMENT_ID = 'G-3KGE1YBMVJ'

const GTAG_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}');
</script>`

const TRACKED_EVENTS = [
  {
    nom: 'page_view',
    description: 'Télémétrie automatique sur chaque URL publique, fiche marchand et comparateur',
    type: 'Automatique (GA4)',
    icon: Eye,
  },
  {
    nom: 'click_whatsapp',
    description: 'Clics sur les boutons de commande et mise en relation directe WhatsApp',
    type: 'Conversion E-commerce',
    icon: MousePointer,
  },
  {
    nom: 'view_item / view_item_list',
    description: 'Consultation des produits du comparateur et catalogues de boutiques partenaires',
    type: 'Catalogue B2C / B2B',
    icon: Layers,
  },
  {
    nom: 'begin_checkout / add_to_cart',
    description: 'Ajout d\'articles au panier et amorçage du flux de commande en ligne / POS',
    type: 'Tunnel d\'Achat',
    icon: ShoppingCart,
  },
]

export default function AdminSeoGoogleTag() {
  const [copied, setCopied] = useState(false)
  const [showSnippet, setShowSnippet] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(GTAG_SNIPPET)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback si navigator.clipboard indisponible
    }
  }

  return (
    <div className="admin-section" style={{ marginBottom: 32 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'rgba(199, 91, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent, #C75B00)'
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="admin-section-titre" style={{ margin: 0, textTransform: 'none', fontSize: 16, color: 'var(--navy, #1C2B4A)' }}>
              Google Analytics 4 (GA4) & Balise Google
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              Mesure d'audience, télémétrie en temps réel et suivi du trafic organique de Nopalou.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <CheckCircle2 size={13} /> Balise Active en Production
          </span>
          <span style={{
            background: 'rgba(28, 43, 74, 0.08)',
            color: 'var(--navy, #1C2B4A)',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'monospace'
          }}>
            {GA_MEASUREMENT_ID}
          </span>
        </div>
      </div>

      {/* Cartes récapitulatives de statut */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ID de Mesure (Flux Web)
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4, fontFamily: 'monospace' }}>
            {GA_MEASUREMENT_ID}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} style={{ color: '#059669' }} /> Propriété GA4 Vérifiée
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mode d'Injection
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
            Next.js Root Layout
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            <code>strategy="afterInteractive"</code> (non-bloquant)
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Portée du Suivi
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
            100% des Pages
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            nopalou.com & routes marchands
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bibliothèque Télémétrique
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
            Google tag (gtag.js)
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Google Tag Manager CDN
          </div>
        </div>
      </div>

      {/* Raccourcis d'actions rapides vers Google */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accès Directs aux Consoles Google :
        </div>
        <div className="admin-actions-row" style={{ flexWrap: 'wrap', gap: 10 }}>
          <a
            href="https://analytics.google.com/analytics/web/#/realtime"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ background: 'var(--navy, #1C2B4A)' }}
          >
            <Radio size={14} style={{ color: '#22c55e' }} />
            Vue Temps Réel (Visiteurs en direct)
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </a>

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ background: '#1e293b' }}
          >
            <BarChart3 size={14} style={{ color: '#f59e0b' }} />
            Console Google Analytics 4
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </a>

          <a
            href="https://tagassistant.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ background: '#334155' }}
          >
            <Activity size={14} style={{ color: '#38bdf8' }} />
            Google Tag Assistant (Debug)
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </a>

          <button
            type="button"
            onClick={() => setShowSnippet(!showSnippet)}
            className="admin-action-btn"
            style={{ background: '#f1f5f9', color: 'var(--navy, #1C2B4A)', border: '1px solid #cbd5e1' }}
          >
            <Copy size={14} />
            {showSnippet ? 'Masquer le code balise' : 'Voir le code balise injecté'}
          </button>
        </div>
      </div>

      {/* Code Snippet inspectable / copiable */}
      {showSnippet && (
        <div style={{
          background: '#0f172a',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          border: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
              Snippet officiel Google Tag actif dans <code>src/app/layout.tsx</code>
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: copied ? '#059669' : '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copié dans le presse-papier !' : 'Copier le code'}
            </button>
          </div>
          <pre style={{
            margin: 0,
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: 12.5,
            lineHeight: 1.6,
            overflowX: 'auto',
            background: 'transparent'
          }}>
            {GTAG_SNIPPET}
          </pre>
        </div>
      )}

      {/* Événements suivis */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Événements & Conversions E-commerce Mesurés :
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {TRACKED_EVENTS.map((evt) => {
            const Icon = evt.icon
            return (
              <div key={evt.nom} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'rgba(28, 43, 74, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--navy, #1C2B4A)',
                  flexShrink: 0
                }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{evt.nom}</code>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: 4 }}>
                      {evt.type}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    {evt.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Note d'information latence Google */}
      <div style={{
        marginTop: 18,
        padding: '10px 14px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 12.5,
        color: '#92400e',
        lineHeight: 1.5
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: '#d97706' }} />
        <div>
          <strong>Note de synchronisation Google Analytics :</strong> Les visites et actions des utilisateurs apparaissent
          immédiatement dans le rapport <strong>« Temps réel »</strong>. Cependant, les rapports d'audience agrégés et
          les tableaux de bord historiques peuvent demander un délai de traitement de 24 à 48 heures de la part des serveurs Google.
        </div>
      </div>
    </div>
  )
}
