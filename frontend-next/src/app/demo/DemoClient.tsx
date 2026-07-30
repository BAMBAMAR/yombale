'use client';

import React, { useState } from 'react';

interface DemoClientProps {
  initialRef?: string;
  initialRole?: 'acheteur' | 'marchand' | 'apporteur';
  initialTab?: string;
}

export default function DemoClient({
  initialRef = '',
  initialRole = 'acheteur',
}: DemoClientProps) {
  // State variables
  const [activeRole, setActiveRole] = useState<'acheteur' | 'marchand' | 'apporteur'>(initialRole);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [referralCode, setReferralCode] = useState<string>(initialRef);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Apporteur Calculator State
  const [nbBoutiquesPro, setNbBoutiquesPro] = useState<number>(10);
  const [nbBoutiquesBusiness, setNbBoutiquesBusiness] = useState<number>(5);

  // Merchant Credit Simulation State (POS)
  const [posCart] = useState<{ name: string; price: number; qty: number }[]>([
    { name: 'Sac de Riz Parfumé 50kg', price: 22500, qty: 1 },
    { name: 'Huile Dinor 5L', price: 7500, qty: 2 },
  ]);
  const [creditClientNom, setCreditClientNom] = useState<string>('Mamadou Diallo');
  const [creditClientTel, setCreditClientTel] = useState<string>('77 123 45 67');
  const [creditSaveStatus, setCreditSaveStatus] = useState<'idle' | 'saved'>('idle');

  // WhatsApp simulation chat state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    { sender: 'bot', text: 'Bonjour ! Bienvenue chez Nopalou Bot 🤖. Que recherchez-vous aujourd\'hui ? (ex: Riz 50kg, iPhone 15, Forfait Orange 5Go, Appartement Mermoz)', time: '10:00' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Synchronize URL query params
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com';
  const shareableUrl = `${currentHost}/demo?role=${activeRole}${referralCode ? `&ref=${referralCode}` : ''}`;

  const handleRoleChange = (role: 'acheteur' | 'marchand' | 'apporteur') => {
    setActiveRole(role);
    setActiveStep(1);
  };

  // Apporteur Commission calculation formulas
  const PRIX_PRO_MOIS = 15000;
  const PRIX_BUSINESS_MOIS = 35000;
  const TAUX_COMMISSION = 0.10;

  const caTotalGenerer = (nbBoutiquesPro * PRIX_PRO_MOIS) + (nbBoutiquesBusiness * PRIX_BUSINESS_MOIS);
  const commissionMensuelle = Math.round(caTotalGenerer * TAUX_COMMISSION);
  const commissionAnnuelle = commissionMensuelle * 12;

  // POS calculation
  const totalPosCart = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleAddCreditEntry = () => {
    setCreditSaveStatus('saved');
    setTimeout(() => setCreditSaveStatus('idle'), 4000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeNow }]);
    setChatInput('');

    setTimeout(() => {
      let botReply = `J'ai trouvé 3 résultats pour "${userMsg}" au meilleur prix ! 🛒\n\n1. Auchan Dakar : 21 900 FCFA\n2. E-Boutique Nopalou Pro : 21 500 FCFA (En stock)\n\n👉 Souhaitez-vous recevoir le lien de commande Wave/Orange Money ?`;
      
      if (userMsg.toLowerCase().includes('immo') || userMsg.toLowerCase().includes('appartement')) {
        botReply = `🏠 2 Appartements trouvés à Mermoz & Almadies :\n• Studio meublé Mermoz : 250 000 FCFA/mois\n• F3 Almadies : 450 000 FCFA/mois\n\nContact direct bailleur vérifié sur Nopalou !`;
      } else if (userMsg.toLowerCase().includes('telecom') || userMsg.toLowerCase().includes('forfait') || userMsg.toLowerCase().includes('orange')) {
        botReply = `📱 Meilleur Pass Internet actuellement :\n• Orange Pass Max 10Go / 30j : 5 000 FCFA\n• Free Sénégal Illimité Week-end : 3 000 FCFA\n\nComparez les 25 forfaits sur nopalou.com/telecom !`;
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
    const message = `👋 Découvre Nopalou, la plateforme tout-en-un au Sénégal ! 🚀\n\n- Comparateur de prix & Forfaits Telecom\n- Caisse enregistreuse POS & Carnet de crédits marchands\n- Assistant WhatsApp Bot 24/7\n- Programme Apporteur (10% commission récurrente)\n\nTest la démo interactive ici : ${shareableUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
      background: '#0B132B',
      color: '#F8FAFC',
      minHeight: '100vh',
      padding: '24px 16px 60px 16px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* HERO DE PRESENTATION                                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: 24,
          padding: '40px 24px',
          border: '1px solid #334155',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 400, height: 400, background: 'rgba(199, 91, 0, 0.15)',
            filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(199, 91, 0, 0.15)', color: '#FF8C00', border: '1px solid rgba(199, 91, 0, 0.3)', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                ⚡ Démo Commerciale Interactive
              </span>
              <span style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#2DD4BF', border: '1px solid rgba(13, 148, 136, 0.3)', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                🛡️ Nopalou vs Concurrence
              </span>
              <span style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#FBBF24', border: '1px solid rgba(217, 119, 6, 0.3)', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                💳 Wave &amp; Orange Money Ready
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.2, color: '#FFFFFF', margin: 0 }}>
              L&apos;Écosystème Digital Tout-en-Un <br />
              <span style={{ background: 'linear-gradient(90deg, #C75B00, #F59E0B, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pour Acheter, Vendre &amp; Entreprendre au Sénégal
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: '#94A3B8', maxWidth: 750, margin: '0 auto', lineHeight: 1.6 }}>
              Nopalou combine un <strong style={{ color: '#FFF' }}>Super-Comparateur de prix</strong>, un{' '}
              <strong style={{ color: '#FFF' }}>Logiciel de Caisse POS tactile</strong> avec carnet de crédits client, un{' '}
              <strong style={{ color: '#FFF' }}>Bot WhatsApp IA</strong> et un <strong style={{ color: '#2DD4BF' }}>Programme Apporteur 10% récurrent</strong>.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingTop: 10 }}>
              <button
                onClick={() => {
                  const el = document.getElementById('simulateur-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  background: 'linear-gradient(90deg, #C75B00, #EA580C)',
                  color: '#FFFFFF', border: 'none', padding: '14px 28px',
                  borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(199, 91, 0, 0.35)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🎮 Tester le Simulateur Live</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                style={{
                  background: '#334155', color: '#F8FAFC', border: '1px solid #475569',
                  padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🔗 Obtenir mon Lien Commercial / Apporteur</span>
              </button>
            </div>

            {/* Stat Pills */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #334155'
            }}>
              <div style={{ background: '#0F172A', padding: 14, borderRadius: 14, border: '1px solid #1E293B', textAlign: 'left' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#C75B00' }}>35%</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Économie moyenne acheteur</div>
              </div>
              <div style={{ background: '#0F172A', padding: 14, borderRadius: 14, border: '1px solid #1E293B', textAlign: 'left' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#2DD4BF' }}>0 Impayé</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Suivi Caisse POS &amp; Crédits</div>
              </div>
              <div style={{ background: '#0F172A', padding: 14, borderRadius: 14, border: '1px solid #1E293B', textAlign: 'left' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B' }}>24/7</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Assistant WhatsApp IA</div>
              </div>
              <div style={{ background: '#0F172A', padding: 14, borderRadius: 14, border: '1px solid #1E293B', textAlign: 'left' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981' }}>10% à Vie</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Commission Apporteur récurrente</div>
              </div>
            </div>

          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TABLEAU COMPARATIF VS CONCURRENCE                             */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              Pourquoi Nopalou surpasse la concurrence ?
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              Comparaison objective entre Nopalou et les méthodes e-commerce ou manuelles classiques.
            </p>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #334155', background: '#0F172A' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 650 }}>
              <thead>
                <tr style={{ background: '#020617', borderBottom: '1px solid #334155', textTransform: 'uppercase', fontSize: 11, color: '#94A3B8' }}>
                  <th style={{ padding: '16px' }}>Fonctionnalité / Solution</th>
                  <th style={{ padding: '16px', background: 'rgba(199, 91, 0, 0.15)', color: '#FF8C00', fontWeight: 800, textAlign: 'center' }}>
                    🚀 Nopalou Tout-en-Un
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>E-Commerce Classique</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Cahier Papier / Dettes</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>WhatsApp Manuel</th>
                </tr>
              </thead>
              <tbody style={{ color: '#CBD5E1' }}>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#FFF' }}>🔍 Comparateur de prix multi-marchands</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: 'rgba(199, 91, 0, 0.05)', color: '#10B981', fontWeight: 800 }}>✅ Oui (Produits, Immo, Telecom)</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Vendeurs isolés</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#64748B' }}>— Non concerné</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Aucun comparateur</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#FFF' }}>🏪 Caisse POS &amp; Carnet Crédits/Dettes</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: 'rgba(199, 91, 0, 0.05)', color: '#10B981', fontWeight: 800 }}>✅ Intégré + Relance WhatsApp 1-clic</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Pas de Caisse magasin</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#F59E0B' }}>⚠️ Cahier à risque d&apos;oubli</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Saisie manuelle pénible</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#FFF' }}>🤖 Assistant Bot WhatsApp Commercial 24/7</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: 'rgba(199, 91, 0, 0.05)', color: '#10B981', fontWeight: 800 }}>✅ Commandes &amp; Réponses auto</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Pas d&apos;Assistant IA</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Aucun</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#F59E0B' }}>⚠️ Réponses lentes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#FFF' }}>💼 Commission Récurrente Apporteur (10%)</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: 'rgba(199, 91, 0, 0.05)', color: '#10B981', fontWeight: 800 }}>✅ Revenu passif mensuel à vie</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Inexistant</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#64748B' }}>— Aucun</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#64748B' }}>— Aucun</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#FFF' }}>💳 Paiements Wave &amp; Orange Money</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: 'rgba(199, 91, 0, 0.05)', color: '#10B981', fontWeight: 800 }}>✅ Natif &amp; Instantané</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#F59E0B' }}>⚠️ Variable</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#EF4444' }}>❌ Espèces uniquement</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#F59E0B' }}>⚠️ Envoi de capture manuel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SIMULATEUR LIVE À 3 PARCOURS                                 */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="simulateur-section" style={{ display: 'flex', flexDirection: 'column', gap: 20, scrollMarginTop: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ alignSelf: 'center', background: 'rgba(199, 91, 0, 0.15)', color: '#FF8C00', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              🕹️ SIMULATEUR INTERACTIF
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Choisissez un parcours et testez en direct
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              Sélectionnez un rôle pour simuler l&apos;interface exacte Nopalou étape par étape.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10, background: '#0F172A', padding: 8, borderRadius: 16, border: '1px solid #334155'
          }}>
            <button
              onClick={() => handleRoleChange('acheteur')}
              style={{
                background: activeRole === 'acheteur' ? 'linear-gradient(90deg, #C75B00, #EA580C)' : 'transparent',
                color: activeRole === 'acheteur' ? '#FFF' : '#94A3B8',
                border: 'none', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 20 }}>🛒</span>
              <span>1. Parcours Acheteur Malin</span>
              <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 400 }}>Comparateur, Alertes &amp; WhatsApp</span>
            </button>

            <button
              onClick={() => handleRoleChange('marchand')}
              style={{
                background: activeRole === 'marchand' ? 'linear-gradient(90deg, #0D9488, #10B981)' : 'transparent',
                color: activeRole === 'marchand' ? '#FFF' : '#94A3B8',
                border: 'none', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 20 }}>🏪</span>
              <span>2. Parcours Marchand POS</span>
              <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 400 }}>Caisse POS &amp; Carnet Dettes</span>
            </button>

            <button
              onClick={() => handleRoleChange('apporteur')}
              style={{
                background: activeRole === 'apporteur' ? 'linear-gradient(90deg, #7C3AED, #6366F1)' : 'transparent',
                color: activeRole === 'apporteur' ? '#FFF' : '#94A3B8',
                border: 'none', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 20 }}>💼</span>
              <span>3. Parcours Apporteur d&apos;Affaires</span>
              <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 400 }}>Affiliation &amp; Commissions 10%</span>
            </button>
          </div>

          {/* Steps selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                style={{
                  background: activeStep === step ? '#1E293B' : '#0F172A',
                  color: activeStep === step ? '#FFF' : '#94A3B8',
                  border: activeStep === step ? '1px solid #C75B00' : '1px solid #334155',
                  padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: activeStep === step ? '#C75B00' : '#334155',
                  color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
                }}>
                  {step}
                </span>
                {activeRole === 'acheteur' && step === 1 && 'Comparaison Prix'}
                {activeRole === 'acheteur' && step === 2 && 'Offres Telecom & Immo'}
                {activeRole === 'acheteur' && step === 3 && 'Commande WhatsApp 24/7'}

                {activeRole === 'marchand' && step === 1 && 'Caisse Enregistreuse POS'}
                {activeRole === 'marchand' && step === 2 && 'Carnet Crédit & Dettes Client'}
                {activeRole === 'marchand' && step === 3 && 'Bot WhatsApp Boutique'}

                {activeRole === 'apporteur' && step === 1 && 'Lien & Code Apporteur'}
                {activeRole === 'apporteur' && step === 2 && 'Parrainage Boutiques'}
                {activeRole === 'apporteur' && step === 3 && 'Commissions Wave/OM'}
              </button>
            ))}
          </div>

          {/* SIMULATOR SCREEN FRAME */}
          <div style={{
            borderRadius: 20, border: '1.5px solid #334155', background: '#0F172A', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
          }}>
            {/* Window header */}
            <div style={{ background: '#020617', padding: '12px 16px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginLeft: 8 }}>
                  nopalou.com/demo/{activeRole}/step-{activeStep}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', background: '#1E293B', padding: '3px 10px', borderRadius: 20 }}>
                MODE : {activeRole.toUpperCase()} — Étape {activeStep}/3
              </span>
            </div>

            {/* Window body */}
            <div style={{ padding: '24px 20px', minHeight: 380 }}>

              {/* 🛒 ACHETEUR STAGES */}
              {activeRole === 'acheteur' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {activeStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(199, 91, 0, 0.1)', border: '1px solid rgba(199, 91, 0, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#FFD8B5' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 1 : Comparateur Multi-Boutiques en direct</strong>
                        Tapez un nom d&apos;article. Nopalou scanne Auchan, Carrefour et les e-boutiques sénégalaises pour extraire le prix le plus bas.
                      </div>

                      <div style={{ background: '#020617', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input type="text" readOnly value="iPhone 15 Pro Max 256GB" style={{ flex: 1, background: '#0F172A', border: '1px solid #334155', padding: '10px 14px', borderRadius: 10, color: '#FFF', fontSize: 13 }} />
                          <button style={{ background: '#C75B00', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>Rechercher</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                          <div style={{ background: '#0F172A', padding: 14, borderRadius: 12, border: '1px solid #10B981', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: -10, right: 10, background: '#10B981', color: '#020617', padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>MEILLEUR PRIX</span>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Boutique Dakar Tech (Nopalou Pro)</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', marginTop: 4 }}>785 000 FCFA</div>
                            <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 6 }}>✅ Garantie 12m + Stock dispo</div>
                          </div>

                          <div style={{ background: '#0F172A', padding: 14, borderRadius: 12, border: '1px solid #1E293B' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Auchan Sénégal</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#E2E8F0', marginTop: 4 }}>820 000 FCFA</div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>Écart : +35 000 FCFA</div>
                          </div>

                          <div style={{ background: '#0F172A', padding: 14, borderRadius: 12, border: '1px solid #1E293B' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Vendeur Particulier (Annonce)</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#E2E8F0', marginTop: 4 }}>800 000 FCFA</div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>Sans garantie officielle</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(13, 148, 136, 0.1)', border: '1px solid rgba(13, 148, 136, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#A7F3D0' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 2 : Comparateur Telecom &amp; Immobilier</strong>
                        Comparez les forfaits Internet Orange/Free et dénichez des logements sans frais cachés.
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        <div style={{ background: '#020617', padding: 16, borderRadius: 14, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: '#FFF' }}>
                            <span>📱 Pass Orange vs Free</span>
                            <span style={{ color: '#FF8C00', fontSize: 11 }}>Top Offre</span>
                          </div>
                          <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>Orange Pass Max 15 GB</div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Validité 30 jours</div>
                            </div>
                            <div style={{ fontWeight: 900, color: '#FF8C00', fontSize: 16, marginLeft: 'auto' }}>5 000 FCFA</div>
                          </div>
                        </div>

                        <div style={{ background: '#020617', padding: 16, borderRadius: 14, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: '#FFF' }}>
                            <span>🏠 Immobilier Mermoz</span>
                            <span style={{ color: '#2DD4BF', fontSize: 11 }}>Bailleur Certifié</span>
                          </div>
                          <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>Appartement F3 Standing</div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Mermoz Pyrotechnie</div>
                            </div>
                            <div style={{ fontWeight: 900, color: '#2DD4BF', fontSize: 16, marginLeft: 'auto' }}>300 000 FCFA/m</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#A7F3D0' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 3 : Assistant WhatsApp Nopalou Bot 24/7</strong>
                        Testez le Bot ci-dessous ! Tapez un message pour simuler la réponse automatique du Chatbot.
                      </div>

                      <div style={{ background: '#020617', borderRadius: 16, border: '1px solid #1E293B', maxWidth: 520, margin: '0 auto', width: '100%', overflow: 'hidden' }}>
                        <div style={{ background: '#064E3B', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#FFF' }}>Nopalou Assistant WhatsApp</div>
                            <div style={{ fontSize: 10, color: '#A7F3D0' }}>En ligne 24h/24 • Réponse automatique</div>
                          </div>
                        </div>

                        <div style={{ padding: 14, height: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                maxWidth: '82%', padding: '10px 12px', borderRadius: 12,
                                background: msg.sender === 'user' ? '#059669' : '#1E293B',
                                color: msg.sender === 'user' ? '#FFF' : '#E2E8F0',
                                border: msg.sender === 'user' ? 'none' : '1px solid #334155',
                                whiteSpace: 'pre-line'
                              }}>
                                <div>{msg.text}</div>
                                <div style={{ fontSize: 9, opacity: 0.7, textAlign: 'right', marginTop: 4 }}>{msg.time}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleSendChat} style={{ padding: 8, background: '#0F172A', borderTop: '1px solid #1E293B', display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Tapez (ex: Riz 50kg, iPhone, Appartement)..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            style={{ flex: 1, background: '#020617', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#FFF', fontSize: 12 }}
                          />
                          <button type="submit" style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Envoyer</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 🏪 MARCHAND STAGES */}
              {activeRole === 'marchand' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {activeStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(13, 148, 136, 0.1)', border: '1px solid rgba(13, 148, 136, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#A7F3D0' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 1 : Caisse Tactile POS (Vente Magasin)</strong>
                        Scannez les articles et encaissez en Espèces, Wave ou Orange Money directement depuis votre tablette.
                      </div>

                      <div style={{ background: '#020617', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 10 }}>
                          <div style={{ fontWeight: 700, color: '#FFF', fontSize: 14 }}>🏬 Caisse POS — Touba Commerce</div>
                          <span style={{ background: 'rgba(45, 212, 191, 0.15)', color: '#2DD4BF', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>CAISSE OUVERTE</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                          <div style={{ background: '#0F172A', padding: 14, borderRadius: 12, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>PANIER DU CLIENT</span>
                            {posCart.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #1E293B', paddingBottom: 6 }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#FFF' }}>{item.name}</div>
                                  <div style={{ fontSize: 10, color: '#64748B' }}>{item.qty} x {item.price.toLocaleString()} FCFA</div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#FF8C00' }}>{(item.price * item.qty).toLocaleString()} FCFA</div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#2DD4BF', fontSize: 15, paddingTop: 4 }}>
                              <span>TOTAL :</span>
                              <span>{totalPosCart.toLocaleString()} FCFA</span>
                            </div>
                          </div>

                          <div style={{ background: '#0F172A', padding: 14, borderRadius: 12, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>MODE D&apos;ENCAISSEMENT</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <button style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>🌊 Wave Direct</button>
                              <button style={{ background: '#EA580C', color: '#FFF', border: 'none', padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>🟧 Orange Money</button>
                              <button style={{ background: '#059669', color: '#FFF', border: 'none', padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>💵 Espèces</button>
                              <button onClick={() => setActiveStep(2)} style={{ background: '#D97706', color: '#FFF', border: 'none', padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>📝 Pris à Crédit →</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#FDE68A' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 2 : Carnet de Crédits &amp; Dettes Client (Zero Impayé !)</strong>
                        Enregistrez les ventes à crédit et envoyez une relance courtoise sur WhatsApp en 1 clic.
                      </div>

                      <div style={{ background: '#020617', padding: 20, borderRadius: 16, border: '1px solid #1E293B', maxWidth: 540, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontWeight: 700, color: '#FFF', borderBottom: '1px solid #1E293B', paddingBottom: 8, fontSize: 14 }}>
                          📝 Fiche Crédit Client POS
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                          <div>
                            <label style={{ color: '#94A3B8', display: 'block', marginBottom: 4 }}>Nom Client :</label>
                            <input type="text" value={creditClientNom} onChange={(e) => setCreditClientNom(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 6, padding: 8, color: '#FFF' }} />
                          </div>
                          <div>
                            <label style={{ color: '#94A3B8', display: 'block', marginBottom: 4 }}>Téléphone WhatsApp :</label>
                            <input type="text" value={creditClientTel} onChange={(e) => setCreditClientTel(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 6, padding: 8, color: '#FFF' }} />
                          </div>
                        </div>

                        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ color: '#94A3B8', fontWeight: 700 }}>Articles pris à crédit (Sauvegardé en BD) :</div>
                          <div style={{ color: '#CBD5E1' }}>• 1x Sac de Riz 50kg (22 500 FCFA)</div>
                          <div style={{ color: '#CBD5E1' }}>• 2x Huile Dinor 5L (15 000 FCFA)</div>
                          <div style={{ color: '#F59E0B', fontWeight: 800, marginTop: 4, fontSize: 13 }}>Dette totale : 37 500 FCFA</div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button onClick={handleAddCreditEntry} style={{ background: '#D97706', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💾 Enregistrer Crédit</button>
                          <button
                            onClick={() => {
                              const msg = `Bonjour ${creditClientNom}, rappel courtois concernant votre solde de 37 500 FCFA chez Touba Commerce. Paiement Wave/OM possible. Merci !`;
                              window.open(`https://api.whatsapp.com/send?phone=${creditClientTel.replace(/\s/g, '')}&text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            style={{ background: '#059669', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                          >
                            💬 Relancer sur WhatsApp
                          </button>
                        </div>

                        {creditSaveStatus === 'saved' && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#A7F3D0', padding: 8, borderRadius: 8, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
                            ✅ Dette enregistrée avec succès dans le Carnet POS !
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div style={{ textAlign: 'center', padding: 30, background: '#020617', borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 40 }}>🤖</div>
                      <h4 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', margin: 0 }}>Votre Bot WhatsApp Commercial est actif !</h4>
                      <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 450, margin: 0, lineHeight: 1.5 }}>
                        Votre catalogue produit est synchronisé. Les clients peuvent commander 24/7 sur WhatsApp même lorsque votre boutique est fermée.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 💼 APPORTEUR STAGES */}
              {activeRole === 'apporteur' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {activeStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#DDD6FE' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 1 : Obtenez votre Code Apporteur en 1-Clic</strong>
                        Recevez un code unique (ex: <code style={{ color: '#FBBF24' }}>APPORT-77</code>) et votre lien d&apos;affiliation personnel.
                      </div>

                      <div style={{ background: '#020617', padding: 20, borderRadius: 16, border: '1px solid #1E293B', maxWidth: 500, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>VOTRE CODE APPORTEUR</span>
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>STATUT ACTIF</span>
                        </div>

                        <div style={{ background: '#0F172A', padding: 16, borderRadius: 12, border: '1px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: '#F59E0B' }}>{referralCode || 'APPORT-77'}</span>
                          <button onClick={handleCopyLink} style={{ background: '#D97706', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            {copiedLink ? 'Copié !' : 'Copier Lien'}
                          </button>
                        </div>

                        <div style={{ fontSize: 11, color: '#94A3B8', wordBreak: 'break-all' }}>
                          Lien d&apos;inscription affilié : <br />
                          <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{shareableUrl}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: 14, borderRadius: 12, fontSize: 13, color: '#C7D2FE' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: 2 }}>Étape 2 : Recrutez des Boutiques dans votre réseau</strong>
                        Chaque commerçant inscrit via votre code est lié à votre compte à vie pour les commissions récurrentes.
                      </div>

                      <div style={{ background: '#020617', padding: 16, borderRadius: 14, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#FFF' }}>📊 Espace Suivi Apporteur (Exemple)</div>
                        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#FFF' }}>Électronique Sandaga (Boutique Pro)</div>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Code : {referralCode || 'APPORT-77'}</div>
                          </div>
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>1 500 FCFA/mois</span>
                        </div>

                        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#FFF' }}>Cosmétique Touba (Boutique Business)</div>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Code : {referralCode || 'APPORT-77'}</div>
                          </div>
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>3 500 FCFA/mois</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div style={{ textAlign: 'center', padding: 24, background: '#020617', borderRadius: 16, border: '1px solid #1E293B', maxWidth: 450, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>SOLDE CUMULÉ DISPONIBLE</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#10B981' }}>45 000 FCFA</div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🌊 Retirer Wave</button>
                        <button style={{ background: '#EA580C', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🟧 Retirer Orange Money</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CALCULATEUR DE GAINS APPORTEUR                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          borderRadius: 24, padding: '32px 24px', border: '1px solid #334155',
          display: 'flex', flexDirection: 'column', gap: 24
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ background: 'rgba(45, 212, 191, 0.15)', color: '#2DD4BF', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              🧮 SIMULATEUR DE REVENUS PASSIFS
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#FFF', margin: '8px 0 4px 0' }}>
              Combien pouvez-vous gagner en tant qu&apos;Apporteur ?
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
              Déplacez les curseurs pour calculer vos commissions récurrentes mensuelles.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
            {/* Sliders */}
            <div style={{ background: '#020617', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#FFF', marginBottom: 6 }}>
                  <span>Boutiques Pro (15 000 FCFA/m) :</span>
                  <strong style={{ color: '#FF8C00' }}>{nbBoutiquesPro} boutiques</strong>
                </div>
                <input
                  type="range" min="0" max="50" value={nbBoutiquesPro}
                  onChange={(e) => setNbBoutiquesPro(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Commission 10% = 1 500 FCFA / boutique / mois</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#FFF', marginBottom: 6 }}>
                  <span>Boutiques Business (35 000 FCFA/m) :</span>
                  <strong style={{ color: '#2DD4BF' }}>{nbBoutiquesBusiness} boutiques</strong>
                </div>
                <input
                  type="range" min="0" max="30" value={nbBoutiquesBusiness}
                  onChange={(e) => setNbBoutiquesBusiness(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Commission 10% = 3 500 FCFA / boutique / mois</div>
              </div>
            </div>

            {/* Results Box */}
            <div style={{
              background: '#020617', padding: 24, borderRadius: 16, border: '1px solid #334155',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Vos Commissions Mensuelles Récurrentes</span>
                <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#10B981', marginTop: 4 }}>
                  {commissionMensuelle.toLocaleString()} FCFA <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 400 }}>/ mois</span>
                </div>
              </div>

              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, fontSize: 12, color: '#CBD5E1' }}>
                Chaque année : <strong style={{ color: '#F59E0B' }}>{commissionAnnuelle.toLocaleString()} FCFA</strong> de revenus passifs récurrents.
              </div>

              <button
                onClick={() => {
                  setActiveRole('apporteur');
                  const el = document.getElementById('simulateur-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ background: '#10B981', color: '#020617', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                🚀 Devenir Apporteur Maintenant
              </button>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CATALOGUE DES FONCTIONNALITES COMPLETES                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#FFF', margin: '0 0 4px 0' }}>
              Toutes les fonctionnalités Nopalou
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              Suite logicielle complète conçue sur-mesure pour le marché africain.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ background: '#0F172A', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0 }}>Super-Comparateur Tri-Secteurs</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Agrégateur de prix pour produits de consommation, logements immo et pass télécoms Orange, Free &amp; Expresso.
              </p>
            </div>

            <div style={{ background: '#0F172A', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🏬</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0 }}>Caisse Enregistreuse POS Tactile</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Gestion de caisse magasin sur tablette avec encaissement rapide, reçu digital WhatsApp et rapport Z quotidien.
              </p>
            </div>

            <div style={{ background: '#0F172A', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>📝</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0 }}>Carnet de Crédits &amp; Dettes Client</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Suivi des ventes à crédit par client, calcul des soldes dus et relances courtoises automatiques sur WhatsApp en 1-clic.
              </p>
            </div>

            <div style={{ background: '#0F172A', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🤖</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0 }}>Bot WhatsApp Commercial 24/7</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Chatbot connecté 24/7 au catalogue boutique pour traiter les recherches et commandes de manière autonome.
              </p>
            </div>

            <div style={{ background: '#0F172A', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>💼</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0 }}>Programme Apporteur 10% Récurrent</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Revenu passif mensuel à vie versé via Wave ou Orange Money pour chaque boutique affiliée.
              </p>
            </div>

            <div style={{ background: '#0F172A', padding: 20, borderRadius: 16, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🎨</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: 0 }}>Générateur de Visuels &amp; Flyers</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Kit marketing avec visuels professionnels prêt-à-partager sur Instagram, Facebook et WhatsApp Status.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL OUTIL COMMERCIAL & PARTAGE EN 1-CLIC                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showShareModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#0F172A', border: '1px solid #334155', borderRadius: 20, padding: 24,
            maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative'
          }}>
            <button
              onClick={() => setShowShareModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', margin: '0 0 4px 0' }}>🔗 Lien Commercial Partageable</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                Saisissez votre code apporteur pour que les visites soient rattachées à votre profil.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: 4 }}>VOTRE CODE APPORTEUR / VENDEUR :</label>
                <input
                  type="text" placeholder="Ex: APPORT-77" value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', background: '#020617', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#FFF', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: 4 }}>LIEN GÉNÉRÉ :</label>
                <div style={{ background: '#020617', border: '1px solid #1E293B', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#2DD4BF', wordBreak: 'break-all' }}>
                  {shareableUrl}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCopyLink}
                style={{ flex: 1, background: '#1E293B', color: '#FFF', border: '1px solid #334155', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {copiedLink ? '✅ Lien Copié !' : '📋 Copier le Lien'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                style={{ flex: 1, background: '#059669', color: '#FFF', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
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
