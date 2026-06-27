import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Nopalou',
  description: 'Politique de confidentialité et protection des données personnelles de Nopalou.',
}

export default function ConfidentialitePage() {
  return (
    <div className="legal-page">
      <h1 className="legal-titre">Politique de confidentialité</h1>
      <p className="legal-update">Dernière mise à jour : Juin 2026</p>

      <section className="legal-section">
        <h2>Données collectées</h2>
        <p>Nopalou collecte les données suivantes :</p>
        <ul>
          <li><strong>Compte utilisateur</strong> : nom, adresse email, mot de passe haché (bcrypt).</li>
          <li><strong>Annonces</strong> : titre, description, prix, photos, numéro de téléphone de contact.</li>
          <li><strong>Paiements</strong> : référence de transaction (aucune donnée bancaire stockée — traitée par Wave/Orange Money).</li>
          <li><strong>Navigation</strong> : favoris et comparaisons stockés localement dans votre navigateur (localStorage).</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Utilisation des données</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Gérer votre compte et sécuriser votre accès.</li>
          <li>Publier et afficher vos annonces.</li>
          <li>Envoyer des alertes de prix par email (si vous en faites la demande).</li>
          <li>Vous contacter en cas de problème sur votre compte ou annonce.</li>
        </ul>
        <p>Nopalou ne vend ni ne loue vos données personnelles à des tiers.</p>
      </section>

      <section className="legal-section">
        <h2>Conservation des données</h2>
        <p>Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression de votre compte en contactant <a href="mailto:contact@nopalou.com">contact@nopalou.com</a>.</p>
      </section>

      <section className="legal-section">
        <h2>Cookies et stockage local</h2>
        <p>Nopalou utilise :</p>
        <ul>
          <li><strong>Cookie de session</strong> (<code>nopalou_session</code>) : sécurisé, httpOnly, nécessaire à l&apos;authentification.</li>
          <li><strong>localStorage</strong> : stockage local de vos favoris et sélection de comparaison (aucune donnée envoyée à nos serveurs).</li>
        </ul>
        <p>Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
      </section>

      <section className="legal-section">
        <h2>Vos droits</h2>
        <p>Conformément à la loi sénégalaise sur la protection des données personnelles (loi n°2008-12), vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@nopalou.com">contact@nopalou.com</a>.</p>
      </section>

      <section className="legal-section">
        <h2>Sécurité</h2>
        <p>Nopalou met en œuvre des mesures techniques adaptées pour protéger vos données : HTTPS, mots de passe hachés, jetons JWT à durée limitée, en-têtes de sécurité HTTP.</p>
      </section>
    </div>
  )
}
