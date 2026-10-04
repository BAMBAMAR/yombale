# PRD — Surga, l'assistant de poche de Nopalou

> Format aligné sur le skill `/cadre` (Claude Mastery) : 8 sections.

---

## 1. Problème & Contexte
Au quotidien, une personne jongle entre de nombreuses applications et sources éparpillées :
calculatrice, bloc-notes, suivi de dépenses, agenda, trafic, pages d'actualité sur Facebook,
groupes WhatsApp pour le sport, publications TikTok. Cette information est dispersée, bruyante,
souvent peu fiable (fausses informations, contenus sponsorisés) et coûteuse en donnée mobile.

Les assistants généralistes (Google, Apple, applications d'IA) couvrent déjà les outils simples,
mais ils ne sont pas pensés pour Dakar : presse sénégalaise, trafic local, wolof, Mobile Money,
contraintes de donnée mobile, usage via WhatsApp.

Nopalou.com existe déjà (comparateur, transactions WhatsApp, espaces PRO, pôle immobilier,
paiement séquestre). Surga s'appuie sur cette base, la marque et la confiance déjà acquises.

## 2. Objectifs & Non-Objectifs

**Objectif principal** : devenir une application indispensable au quotidien, qui couvre
l'essentiel de ce qu'une personne cherche "à gauche et à droite". Mesure de succès : jours
d'utilisation par semaine et rétention.

**Objectifs du lancement :**
1. Une personne installe Surga, choisit ses briques et reçoit un briefing quotidien utile.
2. Elle gère notes, dépenses, agenda et rappels, et fait ses calculs, au clavier ou à la voix.
3. Elle partage facilement un contenu (score, brève, programme) avec ses contacts.
4. L'app reste utilisable avec peu de donnée mobile et partiellement hors ligne.
5. Des briques supplémentaires (revue de presse, trafic, immobilier, concours, bons plans) sont
   activables ensuite, selon l'usage réel.

**Non-objectifs (hors lancement) :**
- Application native (la PWA est le produit principal ; la native est une évolution possible).
- Assistant conversationnel généraliste sur WhatsApp (interdit par la politique Meta côté API
  Business).
- Audio comme mode principal (option activable seulement).
- Concurrencer les assistants généralistes sur leurs fonctions de base : la différenciation est
  locale, proactive et fiable.
- Toute modification du comparateur d'achats ou de la Caisse PRO.

## 3. Utilisateurs & Personas
**Cible principale** : personnes actives sur les réseaux sociaux (WhatsApp, Facebook, TikTok),
surtout sur Android, donnée mobile comptée.

| Persona | Profil | Ce qui le rend dépendant de Surga |
|---|---|---|
| Awa, 24 ans | Étudiante, active sur TikTok et WhatsApp | Briefing du matin, rappels de cours et de concours, notes vocales |
| Cheikh, 29 ans | Jeune actif à Dakar, se déplace beaucoup | Trafic, agenda, suivi de ses dépenses, sport du week-end |
| Mariama, 35 ans | Commerçante, utilise surtout WhatsApp | Notes de dépenses à la voix, calculs rapides, rappels |
| Moussa, 22 ans | Candidat aux concours | Rappels J-30 / J-7 / J-1, briefing ciblé |

**Cibles secondaires (B2B, ensuite)** : agences immobilières, centres de formation,
restaurateurs.

## 4. Exigences / User Stories
- **US1** Je m'inscris par OTP SMS, j'installe l'app et je choisis mes briques en moins de 2 minutes.
- **US2** Je reçois chaque matin à l'heure choisie un briefing court (agenda, brèves, sport).
- **US3** Je prends des notes, au clavier ou à la voix.
- **US4** Je dis "note 2 500 de taxi" : Surga me demande confirmation, puis enregistre une
  dépense structurée (montant, catégorie, date).
- **US5** Je vois mon récapitulatif de dépenses du mois.
- **US6** Je dis "100 divisé par 3" et j'obtiens un résultat exact.
- **US7** Je crée un rendez-vous ou un rappel ("rappelle-moi demain à 8h") et je suis notifié.
- **US8** Je partage une brève, un score ou le programme du week-end en un geste.
- **US9** J'active la revue de presse : résumés courts de sources identifiées, avec liens.
- **US10** Je consulte la situation du trafic sur mes trajets habituels (sous réserve de source
  de données validée).
- **US11** J'active l'option audio : j'écoute mon briefing dans l'app ou dans mon appli de
  podcast, ou je le télécharge en Wi-Fi.
- **US12** Je retrouve mes notes, dépenses, calculatrice et dernier briefing sans connexion.
- **US13** J'exporte ou je supprime toutes mes données.
- **US14** (briques) Je cherche un logement et je crée une alerte ; je suis un concours avec
  rappels ; je trouve un bon plan près de moi.
- **US15** (B2B) Une agence, un centre ou un restaurateur publie une offre et paie un abonnement.

## 5. Métriques de Succès
| Indicateur | Pourquoi |
|---|---|
| Jours d'utilisation par semaine par utilisateur actif | Mesure de l'indispensabilité |
| Rétention à 7 jours et 30 jours | Habitude installée |
| Nombre moyen de briques activées par utilisateur | Profondeur d'usage |
| Notes, dépenses, rappels créés par semaine | Coût de départ (données accumulées) |
| Taux d'ouverture du briefing du matin | Qualité du déclencheur quotidien |
| Partages par utilisateur | Croissance organique |
| Taux de commandes vocales confirmées sans correction | Fiabilité de la transcription |
| Poids de l'app et des pages publiques | Respect de la contrainte Low-Data |

Les cibles chiffrées seront fixées après les premiers tests avec un petit groupe d'utilisateurs.

## 6. Portée & Contraintes
- **Canaux** : app PWA principale ; WhatsApp pour tâches précises (briefing, alertes, rappels,
  commandes structurées, notes vocales) ; flux podcast privé en option.
- **Low-Data** : pages publiques < 50 Ko ; app connectée avec budget propre fixé à la
  Tranche 1 ; mode hors ligne minimal.
- **Fiabilité** : calculs par moteur déterministe ; confirmation avant toute écriture vocale ;
  contenu d'actualité sourcé.
- **Données personnelles** : consentement, protection, export, suppression.
- **Langue** : français d'abord ; wolof testé ensuite.
- **Devise** : FCFA uniquement.
- **Intégration** : dans le dépôt Nopalou existant (`docs/surga/INTEGRATION_NOPALOU.md`).

## 7. Risques & Hypothèses
- **Politique WhatsApp (Meta)** : interdiction des assistants généralistes sur l'API Business.
  *Mitigation* : flux WhatsApp à tâches précises, discussion libre uniquement dans l'app ;
  confirmation auprès de Meta ou du fournisseur d'accès.
- **Différenciation** : les outils de base sont gratuits ailleurs. *Mitigation* : briefing
  local et proactif, fiabilité, partage, personnalisation.
- **Trafic à Dakar** : pas de source de données évidente. *Mitigation* : spike de validation
  avant toute promesse produit.
- **Droits de la revue de presse**. *Mitigation* : flux RSS, résumés courts, liens vers les
  sources, accords éventuels.
- **Transcription vocale** (bruit, chiffres, wolof). *Mitigation* : confirmation systématique,
  français d'abord.
- **PWA sur iPhone** (notifications, audio en arrière-plan). *Mitigation* : tests tôt,
  application native envisagée si la part d'iPhone le justifie.
- **Trop de fonctions d'un coup**. *Mitigation* : noyau solide d'abord, briques ensuite selon
  l'usage observé.
- **Coût des appels IA et de transcription**. *Mitigation* : quotas, modèle premium.
- **Hypothèse** : une personne qui consigne ses dépenses, notes et rendez-vous dans Surga
  devient attachée à l'app.

## 8. Calendrier & Dépendances
- **Estimation indicative** (à recalibrer après l'audit) : noyau en environ 3 mois, puis briques
  par tranches de 3 à 4 semaines, par ordre de priorité observé.
- **Dépendances** : compte développeur Meta WhatsApp Business, fournisseur SMS, fournisseur de
  transcription vocale, modèle d'IA, sources RSS et API sportive, Google Places API (bons
  plans), passerelle Mobile Money, accès existants du dépôt Nopalou.
- **Documents associés** : `CLAUDE.md`, `docs/surga/INTEGRATION_NOPALOU.md`, `docs/surga/CAHIER_DES_CHARGES.md`,
  `docs/surga/PLAN.md`, `docs/surga/DESIGN.md`, `docs/surga/LECONS_APPRISES.md`, `docs/surga/JOURNAL-LIVRAISONS.md`.
