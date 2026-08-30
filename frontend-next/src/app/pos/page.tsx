import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Smartphone, WifiOff, QrCode, Receipt, Users, Zap, ShieldCheck,
  CheckCircle2, ArrowRight, Printer, Sparkles, HelpCircle, Store,
  CreditCard, BarChart2, Laptop, Clock
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Caisse Enregistreuse Dakar & Prix Sénégal | Nopalou POS pour Petit Commerce',
  description: 'La caisse enregistreuse tactile N°1 à Dakar pour petit commerce, boutique et magasin. Fonctionne 100% hors-ligne sans Internet dès 2 500 FCFA/mois. 30 jours offerts.',
  keywords: [
    'caisse enregistreuse dakar',
    'caisse enregistreuse prix sénégal',
    'caisse enregistreuse petit commerce',
    'caisse enregistreuse tactile sénégal',
    'logiciel caisse magasin dakar',
    'caisse hors ligne sénégal wave',
    'imprimer ticket de caisse thermique dakar',
    'facture ohada dakar',
    'terminal point de vente sénégal',
    'nopalou pos'
  ],
  openGraph: {
    title: 'Caisse Enregistreuse Dakar & Sénégal — Nopalou POS',
    description: 'La solution de caisse enregistreuse tactile pour petit commerce au Sénégal. Prix dès 2 500 FCFA/mois avec 30 jours offerts.',
    url: 'https://nopalou.com/pos',
    type: 'website',
  },
}

const POS_FAQ = [
  {
    q: "Quel est le prix d'une caisse enregistreuse au Sénégal ?",
    a: "Alors qu'une caisse enregistreuse tactile traditionnelle coûte entre 300 000 et 800 000 FCFA à Dakar, Nopalou POS ne nécessite aucun matériel coûteux et démarre à seulement 2 500 FCFA/mois (avec le premier mois 100% gratuit). Elle fonctionne sur votre smartphone, tablette ou ordinateur."
  },
  {
    q: "Pourquoi Nopalou est la meilleure caisse enregistreuse pour petit commerce ?",
    a: "Nopalou est spécialement conçue pour les petits commerces, boutiques de quartier et commerçants à Dakar : elle fonctionne même lors des coupures de réseau Internet (hors-ligne), gère les espèces et la monnaie, intègre le carnet de dettes clients ('Bor') et permet d'encaisser directement par Wave et Orange Money sans commission."
  },
  {
    q: "Dois-je acheter un terminal ou du matériel de caisse coûteux ?",
    a: "Non ! Nopalou POS fonctionne sur le matériel que vous possédez déjà : n'importe quel smartphone Android, iPhone, tablette ou ordinateur portable. Si vous avez déjà une douchette USB ou une imprimante thermique Bluetooth (58mm/80mm), elles sont 100% compatibles."
  },
  {
    q: "Comment la caisse fonctionne-t-elle sans connexion Internet ?",
    a: "Grâce à notre technologie Progressive Web App (PWA) Offline-First, l'ensemble de votre catalogue et de vos prix est enregistré en mémoire locale sécurisée sur votre appareil. Vous encaissez vos clients, calculez la monnaie et imprimez les tickets sans aucune interruption de service. La synchronisation s'effectue automatiquement dès le retour du réseau."
  },
  {
    q: "Puis-je gérer plusieurs caissiers ou vendeurs avec des accès séparés ?",
    a: "Oui, la formule Pro et Business intègre la gestion multi-caissiers avec code PIN à 4 chiffres. Vous pouvez suivre les ventes réalisées par chaque membre de l'équipe et générer un rapport de clôture de caisse Z individuel en fin de journée."
  },
  {
    q: "Les factures et reçus sont-ils conformes aux règles sénégalaises ?",
    a: "Absolument. Vous pouvez renseigner votre NINEA, RCCM, adresse légale et taux de TVA. Les reçus et factures PDF émis respectent les standards comptables OHADA et peuvent être imprimés ou envoyés directement au client par WhatsApp."
  }
]

export default function PosLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO POS PREMIUM ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0b1526 100%)',
        color: '#ffffff',
        padding: '70px 20px 110px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.18)', color: '#a7f3d0',
            padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
            marginBottom: 24, border: '1px solid rgba(16,185,129,0.35)',
            letterSpacing: '0.04em'
          }}>
            <WifiOff size={14} style={{ color: '#6ee7b7' }} />
            <span>TECHNOLOGIE OFFLINE-FIRST &bull; FONCTIONNE SANS INTERNET</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}>
            Votre Caisse Enregistreuse Tactile,<br/>
            même lors des <span style={{ color: '#10b981' }}>coupures de réseau.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.4vw, 20px)',
            color: '#94a3b8',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Transformez instantanément votre smartphone, tablette ou ordinateur en terminal de vente complet :
            <strong> Scan codes-barres par caméra, factures OHADA, carnet de dettes et clôtures de caisse Z.</strong>
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/creer-boutique?plan=pro" style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff',
              padding: '16px 36px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(199,91,0,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 10
            }}>
              <span>Essayer Nopalou POS (1 mois offert)</span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/demo?role=marchand&tab=pos" style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '16px 30px', borderRadius: 30,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              <span>Tester la caisse en démo</span>
              <span>→</span>
            </Link>
          </div>

          <div style={{
            marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8', fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>Compatible tout téléphone &amp; tablette</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>Zéro matériel obligatoire</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>Rapport Z fin de journée inclus</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. VISUALISATION INTERFACE CAISSE POS ── */}
      <section style={{ maxWidth: 1100, margin: '-60px auto 70px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '14px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.16)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden'
        }}>
          {/* Header POS */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: '#0f172a', color: '#ffffff',
            borderRadius: '16px 16px 0 0', flexWrap: 'wrap', gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🖥️</span>
              <span style={{ fontWeight: 900, fontSize: 14 }}>Nopalou POS &bull; Caisse Principale #01</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#15803d', color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 10 }}>
                ⚡ Mode Offline Actif
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>
                Caissier : Ousmane S.
              </span>
            </div>
          </div>

          {/* Grille de Caisse POS Réaliste */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16, padding: 20, background: '#f1f5f9' }}>
            
            {/* Colonne Catalogue Rapide */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 12 }}>
                🎯 Articles Fréquents (Toucher pour ajouter)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { nom: 'Sac de Riz 50kg', prix: '22 500 F', emoji: '🌾' },
                  { nom: 'Huile Dinor 5L', prix: '7 500 F', emoji: '🍾' },
                  { nom: 'Sucre Morceau 1kg', prix: '850 F', emoji: '🧊' },
                  { nom: 'Lait Bonnet Bleu', prix: '2 400 F', emoji: '🥛' },
                ].map((art, idx) => (
                  <div key={idx} style={{
                    background: '#f8fafc', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0',
                    cursor: 'pointer', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{art.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{art.nom}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#C75B00', marginTop: 4 }}>{art.prix}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne Panier & Encaissement */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Ticket en Cours (2 articles)</span>
                  <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>Vider</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
                    <span>1× Sac de Riz 50kg</span>
                    <span style={{ fontWeight: 900 }}>22 500 F</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
                    <span>2× Huile Dinor 5L</span>
                    <span style={{ fontWeight: 900 }}>15 000 F</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ background: '#fff7ed', padding: 12, borderRadius: 12, border: '1px solid #fed7aa', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#9a3412' }}>Total à Payer :</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#C75B00' }}>37 500 FCFA</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    💵 Espèces
                  </button>
                  <button style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    🌊 Wave
                  </button>
                  <button style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    🟠 OM
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. LES AVANTAGES CLÉS DE NOPALOU POS ── */}
      <section style={{ maxWidth: 1160, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 60px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px' }}>
            Pensé pour la Vitesse au Comptoir
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Évitez les files d'attente, éliminez les erreurs de rendu de monnaie et gardez le contrôle total de vos stocks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
          
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, background: '#f0fdf4', color: '#15803d', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <WifiOff size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Mode Hors-Ligne Automatique</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Même sans connexion 4G ou WiFi, continuez d'encaisser vos clients au comptoir. Les ventes sont stockées localement et synchronisées dès que la connexion est rétablie.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, background: '#eff6ff', color: '#1d4ed8', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <QrCode size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>3 Modes de Scan Inclus</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Scannez vos articles avec la caméra de votre smartphone (très rapide), branchez une douchette code-barres USB ou connectez le Cloud Scanner pour une réactivité instantanée &lt;100ms.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, background: '#fff7ed', color: '#C75B00', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Printer size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Factures &amp; Reçus Thermiques</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Imprimez vos tickets de caisse en Bluetooth (imprimantes 58mm et 80mm) ou partagez des reçus PDF et devis officiels NINEA &amp; RCCM conformes OHADA directement sur WhatsApp.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, background: '#f5f3ff', color: '#7c3aed', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Users size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Multi-Caissiers &amp; Sécurité PIN</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Attribuez un code PIN unique à chaque vendeur. Vous gardez un contrôle total sur les remises autorisées, les annulations de vente et l'accès aux rapports financiers.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, background: '#fff1f2', color: '#e11d48', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <BarChart2 size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Rapport Z &amp; Clôture Journalière</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Fini les heures de calcul le soir. En 1 clic, obtenez le rapport de clôture ventilé : Total des ventes, ventilation Espèces / Wave / Orange Money et écarts de caisse.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, background: '#fef3c7', color: '#b45309', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Store size={26} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Stock Magasin &amp; Web Unifié</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Lorsqu'un article est vendu au comptoir, votre stock sur votre vitrine web et WhatsApp est décompté automatiquement pour éviter de vendre deux fois le même article.
            </p>
          </div>

        </div>
      </section>

      {/* ── 3.5 SECTEURS D'ACTIVITÉ CAISSE ENREGISTREUSE ── */}
      <section style={{ maxWidth: 1160, margin: '0 auto 90px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 40px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px' }}>
            Une Caisse Enregistreuse Adaptée à Votre Métier
          </h2>
          <p style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Que vous ayez une boutique physique, un showroom ou un point de vente éphémère à Dakar :
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { em: '👗', t: 'Prêt-à-Porter & Chaussures', d: 'Gestion intuitive des variantes de tailles, couleurs, arrivages et étiquetage codes-barres en magasin.' },
            { em: '📱', t: 'Téléphonie & High-Tech', d: 'Suivi des numéros IMEI, accessoires, garanties et factures officielles proforma conformes.' },
            { em: '💄', t: 'Cosmétiques & Parfumerie', d: 'Encaissement rapide au comptoir, gestion des gammes capillaires, mèches et remises clients.' },
            { em: '🛠️', t: 'Quincaillerie & Électro', d: 'Émission de devis, factures avec NINEA/RCCM et TVA pour vos clients professionnels et particuliers.' },
            { em: '🍏', t: 'Épicerie & Alimentation', d: 'Scan code-barres ultra rapide, calcul instantané de la monnaie et impression tickets thermiques.' },
            { em: '🍽️', t: 'Snacks & Restauration', d: 'Prise de commande rapide, encaissement direct Wave/OM ou espèces et suivi des ventes journalières.' },
          ].map(s => (
            <div key={s.t} style={{ background: '#ffffff', padding: 22, borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{s.em}</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>{s.t}</h3>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. FAQ POS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', color: '#1C2B4A', marginBottom: 36 }}>
          Questions Fréquentes sur la Caisse Enregistreuse Nopalou
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {POS_FAQ.map((item, idx) => (
            <details
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '18px 24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer'
              }}
            >
              <summary style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', outline: 'none' }}>
                {item.q}
              </summary>
              <p style={{ marginTop: 14, color: '#475569', fontSize: 14.5, lineHeight: 1.6, margin: '14px 0 0' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── 5. BANNIÈRE CTA POS ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          borderRadius: 28,
          padding: '50px 30px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(28,43,74,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            Digitalisez la caisse de votre magasin dès aujourd'hui.
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Activez la caisse enregistreuse Nopalou POS en moins de 2 minutes. 30 jours offerts sans aucun engagement.
          </p>
          <Link href="/creer-boutique?plan=pro" style={{
            background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
            color: '#ffffff',
            padding: '16px 36px', borderRadius: 30,
            fontSize: 17, fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(199,91,0,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <span>Démarrer avec la Caisse POS (30j offerts)</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </main>
  )
}
