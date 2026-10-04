# Règles d'Audit Obligatoires et Standards Opérationnels

Ce document consacre les douze règles d'or impératives régissant l'exécution de l'audit Nopalou, ainsi que les contraintes d'environnement et de sécurité applicables à l'ensemble des agents intervenants.

---

## 1. Les Douze Règles d'Or de l'Audit

### RÈGLE 01 — PREUVE ABSOLUE
Aucune affirmation, conclusion ou qualification de résultat ne peut être énoncée sans preuve vérifiable, documentée et reproductible. Toute mention non étayée par un élément matériel est frappée de nullité.

### RÈGLE 02 — CONDITION DU « PASS »
Aucun statut `PASS` ne peut être attribué sans qu'un test n'ait été réellement et complètement exécuté par l'agent mandaté pour la phase de test. L'intuition, la simple lecture du code ou l'historique antérieur ne valent pas exécution.

### RÈGLE 03 — MOTIVATION DU « FAIL »
Tout statut `FAIL` doit être immédiatement associé à une observation précise (comportement attendu vs comportement observé), au jeu de données ayant déclenché l'échec et à une preuve enregistrée dans `/audit/03_PREUVES/`.

### RÈGLE 04 — QUALIFICATION DES CAUSES RACINES
Une cause ne peut être qualifiée de « certaine » que si elle est formellement démontrée par reproduction isolée ou analyse dynamique irréfutable. À défaut d'une démonstration sans faille, la cause doit obligatoirement porter la mention `HYPOTHÈSE`.

### RÈGLE 05 — CHANGEMENT DE CODE ≠ CORRECTION
Une modification apportée au code source ne constitue en aucun cas une preuve de résolution d'une anomalie. Seul un rejeu complet du cas de test prouvant la disparition du symptôme sans effet de bord confère la validité.

### RÈGLE 06 — DISSOCIATION HTTP 200 ≠ SUCCÈS MÉTIER
Un code de réponse HTTP `200 OK` ne prouve pas le succès d'une fonctionnalité métier. L'intégrité de la réponse applicative, la cohérence du payload JSON et la persistance de l'état métier attendu doivent être vérifiées.

### RÈGLE 07 — DISSOCIATION ÉCRITURE DB ≠ FONCTIONNALITÉ CORRECTE
Une simple insertion ou mise à jour en base de données ne valide pas la justesse d'une opération. Les contraintes relationnelles, les calculs dérivés, les déclencheurs (triggers), l'idempotence et les notifications associées doivent être vérifiés.

### RÈGLE 08 — QUALIFICATION HISTORIQUE DES ANOMALIES
Toute anomalie identifiée doit être systématiquement confrontée à l'historique des audits antérieurs et aux livraisons enregistrées pour recevoir l'un des statuts stricts suivants :
* `NEW` : Anomalie inédite jamais signalée.
* `ALREADY REPORTED / NOT FIXED` : Anomalie déjà identifiée lors d'un cycle précédent et non corrigée.
* `FIXED / INCOMPLETE` : Tentative de correction antérieure partielle ou imparfaite.
* `REGRESSION` : Fonctionnalité précédemment opérationnelle ou validée, rompue par un changement ultérieur.
* `FIXED / VALIDATED` : Problème ancien résolu avec succès et prouvé par retest.
* `FALSE POSITIVE / NOT REPRODUCIBLE` : Incident non reproductible dans des conditions maîtrisées ou artefact d'environnement.
* `NON VERIFIED` : Élément suspect dont la vérification n'a pu aboutir faute d'environnement adéquat.

### RÈGLE 09 — RETEST CONTRADICTOIRE OBLIGATOIRE
Aucune anomalie signalée ne peut être classée comme close ou corrigée sans avoir fait l'objet d'un retest rigoureux par un agent indépendant de celui ayant rédigé le correctif.

### RÈGLE 10 — COUVERTURE DE NON-RÉGRESSION OBLIGATOIRE
Toute modification apportée pour corriger une anomalie doit être immédiatement suivie du rejeu de la baseline de régression associée au périmètre d'impact, afin de certifier l'absence d'effets collatéraux.

### RÈGLE 11 — HANDOVER EXPLICITE & TRAÇABILITÉ
Chaque agent achevant sa mission doit consigner formellement son travail dans un document de handover dédié. Le handover transmet l'état exact des travaux, les blocages, les limitations et les consignes impératives pour l'agent suivant.

### RÈGLE 12 — INTÉGRITÉ DES DONNÉES HISTORIQUES
Aucun document d'audit, preuve archivée, rapport de test ou historique de session ne peut être supprimé ou écrasé silencieusement. Tout constat historique demeure consigné pour assurer une auditabilité continue.

---

## 2. Règles Spécifiques au Contexte Nopalou

### Isolation Stricte de l'Environnement de Test
- **Interdiction de Cibler la Production** : Il est formellement interdit d'exécuter des tests destructifs, des écritures ou des sondes d'injection sur les bases de données de production Render, ni d'émettre des requêtes réelles vers les API tierces de production (Wave, Orange Money, Cloudinary, Meta WhatsApp Cloud API, Brevo, Resend).
- **Environnement Isolé** : Les tests automatisés et sondes d'audit doivent impérativement s'exécuter sur l'environnement local dédié (`scripts/audit/audit-env.ps1`, base locale isolée, clés externes factices non vides et mock réseau).

### Déploiement et Git
- **Aucun Push Git sans Ordre Explicite** : L'assistant ne doit JAMAIS effectuer de `git push` de sa propre initiative. Seule une consigne explicite de l'utilisateur l'autorise.
- **Mise à Jour de Documentation** : Tout cycle d'audit ou de livraison validé entraîne la mise à jour correspondante des journaux de bord et de `CLAUDE.md`.
