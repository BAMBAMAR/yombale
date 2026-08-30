import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Store, Smartphone, ShieldCheck, Zap, TrendingUp, CheckCircle2,
  ArrowRight, Users, MessageSquare, CreditCard, RefreshCw, BarChart3,
  Award, Clock, Lock, Sparkles, HelpCircle, ChevronRight, FileText,
  BadgePercent, Layers, Receipt, ShoppingCart, DollarSign
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nopalou Marchands | La Plateforme E-Commerce & Caisse POS N°1 au Sénégal',
  description: 'Tout votre commerce dans votre poche : Boutique en ligne, Caisse POS utilisable sans Internet, Commandes WhatsApp et paiements Wave & Orange Money sans commission. 30 jours offerts sans carte bancaire.',
  keywords: [
    'boutique en ligne sénégal', 'caisse enregistreuse dakar', 'caisse pos sénégal',
    'vendre sur whatsapp dakar', 'alternative shopify sénégal', 'logiciel commerce dakar',
    'carnet de dette commerçant', 'paiement wave commerçant', 'nopalou marchands'
  ],
  openGraph: {
    title: 'Nopalou Marchands — Vendez partout, encaissez direct, gérez tranquille.',
    description: 'La solution tout-en-un pour commerçants africains. Vitrine WhatsApp, caisse tactile hors-ligne, carnet de dettes et encaissements Wave.',
    url: 'https://nopalou.com/marchands',
    type: 'website',
  },
}

const FAQ_ITEMS = [
  {
    q: "Ai-je besoin d'une carte bancaire pour commencer ?",
    a: "Non, absolument aucune carte bancaire n'est nécessaire. Vous commencez immédiatement avec 30 jours 100% gratuits. À la fin de votre essai, vous réglez votre abonnement (dès 2 500 FCFA/mois) directement avec votre compte Wave ou Orange Money habituel."
  },
  {
    q: "Est-ce que la caisse enregistreuse fonctionne si Internet coupe ?",
    a: "Oui ! Nopalou POS intègre la technologie Offline-First. En cas de coupure de connexion Sonatel, Yas ou Senelec, vous continuez à enregistrer vos ventes et calculer la monnaie. Dès que la connexion revient, vos données se synchronisent automatiquement."
  },
  {
    q: "Prenez-vous une commission sur mes ventes ?",
    a: "0% de commission sur les formules Taf Taf et Pro ! Vous encaissez 100% de votre argent directement sur votre numéro Wave, Orange Money ou en espèces. Nopalou ne prend aucun pourcentage sur votre chiffre d'affaires."
  },
  {
    q: "J'ai déjà des centaines de produits sur Excel ou Shopify, dois-je tout retaper ?",
    a: "Pas du tout ! Grâce à notre module d'import intelligent, vous glissez-déposez votre fichier Excel, CSV ou export Shopify : vos articles, prix, descriptions et photos sont importés en moins de 3 minutes."
  },
  {
    q: "Comment mes clients passent-ils commande sur WhatsApp ?",
    a: "Vos clients consultent votre lien de boutique personnalisé (ex : nopalou.com/boutique/votre-nom), ajoutent leurs articles au panier, et lorsqu'ils cliquent sur 'Commander', un message WhatsApp propre et détaillé arrive directement sur votre numéro avec la liste des produits et le montant total."
  },
  {
    q: "Puis-je gérer mon commerce uniquement avec mon smartphone sans ordinateur ?",
    a: "Absolument. 100% des fonctionnalités (création de boutique, ajout de produits, caisse magasin, carnet de dettes et relances) sont optimisées pour fonctionner avec une fluidité totale sur n'importe quel smartphone Android ou iPhone."
  }
]

export default function MarchandsLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO SECTION PREMIUM B2B SAAS ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
        color: '#ffffff',
        padding: '70px 20px 110px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Effets lumineux subtils de fond */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Badge de réassurance */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(199,91,0,0.18)', color: '#fed7aa',
            padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
            marginBottom: 24, border: '1px solid rgba(199,91,0,0.35)',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={14} style={{ color: '#fed7aa' }} />
            <span>LE SYSTÈME COMMERCIAL TOUT-EN-UN CONÇU POUR L'AFRIQUE</span>
          </div>

          {/* Titre Principal */}
          <h1 style={{
            fontSize: 'clamp(32px, 5.2vw, 58px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}>
            La puissance de Shopify.<br/>
            La simplicité de <span style={{ color: '#25D366' }}>WhatsApp</span>.<br/>
            L'efficacité de <span style={{ color: '#10b981' }}>Wave</span>.
          </h1>

          {/* Sous-titre orienté bénéfice */}
          <p style={{
            fontSize: 'clamp(16px, 2.4vw, 20px)',
            color: '#94a3b8',
            maxWidth: 780,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Remplacez vos carnets papier, fichiers Excel et applications dispersées par une plateforme unique : 
            <strong> Vitrine e-commerce, Caisse tactile (POS) utilisable sans Internet, et Carnet de dettes avec relance 1-clic.</strong>
          </p>

          {/* CTAs d'action immédiate */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/creer-boutique" style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff',
              padding: '16px 36px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(199,91,0,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'transform 0.15s ease'
            }}>
              <span>Créer ma boutique (1 mois offert)</span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/demo?role=marchand" style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '16px 30px', borderRadius: 30,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              <span>Tester la démo interactive</span>
              <span>→</span>
            </Link>
          </div>

          {/* Preuves de confiance rapides */}
          <div style={{
            marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8', fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>0 FCFA d'avance (30 jours offerts)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>Sans carte bancaire (Paiement Wave/OM)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>0% de commission sur vos ventes</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. MOCKUP INTERACTIF DU DASHBOARD MARCHAND ── */}
      <section style={{ maxWidth: 1160, margin: '-60px auto 70px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '12px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.18)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden'
        }}>
          {/* Header de la fenêtre applicative */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
            borderRadius: '16px 16px 0 0'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginLeft: 12 }}>
                nopalou.com/boutique/dakar-tech-express
              </span>
            </div>
            <span style={{
              background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 900,
              padding: '3px 10px', borderRadius: 12, border: '1px solid #a7f3d0'
            }}>
              🟢 EN LIGNE · SYNCHRO TEMPS RÉEL
            </span>
          </div>

          {/* Interface Applicative Stylisée */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, padding: 24, background: '#f8fafc' }}>
            
            {/* Bloc 1 : Vue Ventes & Caisse */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Chiffre d'Affaires du Jour</span>
                <span style={{ fontSize: 11, fontWeight: 900, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 8 }}>Aujourd'hui</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1C2B4A', marginBottom: 8 }}>
                348 500 <span style={{ fontSize: 16, fontWeight: 700 }}>FCFA</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>🌊 Wave : 210 000 F</span>
                <span style={{ background: '#fff7ed', color: '#c2410c', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>🟠 OM : 85 000 F</span>
                <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>💵 Cash : 53 500 F</span>
              </div>
            </div>

            {/* Bloc 2 : Caisse POS Tactile */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Caisse POS Magasin</span>
                <span style={{ fontSize: 11, fontWeight: 900, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 8 }}>Mode Hors-Ligne Prêt</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f1f5f9', padding: 10, borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>iPhone 13 128 Go (Neuf)</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Scan Caméra &bull; Code: 200849201</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00' }}>320 000 F</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 800, color: '#059669', paddingTop: 6 }}>
                <span>✅ Ticket imprimé &bull; Facture OHADA générée</span>
              </div>
            </div>

            {/* Bloc 3 : Carnet de Dettes & Relance WhatsApp */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Carnet de Dettes (Bor)</span>
                <span style={{ fontSize: 11, fontWeight: 900, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 8 }}>3 En Attente</span>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fef08a', padding: 10, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
                  <span style={{ color: '#0f172a' }}>Moussa Diop (Plateau)</span>
                  <span style={{ color: '#b45309' }}>25 000 FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#78350f' }}>Échéance : 30 Août</span>
                  <span style={{ background: '#25D366', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6 }}>
                    💬 Relancer sur WhatsApp
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. LES 6 PILIERS DU SUPER-SAAS MARCHAND ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 60px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Fonctionnalités Métiers
          </span>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#1C2B4A', margin: '8px 0 16px', lineHeight: 1.2 }}>
            Tout ce dont vous avez besoin pour développer vos ventes
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Conçu sur mesure pour la réalité du commerce à Dakar et dans les régions du Sénégal.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
          
          {/* Pilier 1 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, background: '#fff7ed', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C75B00', marginBottom: 20 }}>
              <Store size={28} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Vitrine Web &amp; WhatsApp en 30s</h3>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Obtenez votre adresse web personnalisée. Vos clients parcourent votre catalogue complet, choisissent leurs options (tailles, couleurs) et vous envoient la commande toute prête sur WhatsApp.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Ajout express par photo ou texte</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Panier multi-produits synchronisé</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Personnalisation des couleurs de marque</li>
            </ul>
          </div>

          {/* Pilier 2 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, background: '#f0fdf4', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', marginBottom: 20 }}>
              <Smartphone size={28} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Caisse POS Magasin (Offline-First)</h3>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Transformez votre smartphone ou tablette en caisse enregistreuse tactile professionnelle. Fonctionne à 100% sans Internet lors des coupures de réseau.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Scan codes-barres par caméra mobile ou douchette</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Émission de tickets &amp; factures OHADA</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Clôture de caisse journalière (Rapport Z)</li>
            </ul>
          </div>

          {/* Pilier 3 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, background: '#eff6ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', marginBottom: 20 }}>
              <CreditCard size={28} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Wave &amp; Orange Money Direct</h3>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Encaissez directement sur votre propre numéro Wave, Orange Money ou en cash. Aucun intermédiaire, aucun compte bloqué et 0% de commission prélevée.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> L'argent arrive instantanément sur votre compte</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Liens de paiement générés automatiquement</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Gestion fluide des acomptes et des espèces</li>
            </ul>
          </div>

          {/* Pilier 4 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, background: '#fef3c7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', marginBottom: 20 }}>
              <Receipt size={28} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Carnet de Dettes &amp; Relances (Bor)</h3>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Fini les cahiers tachés et les créances oubliées. Enregistrez les dettes clients et envoyez des rappels polis sur WhatsApp contenant directement votre lien Wave.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Relance WhatsApp pré-remplie en 1 clic</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Suivi par date d'échéance et par client</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Historique complet des remboursements</li>
            </ul>
          </div>

          {/* Pilier 5 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, background: '#f5f3ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: 20 }}>
              <MessageSquare size={28} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Assistant WhatsApp 24h/24</h3>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Pilotez votre commerce par message. Envoyez 'Bilan' le soir pour recevoir votre chiffre d'affaires, ajoutez des articles par message vocal ou photo.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Bilan de fin de journée instantané</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Alertes automatiques de stock faible</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Notifications de commandes en direct</li>
            </ul>
          </div>

          {/* Pilier 6 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, background: '#fff1f2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', marginBottom: 20 }}>
              <TrendingUp size={28} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Trafic &amp; Visibilité Comparateur</h3>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
              Bénéficiez du trafic naturel du comparateur de prix N°1 au Sénégal. Vos produits sont automatiquement suggérés aux milliers d'acheteurs actifs à Dakar.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5, color: '#334155', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Badge Vendeur Vérifié &amp; Certifié</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Référencement Google automatique (SEO)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span> Nouveaux clients sans budget publicitaire</li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── 4. TABLEAU COMPARATIF CONCURRENTIEL ── */}
      <section style={{ maxWidth: 1060, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pourquoi nous choisir
          </span>
          <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 36px)', fontWeight: 900, color: '#1C2B4A', margin: '8px 0 0' }}>
            Nopalou vs Les Autres Solutions
          </h2>
        </div>

        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 24, border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '20px 24px', fontWeight: 800, color: '#334155' }}>Critères Décisifs</th>
                <th style={{ padding: '20px 24px', fontWeight: 900, color: '#C75B00', background: '#fff7ed', fontSize: 16 }}>
                  🧡 Nopalou SaaS
                </th>
                <th style={{ padding: '20px 24px', fontWeight: 700, color: '#64748b' }}>Shopify / WooCommerce</th>
                <th style={{ padding: '20px 24px', fontWeight: 700, color: '#64748b' }}>WhatsApp Seul</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#334155' }}>Prix d'accès</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#059669', background: '#fff7ed' }}>Dès 2 500 F/mois (1m offert)</td>
                <td style={{ padding: '16px 24px', color: '#64748b' }}>18 000 F à 50 000 F/mois</td>
                <td style={{ padding: '16px 24px', color: '#059669' }}>Gratuit</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#334155' }}>Paiement de l'abonnement</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#059669', background: '#fff7ed' }}>Wave &amp; Orange Money direct</td>
                <td style={{ padding: '16px 24px', color: '#dc2626' }}>Carte Visa internationale ($)</td>
                <td style={{ padding: '16px 24px', color: '#64748b' }}>Aucun</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#334155' }}>Commission sur vos ventes</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#059669', background: '#fff7ed' }}>0% Commission</td>
                <td style={{ padding: '16px 24px', color: '#dc2626' }}>2% à 5% + frais passerelle</td>
                <td style={{ padding: '16px 24px', color: '#059669' }}>0%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#334155' }}>Caisse magasin sans Internet</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#059669', background: '#fff7ed' }}>OUI (PWA Offline-First)</td>
                <td style={{ padding: '16px 24px', color: '#dc2626' }}>NON (Matériel lourd requis)</td>
                <td style={{ padding: '16px 24px', color: '#dc2626' }}>NON</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#334155' }}>Carnet de Dettes &amp; Relance</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#059669', background: '#fff7ed' }}>OUI (Relance WhatsApp 1-clic)</td>
                <td style={{ padding: '16px 24px', color: '#dc2626' }}>NON</td>
                <td style={{ padding: '16px 24px', color: '#64748b' }}>Manuel sur cahier</td>
              </tr>
              <tr>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#334155' }}>Facilité d'utilisation</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#059669', background: '#fff7ed' }}>100% sur Smartphone (Zéro code)</td>
                <td style={{ padding: '16px 24px', color: '#dc2626' }}>Complexe (Ordinateur requis)</td>
                <td style={{ padding: '16px 24px', color: '#059669' }}>Simple</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 5. COMMENT DÉMARRER EN 3 ÉTAPES (ZÉRO PRISE DE TÊTE) ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
            Comment lancer votre boutique en 2 minutes ?
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, background: '#fff7ed', color: '#C75B00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, margin: '0 auto 20px' }}>
              1
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Entrez votre nom &amp; WhatsApp</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              Saisissez le nom de votre commerce et votre numéro WhatsApp pour recevoir vos commandes.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, background: '#fff7ed', color: '#C75B00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, margin: '0 auto 20px' }}>
              2
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Ajoutez vos premiers produits</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              Prenez des photos de vos articles ou importez votre fichier Excel en 1 clic grâce à notre IA.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, background: '#fff7ed', color: '#C75B00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, margin: '0 auto 20px' }}>
              3
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Partagez &amp; Encaissez</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              Mettez votre lien dans votre statut WhatsApp ou encaissez au comptoir avec votre caisse tactile.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ MARCHANDS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', color: '#1C2B4A', marginBottom: 36 }}>
          Questions Fréquentes des Commerçants
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQ_ITEMS.map((item, idx) => (
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

      {/* ── 7. BANNIÈRE FINALE CTA HAUTE CONVERSION ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          borderRadius: 28,
          padding: '50px 30px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(28,43,74,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <span style={{
            background: 'rgba(199,91,0,0.25)', color: '#fed7aa',
            fontSize: 12, fontWeight: 900, padding: '4px 14px', borderRadius: 20,
            letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 16
          }}>
            Prêt à transformer votre commerce ?
          </span>

          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            Lancez votre boutique aujourd'hui avec 0 FCFA.
          </h2>

          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Testez toutes les fonctionnalités pendant 30 jours sans engagement. Notre équipe vous accompagne personnellement pour vos premiers pas.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/creer-boutique" style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff',
              padding: '16px 36px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 10px 25px rgba(199,91,0,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              <span>Créer ma boutique gratuitement</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/tarifs-boutique" style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: '16px 28px', borderRadius: 30,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              Consulter la grille tarifaire
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
