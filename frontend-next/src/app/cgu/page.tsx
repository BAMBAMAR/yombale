import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Nopalou",
  description: "Conditions générales d'utilisation du comparateur de prix Nopalou.",
}

export default function CguPage() {
  return (
    <div className="legal-page">
      <h1 className="legal-titre">Conditions Générales d&apos;Utilisation</h1>
      <p className="legal-update">Dernière mise à jour : Juin 2026</p>

      <section className="legal-section">
        <h2>1. Objet</h2>
        <p>Les présentes CGU régissent l&apos;utilisation du site Nopalou, comparateur de prix en ligne opérant au Sénégal, accessible à l&apos;adresse <strong>nopalou.sn</strong>.</p>
      </section>

      <section className="legal-section">
        <h2>2. Accès au service</h2>
        <p>L&apos;accès aux fonctionnalités de base (consultation des prix, comparaison, favoris) est gratuit et ne nécessite pas de compte. Certaines fonctionnalités (dépôt d&apos;annonces, alertes prix) nécessitent la création d&apos;un compte.</p>
      </section>

      <section className="legal-section">
        <h2>3. Compte utilisateur</h2>
        <p>Lors de l&apos;inscription, vous vous engagez à fournir des informations exactes et à maintenir votre mot de passe confidentiel. Vous êtes responsable de toute activité effectuée depuis votre compte.</p>
      </section>

      <section className="legal-section">
        <h2>4. Dépôt d&apos;annonces</h2>
        <p>Les deux premières annonces sont publiées gratuitement. À partir de la troisième, un paiement de <strong>1 500 FCFA</strong> par annonce est requis.</p>
        <p>En déposant une annonce, vous vous engagez à :</p>
        <ul>
          <li>Décrire fidèlement le produit ou service proposé.</li>
          <li>Fournir un prix et un numéro de contact exacts.</li>
          <li>Ne pas publier de contenu illicite, trompeur ou frauduleux.</li>
          <li>Respecter les catégories autorisées.</li>
        </ul>
        <p>Nopalou se réserve le droit de modérer, modifier ou supprimer toute annonce ne respectant pas ces règles, sans remboursement.</p>
      </section>

      <section className="legal-section">
        <h2>5. Paiements</h2>
        <p>Les paiements sont traités par <strong>Wave</strong> et <strong>Orange Money</strong>. Nopalou ne stocke aucune donnée bancaire. Les transactions sont sécurisées par les prestataires de paiement.</p>
        <p>En cas de problème de paiement, contactez <a href="mailto:contact@nopalou.sn">contact@nopalou.sn</a> avec votre référence de transaction.</p>
      </section>

      <section className="legal-section">
        <h2>6. Comportements interdits</h2>
        <ul>
          <li>Tenter d&apos;accéder illicitement à des données ou systèmes.</li>
          <li>Publier des annonces frauduleuses ou des arnaques.</li>
          <li>Utiliser le service à des fins de spam ou de démarchage non sollicité.</li>
          <li>Contourner les systèmes de modération.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>7. Limitation de responsabilité</h2>
        <p>Nopalou est un intermédiaire et n&apos;est pas partie aux transactions entre acheteurs et vendeurs. Nopalou ne peut être tenu responsable des litiges entre utilisateurs, de la qualité des produits ou de l&apos;exactitude des prix affichés par les marchands partenaires.</p>
      </section>

      <section className="legal-section">
        <h2>8. Modification des CGU</h2>
        <p>Nopalou se réserve le droit de modifier ces CGU à tout moment. Les modifications entrent en vigueur à leur publication sur le site. L&apos;utilisation continue du service vaut acceptation des nouvelles CGU.</p>
      </section>

      <section className="legal-section">
        <h2>9. Contact</h2>
        <p>Pour toute question relative aux présentes CGU : <a href="mailto:contact@nopalou.sn">contact@nopalou.sn</a></p>
      </section>
    </div>
  )
}
