# Templates WhatsApp à soumettre à Meta

À créer dans **WhatsApp Manager → Gestionnaire de modèles → Créer un modèle**.
Format retenu : **Standard** (Corps + Bouton, pas d'en-tête) — le mode Carousel n'était pas trouvable facilement dans l'interface actuelle ; le code a de toute façon un fallback texte (`sendWhatsAppTemplate`) qui fonctionne avec ce format, donc rien ne bloque le lancement.

Langue : **Français (fr)**. Délai d'approbation habituel : 24-48h.
Ces noms de template doivent correspondre EXACTEMENT à ceux utilisés dans le code (`backend/services/whatsapp.js`, `notifications.js`, `whatsapp-chatbot.js`) : `nopalou_carousel_annonce`, `nopalou_carousel_immo`, `nopalou_carousel_telecoms` (avec un "s" — voir note ci-dessous), `nopalou_fiche_texte`.

**Note historique** : le premier essai `nopalou_carousel_telecom` (sans "s") a été soumis avec un contenu erroné et ne peut pas être supprimé tant qu'il est en review chez Meta. Le nom définitif retenu et câblé dans le code est `nopalou_carousel_telecoms` (avec "s") — c'est celui-là qu'il faut utiliser, l'ancien peut être ignoré/supprimé plus tard une fois traité par Meta.

**⚠️ Règle Meta importante** : une variable (`{{1}}`, `{{2}}`...) ne peut jamais se trouver au tout début ni à la toute fin du corps du message — il faut du texte fixe avant/après. Le corps doit aussi être assez long par rapport au nombre de variables (sinon erreur "trop de variables par rapport à sa longueur").

**Titre / En-tête** : laisser vide (facultatif) pour les 4 templates.

---

## 1. `nopalou_carousel_annonce` ✅ validé dans l'interface Meta

**Catégorie** : Marketing

**Corps** :
```
🛍️ Nouvelle annonce : {{1}} au prix de {{2}}. Découvrez tous les détails ici : {{3}} sur Nopalou.
```
Exemple de contenu : `{{1}}` = "iPhone 13 Pro Max 256Go" · `{{2}}` = "450 000 FCFA" · `{{3}}` = "https://nopalou.com/annonces/abc123"

**Bouton** :
- Type d'action : Consulter le site Web
- Texte du bouton : `Visit website` (ou personnaliser, ex. "Voir l'annonce")
- Type d'URL : Dynamique
- URL du site Web : `https://nopalou.com/annonces/{{1}}`
- Exemple d'URL demandé par Meta : `https://nopalou.com/annonces/abc123`

---

## 2. `nopalou_carousel_immo`

**Catégorie** : Marketing

**Corps** (même structure que le template validé ci-dessus, adaptée à l'immo) :
```
🏠 Nouveau bien : {{1}} à {{2}}. Découvrez tous les détails ici : {{3}} sur Nopalou.
```
Exemple : `{{1}}` = "Appartement 3 pièces — Almadies" · `{{2}}` = "85 000 000 FCFA" · `{{3}}` = "https://nopalou.com/immo/xyz789"

**Bouton** :
- Type d'action : Consulter le site Web
- Texte du bouton : "Voir le bien"
- Type d'URL : Dynamique
- URL du site Web : `https://nopalou.com/immo/{{1}}`
- Exemple d'URL : `https://nopalou.com/immo/xyz789`

---

## 3. `nopalou_carousel_telecoms` ⚠️ nom réel avec "s" (voir note ci-dessous)

**Catégorie** : Marketing

**Corps** :
```
📱 Nouveau forfait disponible : {{1}} à {{2}}. Comparez toutes les offres ici : {{3}} sur Nopalou.
```
Exemple : `{{1}}` = "Forfait Illimix 10Go — Orange" · `{{2}}` = "5 000 FCFA/mois" · `{{3}}` = "https://nopalou.com/telecom"

**Bouton** :
- Type d'action : Consulter le site Web
- Texte du bouton : "Comparer"
- Type d'URL : Statique (le lien telecom n'a pas besoin d'ID dynamique)
- URL du site Web : `https://nopalou.com/telecom`

---

## 4. `nopalou_fiche_texte`

**Catégorie** : Utilité (Utility) — si Meta rejette la catégorie à cause de l'usage mixte (marketing + transactionnel type confirmation de paiement/refus), essayer Marketing à la place, ou scinder en deux templates (voir note en bas).

**Corps** :
```
📢 {{1}} — {{2}}. Retrouvez tous les détails ici : {{3}} sur Nopalou.
```
Exemple : `{{1}}` = "Villa 4 pièces — Sacré-Cœur" · `{{2}}` = "120 000 000 FCFA" · `{{3}}` = "https://nopalou.com/immo/abc123"

**Bouton** :
- Type d'action : Consulter le site Web
- Texte du bouton : "Voir les détails"
- Type d'URL : Dynamique
- URL du site Web (réelle, vérifiée le 06/07/2026) : `https://nopalou.com/immo/{{1}}`
- Exemple d'URL : `https://nopalou.com/immo/abc123`

---

## ⚠️ Piège vécu — paramètre du bouton dynamique = id seul, jamais l'URL complète

Découvert le 06/07/2026 : pour les 4 templates dont le bouton a une URL **Dynamique**
(`nopalou_carousel_annonce`, `nopalou_carousel_immo`, `nopalou_fiche_texte`), le segment
de chemin (`immo/`, `annonces/`) est **câblé en dur côté Meta dans l'URL du bouton**, pas
dans le code. Le paramètre `{{1}}` du bouton n'attend donc que l'**id brut** (ex: `abc123`),
jamais un chemin ou une URL complète.

Envoyer autre chose que l'id brut casse silencieusement le lien :
- Envoyer `immo/abc123` → Meta compose `https://nopalou.com/immo/immo/abc123` → 404
- Ne pas envoyer le paramètre bouton du tout → Meta rejette l'envoi entier avec
  `(#131008) Required parameter is missing` (le composant `body` seul ne suffit pas,
  même si le bouton n'affiche pas de variable dans son texte visible)

Le composant `button` doit être fourni en plus du `body` dans tous les appels
`sendWhatsAppTemplate`/`sendWhatsAppCarousel` utilisant un de ces 3 templates :
```js
{ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: a.id }] }
```
`nopalou_carousel_telecoms` fait exception : son bouton est **Statique** (`https://nopalou.com/telecom`,
sans `{{1}}`), donc aucun composant `button` n'est nécessaire dans l'appel — n'en ajoutez pas.

Avant de faire confiance à cette doc pour un template modifié depuis, revérifier le champ
réel dans WhatsApp Manager → Modèles de message, comme fait ici — la doc peut diverger
de ce qui a été effectivement soumis/approuvé côté Meta.

---

## Note — passage à un vrai Carousel plus tard

Si Meta rejette `nopalou_fiche_texte` en catégorie Utilité, le scinder en deux templates :
- `nopalou_notification_transaction` (Utilitaire) — paiement confirmé / annonce refusée
- `nopalou_fiche_texte` (Marketing) — contenu produit/annonce sans photo

Cela nécessiterait une petite mise à jour de `backend/services/notifications.js` et `whatsapp.js` pour utiliser le bon nom de template selon le contexte.

Pour un vrai format Carousel plus tard (cartes avec image + swipe), chercher dans WhatsApp Manager un modèle existant du type démo Meta (`*_carousel_v1`) et utiliser "Dupliquer" comme point de départ.
