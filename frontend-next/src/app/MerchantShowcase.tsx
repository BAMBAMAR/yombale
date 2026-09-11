'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Zap,
  Store,
  BookOpen,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Smartphone,
  WifiOff,
  Printer,
  TrendingUp,
  Clock,
  HelpCircle,
  ChevronDown,
  Star,
  Users,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  Check,
  X,
  Play,
  QrCode,
  Layers,
  Sparkles,
  CreditCard,
  Receipt,
  ShoppingBag,
  BadgePercent
} from 'lucide-react'
import TarifsPublicsSelector from './tarifs-boutique/TarifsPublicsSelector'

interface Props {
  prixTafTaf?: number
}

type FeatureTab = 'pos' | 'boutique' | 'whatsapp' | 'migration'

export default function MerchantShowcase({ prixTafTaf = 2500 }: Props) {
  // Onglet interactif du Master Feature Stage
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('pos')

  // Simulateur de gains 0% commission
  const [caMensuel, setCaMensuel] = useState<number>(1200000)
  const commissionClassique = Math.round(caMensuel * 0.12) // 12% moyenne plateformes
  const coutNopalou = prixTafTaf
  const economieCommercant = commissionClassique - coutNopalou

  // État des questions fréquentes (FAQ accordéon)
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0)

  const faqs = [
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

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. LE MASTER FEATURE STAGE INTERACTIF (CONTINU & SANS RUPTURE)    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 48, paddingTop: 8 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 24px' }}>
          <div style={{
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
          }}>
            <Sparkles size={13} color="var(--accent, #C75B00)" />
            <span>LA SUITE COMMERCIALE TOUT-EN-UN SÉNÉGALAISE</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(24px, 2.6vw, 32px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            Les 4 Piliers de Votre Activité Commerciale
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
            Cliquez sur un module pour découvrir son fonctionnement concret et manipuler le simulateur interactif.
          </p>
        </div>

        {/* Barre de Commutation Segmentée des 4 Modules */}
        <div style={{
          display: 'flex',
          background: '#F1F5F9',
          borderRadius: 16,
          padding: 5,
          gap: 6,
          marginBottom: 20,
          border: '1px solid #E2E8F0',
          overflowX: 'auto'
        }}>
          {[
            { id: 'pos', label: 'Caisse POS Tactile (Offline)', icon: Zap, badge: 'Hors-Ligne' },
            { id: 'boutique', label: 'Boutique en Ligne & Vitrine', icon: Store, badge: '0% Comm.' },
            { id: 'whatsapp', label: 'Vente WhatsApp & Dettes', icon: MessageCircle, badge: 'Relance 1-Clic' },
            { id: 'migration', label: 'Migration Shopify & Excel', icon: RefreshCw, badge: 'Sans ressaisie' },
          ].map((tab) => {
            const Icon = tab.icon
            const isSelected = activeFeature === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFeature(tab.id as FeatureTab)}
                style={{
                  flex: 1,
                  minWidth: 160,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: isSelected ? '#1C2B4A' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 900 : 700,
                  fontSize: 12.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 4px 14px rgba(28,43,74,0.18)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} color={isSelected ? '#FED7AA' : 'var(--accent, #C75B00)'} />
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 900,
                  background: isSelected ? 'rgba(254,215,170,0.2)' : '#E2E8F0',
                  color: isSelected ? '#FED7AA' : '#64748B',
                  padding: '2px 6px',
                  borderRadius: 8
                }}>
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Plateau Interactif (Stage) : Split Gauche Argumentaire / Droite Mockup Live */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          padding: '30px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          alignItems: 'center'
        }}>
          
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
                    href="/pos"
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
                    href="/whatsapp"
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

          {/* CÔTÉ DROIT : MOCKUP INTERACTIF DU MODULE ACTIF (VISUAL PROOF) */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 16,
            padding: '20px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {activeFeature === 'pos' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#A7F3D0' }}>CAISSE HORS-LIGNE ACTIVE</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: '#94A3B8' }}>PIN : <strong>Caissier #2</strong></span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span>1× Smartphone Samsung Galaxy A15</span>
                    <strong>115 000 F</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span>1× Écouteurs Bluetooth Pro</span>
                    <strong>15 000 F</strong>
                  </div>
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900 }}>
                    <span style={{ color: '#FED7AA' }}>Total à Encaisser :</span>
                    <span style={{ color: '#FED7AA' }}>130 000 FCFA</span>
                  </div>
                </div>

                <div style={{ background: '#15803D', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
                  <span>💵 Espèces : 150 000 F</span>
                  <span>Monnaie à rendre : <strong>20 000 F</strong></span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href="/boutique/caisse"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      background: 'var(--accent, #C75B00)',
                      color: '#fff',
                      fontSize: 11.5,
                      fontWeight: 800,
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    ⚡ Ouvrir la Caisse
                  </Link>
                  <Link
                    href="/demo?role=marchand"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 11.5,
                      fontWeight: 800,
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    🎮 Démo plein écran
                  </Link>
                </div>
              </div>
            )}

            {activeFeature === 'boutique' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#A7F3D0' }}>
                    <span>🔒 nopalou.com/b/dakar-tech</span>
                  </div>
                  <span style={{ fontSize: 10, background: '#16A34A', color: '#fff', padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>
                    0% COMMISSION
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#FED7AA', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>
                    Article en Vitrine
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>Montre Connectée Sport Series 9</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#A7F3D0', marginBottom: 10 }}>28 000 FCFA</div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, background: '#1D4ED8', color: '#fff', padding: '6px', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 800 }}>
                      Payer par Wave (0%)
                    </div>
                    <div style={{ flex: 1, background: '#EA580C', color: '#fff', padding: '6px', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 800 }}>
                      Orange Money (0%)
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4, textAlign: 'center' }}>
                  Vos clients commandent directement sur votre boutique ou sur WhatsApp sans intermédiaire.
                </div>
              </div>
            )}

            {activeFeature === 'whatsapp' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#86EFAC' }}>
                    <MessageCircle size={14} />
                    <span>WhatsApp Assistant Nopalou</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>Aujourd&apos;hui 19:42</span>
                </div>

                <div style={{ background: '#064E3B', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 11.5, lineHeight: 1.45, borderLeft: '3px solid #22C55E' }}>
                  <div style={{ fontWeight: 800, color: '#A7F3D0', marginBottom: 4 }}>📦 NOUVELLE COMMANDE REÇUE :</div>
                  <div>Client : Aminata Fall (+221 77 123 45 67)</div>
                  <div>Article : Robe Wax Moderne (Taille L)</div>
                  <div style={{ fontWeight: 800, color: '#FED7AA' }}>Total : 18 500 FCFA • Livr. Point E</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.45, borderLeft: '3px solid #3B82F6' }}>
                  <div style={{ fontWeight: 800, color: '#93C5FD', marginBottom: 4 }}>📒 RELANCE DETTE 1-CLIC :</div>
                  <div>&laquo; Bonjour Ousmane, solde restant de 25 000 F. Cliquez ici pour régler par Wave : wave.me/pay/dakar-tech &raquo;</div>
                </div>
              </div>
            )}

            {activeFeature === 'migration' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#93C5FD' }}>
                    <UploadCloud size={14} />
                    <span>MOTEUR D&apos;IMPORT UNIFIÉ</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#86EFAC', fontWeight: 800 }}>DÉTECTION AUTOMATIQUE</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: 14, textAlign: 'center', marginBottom: 12 }}>
                  <UploadCloud size={22} color="#93C5FD" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 12, fontWeight: 800 }}>products_export.csv (Shopify)</div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>142 produits &bull; 380 photos &bull; Tailles S, M, L, XL</div>
                  <div style={{ marginTop: 6, fontSize: 10.5, color: '#86EFAC', fontWeight: 900 }}>
                    ✅ Prêt à être importé en 1 clic
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4, textAlign: 'center' }}>
                  Économisez 18 000 FCFA/mois de frais Shopify et encaissez sans carte bancaire internationale.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. MATRICE COMPARATIVE STRATÉGIQUE (ÉLÉGANTE, STYLE STRIPE)       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 20px' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Comparatif Objectif
          </span>
          <h2 style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0 6px' }}>
            Pourquoi Choisir Nopalou face aux Alternatives ?
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text2, #5A4E42)' }}>
            Comparez en un coup d&apos;œil ce qui fait la différence pour votre rentabilité au quotidien à Dakar.
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--navy, #1C2B4A)', width: '28%' }}>Critère Clé</th>
                  <th style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--accent, #C75B00)', background: '#FFF7ED', width: '26%' }}>
                    🌟 Nopalou Retail &amp; POS
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '15%' }}>WhatsApp Seul</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '15%' }}>Cahier Papier</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '16%' }}>Shopify ($29/m)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Commission sur vos ventes</td>
                  <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>0% (Direct Wave/OM)</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>0%</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>0%</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>2% + Frais passerelle</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Caisse POS Hors-Ligne (Sans Net)</td>
                  <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>✅ 100% Hors-Ligne (PWA)</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>❌ Dépend d&apos;Internet</td>
                  <td style={{ padding: '12px 16px', color: '#16A34A' }}>✅ Manuel</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>❌ Connexion requise</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Carnet Dettes &amp; Relance Wave</td>
                  <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>✅ Relances 1-Clic Wave</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>❌ Messages manuels</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>❌ Oublis fréquents</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>❌ Non adapté Sénégal</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Matériel supplémentaire requis</td>
                  <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: '#16A34A' }}>0 F (Votre smartphone)</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>Smartphone</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>Cahier d&apos;écolier</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>PC obligatoire</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Prix d&apos;accès</td>
                  <td style={{ padding: '12px 16px', background: '#FFF7ED', fontWeight: 900, color: 'var(--accent, #C75B00)' }}>Dès 2 500 F/mois (30j offerts)</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>Gratuit (3h perdues/j)</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>Cahier (~1 000 F)</td>
                  <td style={{ padding: '12px 16px', color: '#DC2626' }}>29 $ (~18 000 F) + Visa</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
              Consulter l&apos;analyse complète et les études de cas détaillées :
            </span>
            <Link href="/pourquoi-nopalou" style={{ color: 'var(--accent, #C75B00)', fontWeight: 800, fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>Lire le comparatif complet Pourquoi Choisir Nopalou ?</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. CHAPITRE UNIFIÉ : RENTABILITÉ & TARIFS (FIN DU DOUBLE-BEIGE)   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '32px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: 48
      }}>
        {/* En-tête de section unique */}
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#DCFCE7',
            color: '#15803D',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 900,
            marginBottom: 8
          }}>
            <BadgePercent size={13} />
            <span>0% DE COMMISSION • 30 JOURS 100% OFFERTS SANS ENGAGEMENT</span>
          </div>

          <h2 style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Rentabilité Immédiate &amp; Tarifs Sans Frais Cachés
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
            Calculez précisément ce que vous économisez avec le 0% de commission, puis choisissez le forfait adapté à votre taille.
          </p>
        </div>

        {/* Partie A : Le Simulateur d'Économie 0% Commission */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '20px',
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent, #C75B00)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Simulateur de Gains : Comparez Nopalou aux Plateformes Traditionnelles
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
                Les marketplaces prélèvent entre 10% et 15% sur votre chiffre d&apos;affaires. Sur Nopalou, vous gardez 100%.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            alignItems: 'center'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                Votre chiffre d&apos;affaires mensuel estimé :
              </label>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent, #C75B00)', marginBottom: 8 }}>
                {caMensuel.toLocaleString('fr-FR')} FCFA / mois
              </div>
              <input
                type="range"
                min={200000}
                max={5000000}
                step={100000}
                value={caMensuel}
                onChange={(e) => setCaMensuel(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent, #C75B00)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                <span>200 000 F</span>
                <span>2 500 000 F</span>
                <span>5 000 000 F</span>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 18px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: '#DC2626' }}>Commission prélevée ailleurs (12%) :</span>
                <strong style={{ color: '#DC2626' }}>- {commissionClassique.toLocaleString('fr-FR')} F</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: '#16A34A' }}>Abonnement Nopalou Taf-Taf :</span>
                <strong style={{ color: '#16A34A' }}>{coutNopalou.toLocaleString('fr-FR')} F (Fixe)</strong>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text2, #5A4E42)', textTransform: 'uppercase' }}>
                    Gain net conservé dans votre poche :
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>
                    + {economieCommercant.toLocaleString('fr-FR')} FCFA / mois
                  </div>
                </div>

                <Link
                  href="/creer-boutique"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#16A34A',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 900,
                    textDecoration: 'none'
                  }}
                >
                  En profiter →
                </Link>
              </div>
            </div>
          </div>
        </div>


        {/* Partie B : La Grille Tarifaire Officielle */}
        <div style={{ marginBottom: 16 }}>
          <TarifsPublicsSelector />
        </div>

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <Link
            href="/tarifs-boutique"
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--accent, #C75B00)',
              textDecoration: 'underline'
            }}
          >
            Consulter la page officielle Tarifs Forfaits Vendeurs (/tarifs-boutique) →
          </Link>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. BAC À SABLE DÉMO (STYLE COMMANDE CENTER NAVY, EXIT LE VERT CRIARD) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 48 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '26px 24px',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 36
        }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16,185,129,0.2)',
              color: '#A7F3D0',
              padding: '4px 10px',
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 900,
              marginBottom: 8,
              border: '1px solid rgba(16,185,129,0.3)'
            }}>
              <Play size={12} fill="#A7F3D0" />
              <span>TEST EN DIRECT SANS CRÉATION DE COMPTE</span>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 900, color: '#ffffff' }}>
              Testez la Caisse POS &amp; la Boutique en Démo Interactive
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>
              Prenez les commandes d&apos;une boutique test à Dakar : ajoutez des articles, encaissez en espèces ou Wave et simulez un ticket de caisse en moins de 30 secondes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/demo?role=marchand"
              style={{
                padding: '12px 22px',
                borderRadius: 10,
                background: '#ffffff',
                color: '#0F172A',
                fontSize: 13,
                fontWeight: 900,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              <Play size={14} fill="#0F172A" />
              <span>Lancer la Démo Marchand</span>
            </Link>

            <Link
              href="/demo"
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              Explorer toute la Démo →
            </Link>
          </div>
        </div>

        {/* Témoignages Commerçants Vérifiés */}
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 20px' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Témoignages Vérifiés
          </span>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0' }}>
            Adopté par les commerçants de Sandaga, Tilène et Castors
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', gap: 2, color: '#EAB308', marginBottom: 8 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" />)}
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--navy, #1C2B4A)', fontStyle: 'italic', lineHeight: 1.45 }}>
              &laquo; Avant, mes caissiers notaient tout sur un cahier. Le soir, il manquait toujours de l&apos;argent. Avec la caisse Nopalou sur tablette, chaque vente est tracée avec le PIN du vendeur et la clôture Z est exacte à 100%. &raquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1C2B4A 0%, #C75B00 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                M
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>Moustapha Ndiaye</strong>
                <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>Électronique &amp; Accessoires · Sandaga</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', gap: 2, color: '#EAB308', marginBottom: 8 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" />)}
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--navy, #1C2B4A)', fontStyle: 'italic', lineHeight: 1.45 }}>
              &laquo; Le carnet de dettes est magique. J&apos;avais plus de 400 000 F de crédits éparpillés. J&apos;ai appuyé sur Relancer WhatsApp : le message part avec le montant et le bouton Wave. J&apos;ai récupéré la moitié dès le premier weekend ! &raquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                F
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>Fatou Kiné Sarr</strong>
                <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>Prêt-à-porter &amp; Cosmétiques · Castors</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', gap: 2, color: '#EAB308', marginBottom: 8 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#EAB308" />)}
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--navy, #1C2B4A)', fontStyle: 'italic', lineHeight: 1.45 }}>
              &laquo; Ce que j&apos;apprécie le plus, c&apos;est le 0% de commission. Je vends mes téléphones sur ma vitrine Nopalou, les clients paient par Wave et l&apos;argent arrive directement sur mon compte sans intermédiaire. C&apos;est imbattable. &raquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                B
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', display: 'block' }}>Babacar Amar</strong>
                <span style={{ fontSize: 11.5, color: 'var(--text2, #5A4E42)' }}>Smartphones &amp; High-Tech · Médina</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 5. FAQ ACCORDÉON SOBRE & BANNIÈRE FINALE UNIFIÉE                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '24px 20px',
        marginBottom: 36
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <HelpCircle size={22} color="var(--accent, #C75B00)" />
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Questions fréquentes des commerçants
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, index) => {
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

      {/* BANNIÈRE FINALE D'ENGAGEMENT : DEEP SLATE NAVY SOBRE & ÉLÉGANTE */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 20,
        padding: '32px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 20
      }}>
        <h3 style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 900, margin: '0 0 8px', color: '#ffffff' }}>
          Prêt à moderniser votre boutique dès aujourd&apos;hui ?
        </h3>
        <p style={{ fontSize: 13.5, margin: '0 auto 22px', maxWidth: 520, lineHeight: 1.5, color: '#CBD5E1' }}>
          Testez la Caisse POS gratuitement ou lancez votre boutique en ligne avec 30 jours offerts. Sans carte bancaire ni engagement.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/creer-boutique"
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 900,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(199,91,0,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>Créer ma Boutique (30j offerts)</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/boutique/caisse"
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Zap size={15} fill="#fff" />
            <span>Ouvrir la Caisse POS</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
