'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Zap,
  Store,
  BookOpen,
  MessageCircle,
  ArrowRight,
  Smartphone,
  WifiOff,
  Printer,
  TrendingUp,
  Clock,
  Users,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Layers,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react'
import { FeatureTab } from './types'
import StageMockups from './StageMockups'

export default function MerchantMasterStage() {
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('pos')

  const tabs: { id: FeatureTab; label: string; icon: React.ComponentType<any>; badge: string }[] = [
    { id: 'pos', label: 'Caisse POS Tactile (Offline)', icon: Zap, badge: 'Hors-Ligne' },
    { id: 'boutique', label: 'Boutique en Ligne & Vitrine', icon: Store, badge: '0% Comm.' },
    { id: 'whatsapp', label: 'Vente WhatsApp & Dettes', icon: MessageCircle, badge: 'Relance 1-Clic' },
    { id: 'migration', label: 'Migration Shopify & Excel', icon: RefreshCw, badge: 'Sans ressaisie' },
  ]

  return (
    <section style={{ marginBottom: 48, paddingTop: 8 }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 24px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(199,91,0,0.1)',
            color: 'var(--accent, #C75B00)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 800,
            marginBottom: 8,
            letterSpacing: '0.04em'
          }}
        >
          <Sparkles size={13} color="var(--accent, #C75B00)" />
          <span>LA SUITE COMMERCIALE TOUT-EN-UN SÉNÉGALAISE</span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(24px, 2.6vw, 32px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}
        >
          Les 4 Piliers de Votre Activité Commerciale
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
          Cliquez sur un module pour découvrir son fonctionnement concret et manipuler le simulateur interactif.
        </p>
      </div>

      {/* Barre de Commutation Segmentée des 4 Modules */}
      <div className="merchant-piliers-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isSelected = activeFeature === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFeature(tab.id)}
              className={`merchant-pilier-btn ${isSelected ? 'active' : ''}`}
            >
              <Icon size={15} color={isSelected ? '#FED7AA' : 'var(--accent, #C75B00)'} style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
              <span className="tab-badge">
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* Plateau Interactif (Stage) : Split Gauche Argumentaire / Droite Mockup Live */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          padding: '24px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 24,
          alignItems: 'center'
        }}
      >
        {/* CÔTÉ GAUCHE : ARGUMENTAIRE DU MODULE ACTIF */}
        <div>
          {activeFeature === 'pos' && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#15803D', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 900, marginBottom: 12 }}>
                <WifiOff size={13} />
                <span>TECHNOLOGIE OFFLINE-FIRST • 100% SANS INTERNET</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px', lineHeight: 1.25 }}>
                Caisse Enregistreuse POS Tactile pour Petit Commerce
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
                Même en coupure totale de réseau Sonatel, Yas ou d&apos;électricité, votre commerce ne s&apos;arrête jamais. Encaissez vos clients, calculez la monnaie et imprimez les tickets sans interruption.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <Smartphone size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Scan Caméra Smartphone :</strong> utilisez l&apos;appareil photo de votre téléphone comme douchette code-barres (0 F d&apos;achat matériel).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <Printer size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Tickets Thermiques &amp; WhatsApp :</strong> compatible imprimantes Bluetooth 58/80mm et envoi instantané sur le WhatsApp du client.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <Users size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Multi-Caissiers &amp; Clôture Z :</strong> codes PIN individuels, traçabilité des ventes par vendeur et rapport de fin de journée conforme OHADA.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/boutique/caisse"
                  style={{
                    padding: '11px 20px',
                    borderRadius: 10,
                    background: 'var(--accent, #C75B00)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(199,91,0,0.3)'
                  }}
                >
                  <Zap size={14} fill="#fff" />
                  <span>Ouvrir la Caisse POS</span>
                </Link>

                <Link
                  href="/logiciel-caisse-senegal"
                  style={{
                    padding: '11px 16px',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textDecoration: 'underline'
                  }}
                >
                  Voir la page complète Caisse POS →
                </Link>
              </div>
            </div>
          )}

          {activeFeature === 'boutique' && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#15803D', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 900, marginBottom: 12 }}>
                <Store size={13} />
                <span>ALTERNATIVE N°1 À SHOPIFY AU SÉNÉGAL • 0% COMMISSION</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px', lineHeight: 1.25 }}>
                Votre Boutique en Ligne &amp; Vitrine Mobile Clé en Main
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
                Vendez partout au Sénégal avec votre propre adresse web personnalisée. Vos clients consultent vos articles et vous encaissez 100% de vos gains directement sur Wave et Orange Money sans commission.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>0% de Commission :</strong> vous conservez 100% du montant de vos ventes Wave/OM, contrairement aux 10-20% prélevés ailleurs.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <Clock size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Boutique Prête en 2 Minutes :</strong> ajoutez vos produits directement depuis votre smartphone avec photo et prix sans développeur.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <Layers size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Stock Synchronisé :</strong> un article vendu en magasin au comptoir est automatiquement décompté de votre vitrine web.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/creer-boutique"
                  style={{
                    padding: '11px 20px',
                    borderRadius: 10,
                    background: 'var(--accent, #C75B00)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(199,91,0,0.3)'
                  }}
                >
                  <span>Créer ma Boutique (30j offerts)</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/marchands"
                  style={{
                    padding: '11px 16px',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textDecoration: 'underline'
                  }}
                >
                  Voir la page Créer une Boutique (/marchands) →
                </Link>
              </div>
            </div>
          )}

          {activeFeature === 'whatsapp' && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#15803D', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 900, marginBottom: 12 }}>
                <MessageCircle size={13} color="#16A34A" />
                <span>COMMERCE CONVERSATIONNEL DAKAR • ZÉRO PERTE DE TEMPS</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px', lineHeight: 1.25 }}>
                Vendre sur WhatsApp — Commandes, Dettes &amp; Bilan
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
                Fini les 50 messages pour donner un prix ou chercher une photo. Vos clients commandent en 1 clic sur votre vitrine, vous gérez vos crédits clients et obtenez votre bilan du soir par message.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <ShoppingBag size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Commandes Structurées :</strong> vous recevez un message WhatsApp propre avec liste d&apos;articles, quantités, total FCFA et adresse.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <BookOpen size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Carnet de Dettes &amp; Relance 1-Clic :</strong> envoyez un rappel poli avec bouton Wave direct pour vous faire rembourser 2× plus vite.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <TrendingUp size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Bilan du Soir par Message :</strong> envoyez &laquo; Bilan &raquo; par WhatsApp pour recevoir en 3s votre CA et répartition Espèces / Wave / OM.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/boutique?tab=carnet"
                  style={{
                    padding: '11px 20px',
                    borderRadius: 10,
                    background: '#16A34A',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(22,163,74,0.3)'
                  }}
                >
                  <BookOpen size={14} />
                  <span>Ouvrir le Carnet de Dettes</span>
                </Link>

                <Link
                  href="/vendre-sur-whatsapp"
                  style={{
                    padding: '11px 16px',
                    color: '#15803D',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textDecoration: 'underline'
                  }}
                >
                  Voir la page Vendre sur WhatsApp →
                </Link>
              </div>
            </div>
          )}

          {activeFeature === 'migration' && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 900, marginBottom: 12 }}>
                <RefreshCw size={13} color="#2563EB" />
                <span>TRANSFERT 1-CLIC SANS RESSAISIE • MOINS DE 3 MINUTES</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px', lineHeight: 1.25 }}>
                Migration Shopify, WooCommerce &amp; Excel
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
                Quittez les forfaits Shopify en dollars ($29/mois + frais bancaires) sans recommencer votre catalogue à zéro. Vos titres, descriptions, prix en FCFA, stocks et photos sont reconnus automatiquement.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <UploadCloud size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Export Shopify CSV Détecté :</strong> glissez votre fichier <code>products_export.csv</code>, les variantes de tailles et photos sont créées instantanément.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <FileSpreadsheet size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Tableaux Excel (.xlsx, .csv) :</strong> importez vos listes de prix et de stocks sans reformatage complexe.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <Sparkles size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--navy, #1C2B4A)' }}><strong>Conciergerie Gratuite Dakar :</strong> notre équipe configure votre boutique gratuitement sous 24h par WhatsApp si besoin.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/migration"
                  style={{
                    padding: '11px 20px',
                    borderRadius: 10,
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(37,99,235,0.3)'
                  }}
                >
                  <UploadCloud size={14} />
                  <span>Lancer la Migration</span>
                </Link>

                <Link
                  href="/migration"
                  style={{
                    padding: '11px 16px',
                    color: '#2563EB',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textDecoration: 'underline'
                  }}
                >
                  Voir le guide de migration (/migration) →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* CÔTÉ DROIT : MOCKUP INTERACTIF DU MODULE ACTIF */}
        <StageMockups activeFeature={activeFeature} />
      </div>
    </section>
  )
}
