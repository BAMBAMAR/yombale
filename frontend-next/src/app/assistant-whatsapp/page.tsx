import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Assistant WhatsApp — Comparez les prix par message',
  description: `L'assistant WhatsApp de Nopalou : recherchez un produit, recevez les meilleurs prix au Sénégal, créez des alertes et consultez l'immobilier, directement sur WhatsApp.`,
  alternates: { canonical: `${BASE}/assistant-whatsapp` },
}

const WA_LINK = 'https://wa.me/221708717942?text=' + encodeURIComponent('menu')

const FONCTIONS = [
  {
    groupe: '🔍 Recherche & comparaison',
    items: [
      {
        icon: '🔍', couleur: '#1d4ed8',
        titre: 'Rechercher un produit, une boutique ou une annonce',
        texte: "Tapez le nom d'un produit (ex : \"iPhone 14\", \"climatiseur Haier\") et l'assistant vous répond avec les prix trouvés chez les marchands partenaires, dans les boutiques Nopalou, une annonce classifiée ou un bien immo correspondant — avec le lien direct vers la fiche.",
      },
      {
        icon: '🏠', couleur: '#059669',
        titre: 'Parcourir les annonces immo',
        texte: "Recevez directement dans la conversation les dernières annonces immobilières (appartements, villas, terrains) avec photo, prix et lien vers l'annonce complète.",
      },
      {
        icon: '📱', couleur: '#7c3aed',
        titre: 'Comparer les offres télécom',
        texte: "Consultez les derniers forfaits mobiles Orange, Yas, Expresso et Promobile sans quitter WhatsApp.",
      },
      {
        icon: '➡️', couleur: '#64748b',
        titre: 'Voir plus de résultats',
        texte: "Dites \"plus\" ou \"encore\" pour continuer une recherche sans avoir à la retaper.",
      },
    ],
  },
  {
    groupe: '🛍️ Boutiques & achat',
    items: [
      {
        icon: '🏪', couleur: '#25D366',
        titre: 'Commander directement sur WhatsApp',
        texte: "Parcourez une boutique via son lien ou par catégorie, choisissez vos produits — même plusieurs à la fois grâce au panier WhatsApp — et passez commande sans quitter la conversation. Le vendeur reçoit tout instantanément.",
      },
    ],
  },
  {
    groupe: '🔔 Alertes & suivi',
    items: [
      {
        icon: '🔔', couleur: '#f59e0b',
        titre: 'Créer une alerte de prix',
        texte: "Dites à l'assistant quel produit vous intéresse et à quel prix vous voulez être alerté — vous serez notifié par WhatsApp dès que le prix cible est atteint, sans avoir de compte.",
      },
      {
        icon: '📦', couleur: '#0891b2',
        titre: 'Suivre une commande',
        texte: "Entrez votre référence de commande (ex : PAY-12345) pour connaître son statut et son montant, à tout moment.",
      },
    ],
  },
  {
    groupe: '❓ FAQ & support',
    items: [
      {
        icon: '💬', couleur: '#C75B00',
        titre: 'Poser une question sur le site',
        texte: "Gratuit ou payant, comment publier une annonce, créer une boutique, comparer les prix... L'assistant répond directement aux questions les plus courantes, et vous donne les coordonnées de l'équipe Nopalou si besoin.",
      },
    ],
  },
]

export default function AssistantWhatsAppPage() {
  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 820 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Link href="/" className="guide-back-btn" style={{ color: '#475569', borderColor: '#e2e8f0', background: '#fff' }}>
          ← Accueil
        </Link>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>💬 Assistant WhatsApp Nopalou</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Comparez les prix directement depuis votre chat, sans installer d&apos;application.</div>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #fff)',
        border: '1.5px solid #25D366',
        borderRadius: 16, padding: '28px 24px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Envoyez &quot;menu&quot; pour commencer
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Disponible 24h/24 · 100% gratuit · Aucune inscription requise
          </p>
        </div>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '14px 28px', background: '#25D366', color: '#fff',
            borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}
        >
          💬 Discuter sur WhatsApp
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 24 }}>
        {FONCTIONS.map(groupe => (
          <div key={groupe.groupe}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
              {groupe.groupe}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groupe.items.map((f) => (
                <div key={f.titre} className="guide-emploi-step">
                  <div className="guide-emploi-icon" style={{ background: f.couleur + '18' }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="guide-emploi-titre">{f.titre}</div>
                    <div className="guide-emploi-texte">{f.texte}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="guide-emploi-footer">
        <div className="guide-emploi-footer-titre">✅ Comment lancer une conversation</div>
        <div className="guide-emploi-footer-texte">
          Enregistrez le numéro <strong>+221 70 871 79 42</strong> ou cliquez sur le bouton ci-dessus,
          puis envoyez n&apos;importe quel message — l&apos;assistant vous présente le menu automatiquement.
          Tapez <strong>menu</strong> à tout moment pour revenir au début.
        </div>
      </div>
    </div>
  )
}
