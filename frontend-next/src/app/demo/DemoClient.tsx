'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface PublicSettings {
  plan_pro_prix?: string;
  plan_business_prix?: string;
  plan_pro_label?: string;
  plan_business_label?: string;
  apporteur_taux_commission?: string;
  paiement_wave?: string;
  paiement_orange?: string;
  reduc_3_mois?: string;
  reduc_6_mois?: string;
  reduc_12_mois?: string;
}

interface DemoClientProps {
  initialRef?: string;
  initialRole?: 'acheteur' | 'marchand' | 'apporteur';
  initialSettings?: PublicSettings;
}

export default function DemoClient({
  initialRef = '',
  initialRole = 'acheteur',
  initialSettings = {},
}: DemoClientProps) {
  // State variables
  const [activeRole, setActiveRole] = useState<'acheteur' | 'marchand' | 'apporteur'>(initialRole);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeGuideTab, setActiveGuideTab] = useState<string>('compte');
  const [referralCode, setReferralCode] = useState<string>(initialRef);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Dynamic Settings State
  const [settings, setSettings] = useState<PublicSettings>(initialSettings);

  // Active Tooltip / Button Explanation Modal State
  const [activeExplanation, setActiveExplanation] = useState<{ title: string; desc: string; backend: string; benefit: string } | null>(null);

  // Apporteur Calculator State
  const [nbBoutiquesPro, setNbBoutiquesPro] = useState<number>(10);
  const [nbBoutiquesBusiness, setNbBoutiquesBusiness] = useState<number>(5);

  // Merchant Sandbox State
  const [merchantTab, setMerchantTab] = useState<'catalogue' | 'pos' | 'credit' | 'analytics' | 'equipe'>('pos');
  const [showStickerModal, setShowStickerModal] = useState<boolean>(false);
  const [stickerProd, setStickerProd] = useState<{ nom: string; prix: number; ean: string } | null>(null);

  const [showWaRelanceModal, setShowWaRelanceModal] = useState<boolean>(false);
  const [relanceClient, setRelanceClient] = useState<{ nom: string; tel: string; solde: number; echeance: string; quartier: string } | null>(null);

  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [showCloudScannerModal, setShowCloudScannerModal] = useState<boolean>(false);

  // Merchant POS Cart state
  const [posCart, setPosCart] = useState<{ id: string; name: string; price: number; qty: number; ean: string }[]>([
    { id: '1', name: 'Sac de Riz Parfumé 50kg', price: 22500, qty: 1, ean: '2008492019482' },
    { id: '2', name: 'Huile Dinor 5L', price: 7500, qty: 2, ean: '2004928104829' },
  ]);

  // WhatsApp simulation chat state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    { sender: 'bot', text: 'Bonjour ! Bienvenue sur Nopalou WhatsApp 🤖. Que recherchez-vous aujourd\'hui ? (ex: Riz 50kg, iPhone 15, Forfait Orange 5Go, Appartement Mermoz)', time: '10:00' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Fetch dynamic settings from API on mount
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.ok ? res.json() : null)
      .then((data: PublicSettings | null) => {
        if (data) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com';
  const shareableUrl = currentHost + '/demo?role=' + activeRole + (referralCode ? '&ref=' + referralCode : '');

  const handleRoleChange = (role: 'acheteur' | 'marchand' | 'apporteur') => {
    setActiveRole(role);
    setActiveStep(1);
  };

  // DYNAMIC PRICING AND COMMISSION VALUES FROM BACKEND SETTINGS
  const prixPro = Number(settings.plan_pro_prix) || 15000;
  const prixBusiness = Number(settings.plan_business_prix) || 35000;
  const tauxCommissionPourcent = Number(settings.apporteur_taux_commission) || 20;
  const tauxCommissionDecimal = tauxCommissionPourcent / 100;
  const labelPro = settings.plan_pro_label || 'Boutique Pro';
  const labelBusiness = settings.plan_business_label || 'Boutique Business';

  const commissionProParUnite = Math.round(prixPro * tauxCommissionDecimal);
  const commissionBusinessParUnite = Math.round(prixBusiness * tauxCommissionDecimal);

  const caTotalGenerer = (nbBoutiquesPro * prixPro) + (nbBoutiquesBusiness * prixBusiness);
  const commissionMensuelle = Math.round(caTotalGenerer * tauxCommissionDecimal);
  const commissionAnnuelle = commissionMensuelle * 12;

  const totalPosCart = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeNow }]);
    setChatInput('');

    setTimeout(() => {
      let botReply = '🛒 3 résultats trouvés pour "' + userMsg + '" au meilleur prix :\n\n1. Auchan Dakar : 21 900 FCFA\n2. Boutique Touba Express (Vendeur Pro) : 21 500 FCFA (En stock)\n\n👉 Appuyez sur [🛒 Commander] pour commander par Wave ou Orange Money !';
      
      if (userMsg.toLowerCase().includes('immo') || userMsg.toLowerCase().includes('appartement')) {
        botReply = '🏠 2 Appartements trouvés à Mermoz & Almadies :\n• Studio meublé Mermoz : 250 000 FCFA/mois\n• F3 Almadies : 450 000 FCFA/mois\n\nContact direct bailleur certifié sur Nopalou !';
      } else if (userMsg.toLowerCase().includes('telecom') || userMsg.toLowerCase().includes('forfait') || userMsg.toLowerCase().includes('orange')) {
        botReply = '📱 Meilleur Pass Internet actuellement :\n• Orange Pass Max 10Go / 30j : 5 000 FCFA\n• Free Sénégal Illimité Week-end : 3 000 FCFA\n\nComparez les 25 forfaits sur nopalou.com/telecom !';
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 600);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const message = '👋 Découvre Nopalou, la plateforme tout-en-un au Sénégal ! 🚀\n\n- Comparateur de prix & Forfaits Telecom\n- Caisse enregistreuse POS & Carnet de crédits marchands\n- Assistant WhatsApp Bot 24/7\n- Programme Apporteur (' + tauxCommissionPourcent + '% commission récurrente)\n\nTest la démo interactive ici : ' + shareableUrl;
    const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  };

  const handleSimulateScanItem = () => {
    setShowScanModal(true);
    setTimeout(() => {
      setPosCart(prev => [
        ...prev,
        { id: String(Date.now()), name: 'Lait Bonnet Rouge 400g', price: 1200, qty: 1, ean: '2009841029412' }
      ]);
    }, 1500);
  };

  return (
    <div className="page-container" style={{ paddingTop: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Breadcrumb & Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/"
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: '#FFFFFF', color: 'var(--text1)', fontWeight: 700, fontSize: 13,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              ← Accueil Nopalou
            </Link>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)' }}>
                🚀 Démo Commerciale Interactive Nopalou
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                Simulateur dynamique synchronisé en temps réel avec les tarifs et paramètres du site.
              </div>
            </div>
          </div>

          {/* SIMULATED ACCOUNT BAR */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text1)' }}>
              <span style={{ color: 'var(--text2)' }}>Compte démo :</span> <strong>Boutique Touba Express</strong> <span style={{ color: '#059669', fontSize: 11 }}>({labelPro})</span>
            </div>
            <a
              href="/brochure-apporteur.pdf"
              target="_blank"
              download
              style={{
                background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: 20,
                fontWeight: 800, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
              }}
            >
              📄 Brochure PDF (13 p.)
            </a>
          </div>
        </div>

        {/* EXPLANATION POPUP BANNER IF ACTIVE */}
        {activeExplanation && (
          <div style={{
            background: '#EFF6FF', border: '1.5px solid #3B82F6', borderRadius: 12, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', boxShadow: 'var(--shadow)'
          }}>
            <button
              onClick={() => setActiveExplanation(null)}
              style={{ position: 'absolute', top: 10, right: 12, background: 'transparent', border: 'none', color: '#1E40AF', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
            >
              ✕
            </button>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1E3A8A' }}>
              {activeExplanation.title}
            </div>
            <div style={{ fontSize: 13, color: '#1E40AF' }}>
              📌 <strong>Explication :</strong> {activeExplanation.desc}
            </div>
            <div style={{ fontSize: 12, color: '#1E40AF' }}>
              ⚙️ <strong>Système :</strong> {activeExplanation.backend}
            </div>
            <div style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>
              💡 <strong>Bénéfice :</strong> {activeExplanation.benefit}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* HERO DE PRESENTATION                                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, #0F172A 100%)',
          borderRadius: 16,
          padding: '36px 24px',
          border: '1px solid var(--navy)',
          textAlign: 'center',
          boxShadow: 'var(--shadow2)',
          position: 'relative',
          overflow: 'hidden',
          color: '#FFFFFF'
        }}>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              <span style={{ background: 'var(--accent)', color: '#FFF', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                ⚡ Démo Commerciale Dynamique
              </span>
              <span style={{ background: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF', border: '1px solid #2DD4BF', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                🛡️ Commission Apporteur : {tauxCommissionPourcent}% Récurrent
              </span>
              <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', border: '1px solid #FBBF24', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                💳 Wave &amp; Orange Money Ready
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, lineHeight: 1.25, color: '#FFFFFF', margin: 0 }}>
              L&apos;Écosystème Digital Tout-en-Un <br />
              <span style={{ color: '#FF8C00' }}>
                Pour Acheter, Vendre &amp; Entreprendre au Sénégal
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#E2E8F0', maxWidth: 760, margin: '0 auto', lineHeight: 1.6 }}>
              Nopalou combine un <strong style={{ color: '#FF8C00' }}>Super-Comparateur de prix</strong>, un{' '}
              <strong style={{ color: '#FFF' }}>Logiciel de Caisse POS tactile avec Scan EAN-13 &amp; Carnet de Dettes</strong>, un{' '}
              <strong style={{ color: '#FFF' }}>Bot WhatsApp Meta Commerce</strong> et un <strong style={{ color: '#2DD4BF' }}>Programme Apporteur {tauxCommissionPourcent}% récurrent</strong>.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 6 }}>
              <button
                onClick={() => {
                  const el = document.getElementById('simulateur-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  background: 'var(--accent)',
                  color: '#FFFFFF', border: 'none', padding: '13px 26px',
                  borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(199, 91, 0, 0.4)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🕹️ Tester le Bac à Sable Interactif</span>
              </button>

              <a
                href="/brochure-apporteur.pdf"
                target="_blank"
                download
                style={{
                  background: '#FFFFFF', color: 'var(--navy)', border: 'none',
                  padding: '13px 22px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none'
                }}
              >
                <span>📥 Télécharger la Brochure PDF (13 p.)</span>
              </a>
            </div>

          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SIMULATEUR LIVE À 3 PARCOURS                                 */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="simulateur-section" style={{ display: 'flex', flexDirection: 'column', gap: 18, scrollMarginTop: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ alignSelf: 'flex-start', background: '#FFF7ED', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              🕹️ SIMULATEUR D&apos;ÉCRAN BAC À SABLE PAS-À-PAS
            </span>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
              Choisissez un profil pour tester l&apos;interface réelle
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
              Cliquez sur les onglets et les boutons pour tester les fonctionnalités en direct.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 8, background: 'var(--card)', padding: 6, borderRadius: 12, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <button
              onClick={() => handleRoleChange('acheteur')}
              style={{
                background: activeRole === 'acheteur' ? 'linear-gradient(90deg, #C75B00, #EA580C)' : 'var(--bg)',
                color: activeRole === 'acheteur' ? '#FFF' : 'var(--text1)',
                border: activeRole === 'acheteur' ? 'none' : '1px solid var(--border)', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
              }}
            >
              <span style={{ fontSize: 18 }}>🛒</span>
              <span>1. Parcours Acheteur Malin</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'acheteur' ? 0.9 : 0.7, fontWeight: 400 }}>Comparateur &amp; WhatsApp</span>
            </button>

            <button
              onClick={() => handleRoleChange('marchand')}
              style={{
                background: activeRole === 'marchand' ? 'linear-gradient(90deg, #0D9488, #10B981)' : 'var(--bg)',
                color: activeRole === 'marchand' ? '#FFF' : 'var(--text1)',
                border: activeRole === 'marchand' ? 'none' : '1px solid var(--border)', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
              }}
            >
              <span style={{ fontSize: 18 }}>🏪</span>
              <span>2. Parcours Marchand POS</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'marchand' ? 0.9 : 0.7, fontWeight: 400 }}>Caisse POS, Scan EAN-13 &amp; Dettes</span>
            </button>

            <button
              onClick={() => handleRoleChange('apporteur')}
              style={{
                background: activeRole === 'apporteur' ? 'linear-gradient(90deg, #7C3AED, #6366F1)' : 'var(--bg)',
                color: activeRole === 'apporteur' ? '#FFF' : 'var(--text1)',
                border: activeRole === 'apporteur' ? 'none' : '1px solid var(--border)', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
              }}
            >
              <span style={{ fontSize: 18 }}>💼</span>
              <span>3. Parcours Apporteur d&apos;Affaires</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'apporteur' ? 0.9 : 0.7, fontWeight: 400 }}>Commissions {tauxCommissionPourcent}% &amp; Kit Commercial</span>
            </button>
          </div>

          {/* SIMULATOR SCREEN FRAME */}
          <div style={{
            borderRadius: 12, border: '1px solid var(--border)', background: '#0F172A', overflow: 'hidden', boxShadow: 'var(--shadow2)', color: '#FFFFFF'
          }}>
            {/* Window header */}
            <div style={{ background: '#020617', padding: '10px 14px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginLeft: 8 }}>
                  nopalou.com/demo/{activeRole}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', background: '#1E293B', padding: '3px 10px', borderRadius: 20 }}>
                MODE SIMULATION : {activeRole.toUpperCase()}
              </span>
            </div>

            {/* Window body */}
            <div style={{ padding: '20px 16px', minHeight: 380 }}>

              {/* 🏪 MARCHAND POS SANDBOX */}
              {activeRole === 'marchand' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Merchant Sub-tabs (100% Identical to real Boutique interface) */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: '#020617', padding: 6, borderRadius: 10, border: '1px solid #1E293B' }}>
                    {[
                      { id: 'pos', label: '🖥️ Caisse POS Tactile' },
                      { id: 'catalogue', label: '🛍️ Produits & EAN-13' },
                      { id: 'credit', label: '📓 Carnet Dettes Client' },
                      { id: 'analytics', label: '📊 Analytics & Ventes' },
                      { id: 'equipe', label: '👥 Équipe & PIN' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setMerchantTab(t.id as any)}
                        style={{
                          background: merchantTab === t.id ? 'var(--accent)' : 'transparent',
                          color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: 6,
                          fontWeight: 700, fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: POS CAISSE */}
                  {merchantTab === 'pos' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: '#1E293B', padding: 12, borderRadius: 8, fontSize: 12, color: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <span>💡 <strong>Mode Caisse POS :</strong> Encaissez vos ventes en magasin avec 3 modes de scan.</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={handleSimulateScanItem}
                            style={{ background: '#059669', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            📷 Scanner Caméra
                          </button>
                          <button
                            onClick={() => setShowCloudScannerModal(true)}
                            style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            📱 Douchette Smartphone
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        {/* Cart items */}
                        <div style={{ background: '#020617', padding: 14, borderRadius: 10, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>🛒 Panier Caisse Actuel</div>
                          {posCart.map(it => (
                            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A', padding: 8, borderRadius: 6, fontSize: 12 }}>
                              <div>
                                <div style={{ fontWeight: 700, color: '#FFF' }}>{it.name}</div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>EAN: {it.ean} | x{it.qty}</div>
                              </div>
                              <div style={{ fontWeight: 800, color: '#10B981' }}>{(it.price * it.qty).toLocaleString()} FCFA</div>
                            </div>
                          ))}
                        </div>

                        {/* Total & Checkout */}
                        <div style={{ background: '#020617', padding: 14, borderRadius: 10, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>TOTAL À ENCAISSER :</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: '#10B981' }}>{totalPosCart.toLocaleString()} FCFA</div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <button
                              onClick={() => setActiveExplanation({
                                title: '💶 Encaissement Cash / Espèces',
                                desc: 'Enregistre la vente en caisse, calcule la monnaie à rendre et met à jour le stock.',
                                backend: 'Insère la transaction dans la table comptabilite_transactions et incrémente le fond de caisse Z.',
                                benefit: 'Rapport de clôture de caisse 100% exact à la fin de la journée.'
                              })}
                              style={{ background: '#10B981', color: '#020617', border: 'none', padding: 8, borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                            >
                              💵 Cash Espèces
                            </button>
                            <button
                              onClick={() => setActiveExplanation({
                                title: '🌊 Encaissement Wave / Orange Money',
                                desc: 'Paiement sans contact Wave ou Orange Money directement sur le QR code du magasin.',
                                backend: 'Lien direct ou Webhook API Wave/OM avec réconciliation automatique.',
                                benefit: 'Encaissement rapide sans risque d\'erreur de monnaie.'
                              })}
                              style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: 8, borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                            >
                              🌊 Wave / OM
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CATALOGUE & EAN-13 */}
                  {merchantTab === 'catalogue' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: '#1E293B', padding: 12, borderRadius: 8, fontSize: 12, color: '#E2E8F0' }}>
                        🏷️ <strong>Gestion EAN-13 :</strong> Saisissez le code fabricant ou cliquez sur <code>🎲 Générer EAN</code> pour créer un code GS1 Modulo 10 scannable.
                      </div>

                      {[
                        { nom: 'Sac de Riz Parfumé 50kg', prix: 22500, stock: 45, ean: '2008492019482' },
                        { nom: 'Huile Dinor 5L', prix: 7500, stock: 120, ean: '2004928104829' },
                        { nom: 'Sucre Cristallisé 1kg', prix: 650, stock: 200, ean: '2007849102941' },
                      ].map((p, idx) => (
                        <div key={idx} style={{ background: '#020617', padding: 12, borderRadius: 8, border: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#FFF', fontSize: 13 }}>{p.nom}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.prix.toLocaleString()} FCFA | Stock: {p.stock} | EAN: <code>{p.ean}</code></div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                setStickerProd(p);
                                setShowStickerModal(true);
                              }}
                              style={{ background: 'var(--accent)', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                            >
                              🖨️ Sticker 50x30mm
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 3: CARNET DE CREDIT CLIENT */}
                  {merchantTab === 'credit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: '#1E293B', padding: 12, borderRadius: 8, fontSize: 12, color: '#E2E8F0' }}>
                        📓 <strong>Carnet Dettes Client :</strong> Fini le cahier papier ! Suivez les impayés et relancez en 1 clic sur WhatsApp.
                      </div>

                      {[
                        { nom: 'Mamadou Diallo', tel: '77 123 45 67', solde: 37500, echeance: '15 Août 2026', quartier: 'Medina Rue 11' },
                        { nom: 'Awa Ndiaye', tel: '78 987 65 43', solde: 14500, echeance: '05 Août 2026', quartier: 'HLM 5' },
                      ].map((c, idx) => (
                        <div key={idx} style={{ background: '#020617', padding: 12, borderRadius: 8, border: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#FFF', fontSize: 13 }}>👤 {c.nom} ({c.quartier})</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Tél: {c.tel} | Échéance: {c.echeance}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontWeight: 900, color: '#EF4444', fontSize: 14 }}>{c.solde.toLocaleString()} FCFA</div>
                            <button
                              onClick={() => {
                                setRelanceClient(c);
                                setShowWaRelanceModal(true);
                              }}
                              style={{ background: '#059669', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                            >
                              💬 WA Relance
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 4: ANALYTICS */}
                  {merchantTab === 'analytics' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                      <div style={{ background: '#020617', padding: 14, borderRadius: 8, border: '1px solid #1E293B' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>CA Du Jour :</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', marginTop: 4 }}>145 000 FCFA</div>
                      </div>
                      <div style={{ background: '#020617', padding: 14, borderRadius: 8, border: '1px solid #1E293B' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Ventes Caisse :</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#38BDF8', marginTop: 4 }}>18 Transactions</div>
                      </div>
                      <div style={{ background: '#020617', padding: 14, borderRadius: 8, border: '1px solid #1E293B' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Bénéfice Estime :</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>24 500 FCFA</div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: EQUIPE */}
                  {merchantTab === 'equipe' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                      <div style={{ background: '#020617', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
                        <span>👑 Bamba Diallo (Propriétaire)</span>
                        <span style={{ color: '#F59E0B', fontWeight: 700 }}>Intouchable</span>
                      </div>
                      <div style={{ background: '#020617', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
                        <span>👤 Modou Cissé (Caissier Matin)</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>PIN: ****</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 🛒 ACHETEUR STAGES */}
              {activeRole === 'acheteur' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#020617', padding: 14, borderRadius: 10, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>🤖 Assistant Chatbot WhatsApp Meta Commerce</div>
                    
                    {/* Chat simulation box */}
                    <div style={{ background: '#0F172A', borderRadius: 8, padding: 10, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {chatMessages.map((m, idx) => (
                        <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                          <div style={{
                            background: m.sender === 'user' ? '#059669' : '#1E293B',
                            color: '#FFF', padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap'
                          }}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                        placeholder="Tapez un message (ex: Riz 50kg, iPhone 15)..."
                        style={{ flex: 1, background: '#0F172A', border: '1px solid #334155', padding: '8px 12px', borderRadius: 8, color: '#FFF', fontSize: 12 }}
                      />
                      <button type="submit" style={{ background: '#059669', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                        Envoyer
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 💼 APPORTEUR D'AFFAIRES STAGES */}
              {activeRole === 'apporteur' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#020617', padding: 14, borderRadius: 10, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>💼 Kit Commercial &amp; Matériel de Démarchage</div>
                    <div style={{ fontSize: 12, color: '#CBD5E1' }}>
                      Téléchargez les visuels officiels et la brochure de 13 pages pour démarcher les commerçants de votre secteur.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      <a
                        href="/brochure-apporteur.pdf" target="_blank" download
                        style={{ background: '#1E293B', border: '1px solid #334155', padding: 12, borderRadius: 8, textDecoration: 'none', color: '#FFF', display: 'flex', flexDirection: 'column', gap: 4 }}
                      >
                        <span style={{ fontWeight: 800, color: '#10B981', fontSize: 13 }}>📄 Brochure PDF (13 p.)</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>Document complet imprimable</span>
                      </a>

                      <div style={{ background: '#1E293B', border: '1px solid #334155', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: 13 }}>🖼️ Flyers A5 Terrain</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>Pour distribuer en boutique</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CALCULATEUR DE GAINS APPORTEUR DYNAMIQUE                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'var(--card)',
          borderRadius: 12, padding: '28px 20px', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 20, boxShadow: 'var(--shadow)'
        }}>
          <div>
            <span style={{ background: '#CCFBF1', color: '#0D9488', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              🧮 SIMULATEUR DE REVENUS PASSIFS DYNAMIQUE ({tauxCommissionPourcent}% COMMISSION)
            </span>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: 'var(--navy)', margin: '8px 0 4px 0' }}>
              Combien pouvez-vous gagner en tant qu&apos;Apporteur ?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
              Déplacez les curseurs pour calculer vos commissions récurrentes mensuelles calculées en direct.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'center' }}>
            {/* Sliders */}
            <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
                  <span>{labelPro} ({prixPro.toLocaleString()} FCFA/m) :</span>
                  <strong style={{ color: 'var(--accent)' }}>{nbBoutiquesPro} boutiques</strong>
                </div>
                <input
                  type="range" min="0" max="50" value={nbBoutiquesPro}
                  onChange={(e) => setNbBoutiquesPro(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Commission {tauxCommissionPourcent}% = {commissionProParUnite.toLocaleString()} FCFA / boutique / mois</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
                  <span>{labelBusiness} ({prixBusiness.toLocaleString()} FCFA/m) :</span>
                  <strong style={{ color: '#0D9488' }}>{nbBoutiquesBusiness} boutiques</strong>
                </div>
                <input
                  type="range" min="0" max="30" value={nbBoutiquesBusiness}
                  onChange={(e) => setNbBoutiquesBusiness(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Commission {tauxCommissionPourcent}% = {commissionBusinessParUnite.toLocaleString()} FCFA / boutique / mois</div>
              </div>
            </div>

            {/* Results Box */}
            <div style={{
              background: 'var(--navy)', padding: 20, borderRadius: 10, border: '1px solid var(--navy)',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, color: '#FFFFFF'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Vos Commissions Mensuelles Récurrentes</span>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#10B981', marginTop: 4 }}>
                  {commissionMensuelle.toLocaleString()} FCFA <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>/ mois</span>
                </div>
              </div>

              <div style={{ background: '#0F172A', padding: 10, borderRadius: 8, fontSize: 12, color: '#CBD5E1' }}>
                Chaque année : <strong style={{ color: '#F59E0B' }}>{commissionAnnuelle.toLocaleString()} FCFA</strong> de revenus passifs récurrents.
              </div>

              <button
                onClick={() => {
                  setActiveRole('apporteur');
                  const el = document.getElementById('simulateur-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ background: '#10B981', color: '#020617', border: 'none', padding: '11px 18px', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                🚀 Devenir Apporteur Maintenant
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALS DE DEMO ET STICKER EAN-13                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showStickerModal && stickerProd && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#FFF', padding: 20, borderRadius: 12, maxWidth: 360, width: '100%', textAlign: 'center', color: '#111' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 10px' }}>🏷️ Sticker Thermique 50x30mm</h3>
            <div style={{ border: '2px dashed #000', padding: 12, background: '#FFF', borderRadius: 6, display: 'inline-block', width: '100%' }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Boutique Touba Express</div>
              <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0' }}>{stickerProd.nom}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>{stickerProd.prix.toLocaleString()} FCFA</div>
              <div style={{ fontSize: 24, letterSpacing: 4, fontFamily: 'monospace', margin: '8px 0 2px' }}>|||||||||||||||</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{stickerProd.ean}</div>
            </div>
            <button
              onClick={() => setShowStickerModal(false)}
              style={{ marginTop: 14, background: '#111', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Fermer l&apos;Aperçu
            </button>
          </div>
        </div>
      )}

      {showWaRelanceModal && relanceClient && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#DCF8C6', padding: 20, borderRadius: 12, maxWidth: 400, width: '100%', color: '#111' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 8px', color: '#075E54' }}>💬 Aperçu Message WhatsApp Relance Client</h3>
            <div style={{ background: '#FFF', padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: '#111' }}>
              Bonjour *{relanceClient.nom}*,<br /><br />
              Nous espérons que vous allez bien. Votre solde du carnet chez *Boutique Touba Express* est de *{relanceClient.solde.toLocaleString()} FCFA*.<br /><br />
              📅 Promesse d&apos;échéance : *{relanceClient.echeance}*<br />
              📍 Quartier : {relanceClient.quartier}<br /><br />
              Merci de régler par Wave/OM au 77 123 45 67. Excellente journée !
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                onClick={() => setShowWaRelanceModal(false)}
                style={{ flex: 1, background: '#075E54', color: '#FFF', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Envoyer (Simulation)
              </button>
              <button
                onClick={() => setShowWaRelanceModal(false)}
                style={{ background: '#FFF', color: '#333', border: '1px solid #ccc', padding: '8px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#1E293B', padding: 20, borderRadius: 12, maxWidth: 360, width: '100%', textAlign: 'center', color: '#FFF' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Scan Caméra Smartphone en Cours...</h3>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Pointez le code-barres EAN-13 du produit avec votre caméra.</p>
            <div style={{ border: '2px dashed #10B981', height: 100, margin: '14px 0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: 800 }}>
              ⚡ DÉTECTION EAN-13 EN COURS
            </div>
            <button
              onClick={() => setShowScanModal(false)}
              style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {showCloudScannerModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#1E293B', padding: 20, borderRadius: 12, maxWidth: 380, width: '100%', color: '#FFF' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>📱 Douchette Smartphone Distante (Cloud Sync)</h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 10px' }}>Scannez ce QR Code avec le smartphone de votre caissier pour transformer le téléphone en douchette sans fil connectée au PC (&lt;100ms).</p>
            <div style={{ background: '#FFF', padding: 12, borderRadius: 8, display: 'inline-block', color: '#000', fontWeight: 900, fontSize: 14 }}>
              CODE SESSION : <code>NOPALOU-POS-8492</code>
            </div>
            <button
              onClick={() => setShowCloudScannerModal(false)}
              style={{ display: 'block', width: '100%', marginTop: 14, background: '#0284C7', color: '#FFF', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(28, 43, 74, 0.85)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22,
            maxWidth: 460, width: '100%', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', color: 'var(--text1)'
          }}>
            <button
              onClick={() => setShowShareModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>

            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px 0' }}>🔗 Lien Commercial Partageable</h3>
              <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>
                Saisissez votre code apporteur pour que les visites soient rattachées à votre profil.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', display: 'block', marginBottom: 4 }}>VOTRE CODE APPORTEUR / VENDEUR :</label>
                <input
                  type="text" placeholder="Ex: APPORT-77" value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text1)', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', display: 'block', marginBottom: 4 }}>LIEN GÉNÉRÉ :</label>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#0D9488', wordBreak: 'break-all' }}>
                  {shareableUrl}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCopyLink}
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--text1)', border: '1px solid var(--border)', padding: 11, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {copiedLink ? '✅ Lien Copié !' : '📋 Copier le Lien'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                style={{ flex: 1, background: '#059669', color: '#FFF', border: 'none', padding: 11, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                💬 Partager WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
