# 📘 Cahier de Recette & Guide de Test Utilisateur — Nopalou

> **Version** : 2.0 (Post-Audit Global P0-P3)  
> **Branche de test** : `feature/nopalou-master-fixes-p0-p3`  
> **Environnement local** : Frontend `http://localhost:3001` | Backend `http://localhost:3000`  
> **Cible** : Validation fonctionnelle, mobile tactile et flux WhatsApp

---

## 🎯 Mode d'Emploi pour le Testeur

Ce cahier de recette vous guide pas à pas pour tester l'ensemble des nouveautés et améliorations apportées à Nopalou.
Chaque scénario indique :
1. **L'URL à ouvrir** dans votre navigateur.
2. **L'action concrète à réaliser**.
3. **Le résultat attendu à observer**.
4. **Une case à cocher `[ ]`** pour valider l'étape.

> 💡 **Conseil Test Mobile** : Sur votre ordinateur, ouvrez Google Chrome ou Edge, appuyez sur `F12` (ou clic droit > *Inspecter*), puis cliquez sur l'icône de smartphone en haut à gauche (ou `Ctrl+Shift+M`) pour simuler un écran mobile (ex: *iPhone SE 375px* ou *Samsung Galaxy 360px*).

---

## 🧭 Scénario 1 : Parcours Acheteur, Clarté Dual-Track & Séquestre Garanti

### Test 1.1 — Commutation Immédiate "Acheteur vs Commerçant" (Hero Dual-Track)
* **URL** : `http://localhost:3001/`
* **Action** :
  1. Observez le haut de la page d'accueil.
  2. Cliquez sur l'onglet **« 🛍️ Je cherche un produit »** (Mode Acheteur).
  3. Cliquez ensuite sur l'onglet **« 🏪 Je gère une boutique »** (Mode Marchand).
* **Résultat Attendu** :
  * [ ] L'affichage commute instantanément sans rechargement de page.
  * [ ] En mode Acheteur : barre de recherche de produits, comparateur et filtres mis en avant.
  * [ ] En mode Marchand : les 3 piliers s'affichent clairement (*Caisse POS*, *Boutique WhatsApp*, *Carnet de Dettes*) avec le bouton « Ouvrir ma Caisse / Boutique ».

### Test 1.2 — Facettes Dynamiques par Catégorie Métier
* **URL** : `http://localhost:3001/?categorie=smartphones` puis `http://localhost:3001/?categorie=mode`
* **Action** :
  1. Chargez la page avec la catégorie *smartphones*.
  2. Observez le bandeau blanc de filtres au-dessus des résultats.
  3. Changez pour la catégorie *mode*.
* **Résultat Attendu** :
  * [ ] En catégorie Smartphones : les boutons de filtre **Stockage** (64 Go, 128 Go, 256 Go) et **RAM** (4 Go, 6 Go, 8 Go) s'affichent automatiquement.
  * [ ] En catégorie Mode : les filtres s'adaptent instantanément avec **Tailles** (S, M, L, XL) et **Pointures** (38 à 45).
  * [ ] Un clic sur une option (ex: `128 Go`) ajoute le paramètre dans l'URL sans casser la page.

### Test 1.3 — Checkout Express & Protection Séquestre ("Nopalou Pay Safe")
* **URL** : `http://localhost:3001/checkout-express`
* **Action** :
  1. Remplissez le prénom, nom et numéro de téléphone (+221 77 ...).
  2. Cochez la case **« 🛡️ Activer la protection Séquestre Nopalou Pay Safe »**.
  3. Cliquez sur **« Confirmer la commande »**.
* **Résultat Attendu** :
  * [ ] Un message de réassurance vert s'affiche expliquant le principe du séquestre.
  * [ ] Sur la page de confirmation, un **Code PIN Séquestre** (ex: `PIN: 8472`) s'affiche clairement avec la consigne : *"Ne communiquez ce code au livreur qu'après avoir vérifié et validé l'état de votre colis"*.

---

## 📱 Scénario 2 : Ergonomie Mobile-First & Navigation Adaptative au Rôle

### Test 2.1 — Absence Totale de Débordement Horizontal (320px à 412px)
* **Configuration** : Mode F12 Mobile réglé sur **320px** (Ultra-compact / iPhone SE)
* **Action** :
  1. Parcourez l'accueil (`/`), la boutique (`/boutique`), le carnet (`/boutique?tab=carnet`) et la caisse (`/boutique/caisse`).
  2. Tentez de faire défiler l'écran horizontalement (scroll de droite à gauche).
* **Résultat Attendu** :
  * [ ] L'écran est 100% stable verticalement. Aucun décalage latéral ni marge blanche à droite.
  * [ ] Tous les textes restent lisibles et ne sont pas coupés sauvagement.

### Test 2.2 — Barre de Navigation Basse Adaptative (`MobileBottomNav`)
* **URL** : `http://localhost:3001/` (sur smartphone ou vue F12)
* **Action** :
  1. Observez la barre d'action fixée au bas de l'écran en tant que simple visiteur.
  2. Connectez-vous avec un compte marchand ou accédez à `/boutique`.
  3. Observez le bouton central.
* **Résultat Attendu** :
  * [ ] Pour un simple acheteur : Le bouton central est **« 🛒 Panier »**.
  * [ ] Pour un commerçant connecté : Le bouton central bascule automatiquement sur **« ⚡ Caisse »** et renvoie directement sur le terminal de vente mobile.

---

## 🏪 Scénario 3 : Espace Commerçant & Caisse Tactile ("Mode Taf-Taf" & Caisse Vocale)

### Test 3.1 — Dashboard Marchand Tactile ("Mode Taf-Taf")
* **URL** : `http://localhost:3001/boutique`
* **Action** :
  1. Observez le sélecteur en haut du dashboard : **« Mode Taf-Taf (Grandes dalles) »** vs **« Mode Avancé »**.
  2. Cliquez sur l'interrupteur pour activer le Mode Taf-Taf.
* **Résultat Attendu** :
  * [ ] Le dashboard affiche 4 grandes dalles tactiles géantes de plus de 80px :
    1. ⚡ **Encaisser (Caisse POS)**
    2. ➕ **Ajouter un Produit**
    3. 📒 **Carnet de Dettes Client**
    4. 📈 **Mes Ventes du Jour**
  * [ ] La préférence reste enregistrée si vous rafraîchissez la page (touche F5).

### Test 3.2 — Caisse Enregistreuse POS Tactile (`/boutique/caisse`)
* **URL** : `http://localhost:3001/boutique/caisse`
* **Action** :
  1. À l'écran de déverrouillage, sélectionnez votre profil caissier ou tapez votre code PIN secret (ex: `1234` ou le PIN configuré).
  2. Dès le 4ᵉ chiffre saisi, observez le comportement.
* **Résultat Attendu** :
  * [ ] Les profils caissiers de l'équipe s'affichent sous forme de pastilles tactiles cliquables.
  * [ ] La caisse se déverrouille instantanément de façon fluide sans avoir besoin de cliquer sur un bouton "Valider".
  * [ ] Aucun clavier virtuel ne vient masquer l'écran.

### Test 3.2b — Changement de Caissier & Verrouillage Rapide
* **URL** : `http://localhost:3001/boutique/caisse` (caisse déverrouillée)
* **Action** :
  1. **Option 1 (Header)** : Cliquez sur la pastille du caissier en haut à droite (qui comporte désormais une flèche `⌄`).
  2. **Option 2 (Menu Outils)** : Cliquez sur le bouton `⚙️ Outils`, puis sur `👤 Changer de caissier`.
  3. Observez la modale : elle liste tous les caissiers actifs de la boutique avec leur rôle (`👑 Superviseur` ou `👤 Caissier`).
  4. Cliquez sur un autre caissier : un pavé numérique PIN sécurisé apparaît à l'écran.
  5. Saisissez son code PIN à 4 chiffres.
* **Résultat Attendu** :
  * [ ] Le caissier actif est instantanément mis à jour dans le bandeau avec confirmation visuelle toast verte.
  * [ ] Le rôle (`superviseur` ou `caissier`) s'adapte automatiquement (ex: accès aux remises et clôtures Z pour le superviseur).
  * [ ] L'option "🔒 Verrouiller ce terminal" permet à un caissier de quitter son poste en 1 clic en toute sécurité.

### Test 3.3 — Assistant Vocal Caisse Bilingue (Wolof & Français)
* **URL** : `http://localhost:3001/boutique/caisse`
* **Action** :
  1. Cliquez sur le bouton microphone **« 🎤 Vocal »** à côté du bouton Scanner Douchette.
  2. Autorisez le microphone si le navigateur le demande.
  3. Prononcez distinctement l'une des phrases suivantes :
     - Option A (Français) : *« Vente café Touba »* ou *« 2500 »*
     - Option B (Wolof) : *« Vente benn téemeer »* (500 FCFA) ou *« Vente ñaari junni »* (10 000 FCFA)
* **Résultat Attendu** :
  * [ ] L'assistant comprend le montant ou le produit et l'ajoute automatiquement dans le panier de caisse.
  * [ ] Une notification verte de confirmation apparaît : *"✓ Ajouté : 1x ... (X FCFA)"*.

### Test 3.4 — Carnet de Dettes & Vente à Crédit
* **URL** : `http://localhost:3001/boutique?tab=carnet`
* **Action** :
  1. Cliquez sur **« + Nouvelle Dette »**.
  2. Saisissez le nom d'un client (ex: *Moussa Diallo*), son téléphone et le montant (ex: *15 000 FCFA*).
  3. Validez l'opération.
* **Résultat Attendu** :
  * [ ] La dette apparaît immédiatement dans le carnet avec le badge rouge "Doit la boutique".
  * [ ] Le bouton vert **« 💬 Relancer sur WhatsApp »** prépare un message poli et prêt à envoyer avec le solde exact dû.

---

## 💬 Scénario 4 : Fiabilité WhatsApp, Relances & Sécurité 2FA

### Test 4.1 — Double Authentification 2FA par Code OTP WhatsApp
* **Action & API** :
  1. Simulez une action sensible (ex: virement de fonds marchand ou validation de retrait).
  2. Un modal moderne s'ouvre : [`ModalConfirmationOtp.tsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/src/components/ModalConfirmationOtp.tsx).
  3. Tapez 6 chiffres erronés (ex: `000000`).
* **Résultat Attendu** :
  * [ ] Le système rejette le code et affiche : *"Code incorrect (2 essai(s) restant(s))"*.
  * [ ] Après 3 mauvais essais, le code est bloqué pour protéger le compte marchand.
  * [ ] Les codes sont protégés par empreinte SHA-256 avec sel en base de données.

### Test 4.2 — Déclenchement de la Relance Panier Abandonné
* **URL / Commande de test** :
  1. Dans le backend, le service [`relance-panier.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/backend/services/relance-panier.js) tourne automatiquement toutes les 30 minutes via cron.
  2. Une route de déclenchement administrateur sécurisée est disponible : `POST /api/admin/commandes/relancer-paniers`.
* **Résultat Attendu** :
  * [ ] Les paniers créés depuis plus de 45 minutes et restés non payés reçoivent une notification courtoise sur WhatsApp.
  * [ ] Le message contient le lien de paiement direct Wave pour finaliser la transaction en 1 clic.
  * [ ] La commande est marquée `relance_panier_envoyee = true` pour ne jamais harceler le client deux fois.

---

## 🏛️ Scénario 5 : Export Comptable Officiel Conforme SYSCOHADA (OHADA)

### Test 5.1 — Téléchargement du Grand Livre / Journal des Ventes
* **URL** : `http://localhost:3001/boutique?tab=compta`
* **Action** :
  1. Rendez-vous dans l'onglet **Comptabilité** du tableau de bord boutique.
  2. Repérez le bouton bleu **« 🏛️ SYSCOHADA »** en haut à droite du journal des ventes.
  3. Cliquez sur le bouton pour télécharger le fichier.
* **Résultat Attendu** :
  * [ ] Un fichier CSV est instantanément généré et téléchargé : `Grand_Livre_SYSCOHADA_...csv`.
  * [ ] Le fichier s'ouvre proprement dans Microsoft Excel, Google Sheets, Odoo ou Sage Saari sans problème d'accents (encodage UTF-8 BOM).

### Test 5.2 — Vérification des Écritures Comptables en Partie Double
* **Action** :
  1. Ouvrez le fichier CSV téléchargé avec un tableur ou Bloc-Notes.
  2. Inspectez les colonnes et les numéros de comptes.
* **Résultat Attendu** :
  * [ ] Le format respecte rigoureusement la norme comptable SYSCOHADA révisée :
    - Compte **`571000`** : *Caisse Centrale Espèces* (Débit sur vente cash)
    - Compte **`521100`** : *Banque / Compte Wave Business* (Débit sur vente Wave)
    - Compte **`521200`** : *Banque / Compte Orange Money* (Débit sur vente OM)
    - Compte **`411100`** : *Clients - Créances sur Ventes* (Débit sur vente à crédit)
    - Compte **`701000`** : *Ventes de Marchandises dans la Région* (Crédit systématique)
  * [ ] La somme totale des Débits est strictement égale à la somme totale des Crédits.

---

## 📊 Grille de Synthèse de Recette Utilisateur

Remplissez ce tableau au fur et à mesure de vos tests :

| N° | Scénario & Fonctionnalité | Résultat Observé | Statut (OK / KO) | Remarques |
| :---: | :--- | :--- | :---: | :--- |
| **1.1** | Commutation Hero Dual-Track (Acheteur / Vendeur) | | `[ ]` | |
| **1.2** | Facettes Dynamiques par Catégorie (Tech / Mode) | | `[ ]` | |
| **1.3** | Commande Checkout Express & Séquestre Garanti PIN | | `[ ]` | |
| **2.1** | Fluidité Mobile 320px sans scroll horizontal parasite | | `[ ]` | |
| **2.2** | Barre Mobile Bottom Nav adaptative (Panier vs Caisse) | | `[ ]` | |
| **3.1** | Dashboard Marchand tactile "Mode Taf-Taf" | | `[ ]` | |
| **3.2** | Caisse POS Déverrouillage PIN 4 chiffres sans clavier | | `[ ]` | |
| **3.3** | Assistant Vocal Caisse (Franc CFA & Wolof) | | `[ ]` | |
| **3.4** | Carnet de Dettes & Vente à crédit | | `[ ]` | |
| **4.1** | Sécurité 2FA par code OTP WhatsApp (3 essais max) | | `[ ]` | |
| **4.2** | Relance automatique des paniers abandonnés WhatsApp | | `[ ]` | |
| **5.1** | Export CSV officiel Grand Livre SYSCOHADA (OHADA) | | `[ ]` | |
| **5.2** | Partie double équilibrée (571000, 521100, 701000) | | `[ ]` | |

---

**Signature & Décision de Mise en Production :**  
`[ ]` Recette validée à 100% — Prêt pour fusion sur la branche `main`  
`[ ]` Réserves ou ajustements mineurs demandés : _________________________________
