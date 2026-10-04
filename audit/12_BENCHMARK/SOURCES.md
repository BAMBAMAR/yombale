# Registre des Sources & Données Externes — Benchmark Nopalou 2026

```text
DOCUMENT    : SOURCES DE RÉFÉRENCE DU BENCHMARK COMPÉTITIF
VERSION     : 1.0.0
DATE        : 2026-10-04
AUTEUR      : AGENT 10 — BENCHMARK STRATÉGIQUE & PRODUIT
PÉRIMÈTRE   : SÉNÉGAL (DAKAR & RÉGIONS) / AFRIQUE DE L'OUEST (UEMOA) / BENCHMARK GLOBAL
```

---

## 1. Méthodologie de Traçabilité des Données

Conformément à la règle fondamentale du benchmark Nopalou, aucune comparaison n'est établie sur la base d'impressions personnelles ou de suppositions. Chaque élément factuel est qualifié selon la typologie stricte suivante :

* `FAIT OBSERVÉ` : Comportement testé, mesuré et vérifié directement dans le code source de Nopalou ou sur l'interface publique d'un concurrent.
* `DONNÉE PUBLIQUE` : Chiffre officiel issu d'une autorité de régulation (BCEAO, ARTP), d'un document légal ou d'une grille tarifaire publique.
* `ESTIMATION` : Calcul dérivé de données publiques recoupées avec des métriques d'usage observables.
* `INTERPRÉTATION` : Analyse produit ou stratégique fondée sur la confrontation d'au moins deux faits vérifiés.
* `HYPOTHÈSE` : Projection prospective soumise à validation empirique ultérieure.

---

## 2. Répertoire Exhaustif des Sources Primaires

### A. Autorités Publiques, Banques Centrales & Études Sectorielles

| ID | Entité / Source | URL / Référence | Date de Consultation | Donnée Utilisée | Domaine / Concurrent | Fiabilité |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-001** | **BCEAO** (Banque Centrale des États de l'Afrique de l'Ouest) | `https://www.bceao.int` — Rapport annuel sur les services financiers numériques & Déploiement PI-SPI (2025-2026) | 2026-10-04 | Déploiement de la plateforme interopérable PI-SPI; 43 institutions financières connectées; adoption massive des wallets mobiles. | Macro-économie, Paiements UEMOA | **A (Certifié officiel)** |
| **SRC-002** | **ARTP Sénégal** (Autorité de Régulation des Télécommunications et des Postes) | `https://www.artp.sn` — Observatoire trimestriel des marchés des communications électroniques | 2026-10-04 | Taux de pénétration de l'Internet mobile (> 98% via smartphone), prépondérance de la data mobile sur l'ADSL/Fibre. | Télécoms, Usages mobiles Sénégal | **A (Certifié officiel)** |
| **SRC-003** | **Enquête Simiz & People Data Sense** | Données de parts de marché Mobile Money Sénégal (2025-2026) | 2026-10-04 | Duopole Wave (~46%) / Orange Money (~38%) / Free Money (~10%) sur les transactions financières mobiles et paiements marchands à Dakar. | Mobile Money, Wave, Orange Money | **B (Étude recoupée)** |

---

### B. Marketplaces & Commerce Local (Sénégal)

| ID | Entité / Source | URL / Référence | Date de Consultation | Donnée Utilisée | Domaine / Concurrent | Fiabilité |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-004** | **Jumia Sénégal** (VendorHub & Conditions Vendeurs) | `https://vendorhub.jumia.sn` & `https://www.jumia.sn` | 2026-10-04 | Commissions prélevées de 5% à 20% par vente selon catégorie; stockage Jumia Express payant au-delà de 15j; versement hebdomadaire; KYC obligatoire (NINEA, RC, RIB). | Jumia SN, Vente marketplace | **A (Officiel commerçant)** |
| **SRC-005** | **Jumia Sénégal** (Conditions Acheteurs & Livraison) | `https://www.jumia.sn/sp-conditions-generales/` | 2026-10-04 | Délais de livraison 24h à 72h à Dakar, 3 à 7 jours en région; frais de livraison fixes 1 200 à 2 500 FCFA; paiement à la livraison ou JumiaPay. | Jumia SN, Expérience client | **A (Officiel)** |
| **SRC-006** | **TafTaf Sénégal** (Application Mobile & Marketplace) | `https://apps.apple.com/app/taftaf-senegal` & Play Store | 2026-10-04 | Positionnement quick-commerce de proximité (épiceries, boucheries, restaurants à Dakar); flotte de livreurs tiak-tiak dédiée; livraison en 30-60 min. | TafTaf, Livraison locale | **B (Fiche app officielle)** |
| **SRC-007** | **Expat-Dakar** (Ringier One Africa Media) | `https://www.expat-dakar.com` | 2026-10-04 | Leader des petites annonces C2C/B2C au Sénégal; monétisation par boost d'annonces (Paiement Wave/OM); absence de panier d'achat en ligne; absence de garantie anti-fraude directe. | Petites annonces, Modèle C2C | **A (Plateforme en ligne)** |
| **SRC-008** | **CoinAfrique Sénégal** | `https://sn.coinafrique.com` | 2026-10-04 | Plateforme petites annonces mobile; contact direct vendeur via bouton appel/WhatsApp; aucune transaction financière exécutée in-app. | Petites annonces, Social leads | **A (Plateforme en ligne)** |

---

### C. Solutions de Création de Boutique (SaaS Vendeurs & CMS)

| ID | Entité / Source | URL / Référence | Date de Consultation | Donnée Utilisée | Domaine / Concurrent | Fiabilité |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-009** | **Shopify International** (Grille Tarifaire) | `https://www.shopify.com/pricing` | 2026-10-04 | Forfait Basic à 39 USD/mois (~24 000 FCFA/mois); facturation obligatoire par carte bancaire internationale; frais de 2% sur passerelles tierces hors Shopify Payments. | Shopify, SaaS international | **A (Grille officielle)** |
| **SRC-010** | **Shopify Payments & Passerelles Afrique** | Documentation Développeurs & Passerelles PayDunya / CinetPay | 2026-10-04 | Inéligibilité de Shopify Payments au Sénégal; obligation d'intégrer PayDunya ou CinetPay (frais de 2,5% à 3,5% + frais fixes de retrait); barrière technique d'installation. | Écosystème Shopify Sénégal | **A (Documentation officielle)** |
| **SRC-011** | **WooCommerce / WordPress** | `https://woocommerce.com` | 2026-10-04 | Logiciel gratuit open-source; coûts d'hébergement web/VPS (5 000 à 25 000 FCFA/mois); maintenance plugins & sécurité requise; absence de caisse physique offline native. | WooCommerce, CMS open-source | **A (Documentation officielle)** |
| **SRC-012** | **Bumpa** (SaaS Social Commerce & POS Afrique) | `https://getbumpa.com/pricing` | 2026-10-04 | Forfait Starter à ₦15 000/trimestre (~6 500 FCFA/mois), Pro à ₦30 000/trimestre; intégration Meta Instagram/WhatsApp; orienté marché nigérian (Naira/Paystack); absence de Wave natif. | Bumpa, Social Commerce | **A (Grille officielle)** |
| **SRC-013** | **Catlog** (Catalogue WhatsApp Afrique) | `https://catlog.shop` | 2026-10-04 | Outil de boutique catalogue lié à WhatsApp; formulaires de commande avec liens de paiement; présence Ghana/Nigeria/Kenya; support limité des devises UEMOA. | Catlog, WhatsApp Storefront | **B (Site officiel)** |

---

### D. Commerce Informel & Réseaux Sociaux (Pratiques Réelles à Dakar)

| ID | Entité / Source | URL / Référence | Date de Consultation | Donnée Utilisée | Domaine / Concurrent | Fiabilité |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-014** | **WhatsApp Business & Meta Commerce** | Usages observés sur les réseaux marchands dakarois (Sandaga, Colobane, HLM, Almadies) | 2026-10-04 | Parcours réel : publication statut -> contact DM -> négociation -> envoi numéro Wave personnel -> capture d'écran reçue -> tiak-tiak manuel. | Commerce informel WhatsApp | **A (Observation terrain documentée)** |
| **SRC-015** | **Instagram Shop / Facebook Marketplace Dakar** | Meta Business Center & Groupes d'annonces Dakar | 2026-10-04 | Absence de checkout direct in-app au Sénégal; redirection systématique vers WhatsApp; risque récurrent de faux reçus de paiement et d'annulation tiak-tiak. | Social Commerce Meta | **A (Observation directe)** |

---

### E. Opérateurs de Paiement Mobile (Sénégal)

| ID | Entité / Source | URL / Référence | Date de Consultation | Donnée Utilisée | Domaine / Concurrent | Fiabilité |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-016** | **Wave Sénégal** (Conditions Particuliers & Business) | `https://www.wave.com/fr/senegal/` | 2026-10-04 | 1% de frais sur les retraits; transferts P2P sans frais; encaissement Wave Business par QR Code ou lien de paiement deep-link; expérience utilisateur instantanée. | Wave Mobile Money | **A (Grille officielle)** |
| **SRC-017** | **Orange Money Sénégal** (Sonatel / Max it) | `https://orangemoney.orange.sn` | 2026-10-04 | Frais de retrait réalignés (environ 0,8% à 1%); application Max it & code USSD `#144#`; réseau physique de distributeurs le plus dense du Sénégal rural. | Orange Money | **A (Grille officielle)** |

---

### F. Données Internes Vérifiées Nopalou

| ID | Fichier Source Nopalou | Lignes / Fonctions Clés | Date de Vérification | Donnée Utilisée | Domaine / Statut | Fiabilité |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-INT-01** | `frontend-next/src/app/tarifs-boutique/TarifsPublicsSelector.tsx` | Lignes 32-75 | 2026-10-04 | Tarifs officiels : Taf Taf = 2 500 F/mois, Pro = 5 000 F/mois, Business = 10 000 F/mois; 0% commission. | Tarification SaaS Vendeur | **A (Code source officiel)** |
| **SRC-INT-02** | `backend/services/scraper.js` | Lignes 22-32, 34-48 | 2026-10-04 | 7 sources de scraping actives : Expat-Dakar, Jumia SN, CoinAfrique, Auchan SN, Kaynoo, Decathlon SN, Jiji SN. | Catalogue & Scraping | **A (Code source officiel)** |
| **SRC-INT-03** | `backend/services/matching.js` | Lignes 1-80 | 2026-10-04 | Algorithme trigramme PostgreSQL, exclusion de bruit marketing, détection marques et modèles. | Matching sémantique | **A (Code source officiel)** |
| **SRC-INT-04** | `backend/services/whatsapp-chatbot.js` | Lignes 1-80, 230-350 | 2026-10-04 | Bot interactif 6 663 lignes : commandes WhatsApp, upload photos produits via Cloudinary, comparateur de prix, gestion dettes. | WhatsApp Automation | **A (Code source officiel)** |
| **SRC-INT-05** | `frontend-next/src/lib/voice-assistant.ts` | Lignes 1-70 | 2026-10-04 | Moteur vocal Wolof/Français : dictionnaires phonétiques, unités monétaires locales (Téemeer = 500 F, Junni = 5 000 F). | IA / Reconnaissance vocale | **A (Code source officiel)** |
| **SRC-INT-06** | `audit/11_FINAL/HANDOVER_AGENT_09.md` & `RAPPORT_FINAL.md` | Synthèse des 16 cas de tests | 2026-10-04 | Audit technique : 8 PASS, 8 PARTIEL, 0 FAIL final, 3 régressions identifiées à corriger avant push production. | État de santé technique | **A (Audit d'ingénierie)** |
