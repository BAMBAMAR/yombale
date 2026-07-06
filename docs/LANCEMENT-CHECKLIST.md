# Checklist de mise en production — Nopalou

État du code au 2 juillet 2026 : **backend et frontend complets**. Tout ce qui suit est de la configuration externe, à cocher au fur et à mesure. Aucune ligne de code à écrire.

## 🔴 Immédiat — variables Render

- [x] `ORANGE_WEBHOOK_SECRET` — demander à Orange, ou générer une valeur aléatoire si pas de HMAC Orange
- [x] `HASHIDS_SALT` — générer : `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`

## 🟠 Urgent (30 min chacun)

- [ ] **Wave** — ⚠️ bloqué : pas encore de compte Wave Business. Créer sur business.wave.com (KYC : pièce d'identité + RCCM/NINEA si activité formelle), puis dans le dashboard Développeur : déclarer `https://<votre-app>.onrender.com/api/paiement/wave/webhook` → copier `WAVE_WEBHOOK_SECRET` dans Render
- [x] **Resend / DNS** : domaine `nopalou.com` vérifié sur resend.com/domains (Cloudflare, depuis le 15 juin) → à confirmer : `EMAIL_FROM=Nopalou <noreply@nopalou.com>` bien réglé sur Render (pas `onboarding@resend.dev`)
- [ ] **Orange Money** — ⚠️ bloqué : pas encore de compte marchand. Ouvrir un compte marchand Orange Money Sénégal (agence Orange ou espace pro en ligne), obtenir les identifiants API/webpay, puis déclarer `https://<votre-app>.onrender.com/api/paiement/orange/webhook` dans le dashboard → ajouter le secret HMAC si fourni

## 🟢 Meta WhatsApp — RÉSOLU le 6 juillet 2026, fonctionnel en production

Tous les points ci-dessous sont clos. Réception de vrais messages, réponses chatbot,
et notifications de validation d'annonces (carousel + fallback texte) confirmées en
conditions réelles. Voir la section "État du projet (6 juillet 2026)" dans `CLAUDE.md`
pour le détail des bugs trouvés et corrigés pendant la vérification finale.

1. [x] App Meta créée, produit WhatsApp ajouté, **app publiée** (vérification d'entreprise
   SKYROAD SARL terminée le 4 juillet, moyen de paiement ajouté et app publiée le 5 juillet)
2. [x] Token système permanent généré et configuré (`WHATSAPP_API_TOKEN`)
3. [x] Toutes les variables Render configurées et vérifiées via `/api/whatsapp/admin/status` :
   - `WHATSAPP_PHONE_NUMBER_ID` ✅ — **corrigé le 6 juillet** : pointait vers le numéro de
     test (`1178090512058107`) au lieu du vrai numéro `+221 70 87179 42` (`1239035322623638`)
   - `WHATSAPP_API_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `BACKEND_URL` ✅
   - `WHATSAPP_CATALOG_ID` — optionnel, toujours pas configuré (sync catalogue Meta non testée)
4. [x] Webhook déclaré et validé, abonné au champ `messages`
5. [x] **Piège découvert le 6 juillet** : deux WABA distincts existent sous ce Business
   Manager (un de test, un de production) — l'app était abonnée au mauvais WABA
   (`GET /v19.0/{waba_id}/subscribed_apps` renvoyait `{"data":[]}` sur le vrai WABA de
   prod `901008702321523`). Réabonnée manuellement via `POST /v19.0/901008702321523/subscribed_apps`.
6. [x] Numéro `+221 70 87179 42` enregistré et vérifié (`code_verification_status: VERIFIED`)
   dans le bon WABA — le blocage "déjà enregistré" documenté ici concernait l'ancien
   numéro de test, résolu par la migration vers le vrai numéro de prod.
7. [x] Templates soumis et approuvés — voir [docs/WHATSAPP-TEMPLATES.md](WHATSAPP-TEMPLATES.md) :
   - `nopalou_carousel_annonce`, `nopalou_carousel_immo`, `nopalou_carousel_telecoms`, `nopalou_fiche_texte` ✅
   - **Bug de code corrigé le 6 juillet** (pas un problème Meta) : le paramètre du bouton
     dynamique envoyait un chemin (`immo/<id>`) ou l'URL complète au lieu de l'id brut
     attendu par Meta, cassant systématiquement le lien (404) ou faisant échouer l'envoi
     entier. Voir section "Piège vécu" dans `WHATSAPP-TEMPLATES.md`.

## 🟢 Optionnel

- [ ] Scraper Facebook immo : `FB_EMAIL` + `FB_PASSWORD` sur Render
- [ ] Sync initiale catalogue Meta (produits boutiques déjà en base)

## Vérification finale

- [ ] Ouvrir `/admin/whatsapp` → la checklist doit passer entièrement au vert
- [ ] Faire un paiement test réel via Wave → vérifier la mise à jour en base (`commandes`)
- [ ] Faire un paiement test réel via Orange Money → idem
- [x] Envoyer un message WhatsApp au numéro Nopalou → vérifier la réponse du chatbot (confirmé le 6 juillet 2026)
- [ ] Vérifier réception d'un email transactionnel (inscription/reset mdp)
