'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Store, User, ShoppingCart, ShoppingBag, FileText,
  CreditCard, Truck, Zap, Share2, Award, CheckCircle2,
  ChevronRight, Search, Copy, Check, MessageCircle, HelpCircle, ArrowRight
} from 'lucide-react'

export default function GuideUtilisationClient() {
  const [activeTab, setActiveTab] = useState<string>('intro')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyText = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const SECTIONS = [
    { id: 'intro', label: '🚀 Démarrage & Inscription', icon: Zap },
    { id: 'compte', label: '👤 Espace Compte Utilisateur', icon: User },
    { id: 'catalogue', label: '📦 Catalogue & Produits', icon: ShoppingBag },
    { id: 'caisse', label: '🖥️ Caisse POS & Hors-Ligne', icon: ShoppingCart },
    { id: 'dettes', label: '📒 Carnet de Dettes WhatsApp', icon: CreditCard },
    { id: 'factures', label: '📑 Facturation OHADA (PDF)', icon: FileText },
    { id: 'fournisseurs', label: '🚚 Fournisseurs & Scan OCR', icon: Truck },
    { id: 'commandes', label: '🛒 Commandes & Paniers', icon: Store },
    { id: 'compta', label: '⚡ Saisie Express & Compta', icon: Zap },
    { id: 'marketing', label: '📣 Marketing & Stories HD', icon: Share2 },
    { id: 'tarifs', label: '⭐ Forfaits & Abonnements', icon: Award },
    { id: 'faq', label: '❓ Questions Fréquentes', icon: HelpCircle },
  ]

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 20px 80px', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
      
      {/* Header Héro */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
        borderRadius: 24, padding: '40px 36px', color: '#fff', marginBottom: 36,
        position: 'relative', overflow: 'hidden', border: '2px solid rgba(199, 91, 0, 0.3)',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(199, 91, 0, 0.15)' }} />
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199, 91, 0, 0.2)', padding: '6px 14px', borderRadius: 20, marginBottom: 16 }}>
          <BookOpen size={16} color="#C75B00" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FFEDD5', letterSpacing: '0.05em' }}>
            MANUEL OFFICIEL D&apos;UTILISATION NOPALOU
          </span>
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
          Guide d&apos;Utilisation Simplifié du Site, du Compte &amp; de la Boutique
        </h1>
        <p style={{ fontSize: 16, color: '#CBD5E1', maxWidth: 780, lineHeight: 1.6, margin: '0 0 24px' }}>
          Apprenez à configurer votre boutique en 3 minutes, maîtriser la Caisse POS même sans connexion internet, créer des factures légales OHADA, gérer les dettes clients et booster vos ventes au Sénégal.
        </p>

        {/* Barre de recherche dans le guide */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 14, padding: '10px 18px', maxWidth: 540,
        }}>
          <Search size={20} color="#94A3B8" />
          <input
            type="text"
            placeholder="Rechercher une fonctionnalité (ex: Caisse offline, facture, dette...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: '#fff', fontSize: 15, width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Disposition Navigation Latérale + Contenu */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' }}>
        
        {/* Menu Latéral des Sections */}
        <aside style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)', position: 'sticky', top: 20,
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', padding: '8px 12px', display: 'block' }}>
            Sommaire du Guide
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon
              const isActive = activeTab === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => { setActiveTab(sec.id); window.scrollTo({ top: 200, behavior: 'smooth' }) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? '#FFF7ED' : 'transparent',
                    color: isActive ? '#C75B00' : '#1C2B4A',
                    fontWeight: isActive ? 800 : 600, fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={18} color={isActive ? '#C75B00' : '#64748B'} />
                  <span style={{ flex: 1 }}>{sec.label}</span>
                  {isActive && <ChevronRight size={16} color="#C75B00" />}
                </button>
              )
            })}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />

          <div style={{ padding: '0 8px' }}>
            <Link
              href="/boutique"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 16px', background: '#C75B00', color: '#fff', borderRadius: 10,
                fontWeight: 800, fontSize: 14, textDecoration: 'none',
              }}
            >
              Accéder à ma boutique ➔
            </Link>
          </div>
        </aside>

        {/* Panneau Principal de Contenu */}
        <main style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '36px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>

          {/* 1. DÉMARRAGE & INSCRIPTION */}
          {(activeTab === 'intro' || searchQuery) && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>🚀</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  1. Démarrage Express : Ouvrir son Compte &amp; Créer sa Boutique
                </h2>
              </div>

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>
                Sur Nopalou, l&apos;ouverture d&apos;un compte et la création d&apos;une boutique s&apos;effectuent en moins de 3 minutes depuis n&apos;importe quel smartphone ou ordinateur.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                {[
                  {
                    step: '1',
                    title: 'Inscription avec votre numéro de téléphone / WhatsApp',
                    desc: 'Rendez-vous sur nopalou.com/inscription. Indiquez votre prénom, nom, numéro de téléphone et mot de passe. Aucun justificatif lourd n\'est demandé.',
                  },
                  {
                    step: '2',
                    title: 'Création de votre Boutique en 1 Clic',
                    desc: 'Depuis votre menu ou sur nopalou.com/creer-boutique, saisissez le nom de votre commerce, votre ville (ex: Dakar, Thiès...), votre adresse et votre numéro WhatsApp commercial.',
                  },
                  {
                    step: '3',
                    title: 'Bénéficiez immédiatement de 30 Jours d\'Essai 100% Offerts',
                    desc: 'Toutes les fonctionnalités Pro (Caisse POS Offline, 3 Scanners EAN, Factures OHADA, Dettes WhatsApp) sont débloquées instantanément sans carte bancaire.',
                  },
                ].map((s) => (
                  <div key={s.step} style={{
                    display: 'flex', gap: 16, background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: 14, padding: '16px 20px',
                  }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#C75B00', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15,
                      flexShrink: 0,
                    }}>{s.step}</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>{s.title}</h3>
                      <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. ESPACE COMPTE UTILISATEUR */}
          {(activeTab === 'compte' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'compte' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'compte' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>👤</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  2. Comprendre l&apos;Espace Compte Utilisateur
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>📋 Mes Annonces Classifiées</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Publiez des annonces de vente (téléphones, autos, mode, électro). Vous pouvez activer le <strong>Boost 7 Jours en 1 clic Wave</strong> pour apparaître en tête de liste sur le site.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>🏠 Mes Biens Immobiliers</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Publiez vos appartements, villas et terrains à louer ou à vendre avec photos HD, localisation exacte et contact direct sans intermédiaire masqué.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>💼 Espace Apporteur d&apos;Affaires (20%)</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Activez votre code d&apos;apporteur unique, partagez votre lien et touchez <strong>20% de commission récurrente à vie</strong> sur chaque boutique abonnée, payés directement par Wave / Orange Money.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>🔔 Alertes Prix &amp; Favoris</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Sauvegardez vos articles préférés et recevez des notifications automatiques dès qu&apos;un prix baisse chez un marchand.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. CATALOGUE & PRODUITS */}
          {(activeTab === 'catalogue' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'catalogue' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'catalogue' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>📦</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  3. Gestion du Catalogue &amp; Fiches Produits
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: 14, padding: '18px 22px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#C75B00', margin: '0 0 8px' }}>
                    ✨ 4 Façons d&apos;Ajouter vos Produits :
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#1C2B4A', lineHeight: 1.8 }}>
                    <li><strong>Saisie Manuelle Express</strong> : Nom, prix de vente, prix barré promotionnel, photos HD et description.</li>
                    <li><strong>Variantes Multiples</strong> : Tailles (XS à XXL), Pointures (36 à 46), Stockage (64Go à 1To), Couleurs avec pastilles interactives.</li>
                    <li><strong>Import par Lot Excel / CSV</strong> : Glissez-déposez votre fichier fournisseur ou votre liste de stock existante en 1 seconde (`BatchImportModal`).</li>
                    <li><strong>Génération Codes-Barres EAN-13 GS1</strong> : Impression instantanée de planches de stickers autocollants à coller sur vos articles.</li>
                  </ul>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 22px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px' }}>
                    📲 Partage Instantané 100% Marque Blanche Marchand :
                  </h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Dès l&apos;ajout d&apos;un produit, générez en 1 clic une <strong>Story HD 1080×1920</strong> au nom et logo exclusifs de votre boutique (sans logo Nopalou) pour vos statuts WhatsApp, Instagram et TikTok, avec message rédigé et lien de commande directe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. CAISSE POS & HORS-LIGNE */}
          {(activeTab === 'caisse' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'caisse' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'caisse' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>🖥️</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  4. Caisse Enregistreuse POS Tactile &amp; Mode Hors-Ligne (PWA)
                </h2>
              </div>

              <div style={{
                background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 16, padding: '22px', marginBottom: 18,
              }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#166534' }}>
                  🟢 Fonctionne à 100% même en cas de coupure Internet (Offline First)
                </span>
                <p style={{ fontSize: 14, color: '#14532D', marginTop: 8, lineHeight: 1.6, margin: '8px 0 0' }}>
                  La caisse Nopalou est une Progressive Web App (PWA). Votre catalogue et vos prix sont stockés sur votre appareil. Vous pouvez scanner, encaisser et imprimer des tickets sans aucune connexion. Dès que le réseau revient, vos ventes se synchronisent automatiquement !
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <span style={{ fontSize: 24 }}>📷</span>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '8px 0 4px' }}>Scanner Caméra</h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Utilisez directement l&apos;appareil photo de votre smartphone ou tablette.</p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <span style={{ fontSize: 24 }}>⚡</span>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '8px 0 4px' }}>Scanner Cloud &lt;100ms</h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Détection instantanée et synchronisation ultrarapide en boutique.</p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <span style={{ fontSize: 24 }}>🔌</span>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '8px 0 4px' }}>Douchette USB / Bluetooth</h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Branchez votre lecteur laser standard pour un encaissement à la chaîne.</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. CARNET DE DETTES */}
          {(activeTab === 'dettes' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'dettes' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'dettes' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>📒</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  5. Carnet de Dettes &amp; Relance WhatsApp 1-Clic
                </h2>
              </div>

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>
                Fini les cahiers en papier déchirés ou les dettes oubliées. Enregistrez les crédits de vos clients réguliers en 2 clics :
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <CheckCircle2 size={22} color="#D97706" />
                  <span style={{ fontSize: 14, color: '#92400E', fontWeight: 700 }}>
                    Enregistrement de la dette lors du passage en caisse ou manuellement (Nom du client + Téléphone + Montant).
                  </span>
                </div>
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <CheckCircle2 size={22} color="#D97706" />
                  <span style={{ fontSize: 14, color: '#92400E', fontWeight: 700 }}>
                    Calcul automatique du solde restant et historique de tous les paiements partiels reçus.
                  </span>
                </div>
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <CheckCircle2 size={22} color="#D97706" />
                  <span style={{ fontSize: 14, color: '#92400E', fontWeight: 700 }}>
                    Bouton vert « 💬 Relancer sur WhatsApp » : envoie un message poli et professionnel avec le détail du solde en 1 clic.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. FACTURATION & DEVIS OHADA */}
          {(activeTab === 'factures' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'factures' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'factures' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>📑</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  6. Facturation &amp; Devis Légaux OHADA en PDF
                </h2>
              </div>

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>
                Émettez des documents conformes aux normes fiscales sénégalaises et OHADA pour vos clients professionnels, entreprises et chantiers :
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>Mentions Légales Intégrées</h4>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Numéro NINEA, RCCM, taux de TVA paramétrable (18%), droit de timbre fiscal pour les espèces et coordonnées bancaires.
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>Conversion en 1 Clic</h4>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Transformez un devis ou une facture proforma en facture définitive dès la validation du paiement par le client.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. FOURNISSEURS & SCAN OCR */}
          {(activeTab === 'fournisseurs' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'fournisseurs' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'fournisseurs' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>🚚</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  7. Fournisseurs, Bons de Commande &amp; Scan OCR
                </h2>
              </div>

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>
                Gérez vos réapprovisionnements sans effort : créez des bons de commande par fournisseur, prenez en photo la facture papier du fournisseur avec le scanner OCR pour renseigner automatiquement les quantités et incrémenter vos stocks.
              </p>
            </div>
          )}

          {/* 8. COMMANDES WEB & PANIERS */}
          {(activeTab === 'commandes' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'commandes' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'commandes' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>🛒</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  8. Commandes Web &amp; Relance des Paniers Abandonnés
                </h2>
              </div>

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>
                Lorsque des acheteurs visitent votre vitrine en ligne, ils ajoutent des produits au panier et valident leur commande en 1 clic directement sur votre WhatsApp. Vous recevez le récapitulatif complet (articles, prix, adresse de livraison) sans payer la moindre commission.
              </p>
            </div>
          )}

          {/* 9. FORFAITS & ABONNEMENTS */}
          {(activeTab === 'tarifs' || searchQuery) && (
            <div style={{ marginBottom: 40, borderTop: activeTab !== 'tarifs' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'tarifs' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>⭐</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  9. Grille Tarifaire &amp; Abonnements
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 14, padding: '18px' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#64748B' }}>DÉCOUVERTE</span>
                  <h4 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '4px 0' }}>Taf Taf</h4>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#C75B00' }}>2 500 F</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}> / mois</span>
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.4 }}>
                    Vitrine web, commandes WhatsApp, carnet de dettes et partage de stories.
                  </p>
                </div>

                <div style={{ background: '#FFF7ED', border: '2px solid #C75B00', borderRadius: 14, padding: '18px' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00' }}>⭐ LE PLUS POPULAIRE</span>
                  <h4 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '4px 0' }}>Boutique Pro</h4>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#C75B00' }}>5 000 F</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}> / mois</span>
                  <p style={{ fontSize: 12, color: '#1C2B4A', marginTop: 10, lineHeight: 1.4, fontWeight: 600 }}>
                    Caisse POS Offline, 3 Scanners EAN, Facturation OHADA, Saisie Express.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1.5px solid #1E293B', borderRadius: 14, padding: '18px' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>PME &amp; ENSEIGNES</span>
                  <h4 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '4px 0' }}>Business VIP</h4>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1C2B4A' }}>10 000 F</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}> / mois</span>
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.4 }}>
                    Multi-Caissiers PIN, Fournisseurs OCR, Clôtures Z, API REST développeur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 10. FAQ RAPIDE */}
          {(activeTab === 'faq' || searchQuery) && (
            <div style={{ borderTop: activeTab !== 'faq' ? '1px solid #E2E8F0' : 'none', paddingTop: activeTab !== 'faq' ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>❓</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  10. Questions Fréquemment Posées (FAQ)
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    q: 'Est-ce que je dois acheter une machine spéciale pour la caisse ?',
                    r: 'Non ! La caisse Nopalou fonctionne directement sur votre smartphone Android/iPhone, sur une tablette ou sur votre ordinateur.',
                  },
                  {
                    q: 'Que se passe-t-il si ma connexion internet coupe pendant que j\'encaisse ?',
                    r: 'Rien ne s\'arrête ! La caisse enregistre les ventes hors-ligne. Dès que vous retrouvez la connexion, tout se synchronise tout seul.',
                  },
                  {
                    q: 'Prenez-vous une commission sur mes ventes ?',
                    r: 'Absolument 0% ! Tous vos gains vous appartiennent intégralement. Vous ne payez que votre forfait fixe mensuel ultra-abordable.',
                  },
                  {
                    q: 'Comment mes clients me paient-ils ?',
                    r: 'En espèces au magasin, ou par Wave / Orange Money directement sur votre numéro.',
                  },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>{item.q}</h4>
                    <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>{item.r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
