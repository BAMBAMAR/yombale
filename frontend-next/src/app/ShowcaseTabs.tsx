'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ShowcaseTabs() {
  const [tab, setTab] = useState<'acheteur' | 'marchand' | 'apporteur'>('marchand');

  return (
    <section style={{
      background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
      borderRadius: 16,
      padding: '28px 20px',
      margin: '32px 0',
      color: '#FFFFFF',
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            alignSelf: 'center', background: '#FF8C00', color: '#FFF',
            fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase'
          }}>
            ⚡ Nopalou en Action
          </span>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, color: '#FFF', margin: 0 }}>
            Une solution unique pour 3 profils au Sénégal
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
            Découvrez comment Nopalou simplifie les achats, accélère les ventes et génère des revenus.
          </p>
        </div>

        {/* Tab buttons */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10,
          background: 'rgba(2, 6, 23, 0.6)', padding: 6, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => setTab('acheteur')}
            style={{
              background: tab === 'acheteur' ? '#C75B00' : 'transparent',
              color: '#FFF', border: 'none', padding: '12px 16px', borderRadius: 8,
              fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <span>🛒 Acheteurs &amp; Clients</span>
          </button>

          <button
            onClick={() => setTab('marchand')}
            style={{
              background: tab === 'marchand' ? '#059669' : 'transparent',
              color: '#FFF', border: 'none', padding: '12px 16px', borderRadius: 8,
              fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <span>🏪 Marchands &amp; Caisse POS</span>
          </button>

          <button
            onClick={() => setTab('apporteur')}
            style={{
              background: tab === 'apporteur' ? '#7C3AED' : 'transparent',
              color: '#FFF', border: 'none', padding: '12px 16px', borderRadius: 8,
              fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <span>💼 Apporteurs d&apos;Affaires</span>
          </button>
        </div>

        {/* Content Panel */}
        <div style={{
          background: '#020617', padding: '24px 20px', borderRadius: 12, border: '1px solid #1E293B',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {tab === 'acheteur' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FF8C00', margin: 0 }}>
                🛒 Trouvez toujours le prix le plus bas au Sénégal
              </h3>
              <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                Nopalou compare automatiquement les offres chez tous les commerçants (Auchan, Carrefour, Boutiques Nopalou Pro). Commandez directement par WhatsApp ou suivez les baisses de prix grâce aux alertes automatiques.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13, color: '#94A3B8' }}>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>✅ <strong>Comparateur :</strong> Produits, Immo &amp; Télécom</div>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>🤖 <strong>Assistant WhatsApp :</strong> Commandes 24/7 sur WhatsApp</div>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>🔔 <strong>Alertes Prix :</strong> Notifié dès qu&apos;un prix baisse</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                <Link
                  href="/demo?role=acheteur"
                  style={{
                    background: '#FF8C00', color: '#FFF', padding: '10px 18px', borderRadius: 8,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  🕹️ Tester la Démo Acheteur →
                </Link>
              </div>
            </div>
          )}

          {tab === 'marchand' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#10B981', margin: 0 }}>
                🏪 Caisse POS tactile, Scan EAN-13 &amp; Carnet de Crédits Client
              </h3>
              <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                Transformez votre smartphone ou votre PC en caisse enregistreuse professionnelle. Scannez les codes-barres avec votre caméra, éditez des étiquettes stickers EAN-13 (50x30mm) et relancez vos impayés en 1 clic sur WhatsApp.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13, color: '#94A3B8' }}>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>📷 <strong>Scanner Caméra :</strong> Scan 1-clic depuis le smartphone</div>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>📓 <strong>Carnet de Dettes :</strong> Fini le cahier papier + Relance WhatsApp</div>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>🏷️ <strong>Étiquettes EAN-13 :</strong> Stickers imprimables 50x30mm</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                <Link
                  href="/demo?role=marchand"
                  style={{
                    background: '#10B981', color: '#020617', padding: '10px 18px', borderRadius: 8,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  🕹️ Tester la Démo POS Marchand →
                </Link>
                <Link
                  href="/boutique"
                  style={{
                    background: '#1E293B', color: '#FFF', border: '1px solid #334155', padding: '10px 18px', borderRadius: 8,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  🏪 Ouvrir ma Boutique Pro →
                </Link>
              </div>
            </div>
          )}

          {tab === 'apporteur' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#A855F7', margin: 0 }}>
                💼 Gagnez des commissions récurrentes en parrainant des boutiques
              </h3>
              <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                Démarchez les commerçants de votre secteur et touchez 20% de commission mensuelle récurrente sur tous leurs abonnements. Aucun investissement requis.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13, color: '#94A3B8' }}>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>💰 <strong>Commissions récurrentes :</strong> Perçues chaque mois sur Wave / OM</div>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>📄 <strong>Brochure PDF (13 p.) :</strong> Support de vente terrain téléchargeable</div>
                <div style={{ background: '#0F172A', padding: 12, borderRadius: 8 }}>📊 <strong>Tableau de Bord :</strong> Suivi des filleuls en temps réel</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                <Link
                  href="/demo?role=apporteur"
                  style={{
                    background: '#A855F7', color: '#FFF', padding: '10px 18px', borderRadius: 8,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  🕹️ Tester le Calculateur de Gains →
                </Link>
                <a
                  href="/brochure-apporteur.pdf"
                  target="_blank"
                  download
                  style={{
                    background: '#1E293B', color: '#FFF', border: '1px solid #334155', padding: '10px 18px', borderRadius: 8,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  📥 Télécharger la Brochure PDF (13 p.)
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
