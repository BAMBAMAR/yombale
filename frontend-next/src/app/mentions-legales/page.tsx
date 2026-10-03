import type { Metadata } from 'next'
import EmailLien from '@/components/EmailLien'

export const metadata: Metadata = {
  alternates: { canonical: '/mentions-legales' },
  title: 'Mentions légales',
  description: 'Mentions légales de la plateforme de commerce digital Nopalou au Sénégal.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="legal-page">
      <h1 className="legal-titre">Mentions légales</h1>
      <p className="legal-update">Dernière mise à jour : Septembre 2026</p>

      <section className="legal-section">
        <h2>Éditeur du site</h2>
        <p>Le site <strong>Nopalou</strong> (nopalou.com), plateforme de commerce digital (comparateur de prix, marketplace de boutiques et solutions de caisse POS opérant au Sénégal), est édité par <strong>SKYROAD SARL</strong>.</p>
        <p>N.I.N.E.A. : 011847714</p>
        <p>Siège social : Cité Khandar Ouest, T Foirelot 10 N°106, Yoff, Dakar, Sénégal</p>
        <p>Service client &amp; WhatsApp : <a href="tel:+221708717942">+221 70 871 79 42</a> (Lun-Sam 8h-20h)</p>
        <p>Siège administratif : <a href="tel:+221777202086">+221 77 720 20 86</a></p>
        <p>Email officiel : <EmailLien /></p>
      </section>

      <section className="legal-section">
        <h2>Hébergement</h2>
        <p>Le site est hébergé par des prestataires d&apos;infrastructure sécurisée :</p>
        <ul>
          <li><strong>Frontend &amp; CDN Edge :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</li>
          <li><strong>Backend API &amp; Base de données :</strong> Render Services, Inc., 525 Brannan St Suite 300, San Francisco, CA 94107, États-Unis.</li>
        </ul>
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
