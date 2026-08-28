'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Target, Award, MessageSquare, BookOpen, Printer, UserCheck,
  Calculator, Check, Copy, ExternalLink, Download, Phone,
  Sparkles, CheckCircle2, AlertTriangle, HelpCircle, ChevronRight,
  TrendingUp, MapPin, Store, Smartphone, ShieldCheck, DollarSign
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface Props {
  secret?: string
  prixDecouverte?: number
  prixPro?: number
  prixBusiness?: number
  tauxApporteur?: number
}

type TabType = 'strategie' | 'formation' | 'pitchs' | 'guide' | 'supports' | 'generateur' | 'simulateur'
type CategorieCommerce = 'mode' | 'tech' | 'superette' | 'quincaillerie' | 'cosmetique' | 'resto' | 'grossiste'
type StatutEquipement = 'sans_app' | 'avec_app'

export default function ForceDeVenteClient({
  prixDecouverte = 2500,
  prixPro = 5000,
  prixBusiness = 10000,
  tauxApporteur = 20,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('strategie')
  const [toast, setToast] = useState<string | null>(null)

  // Matrice Pitchs & Objections State
  const [selectedCat, setSelectedCat] = useState<CategorieCommerce>('superette')
  const [selectedEquip, setSelectedEquip] = useState<StatutEquipement>('sans_app')

  // Personnalisation Agent State
  const [agentNom, setAgentNom] = useState('Mamadou Diallo')
  const [agentPhone, setAgentPhone] = useState('771234567')
  const [agentCode, setAgentCode] = useState('AGENT-DKR')

  // Simulateur Rémunération State
  const [nbTafTaf, setNbTafTaf] = useState(10)
  const [nbPro, setNbPro] = useState(25)
  const [nbBusiness, setNbBusiness] = useState(5)

  // Quiz Interactif Formation State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt)
    showToast(`✅ ${label} copié dans le presse-papier !`)
  }

  // Calculs Rémunération Simulateur
  const caMensuel = (nbTafTaf * prixDecouverte) + (nbPro * prixPro) + (nbBusiness * prixBusiness)
  const comMensuelle = caMensuel * (tauxApporteur / 100)
  const totalBoutiques = nbTafTaf + nbPro + nbBusiness
  const primePalier = totalBoutiques >= 50 ? 100000 : totalBoutiques >= 30 ? 50000 : totalBoutiques >= 15 ? 20000 : 0
  const gainTotalMois = comMensuelle + primePalier

  // Données Matrice par Catégorie × Équipement
  const MATRICE_DATA: Record<CategorieCommerce, {
    label: string
    emoji: string
    sans_app: {
      pitch: string
      diagnostic: string[]
      demo: string
      objection: { q: string; r: string }
      closing: string
    }
    avec_app: {
      pitch: string
      diagnostic: string[]
      demo: string
      objection: { q: string; r: string }
      closing: string
    }
  }> = {
    mode: {
      label: 'Mode, Prêt-à-Porter & Chaussures',
      emoji: '👗',
      sans_app: {
        pitch: `« Bonjour ! Vous vendez de magnifiques vêtements. Aujourd'hui, quand une cliente vous demande vos modèles et tailles sur WhatsApp, vous perdez du temps à chercher et renvoyer les photos une par une. Avec Nopalou, vous avez votre vitrine en ligne avec vos tailles/couleurs, et vos clientes commandent directement sur votre WhatsApp. Le 1er mois est 100% offert, je vous montre en 1 minute ? »`,
        diagnostic: [
          'Combien de temps passez-vous par jour à envoyer photos et prix sur WhatsApp ?',
          'Comment gérez-vous les réservations de robes ou chaussures qui ne sont finalement pas récupérées ?',
          'Avez-vous déjà oublié une dette ou une avance d\'une cliente ?',
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
      emoji: '📱',
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
      emoji: '🛒',
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
      emoji: '🔨',
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
      emoji: '💄',
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
      emoji: '🍽️',
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
      emoji: '📦',
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

  // Quiz Questions & Réponses
  const QUIZ_QUESTIONS = [
    {
      id: 1,
      q: 'Quel est l\'avantage majeur de la Caisse POS Nopalou face aux coupures internet au Sénégal ?',
      options: [
        'Elle nécessite obligatoirement la 4G Orange pour fonctionner',
        'Elle est 100% Offline First (PWA) : on peut encaisser sans internet et tout se synchronise au retour de la connexion',
        'Elle ne marche que sur ordinateur de bureau connecté par câble',
      ],
      correct: 1,
      explication: 'La Caisse PWA stocke le catalogue en local et permet l\'encaissement continu même en cas de coupure de réseau.',
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
      explication: 'Nopalou applique un forfait fixe ultra-abordable et 0% de commission sur le chiffre d\'affaires.',
    },
    {
      id: 3,
      q: 'Combien touche un apporteur d\'affaires sur chaque abonnement actif ?',
      options: [
        '5% une seule fois',
        '20% de commission récurrente à vie chaque mois',
        '1 000 FCFA forfaitaire',
      ],
      correct: 1,
      explication: 'L\'apporteur touche 20% récurrents tous les mois tant que la boutique reste abonnée.',
    },
    {
      id: 4,
      q: 'Combien de temps dure l\'essai gratuit offert à tout nouveau commerçant ?',
      options: [
        '7 jours',
        '14 jours',
        '30 jours (1er mois 100% offert sans carte bancaire)',
      ],
      correct: 2,
      explication: '30 jours d\'essai complets sans engagement pour tester toutes les fonctionnalités Pro.',
    },
  ]

  const handleQuizSelect = (qId: number, optIdx: number) => {
    const updated = { ...quizAnswers, [qId]: optIdx }
    setQuizAnswers(updated)
    if (Object.keys(updated).length === QUIZ_QUESTIONS.length) {
      let score = 0
      QUIZ_QUESTIONS.forEach(q => {
        if (updated[q.id] === q.correct) score++
      })
      setQuizScore(score)
    }
  }

  const currentMatrice = MATRICE_DATA[selectedCat][selectedEquip]

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 80px', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1C2B4A', color: '#fff', padding: '12px 24px',
          borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {toast}
        </div>
      )}

      {/* Header Principal */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0B132B 100%)',
        borderRadius: 20, padding: '32px 36px', color: '#fff', marginBottom: 28,
        border: '2px solid rgba(199,91,0,0.3)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(199,91,0,0.15)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,91,0,0.2)', padding: '6px 14px', borderRadius: 20, marginBottom: 12 }}>
          <Sparkles size={16} color="#C75B00" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FFEDD5', letterSpacing: '0.05em' }}>
            ESPACE STRATÉGIQUE ADMINISTRATION
          </span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 8px' }}>
          🚀 Force de Vente Terrain &amp; Déploiement Commercial
        </h1>
        <p style={{ fontSize: 15, color: '#CBD5E1', maxWidth: 840, lineHeight: 1.5, margin: 0 }}>
          Pilotez la prospection des commerces au Sénégal, formez vos commerciaux, accédez à la matrice décisionnelle par catégorie, générez des kits personnalisés et téléchargez tous les supports imprimables haute définition.
        </p>
      </div>

      {/* Navigation Onglets (7 Tabs) */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '2px solid #E2E8F0',
        paddingBottom: 2, marginBottom: 28,
      }}>
        {[
          { id: 'strategie', label: '🎯 1. Stratégie & Zones', icon: Target },
          { id: 'formation', label: '🎓 2. Académie & Formation', icon: Award },
          { id: 'pitchs', label: '💬 3. Matrice Pitchs & Objections', icon: MessageSquare },
          { id: 'guide', label: '📖 4. Guide Marchand', icon: BookOpen },
          { id: 'supports', label: '📄 5. Supports Print HD', icon: Printer },
          { id: 'generateur', label: '📱 6. Kit Personnalisé Agent', icon: UserCheck },
          { id: 'simulateur', label: '💰 7. Simulateur de Gains', icon: Calculator },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
                border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: isActive ? 800 : 600,
                color: isActive ? '#C75B00' : '#64748B',
                borderBottom: isActive ? '3px solid #C75B00' : '3px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              <Icon size={18} color={isActive ? '#C75B00' : '#64748B'} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 1 : STRATÉGIE & QUADRILLAGE TERRAIN
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'strategie' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Funnel 5 Étapes */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={22} color="#C75B00" /> Le Funnel Terrain en 5 Étapes (Taux de Conversion Ciblé &gt; 40%)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {[
                { step: '1', title: 'Repérage & Brise-glace', desc: 'Observer la boutique, saluer chaleureusement en wolof/français, poser la question d\'accroche.', color: '#3B82F6' },
                { step: '2', title: 'Diagnostic Express', desc: 'Poser les 2 questions magiques (Gestion des dettes ? Temps passé sur WhatsApp ?).', color: '#8B5CF6' },
                { step: '3', title: 'Démo Live 60s', desc: 'Démonstration de la Caisse POS hors-ligne, du bilan WhatsApp instantané ou de l\'import Shopify/Excel.', color: '#EC4899' },
                { step: '4', title: 'Onboarding 30s WA', desc: 'Création de la boutique en 30s sur WhatsApp (3 questions) ou import du catalogue existant.', color: '#10B981' },
                { step: '5', title: 'Suivi J+1 & J+7', desc: 'Message WhatsApp de félicitations à J+1, relance téléphonique à J+7 pour accompagner le 1er mois offert.', color: '#F59E0B' },
              ].map(s => (
                <div key={s.step} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 14px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, marginBottom: 8 }}>
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>{s.title}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Zones Prioritaires de Quadrillage Dakar & Régions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={20} color="#C75B00" /> Zones Prioritaires — Dakar
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { zone: 'Marché Sandaga & Plateau', cible: 'Mode, Téléphonie, Maroquinerie, Parfumerie', vol: '150+ boutiques / km²' },
                  { zone: 'Marché HLM 5 & Allées du Centenaire', cible: 'Tissus, Prêt-à-porter, Chaussures, Accessoires', vol: '200+ boutiques / km²' },
                  { zone: 'Marché Tilène & Médina', cible: 'Alimentation, Quincaillerie, Électroménager, Épiceries', vol: '180+ boutiques / km²' },
                  { zone: 'Colobane & Boulevard Général De Gaulle', cible: 'High-Tech, Informatique, Pièces détachées', vol: '120+ boutiques / km²' },
                  { zone: 'Centres Commerciaux (Sea Plaza, Playce, Maristes)', cible: 'Boutiques de marque, Cosmétiques, Restauration', vol: 'Commerces structurés' },
                ].map((z, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A', display: 'block' }}>{z.zone}</span>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Cible : {z.cible}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C75B00', background: '#FFF7ED', padding: '4px 8px', borderRadius: 6 }}>{z.vol}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Store size={20} color="#16A34A" /> Organisation de la Journée Type du Commercial
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#334155' }}>
                <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, borderLeft: '4px solid #16A34A' }}>
                  <strong>08h30 - 09h00 :</strong> Briefing matinal, vérification du stock de flyers/badges et sélection de la zone du jour.
                </div>
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                  <strong>09h00 - 13h00 :</strong> Session de prospection Terrain 1 (8 à 10 visites ciblées, démos live, inscriptions sur place).
                </div>
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, borderLeft: '4px solid #F59E0B' }}>
                  <strong>14h00 - 17h30 :</strong> Session de prospection Terrain 2 (8 à 10 visites complémentaires + revisites de closing).
                </div>
                <div style={{ padding: '10px 14px', background: '#FFF7ED', borderRadius: 10, borderLeft: '4px solid #C75B00' }}>
                  <strong>17h30 - 18h00 :</strong> Debriefing, enregistrement des boutiques onboardées, envoi des messages de bienvenue WhatsApp.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#1C2B4A', color: '#fff', padding: '12px 16px', borderRadius: 10, fontWeight: 800, marginTop: 4 }}>
                  <span>🎯 Objectif quotidien par commercial :</span>
                  <span style={{ color: '#38BDF8' }}>15 à 20 visites · 5 à 8 boutiques onboardées / jour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 2 : ACADÉMIE & FORMATION COMMERCIALE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'formation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Les 10 Commandements */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={22} color="#C75B00" /> Les 10 Règles d&apos;Or du Commercial Terrain d&apos;Élite
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { num: '1', title: 'Tenue & Posture Pro', desc: 'Portez votre badge accrédité Nopalou visible. Souriez et adaptez votre langue (Wolof / Français).' },
                { num: '2', title: 'Respect du Commerçant', desc: 'Si un client entre dans la boutique, taisez-vous immédiatement et laissez le commerçant vendre.' },
                { num: '3', title: 'Zéro Jargon Technique', desc: 'Ne parlez pas de "SaaS", "cloud" ou "API". Parlez de "Caisse sur téléphone", "Dettes WhatsApp" et "0 commission".' },
                { num: '4', title: 'Démonstration par l\'Action', desc: 'Ne décrivez pas l\'application : montrez-la en direct en scannant un vrai produit sous ses yeux.' },
                { num: '5', title: 'Écoute Active (80/20)', desc: 'Laissez le commerçant parler 80% du temps de ses difficultés quotidiennes de caisse et de dettes.' },
                { num: '6', title: 'Mise en avant du 1er Mois Offert', desc: 'Désarmez la peur de payer en rappelant que le 1er mois est 100% gratuit sans engagement.' },
                { num: '7', title: 'Onboarding Immédiat 30s', desc: 'Ne laissez jamais le commerçant s\'inscrire "plus tard". Ouvrez sa boutique par WhatsApp en 30s ou uploadez son fichier Excel/Shopify.' },
                { num: '8', title: 'Création de Valeur Tangible', desc: 'Envoyez 1 article avec photo et prix au bot WhatsApp pour qu\'il voie immédiatement sa vitrine web active.' },
                { num: '9', title: 'Preuve Sociale Locale', desc: 'Citez des boutiques voisines du même quartier déjà inscrites pour rassurer.' },
                { num: '10', title: 'Suivi et Fidélisation J+1', desc: 'Envoyez un message de félicitations le soir même pour créer une relation de confiance durable.' },
              ].map(r => (
                <div key={r.num} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#C75B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                    {r.num}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A', margin: '0 0 2px' }}>{r.title}</h3>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz d'Auto-Évaluation des Commerciaux */}
          <div style={{ background: '#FFF7ED', border: '2px solid #FFEDD5', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#C75B00', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HelpCircle size={20} /> Quiz de Validation des Connaissances Commerciales
                </h2>
                <p style={{ fontSize: 13, color: '#9A3412', margin: 0 }}>
                  Testez vos commerciaux pour vous assurer qu&apos;ils maîtrisent parfaitement les arguments clés.
                </p>
              </div>
              {quizScore !== null && (
                <div style={{ background: quizScore >= 3 ? '#16A34A' : '#DC2626', color: '#fff', padding: '8px 16px', borderRadius: 12, fontWeight: 900, fontSize: 16 }}>
                  Score : {quizScore} / {QUIZ_QUESTIONS.length} {quizScore >= 3 ? '🎉 Validé !' : '⚠️ À réviser'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {QUIZ_QUESTIONS.map((q, idx) => {
                const selected = quizAnswers[q.id]
                const isAnswered = selected !== undefined
                return (
                  <div key={q.id} style={{ background: '#fff', border: '1px solid #FED7AA', borderRadius: 12, padding: '16px 20px' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 10 }}>
                      {idx + 1}. {q.q}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, optIdx) => {
                        let btnBg = '#F8FAFC'
                        let btnBorder = '#E2E8F0'
                        let btnColor = '#1C2B4A'
                        if (isAnswered) {
                          if (optIdx === q.correct) {
                            btnBg = '#DCFCE7'
                            btnBorder = '#16A34A'
                            btnColor = '#15803D'
                          } else if (selected === optIdx) {
                            btnBg = '#FEE2E2'
                            btnBorder = '#DC2626'
                            btnColor = '#991B1B'
                          }
                        }
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleQuizSelect(q.id, optIdx)}
                            style={{
                              padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${btnBorder}`,
                              background: btnBg, color: btnColor, textAlign: 'left', fontSize: 13,
                              fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {isAnswered && (
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 8, marginBottom: 0, fontStyle: 'italic' }}>
                        💡 {q.explication}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 3 : MATRICE INTERACTIVE PITCHS & OBJECTIONS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'pitchs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Sélecteurs Catégorie & Statut */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                1. Choisissez la Catégorie du Commerce Prospecté :
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(MATRICE_DATA) as CategorieCommerce[]).map((catKey) => {
                  const c = MATRICE_DATA[catKey]
                  const isSel = selectedCat === catKey
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCat(catKey)}
                      style={{
                        padding: '8px 14px', borderRadius: 10,
                        border: isSel ? '2px solid #C75B00' : '1px solid #CBD5E1',
                        background: isSel ? '#FFF7ED' : '#F8FAFC',
                        color: isSel ? '#C75B00' : '#1C2B4A',
                        fontWeight: isSel ? 800 : 600, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                2. Niveau d&apos;Équipement du Commerçant :
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setSelectedEquip('sans_app')}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 10,
                    border: selectedEquip === 'sans_app' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                    background: selectedEquip === 'sans_app' ? '#F0FDF4' : '#fff',
                    color: selectedEquip === 'sans_app' ? '#166534' : '#64748B',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  ❌ N&apos;a PAS d&apos;application (Carnet papier / Mémoire)
                </button>

                <button
                  onClick={() => setSelectedEquip('avec_app')}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 10,
                    border: selectedEquip === 'avec_app' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: selectedEquip === 'avec_app' ? '#EFF6FF' : '#fff',
                    color: selectedEquip === 'avec_app' ? '#1E40AF' : '#64748B',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  ✅ A DÉJÀ une application / logiciel (Excel / Desktop)
                </button>
              </div>
            </div>
          </div>

          {/* Fiche d'Argumentaire Personnalisée */}
          <div style={{ background: '#fff', border: '2px solid #C75B00', borderRadius: 16, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Fiche */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FICHE D&apos;ARGUMENTAIRE TERRAIN ADAPTÉE
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1C2B4A', margin: '4px 0 0' }}>
                  {MATRICE_DATA[selectedCat].emoji} {MATRICE_DATA[selectedCat].label} — {selectedEquip === 'sans_app' ? 'Sans Application' : 'Avec Application Existante'}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(currentMatrice.pitch, 'Pitch')}
                  style={{
                    padding: '8px 14px', background: '#1C2B4A', color: '#fff', borderRadius: 8,
                    border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Copy size={15} /> Copier le Pitch
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(currentMatrice.pitch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 14px', background: '#25D366', color: '#fff', borderRadius: 8,
                    border: 'none', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Phone size={15} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Pitch */}
            <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: 12, padding: '16px 20px' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00', display: 'block', marginBottom: 6 }}>
                ⚡ PITCH D&apos;ACCROCHE (À RÉCITER OU ENVOYER) :
              </span>
              <p style={{ fontSize: 15, color: '#1C2B4A', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                {currentMatrice.pitch}
              </p>
            </div>

            {/* 3 Questions Diagnostic */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#1C2B4A', display: 'block', marginBottom: 8 }}>
                🎯 LES 3 QUESTIONS DE DIAGNOSTIC À POSER :
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentMatrice.diagnostic.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155' }}>
                    <span style={{ color: '#C75B00', fontWeight: 900 }}>•</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Démo Live Recommandée */}
            <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '16px 20px' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#1E40AF', display: 'block', marginBottom: 6 }}>
                📱 DÉMO LIVE À EXÉCUTER SUR PLACE (60 SECONDES) :
              </span>
              <p style={{ fontSize: 14, color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>
                {currentMatrice.demo}
              </p>
            </div>

            {/* Objection & Parade */}
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '16px 20px' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#DC2626', display: 'block', marginBottom: 6 }}>
                🛡️ L&apos;OBJECTION CLÉ DE CE PROFIL &amp; SA PARADE :
              </span>
              <p style={{ fontSize: 14, color: '#991B1B', fontWeight: 800, margin: '0 0 6px' }}>
                Objection : {currentMatrice.objection.q}
              </p>
              <p style={{ fontSize: 14, color: '#15803D', fontWeight: 700, margin: 0 }}>
                ➔ Réponse percutante : {currentMatrice.objection.r}
              </p>
            </div>

            {/* Closing */}
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '16px 20px' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#166534', display: 'block', marginBottom: 6 }}>
                🤝 PHRASE DE CLOSING POUR DÉCLENCHER L&apos;INSCRIPTION :
              </span>
              <p style={{ fontSize: 15, color: '#14532D', fontWeight: 800, margin: 0 }}>
                {currentMatrice.closing}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 4 : GUIDE MARCHAND SIMPLIFIÉ
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 4px' }}>
                📖 Guide d&apos;Utilisation Simplifié Intégré
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                Ce guide est également accessible publiquement sur <Link href="/guide-utilisation" target="_blank" style={{ color: '#C75B00', fontWeight: 700 }}>nopalou.com/guide-utilisation</Link>.
              </p>
            </div>
            <Link
              href="/guide-utilisation"
              target="_blank"
              style={{
                padding: '10px 18px', background: '#C75B00', color: '#fff', borderRadius: 10,
                fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Ouvrir la page dédiée <ExternalLink size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { num: '1', title: 'Ouverture de Compte & Boutique', desc: 'Inscription en 1 min par numéro WhatsApp, configuration du logo, nom et coordonnées.' },
              { num: '2', title: 'Gestion du Catalogue & Variantes', desc: 'Ajout manuel, import Excel en 1 clic, génération de codes-barres EAN-13 GS1.' },
              { num: '3', title: 'Caisse POS Tactile & Hors-Ligne', desc: 'Fonctionne sans internet (PWA), 3 scanners (Caméra, Cloud, USB), clôture Z.' },
              { num: '4', title: 'Carnet de Dettes & Relance WA', desc: 'Enregistrement des crédits clients, solde en direct, relance automatique WhatsApp.' },
              { num: '5', title: 'Factures & Devis Légaux OHADA', desc: 'PDF officiels avec NINEA, RCCM et TVA 18% téléchargeables en 10 secondes.' },
              { num: '6', title: 'Fournisseurs & Scan OCR', desc: 'Scan OCR des factures d\'achat fournisseur pour incrémentation automatique du stock.' },
              { num: '7', title: 'Commandes Web & Paniers', desc: 'Réception des commandes sur WhatsApp sans aucune commission, relance des paniers.' },
              { num: '8', title: 'Marketing, QR Code & Stories', desc: 'Générateur de stories 1080×1920 en marque blanche et QR Code de comptoir.' },
            ].map(g => (
              <div key={g.num} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#C75B00', display: 'block', marginBottom: 4 }}>
                  Module {g.num} : {g.title}
                </span>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {g.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 5 : SUPPORTS PRINT HD
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'supports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>
              📄 Galerie des Supports Imprimables Haute Résolution (Print HD)
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
              Tous les visuels sont générés dynamiquement en haute résolution, prêts pour l&apos;imprimerie ou le partage numérique.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {[
                {
                  title: 'Flyer Démarchage A5',
                  format: '1240 × 1748 px (A5 HD)',
                  desc: 'Flyer prospect pour commerçants : 30j offerts, Caisse Offline, 0% com, QR démo.',
                  url: `/assets/flyer-commercial-a5?code=${agentCode}&phone=${agentPhone}&nom=${encodeURIComponent(agentNom)}`,
                  btnLabel: 'Télécharger Flyer A5',
                },
                {
                  title: 'Fiche Tarifs Officielle A4',
                  format: '1240 × 1754 px (A4 HD)',
                  desc: 'Grille tarifaire complète : Taf Taf (2 500 F), Pro (5 000 F), Business (10 000 F).',
                  url: `/assets/fiche-tarifs-a4?code=${agentCode}&phone=${agentPhone}`,
                  btnLabel: 'Télécharger Tarifs A4',
                },
                {
                  title: 'Mémo de Poche Commercial',
                  format: '1050 × 1485 px (Format poche)',
                  desc: 'Guide de survie de poche : pitchs éclair, 10 objections, étapes onboarding 3 min.',
                  url: `/assets/memo-poche-commercial?nom=${encodeURIComponent(agentNom)}&code=${agentCode}`,
                  btnLabel: 'Télécharger Mémo Poche',
                },
                {
                  title: 'Badge Accréditation Agent',
                  format: '1050 × 650 px (Carte/Badge)',
                  desc: 'Badge officiel de représentant Nopalou avec QR code et ID agent.',
                  url: `/assets/badge-commercial?nom=${encodeURIComponent(agentNom)}&code=${agentCode}&phone=${agentPhone}`,
                  btnLabel: 'Télécharger Badge',
                },
                {
                  title: 'Affiche Vitrine Partenaire',
                  format: '1240 × 1748 px (Affiche comptoir)',
                  desc: 'Affiche "Boutique Partenaire - Commandez sur WhatsApp" à poser sur le comptoir.',
                  url: `/assets/affiche-vitrine?boutique=${encodeURIComponent('BOUTIQUE PARTENAIRE')}&phone=${agentPhone}`,
                  btnLabel: 'Télécharger Affiche',
                },
                {
                  title: 'Poster Écosystème Global',
                  format: '1200 × 1600 px (HD)',
                  desc: 'Vue d\'ensemble 360° : Acheteur, Caisse POS, Dettes, WhatsApp, 20% parrainage.',
                  url: '/assets/poster-ecosysteme',
                  btnLabel: 'Télécharger Poster Global',
                },
              ].map((s, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#C75B00', background: '#FFF7ED', padding: '3px 8px', borderRadius: 6 }}>
                      {s.format}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '8px 0 4px' }}>{s.title}</h3>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', lineHeight: 1.4 }}>{s.desc}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, padding: '8px 12px', background: '#1C2B4A', color: '#fff', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      <Download size={14} /> Aperçu HD
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 6 : KIT PERSONNALISÉ AGENT
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'generateur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>
              📱 Générateur de Kit Commercial Sur-Mesure
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
              Saisissez les coordonnées d&apos;un commercial pour lui générer instantanément sa boîte à outils complète avec ses liens de parrainage et ses supports personnalisés.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 6 }}>
                  Prénom &amp; Nom du Commercial :
                </label>
                <input
                  type="text"
                  value={agentNom}
                  onChange={(e) => setAgentNom(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 6 }}>
                  Numéro WhatsApp (sans indicatif) :
                </label>
                <input
                  type="text"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 6 }}>
                  Code Apporteur Unique :
                </label>
                <input
                  type="text"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                />
              </div>
            </div>

            {/* Liens & Messages Générés */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A' }}>🔗 Lien d&apos;Affiliation Direct Création Boutique :</span>
                  <button
                    onClick={() => copyToClipboard(`https://nopalou.com/creer-boutique?ref=${agentCode}`, 'Lien')}
                    style={{ padding: '4px 10px', background: '#C75B00', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Copier
                  </button>
                </div>
                <code style={{ fontSize: 13, color: '#C75B00', fontWeight: 700 }}>
                  https://nopalou.com/creer-boutique?ref={agentCode}
                </code>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A' }}>💬 Message d&apos;Accroche WhatsApp Personnalisé :</span>
                  <button
                    onClick={() => copyToClipboard(`👋 Bonjour ! C'est ${agentNom}, conseiller Nopalou. Digitalisez votre boutique à Dakar avec notre Caisse POS tactile hors-ligne, carnet de dettes WhatsApp et factures OHADA. 🎁 1er mois 100% offert : https://nopalou.com/creer-boutique?ref=${agentCode}`, 'Message')}
                    style={{ padding: '4px 10px', background: '#25D366', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Copier Message
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  « 👋 Bonjour ! C&apos;est {agentNom}, conseiller Nopalou. Digitalisez votre boutique à Dakar avec notre Caisse POS tactile hors-ligne, carnet de dettes WhatsApp et factures OHADA. 🎁 1er mois 100% offert : https://nopalou.com/creer-boutique?ref={agentCode} »
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ONGLET 7 : SIMULATEUR DE RÉMUNÉRATION
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'simulateur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '28px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <DollarSign size={22} color="#16A34A" /> Simulateur de Rémunération &amp; Commissions Récurrentes (20%)
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
              Calculez en temps réel les gains récurrents mensuels d&apos;un commercial ou apporteur selon le nombre de boutiques recrutées.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 14, padding: '18px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 4 }}>Boutiques Taf Taf (2 500 F/m)</span>
                <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 12 }}>Commission : 500 F / boutique / mois</span>
                <input
                  type="number"
                  min="0"
                  value={nbTafTaf}
                  onChange={(e) => setNbTafTaf(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 16, fontWeight: 800 }}
                />
              </div>

              <div style={{ background: '#FFF7ED', border: '2px solid #C75B00', borderRadius: 14, padding: '18px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#C75B00', display: 'block', marginBottom: 4 }}>Boutiques Pro (5 000 F/m)</span>
                <span style={{ fontSize: 12, color: '#9A3412', display: 'block', marginBottom: 12 }}>Commission : 1 000 F / boutique / mois</span>
                <input
                  type="number"
                  min="0"
                  value={nbPro}
                  onChange={(e) => setNbPro(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #C75B00', fontSize: 16, fontWeight: 800 }}
                />
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #1E293B', borderRadius: 14, padding: '18px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', display: 'block', marginBottom: 4 }}>Boutiques Business (10 000 F/m)</span>
                <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 12 }}>Commission : 2 000 F / boutique / mois</span>
                <input
                  type="number"
                  min="0"
                  value={nbBusiness}
                  onChange={(e) => setNbBusiness(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 16, fontWeight: 800 }}
                />
              </div>
            </div>

            {/* Résumé des Gains */}
            <div style={{
              background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
              borderRadius: 16, padding: '24px 32px', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: 14, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Total Boutiques Actives : <strong>{totalBoutiques}</strong> · CA Mensuel Généré : {fcfa(caMensuel)}
                </span>
                <span style={{ fontSize: 13, color: '#38BDF8', fontWeight: 700 }}>
                  Commissions récurrentes ({tauxApporteur}%) : {fcfa(comMensuelle)} {primePalier > 0 ? `+ Prime palier : ${fcfa(primePalier)}` : ''}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 13, color: '#FFEDD5', fontWeight: 800, display: 'block' }}>REVENU MENSUEL ESTIMÉ</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#4ADE80' }}>
                  {fcfa(gainTotalMois)}
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}>versés chaque mois par Wave</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
