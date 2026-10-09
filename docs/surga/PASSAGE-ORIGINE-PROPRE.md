# Passage de Surga à sa propre adresse (`surga.nopalou.com`)

Décision D83 du 2026-10-09. Ce document dit ce qui est prêt dans le code, ce qui reste à faire chez Cloudflare et Render, comment vérifier, et comment revenir en arrière.

## Pourquoi

À `nopalou.com/surga`, Surga est une page de l'application Nopalou, qui couvre tout `nopalou.com`. Quand Nopalou est installé, le navigateur ne propose pas d'installer Surga, lui attribue ses notifications, et peut ouvrir ses liens dans Nopalou. Deux adresses distinctes règlent les trois points.

## Ce qui change pour l'utilisateur

| Avant | Après |
|---|---|
| `nopalou.com/surga` | `surga.nopalou.com/surga` (taper `surga.nopalou.com` suffit) |
| `surga.nopalou.com` renvoie vers Nopalou | `nopalou.com/surga` renvoie vers Surga |

- **Compte connecté sur Nopalou** : il arrive connecté sur Surga, sans se reconnecter.
- **Données gardées sur l'appareil** (réglages, notes et dépenses pas encore envoyées, portefeuille Sama Xaalis) : reprises une fois, à la première ouverture de la nouvelle adresse, sur le même appareil et le même navigateur. Rien n'est effacé à l'ancienne adresse.
- **Application déjà installée** (Surga, ou Nopalou utilisé pour ouvrir Surga) : elle renvoie vers la nouvelle adresse, qui s'ouvre dans le navigateur. Il faut installer Surga depuis la nouvelle adresse.
- **Notifications** : à réactiver une fois dans Surga à la nouvelle adresse. Les rappels déjà activés continuent d'arriver par l'ancienne adresse tant que l'ancienne application n'est pas retirée.
- **Avis automatique** : un site ne peut ni installer ni désinstaller une application à la place de la personne. Qui utilisait déjà Surga à l'ancienne adresse voit donc, à la nouvelle, l'avis « Surga a une nouvelle adresse » avec les boutons « Installer Surga » et « Réactiver les rappels » (`SurgaAvisNouvelleAdresse.tsx`). Il revient à chaque ouverture jusqu'à l'installation, ou jusqu'à cinq fermetures. Non vu à l'écran : écrit et testé en logique seulement.

## Ce qui est prêt dans le code

Tout est derrière la variable `NEXT_PUBLIC_SURGA_ORIGINE` du frontend. Tant qu'elle est vide, rien ne change.

- Renvois : `frontend-next/src/lib/surga-adresse.ts` (`renvoiOrigineSurga`) et `frontend-next/src/middleware.ts`.
- Session : cookie `nopalou_session_passage`, deux minutes, domaine `.nopalou.com`, converti en session à l'arrivée puis retiré.
- Données de l'appareil : `frontend-next/src/lib/surga-reprise.ts`, page `/surga/reprise`, composant `SurgaRepriseAppareil.tsx`.
- Service worker et manifeste : inchangés, portée `/surga` aux deux adresses.

## Ce qui reste à faire, dans cet ordre

1. **Render, service `nopalou-frontend`** : Settings, Custom Domains, ajouter `surga.nopalou.com`. Render indique la cible à pointer.
2. **Cloudflare, DNS** : l'enregistrement `surga` doit pointer vers la cible donnée par Render (CNAME).
3. **Cloudflare, règles** : désactiver la règle de redirection « Surga sous-domaine ». Tant qu'elle est active, le sous-domaine renvoie vers Nopalou et l'application n'y est jamais servie.
4. **Vérifier avant d'activer** : `https://surga.nopalou.com/` doit répondre par un renvoi **307** vers `https://nopalou.com/surga`. Le code 307 prouve que c'est l'application qui répond ; un 302 signifie que la règle Cloudflare de l'étape 3 est encore active.
5. **Render, variables du frontend** : poser `NEXT_PUBLIC_SURGA_ORIGINE` à `https://surga.nopalou.com`, puis redéployer (la variable est lue à la construction).
6. **Vider le cache Cloudflare.**

## Vérifier après l'activation

- `https://nopalou.com/surga` renvoie vers `https://surga.nopalou.com/surga`.
- `https://surga.nopalou.com` ouvre Surga.
- Connecté sur Nopalou, puis ouverture de Surga : le compte est reconnu sans reconnexion.
- Sur un téléphone qui utilisait Surga : réglages et portefeuille présents à la nouvelle adresse.
- Dans Chrome, Nopalou installé : l'icône d'installation apparaît à `surga.nopalou.com/surga`.
- Un paiement Wave revient sur Surga avec son message (le retour passe par l'ancienne adresse, puis le renvoi).

## Revenir en arrière

Vider `NEXT_PUBLIC_SURGA_ORIGINE` chez Render et redéployer : Surga est de nouveau servie à `nopalou.com/surga`, où ses données n'ont pas été touchées. Réactiver la règle Cloudflare remet le renvoi du sous-domaine.

## Ce qui n'a pas été vérifié

- Rien n'a été essayé en production ni derrière Cloudflare et Render. L'essai a été fait en local, avec deux adresses de test (`nopalou.test` et `surga.nopalou.test`), en invité et en compte connecté.
- Le service worker et l'installation n'ont pas pu être essayés en local (adresses de test sans HTTPS). Le manifeste, lui, est lu sans obstacle à la nouvelle adresse.
- La reprise des données dépend du navigateur : elle passe par un cadre invisible entre les deux adresses. Essayée dans Chromium seulement ; Safari sur iPhone n'a pas été essayé.
- Les notifications déjà activées restent rattachées à l'ancienne adresse.
- Le cookie de passage est lisible pendant deux minutes par tout sous-domaine de `nopalou.com`.
