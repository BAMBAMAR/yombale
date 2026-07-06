import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Comment utiliser Nopalou — Guide' }

const STEPS = [
  {
    icon: '🔍', couleur: '#1d4ed8',
    titre: 'Comparer les prix des produits',
    texte: 'Tapez un produit dans la barre de recherche (ex : "Samsung Galaxy A55", "climatiseur 18 000 BTU"). Nopalou compare les prix chez tous les marchands partenaires et met en avant la meilleure offre.',
    ctas: [{ label: 'Rechercher →', href: '/', couleur: '#1d4ed8', bg: '#eff6ff' }],
  },
  {
    icon: '🏆', couleur: '#ea580c',
    titre: "Guide d'achat intelligent",
    texte: "Vous ne savez pas lequel choisir ? Indiquez votre budget et vos priorités. Nopalou calcule un score personnalisé et classe les produits selon votre profil d'achat.",
    ctas: [{ label: 'Lancer le guide →', href: '/guide-achat', couleur: '#ea580c', bg: '#fff7ed' }],
  },
  {
    icon: '🏡', couleur: '#059669',
    titre: 'Trouver un logement',
    texte: "Parcourez les annonces immobilières (appartements, villas, studios, chambres…). Filtrez par type, ville, quartier et budget. Le Guide immobilier présente les annonces les plus compatibles avec votre projet.",
    ctas: [
      { label: 'Voir les annonces →', href: '/immo', couleur: '#059669', bg: '#f0fdf4' },
      { label: 'Guide immobilier →', href: '/guide-immo', couleur: '#059669', bg: '#f0fdf4' },
    ],
  },
  {
    icon: '📶', couleur: '#7c3aed',
    titre: 'Choisir un forfait télécom',
    texte: 'Comparez tous les forfaits mobiles Orange, Free, Expresso et Wave : data, appels, SMS, prix. Le Guide forfait analyse votre usage et vous recommande les meilleures offres.',
    ctas: [{ label: 'Guide forfait →', href: '/guide-forfait', couleur: '#7c3aed', bg: '#faf5ff' }],
  },
  {
    icon: '⚖️', couleur: '#0891b2',
    titre: 'Comparer côte à côte',
    texte: "Cliquez ⚖ sur 2 à 3 produits ou annonces pour les ajouter à votre sélection. Un bandeau apparaît en bas. Cliquez \"Comparer\" pour voir un tableau détaillé avec les différences surlignées.",
    ctas: [],
  },
  {
    icon: '❤️', couleur: '#ef4444',
    titre: 'Sauvegarder dans les favoris',
    texte: 'Cliquez ❤ sur un produit ou une annonce pour le sauvegarder. Retrouvez tous vos favoris dans la page Favoris — sans inscription requise.',
    ctas: [{ label: 'Mes favoris →', href: '/favoris', couleur: '#ef4444', bg: '#fef2f2' }],
  },
  {
    icon: '🔔', couleur: '#f59e0b',
    titre: 'Alertes prix',
    texte: "Sur la fiche d'un produit, cliquez \"Créer une alerte prix\". Saisissez votre budget cible et votre email. Vous serez notifié automatiquement dès que le prix passe sous votre seuil.",
    ctas: [],
  },
  {
    icon: '📢', couleur: '#059669',
    titre: 'Publier une annonce',
    texte: "Vous louez ou vendez un bien ? Vous voulez vendre un article ? Cliquez \"+ Déposer\" dans la barre de navigation. Votre annonce sera visible après validation.",
    ctas: [{ label: 'Publier une annonce →', href: '/deposer-annonce', couleur: '#059669', bg: '#f0fdf4' }],
  },
  {
    icon: '💬', couleur: '#25D366',
    titre: 'Discuter avec l\'assistant WhatsApp',
    texte: "Recherchez un produit, consultez les annonces immo ou créez une alerte de prix directement depuis WhatsApp, sans installer d'application. Envoyez simplement \"menu\" au numéro Nopalou.",
    ctas: [
      { label: 'Découvrir l\'assistant →', href: '/assistant-whatsapp', couleur: '#25D366', bg: '#f0fdf4' },
      { label: 'Discuter sur WhatsApp →', href: 'https://wa.me/221708717942?text=menu', couleur: '#25D366', bg: '#f0fdf4' },
    ],
  },
  {
    icon: '💼', couleur: '#C75B00',
    titre: 'Devenir apporteur d\'affaires',
    texte: "Vous connaissez des commerçants, agences immo ou vendeurs ? Partagez votre lien personnel et touchez une commission chaque mois sur les abonnements des boutiques que vous recrutez — sans investissement, sans engagement.",
    ctas: [{ label: 'Devenir apporteur →', href: '/compte/apporteur', couleur: '#C75B00', bg: '#fff7ed' }],
  },
]

export default function GuideEmploiPage() {
  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 820 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Link href="/" className="guide-back-btn" style={{ color: '#475569', borderColor: '#e2e8f0', background: '#fff' }}>
          ← Accueil
        </Link>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>📖 Comment utiliser Nopalou</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Tout ce que vous pouvez faire, en quelques étapes.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {STEPS.map((step, i) => (
          <div key={i} className="guide-emploi-step">
            <div className="guide-emploi-icon" style={{ background: step.couleur + '18' }}>
              {step.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="guide-emploi-titre">{step.titre}</div>
              <div className="guide-emploi-texte" dangerouslySetInnerHTML={{ __html: step.texte }} />
              {step.ctas.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
                  {step.ctas.map(cta => {
                    const externe = cta.href.startsWith('http')
                    return (
                      <Link
                        key={cta.href}
                        href={cta.href}
                        target={externe ? '_blank' : undefined}
                        rel={externe ? 'noopener noreferrer' : undefined}
                        className="guide-emploi-cta"
                        style={{ background: cta.bg, color: cta.couleur, borderColor: cta.couleur }}
                      >
                        {cta.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="guide-emploi-footer">
        <div className="guide-emploi-footer-titre">✅ Nopalou est 100% gratuit et indépendant</div>
        <div className="guide-emploi-footer-texte">Aucune commission sur les ventes. Les prix sont mis à jour depuis les sites marchands. Nopalou ne vend rien — il compare pour vous.</div>
      </div>
    </div>
  )
}
