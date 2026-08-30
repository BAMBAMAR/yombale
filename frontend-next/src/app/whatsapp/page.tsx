import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MessageSquare, ShoppingCart, Receipt, Zap, ShieldCheck,
  CheckCircle2, ArrowRight, Sparkles, HelpCircle, PhoneCall,
  Bell, Bot, Send, CheckCheck
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Vendre sur WhatsApp avec Nopalou | Commandes, Dettes & Bilan Automatisés',
  description: 'Transformez WhatsApp en votre meilleur commercial. Commandes pré-remplies sans ressaisie, relances de dettes 1-clic avec lien Wave, et bilan financier du jour par message. 30 jours offerts.',
  keywords: [
    'vendre sur whatsapp sénégal', 'commandes whatsapp dakar', 'bot whatsapp e-commerce dakar',
    'relance dette whatsapp dakar', 'assistant whatsapp commerçant sénégal', 'nopalou whatsapp'
  ],
  openGraph: {
    title: 'Nopalou WhatsApp — Votre commerce automatisé sur WhatsApp.',
    description: 'Recevez des commandes prêtes à livrer, relancez vos clients et obtenez votre bilan du jour par un simple message WhatsApp.',
    url: 'https://nopalou.com/whatsapp',
    type: 'website',
  },
}

const WA_FAQ = [
  {
    q: "Comment mes clients m'envoient-ils des commandes structurées sur WhatsApp ?",
    a: "Lorsque votre client visite votre lien Nopalou (depuis votre statut WhatsApp, Instagram ou Facebook), il sélectionne ses articles, remplit son adresse et clique sur 'Commander sur WhatsApp'. Votre WhatsApp s'ouvre avec un message propre contenant la liste exacte des articles, les quantités, le total en FCFA et l'adresse de livraison."
  },
  {
    q: "Comment fonctionne la relance de dette par WhatsApp ?",
    a: "Depuis votre tableau de bord Nopalou ou votre téléphone, vous cliquez sur 'Relancer' à côté d'une dette client. Un message WhatsApp poli et professionnel est préparé avec le prénom du client, le montant exact et votre lien de paiement Wave sécurisé pour qu'il règle en 1 seconde."
  },
  {
    q: "Comment obtenir mon bilan du soir sans calculatrice ?",
    a: "Envoyez simplement le mot 'Bilan' par message WhatsApp à l'assistant officiel Nopalou. En moins de 3 secondes, vous recevez le récapitulatif de votre journée : nombre de ventes, chiffre d'affaires total, et ventilation précise Espèces, Wave et Orange Money."
  },
  {
    q: "Dois-je laisser mon ordinateur allumé pour que cela fonctionne ?",
    a: "Pas du tout. Tout fonctionne 24h/24 dans le Cloud. Vous gérez 100% de votre activité directement depuis votre téléphone WhatsApp habituel."
  }
]

export default function WhatsappLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO WHATSAPP COMMERCE ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f231c 0%, #061510 100%)',
        color: '#ffffff',
        padding: '70px 20px 110px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(37,211,102,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(199,91,0,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(37,211,102,0.15)', color: '#86efac',
            padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
            marginBottom: 24, border: '1px solid rgba(37,211,102,0.35)',
            letterSpacing: '0.04em'
          }}>
            <MessageSquare size={14} style={{ color: '#25D366' }} />
            <span>COMMERCE CONVERSATIONNEL &bull; 100% ADAPTÉ AU SÉNÉGAL</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}>
            Transformez WhatsApp en votre <br/>
            meilleur <span style={{ color: '#25D366' }}>vendeur &amp; caissier.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.4vw, 20px)',
            color: '#94a3b8',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Fini les 50 messages pour donner un prix ou chercher une photo. Vos clients commandent en 1 clic sur votre vitrine, 
            <strong> vous recevez la commande toute prête, et vous relancez vos impayés par un simple message.</strong>
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/creer-boutique" style={{
              background: 'linear-gradient(135deg, #25D366 0%, #16a34a 100%)',
              color: '#ffffff',
              padding: '16px 36px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(37,211,102,0.35)',
              display: 'inline-flex', alignItems: 'center', gap: 10
            }}>
              <span>Activer mon commerce WhatsApp (1 mois offert)</span>
              <ArrowRight size={18} />
            </Link>

            <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '16px 30px', borderRadius: 30,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              <span>Tester le Bot au +221 70 871 79 42</span>
              <span>💬</span>
            </a>
          </div>

          <div style={{
            marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8', fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#25D366' }} />
              <span>Aucune application à faire installer aux clients</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#25D366' }} />
              <span>Lien Wave intégré dans chaque message</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#25D366' }} />
              <span>Bilan du soir disponible 24h/24</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. SIMULATION VISUELLE DES MESSAGES WHATSAPP ── */}
      <section style={{ maxWidth: 1040, margin: '-60px auto 70px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '14px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.16)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden'
        }}>
          {/* Header WhatsApp Phone */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: '#075E54', color: '#ffffff',
            borderRadius: '16px 16px 0 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🏪
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Nopalou Assistant Marchand</div>
                <div style={{ fontSize: 11, color: '#86efac' }}>En ligne 24h/24 &bull; Service Automatique</div>
              </div>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
              Exemples Réels
            </span>
          </div>

          {/* Corps de conversation stylisé WhatsApp */}
          <div style={{
            padding: '24px 16px', background: '#efeae2',
            backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)',
            backgroundSize: '16px 16px', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            
            {/* Bulle 1 : Commande Client Reçue */}
            <div style={{
              alignSelf: 'flex-start', maxWidth: 460, background: '#ffffff',
              padding: '14px 16px', borderRadius: '0 16px 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#059669', marginBottom: 4 }}>
                🛒 NOUVELLE COMMANDE REÇUE (Boutique Web)
              </div>
              <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>
                <strong>Client :</strong> Fatou Bintou Ndiaye (+221 77 450 XX XX)<br/>
                <strong>Livraison :</strong> Mermoz, Dakar<br/>
                <strong>Articles :</strong><br/>
                &bull; 1× Robe Soirée Satin (Taille M / Noir) &bull; 18 000 F<br/>
                &bull; 1× Sac à main Cuir &bull; 12 000 F<br/>
                <strong>Total : 30 000 FCFA</strong> (Paiement à la livraison)
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, color: '#64748b' }}>
                <span>14:32</span>
                <CheckCheck size={14} style={{ color: '#38bdf8' }} />
              </div>
            </div>

            {/* Bulle 2 : Bilan Commerçant */}
            <div style={{
              alignSelf: 'flex-end', maxWidth: 360, background: '#dcf8c6',
              padding: '12px 16px', borderRadius: '16px 0 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                Bilan
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: '#64748b' }}>
                <span>21:00</span>
                <CheckCheck size={14} style={{ color: '#38bdf8' }} />
              </div>
            </div>

            {/* Bulle 3 : Réponse Automatique Bilan */}
            <div style={{
              alignSelf: 'flex-start', maxWidth: 460, background: '#ffffff',
              padding: '14px 16px', borderRadius: '0 16px 16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#1d4ed8', marginBottom: 4 }}>
                📊 BILAN DU JOUR &bull; Dakar Tech Express
              </div>
              <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>
                🎉 <strong>Chiffre d'Affaires Total : 285 000 FCFA</strong> (14 ventes)<br/>
                &bull; 🌊 Wave : 180 000 FCFA (8 paiements)<br/>
                &bull; 🟠 Orange Money : 65 000 FCFA (3 paiements)<br/>
                &bull; 💵 Espèces Caisse : 40 000 FCFA (3 ventes)<br/>
                &bull; 📒 1 Acompte noté au carnet (25 000 F)
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, color: '#64748b' }}>
                <span>21:00</span>
                <CheckCheck size={14} style={{ color: '#38bdf8' }} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. LES 4 GRANDS CAS D'USAGE WHATSAPP ── */}
      <section style={{ maxWidth: 1160, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 60px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px' }}>
            Tout Votre Commerce dans une Simple Conversation
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Découvrez comment Nopalou exploite le canal le plus utilisé au Sénégal pour accélérer vos ventes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          
          <div style={{ background: '#ffffff', padding: 28, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🛒</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Commandes Pré-Remplies</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Vos clients choisissent leurs articles sur votre lien web et vous envoient la commande complète sans avoir à taper le moindre texte.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 28, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📒</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Relances Dettes 1-Clic</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Envoyez un rappel poli avec le solde exact et votre QR Code ou lien Wave direct pour être remboursé immédiatement sans conflit.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 28, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📈</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Bilan par Simple Message</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Envoyez 'Bilan' le soir pour recevoir votre chiffre d'affaires ventilé sans ouvrir d'ordinateur ni faire de calculs manuels.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 28, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📸</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Ajout d'Articles Express</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Envoyez la photo d'un nouvel arrivage et son prix par message WhatsApp : notre système crée l'article sur votre vitrine automatiquement.
            </p>
          </div>

        </div>
      </section>

      {/* ── 4. FAQ WHATSAPP ── */}
      <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', color: '#1C2B4A', marginBottom: 36 }}>
          Questions Fréquentes sur WhatsApp Commerce
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {WA_FAQ.map((item, idx) => (
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

      {/* ── 5. BANNIÈRE CTA WHATSAPP ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #075E54 0%, #054039 100%)',
          borderRadius: 28,
          padding: '50px 30px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(7,94,84,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            Prêt à vendre sur WhatsApp comme un Pro ?
          </h2>
          <p style={{ fontSize: 16, color: '#a7f3d0', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Créez votre boutique en 30 secondes et connectez-la à votre WhatsApp. 30 jours 100% offerts.
          </p>
          <Link href="/creer-boutique" style={{
            background: '#ffffff',
            color: '#075E54',
            padding: '16px 36px', borderRadius: 30,
            fontSize: 17, fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <span>Lancer ma boutique WhatsApp (30j offerts)</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </main>
  )
}
