import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Check, X, CheckCircle2, ArrowRight, Sparkles, HelpCircle,
  Store, Smartphone, CreditCard, Receipt, TrendingUp, ShieldCheck,
  Zap, Award, Users
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pourquoi Choisir Nopalou ? | Comparatif Complet & Honnête pour Commerçants',
  description: 'Découvrez pourquoi Nopalou est la meilleure solution de commerce au Sénégal face à Shopify, WhatsApp seul, aux carnets papier et aux caisses traditionnelles. 30 jours offerts.',
  keywords: [
    'pourquoi nopalou', 'nopalou vs shopify sénégal', 'nopalou vs whatsapp business',
    'comparatif logiciel caisse dakar', 'alternative carnet de dette sénégal', 'avis nopalou commerçant'
  ],
  openGraph: {
    title: 'Pourquoi choisir Nopalou ? Le comparatif complet.',
    description: 'Comparez Nopalou aux solutions existantes (Shopify, WhatsApp seul, carnet papier, caisse classique).',
    url: 'https://nopalou.com/pourquoi-nopalou',
    type: 'website',
  },
}

const COMPARATIFS = [
  {
    titre: "Nopalou vs WhatsApp Seul",
    emoji: "💬",
    description: "WhatsApp est parfait pour discuter, mais devient un cauchemar dès que vous avez plus de 10 commandes par jour.",
    nopalou: [
      "Vos clients voient tout votre catalogue avec prix, tailles et photos sans vous solliciter",
      "Commandes reçues toutes prêtes avec le montant total exact calculé",
      "Stock décompté automatiquement pour éviter de vendre 2 fois le même article",
      "Carnet de dettes intégré avec relances Wave en 1 clic"
    ],
    autre: [
      "Perte de 3h par jour à renvoyer les mêmes photos et répéter les prix",
      "Erreurs de calcul fréquentes et commandes incomplètes",
      "Gestion manuelle et risque d'oublier des réservations",
      "Dettes notées sur des bouts de papier faciles à perdre"
    ]
  },
  {
    titre: "Nopalou vs Carnet Papier & Cahier de Dettes",
    emoji: "📒",
    description: "Le cahier traditionnel est gratuit au départ, mais vous fait perdre des dizaines de milliers de FCFA en oublis chaque mois.",
    nopalou: [
      "Historique sécurisé dans le Cloud : impossible de perdre vos comptes",
      "Relance amicale par WhatsApp avec lien de paiement Wave direct",
      "Bilan automatique de fin de journée en 3 secondes sans calculatrice",
      "Calcul instantané de la monnaie à rendre au client"
    ],
    autre: [
      "Cahiers tachés, déchirés ou égarés lors des déménagements",
      "Relances clients gênantes ou oubliées faute de suivi",
      "Calculs manuels longs et fatigants après la fermeture",
      "Aucune visibilité sur la rentabilité réelle de votre commerce"
    ]
  },
  {
    titre: "Nopalou vs Shopify & Plateformes Internationales",
    emoji: "🌐",
    description: "Shopify est conçu pour les États-Unis et l'Europe, pas pour les commerçants de Dakar, Sandaga ou Thiès.",
    nopalou: [
      "Dès 2 500 FCFA/mois, payable directement par Wave ou Orange Money",
      "0% de commission sur vos ventes",
      "Commandes WhatsApp et Caisse POS magasin incluses",
      "Zéro carte bancaire internationale requise"
    ],
    autre: [
      "29$ / mois (~18 000 FCFA) + frais d'applications payantes en dollars",
      "Commissions prélevées sur chaque transaction",
      "Nécessite des intégrations complexes pour Wave et WhatsApp",
      "Carte Visa / Mastercard internationale obligatoire"
    ]
  },
  {
    titre: "Nopalou vs Caisse Enregistreuse Classique",
    emoji: "🖥️",
    description: "Les caisses enregistreuses traditionnelles coûtent des centaines de milliers de FCFA et s'arrêtent à la porte du magasin.",
    nopalou: [
      "Fonctionne sur le smartphone ou la tablette que vous avez déjà (0 F de matériel)",
      "Stock synchronisé en temps réel entre votre magasin physique et votre vitrine web",
      "Fonctionne 100% hors-ligne lors des coupures de réseau",
      "Factures et devis officiels OHADA partageables par WhatsApp"
    ],
    autre: [
      "Matériel lourd et coûteux (300 000 F à 800 000 F d'investissement)",
      "Totalement déconnecté de vos ventes en ligne et WhatsApp",
      "Frais de maintenance et réparations techniques complexes",
      "Tickets papier uniquement, sans partage digital"
    ]
  }
]

export default function PourquoiNopalouPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO COMPARATIF ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
        color: '#ffffff',
        padding: '70px 20px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(199,91,0,0.2)', color: '#fed7aa',
            padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
            marginBottom: 20, border: '1px solid rgba(199,91,0,0.4)',
            letterSpacing: '0.05em'
          }}>
            ⚖️ COMPARATIF OBJECTIF &amp; TRANSPARENT
          </span>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 900,
            margin: '0 0 18px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em'
          }}>
            Pourquoi choisir <span style={{ color: '#C75B00' }}>Nopalou</span> pour votre commerce ?
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.4vw, 19px)',
            color: '#94a3b8',
            maxWidth: 720,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Découvrez comment Nopalou réunit le meilleur de la technologie mondiale avec la simplicité du commerce sénégalais.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/creer-boutique" style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff',
              padding: '16px 36px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(199,91,0,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              <span>Créer ma boutique (1 mois offert)</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/tarifs-boutique" style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '16px 28px', borderRadius: 30,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              Voir la grille tarifaire
            </Link>
          </div>

        </div>
      </section>

      {/* ── 2. LES 4 GRANDES CONFRONTATIONS DÉTAILLÉES ── */}
      <section style={{ maxWidth: 1160, margin: '-50px auto 90px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {COMPARATIFS.map((comp, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: 24,
                padding: '32px 28px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{comp.emoji}</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {comp.titre}
                </h2>
              </div>
              <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.5, margin: '0 0 24px' }}>
                {comp.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {/* Colonne Nopalou */}
                <div style={{ background: '#fff7ed', borderRadius: 16, padding: 20, border: '1.5px solid #fed7aa' }}>
                  <div style={{ fontWeight: 900, color: '#C75B00', fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🧡 Avec Nopalou :</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {comp.nopalou.map((pt, pIdx) => (
                      <li key={pIdx} style={{ fontSize: 13.5, color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                        <span style={{ color: '#10b981', fontWeight: 900, marginTop: 1 }}>✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Colonne Alternative */}
                <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 900, color: '#64748b', fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>❌ Sans Nopalou :</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {comp.autre.map((pt, pIdx) => (
                      <li key={pIdx} style={{ fontSize: 13.5, color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                        <span style={{ color: '#ef4444', fontWeight: 900, marginTop: 1 }}>✕</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. BANNIÈRE CTA FINAL ── */}
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
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            Rejoignez les commerçants qui ont modernisé leur activité.
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Faites l'expérience par vous-même pendant 30 jours sans entrer de carte bancaire.
          </p>
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
        </div>
      </section>

    </main>
  )
}
