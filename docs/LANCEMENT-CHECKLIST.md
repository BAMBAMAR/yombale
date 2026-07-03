# Checklist de mise en production — Nopalou

État du code au 2 juillet 2026 : **backend et frontend complets**. Tout ce qui suit est de la configuration externe, à cocher au fur et à mesure. Aucune ligne de code à écrire.

## 🔴 Immédiat — variables Render

- [x] `ORANGE_WEBHOOK_SECRET` — demander à Orange, ou générer une valeur aléatoire si pas de HMAC Orange
- [x] `HASHIDS_SALT` — générer : `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`

## 🟠 Urgent (30 min chacun)

- [ ] **Wave** — ⚠️ bloqué : pas encore de compte Wave Business. Créer sur business.wave.com (KYC : pièce d'identité + RCCM/NINEA si activité formelle), puis dans le dashboard Développeur : déclarer `https://<votre-app>.onrender.com/api/paiement/wave/webhook` → copier `WAVE_WEBHOOK_SECRET` dans Render
- [x] **Resend / DNS** : domaine `nopalou.com` vérifié sur resend.com/domains (Cloudflare, depuis le 15 juin) → à confirmer : `EMAIL_FROM=Nopalou <noreply@nopalou.com>` bien réglé sur Render (pas `onboarding@resend.dev`)
- [ ] **Orange Money** — ⚠️ bloqué : pas encore de compte marchand. Ouvrir un compte marchand Orange Money Sénégal (agence Orange ou espace pro en ligne), obtenir les identifiants API/webpay, puis déclarer `https://<votre-app>.onrender.com/api/paiement/orange/webhook` dans le dashboard → ajouter le secret HMAC si fourni

## 🟡 Meta WhatsApp — état détaillé (mis à jour 3 juillet 2026)

1. [x] App Meta créée, produit WhatsApp ajouté, numéro de test fonctionnel
2. [x] Token système permanent généré et configuré (`WHATSAPP_API_TOKEN`) — scopes `whatsapp_business_messaging` + `whatsapp_business_management`
3. [x] Toutes les variables Render configurées et vérifiées via `/api/whatsapp/admin/status` :
   - `WHATSAPP_PHONE_NUMBER_ID` ✅
   - `WHATSAPP_API_TOKEN` ✅ (permanent)
   - `WHATSAPP_APP_SECRET` ✅ (corrigé le 3 juillet — était absent, trou de sécurité HMAC comblé)
   - `WHATSAPP_VERIFY_TOKEN` ✅
   - `BACKEND_URL` ✅ (corrigé le 3 juillet — était `undefined`, cassait l'URL webhook affichée)
   - `WHATSAPP_CATALOG_ID` — optionnel, pas encore configuré
4. [x] Webhook déclaré et validé côté Meta (URL + Verify Token), abonné au champ `messages`
5. [x] Bugs chatbot corrigés et déployés : contrainte UNIQUE manquante sur `alertes`, déclenchement des alertes WhatsApp par nom de produit, colonne `processed_at` dans `/admin/status`
6. [ ] **⚠️ BLOQUANT** — Le numéro de test est encore lié à un ancien compte WhatsApp personnel : message Meta *"Ce numéro de téléphone est déjà enregistré dans un compte WhatsApp"*. Procédure de déblocage :
   a. Réinstaller WhatsApp (app normale) sur ce numéro
   b. Paramètres → Compte → **Supprimer mon compte** (pas juste désinstaller l'app)
   c. Attendre quelques heures à 24h (délai réel souvent supérieur aux "3 minutes" annoncées)
   d. Réessayer l'enregistrement du numéro côté Meta for Developers
7. [ ] **⚠️ Constat important** : tant que l'app Meta n'est pas **publiée**, les vrais messages WhatsApp entrants (envoyés depuis un vrai téléphone, même testeur) ne sont PAS transmis au webhook — seul le bouton "Test" du dashboard Meta simule un événement. La publication nécessite la vérification d'entreprise (étape 8).
8. [~] Vérification d'entreprise Business Manager (business.facebook.com → Centre de vérification) — nom légal, adresse, RCCM/NINEA. **En cours** (soumise, délai 1-3 jours ouvrés). Indépendante du blocage du numéro (étape 6), peut être lancée en parallèle.
9. [ ] Publier l'app Meta une fois vérification + numéro + moyen de paiement (pour messages business-initiated) réglés
10. [x] 4 templates soumis à Meta (approbation 24-48h en cours) — voir [docs/WHATSAPP-TEMPLATES.md](WHATSAPP-TEMPLATES.md) :
    - `nopalou_carousel_annonce` ✅
    - `nopalou_carousel_immo` ✅
    - `nopalou_carousel_telecoms` ✅ (nom réel avec "s", code aligné — le premier essai sans "s" a un contenu erroné et reste en attente chez Meta, sans impact)
    - `nopalou_fiche_texte` ✅

## 🟢 Optionnel

- [ ] Scraper Facebook immo : `FB_EMAIL` + `FB_PASSWORD` sur Render
- [ ] Sync initiale catalogue Meta (produits boutiques déjà en base)

## Vérification finale

- [ ] Ouvrir `/admin/whatsapp` → la checklist doit passer entièrement au vert
- [ ] Faire un paiement test réel via Wave → vérifier la mise à jour en base (`commandes`)
- [ ] Faire un paiement test réel via Orange Money → idem
- [ ] Envoyer un message WhatsApp au numéro Nopalou → vérifier la réponse du chatbot
- [ ] Vérifier réception d'un email transactionnel (inscription/reset mdp)
