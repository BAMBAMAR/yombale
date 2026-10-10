# État de Référence Initial du Pilote SEO (Baselines Figées)

```text
Document       : Mesures Initiales & État de Référence Avant Déploiement
Fichier        : audit/seo/ETAT_REFERENCE_PILOTE.md
Autorité       : Agent 9 (Ingénieur Préparation du Pilote & Cadre d'Exécution)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : 100% des Métriques Disponibles Mesurées & Données Inaccessibles Notées
```

---

## 1. Méthodologie de Mesure de l'État de Référence

Toute intervention sur le périmètre pilote doit pouvoir être quantifiée par rapport à un état de référence initial indiscutable.

Les mesures consignées ci-dessous ont été obtenues par trois protocoles indépendants :
1. **Sondes HTTP Directes en Production** : Requêtes automatisées exécutées par curl avec User-Agent simulant Googlebot Smartphone et navigateur desktop.
2. **Inspection Statique du Code Source & Configuration** : Examen des métadonnées Next.js, des données structurées et des événements GA4.
3. **Requêtes Statistiques PostgreSQL Certifiées** : Données issues de la base de production `nopalou_db` validées lors de la contre-expertise (Agent 7).

---

## 2. Relevé Détaillé des Pages du Périmètre Pilote

| URL Publique Testée | Statut HTTP Initial | Balise Canonical Observée | Meta Robots Observée | Balise <h1> Initiale | Schema.org Présents | TTFB Initial (ms) | Taille HTML (octets) | Diagnostic & Anomalie |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `https://nopalou.com/creer-boutique-en-ligne` | **200 OK** | `https://nopalou.com/creer-boutique-en-ligne` | `index, follow` | « Créez votre boutique en ligne au Sénégal en 30 secondes » | `WebSite`, `Organization`, `SoftwareApplication`, `FAQPage` | **207 ms** | 151 659 octets | **Page cible saine**. Conforme pour l'indexation. |
| `https://nopalou.com/creer-boutique` | **200 OK** | `https://nopalou.com/creer-boutique` *(Auto-référent)* | `index, follow` *(Indexable)* | « Quel est le nom de votre boutique ou marque ? » | `WebSite`, `Organization`, `Service`, `BreadcrumbList` | **974 ms** | 118 122 octets | **ANOMALIE P0 (`CORR-03`)** : Conflit de cannibalisation direct avec `/creer-boutique-en-ligne`. |
| `https://nopalou.com/logiciel-caisse-senegal` | **200 OK** | `https://nopalou.com/logiciel-caisse-senegal` | `index, follow` | « La caisse enregistreuse tactile pour les commerces du Sénégal » | `WebSite`, `Organization`, `SoftwareApplication`, `FAQPage` | **310 ms** | 144 463 octets | **Page SaaS saine**. À relier au tunnel d'onboarding. |
| `https://nopalou.com/produit/00000000-0000-0000-0000-000000000000-inexistant` | **200 OK** *(Anomalie)* | *(Aucune)* | `noindex` | *(AUCUN H1)* (Titre: « Page introuvable ») | `WebSite`, `Organization` | **663 ms** | 110 042 octets | **ANOMALIE P0 (`CORR-01`)** : Soft-404 critique. Renvoie 200 OK au lieu de 404 strict. |
| `https://nopalou.com/sitemap.xml` | **200 OK** | *(Sans objet)* | *(Sans objet)* | *(Sans objet)* | *(Sans objet)* | **110 ms** | 5 169 935 octets | **ANOMALIES (`CORR-08`)** : Contient `/surga` (redirigé 307) et `/creer-boutique` (en doublon). |
| `https://nopalou.com/categorie/tv-electro/climatiseurs` | **200 OK** | `https://nopalou.com/categorie/tv-electro/climatiseurs` | `index, follow` | « Climatiseur prix Dakar — comparez tous les modèles au Sénégal » | `WebSite`, `Organization`, `BreadcrumbList`, `ItemList` | **280 ms** | 210 400 octets | **Hub sain**. Contient 858 climatiseurs dont 702 Astech. |
| `https://nopalou.com/categorie/tv-electro/climatiseurs/astech` | **404 Not Found** *(Route inexistante)* | *(Aucune)* | *(Non configurée)* | *(Aucune)* | *(Aucune)* | *(N/A)* | *(N/A)* | **Opportunité Tranche 2**. Route sous-silo marque non encore créée. |

---

## 3. Positionnement SERP Google Sénégal Initial (Relevés Empiriques)

| Mot-Clé Cible | Volume Estimé / Mois | Position SERP Observée (`gl=sn`) | URL Nopalou Positionnée | Concurrents en Tête | Source de la Preuve |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **« créer boutique en ligne sénégal »** | 250 - 500 | **Position 23 à 30** (Page 3) | Flottement entre `/creer-boutique` et `/creer-boutique-en-ligne` | Shopify, Wix, WooCommerce, Expat-Dakar | Relevé SERP mobile Google SN (Agent 2/7) |
| **« logiciel de caisse sénégal »** | 150 - 300 | **Position 18 à 25** (Page 2-3) | `https://nopalou.com/logiciel-caisse-senegal` | Hiboutik, Loyverse, Caisse.sn | Relevé SERP mobile Google SN (Agent 2/7) |
| **« prix climatiseur astech dakar »** | 350 - 700 | **Hors Top 50** | Aucune page dédiée (perdue dans le hub global) | Jumia Sénégal, Electromenager-Dakar, Astech.sn | Relevé SERP mobile Google SN (Agent 2/7) |

---

## 4. Métriques Analytiques & Télémétrie Initiale (GA4)

| Flux ou Événement GA4 | État Actuel Observé | Identifiant ou Fichier Source | Conséquence Analytique |
| :--- | :---: | :--- | :--- |
| **Identifiant de Mesure Actif** | `G-3KGE1YBMVJ` | `frontend-next/src/app/layout.tsx` | Flux de production officiel confirmé. |
| **Tracking Clic WhatsApp Marchand (`click_whatsapp_order`)** | **0 événement** (Non câblé) | `ProduitOffresList.tsx`, `ProduitHeroCard.tsx` | **Lacune P0 (`MES-ANO-01`)** : 100% des intentions d'achat WhatsApp sortantes sont invisibles dans GA4. |
| **Événement `purchase` GA4** | **Biaisé par COD** | `frontend-next/src/components/cart/useCommander.ts` | **Biais P0 (`MES-ANO-02`)** : Déclenché à la soumission du formulaire, sans certitude de livraison/encaissement effectif. |
| **Attribution SQL des Abonnements** | **Rupture Totale** (0% d'attribution) | Table SQL `abonnements` (Render PostgreSQL) | **Lacune P0 (`MES-ANO-03`)** : Impossible de savoir quel canal ou quelle page a généré un abonnement payant. |

---

## 5. Données Commerciales Réelles Certifiées

| Indicateur Économique | Valeur de Référence Certifiée | Source des Données | Règle d'Or Associée |
| :--- | :---: | :--- | :--- |
| **Comptes Boutiques sous statut `actif`** | **108 comptes** | Table SQL `abonnements` | Périmètre commercial global. |
| **Commerçants en Période d'Essai (`is_trial = true`)** | **101 marchands** (74 Découverte, 14 Pro, 13 Business) | Table SQL `abonnements` | Gisement d'activation immédiat du pilote. |
| **Abonnements Payants Réels (`is_trial = false`)** | **7 marchands Business payants** | Table SQL `abonnements` | **Seule référence de clients payants réels**. |
| **MRR Marchand Net de Référence** | **80 000 FCFA / mois** | Table SQL `abonnements` | Seuil initial certifié (zéro extrapolation). |
| **Taux de Conversion Historique Essai -> Payant** | **0 % mesuré** | Table SQL `abonnements` | Aucune séquence automatique de relance n'était active. |

---

## 6. Données Indisponibles & Limites d'Accès Consignées

Conformément à la directive d'intégrité, les données suivantes sont déclarées **inaccessibles** au moment de l'établissement de ce rapport :
1. **API Google Search Console (GSC)** :
   - Aucun jeton de compte de service (`service-account.json`) ni accès OAuth n'est configuré en local.
   - Les données exactes d'impressions quotidiennes, de clics GSC et de requêtes réelles dans la console ne peuvent être lues par script automatisé local.
   - *Alternative appliquée* : Sondes HTTP directes curl et relevés SERP manuels géolocalisés au Sénégal.
2. **Logs d'Exploration Googlebot Serveur (Access Logs)** :
   - L'accès brut aux logs Nginx/Cloudflare/Render en temps réel n'est pas branché sur la machine locale.
   - *Conséquence* : Le délai exact de passage de Googlebot après mise en production sera vérifié via les sondes d'en-têtes et le retour de l'indexation.
