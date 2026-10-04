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

## 9. À compléter avec l'historique réel de Nopalou
- [ ] Incidents liés au paiement Mobile Money (double facturation, paiement non confirmé,
  webhook manqué) ?
- [ ] Abus constatés sur les limites gratuites (contournement, faux comptes) ?
- [ ] Problèmes de fiabilité de l'API WhatsApp Business (suspension, quota, vérification) ?
- [ ] Retours utilisateurs récurrents (lenteur, confusion, perte de confiance) non encore
  traduits en règle ?

Pour les combler : relire l'historique des corrections du dépôt
(`git log --oneline --grep="fix\|bug\|correctif"`) ou lister de mémoire les 5 à 10 problèmes qui
ont coûté le plus de temps. Chacun devient une entrée de plus.

## 10. Règle d'usage pour l'agent
Avant d'implémenter une fonction touchant à l'un de ces thèmes, relire la section concernée de
ce document en plus de `CLAUDE.md`.
