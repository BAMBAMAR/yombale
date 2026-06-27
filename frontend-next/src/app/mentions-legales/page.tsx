import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Nopalou',
  description: 'Mentions légales du comparateur de prix Nopalou au Sénégal.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="legal-page">
      <h1 className="legal-titre">Mentions légales</h1>
      <p className="legal-update">Dernière mise à jour : Juin 2026</p>

      <section className="legal-section">
        <h2>Éditeur du site</h2>
        <p><strong>Nopalou</strong> est un comparateur de prix en ligne opérant au Sénégal.</p>
        <p>Email : <a href="mailto:contact@nopalou.com">contact@nopalou.com</a></p>
        <p>Siège social : Dakar, Sénégal</p>
      </section>

      <section className="legal-section">
        <h2>Hébergement</h2>
        <p>Le site est hébergé par <strong>Render</strong> (backend) et <strong>Vercel</strong> (frontend).</p>
      </section>

      <section className="legal-section">
        <h2>Propriété intellectuelle</h2>
        <p>L&apos;ensemble du contenu du site Nopalou (textes, images, logos, graphismes) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, est interdite sans autorisation préalable écrite de Nopalou.</p>
      </section>

      <section className="legal-section">
        <h2>Responsabilité</h2>
        <p>Nopalou s&apos;efforce de maintenir les informations de prix à jour, mais ne peut garantir leur exactitude à tout moment. Les prix affichés sont fournis à titre indicatif et peuvent varier chez les marchands partenaires.</p>
        <p>Nopalou ne saurait être tenu responsable des dommages résultant de l&apos;utilisation du site ou de l&apos;indisponibilité temporaire du service.</p>
      </section>

      <section className="legal-section">
        <h2>Données personnelles</h2>
        <p>Consultez notre <a href="/confidentialite">Politique de confidentialité</a> pour toutes les informations relatives au traitement de vos données personnelles.</p>
      </section>

      <section className="legal-section">
        <h2>Droit applicable</h2>
        <p>Les présentes mentions légales sont soumises au droit sénégalais. En cas de litige, les tribunaux de Dakar seront seuls compétents.</p>
      </section>
    </div>
  )
}
