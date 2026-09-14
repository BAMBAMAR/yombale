import { fcfa } from '@/lib/format'
import { CategorieCommerce, MatriceCommerce, QuizQuestion } from './types'

export function getMatriceData(prixPro: number): Record<CategorieCommerce, MatriceCommerce> {
  return {
    mode: {
      label: 'Mode, Prêt-à-Porter & Chaussures',
      category: 'mode',
      sans_app: {
        pitch: `« Bonjour ! Vous vendez de magnifiques vêtements. Aujourd'hui, quand une cliente vous demande vos modèles et tailles sur WhatsApp, vous perdez du temps à chercher et renvoyer les photos une par une. Avec Nopalou, vous avez votre vitrine en ligne avec vos tailles/couleurs, et vos clientes commandent directement sur votre WhatsApp. Le 1er mois est 100% offert, je vous montre en 1 minute ? »`,
        diagnostic: [
          'Combien de temps passez-vous par jour à envoyer photos et prix sur WhatsApp ?',
          "Comment gérez-vous les réservations de robes ou chaussures qui ne sont finalement pas récupérées ?",
          "Avez-vous déjà oublié une dette ou une avance d'une cliente ?",
        ],
        demo: 'Créer un article "Robe Soirée" avec 3 tailles (S, M, L) et 2 couleurs en 20 secondes, puis générer la Story HD marque blanche pour WhatsApp.',
        objection: {
          q: '« Je vends très bien sur mon statut WhatsApp actuel »',
          r: '« C\'est justement un outil pour décupler vos ventes WhatsApp ! En 1 clic, vos clientes commandent directement sur votre numéro, et vous demandez votre bilan de la journée en tapant simplement « Bilan » sur WhatsApp. »',
        },
        closing: '« On active votre boutique par WhatsApp en 30 secondes chrono ? C\'est 100% offert pendant 30 jours ! »',
      },
      avec_app: {
        pitch: `« Bonjour ! Vous utilisez déjà un site ou un logiciel (Shopify, WooCommerce, Excel...), mais vous perdez du temps avec des outils complexes et des commissions élevées. Avec Nopalou, vous importez tout votre catalogue en 1 seul clic sans aucune ressaisie, et vous encaissez directement par Wave en FCFA avec 0% de commission. »`,
        diagnostic: [
          'Combien payez-vous chaque mois en devises pour Shopify ou l\'hébergement ?',
          'Pouvez-vous voir votre chiffre d\'affaires instantanément sur WhatsApp par un simple message ?',
          'Comment gérez-vous vos dettes clients et les encaissements Wave locaux ?',
        ],
        demo: 'Démonstration de l\'import intelligent multi-plateformes : glisser-déposer un export Shopify/Excel et voir tous les articles créés en 3 secondes.',
        objection: {
          q: '« Je ne veux pas perdre mon catalogue existant »',
          r: '« Vous ne perdez rien du tout ! Notre moteur d\'import intelligent transfère automatiquement tous vos produits, prix et photos en 1 clic. Vous pouvez tester en parallèle pendant 30 jours sans risque. »',
        },
        closing: '« Importons votre fichier de produits maintenant : vous verrez votre vitrine Nopalou prête dans 1 minute ! »',
      },
    },
    tech: {
      label: 'Téléphonie, High-Tech & Accessoires',
      category: 'tech',
      sans_app: {
        pitch: `« Bonjour chef ! Dans la téléphonie, les prix changent vite et la concurrence est rude à Dakar. Avec Nopalou, votre boutique est visible sur le comparateur N°1 au Sénégal, vous scannez les codes-barres par caméra et vous gérez vos garanties et dettes clients sans carnet papier. 1er mois offert ! »`,
        diagnostic: [
          'Comment faites-vous pour que les acheteurs de Dakar trouvent vos prix face aux autres boutiques ?',
          'Comment enregistrez-vous les numéros IMEI et les garanties des téléphones vendus ?',
          'Comment suivez-vous les réparations ou accessoires pris à crédit ?',
        ],
        demo: 'Scanner le code-barres d\'un carton de téléphone avec la caméra du smartphone en 0.5 seconde et afficher la fiche prix instantanément.',
        objection: {
          q: '« Tout est dans ma tête et sur mon carnet de stock »',
          r: '« Votre tête vaut de l\'or chef ! Mais si vous n\'êtes pas à la boutique ou si vous confiez la vente à un apprenti, les erreurs arrivent vite. Nopalou sécurise chaque franc. »',
        },
        closing: '« On scanne 2 téléphones pour tester la vitesse de caisse ? Ça prend 30 secondes chrono. »',
      },
      avec_app: {
        pitch: `« Bonjour ! Vous avez déjà un système de caisse, mais êtes-vous référencé sur le comparateur de prix le plus visité du Sénégal ? Nopalou vous apporte de nouveaux clients qualifiés prêts à acheter et offre 3 scanners (Caméra, Cloud, USB) à seulement ${fcfa(prixPro)}/mois. »`,
        diagnostic: [
          'Votre outil actuel vous amène-t-il de nouveaux clients chaque jour ?',
          'Fonctionne-t-il sur smartphone sans avoir besoin d\'un gros PC allumé ?',
          'Avez-vous des devis et factures proforma en PDF pour les entreprises ?',
        ],
        demo: 'Montrer la fiche produit comparateur Nopalou qui redirige directement les acheteurs vers le WhatsApp de la boutique.',
        objection: {
          q: '« Mon logiciel actuel me convient »',
          r: '« Gardez-le pour le magasin si vous voulez ! Utilisez Nopalou comme votre canal de visibilité et d\'acquisition de nouveaux clients sur WhatsApp à 0% de commission. »',
        },
        closing: '« Activons votre vitrine comparateur aujourd\'hui avec les 30 jours offerts pour mesurer le nombre d\'appels que vous recevez. »',
      },
    },
    superette: {
      label: 'Supérettes, Alimentation & Épiceries',
      category: 'superette',
      sans_app: {
        pitch: `« Salam alaykoum ! Gérer une épicerie demande une rapidité totale à la caisse et une maîtrise des dettes de quartier à la fin du mois. Nopalou transforme votre smartphone en Caisse tactile ultrarapide qui marche même sans connexion internet, avec un carnet de dettes qui relance les clients sur WhatsApp en 1 clic ! »`,
        diagnostic: [
          'Combien de temps perdez-vous chaque soir à faire vos comptes et compter les dettes ?',
          'Que se passe-t-il si un client conteste le montant d\'un crédit de fin de mois ?',
          'La connexion internet coupe-t-elle souvent dans votre boutique ?',
        ],
        demo: 'Faire une vente hors-ligne en mode avion, puis enregistrer une dette client de 5 000 F et déclencher le message WhatsApp de relance.',
        objection: {
          q: '« La connexion internet coupe tout le temps chez nous »',
          r: '« C\'est exactement pour cela qu\'on a créé le mode Hors-Ligne ! Notre caisse fonctionne 100% sans internet. Vos ventes sont enregistrées et rien ne bloque. »',
        },
        closing: '« Testons la caisse hors-ligne tout de suite sur votre propre téléphone pendant 30 jours gratuits. »',
      },
      avec_app: {
        pitch: `« Bonjour ! Vous avez un logiciel de caisse, mais que payez-vous en maintenance ou matériel ? Nopalou fonctionne sur n\'importe quel écran, gère les codes PIN multi-caissiers, scanne avec vos douchettes USB existantes et coûte seulement ${fcfa(prixPro)}/mois tout compris. »`,
        diagnostic: [
          'Que se passe-t-il si votre PC de caisse tombe en panne ? Avez-vous une solution de secours sur téléphone ?',
          'Avez-vous un suivi des marges nettes et des clôtures de caisse Z automatiques ?',
        ],
        demo: 'Démonstration de la clôture de caisse Z en 1 clic avec export comptable des bénéfices.',
        objection: {
          q: '« J\'ai déjà investi dans une machine de caisse »',
          r: '« Nopalou est compatible avec votre douchette USB et vos imprimantes thermiques de reçus ! Vous gardez votre matériel mais vous profitez d\'un logiciel moderne accessible partout. »',
        },
        closing: '« Faisons un essai gratuit sur un 2e écran ou comme caisse de secours sans toucher à votre installation principale. »',
      },
    },
    quincaillerie: {
      label: 'Quincailleries & Matériaux de Construction',
      category: 'quincaillerie',
      sans_app: {
        pitch: `« Bonjour chef ! Dans les matériaux, les clients demandent constamment des devis et des factures avec NINEA et RCCM pour les chantiers et entreprises. Nopalou vous permet de générer des factures légales OHADA en PDF en 10 secondes et de suivre les gros crédits clients. 1er mois offert ! »`,
        diagnostic: [
          'Perdez-vous des contrats avec des entreprises parce que vous n\'avez pas de factures avec NINEA/TVA ?',
          'Comment suivez-vous les livraisons partielles de sacs de ciment ou de fer sur les chantiers ?',
        ],
        demo: 'Créer un devis de 50 sacs de ciment + fer à béton, le convertir en facture OHADA PDF avec NINEA et le partager sur WhatsApp en 15 secondes.',
        objection: {
          q: '« Je fais mes factures sur un bloc papier à souche »',
          r: '« Le papier s\'égare et ne fait pas professionnel pour les gros chantiers. Une facture PDF Nopalou avec votre en-tête et QR code vous fait gagner les marchés des entreprises. »',
        },
        closing: '« Créez votre 1ère facture proforma test tout de suite pour votre prochain client de chantier. »',
      },
      avec_app: {
        pitch: `« Bonjour ! Vous gérez des stocks volumineux et des fournisseurs complexes. Nopalou Business vous permet de scanner les factures d'achat fournisseurs par OCR pour mettre à jour vos stocks sans saisie et de gérer plusieurs caissiers avec code PIN sécurisé. »`,
        diagnostic: [
          'Combien de temps mettez-vous à saisir les bordereaux de livraison de vos fournisseurs ?',
          'Avez-vous une traçabilité exacte des remises accordées par chaque vendeur ?',
        ],
        demo: 'Scan OCR d\'une facture fournisseur papier pour incrémenter les quantités d\'articles en stock en 5 secondes.',
        objection: {
          q: '« Mon logiciel actuel fait déjà la facturation »',
          r: '« Mais vous permet-il d\'envoyer la facture en 1 clic sur WhatsApp au client sur le chantier et d\'avoir le paiement Wave instantané sans double travail ? »',
        },
        closing: '« Testez le module Facturation & Fournisseurs pendant 30 jours sans engagement. »',
      },
    },
    cosmetique: {
      label: 'Cosmétique, Beauté & Parfumerie',
      category: 'cosmetique',
      sans_app: {
        pitch: `« Bonjour madame ! Vos produits de beauté méritent une vitrine élégante. Avec Nopalou, vos clientes découvrent vos gammes, conseils d'utilisation et prix sur votre vitrine web, et vous recevez les commandes directement sur WhatsApp sans aucune commission ! »`,
        diagnostic: [
          'Vos clientes vous demandent-elles souvent les prix de vos crèmes et parfums par message ?',
          'Avez-vous un moyen d\'alerter vos clientes quand un arrivage arrive ?',
        ],
        demo: 'Créer un pack beauté avec photos HD et bouton direct "Commander sur WhatsApp".',
        objection: {
          q: '« Mes clientes viennent directement au magasin »',
          r: '« Justement ! Donnez-leur votre QR code de boutique : elles pourront commander leurs réapprovisionnements depuis chez elles et se faire livrer. »',
        },
        closing: '« Configurons votre vitrine avec 3 produits vedettes maintenant en 2 minutes. »',
      },
      avec_app: {
        pitch: `« Bonjour ! Augmentez la fidélité de vos clientes avec une vitrine en ligne reliée à votre caisse, des stories WhatsApp automatiques et un suivi des dettes et acomptes en temps réel. »`,
        diagnostic: [
          'Vos clientes peuvent-elles commander en ligne 24h/24 en dehors des heures d\'ouverture ?',
        ],
        demo: 'Génération de la Story 1080×1920 avec logo de la boutique et prix promo.',
        objection: {
          q: '« Je vends déjà sur Instagram »',
          r: '« Nopalou vous donne le lien unique à mettre en bio Instagram pour que vos abonnées commandent en 1 clic sans passer 20 minutes en DM ! »',
        },
        closing: '« Ajoutez le lien Nopalou dans votre bio Instagram pendant 30 jours d\'essai pour voir la différence. »',
      },
    },
    resto: {
      label: 'Restauration Rapide, Traiteurs & Pâtisseries',
      category: 'resto',
      sans_app: {
        pitch: `« Bonjour chef ! Évitez les erreurs dans les commandes de midi. Avec Nopalou, vos clients scannent votre QR code sur table ou sur WhatsApp, consultent votre menu du jour avec photos et passent commande en 1 clic avec leur adresse de livraison ! »`,
        diagnostic: [
          'Avez-vous des erreurs de commande pendant le rush du midi ?',
          'Combien de temps passez-vous à dicter le menu au téléphone aux clients ?',
        ],
        demo: 'Scanner le QR code du menu sur smartphone et passer une commande complète (Plat + Boisson) sur WhatsApp en 10 secondes.',
        objection: {
          q: '« On change de plat du jour tous les jours »',
          r: '« Vous mettez à jour votre plat du jour en 5 secondes sur votre téléphone, et tous vos clients voient le nouveau menu instantanément ! »',
        },
        closing: '« Imprimons votre QR code de menu aujourd\'hui pour votre service de demain. »',
      },
      avec_app: {
        pitch: `« Bonjour ! Les plateformes de livraison vous prennent entre 20% et 30% de commission sur chaque repas. Nopalou vous permet de prendre les commandes en direct sur votre WhatsApp avec 0% de commission ! »`,
        diagnostic: [
          'Combien perdez-vous en commissions sur les plateformes tierces chaque mois ?',
        ],
        demo: 'Calculateur d\'économies : 100 repas/mois = plus de 50 000 F de commissions sauvées avec Nopalou.',
        objection: {
          q: '« Les applications de livraison m\'apportent des clients »',
          r: '« Gardez-les pour les nouveaux, mais faites commander vos clients fidèles sur votre propre lien Nopalou pour garder 100% de vos marges ! »',
        },
        closing: '« Mettez en place votre commande directe à 0% dès aujourd\'hui avec les 30 jours offerts. »',
      },
    },
    grossiste: {
      label: 'Grossistes & Semi-Grossistes',
      category: 'grossiste',
      sans_app: {
        pitch: `« Salam alaykoum grand patron ! Gérer des centaines de cartons et des millions de FCFA de dettes clients sur des cahiers est risqué. Nopalou sécurise votre commerce : import de catalogue par lot, gestion multi-caissiers PIN, et factures OHADA en PDF. 1er mois offert ! »`,
        diagnostic: [
          'Comment contrôlez-vous la caisse exacte de vos différents vendeurs en fin de journée ?',
          'Quel est le montant total des dettes clients qui dorment dehors en ce moment ?',
        ],
        demo: 'Tableau de bord de gestion avec solde global des créances et clôture de caisse Z multi-vendeurs.',
        objection: {
          q: '« J\'ai trop d\'articles, c\'est trop lourd à rentrer »',
          r: '« On importe votre fichier Excel de 1 000 articles en 3 secondes grâce à notre import par lot. On le fait ensemble tout de suite ! »',
        },
        closing: '« Donnez-moi votre liste Excel et je vous montre votre boutique prête dans 2 minutes. »',
      },
      avec_app: {
        pitch: `« Bonjour ! Vous avez un logiciel lourd de grossiste sur PC, mais vos commerciaux sur le terrain n\'y ont pas accès. Nopalou Business connecte vos vendeurs terrain en direct sur mobile avec codes PIN et API REST. »`,
        diagnostic: [
          'Vos commerciaux terrain peuvent-ils prendre des commandes directement chez les clients sur leur smartphone ?',
        ],
        demo: 'Prise de commande mobile par un commercial terrain qui décrémente le stock central en direct.',
        objection: {
          q: '« Nous avons besoin d\'une sécurité stricte pour les vendeurs »',
          r: '« Chaque caissier a son code PIN dédié avec des permissions restreintes (interdiction d\'annuler une vente ou de modifier les prix sans validation). »',
        },
        closing: '« Testez la formule Business VIP avec vos vendeurs pendant 30 jours sans risque. »',
      },
    },
  }
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    q: "Quel est l'avantage majeur de la Caisse POS Nopalou face aux coupures internet au Sénégal ?",
    options: [
      'Elle nécessite obligatoirement la 4G Orange pour fonctionner',
      'Elle est 100% Offline First (PWA) : on peut encaisser sans internet et tout se synchronise au retour de la connexion',
      'Elle ne marche que sur ordinateur de bureau connecté par câble',
    ],
    correct: 1,
    explication: "La Caisse PWA stocke le catalogue en local et permet l'encaissement continu même en cas de coupure de réseau.",
  },
  {
    id: 2,
    q: 'Quel est le pourcentage de commission prélevé par Nopalou sur les ventes des commerçants ?',
    options: [
      '10% sur chaque vente',
      '5% par transaction',
      '0% de commission (le commerçant garde 100% de sa marge)',
    ],
    correct: 2,
    explication: "Nopalou applique un forfait fixe ultra-abordable et 0% de commission sur le chiffre d'affaires.",
  },
  {
    id: 3,
    q: "Combien touche un apporteur d'affaires sur chaque abonnement actif ?",
    options: [
      '5% une seule fois',
      '20% de commission récurrente à vie chaque mois',
      '1 000 FCFA forfaitaire',
    ],
    correct: 1,
    explication: "L'apporteur touche 20% récurrents tous les mois tant que la boutique reste abonnée.",
  },
  {
    id: 4,
    q: "Combien de temps dure l'essai gratuit offert à tout nouveau commerçant ?",
    options: [
      '7 jours',
      '14 jours',
      '30 jours (1er mois 100% offert sans carte bancaire)',
    ],
    correct: 2,
    explication: "30 jours d'essai complets sans engagement pour tester toutes les fonctionnalités Pro.",
  },
]
