# Panier natif WhatsApp/Meta Commerce — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traiter le panier natif WhatsApp (message webhook `msg.type === 'order'`) envoyé par un client depuis une fiche produit boutique — créer automatiquement une commande groupée (multi-produits) en réutilisant le flux conversationnel de collecte existant, sans dupliquer la notification vendeur.

**Architecture:** `creerCommandeBoutique()` (déjà extraite) est modifiée pour ne plus envoyer de notification elle-même — chaque appelant décide. `context.commande` du chatbot passe d'un produit unique implicite à un tableau `items[]`, généralisant le flux `COMMANDE_*` existant. Une nouvelle colonne additive `groupe_commande` lie les lignes d'un même panier ; l'affichage vendeur (`Commandes.tsx`) les regroupe visuellement.

**Tech Stack:** Node.js/Express, PostgreSQL (`pg`), Meta WhatsApp Cloud API v18.0, Next.js 14 (App Router, composants client).

## Global Constraints

- `whatsapp_sessions.context` JSONB : toujours remplacé en bloc par `setSession(phone, state, context)`, jamais fusionné partiellement — chaque écriture doit inclure tous les champs à conserver.
- `context.commande` doit désormais toujours contenir un tableau `items: [{ produit_id, nom_produit, prix, quantite, stock_quantite }]` — y compris pour le flux « Commander » mono-produit existant (devient `items` à un seul élément). Ne jamais introduire une forme parallèle à un seul produit.
- `creerCommandeBoutique({ boutiqueId, produitId, quantite, clientNom, clientTelephone, clientAdresse, note, source, methodePaiement, zoneLivraisonId, nomProduitManuel, prixUnitaireManuel, groupeCommande })` retourne désormais `{ commande, boutique }` et **n'envoie plus de notification WhatsApp** — chaque appelant notifie lui-même.
- Format du `retailer_id` Meta : `nopalou-produit-{id}` (préfixe de 16 caractères, confirmé dans `whatsapp-catalog.js`, `whatsapp.js`, `whatsapp-chatbot.js`).
- Aucune régression sur `POST /api/comptabilite/:boutiqueId/commandes` (route web existante) — comportement observable strictement identique pour son appelant `CommanderModal.tsx` : notification immédiate après chaque commande, même contenu de message.
- Article de panier introuvable/invalide : écarté silencieusement, le reste du panier continue. Panier entièrement invalide → message clair, pas de commande créée.
- Meta's interactive list caps at 10 rows ; row titles capped at 24 chars (contraintes déjà respectées par le code existant réutilisé dans ce plan).
- Plain Node.js/Express style côté backend (pas de TypeScript). `frontend-next/src/app/boutique/Commandes.tsx` reste en TypeScript strict (`npx tsc --noEmit` doit passer).
- Commits fréquents, un par tâche.

---

### Task 1: Extraire la notification hors de `creerCommandeBoutique` — route web inchangée

**Files:**
- Modify: `backend/routes/comptabilite.js:468-575` (fonction `creerCommandeBoutique` + route `POST /:boutiqueId/commandes`)

**Interfaces:**
- Produces: `creerCommandeBoutique({...})` retourne désormais `{ commande, boutique }` (au lieu de `{ commande }` seul) — `boutique` est l'objet chargé en interne (`{ id, nom, telephone, whatsapp, utilisateur_id }`), exposé pour éviter à l'appelant de le recharger. La fonction accepte un nouveau paramètre optionnel `groupeCommande` (UUID ou `null`), simplement inséré dans la colonne `groupe_commande` de l'`INSERT` (ajoutée en Task 2) — aucune autre logique n'en dépend dans cette fonction.
- Produces: nouvelle fonction exportée `notifierVendeurCommande(boutique, { reference, nomProduit, quantite, montantTotal, fraisLivraison, methodePaiement, clientNom, clientTelephone, clientAdresse, note })` — construit et envoie exactement le même message que l'ancien code interne à `creerCommandeBoutique`, réutilisable par n'importe quel appelant.
- Consumes: rien de nouveau.

- [ ] **Step 1: Lire le bloc actuel pour confirmer les bornes exactes**

Le bloc à modifier est `backend/routes/comptabilite.js:468-536` (fonction `creerCommandeBoutique`) et `538-575` (route `POST /:boutiqueId/commandes`). Confirmer avec :

```bash
grep -n "^async function creerCommandeBoutique\|^router.post(\s*$\|^  '/:boutiqueId/commandes'" backend/routes/comptabilite.js
```

- [ ] **Step 2: Ajouter `notifierVendeurCommande` et modifier `creerCommandeBoutique`**

Remplacer les lignes 465-536 de `backend/routes/comptabilite.js` (de `// Logique de création de commande...` jusqu'à la fermeture de `creerCommandeBoutique`) par :

```js
// Construit et envoie le message WhatsApp de notification au vendeur.
// Extrait de creerCommandeBoutique pour permettre à un appelant (ex: panier
// multi-articles) de notifier une seule fois après plusieurs insertions.
async function notifierVendeurCommande(boutique, {
  reference, nomProduit, quantite, montantTotal, fraisLivraison,
  methodePaiement, clientNom, clientTelephone, clientAdresse, note,
}) {
  const vendeurTel = boutique.whatsapp || boutique.telephone;
  if (!vendeurTel) return;
  const { sendWhatsAppText } = require('../services/whatsapp');
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement' };
  const msg = `🛒 *Nouvelle commande — ${boutique.nom}*\n\nRéf : *${reference}*\nProduit : ${nomProduit} × ${quantite}${montantTotal > 0 ? `\nMontant : *${new Intl.NumberFormat('fr-FR').format(montantTotal)} FCFA*` : ''}${fraisLivraison > 0 ? `\nLivraison : ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} FCFA` : ''}\n💳 Paiement souhaité : ${methodeLabel[methodePaiement] || methodePaiement}\n\n👤 Client : ${clientNom}\n📞 ${clientTelephone}${clientAdresse ? `\n📍 ${clientAdresse}` : ''}${note ? `\n📝 ${note}` : ''}\n\n⚡ Répondez vite pour confirmer !`;
  sendWhatsAppText(vendeurTel, msg).catch(() => {});
}

// Logique de création de commande, partagée entre la route HTTP publique
// (POST /:boutiqueId/commandes, source='web') et le chatbot WhatsApp (source='whatsapp').
// Lève une erreur avec .status (404/400) et .message (message utilisateur) en cas d'échec.
// N'envoie PAS de notification elle-même — l'appelant appelle notifierVendeurCommande()
// séparément (permet de grouper la notification pour un panier multi-articles).
async function creerCommandeBoutique({
  boutiqueId, produitId, quantite = 1, clientNom, clientTelephone, clientAdresse,
  note, source = 'web', methodePaiement = 'wave', zoneLivraisonId,
  nomProduitManuel, prixUnitaireManuel, groupeCommande,
}) {
  const { rows: [boutique] } = await pool.query(
    'SELECT id, nom, telephone, whatsapp, utilisateur_id FROM boutiques WHERE id=$1 AND actif=true',
    [boutiqueId]
  );
  if (!boutique) {
    const e = new Error('Boutique introuvable');
    e.status = 404;
    throw e;
  }

  let nomProduit = nomProduitManuel || 'Produit';
  let prixUnitaire = Number(prixUnitaireManuel) || 0;
  let fraisLivraison = 0;

  if (zoneLivraisonId) {
    const { rows: [zone] } = await pool.query(
      'SELECT prix, nom FROM zones_livraison WHERE id=$1 AND boutique_id=$2',
      [zoneLivraisonId, boutiqueId]
    );
    if (zone) fraisLivraison = Number(zone.prix);
  }

  if (produitId) {
    const { rows: [p] } = await pool.query(
      'SELECT nom, prix, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2',
      [produitId, boutiqueId]
    );
    if (!p) {
      const e = new Error('Produit introuvable');
      e.status = 404;
      throw e;
    }
    nomProduit = p.nom;
    if (!prixUnitaire && p.prix) prixUnitaire = Number(p.prix);
    if (p.stock_quantite !== null && p.stock_quantite < quantite) {
      const e = new Error('Stock insuffisant');
      e.status = 400;
      throw e;
    }
  }

  const montantTotal = prixUnitaire * quantite + fraisLivraison;
  const ref = genRefCommande();

  const { rows: [commande] } = await pool.query(
    `INSERT INTO commandes_boutique
       (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, montant_total,
        client_nom, client_telephone, client_adresse, note, source, methode_paiement, zone_livraison_id, frais_livraison)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [ref, boutiqueId, produitId || null, nomProduit, quantite, prixUnitaire, montantTotal,
     clientNom, clientTelephone, clientAdresse || null, note || null, source,
     methodePaiement, zoneLivraisonId || null, fraisLivraison]
  );

  return { commande, boutique };
}
```

**Note** : le paramètre `groupeCommande` est intentionnellement **ignoré** dans cette Task 1 (la colonne `groupe_commande` n'existe pas encore en base — elle est ajoutée en Task 2, avec la mise à jour de l'`INSERT` pour l'utiliser). Task 1 se contente d'accepter le paramètre sans le persister, pour que la signature soit stable dès maintenant et que Task 2 n'ait qu'à modifier l'`INSERT`, pas la signature.

- [ ] **Step 3: Adapter la route `POST /:boutiqueId/commandes` pour notifier elle-même**

Remplacer le corps de la route (actuellement lignes 547-566, après la Step 2 les numéros de ligne auront changé — repérer avec `grep -n "router.post(" backend/routes/comptabilite.js` et lire le bloc qui suit) :

```js
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const { produit_id, quantite = 1, client_nom, client_telephone, client_adresse, note, source = 'web', methode_paiement = 'wave', zone_livraison_id } = req.body;

      const { commande, boutique } = await creerCommandeBoutique({
        boutiqueId: req.params.boutiqueId,
        produitId: produit_id,
        quantite,
        clientNom: client_nom,
        clientTelephone: client_telephone,
        clientAdresse: client_adresse,
        note,
        source,
        methodePaiement: methode_paiement,
        zoneLivraisonId: zone_livraison_id,
        nomProduitManuel: req.body.nom_produit,
        prixUnitaireManuel: req.body.prix_unitaire,
      });

      await notifierVendeurCommande(boutique, {
        reference: commande.reference,
        nomProduit: commande.nom_produit,
        quantite: commande.quantite,
        montantTotal: Number(commande.montant_total),
        fraisLivraison: Number(commande.frais_livraison),
        methodePaiement: commande.methode_paiement,
        clientNom: commande.client_nom,
        clientTelephone: commande.client_telephone,
        clientAdresse: commande.client_adresse,
        note: commande.note,
      });

      res.status(201).json({ commande, message: 'Commande envoyée avec succès' });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error('[COMMANDE]', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);
```

**Vérification critique** : le message envoyé par `notifierVendeurCommande` doit être byte-for-byte identique à l'ancien message inline — comparer le template literal ci-dessus (Step 2) avec l'ancien code (`git show HEAD:backend/routes/comptabilite.js` avant modification, ou `git diff` après cette tâche) pour confirmer qu'aucun mot n'a changé.

- [ ] **Step 4: Modifier l'export du fichier**

À la fin de `backend/routes/comptabilite.js`, remplacer :
```js
module.exports = router;
module.exports.creerCommandeBoutique = creerCommandeBoutique;
```
par :
```js
module.exports = router;
module.exports.creerCommandeBoutique = creerCommandeBoutique;
module.exports.notifierVendeurCommande = notifierVendeurCommande;
```

- [ ] **Step 5: Vérifier la syntaxe**

```bash
node --check backend/routes/comptabilite.js
```
Expected: aucune sortie (succès).

- [ ] **Step 6: Vérifier que le chatbot (appelant existant de `creerCommandeBoutique`) n'est pas cassé par le changement de retour**

`backend/services/whatsapp-chatbot.js` dans le bloc `COMMANDE_CONFIRMATION` fait actuellement `const { commande } = await creerCommandeBoutique({...})` — la destructuration `{ commande }` reste valide même si la fonction retourne aussi `boutique` en plus (destructuration partielle, pas d'erreur). Confirmer par lecture :

```bash
grep -n "const { commande } = await creerCommandeBoutique" backend/services/whatsapp-chatbot.js
```

Cette ligne sera de toute façon réécrite en Task 5 (généralisation multi-articles) — ne pas la modifier dans cette tâche, juste confirmer qu'elle ne casse rien dans l'intervalle.

- [ ] **Step 7: Commit**

```bash
git add backend/routes/comptabilite.js
git commit -m "refactor(boutique): extrait la notification vendeur de creerCommandeBoutique" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Migration additive `groupe_commande` + branchement dans `creerCommandeBoutique`

**Files:**
- Modify: `backend/migrate-inline.js` (ajout colonne)
- Modify: `backend/routes/comptabilite.js` (branchement du paramètre `groupeCommande` dans l'`INSERT`)

**Interfaces:**
- Produces: colonne `commandes_boutique.groupe_commande UUID` (nullable), index partiel `idx_commandes_groupe`.
- Consumes: le paramètre `groupeCommande` déjà accepté (mais ignoré) par `creerCommandeBoutique` depuis Task 1.

- [ ] **Step 1: Localiser le bloc de migration de `commandes_boutique`**

```bash
grep -n "commandes_boutique" backend/migrate-inline.js
```

- [ ] **Step 2: Ajouter la migration additive**

Dans `backend/migrate-inline.js`, juste après le bloc `CREATE TABLE IF NOT EXISTS commandes_boutique (...)` et ses `CREATE INDEX` associés (repérer avec le Step 1 — la ligne exacte peut avoir légèrement bougé depuis un précédent chantier), ajouter :

```js
    await pool.query(`ALTER TABLE commandes_boutique ADD COLUMN IF NOT EXISTS groupe_commande UUID`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_commandes_groupe ON commandes_boutique(groupe_commande) WHERE groupe_commande IS NOT NULL`);
```

Respecter le style déjà présent dans ce fichier (chaque `ALTER TABLE`/`CREATE INDEX` séparé, avec gestion d'erreur `try/catch` si c'est le pattern local à cet endroit précis — vérifier le bloc environnant avant d'insérer pour rester cohérent).

- [ ] **Step 3: Utiliser `groupeCommande` dans l'`INSERT` de `creerCommandeBoutique`**

Dans `backend/routes/comptabilite.js`, modifier l'`INSERT` ajouté en Task 1 :

```js
  const { rows: [commande] } = await pool.query(
    `INSERT INTO commandes_boutique
       (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, montant_total,
        client_nom, client_telephone, client_adresse, note, source, methode_paiement, zone_livraison_id, frais_livraison, groupe_commande)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [ref, boutiqueId, produitId || null, nomProduit, quantite, prixUnitaire, montantTotal,
     clientNom, clientTelephone, clientAdresse || null, note || null, source,
     methodePaiement, zoneLivraisonId || null, fraisLivraison, groupeCommande || null]
  );
```

- [ ] **Step 4: Vérifier la syntaxe**

```bash
node --check backend/migrate-inline.js
node --check backend/routes/comptabilite.js
```
Expected: aucune sortie pour les deux.

- [ ] **Step 5: Test manuel de la migration (si `.env`/`DATABASE_URL` accessible)**

Si une base de test/dev est joignable dans l'environnement d'exécution :
```bash
npm run migrate
```
Expected: pas d'erreur, log confirmant la migration `commandes_boutique` (ou silence si déjà migré). Si aucune base n'est joignable dans cet environnement, documenter cette limitation dans le rapport plutôt que de simuler un résultat.

- [ ] **Step 6: Commit**

```bash
git add backend/migrate-inline.js backend/routes/comptabilite.js
git commit -m "feat(boutique): ajoute la colonne groupe_commande pour les paniers multi-articles" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Généraliser `context.commande` en `items[]` dans le flux `COMMANDE_*` existant

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js` (fonctions `demarrerCommande`, `envoyerRecapFinal`, blocs d'état `COMMANDE_QUANTITE` à `COMMANDE_CONFIRMATION`)

**Interfaces:**
- Consumes: `creerCommandeBoutique`, `notifierVendeurCommande` (Task 1), colonne `groupe_commande` (Task 2).
- Produces: `context.commande` prend désormais la forme `{ items: [{ produit_id, nom_produit, prix, quantite, stock_quantite }], client_nom, client_telephone, client_adresse, zone_livraison_id, zone_nom, frais_livraison, methode_paiement }` — remplace l'ancienne forme à un seul produit implicite (`produit_id`, `nom_produit`, `prix`, `quantite` directement sur `commande`). Toute tâche ultérieure qui lit `context.commande` doit utiliser `commande.items`.

**Important — cette tâche modifie du code déjà en production (le flux « Commander » mono-produit).** Le comportement observable pour un client qui clique « 🛒 Commander » sur UNE fiche produit (le flux existant) doit rester strictement identique après cette tâche — seule la représentation interne change (`items` à un élément au lieu de champs plats).

- [ ] **Step 1: Localiser les blocs exacts à modifier**

```bash
grep -n "^async function demarrerCommande\|^async function envoyerRecapFinal\|state === 'COMMANDE_QUANTITE'\|state === 'COMMANDE_NOM'\|state === 'COMMANDE_TELEPHONE'\|state === 'COMMANDE_ADRESSE'\|state === 'COMMANDE_ZONE'\|state === 'COMMANDE_PAIEMENT'\|state === 'COMMANDE_CONFIRMATION'" backend/services/whatsapp-chatbot.js
```
Noter les numéros de ligne réels (peuvent différer de ceux indiqués dans ce plan à cause de tâches précédentes).

- [ ] **Step 2: Réécrire `demarrerCommande` pour produire `items`**

Remplacer le corps de `demarrerCommande` (actuellement) :

```js
async function demarrerCommande(phone, boutique, produitId) {
  const r = await pool.query(
    'SELECT id, nom, prix, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2',
    [produitId, boutique.id]
  );
  const produit = r.rows[0];
  if (!produit) {
    await sendWhatsAppText(phone, '😕 Ce produit n\'est plus disponible.');
    await setSession(phone, 'BOUTIQUE_MENU', { boutique });
    return;
  }
  await sendWhatsAppText(phone, `🛒 *Commande — ${produit.nom}*\n\nCombien en voulez-vous ? (tapez un nombre, ex: 1)`);
  await setSession(phone, 'COMMANDE_QUANTITE', {
    boutique,
    commande: {
      items: [{ produit_id: produit.id, nom_produit: produit.nom, prix: Number(produit.prix) || 0, quantite: null, stock_quantite: produit.stock_quantite }],
    },
  });
}
```

- [ ] **Step 3: Réécrire `COMMANDE_QUANTITE` pour écrire dans `items[0].quantite`**

Remplacer le bloc `if (state === 'COMMANDE_QUANTITE') { ... }` :

```js
  if (state === 'COMMANDE_QUANTITE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    const quantite = parseInt(text.replace(/[^\d]/g, ''), 10);
    if (!quantite || quantite < 1) {
      await sendWhatsAppText(phone, '⚠️ Entrez un nombre valide (ex: 1, 2, 3...).');
      return;
    }
    const item = context.commande?.items?.[0];
    const stock = item?.stock_quantite;
    if (stock !== null && stock !== undefined && stock < quantite) {
      await sendWhatsAppText(phone, `⚠️ Il ne reste que ${stock} en stock. Entrez une quantité inférieure ou égale.`);
      return;
    }
    await sendWhatsAppText(phone, 'Votre nom complet ?');
    const items = [{ ...item, quantite }];
    await setSession(phone, 'COMMANDE_NOM', { boutique, commande: { ...context.commande, items } });
    return;
  }
```

- [ ] **Step 4: Les états `COMMANDE_NOM` à `COMMANDE_ZONE` restent inchangés dans leur logique**

Ces blocs ne lisent/écrivent jamais `items` — ils manipulent seulement `client_nom`, `client_telephone`, `client_adresse`, `zone_livraison_id`, `zone_nom`, `frais_livraison` au niveau racine de `context.commande`, via le spread `{ ...context.commande, nouveauChamp }`. **Aucune modification nécessaire** pour `COMMANDE_NOM`, `COMMANDE_TELEPHONE`, `COMMANDE_ADRESSE`, `COMMANDE_ZONE` — le spread préserve `items` automatiquement puisqu'il fait partie de `context.commande`. Confirmer par lecture que ces 4 blocs utilisent bien `{ ...context.commande, ... }` et jamais une reconstruction manuelle du sous-objet :

```bash
grep -n "commande: { ...context.commande" backend/services/whatsapp-chatbot.js
```
Expected: au moins 4 occurrences (COMMANDE_NOM, COMMANDE_TELEPHONE, COMMANDE_ADRESSE, COMMANDE_ZONE via `envoyerRecapCommande`).

- [ ] **Step 5: Réécrire `envoyerRecapFinal` pour itérer sur `items`**

Remplacer le corps de `envoyerRecapFinal` :

```js
async function envoyerRecapFinal(phone, boutique, commande) {
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces à la livraison', virement: 'Virement' };
  const sousTotal = commande.items.reduce((s, it) => s + (it.prix * it.quantite), 0);
  const total = sousTotal + (commande.frais_livraison || 0);
  const lignes = [`📋 *Récapitulatif de votre commande*`, ``];
  for (const it of commande.items) {
    lignes.push(`🛍️ ${it.nom_produit} × ${it.quantite} — ${prixFmt(it.prix * it.quantite)}`);
  }
  if (commande.frais_livraison) lignes.push(`🚚 Livraison (${commande.zone_nom}) : ${prixFmt(commande.frais_livraison)}`);
  lignes.push(`*Total : ${prixFmt(total)}*`, ``);
  lignes.push(`👤 ${commande.client_nom}`, `📞 ${commande.client_telephone}`, `📍 ${commande.client_adresse}`);
  lignes.push(`💳 Paiement : ${methodeLabel[commande.methode_paiement] || commande.methode_paiement}`);

  await sendWhatsAppText(phone, lignes.join('\n'));
  await sendWhatsAppInteractive(
    phone,
    'Confirmation',
    'Confirmez-vous cette commande ?',
    [{ title: 'Action', rows: [
      { id: 'cmd_confirmer', title: '✅ Confirmer' },
      { id: 'cmd_annuler', title: '✏️ Annuler' },
    ] }]
  );
  await setSession(phone, 'COMMANDE_CONFIRMATION', { boutique, commande });
}
```

**Vérification manuelle attendue pour un panier à 1 article** : la sortie textuelle doit être quasi identique à l'ancienne version (`🛍️ {nom} × {qte} — {prix}` au lieu de deux lignes séparées `🛍️ {nom} × {qte}` puis `💰 {prix}` — léger changement de mise en forme assumé pour rester cohérent avec un panier à plusieurs lignes ; pas un bug).

- [ ] **Step 6: Réécrire `COMMANDE_CONFIRMATION` pour boucler sur `items` et notifier une seule fois**

Remplacer le bloc `if (state === 'COMMANDE_CONFIRMATION') { ... }` :

```js
  if (state === 'COMMANDE_CONFIRMATION') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (interactiveId === 'cmd_annuler' || ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (interactiveId !== 'cmd_confirmer') {
      await sendWhatsAppText(phone, 'Cliquez sur ✅ Confirmer ou ✏️ Annuler ci-dessus.');
      return;
    }
    const c = context.commande;
    const groupeCommande = c.items.length > 1 ? require('crypto').randomUUID() : null;
    const creees = [];
    const echecs = [];
    let boutiqueChargee = boutique;
    for (const item of c.items) {
      try {
        const { commande, boutique: b } = await creerCommandeBoutique({
          boutiqueId: boutique.id,
          produitId: item.produit_id,
          quantite: item.quantite,
          clientNom: c.client_nom,
          clientTelephone: c.client_telephone,
          clientAdresse: c.client_adresse,
          source: 'whatsapp',
          methodePaiement: c.methode_paiement,
          zoneLivraisonId: c.zone_livraison_id || null,
          groupeCommande,
        });
        creees.push(commande);
        boutiqueChargee = b;
      } catch (err) {
        echecs.push({ nom: item.nom_produit, erreur: err.message });
      }
    }

    if (creees.length > 0) {
      if (creees.length === 1) {
        await notifierVendeurCommande(boutiqueChargee, {
          reference: creees[0].reference,
          nomProduit: creees[0].nom_produit,
          quantite: creees[0].quantite,
          montantTotal: Number(creees[0].montant_total),
          fraisLivraison: Number(creees[0].frais_livraison),
          methodePaiement: creees[0].methode_paiement,
          clientNom: creees[0].client_nom,
          clientTelephone: creees[0].client_telephone,
          clientAdresse: creees[0].client_adresse,
          note: creees[0].note,
        });
      } else {
        await notifierVendeurPanierGroupe(boutiqueChargee, creees, groupeCommande);
      }
      const refs = creees.map(c => c.reference).join(', ');
      let msgFinal = `✅ *Commande ${refs} envoyée !*\n\nLe vendeur *${boutique.nom}* va vous contacter pour finaliser le paiement et la livraison.`;
      if (echecs.length > 0) {
        msgFinal += `\n\n⚠️ ${echecs.map(e => e.nom).join(', ')} n'${echecs.length > 1 ? 'ont' : 'a'} pas pu être commandé(s) : ${echecs[0].erreur}.`;
      }
      await sendWhatsAppText(phone, msgFinal);
    } else {
      await sendWhatsAppText(phone, `😕 Impossible de créer la commande : ${echecs[0]?.erreur || 'erreur inconnue'}. Réessayez ou tapez *menu*.`);
    }
    await envoyerMenuBoutique(phone, boutique);
    return;
  }
```

**Note sur `notifierVendeurPanierGroupe`** : cette fonction est définie en Task 4, appelée ici par avance (comme `demarrerCommande`/Task 9 dans le chantier précédent) — `node --check` valide la syntaxe sans exécuter le code, donc cette référence en avant ne casse rien tant que Task 4 suit dans le même passage d'implémentation.

- [ ] **Step 7: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie (silencieux), malgré la référence en avant à `notifierVendeurPanierGroupe` (résolue seulement à l'exécution, pas à la vérification syntaxique).

- [ ] **Step 8: Self-review — vérifier la non-régression du flux mono-produit**

Relire `demarrerCommande` → `COMMANDE_QUANTITE` → `COMMANDE_NOM` → ... → `COMMANDE_CONFIRMATION` pour un cas à un seul produit (le flux « Commander » sur une fiche) : confirmer que `groupeCommande` reste `null` (puisque `c.items.length === 1`), qu'une seule commande est créée, qu'une seule notification simple (pas groupée) est envoyée — comportement observable strictement identique à avant cette tâche.

- [ ] **Step 9: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "refactor(chatbot): généralise le flux de commande pour supporter plusieurs articles" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Détection et traitement du panier Meta (`msg.type === 'order'`)

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js`

**Interfaces:**
- Produces: `async function traiterPanierMeta(phone, order)` — résout les articles du panier, lance la collecte de coordonnées (en sautant `COMMANDE_QUANTITE`).
- Produces: `async function notifierVendeurPanierGroupe(boutique, commandesCreees, groupeCommande)` — notification WhatsApp unique listant tous les articles d'un panier groupé (référencée par avance dans Task 3 Step 6).
- Consumes: `pool`, `sendWhatsAppText`, `setSession`, `prixFmt` (existants). `notifierVendeurCommande` n'est PAS utilisée ici (panier groupé a son propre format de message).

- [ ] **Step 1: Localiser le point d'insertion dans `handleIncoming`**

```bash
grep -n "async function handleIncoming\|Read receipt" backend/services/whatsapp-chatbot.js
```
Le point d'insertion est **avant** la ligne `await sendReadReceipt(msg.id, true).catch(() => {});` — la détection du panier doit être la toute première chose vérifiée dans `handleIncoming`, avant même la déduplication n'a d'importance (la déduplication reste avant, elle protège tous les types de message).

- [ ] **Step 2: Ajouter la détection en tête de `handleIncoming`**

Dans `backend/services/whatsapp-chatbot.js`, dans `handleIncoming`, juste après `const phone = normalisePhone(msg.from);` et la déduplication (`if (await isDuplicate(msg.id)) return;`), avant `await sendReadReceipt(...)`, insérer :

```js
  // ── Panier natif WhatsApp/Meta Commerce (msg.type === 'order') ──────────────
  // Envoyé quand un client utilise le bouton panier natif de WhatsApp depuis une
  // Product Message. Traité en priorité absolue, quel que soit l'état de session
  // en cours — interrompt toute conversation active, comme les mots-clés globaux.
  if (msg.type === 'order' && msg.order) {
    await traiterPanierMeta(phone, msg.order);
    return;
  }
```

- [ ] **Step 3: Ajouter `traiterPanierMeta` avant `handleIncoming`**

Dans `backend/services/whatsapp-chatbot.js`, juste après `envoyerRecapFinal` (modifiée en Task 3) et avant `// ── Dispatcher principal ──`, ajouter :

```js
// ── Panier natif WhatsApp/Meta Commerce ─────────────────────────────────────
// order.product_items = [{ product_retailer_id, quantity, item_price, currency }]
// Le prix envoyé par Meta n'est jamais utilisé — toujours relu depuis boutique_produits
// pour rester fiable (le panier peut dater de plusieurs minutes/heures).
async function traiterPanierMeta(phone, order) {
  const items = Array.isArray(order.product_items) ? order.product_items : [];
  const produitIds = items
    .map(it => {
      const m = String(it.product_retailer_id || '').match(/^nopalou-produit-(.+)$/);
      return m ? { id: m[1], quantite: parseInt(it.quantity, 10) || 1 } : null;
    })
    .filter(Boolean);

  if (!produitIds.length) {
    await sendWhatsAppText(phone, '😕 Ce panier ne contient aucun produit reconnu.');
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  const r = await pool.query(
    `SELECT id, nom, prix, stock_quantite, boutique_id FROM boutique_produits WHERE id = ANY($1::uuid[])`,
    [produitIds.map(p => p.id)]
  );
  const produitsById = new Map(r.rows.map(p => [p.id, p]));

  const itemsValides = [];
  for (const { id, quantite } of produitIds) {
    const p = produitsById.get(id);
    if (p) itemsValides.push({ produit_id: p.id, nom_produit: p.nom, prix: Number(p.prix) || 0, quantite, stock_quantite: p.stock_quantite, boutique_id: p.boutique_id });
  }

  if (!itemsValides.length) {
    await sendWhatsAppText(phone, '😕 Ces produits ne sont plus disponibles.');
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // Tous les articles valides d'un même panier appartiennent à la même boutique
  // (le catalogue Meta d'un client vient d'une seule Product Message à la fois).
  const boutiqueId = itemsValides[0].boutique_id;
  const { rows: [boutique] } = await pool.query(
    'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND actif=true',
    [boutiqueId]
  );
  if (!boutique) {
    await sendWhatsAppText(phone, '😕 Cette boutique n\'est plus disponible.');
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  const itemsBoutique = itemsValides.filter(it => it.boutique_id === boutiqueId);
  await sendWhatsAppText(phone, `🛒 *Panier reçu (${itemsBoutique.length} article${itemsBoutique.length > 1 ? 's' : ''})*\n\nVotre nom complet ?`);
  await setSession(phone, 'COMMANDE_NOM', {
    boutique,
    commande: { items: itemsBoutique.map(({ boutique_id, ...it }) => it) },
  });
}

// Notification vendeur pour un panier groupé (plusieurs commandes liées par groupeCommande).
async function notifierVendeurPanierGroupe(boutique, commandesCreees, groupeCommande) {
  const vendeurTel = boutique.whatsapp || boutique.telephone;
  if (!vendeurTel) return;
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement' };
  const premiere = commandesCreees[0];
  const totalArticles = commandesCreees.reduce((s, c) => s + Number(c.montant_total) - Number(c.frais_livraison || 0), 0);
  const fraisLivraison = Number(premiere.frais_livraison) || 0;
  const total = totalArticles + fraisLivraison;
  const lignesArticles = commandesCreees.map(c => `• ${c.nom_produit} × ${c.quantite} — ${prixFmt(Number(c.prix_unitaire) * c.quantite)}`).join('\n');
  const msg = `🛒 *Nouvelle commande groupée — ${boutique.nom}*\n\nRéf groupe : *${groupeCommande}*\n${lignesArticles}${fraisLivraison > 0 ? `\n🚚 Livraison : ${prixFmt(fraisLivraison)}` : ''}\n💰 *Total : ${prixFmt(total)}*\n💳 Paiement souhaité : ${methodeLabel[premiere.methode_paiement] || premiere.methode_paiement}\n\n👤 Client : ${premiere.client_nom}\n📞 ${premiere.client_telephone}${premiere.client_adresse ? `\n📍 ${premiere.client_adresse}` : ''}\n\n⚡ Répondez vite pour confirmer !`;
  const { sendWhatsAppText: send } = require('./whatsapp');
  send(vendeurTel, msg).catch(() => {});
}
```

**Note sur l'import de `sendWhatsAppText`** : la fonction est déjà importée en tête du fichier (`const { sendWhatsAppText, ... } = require('./whatsapp')`), donc le `require('./whatsapp')` local dans `notifierVendeurPanierGroupe` est redondant — utiliser directement `sendWhatsAppText` (déjà en scope), pas de second require :

```js
  sendWhatsAppText(vendeurTel, msg).catch(() => {});
```
(remplacer les deux dernières lignes de la fonction ci-dessus en conséquence — pas de `const { sendWhatsAppText: send } = require('./whatsapp')`).

- [ ] **Step 4: Vérifier que `demarrerCommande` (flux mono-produit, Task 3) et `traiterPanierMeta` produisent des `items` avec les mêmes clés**

```bash
grep -n "items: \[{" backend/services/whatsapp-chatbot.js
grep -n "items: itemsBoutique.map" backend/services/whatsapp-chatbot.js
```
Confirmer que les deux chemins produisent des objets `{ produit_id, nom_produit, prix, quantite, stock_quantite }` — mêmes noms de clés, pour que `COMMANDE_QUANTITE`/`envoyerRecapFinal`/`COMMANDE_CONFIRMATION` (Task 3) fonctionnent identiquement quelle que soit l'origine du panier.

- [ ] **Step 5: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie.

- [ ] **Step 6: Test isolé (si `.env`/`DATABASE_URL` accessible)**

```bash
node -e "
const { handleIncoming } = require('./backend/services/whatsapp-chatbot');
handleIncoming({
  id: 'test-order-1',
  from: '221770000000',
  type: 'order',
  order: { product_items: [{ product_retailer_id: 'nopalou-produit-00000000-0000-0000-0000-000000000000', quantity: '1' }] },
})
  .then(() => console.log('OK: pas de crash'))
  .catch(e => { console.error('FAIL:', e); process.exit(1); });
"
```
Expected: `OK: pas de crash` (avec un `retailer_id` factice, le produit ne sera pas trouvé — doit aboutir au message « Ces produits ne sont plus disponibles » sans exception). Si `DATABASE_URL` n'est pas accessible dans l'environnement, documenter cette limitation dans le rapport plutôt que d'inventer un résultat.

- [ ] **Step 7: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): traite le panier natif WhatsApp/Meta Commerce (msg.type=order)" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Affichage groupé des commandes côté vendeur (`Commandes.tsx`)

**Files:**
- Modify: `frontend-next/src/app/boutique/Commandes.tsx`

**Interfaces:**
- Consumes: `groupe_commande: string | null` — nouveau champ présent dans la réponse JSON de `listCommandes()` dès que la migration de Task 2 est appliquée (la route backend fait déjà `SELECT *`, aucun changement backend nécessaire pour cette tâche).

- [ ] **Step 1: Ajouter `groupe_commande` à l'interface `Commande`**

Dans `frontend-next/src/app/boutique/Commandes.tsx`, modifier l'interface (actuellement lignes 6-12) :

```tsx
interface Commande {
  id: string; reference: string; nom_produit: string; quantite: number
  prix_unitaire: number; montant_total: number; frais_livraison: number
  client_nom: string; client_telephone: string; client_adresse: string | null
  note: string | null; statut: string; source: string; created_at: string
  methode_paiement: string | null; groupe_commande: string | null
}
```

- [ ] **Step 2: Ajouter la fonction de regroupement avant le composant `Commandes`**

Dans `frontend-next/src/app/boutique/Commandes.tsx`, juste avant `export default function Commandes(...)`, ajouter :

```tsx
// Regroupe les commandes partageant le même groupe_commande (panier multi-articles).
// Les commandes sans groupe (mono-produit, web classique) restent des entrées individuelles.
function regrouperCommandes(commandes: Commande[]): (Commande | Commande[])[] {
  const groupes = new Map<string, Commande[]>()
  const resultat: (Commande | Commande[])[] = []
  for (const c of commandes) {
    if (!c.groupe_commande) { resultat.push(c); continue }
    if (!groupes.has(c.groupe_commande)) {
      const groupe: Commande[] = []
      groupes.set(c.groupe_commande, groupe)
      resultat.push(groupe)
    }
    groupes.get(c.groupe_commande)!.push(c)
  }
  return resultat
}
```

- [ ] **Step 3: Ajouter le composant `CommandeGroupeCard`**

Dans `frontend-next/src/app/boutique/Commandes.tsx`, juste après le composant `CommandeCard` (actuellement se termine ligne 178), ajouter :

```tsx
function CommandeGroupeCard({ commandes, boutiqueId, onUpdate }: { commandes: Commande[]; boutiqueId: string; onUpdate: () => void }) {
  const [open, setOpen] = useState(false)
  const fcfa = (n: number) => n > 0 ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : '—'
  const premiere = commandes[0]
  const total = commandes.reduce((s, c) => s + Number(c.montant_total), 0)
  const statuts = new Set(commandes.map(c => c.statut))
  const statutAffiche = statuts.size === 1 ? premiere.statut : 'mixte'

  return (
    <div style={{ background: '#fff', border: '1px solid #C75B00', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12, background: '#fff7f0' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={{ background: '#C75B00', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            🛒 Panier · {commandes.length} articles
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {statutAffiche === 'mixte' ? 'Statuts multiples' : statutLabel(statutAffiche)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {premiere.client_nom} · {premiere.client_telephone}
              {premiere.source === 'whatsapp' && <span style={{ marginLeft: 6, background: '#dcfce7', color: '#16a34a', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>WhatsApp</span>}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#C75B00' }}>{fcfa(total)}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{fmtDateHeure(premiere.created_at)}</p>
        </div>
        <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 18px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commandes.map(c => (
            <CommandeCard key={c.id} commande={c} boutiqueId={boutiqueId} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Utiliser `regrouperCommandes` dans le rendu final**

Dans `frontend-next/src/app/boutique/Commandes.tsx`, modifier le bloc de rendu final (actuellement lignes 248-254) :

```tsx
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {regrouperCommandes(commandes).map((item, i) =>
            Array.isArray(item)
              ? <CommandeGroupeCard key={item[0].groupe_commande ?? i} commandes={item} boutiqueId={boutiqueId} onUpdate={load} />
              : <CommandeCard key={item.id} commande={item} boutiqueId={boutiqueId} onUpdate={load} />
          )}
        </div>
      )}
```

- [ ] **Step 5: Vérifier la compilation TypeScript**

```bash
cd frontend-next && npx tsc --noEmit
```
Expected: 0 erreur.

- [ ] **Step 6: Self-review — vérifier la non-régression de l'affichage mono-produit**

Confirmer que `regrouperCommandes` retourne bien un `Commande` (pas un tableau) pour toute commande avec `groupe_commande === null` — donc `CommandeCard` (composant existant, inchangé) continue d'être utilisé exactement comme avant pour toutes les commandes actuelles en base (qui ont toutes `groupe_commande === null` puisqu'aucune n'a été créée avec cette colonne avant ce chantier).

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/boutique/Commandes.tsx
git commit -m "feat(boutique): affiche les commandes groupées (panier multi-articles) dans /boutique" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Vérification manuelle de bout en bout en conditions réelles

**Files:** aucun fichier modifié — tâche de vérification uniquement.

**Interfaces:** aucune.

- [ ] **Step 1: Vérification statique finale**

```bash
node --check backend/services/whatsapp-chatbot.js
node --check backend/routes/comptabilite.js
node --check backend/migrate-inline.js
cd frontend-next && npx tsc --noEmit
```
Expected: aucune sortie/erreur sur les quatre commandes.

- [ ] **Step 2: Vérifier que la migration s'applique en conditions réelles**

Si un accès à la base de développement/production est disponible :
```bash
npm run migrate
```
Puis vérifier la colonne :
```sql
SELECT column_name FROM information_schema.columns WHERE table_name='commandes_boutique' AND column_name='groupe_commande';
```
Expected: une ligne retournée.

- [ ] **Step 3: Test manuel du flux mono-produit existant (non-régression)**

Sur WhatsApp réel : entrer dans une boutique → 🛒 Commander sur un produit → suivre le flux jusqu'à confirmation → vérifier :
```sql
SELECT reference, groupe_commande, nom_produit, quantite, montant_total FROM commandes_boutique ORDER BY created_at DESC LIMIT 1;
```
Expected: `groupe_commande` est `NULL`, une seule notification WhatsApp reçue côté vendeur, contenu du message identique à avant ce chantier.

- [ ] **Step 4: Test manuel du panier Meta à un seul article**

Consulter une fiche produit boutique envoyée par le bot → utiliser le bouton panier natif WhatsApp avec 1 article → envoyer le panier → suivre la collecte (nom/téléphone/adresse/zone/paiement/confirmation, sans étape quantité) → vérifier la commande créée (`groupe_commande` NULL, une seule notification).

- [ ] **Step 5: Test manuel du panier Meta à plusieurs articles de la même boutique**

Ajouter 2-3 produits de la même boutique au panier natif WhatsApp → envoyer → suivre la collecte → confirmer → vérifier :
```sql
SELECT reference, groupe_commande, nom_produit, quantite FROM commandes_boutique WHERE groupe_commande IS NOT NULL ORDER BY created_at DESC LIMIT 5;
```
Expected: plusieurs lignes partageant le même `groupe_commande`, une seule notification WhatsApp groupée reçue côté vendeur listant tous les articles, affichage groupé visible dans `/boutique` (onglet Commandes) avec le bon total agrégé.

- [ ] **Step 6: Test manuel d'un panier avec un article invalide**

Si possible, simuler un panier contenant un `retailer_id` inexistant en base (produit supprimé) mélangé à un article valide — vérifier que seul l'article valide aboutit à une commande, sans blocage du panier entier.

- [ ] **Step 7: Vérifier la non-régression de la route web**

Passer une commande via le formulaire web classique (`CommanderModal.tsx` sur `/boutiques/{id}`) → vérifier que la notification vendeur est identique à avant ce chantier (même contenu, immédiate).

- [ ] **Step 8: Documenter les résultats dans CLAUDE.md**

Ajouter une entrée d'état de projet en tête du fichier `CLAUDE.md`, résumant ce qui a été livré et vérifié en réel (lister précisément les points des Steps 3 à 7 confirmés vs en échec), suivant le style des entrées « État du projet » déjà présentes dans ce fichier.

- [ ] **Step 9: Commit final**

```bash
git add -A
git commit -m "docs: documente la livraison du traitement du panier natif WhatsApp/Meta Commerce" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

Si des ajustements de code ont été nécessaires pendant la vérification, les inclure dans ce commit avec un message adapté.

---

## Notes de cohérence entre tâches

- `notifierVendeurPanierGroupe` est appelée dans Task 3 (Step 6) mais définie dans Task 4 — comme pour `demarrerCommande`/Task 9 du chantier précédent, `node --check` valide la syntaxe sans exécuter le code, donc cet ordre d'écriture ne casse rien tant que Task 4 suit Task 3 dans la même session d'implémentation.
- Toutes les nouvelles fonctions (`notifierVendeurCommande`, `traiterPanierMeta`, `notifierVendeurPanierGroupe`) sont exportées ou internes selon leur usage : `notifierVendeurCommande` est exportée depuis `comptabilite.js` (potentiellement réutilisable par d'autres appelants futurs) ; `traiterPanierMeta`/`notifierVendeurPanierGroupe` restent internes à `whatsapp-chatbot.js`, cohérent avec `module.exports = { handleIncoming, cleanupOldMessages, resetInactiveSessions, handleSearchQuery }` existant, qu'aucune tâche ne modifie.
- Le format `items: [{ produit_id, nom_produit, prix, quantite, stock_quantite }]` est la même forme, que la commande vienne du flux « Commander » classique (Task 3, `demarrerCommande`) ou d'un panier Meta (Task 4, `traiterPanierMeta`) — garanti identique par construction (mêmes noms de clés dans les deux fonctions), vérifié explicitement en Task 4 Step 4.
