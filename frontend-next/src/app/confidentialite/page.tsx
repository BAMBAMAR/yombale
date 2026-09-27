import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
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
        <h2>Cookies et traceurs</h2>
        <p>Nopalou utilise exclusivement les traceurs nécessaires au fonctionnement de la plateforme et à la mesure d&apos;audience anonyme :</p>
        <ul>
          <li><strong>Cookie de session</strong> (<code>nopalou_session</code>) : sécurisé, httpOnly, strictement nécessaire à l&apos;authentification de votre compte.</li>
          <li><strong>Stockage local (localStorage)</strong> : conservation locale de vos favoris et de votre sélection de comparaison directement dans votre navigateur (aucune donnée n&apos;est transmise à nos serveurs).</li>
          <li><strong>Mesure d&apos;audience (Google Analytics 4)</strong> : recueil de statistiques globales et anonymisées de consultation afin d&apos;améliorer l&apos;ergonomie et les temps de réponse du site. Aucune donnée nominative n&apos;est transmise à des régies publicitaires tierces.</li>
        </ul>
      </section>

      <section className="legal-section" id="suppression-donnees">
        <h2>Vos droits (Droit à l&apos;effacement, Retrait &amp; Désinscription)</h2>
        <p>Conformément à la loi sénégalaise sur la protection des données personnelles (loi n°2008-12 / APDP) et aux règles du droit à l&apos;oubli :</p>
        <ul>
          <li><strong>Droit de retrait immédiat d&apos;annonce / numéro :</strong> Si votre numéro de téléphone ou votre annonce apparaît sur Nopalou, vous pouvez demander son retrait immédiat en envoyant le mot <strong>&quot;supprimer&quot;</strong> à notre <a href="/assistant-whatsapp">Assistant WhatsApp</a>. Vos annonces et coordonnées associées seront automatiquement désactivées et retirées.</li>
          <li><strong>Désinscription des communications (Opt-out) :</strong> Vous pouvez refuser toute réception de message WhatsApp de notre part en envoyant le mot <strong>&quot;STOP&quot;</strong> au chatbot WhatsApp. Votre numéro sera immédiatement placé en liste noire. (Envoi du mot <strong>&quot;START&quot;</strong> pour annuler la désinscription).</li>
          <li><strong>Demande d&apos;effacement par e-mail :</strong> Vous pouvez exercer vos droits d&apos;accès, de rectification et d&apos;effacement à tout moment en écrivant à <a href="mailto:contact@nopalou.com?subject=Exercice%20droits%20RGPD%20APDP">contact@nopalou.com</a> (traitement sous 24h).</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Sécurité</h2>
        <p>Nopalou met en œuvre des mesures techniques adaptées pour protéger vos données : HTTPS, mots de passe hachés, jetons JWT à durée limitée, en-têtes de sécurité HTTP.</p>
      </section>
    </div>
  )
}
