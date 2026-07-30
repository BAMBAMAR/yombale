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
  const [activeGuideTab, setActiveGuideTab] = useState<string>('compte');
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
      background: '#F8FAFC',
      color: '#0F172A',
      minHeight: '100vh',
      padding: '20px 16px 60px 16px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* HERO DE PRESENTATION (MODERNE & LUMINEUX)                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 24,
          padding: '40px 24px',
          border: '1px solid #334155',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          color: '#FFFFFF'
        }}>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              <span style={{ background: '#C75B00', color: '#FFF', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                ⚡ Démo Commerciale Interactive
              </span>
              <span style={{ background: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF', border: '1px solid #2DD4BF', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                🛡️ Nopalou vs Concurrence
              </span>
              <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', border: '1px solid #FBBF24', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                💳 Wave &amp; Orange Money Ready
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, lineHeight: 1.2, color: '#FFFFFF', margin: 0 }}>
              L&apos;Écosystème Digital Tout-en-Un <br />
              <span style={{ background: 'linear-gradient(90deg, #FF8C00, #F59E0B, #2DD4BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pour Acheter, Vendre &amp; Entreprendre au Sénégal
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: '#E2E8F0', maxWidth: 780, margin: '0 auto', lineHeight: 1.6 }}>
              Nopalou combine un <strong style={{ color: '#FF8C00' }}>Super-Comparateur de prix</strong>, un{' '}
              <strong style={{ color: '#FFF' }}>Logiciel de Caisse POS tactile</strong> avec gestion du carnet de crédits/dettes client, un{' '}
              <strong style={{ color: '#FFF' }}>Bot WhatsApp IA</strong> et un <strong style={{ color: '#2DD4BF' }}>Programme Apporteur 10% récurrent</strong>.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingTop: 10 }}>
              <button
                onClick={() => {
                  const el = document.getElementById('guide-etape-par-etape');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  background: 'linear-gradient(90deg, #C75B00, #EA580C)',
                  color: '#FFFFFF', border: 'none', padding: '14px 28px',
                  borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(199, 91, 0, 0.4)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>📘 Voir le Guide Étape par Étape</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                style={{
                  background: '#FFFFFF', color: '#0F172A', border: 'none',
                  padding: '14px 24px', borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🔗 Lien Commercial / Apporteur</span>
              </button>
            </div>

          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* GUIDE ÉTAPE PAR ÉTAPE (UTILISATION PAS-À-PAS CLAIRE)          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="guide-etape-par-etape" style={{ display: 'flex', flexDirection: 'column', gap: 20, scrollMarginTop: 30 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ background: '#FFF7ED', color: '#C75B00', border: '1px solid #FFEDD5', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              📘 MODE D&apos;EMPLOI &amp; PROCESSUS COMPLET
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 900, color: '#0F172A', margin: '8px 0 6px 0' }}>
              Comment utiliser Nopalou étape par étape ?
            </h2>
            <p style={{ fontSize: 15, color: '#475569', margin: 0, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
              Un guide clair pour démarrer immédiatement : de la création de compte à la caisse POS et aux commissions.
            </p>
          </div>

          {/* Guide Tabs Selector */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, justifyContent: 'flex-start'
          }}>
            {[
              { id: 'compte', label: '1. Créer un Compte', icon: '👤' },
              { id: 'boutique', label: '2. Créer une Boutique', icon: '🏪' },
              { id: 'catalogue', label: '3. Ajouter des Produits', icon: '📦' },
              { id: 'caisse', label: '4. Utiliser la Caisse POS', icon: '💻' },
              { id: 'credit', label: '5. Carnet de Crédits', icon: '📝' },
              { id: 'bot', label: '6. Bot WhatsApp', icon: '🤖' },
              { id: 'apporteur', label: '7. Gagner des Commissions', icon: '💼' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGuideTab(tab.id)}
                style={{
                  background: activeGuideTab === tab.id ? '#C75B00' : '#FFFFFF',
                  color: activeGuideTab === tab.id ? '#FFFFFF' : '#334155',
                  border: activeGuideTab === tab.id ? '1px solid #C75B00' : '1px solid #E2E8F0',
                  padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: activeGuideTab === tab.id ? '0 4px 12px rgba(199, 91, 0, 0.25)' : '0 2px 4px rgba(0,0,0,0.03)'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Guide Tab Content Card */}
          <div style={{
            background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px 24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            {activeGuideTab === 'compte' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF7ED', color: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>1</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 1 : Créer son Compte Nopalou (Gratuit &amp; Rapide)</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  L&apos;inscription sur Nopalou prend moins d&apos;une minute. Que vous soyez acheteur, commerçant ou apporteurs d&apos;affaires, un seul compte vous donne accès à tout l&apos;écosystème.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Saisie des infos :</strong> Entrez votre Nom, Adresse Email et Numéro WhatsApp.</div>
                  <div><strong>2. Sécurisation :</strong> Définissez un mot de passe sécurisé.</div>
                  <div><strong>3. Accès immédiat :</strong> Accédez à votre tableau de bord personnel.</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'boutique' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#CCFBF1', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>2</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 2 : Créer sa Boutique en Ligne en 2 Minutes</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Rendez-vous dans la rubrique <strong>/boutique</strong> pour enregistrer votre commerce et bénéficier d&apos;une visibilité immédiate auprès de milliers d&apos;acheteurs.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Nom &amp; Adresse :</strong> Indiquez le nom de votre magasin et sa localisation (ex: Dakar, Sandaga, Thiès).</div>
                  <div><strong>2. Code Apporteur :</strong> Saisissez le code de la personne qui vous a recommandé Nopalou (si applicable).</div>
                  <div><strong>3. Formule :</strong> Choisissez entre la formule Gratuite, Pro (15 000 FCFA/m) ou Business (35 000 FCFA/m).</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'catalogue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>3</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 3 : Remplir et Gérer son Catalogue Produits</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Publiez vos articles en quelques clics avec des photos attrayantes, la gestion des stocks et la numérisation des codes-barres.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Photos &amp; Prix :</strong> Ajoutez jusqu&apos;à 5 photos par produit avec votre prix de vente.</div>
                  <div><strong>2. Code-Barres EAN :</strong> Scannez ou saisissez le code-barres pour une gestion de stock en caisse POS.</div>
                  <div><strong>3. Publication 1-clic :</strong> Vos produits deviennent instantanément visibles sur le comparateur Nopalou.</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'caisse' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>4</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 4 : Utiliser la Caisse Enregistreuse Tactile POS</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Transformez n&apos;importe quelle tablette ou smartphone en caisse magasin enregistreuse pour encaisser vos clients en magasin.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Sélection des articles :</strong> Touchez les produits ou scannez leurs codes-barres pour constituer le panier.</div>
                  <div><strong>2. Mode de paiement :</strong> Encaissez en Espèces, Wave ou Orange Money.</div>
                  <div><strong>3. Reçu Digital :</strong> Envoyez le reçu de vente directement sur le WhatsApp du client.</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'credit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>5</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 5 : Gérer le Carnet de Crédits &amp; Dettes Client (Plus d&apos;impayés !)</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Ne perdez plus d&apos;argent avec le cahier papier. Enregistrez la liste exacte des articles pris à crédit par un client et suivez les remboursement.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Saisie du crédit :</strong> Sélectionnez les articles pris à crédit et le nom du client.</div>
                  <div><strong>2. Calcul du solde :</strong> La dette totale et l&apos;historique sont automatiquement sauvegardés en base de données.</div>
                  <div><strong>3. Relance 1-Click :</strong> Cliquez sur &quot;Relancer sur WhatsApp&quot; pour envoyer un rappel courtois pré-rempli au client.</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'bot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>6</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 6 : Activer le Bot WhatsApp Commercial 24/7</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Votre boutique est connectée à l&apos;Assistant IA Nopalou. Vos clients peuvent vous poser des questions et passer commande 24h/24.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Réponses auto :</strong> Le bot répond aux questions de prix, stock et horaires.</div>
                  <div><strong>2. Prise de commande :</strong> Le client compose son panier et paye par Wave ou OM sur WhatsApp.</div>
                  <div><strong>3. Notification marchand :</strong> Vous recevez le détail de la commande directement sur votre téléphone.</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'apporteur' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>7</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Étape 7 : Devenir Apporteur d&apos;Affaires (10% de Commission Mensuelle)</h3>
                </div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Recommandez Nopalou aux commerçants de votre réseau et percevez 10% sur chaque abonnement mensuel renouvelé.
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div><strong>1. Activez votre code :</strong> Générez votre code unique sur nopalou.com/compte/apporteur.</div>
                  <div><strong>2. Partagez votre lien :</strong> Envoyez votre lien aux commerçants pour qu&apos;ils créent leur boutique.</div>
                  <div><strong>3. Retrait Wave/OM :</strong> Percevez vos commissions mensuelles récurrentes directement sur Wave ou Orange Money.</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CATALOGUE DES FONCTIONNALITES COMPLETES (DESIGN CLAIR & LUMINEUX) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              ✨ SUITE COMPLÈTE NOPALOU
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 900, color: '#0F172A', margin: '8px 0 4px 0' }}>
              Les 6 Fonctionnalités Essentielles
            </h2>
            <p style={{ fontSize: 15, color: '#475569', margin: 0 }}>
              Une suite logicielle moderne, claire et adaptée au commerce au Sénégal.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {/* Card 1 */}
            <div style={{
              background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>1. Super-Comparateur de Prix</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Moteur de recherche intelligent comparant simultanément les produits de consommation, logements immobiliers et pass télécoms Orange, Free &amp; Expresso.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{
              background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏬</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>2. Caisse Enregistreuse POS Tactile</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Interface tactile pour tablette/téléphone permettant d&apos;encaisser en magasin (Wave, OM, Espèces), de scanner les codes-barres et d&apos;émettre des reçus digitaux.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{
              background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📝</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>3. Carnet de Crédits &amp; Dettes Client</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Enregistrement détaillé des articles pris à crédit par client, calcul automatique des reliquats et bouton de relance automatique WhatsApp en 1-clic.
              </p>
            </div>

            {/* Card 4 */}
            <div style={{
              background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🤖</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>4. Assistant Bot Commercial WhatsApp</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Chatbot connecté 24/7 à votre boutique pour répondre automatiquement aux questions des clients et enregistrer les commandes par Wave/OM.
              </p>
            </div>

            {/* Card 5 */}
            <div style={{
              background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>💼</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>5. Programme Apporteur 10% Récurrent</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Programme d&apos;affiliation rémunérant les apporteurs d&apos;affaires à hauteur de 10% mensuel récurrent sur chaque abonnement commerçant souscrit.
              </p>
            </div>

            {/* Card 6 */}
            <div style={{
              background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🎨</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>6. Générateur de Visuels &amp; Flyers</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Kit de communication prêt-à-l&apos;emploi générant des flyers professionnels pour promouvoir votre boutique sur WhatsApp, Instagram et Facebook.
              </p>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TABLEAU COMPARATIF VS CONCURRENCE                             */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0' }}>
              Pourquoi Nopalou surpasse la concurrence ?
            </h2>
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
              Comparaison objective entre Nopalou et les méthodes e-commerce ou manuelles classiques.
            </p>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 18, border: '1.5px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 650 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textTransform: 'uppercase', fontSize: 11, color: '#475569' }}>
                  <th style={{ padding: '16px' }}>Fonctionnalité / Solution</th>
                  <th style={{ padding: '16px', background: '#FFF7ED', color: '#C75B00', fontWeight: 800, textAlign: 'center' }}>
                    🚀 Nopalou Tout-en-Un
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>E-Commerce Classique</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Cahier Papier / Dettes</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>WhatsApp Manuel</th>
                </tr>
              </thead>
              <tbody style={{ color: '#334155' }}>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A' }}>🔍 Comparateur de prix multi-marchands</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: '#FFF7ED', color: '#059669', fontWeight: 800 }}>✅ Oui (Produits, Immo, Telecom)</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Vendeurs isolés</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#94A3B8' }}>— Non concerné</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Aucun comparateur</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A' }}>🏪 Caisse POS &amp; Carnet Crédits/Dettes</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: '#FFF7ED', color: '#059669', fontWeight: 800 }}>✅ Intégré + Relance WhatsApp 1-clic</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Pas de Caisse magasin</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#D97706' }}>⚠️ Cahier à risque d&apos;oubli</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Saisie manuelle pénible</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A' }}>🤖 Assistant Bot WhatsApp Commercial 24/7</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: '#FFF7ED', color: '#059669', fontWeight: 800 }}>✅ Commandes &amp; Réponses auto</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Pas d&apos;Assistant IA</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Aucun</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#D97706' }}>⚠️ Réponses lentes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A' }}>💼 Commission Récurrente Apporteur (10%)</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: '#FFF7ED', color: '#059669', fontWeight: 800 }}>✅ Revenu passif mensuel à vie</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Inexistant</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#94A3B8' }}>— Aucun</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#94A3B8' }}>— Aucun</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A' }}>💳 Paiements Wave &amp; Orange Money</td>
                  <td style={{ padding: '14px', textAlign: 'center', background: '#FFF7ED', color: '#059669', fontWeight: 800 }}>✅ Natif &amp; Instantané</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#D97706' }}>⚠️ Variable</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#DC2626' }}>❌ Espèces uniquement</td>
                  <td style={{ padding: '14px', textAlign: 'center', color: '#D97706' }}>⚠️ Envoi de capture manuel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SIMULATEUR LIVE À 3 PARCOURS                                 */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="simulateur-section" style={{ display: 'flex', flexDirection: 'column', gap: 20, scrollMarginTop: 30 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ alignSelf: 'center', background: '#FFF7ED', color: '#C75B00', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              🕹️ SIMULATEUR D&apos;ÉCRAN EN DIRECT
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              Testez l&apos;interface selon votre profil
            </h2>
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
              Sélectionnez un rôle pour simuler l&apos;interface exacte Nopalou étape par étape.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10, background: '#FFFFFF', padding: 8, borderRadius: 18, border: '1.5px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <button
              onClick={() => handleRoleChange('acheteur')}
              style={{
                background: activeRole === 'acheteur' ? 'linear-gradient(90deg, #C75B00, #EA580C)' : '#F8FAFC',
                color: activeRole === 'acheteur' ? '#FFF' : '#475569',
                border: activeRole === 'acheteur' ? 'none' : '1px solid #E2E8F0', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                fontWeight: 800, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 20 }}>🛒</span>
              <span>1. Parcours Acheteur Malin</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'acheteur' ? 0.9 : 0.7, fontWeight: 400 }}>Comparateur &amp; WhatsApp</span>
            </button>

            <button
              onClick={() => handleRoleChange('marchand')}
              style={{
                background: activeRole === 'marchand' ? 'linear-gradient(90deg, #0D9488, #10B981)' : '#F8FAFC',
                color: activeRole === 'marchand' ? '#FFF' : '#475569',
                border: activeRole === 'marchand' ? 'none' : '1px solid #E2E8F0', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                fontWeight: 800, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 20 }}>🏪</span>
              <span>2. Parcours Marchand POS</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'marchand' ? 0.9 : 0.7, fontWeight: 400 }}>Caisse POS &amp; Carnet Dettes</span>
            </button>

            <button
              onClick={() => handleRoleChange('apporteur')}
              style={{
                background: activeRole === 'apporteur' ? 'linear-gradient(90deg, #7C3AED, #6366F1)' : '#F8FAFC',
                color: activeRole === 'apporteur' ? '#FFF' : '#475569',
                border: activeRole === 'apporteur' ? 'none' : '1px solid #E2E8F0', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                fontWeight: 800, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 20 }}>💼</span>
              <span>3. Parcours Apporteur d&apos;Affaires</span>
              <span style={{ fontSize: 11, opacity: activeRole === 'apporteur' ? 0.9 : 0.7, fontWeight: 400 }}>Affiliation &amp; Commissions 10%</span>
            </button>
          </div>

          {/* Steps selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                style={{
                  background: activeStep === step ? '#0F172A' : '#FFFFFF',
                  color: activeStep === step ? '#FFF' : '#475569',
                  border: activeStep === step ? '1px solid #0F172A' : '1px solid #CBD5E1',
                  padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: activeStep === step ? '#C75B00' : '#E2E8F0',
                  color: activeStep === step ? '#FFF' : '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
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
            borderRadius: 20, border: '1.5px solid #E2E8F0', background: '#0F172A', overflow: 'hidden', boxShadow: '0 12px 30px rgba(15,23,42,0.15)', color: '#FFFFFF'
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
                          <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          background: '#FFFFFF',
          borderRadius: 24, padding: '32px 24px', border: '1.5px solid #E2E8F0',
          display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ background: '#CCFBF1', color: '#0D9488', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              🧮 SIMULATEUR DE REVENUS PASSIFS
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#0F172A', margin: '8px 0 4px 0' }}>
              Combien pouvez-vous gagner en tant qu&apos;Apporteur ?
            </h2>
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
              Déplacez les curseurs pour calculer vos commissions récurrentes mensuelles.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
            {/* Sliders */}
            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0F172A', marginBottom: 6 }}>
                  <span>Boutiques Pro (15 000 FCFA/m) :</span>
                  <strong style={{ color: '#C75B00' }}>{nbBoutiquesPro} boutiques</strong>
                </div>
                <input
                  type="range" min="0" max="50" value={nbBoutiquesPro}
                  onChange={(e) => setNbBoutiquesPro(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commission 10% = 1 500 FCFA / boutique / mois</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0F172A', marginBottom: 6 }}>
                  <span>Boutiques Business (35 000 FCFA/m) :</span>
                  <strong style={{ color: '#0D9488' }}>{nbBoutiquesBusiness} boutiques</strong>
                </div>
                <input
                  type="range" min="0" max="30" value={nbBoutiquesBusiness}
                  onChange={(e) => setNbBoutiquesBusiness(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commission 10% = 3 500 FCFA / boutique / mois</div>
              </div>
            </div>

            {/* Results Box */}
            <div style={{
              background: '#0F172A', padding: 24, borderRadius: 16, border: '1px solid #1E293B',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, color: '#FFFFFF'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Vos Commissions Mensuelles Récurrentes</span>
                <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#10B981', marginTop: 4 }}>
                  {commissionMensuelle.toLocaleString()} FCFA <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 400 }}>/ mois</span>
                </div>
              </div>

              <div style={{ background: '#1E293B', padding: 12, borderRadius: 10, fontSize: 12, color: '#CBD5E1' }}>
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
            background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 20, padding: 24,
            maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', color: '#0F172A'
          }}>
            <button
              onClick={() => setShowShareModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#64748B', fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>🔗 Lien Commercial Partageable</h3>
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                Saisissez votre code apporteur pour que les visites soient rattachées à votre profil.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>VOTRE CODE APPORTEUR / VENDEUR :</label>
                <input
                  type="text" placeholder="Ex: APPORT-77" value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 12px', color: '#0F172A', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>LIEN GÉNÉRÉ :</label>
                <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#0D9488', wordBreak: 'break-all' }}>
                  {shareableUrl}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCopyLink}
                style={{ flex: 1, background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
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
