'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export default function ShowcaseTabs({ 
  prixTafTaf = 2500, 
  prixPro = 15000, 
  prixBusiness = 35000 
}: { 
  prixTafTaf?: number; 
  prixPro?: number; 
  prixBusiness?: number;
}) {
  const [duree, setDuree] = useState<'1m' | '12m'>('1m');

  return (
    <section className="showcase-section" style={{
      background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      borderRadius: 24,
      padding: '44px 24px',
      margin: '40px 0',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            alignSelf: 'center', background: '#fff7ed', color: '#c75b00',
            fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
            border: '1px solid #ffedd5', display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            <Sparkles size={14} style={{ color: '#C75B00' }} />
            <span>Formules & Solutions Commerciales Nopalou</span>
          </div>

          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.25 }}>
            Propulsez vos ventes avec des outils de gestion <span style={{ color: '#C75B00' }}>puissants & simples</span>
          </h2>

          <p style={{ fontSize: 15, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Choisissez la formule adaptée à votre commerce. Essayez gratuitement pendant 30 jours, sans engagement.
          </p>

          {/* Selector Durée */}
          <div style={{
            display: 'inline-flex', alignSelf: 'center', background: '#f1f5f9', padding: 4, borderRadius: 30,
            border: '1px solid #cbd5e1', marginTop: 10
          }}>
            <button
              onClick={() => setDuree('1m')}
              style={{
                padding: '8px 18px', borderRadius: 20, border: 'none',
                background: duree === '1m' ? '#fff' : 'transparent',
                color: duree === '1m' ? '#C75B00' : '#64748b',
                fontWeight: duree === '1m' ? 800 : 600, fontSize: 13, cursor: 'pointer',
                boxShadow: duree === '1m' ? '0 2px 6px rgba(199,91,0,0.12)' : 'none',
              }}
            >
              Mensuel (30 jours offerts)
            </button>
            <button
              onClick={() => setDuree('12m')}
              style={{
                padding: '8px 18px', borderRadius: 20, border: 'none',
                background: duree === '12m' ? '#C75B00' : 'transparent',
                color: duree === '12m' ? '#fff' : '#64748b',
                fontWeight: duree === '12m' ? 800 : 600, fontSize: 13, cursor: 'pointer',
                boxShadow: duree === '12m' ? '0 4px 12px rgba(199,91,0,0.25)' : 'none',
              }}
            >
              Engagement 12 mois (-25% + 3 mois offerts 🔥)
            </button>
          </div>
        </div>

        {/* ── FRISE DU CYCLE COMPLET : RECHERCHE → LIVRAISON ─────────── */}
        <div style={{
          background: '#fff7ed', borderRadius: 16, border: '1px solid #fed7aa',
          padding: '20px 16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(199,91,0,0.05)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#c75b00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Chaîne de Valeur Complète Vendeurs &amp; Client
            </span>
            <h4 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              De la Recherche du Produit jusqu&apos;à la Remise en Main Propre par le Livreur
            </h4>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
            alignItems: 'center', textAlign: 'center'
          }}>
            <div style={{ background: '#fff', padding: '12px 10px', borderRadius: 12, border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: 20 }}>🔎 1. Recherche</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Comparateur &amp; WhatsApp Bot</div>
            </div>
            <div style={{ background: '#fff', padding: '12px 10px', borderRadius: 12, border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: 20 }}>🛒 2. Commande</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Panier Web, WhatsApp &amp; POS</div>
            </div>
            <div style={{ background: '#fff', padding: '12px 10px', borderRadius: 12, border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: 20 }}>💳 3. Paiement</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Wave, Cash, Crédit ou Manuel</div>
            </div>
            <div style={{ background: '#fff', padding: '12px 10px', borderRadius: 12, border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: 20 }}>📦 4. Préparation</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Gestion des statuts de stock</div>
            </div>
            <div style={{ background: '#fff', padding: '12px 10px', borderRadius: 12, border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: 20 }}>🚚 5. Livraison</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Suivi &amp; Alerte client WhatsApp</div>
            </div>
          </div>
        </div>

        {/* Grille des 3 Formules Alignées */}
        <div className="showcase-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          
          {/* Formule 1 : Boutique Taf Taf */}
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: '28px 24px',
            border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', position: 'relative'
          }}>
            <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, marginBottom: 12, width: 'fit-content' }}>
              ⚡ Débutant &amp; Vente WhatsApp
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Boutique Taf Taf</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
              Créez votre vitrine en 30 secondes et vendez directement sur WhatsApp.
            </p>
            
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>
                  {duree === '12m' ? (prixTafTaf * 0.75).toLocaleString('fr-FR') : prixTafTaf.toLocaleString('fr-FR')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>FCFA / mois</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>
                🎁 1er mois 100% GRATUIT
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>🌟 Baguette Magique (Import Ali/SHEIN) :</strong> Recopie auto titre, prix &amp; photos en 1 clic</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📢 Produit → Annonce en 1 Clic :</strong> Diffusion directe en Petite Annonce sponsorisée</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📱 Catalogue Web &amp; Panier WhatsApp :</strong> Commandes pré-remplies dans votre WhatsApp</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📦 Produits &amp; Photos Illimités :</strong> Gestion facile des stocks &amp; prix barrés</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>🔗 Lien `/boutiques/[nom]` + QR Code :</strong> Téléchargeable pour flyers &amp; réseaux</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>🚚 Suivi Commande &amp; Livraison WhatsApp :</strong> Alerte automatique du client à l&apos;expédition</span>
              </div>
            </div>

            <Link
              href="/creer-boutique?plan=decouverte"
              style={{
                textAlign: 'center', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1',
                padding: '12px', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)', transition: 'all 0.15s'
              }}
            >
              Lancer en 30s (1 mois offert) →
            </Link>
          </div>

          {/* Formule 2 : Vendeur Pro (Star) */}
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: '28px 24px',
            border: '2px solid #C75B00', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(199, 91, 0, 0.12)', position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: -14, right: 20, background: '#C75B00', color: '#fff',
              padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              boxShadow: '0 4px 10px rgba(199,91,0,0.3)'
            }}>
              ⭐ Recommandé Magasins
            </div>

            <div style={{ display: 'inline-block', background: '#fff7ed', color: '#C75B00', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, marginBottom: 12, width: 'fit-content' }}>
              🛒 Caisse POS &amp; Gestion Magasin
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Vendeur Pro</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
              Caisse enregistreuse tactile, gestion de stock physique &amp; crédits clients.
            </p>
            
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#C75B00' }}>
                  {duree === '12m' ? (prixPro * 0.75).toLocaleString('fr-FR') : prixPro.toLocaleString('fr-FR')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>FCFA / mois</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>
                🎁 1er mois 100% GRATUIT
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Tout ce qui est dans Boutique Taf Taf +</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>🛒 Caisse POS Enregistreuse Tactile :</strong> Sur smartphone, tablette ou ordinateur PC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📷 Scan Codes-Barres EAN-13 par Caméra :</strong> Scan 1-clic avec l&apos;appareil photo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>🏷️ Édition &amp; Impression Stickers (50x30mm) :</strong> Imprimez vos codes-barres étiquettes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📖 Carnet de Crédits Client &amp; Relance 1-Clic :</strong> Relancez les impayés sur WhatsApp</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📄 Factures &amp; Devis PDF Pro :</strong> Envoi 1-clic direct sur WhatsApp avec logo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📦 Suivi &amp; Préparation de Commande :</strong> Statuts en direct (Attente → Préparation → Prêt → En Livraison)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#C75B00', flexShrink: 0, marginTop: 2 }} />
                <span><strong>⭐ Badge Vendeur Pro Verified :</strong> Placement prioritaire dans l&apos;annuaire</span>
              </div>
            </div>

            <Link
              href="/creer-boutique?plan=pro"
              style={{
                textAlign: 'center', background: '#C75B00', color: '#fff',
                padding: '13px', borderRadius: 12, fontWeight: 900, fontSize: 14, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(199,91,0,0.3)', transition: 'all 0.15s'
              }}
            >
              Essayer Vendeur Pro (1 mois offert) →
            </Link>
          </div>

          {/* Formule 3 : Business VIP */}
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: '28px 24px',
            border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', position: 'relative'
          }}>
            <div style={{ display: 'inline-block', background: '#f8fafc', color: '#0f172a', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, marginBottom: 12, width: 'fit-content', border: '1px solid #e2e8f0' }}>
              💼 Équipes &amp; Multi-Caissiers
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Business VIP</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
              Gestion multi-vendeurs, analytics de marge nette &amp; visibilité maximale.
            </p>
            
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>
                  {duree === '12m' ? (prixBusiness * 0.75).toLocaleString('fr-FR') : prixBusiness.toLocaleString('fr-FR')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>FCFA / mois</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>
                🎁 1er mois 100% GRATUIT
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                <Check size={16} style={{ color: '#0f172a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>Tout ce qui est dans Vendeur Pro +</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#0f172a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>👥 Multi-Caissiers &amp; Droits Équipe :</strong> Accès illimités vendeurs avec restriction des marges</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#0f172a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📊 Analytics CA &amp; Marges Nettes :</strong> Graphiques en temps réel &amp; classement vendeurs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#0f172a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>📣 Bannière Sponsorisée VIP :</strong> Emplacement prioritaire en tête de catégorie</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                <Check size={16} style={{ color: '#0f172a', flexShrink: 0, marginTop: 2 }} />
                <span><strong>⚡ Support WhatsApp VIP 7j/7 :</strong> Ligne directe avec un conseiller technique</span>
              </div>
            </div>

            <Link
              href="/creer-boutique?plan=business"
              style={{
                textAlign: 'center', background: '#0f172a', color: '#fff',
                padding: '12px', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)', transition: 'all 0.15s'
              }}
            >
              Choisir Business VIP →
            </Link>
          </div>

        </div>

        {/* ── SECTION DÉDIÉE : TOUT CE QUI EST POSSIBLE SUR WHATSAPP ────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 20, padding: '32px 24px', color: '#fff', marginTop: 16,
          border: '1px solid rgba(37, 211, 102, 0.3)', boxShadow: '0 8px 24px rgba(37,211,102,0.1)'
        }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <span style={{
              background: '#25D366', color: '#0f172a', fontSize: 12, fontWeight: 900,
              padding: '4px 14px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              💬 NOPALOU × WHATSAPP ECOSYSTEM
            </span>
            <h3 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 900, margin: '10px 0 6px', color: '#fff' }}>
              Tout ce que vous pouvez faire avec <span style={{ color: '#25D366' }}>WhatsApp</span> sur Nopalou
            </h3>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0 }}>
              Zéro application lourde à installer — gérez vos achats et vos ventes directement dans votre messagerie habituelle.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            
            {/* Blocs Acheteurs */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#25D366', marginBottom: 12 }}>
                <span>🛒 Pour les Acheteurs</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>🛒 <strong>Commande WhatsApp 1-Clic :</strong> Votre panier web est converti en bon de commande WhatsApp structuré.</li>
                <li>🔑 <strong>Connexion OTP sans mot de passe :</strong> Recevez un code de validation sécurisé sur votre WhatsApp.</li>
                <li>🤖 <strong>Assistant Bot Nopalou (`+221 70 871 79 42`) :</strong> Envoyez le nom d&apos;un produit sur WhatsApp et recevez le comparatif des prix de Dakar.</li>
                <li>🔔 <strong>Alertes Prix Automatiques :</strong> Recevez une alerte directe sur WhatsApp dès qu&apos;un article baisse de prix.</li>
              </ul>
            </div>

            {/* Blocs Commerçants */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#25D366', marginBottom: 12 }}>
                <span>🏪 Pour les Commerçants</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>📲 <strong>Alertes Commande Instantanées :</strong> Recevez chaque commande client pré-remplie directement sur votre WhatsApp.</li>
                <li>💬 <strong>Relance Impayés en 1 Clic :</strong> Depuis la Caisse POS, relancez les clients débiteurs avec leur solde exact par message.</li>
                <li>📄 <strong>Envoi Factures &amp; Devis PDF :</strong> Transmettez des factures professionnelles avec votre logo directement sur WhatsApp.</li>
                <li>⚡ <strong>Support Technologique VIP 7j/7 :</strong> Assistance prioritaire directe avec l&apos;équipe technique Nopalou.</li>
              </ul>
            </div>

            {/* Blocs Apporteurs */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#25D366', marginBottom: 12 }}>
                <span>💼 Pour les Apporteurs</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>🔗 <strong>Partage Statut &amp; Groupes WhatsApp :</strong> Diffusez votre lien de parrainage en 1 clic à vos contacts commerçants.</li>
                <li>💰 <strong>Notifications de Commission :</strong> Soyez notifié sur WhatsApp dès qu&apos;une boutique parrainée s&apos;abonne.</li>
                <li>📲 <strong>Demande de Retrait Mobile Money :</strong> Demandez vos paiements de commission directement par messagerie.</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Note de réassurance */}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
          🔒 Paiement sécurisé via Wave ou Manuel · Sans engagement de durée · Annulation en 1 clic
        </div>
      </div>
    </section>
  );
}
