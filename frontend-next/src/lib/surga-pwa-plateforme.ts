// Appareil et navigateur de la personne, pour lui montrer le bon chemin d'installation de Surga.
// Tout le monde n'a pas Safari : l'iPhone, Android (Chrome, Samsung Internet, Firefox), l'ordinateur et les navigateurs
// intégrés des applications (Facebook, Instagram, TikTok…) n'ont pas les mêmes boutons.

export type Plateforme =
  | 'ios-safari'
  | 'ios-autre'
  | 'android-chrome'
  | 'android-samsung'
  | 'android-firefox'
  | 'navigateur-integre'
  | 'bureau-chrome'
  | 'bureau-edge'
  | 'bureau-safari'
  | 'bureau-firefox'
  | 'inconnu'

const NAVIGATEUR_INTEGRE = /FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|TikTok|musical_ly|BytedanceWebview|Snapchat|Twitter|LinkedInApp|; wv\)/i

export function detecterPlateforme(ua: string, options: { maxTouchPoints?: number } = {}): Plateforme {
  if (!ua) return 'inconnu'
  if (NAVIGATEUR_INTEGRE.test(ua)) return 'navigateur-integre'

  // iPad récent : il se présente comme un Mac, mais il a un écran tactile.
  const estIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (options.maxTouchPoints ?? 0) > 1)
  if (estIOS) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) return 'ios-autre'
    return /Safari/i.test(ua) ? 'ios-safari' : 'navigateur-integre'
  }

  if (/Android/i.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) return 'android-samsung'
    if (/Firefox/i.test(ua)) return 'android-firefox'
    return 'android-chrome'
  }

  if (/Edg\//i.test(ua)) return 'bureau-edge'
  if (/Firefox/i.test(ua)) return 'bureau-firefox'
  if (/Chrome|Chromium|OPR\//i.test(ua)) return 'bureau-chrome'
  if (/Safari/i.test(ua)) return 'bureau-safari'
  return 'inconnu'
}

// Une étape s'écrit en texte avec **gras** et des repères d'icône : [[partager]], [[menu]], [[menu-horizontal]], [[telephone]], [[installer]].
export interface GuidePlateforme {
  sousTitre: string
  intro?: string
  etapes: string[]
  /** Dernière ligne rassurante (carte verte). */
  fin: string
  /** Piste de secours quand le navigateur ne propose pas l’installation (ex. Nopalou est déjà installé). */
  astuce?: string
  /** Montrer le bouton « Copier le lien » (navigateur intégré, ou navigateur sans installation). */
  copierLien?: boolean
}

export const GUIDES: Record<Plateforme, GuidePlateforme> = {
  'ios-safari': {
    sousTitre: 'Sur iPhone ou iPad (Safari)',
    etapes: [
      'Touchez le bouton **Partager** [[partager]] au bas de l’écran (ou en haut sur iPad).',
      'Faites défiler et choisissez **« Sur l’écran d’accueil »** [[telephone]].',
    ],
    fin: 'Touchez **Ajouter** en haut à droite : Surga apparaît sur votre écran d’accueil avec sa propre icône.',
  },
  'ios-autre': {
    sousTitre: 'Sur iPhone ou iPad (Chrome, Firefox, Edge)',
    intro: 'Vous utilisez un autre navigateur que Safari : le chemin est presque le même.',
    etapes: [
      'Touchez **Partager** [[partager]] dans la barre d’adresse, ou le menu [[menu-horizontal]] puis **Partager**.',
      'Choisissez **« Sur l’écran d’accueil »** [[telephone]]. Si vous ne le voyez pas, ouvrez ce lien dans **Safari**.',
    ],
    fin: 'Touchez **Ajouter** : Surga apparaît sur votre écran d’accueil avec sa propre icône.',
    copierLien: true,
  },
  'android-chrome': {
    sousTitre: 'Sur Android (Chrome)',
    etapes: [
      'Touchez le menu [[menu]] en haut à droite de Chrome.',
      'Choisissez **« Installer l’application »** [[installer]] (ou **« Ajouter à l’écran d’accueil »**).',
    ],
    fin: 'Confirmez avec **Installer** : Surga apparaît dans vos applications, avec sa propre icône.',
    astuce: 'Nopalou est déjà installé sur ce téléphone ? Chrome traite alors Surga comme une page de Nopalou et ne la propose pas de lui-même : passez par le menu [[menu]] et **« Ajouter à l’écran d’accueil »**. Surga peut s’ouvrir dans la fenêtre de Nopalou.',
  },
  'android-samsung': {
    sousTitre: 'Sur Android (Samsung Internet)',
    etapes: [
      'Touchez le menu **≡** en bas à droite de l’écran.',
      'Choisissez **« Ajouter la page à »**, puis **« Écran d’accueil »** [[telephone]].',
    ],
    fin: 'Confirmez avec **Ajouter** : Surga apparaît sur votre écran d’accueil.',
  },
  'android-firefox': {
    sousTitre: 'Sur Android (Firefox)',
    etapes: [
      'Touchez le menu [[menu]] de Firefox.',
      'Choisissez **« Installer »** [[installer]].',
    ],
    fin: 'Confirmez avec **Ajouter** : Surga apparaît sur votre écran d’accueil.',
  },
  'navigateur-integre': {
    sousTitre: 'Ouvrez Surga dans votre navigateur',
    intro: 'Vous êtes dans le navigateur d’une autre application (Facebook, Instagram, TikTok…) : il ne permet pas d’installer Surga.',
    etapes: [
      'Touchez le menu [[menu]] ou [[menu-horizontal]] de cette page, puis **« Ouvrir dans le navigateur »** (Chrome ou Safari).',
      'Vous pouvez aussi copier le lien ci-dessous et le coller dans Chrome ou Safari.',
    ],
    fin: 'Une fois dans Chrome ou Safari, rouvrez ce guide : il vous montrera les bons boutons.',
    copierLien: true,
  },
  'bureau-chrome': {
    sousTitre: 'Sur ordinateur (Chrome)',
    etapes: [
      'Cherchez l’icône **Installer** [[installer]] tout à droite de la barre d’adresse.',
      'Elle n’y est pas ? Ouvrez le menu [[menu]] en haut à droite, puis **« Caster, enregistrer et partager »**, puis **« Installer la page en tant qu’appli… »** (ou **« Installer Surga… »**).',
    ],
    fin: 'Confirmez avec **Installer** : Surga s’ouvre dans sa propre fenêtre, avec une icône sur votre bureau.',
    // Libellés du menu relevés en 2024 (Chrome 124 et suivants) ; l'ancien « Créer un raccourci… / Ouvrir dans une fenêtre » n'existe plus.
    astuce: 'Nopalou est déjà installé sur cet ordinateur ? Chrome traite alors Surga comme une page de Nopalou : l’icône de la barre d’adresse n’apparaît pas, il faut passer par le menu (étape 2). Si le menu propose seulement **« Ouvrir dans Nopalou »**, Surga s’ouvre dans l’application Nopalou.',
  },
  'bureau-edge': {
    sousTitre: 'Sur ordinateur (Edge)',
    etapes: [
      'Cherchez l’icône **Application disponible** [[installer]] à droite de la barre d’adresse.',
      'Elle n’y est pas ? Ouvrez le menu [[menu-horizontal]] en haut à droite, puis **« Autres outils »**, **« Applications »** (ou « Apps »), puis **« Installer ce site en tant qu’application »**.',
    ],
    fin: 'Confirmez avec **Installer** : Surga s’ouvre dans sa propre fenêtre.',
    // Chemin de la page d'aide de Microsoft (« Paramètres et plus », « Autres outils », « Apps »).
    astuce: 'Nopalou est déjà installé sur cet ordinateur ? Edge traite alors Surga comme une page de Nopalou : l’icône de la barre d’adresse n’apparaît pas, il faut passer par le menu (étape 2).',
  },
  'bureau-safari': {
    sousTitre: 'Sur Mac (Safari)',
    etapes: [
      'Dans la barre des menus de Safari, ouvrez **Fichier**.',
      'Choisissez **« Ajouter au Dock »** [[installer]] (Safari 17 ou plus récent).',
    ],
    fin: 'Confirmez avec **Ajouter** : Surga apparaît dans votre Dock comme une application.',
  },
  'bureau-firefox': {
    sousTitre: 'Sur ordinateur (Firefox)',
    intro: 'Firefox ne permet pas d’installer Surga comme une application sur ordinateur.',
    etapes: [
      'Ouvrez le lien ci-dessous dans **Chrome** ou **Edge** pour l’installer.',
      'Sinon, ajoutez cette page à vos favoris avec **Ctrl + D** : elle s’ouvrira en un clic.',
    ],
    fin: 'Sur téléphone, l’installation est possible depuis Chrome (Android) ou Safari (iPhone).',
    copierLien: true,
  },
  inconnu: {
    sousTitre: 'Installer Surga',
    intro: 'Le chemin dépend de votre navigateur. Cherchez dans son menu l’une de ces entrées :',
    etapes: [
      '**« Installer l’application »**, **« Ajouter à l’écran d’accueil »** ou **« Sur l’écran d’accueil »**.',
      'Si vous ne les voyez pas, ouvrez le lien ci-dessous dans **Chrome** (Android, ordinateur) ou **Safari** (iPhone).',
    ],
    fin: 'Une fois installée, Surga s’ouvre comme une vraie application, même sans connexion.',
    copierLien: true,
  },
}
