# LEÇONS APPRISES — Capitalisation Nopalou vers Surga

> Objectif : ne pas refaire sur Surga les erreurs déjà payées sur Nopalou, et anticiper celles
> propres à un assistant personnel. Format : **Problème, cause racine, règle instaurée,
> référence**. Les sections 1 à 7 sont déduites des directives déjà transmises et restent à
> confirmer avec l'historique réel du dépôt. La section 8 liste des risques anticipés, pas des
> incidents passés.

---

## 1. Sécurité et multi-tenant
**Problème probable** : des comptes professionnels ont pu accéder à des données d'autres comptes
(IDOR) sur des API générées sans contrôle de propriété.
**Cause** : l'agent vérifiait que l'utilisateur est connecté, pas qu'il a le droit sur cette
ressource précise.
**Règle** : contrôle d'appartenance obligatoire sur toute ressource utilisateur ou pro (notes,
dépenses, annonces, fiches). **Référence** : `CLAUDE_SURGA.md`, section 9.

## 2. Performance et poids
**Problème probable** : pages trop lourdes sur les réseaux 3G/4G réels (bibliothèques lourdes,
images non compressées, JS non purgé).
**Cause** : un agent génère du code qui fonctionne, pas du code optimisé pour une contrainte
réseau, sauf si elle est écrite avant qu'il commence.
**Règle** : budgets de poids explicites, AVIF, lazy loading, purge Tailwind. **Référence** :
`CLAUDE_SURGA.md`, section 5.

## 3. Qualité perçue de l'interface
**Problème probable** : émojis comme icônes, couleurs choisies au cas par cas, texte tronqué,
grilles laissant du vide, symptômes d'un code généré sans direction visuelle.
**Cause** : sans design system contraignant, chaque génération réinvente ses choix.
**Règle** : zéro émoji, tokens de couleur, cartes en 2 sous-lignes, composants < 450 lignes.
**Référence** : `CLAUDE_SURGA.md`, sections 6 et 7 ; `docs/surga/DESIGN.md`.

## 4. Discipline Git et déploiement
**Problème probable** : un `git push` a pu partir sans validation humaine.
**Cause** : un agent autonome confond "tâche terminée" et "prêt à déployer".
**Règle** : aucun push sans ordre explicite, branche dédiée, journal de livraison.
**Référence** : `CLAUDE_SURGA.md`, section 4.

## 5. Localisation financière
**Problème probable** : confusion ou conversion involontaire entre FCFA et une autre devise.
**Cause** : les exemples de code génériques raisonnent en dollar ou en euro.
**Règle** : FCFA (XOF) exclusivement, partout. **Référence** : `CLAUDE_SURGA.md`, section 8.

## 6. Modularité
**Problème probable** : composants devenus trop gros au fil des itérations.
**Cause** : un agent ajoute du code à un fichier existant plutôt que d'extraire un composant.
**Règle** : plafond de 450 lignes, extraction obligatoire. **Référence** : `CLAUDE.md`,
section 6.

## 7. Intégration non maîtrisée dans l'existant
**Problème anticipé** : un agent peut réécrire ou dupliquer des briques déjà en place (auth,
paiement, modèle de données) faute d'avoir audité l'existant.
**Règle** : audit obligatoire avant tout code, questions de clarification systématiques.
**Référence** : `docs/surga/INTEGRATION_NOPALOU.md`.

## 8. Risques anticipés propres à un assistant personnel
**Politique WhatsApp.** Meta interdit sur l'API Business les assistants généralistes comme
fonction principale. *Règle* : conversation libre uniquement dans l'app, WhatsApp limité aux
tâches précises, confirmation du cadre avec Meta ou le fournisseur. (`CLAUDE_SURGA.md`, section 1.)

**Calculs faux par le modèle.** Un modèle de langage peut se tromper sur une division ou un
total. *Règle* : moteur de calcul déterministe, le modèle ne fait que comprendre la demande.
(`CLAUDE_SURGA.md`, section 2.)

**Chiffres mal transcrits.** La reconnaissance vocale confond facilement des montants,
surtout dans le bruit. *Règle* : confirmation avant toute écriture. (`CLAUDE_SURGA.md`, section 2.)

**Données personnelles sensibles.** Dépenses, notes et agenda révèlent la vie privée.
*Règle* : consentement, export, suppression, pas de contenu en clair dans les logs.
(`CLAUDE_SURGA.md`, section 3.)

**Droits sur le contenu de presse.** Reproduire ou résumer à grande échelle des articles peut
poser problème. *Règle* : flux RSS, résumés courts, liens vers les sources. (`CLAUDE.md`,
section 2.)

**Coût des appels IA et vocaux.** Chaque commande a un coût qui peut dépasser la valeur d'un
utilisateur gratuit. *Règle* : quotas, mesure, premium. (`CLAUDE_SURGA.md`, section 2.)

**Trop de fonctions d'un coup.** Une app qui fait tout sans devenir indispensable pour personne.
*Règle* : noyau solide d'abord, briques selon l'usage observé. (`docs/surga/PLAN.md`.)

---

## 9. Enseignements Démontrés de la Campagne de Finalisation Technique (P0-P2)

1. **Anti-IDOR & Validation Systématique de Session (`CORR-P0-01`)** :
   - *Constat* : Utiliser `tokenOptional` pour une route de consultation/suppression de données personnelles ouvre une brèche IDOR critique dès qu'un paramètre non vérifié (`?phone=`) est accepté.
   - *Règle* : Toute route de données personnelles ou de droit à l'oubli doit impérativement utiliser `verifierToken` et extraire `req.user.userId`. Les paramètres d'URL non authentifiés sont rigoureusement proscrits.

2. **Vérification Cryptographique & Zéro Confiance Client pour la Facturation (`CORR-P0-02`)** :
   - *Constat* : Confier la validation d'un abonnement payant à un identifiant transmis par le client sans contre-vérification synchrone ou signature HMAC de webhook permet des activations gratuites illimitées.
   - *Règle* : Aucun droit Premium ne doit être délivré sans appel direct à l'API de checkout (Wave session `complete`) ou validation cryptographique de l'empreinte HMAC.

3. **Homogénéité des Types d'Identifiants (UUID v4 vs Préfixes Locaux) (`CORR-P0-03`)** :
   - *Constat* : En mode offline, générer des identifiants temporaires arbitraires (`srg_...`) provoque un crash PostgreSQL 22P02 irréversible lors de la synchronisation si la colonne est typée `UUID`.
   - *Règle* : Utiliser un polyfill standard RFC4122 v4 dès la création locale dans IndexedDB, et doter le backend d'un résolveur de mapping (`assurerUUID` / `id_mappings`) pour réconcilier sans faille.

4. **Auto-Provisioning des Flux WhatsApp & Zéro Succès Trompeur (`CORR-P0-04`)** :
   - *Constat* : Une commande WhatsApp envoyant un accusé de réception positif alors que l'utilisateur n'est pas encore inscrit en base détruit la confiance utilisateur par perte silencieuse des données.
   - *Règle* : Les flux conversationnels tiers doivent auto-provisionner le compte utilisateur à la première commande valide, et le message de succès ne doit être émis qu'après commit effectif de la transaction SQL.

5. **Budgets de Poids & Lazy Loading des Modales (`CORR-P2-02`)** :
   - *Constat* : Importer 12 modales secondaires de façon synchrone gonfle le bundle initial à plus de 145 Ko et dégrade le First Contentful Paint sur réseau mobile sénégalais.
   - *Règle* : Utiliser `next/dynamic` (`ssr: false`) pour toute modale non immédiatement visible au premier affichage afin de maintenir le bundle initial sous 120 Ko.

6. **Isolation Subdomain & Portée Service Worker (`CORR-P2-03`)** :
   - *Constat* : Un Service Worker hébergé sous `/surga/sw.js` ne peut pas intercepter la racine `/` d'un sous-domaine dédié (`surga.nopalou.com`) sans l'en-tête HTTP explicite `Service-Worker-Allowed: /`.
   - *Règle* : Configurer l'en-tête serveur `Service-Worker-Allowed: /` et conditionner dynamiquement le scope d'enregistrement selon l'hôte (`/` sur sous-domaine, `/surga/` sur domaine racine).

---

## 10. Règle d'usage pour l'agent
Avant d'implémenter une fonction touchant à l'un de ces thèmes, relire la section concernée de ce document en plus de `CLAUDE.md`.
