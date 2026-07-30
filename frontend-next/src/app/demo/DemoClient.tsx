'use client';

import React, { useState, useEffect } from 'react';

interface DemoClientProps {
  initialRef?: string;
  initialRole?: 'acheteur' | 'marchand' | 'apporteur';
  initialTab?: string;
}

export default function DemoClient({
  initialRef = '',
  initialRole = 'acheteur',
  initialTab = 'simualteur',
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
  const [posCart, setPosCart] = useState<{ name: string; price: number; qty: number }[]>([
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

  // Synchronize URL query params if referral present
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com';
  const shareableUrl = `${currentHost}/demo?role=${activeRole}${referralCode ? `&ref=${referralCode}` : ''}`;

  // Reset active step when changing role
  const handleRoleChange = (role: 'acheteur' | 'marchand' | 'apporteur') => {
    setActiveRole(role);
    setActiveStep(1);
  };

  // Apporteur Commission calculation formulas
  const PRIX_PRO_MOIS = 15000; // FCFA / mois
  const PRIX_BUSINESS_MOIS = 35000; // FCFA / mois
  const TAUX_COMMISSION = 0.10; // 10%

  const caTotalGenerer = (nbBoutiquesPro * PRIX_PRO_MOIS) + (nbBoutiquesBusiness * PRIX_BUSINESS_MOIS);
  const commissionMensuelle = Math.round(caTotalGenerer * TAUX_COMMISSION);
  const commissionAnnuelle = commissionMensuelle * 12;

  // POS calculation
  const totalPosCart = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleAddCreditEntry = () => {
    setCreditSaveStatus('saved');
    setTimeout(() => setCreditSaveStatus('idle'), 4000);
  };

  // WhatsApp Bot Answer Simulation
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsgs = [...chatMessages, { sender: 'user' as const, text: userMsg, time: timeNow }];
    setChatMessages(newMsgs);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER COMMERCIAL & HERO DE PRESENTATION                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-12 shadow-2xl text-center">
        {/* Glow backdrop effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          {/* Top Badges */}
          <div className="inline-flex flex-wrap justify-center items-center gap-2 sm:gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Démo Commerciale Interactive
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
              ⚡ Nopalou vs Concurrence
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              💳 Wave & Orange Money Ready
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            L&apos;Écosystème Digital Tout-en-Un <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-teal-400 bg-clip-text text-transparent">
              Pour Acheter, Vendre &amp; Entreprendre au Sénégal
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Nopalou combine un <strong className="text-white">Super-Comparateur de prix</strong>, un{' '}
            <strong className="text-white">Logiciel de Caisse POS tactile</strong> avec gestion du carnet de crédits/dettes marchands, un{' '}
            <strong className="text-white">Bot WhatsApp IA</strong> et un <strong className="text-teal-300">Programme Apporteur 10% récurrent</strong>.
          </p>

          {/* Quick CTA Actions */}
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('simulateur-parcours');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <span>🎮 Tester le Simulateur Live</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-6 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684" />
              </svg>
              <span>🔗 Obtenir mon Lien Commercial / Apporteur</span>
            </button>
          </div>
        </div>

        {/* Floating Quick Stat Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80 max-w-4xl mx-auto text-left">
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-2xl font-black text-orange-400">35%</div>
            <div className="text-xs text-slate-400">Économie moyenne acheteur</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-2xl font-black text-teal-400">0 Impayé</div>
            <div className="text-xs text-slate-400">Suivi Caisse POS &amp; Crédits</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-2xl font-black text-amber-400">24/7</div>
            <div className="text-xs text-slate-400">Assistant WhatsApp IA</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-2xl font-black text-emerald-400">10% à Vie</div>
            <div className="text-xs text-slate-400">Commission Apporteur récurrente</div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION COMPARATIVE VS CONCURRENCE                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Pourquoi Nopalou surpasse la concurrence ?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Une comparaison objective entre Nopalou et les méthodes traditionnelles ou plateformes e-commerce classiques.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-xl">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 sm:p-5">Fonctionnalité / Solution</th>
                <th className="p-4 sm:p-5 text-center text-orange-400 bg-orange-500/10 border-x border-orange-500/20">
                  🚀 Nopalou Tout-en-Un
                </th>
                <th className="p-4 sm:p-5 text-center text-slate-400">E-Commerce Classique (Jumia, Expat)</th>
                <th className="p-4 sm:p-5 text-center text-slate-400">Gestion Papier / Cahier Dettes</th>
                <th className="p-4 sm:p-5 text-center text-slate-400">Vente WhatsApp Manuelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-medium">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-white">🔍 Comparateur de prix multi-marchands</td>
                <td className="p-4 text-center bg-orange-500/5 border-x border-orange-500/20 text-emerald-400 font-bold">
                  ✅ Oui (Produits, Immo, Telecom)
                </td>
                <td className="p-4 text-center text-rose-400">❌ Vendeurs isolés</td>
                <td className="p-4 text-center text-slate-500">— Non concerné</td>
                <td className="p-4 text-center text-rose-400">❌ Aucun comparateur</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-white">🏪 Caisse POS &amp; Carnet de Crédits/Dettes</td>
                <td className="p-4 text-center bg-orange-500/5 border-x border-orange-500/20 text-emerald-400 font-bold">
                  ✅ Intégré + Relance WhatsApp 1-clic
                </td>
                <td className="p-4 text-center text-rose-400">❌ Pas de Caisse magasin</td>
                <td className="p-4 text-center text-amber-400">⚠️ Cahier à risque d&apos;oubli / perte</td>
                <td className="p-4 text-center text-rose-400">❌ Saisie manuelle pénible</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-white">🤖 Assistant Bot WhatsApp Commercial 24/7</td>
                <td className="p-4 text-center bg-orange-500/5 border-x border-orange-500/20 text-emerald-400 font-bold">
                  ✅ Réponses &amp; commandes auto
                </td>
                <td className="p-4 text-center text-rose-400">❌ Pas d&apos;Assistant IA</td>
                <td className="p-4 text-center text-rose-400">❌ Aucun</td>
                <td className="p-4 text-center text-amber-400">⚠️ Réponses manuelle lentes</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-white">💼 Commission Récurrente Apporteur (10%)</td>
                <td className="p-4 text-center bg-orange-500/5 border-x border-orange-500/20 text-emerald-400 font-bold">
                  ✅ Revenu passif mensuel à vie
                </td>
                <td className="p-4 text-center text-rose-400">❌ Ponctuel ou inexistant</td>
                <td className="p-4 text-center text-slate-500">— Aucun</td>
                <td className="p-4 text-center text-slate-500">— Aucun</td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-white">💳 Intégration Wave &amp; Orange Money</td>
                <td className="p-4 text-center bg-orange-500/5 border-x border-orange-500/20 text-emerald-400 font-bold">
                  ✅ Natif &amp; Instantané
                </td>
                <td className="p-4 text-center text-amber-400">⚠️ Variable</td>
                <td className="p-4 text-center text-rose-400">❌ Espèces uniquement</td>
                <td className="p-4 text-center text-amber-400">⚠️ Envoi manuel de capture</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION SIMULATEUR LIVE DES 3 PARCOURS (ACHETEUR, MARCHAND, APPORTEUR) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="simulateur-parcours" className="space-y-8 scroll-mt-10">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            🕹️ SIMULATEUR INTERACTIF
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Choisissez un parcours et testez les fonctionnalités en direct
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Cliquez sur un profil d&apos;utilisateur ci-dessous pour vivre l&apos;expérience exacte Nopalou étape par étape.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => handleRoleChange('acheteur')}
            className={`p-4 rounded-xl font-bold text-sm sm:text-base transition-all flex flex-col items-center gap-1.5 ${
              activeRole === 'acheteur'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-2xl">🛒</span>
            <span>1. Parcours Acheteur Malin</span>
            <span className="text-xs opacity-80 font-normal">Comparateur, Alertes &amp; WhatsApp</span>
          </button>

          <button
            onClick={() => handleRoleChange('marchand')}
            className={`p-4 rounded-xl font-bold text-sm sm:text-base transition-all flex flex-col items-center gap-1.5 ${
              activeRole === 'marchand'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-2xl">🏪</span>
            <span>2. Parcours Marchand POS</span>
            <span className="text-xs opacity-80 font-normal">Caisse POS &amp; Carnet de Crédits</span>
          </button>

          <button
            onClick={() => handleRoleChange('apporteur')}
            className={`p-4 rounded-xl font-bold text-sm sm:text-base transition-all flex flex-col items-center gap-1.5 ${
              activeRole === 'apporteur'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-2xl">💼</span>
            <span>3. Parcours Apporteur d&apos;Affaires</span>
            <span className="text-xs opacity-80 font-normal">Affiliation &amp; Commissions 10%</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 sm:gap-4 overflow-x-auto py-2">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => setActiveStep(step)}
              className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border transition-all flex items-center gap-2 ${
                activeStep === step
                  ? 'bg-slate-800 text-white border-orange-500 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                activeStep === step ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {step}
              </span>
              {activeRole === 'acheteur' && step === 1 && 'Comparaison Prix'}
              {activeRole === 'acheteur' && step === 2 && 'Offres Telecom & Immo'}
              {activeRole === 'acheteur' && step === 3 && 'Commande WhatsApp 24/7'}

              {activeRole === 'marchand' && step === 1 && 'Caisse Enregistreuse POS'}
              {activeRole === 'marchand' && step === 2 && 'Gestion Crédit & Dettes Client'}
              {activeRole === 'marchand' && step === 3 && 'Bot WhatsApp Boutique'}

              {activeRole === 'apporteur' && step === 1 && 'Lien & Code Apporteur'}
              {activeRole === 'apporteur' && step === 2 && 'Parrainage Boutiques'}
              {activeRole === 'apporteur' && step === 3 && 'Commissions Wave/OM'}
            </button>
          ))}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE SCREEN DISPLAY (SIMULATOR FRAME)                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
          {/* Frame Header Bar */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                https://nopalou.com/demo/{activeRole}/step-{activeStep}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
              Mode : {activeRole.toUpperCase()} — Étape {activeStep}/3
            </div>
          </div>

          {/* Frame Body Content */}
          <div className="p-4 sm:p-8 min-h-[420px]">
            {/* 🛒 PARCOURS ACHETEUR STAGES */}
            {activeRole === 'acheteur' && (
              <div className="space-y-6">
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 1 : Comparateur Multi-Boutiques en direct</strong>
                        Recherchez n&apos;importe quel produit. Nopalou scanne Auchan, Carrefour, E-Boutiques locales et Facebook Marketplace pour extraire le prix le plus bas.
                      </div>
                    </div>

                    {/* Simulated Search & Product Card */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="iPhone 15 Pro Max 256GB"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none"
                        />
                        <button className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm">
                          Rechercher
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 relative">
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase">
                            Meilleur Prix
                          </span>
                          <div className="text-xs text-slate-400">Boutique Dakar Tech (Nopalou Pro)</div>
                          <div className="text-xl font-black text-emerald-400 mt-1">785 000 FCFA</div>
                          <div className="text-xs text-slate-300 mt-2">✅ Garantie 12 mois + Stock dispo</div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-xs text-slate-400">Auchan Sénégal</div>
                          <div className="text-xl font-black text-slate-200 mt-1">820 000 FCFA</div>
                          <div className="text-xs text-slate-500 mt-2">Écart : +35 000 FCFA</div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-xs text-slate-400">Vendeur Particulier (Annonce)</div>
                          <div className="text-xl font-black text-slate-200 mt-1">800 000 FCFA</div>
                          <div className="text-xs text-slate-500 mt-2">Sans garantie officielle</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 2 : Comparateur Telecom &amp; Immobilier</strong>
                        Ne perdez plus de temps. Comparez les pass Internet 4G/5G Orange/Free et trouvez des appartements vérifiés sans frais cachés.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Telecom Card */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">📱 Pass Telecom Orange vs Free</span>
                          <span className="text-xs text-orange-400 font-bold">Top Offre</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-sm text-slate-200">Pass Orange Max 15 GB</div>
                            <div className="text-xs text-slate-400">Validité 30 jours</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-orange-400">5 000 FCFA</div>
                          </div>
                        </div>
                      </div>

                      {/* Immo Card */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">🏠 Immobilier Mermoz</span>
                          <span className="text-xs text-teal-400 font-bold">Bailleur Certifié</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-sm text-slate-200">Appartement F3 Standing</div>
                            <div className="text-xs text-slate-400">Mermoz Pyrotechnie — 2 ch + Salon</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-teal-400">300 000 FCFA/m</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 3 : Assistant WhatsApp Nopalou Bot 24/7</strong>
                        Testez le Chatbot WhatsApp ci-dessous ! Posez-lui une question ou demandez le prix d&apos;un produit.
                      </div>
                    </div>

                    {/* Interactive Simulated WhatsApp Chat */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 max-w-xl mx-auto overflow-hidden">
                      <div className="p-3 bg-emerald-900/60 border-b border-emerald-800/50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                          🤖
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">Nopalou Assistant WhatsApp</div>
                          <div className="text-[10px] text-emerald-300">En ligne 24h/24 • Réponse automatique</div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 h-64 overflow-y-auto bg-slate-950 text-xs">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-3 shadow ${
                              msg.sender === 'user'
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                            }`}>
                              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                              <span className="block text-[9px] opacity-70 text-right mt-1">{msg.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleSendChat} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <input
                          type="text"
                          placeholder="Tapez un message (ex: Riz 50kg, iPhone, Appartement)..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs">
                          Envoyer
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🏪 PARCOURS MARCHAND STAGES */}
            {activeRole === 'marchand' && (
              <div className="space-y-6">
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 1 : Logiciel de Caisse Tactile POS (Vente Magasin)</strong>
                        Accédez à la caisse Nopalou POS directement sur tablette ou téléphone. Scannez les articles et encaissez en Espèces, Wave ou Orange Money.
                      </div>
                    </div>

                    {/* Interactive POS Screen Demo */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <span>🏬 Caisse POS — Boutique Touba Commerce</span>
                        </h3>
                        <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 text-xs font-mono font-bold">
                          Session Ouverte
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cart items */}
                        <div className="space-y-2 bg-slate-900 p-4 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-slate-400 uppercase">Panier client courant</span>
                          {posCart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/60 text-slate-200">
                              <div>
                                <div className="font-bold">{item.name}</div>
                                <div className="text-[10px] text-slate-400">{item.qty} x {item.price.toLocaleString()} FCFA</div>
                              </div>
                              <div className="font-bold text-orange-400">
                                {(item.price * item.qty).toLocaleString()} FCFA
                              </div>
                            </div>
                          ))}

                          <div className="pt-2 flex justify-between items-center text-sm font-black text-white">
                            <span>TOTAL DU PANIER :</span>
                            <span className="text-teal-400 text-lg">{totalPosCart.toLocaleString()} FCFA</span>
                          </div>
                        </div>

                        {/* Payment method selector */}
                        <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase">Mode d&apos;Encaissement</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white">
                              🌊 Wave Direct
                            </button>
                            <button className="p-3 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-xs text-white">
                              🟧 Orange Money
                            </button>
                            <button className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-bold text-xs text-white">
                              💵 Espèces
                            </button>
                            <button
                              onClick={() => setActiveStep(2)}
                              className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white flex items-center justify-center gap-1"
                            >
                              <span>📝 Pris à Crédit →</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 text-center">
                            ✅ Génération automatique du reçu digital WhatsApp
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 2 : Carnet de Crédits &amp; Dettes Client (Plus d&apos;impayés !)</strong>
                        Fini le cahier papier perdu. Enregistrez les articles pris à crédit par un client et envoyez-lui une relance courtoise sur WhatsApp en 1 clic.
                      </div>
                    </div>

                    {/* Interactive Credit Entry Simulation */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto">
                      <h3 className="font-bold text-white text-base border-b border-slate-800 pb-2">
                        📝 Fiche Crédit Client POS
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1">Nom du client :</label>
                          <input
                            type="text"
                            value={creditClientNom}
                            onChange={(e) => setCreditClientNom(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Téléphone WhatsApp :</label>
                          <input
                            type="text"
                            value={creditClientTel}
                            onChange={(e) => setCreditClientTel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <div className="text-slate-400 font-bold">Articles pris à crédit (JSONB sauvé en BD) :</div>
                        <ul className="list-disc list-inside text-slate-300">
                          <li>1x Sac de Riz Parfumé 50kg (22 500 FCFA)</li>
                          <li>2x Huile Dinor 5L (15 000 FCFA)</li>
                        </ul>
                        <div className="font-bold text-amber-400 pt-1 text-sm">
                          Montant total de la dette : 37 500 FCFA
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleAddCreditEntry}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white rounded-xl"
                        >
                          💾 Enregistrer dans le Carnet POS
                        </button>
                        <button
                          onClick={() => {
                            const msg = `Bonjour ${creditClientNom}, un petit rappel concernant votre crédit de 37 500 FCFA chez Touba Commerce (Sac de riz + Huile). Règlement via Wave ou OM possible. Merci !`;
                            window.open(`https://api.whatsapp.com/send?phone=${creditClientTel.replace(/\s/g, '')}&text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl flex items-center gap-1.5"
                        >
                          <span>💬 Relancer le client par WhatsApp</span>
                        </button>
                      </div>

                      {creditSaveStatus === 'saved' && (
                        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold animate-pulse">
                          ✅ Dette enregistrée avec succès ! Historique du client mis à jour.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 3 : Synchronisation Bot WhatsApp &amp; Marketplace</strong>
                        Votre boutique est automatiquement publiée sur Nopalou et votre Assistant WhatsApp répond aux clients même lorsque votre magasin est fermé.
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
                      <div className="inline-flex p-4 rounded-2xl bg-slate-900 border border-purple-500/30 text-purple-300">
                        <span className="text-4xl">🤖</span>
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        Votre Bot Commercial WhatsApp est actif !
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Les clients qui recherchent vos produits sur Nopalou reçoivent la fiche de votre boutique et peuvent commander directement avec paiement mobile Wave/Orange Money.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 💼 PARCOURS APPORTEUR STAGES */}
            {activeRole === 'apporteur' && (
              <div className="space-y-6">
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 1 : Obtenez votre Code Apporteur en 1-Clic</strong>
                        Activez gratuitement votre statut d&apos;apporteur sur Nopalou. Vous recevez un code unique (ex: <code className="text-amber-300">A3F9K2</code>) et un lien d&apos;affiliation personnel.
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 max-w-xl mx-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">Votre Code Apporteur Unique</span>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full font-mono font-bold text-xs">
                          Statut : Actif ✅
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
                        <div className="font-mono text-2xl font-black text-amber-400 tracking-wider">
                          {referralCode || 'APPORT-77'}
                        </div>
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                        >
                          {copiedLink ? 'Copié !' : 'Copier le Lien'}
                        </button>
                      </div>

                      <div className="text-xs text-slate-400 leading-relaxed">
                        Lien d&apos;inscription commerçant pré-rempli : <br />
                        <code className="text-slate-300 break-all font-mono">{shareableUrl}</code>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 2 : Recrutez des Boutiques dans votre réseau</strong>
                        Lorsqu&apos;un commerçant crée sa boutique en saisissant votre code ou via votre lien, la boutique est liée à votre compte à vie.
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h4 className="font-bold text-white text-sm">
                        📊 Mes Boutiques Parrainées (Exemple d&apos;Espace Apporteur)
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-200">Électronique Sandaga (Boutique Pro)</div>
                            <div className="text-[10px] text-slate-400">Inscrit le 12/06/2026 • Code : {referralCode || 'APPORT-77'}</div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              1 500 FCFA/mois
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-200">Cosmétique Touba (Boutique Business)</div>
                            <div className="text-[10px] text-slate-400">Inscrit le 18/06/2026 • Code : {referralCode || 'APPORT-77'}</div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              3 500 FCFA/mois
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <strong className="block text-white">Étape 3 : Percevez vos Commissions Mensuelles par Wave/OM</strong>
                        À chaque renouvellement d&apos;abonnement par vos commerçants, votre commission de 10% s&apos;accumule automatiquement sur votre solde.
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
                      <div className="text-xs text-slate-400 font-bold uppercase">Solde Cumulé Disponible</div>
                      <div className="text-4xl font-black text-emerald-400">
                        45 000 FCFA
                      </div>
                      <div className="pt-2 flex justify-center gap-3">
                        <button className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs shadow-lg">
                          🌊 Retirer par Wave
                        </button>
                        <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-lg">
                          🟧 Retirer par Orange Money
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION CALCULATEUR DE GAINS & SIMULATEUR APPORTEUR / MARCHAND */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-8 shadow-xl">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
            🧮 SIMULATEUR DE REVENUS PASSIFS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Combien pouvez-vous gagner en tant qu&apos;Apporteur d&apos;Affaires ?
          </h2>
          <p className="text-slate-400 text-sm">
            Déplacez les curseurs ci-dessous pour calculer vos commissions récurrentes mensuelles et annuelles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Sliders inputs */}
          <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            {/* Slider Pro */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Boutiques Formule Pro (15 000 FCFA/mois) :</span>
                <span className="font-bold text-orange-400 text-base">{nbBoutiquesPro} boutiques</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={nbBoutiquesPro}
                onChange={(e) => setNbBoutiquesPro(Number(e.target.value))}
                className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[11px] text-slate-500">Commission apporteur (10%) = { (PRIX_PRO_MOIS * TAUX_COMMISSION).toLocaleString() } FCFA / boutique / mois</div>
            </div>

            {/* Slider Business */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Boutiques Formule Business (35 000 FCFA/mois) :</span>
                <span className="font-bold text-teal-400 text-base">{nbBoutiquesBusiness} boutiques</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={nbBoutiquesBusiness}
                onChange={(e) => setNbBoutiquesBusiness(Number(e.target.value))}
                className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[11px] text-slate-500">Commission apporteur (10%) = { (PRIX_BUSINESS_MOIS * TAUX_COMMISSION).toLocaleString() } FCFA / boutique / mois</div>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-6 shadow-2xl relative">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vos Commissions Mensuelles Récurrentes</span>
              <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {commissionMensuelle.toLocaleString()} FCFA <span className="text-lg text-slate-400 font-normal">/ mois</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300">
              Chaque année, vous percevez : <strong className="text-amber-300 font-bold">{commissionAnnuelle.toLocaleString()} FCFA</strong> de revenus passifs récurrents.
            </div>

            <button
              onClick={() => {
                setActiveRole('apporteur');
                const el = document.getElementById('simulateur-parcours');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-lg transition-all"
            >
              🚀 Devenir Apporteur d&apos;Affaires Maintenat
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CATALOGUE DES FONCTIONNALITES COMPLETES NOPALOU                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Toutes les fonctionnalités Nopalou en un coup d&apos;œil
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Découvrez la richesse de la suite logicielle Nopalou conçue sur-mesure pour l&apos;Afrique de l&apos;Ouest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 transition-all space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="font-bold text-lg text-white">Super-Comparateur Tri-Secteurs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Moteur de recherche unifié pour les produits de consommation, biens immobiliers et pass télécoms Orange, Free &amp; Expresso.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3">
            <div className="text-3xl">🏬</div>
            <h3 className="font-bold text-lg text-white">Caisse enregistreuse Tactile POS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gestion de caisse magasin sur tablette/smartphone avec encaissement rapide, reçu digital WhatsApp et clôture Z quotidienne.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3">
            <div className="text-3xl">📝</div>
            <h3 className="font-bold text-lg text-white">Carnet de Crédits &amp; Dettes Client</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sauvegarde détaillée des articles pris à crédit par client, calcul automatique des soldes et relance courtoise sur WhatsApp en 1 clic.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="text-3xl">🤖</div>
            <h3 className="font-bold text-lg text-white">Assistant Bot Commercial WhatsApp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chatbot connecté 24/7 au catalogue boutique pour répondre aux questions fréquentes et traiter les commandes automatiquement.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3">
            <div className="text-3xl">💼</div>
            <h3 className="font-bold text-lg text-white">Programme Apporteur 10% Récurrent</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Revenu passif mensuel à vie versé automatiquement via Wave ou Orange Money pour chaque boutique parrainée.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all space-y-3">
            <div className="text-3xl">🎨</div>
            <h3 className="font-bold text-lg text-white">Générateur de Visuels &amp; Flyers Marketing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kit de communication intégrant des flyers professionnels prêt-à-partager sur Instagram, Facebook et WhatsApp Status.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL OUTIL COMMERCIAL & PARTAGE EN 1-CLIC                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              ✕
            </button>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🔗 Lien Commercial &amp; Apporteur Partageable</span>
              </h3>
              <p className="text-xs text-slate-400">
                Saisissez votre code apporteur pour que les clients qui visitent la démo soient automatiquement rattachés à votre profil.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Votre Code Apporteur / Vendeur :</label>
                <input
                  type="text"
                  placeholder="Ex: A3F9K2 ou MON_CODE"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Lien de la Démo généré :</label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-teal-300 break-all">
                  {shareableUrl}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white rounded-xl border border-slate-700"
              >
                {copiedLink ? '✅ Lien Copié !' : '📋 Copier le Lien'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>💬 Partager sur WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
