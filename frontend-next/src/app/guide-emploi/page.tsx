import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Comment utiliser Nopalou — Guide complet',
  description: `Guides détaillés sur le parcours Acheteur (comparer, commander et suivre) et le parcours Marchand (créer sa boutique, vendre via WhatsApp et suivre ses ventes).`,
  alternates: { canonical: `${BASE}/guide-emploi` },
}

const ACHETEUR_STEPS = [
  {
    icon: '🔍', couleur: '#1d4ed8',
    titre: '1. Rechercher des produits',
    texte: 'Tapez le nom d\'un produit ou d\'un bien immo (ex : "Samsung Galaxy A55", "climatiseur Haier"). Nopalou cherche sur toutes les boutiques partenaires.',
    ctas: [{ label: 'Rechercher →', href: '/', couleur: '#1d4ed8', bg: '#eff6ff' }],
  },
  {
    icon: '⚖️', couleur: '#0891b2',
    titre: '2. Comparer côte à côte',
    texte: 'Cliquez sur l\'icône de comparaison ⚖ sur les produits pour comparer leurs caractéristiques et prix chez différents marchands.',
    ctas: [{ label: 'Guide d\'achat →', href: '/guide-achat', couleur: '#0891b2', bg: '#ecfeff' }],
  },
  {
    icon: '📲', couleur: '#25D366',
    titre: '3. Commander sur WhatsApp',
    texte: 'Cliquez sur "Commander via WhatsApp" depuis la fiche produit ou boutique. Le panier pré-rempli est envoyé directement au marchand.',
    ctas: [{ label: 'Assistant WhatsApp →', href: '/assistant-whatsapp', couleur: '#25D366', bg: '#f0fdf4' }],
  },
  {
    icon: '🚚', couleur: '#059669',
    titre: '4. Modes de livraison & Suivi',
    texte: 'Recevez votre colis chez vous. Suivez vos commandes en envoyant la référence (ex : PAY-12345) à l\'Assistant WhatsApp Nopalou.',
    ctas: [{ label: 'Suivre via WhatsApp →', href: 'https://wa.me/221708717942?text=suivi', couleur: '#059669', bg: '#ecfdf5' }],
  },
  {
    icon: '🔔', couleur: '#f59e0b',
    titre: '5. Configurer des alertes prix',
    texte: 'Indiquez votre budget cible pour un produit. Nopalou vous envoie un message WhatsApp dès que le prix baisse.',
    ctas: [{ label: 'Créer une alerte →', href: '/mes-alertes', couleur: '#f59e0b', bg: '#fffbeb' }],
  },
]

function getMarchandSteps(commission: string) {
  return [
    {
      icon: '🏢', couleur: '#ea580c',
      titre: '1. Inscription & Boutique',
      texte: 'Créez votre compte gratuit en 2 minutes. Activez votre espace Boutique en renseignant vos coordonnées et lien WhatsApp.',
      ctas: [{ label: 'Créer ma boutique →', href: '/inscription', couleur: '#ea580c', bg: '#fff7ed' }],
    },
    {
      icon: '📦', couleur: '#7c3aed',
      titre: '2. Configurer le catalogue',
      texte: 'Ajoutez vos produits en quelques clics : importez des photos, définissez les prix, états (neuf/occasion) et variantes.',
      ctas: [],
    },
    {
      icon: '💬', couleur: '#25D366',
      titre: '3. Commandes sur WhatsApp',
      texte: 'Les commandes de vos clients arrivent structurées dans votre WhatsApp. Vous finalisez directement avec le client.',
      ctas: [],
    },
    {
      icon: '📈', couleur: '#1e3a5f',
      titre: '4. Suivi & Analytics',
      texte: 'Consultez le nombre de vues, clics et contacts sur votre boutique depuis votre tableau de bord marchand pour optimiser vos ventes.',
      ctas: [],
    },
    {
      icon: '💼', couleur: '#C75B00',
      titre: '5. Devenir Apporteur',
      texte: `Partagez Nopalou autour de vous et touchez ${commission}% de commission récurrente sur les abonnements Pro/Business souscrits par vos filleuls.`,
      ctas: [{ label: 'Devenir apporteur →', href: '/compte/apporteur', couleur: '#C75B00', bg: '#fff7ed' }],
    },
  ]
}

export default async function GuideEmploiPage() {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let commission = '10'
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) {
      const s = await r.json()
      commission = s.apporteur_taux_commission || '10'
    }
  } catch {
    // fallback
  }

  const marchandSteps = getMarchandSteps(commission)

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 1000, margin: '0 auto', padding: '16px 16px 40px' }}>
      
      {/* Retour Accueil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/" className="guide-back-btn" style={{ color: '#475569', borderColor: '#e2e8f0', background: '#fff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', textDecoration: 'none', fontSize: 14 }}>
          ← Accueil
        </Link>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1C2B4A' }}>📖 Comment fonctionne Nopalou</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Guides pratiques et parcours détaillés de la plateforme.</div>
        </div>
      </div>

      {/* Double Colonne Parcours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 40 }}>
        
        {/* Parcours Acheteur */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1d4ed8', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🛒 Parcours Acheteur
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.6 }}>
            Comment comparer les prix, commander au meilleur tarif et suivre vos livraisons facilement.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ACHETEUR_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ background: step.couleur + '12', color: step.couleur, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', flexShrink: 0, fontSize: 18, justifyContent: 'center' }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', marginBottom: 3 }}>{step.titre}</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{step.texte}</div>
                  {step.ctas.map(cta => (
                    <Link key={cta.href} href={cta.href} className="guide-emploi-cta" style={{ background: cta.bg, color: cta.couleur, borderColor: cta.couleur, marginTop: 8, display: 'inline-flex', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid', textDecoration: 'none' }}>
                      {cta.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parcours Marchand */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ea580c', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🏢 Parcours Marchand
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.6 }}>
            Comment ouvrir votre boutique, ajouter vos produits et encaisser des ventes via WhatsApp.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {marchandSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ background: step.couleur + '12', color: step.couleur, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', flexShrink: 0, fontSize: 18, justifyContent: 'center' }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', marginBottom: 3 }}>{step.titre}</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{step.texte}</div>
                  {step.ctas.map(cta => (
                    <Link key={cta.href} href={cta.href} className="guide-emploi-cta" style={{ background: cta.bg, color: cta.couleur, borderColor: cta.couleur, marginTop: 8, display: 'inline-flex', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid', textDecoration: 'none' }}>
                      {cta.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontWeight: 800, color: '#1C2B4A', fontSize: 15, marginBottom: 4 }}>✅ Nopalou est 100% gratuit et indépendant pour les acheteurs</div>
        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 12 }}>Les prix et informations proviennent directement des sites marchands et boutiques locales partenaires. Nopalou compare et oriente pour vous faire économiser au quotidien.</div>
        <div style={{ fontSize: 12, color: '#475569', paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
          🗑️ <strong>Droit de retrait :</strong> Pour supprimer votre annonce ou votre numéro du site, envoyez <strong>&quot;supprimer&quot;</strong> sur <Link href="/assistant-whatsapp" style={{ color: '#25d366', fontWeight: 700 }}>WhatsApp</Link>. Pour ne plus recevoir de messages, envoyez <strong>&quot;STOP&quot;</strong>. (<Link href="/cgu#suppression-donnees" style={{ color: '#0284c7', textDecoration: 'underline' }}>En savoir plus</Link>)
        </div>
      </div>
    </div>
  )
}
