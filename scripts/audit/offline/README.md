# Kit d'audit hors-ligne / PWA / parcours E2E / WhatsApp (audit du 30/09/2026)

Rapport : `docs/AUDIT-OFFLINE-PWA-2026-09-30.md` — plan : `docs/PLAN-CORRECTION-OFFLINE-PWA-2026-09-30.md`.
Environnement isolé obligatoire (voir `../README.md`) : base locale `nopalou_audit`, garde réseau, clés factices. Aucun test ici ne touche la production.

## Préparation (une fois par session)

1. `powershell -File scripts\audit\check-pg.ps1`, puis démarrer le backend d'audit (`start-stack.ps1`, sans `-Frontend`).
2. **Frontend en production** (le Service Worker est désactivé en mode dev) :
   `. scripts\audit\audit-env.ps1; $env:NODE_ENV='production'; $env:BACKEND_URL='http://127.0.0.1:4100'; $env:NEXT_PUBLIC_BACKEND_URL='http://127.0.0.1:4100'; cd frontend-next; npm run build; npx next start -p 3001`
   Le build **régénère `frontend-next/public/sw.js` (fichier suivi)** : `git checkout -- frontend-next/public/sw.js` après l'audit.
3. `node scripts/audit/offline/01-setup.js` crée le marchand M (essai actif), la boutique X (abonnement expiré), l'acheteur Z, des produits et un client de carnet (état dans `scripts/audit/.local/offline-state.json`, ignoré par git).
4. Variables : `$env:AUDIT_TMP` = dossier temporaire contenant une copie de `q.js` (accès SQL local, refuse toute base non locale) ; pour les tests du panier, `$env:AUDIT_BASE='http://localhost:3001'` (le panier appelle le backend en URL absolue, et le CORS d'audit n'autorise que `localhost:3001`).
5. Redémarrer le backend d'audit entre deux gros balayages (limiteur de 1 000 requêtes / 15 min : sinon HTTP 429 sur la connexion).

## Tests (chaque script imprime un JSON de preuves)

| Script | Prouve |
|---|---|
| `t01-anon-sw`, `t01b-precache`, `t01c-httpcache` | SW, précache supprimé à l'activation, page morte hors-ligne sans cache HTTP, recherche périmée |
| `t03`, `t04a/b/c`, `t05e` | rechargement sur `online` (source, contrôle par mutation) |
| `t05a` à `t05d`, `t06`, `t07` | caisse hors-ligne : file, reprise, ticket perdu, entrée `syncing` bloquée |
| `t08` | données privées restantes après déconnexion |
| `t09` | vente refusée par le serveur affichée comme réussie |
| `t10` | carnet : dette d'un client créé hors-ligne |
| `t11`, `t11b` (+ `delay-proxy.mjs` sur :3002) | contenu périmé en réseau lent |
| `t12`, `t12b` | panier → commande → message WhatsApp, prix périmé |
| `t13`, `t13b`, `t13c` (+ `bot-harness.js`) | chatbot WhatsApp réel contre la base locale, envoi Meta capturé |
| `t14` | idempotence sous concurrence |
| `t12c` | commande « WhatsApp Direct » hors-ligne puis reconnexion, prix modifié avant validation |
| `t13d` | lien 1-clic du bot (panier de plusieurs articles / d'un article) |
| `t22` | clôture Z par l'interface |
| `t23` | vente hors-ligne refusée à la synchronisation : bannière, « Renvoyer » |
| `restock.js` | remet le stock des produits de test (à lancer avant les tests de panier) |
| `t20a` à `t20g`, `t21` | E2E : inscription, recherche, pages, annonce, chat, Wave, administration, immobilier, impression |

## Limites connues

Chromium headless (pas d'appareil réel) ; `window.open`/`print` neutralisés dans les tests de caisse (l'impression provoque sinon le rechargement décrit en AUD-087) ; `page.route` n'intercepte pas les requêtes qui passent par le Service Worker, d'où le proxy de délai ; l'émulation réseau CDP ne s'applique pas aux requêtes faites par le Service Worker.
