# Matrice des Rôles et Permissions du Système Nopalou

Ce document détaille l'ensemble des rôles applicatifs réels constatés dans la base de code backend (`backend/middlewares/admin-rbac.js`, `tenantSecurity.js`, `tenantSecurityImmo.js`, `auth.js`) et les frontières de sécurité strictes régissant leurs privilèges.

---

## 1. Définition des Rôles Réels Identifiés

### A. Utilisateurs Publics & Marchandise
1. **Visiteur Anonyme (`PUBLIC`)** :
   - Tout internaute non authentifié accédant à la plateforme.
2. **Client Acheteur Authentifié (`USER_CLIENT`)** :
   - Utilisateur disposant d'un compte sur `utilisateurs`, effectuant des achats et gérant son profil, ses favoris et ses alertes.
3. **Propriétaire de Boutique (`MERCHANT_OWNER`)** :
   - Commerçant ayant créé une boutique (`boutiques.utilisateur_id = user.id`), disposant des pleins droits sur son catalogue, ses finances et son équipe.
4. **Caissier / Collaborateur Boutique (`BOUTIQUE_STAFF`)** :
   - Membre rattaché à une boutique via `boutique_caissiers` ou `boutique_utilisateurs`, restreint aux opérations de caisse et de vente.

### B. Écosystème Immobilier
5. **Gestionnaire / Agent Immobilier (`AGENCE_AGENT`)** :
   - Collaborateur d'une agence immobilière (`agence_membres`), habilité à gérer les biens, mandats et baux de son agence.
6. **Bailleur / Propriétaire (`IMMO_OWNER`)** :
   - Propriétaire de biens répertorié dans `proprietaires_immo`, pouvant consulter l'état de son parc et ses reversements de loyers.
7. **Locataire (`IMMO_TENANT`)** :
   - Titulaire d'un bail locatif, pouvant consulter ses échéances et télécharger ses quittances de loyer.

### C. Équipe d'Administration Centrale Nopalou
8. **Modérateur (`ADMIN_MODERATEUR`)** :
   - Agent chargé du contrôle de conformité des produits, des annonces classifiées et des offres immobilières.
9. **Support Client (`ADMIN_SUPPORT`)** :
   - Agent d'assistance accédant aux dossiers clients, boutiques et conversations pour résolution de litiges.
10. **Responsable Finance (`ADMIN_FINANCE`)** :
    - Gestionnaire financier supervisant les flux de trésorerie, la validation des abonnements et les ordres de reversement marchands.
11. **Administrateur Opérationnel (`ADMIN_OPERATIONNEL`)** :
    - Responsable d'exploitation pilotant les utilisateurs, boutiques, POS, CRM et paramètres généraux.
12. **Super Administrateur (`SUPER_ADMIN`)** :
    - Dirigeant technique ou système disposant d'un accès sans restriction (`{ all: true }`) et capacité d'utilisation du secret maître break-glass.

---

## 2. Matrice Croisée des Permissions par Domaine

| Domaine & Action | PUBLIC | USER_CLIENT | BOUTIQUE_STAFF | MERCHANT_OWNER | AGENCE_AGENT | ADMIN_MODERATEUR | ADMIN_FINANCE | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Recherche & Consultation Catalogue** |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |
| **Création Commande Panier** |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  AUTORISÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Suppression Compte (RGPD)** |  REFUSÉ |  AUTORISÉ (soi) |  AUTORISÉ (soi) |  AUTORISÉ (soi) |  AUTORISÉ (soi) |  REFUSÉ |  REFUSÉ |  AUTORISÉ (tous) |
| **Création d'une Nouvelle Boutique** |  REFUSÉ |  AUTORISÉ |  REFUSÉ |  AUTORISÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Ajout / Modification Produits Boutique** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ (sa boutique) |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ (toutes) |
| **Ouverture / Vente Caisse POS** |  REFUSÉ |  REFUSÉ |  AUTORISÉ (assigné) |  AUTORISÉ (sa boutique) |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Consultation Bilan Financier Boutique** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ (sa boutique) |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Gestion des Collaborateurs Boutique** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ (sa boutique) |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Accès Données Boutique Tierce (Anti-IDOR)** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Création & Gestion des Baux Immobiliers** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ (son agence) |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Téléchargement Quittance PDF** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Modération des Annonces & Produits** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |  REFUSÉ |  AUTORISÉ |
| **Validation des Paiements & Reversements** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |  AUTORISÉ |
| **Configuration Système & Clés API Tierces** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |
| **Visualisation des Logs d'Audit Système** |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  REFUSÉ |  AUTORISÉ |  AUTORISÉ |

---

## 3. Mécanismes d'Isolation & Garde-Fous Techniques

### A. Cloisonnement Multi-Tenant des Boutiques (`tenantSecurity.js`)
* **Principe** : Tout appel vers `/api/boutiques/:id/*` ou `/api/comptabilite/:id/*` transite par `requireBoutiqueOwnership`.
* **Vérification en Base** : Requête SQL directe :
  ```sql
  SELECT b.* FROM boutiques b
  LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
  WHERE (b.id = $1 OR b.slug = $1) AND (b.utilisateur_id = $2 OR bu.utilisateur_id = $2)
  ```
* **Sanction Immédiate** : En cas de non-concordance :
  - HTTP 403 Forbidden immédiat (`{ success: false, error: 'Accès non autorisé à cette boutique.', code: 'FORBIDDEN' }`).
  - Insertion irréversible dans la table `security_audit_vault` (`event_type: 'IDOR_BOUTIQUE_ACCESS_DENIED'`).

### B. Cloisonnement Multi-Tenant des Agences Immobilières (`tenantSecurityImmo.js`)
* **Principe** : Contrôle systématique du rattachement de l'agent à l'agence cible via la table `agence_membres`.
* **Protection IDOR** : Un agent de l'agence X tentant d'accéder au bail de l'agence Y reçoit un HTTP 403 et déclenche une alerte de sécurité.

### C. Contrôle RBAC de l'Administration Centrale (`admin-rbac.js`)
* **Principe** : Vérification des permissions granulaires (`finances:view`, `users:edit`, `produits:moderate`) déclarées dans `ROLE_PERMISSIONS`.
* **Signature de Cookie Dédiée** : L'accès admin repose sur le cookie httpOnly `nopalou_admin_jwt` signé avec le secret `JWT_SECRET` et portant le scope explicite `nopalou_admin`.
* **Verrou Anti-Force Brute Break-Glass** : La saisie du secret de secours est bridée à 10 tentatives échouées par fenêtre de 15 minutes par adresse IP (`_secretFails`).
