'use client'
import { useState, useTransition, useEffect } from 'react'
import { devenirApporteur, type StatsApporteur } from './actions'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import Link from 'next/link'
import {
  Store, Award, MessageSquare, BookOpen, Printer, CheckCircle2,
  Copy, Check, Phone, Download, ExternalLink, Calculator, DollarSign,
  TrendingUp, ShieldCheck, Zap
} from 'lucide-react'

type CategorieCommerce = 'mode' | 'tech' | 'superette' | 'quincaillerie' | 'cosmetique' | 'resto' | 'grossiste'
type StatutEquipement = 'sans_app' | 'avec_app'

export default function ApporteurClient({ statsInitiales }: { statsInitiales?: StatsApporteur | null }) {
  const [stats, setStats] = useState(statsInitiales || null)
  const [loading, setLoading] = useState(statsInitiales === undefined)
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'kit' | 'pitchs' | 'supports' | 'stats'>('kit')
  const { t } = useTranslation()

  // Matrice Pitchs State
  const [selectedCat, setSelectedCat] = useState<CategorieCommerce>('superette')
  const [selectedEquip, setSelectedEquip] = useState<StatutEquipement>('sans_app')

  // Simulateur Multi-Forfaits State
  const [nbTafTaf, setNbTafTaf] = useState(5)
  const [nbPro, setNbPro] = useState(12)
  const [nbBusiness, setNbBusiness] = useState(3)

  const PRIX_TAFTAF = 2500
  const PRIX_PRO = 5000
  const PRIX_BUSINESS = 10000
  const TAUX_COMMISSION = 0.20 // 20%

  const comTafTaf = nbTafTaf * PRIX_TAFTAF * TAUX_COMMISSION
  const comPro = nbPro * PRIX_PRO * TAUX_COMMISSION
  const comBusiness = nbBusiness * PRIX_BUSINESS * TAUX_COMMISSION
  const totalBoutiquesSimul = nbTafTaf + nbPro + nbBusiness
  const totalComMensuelle = comTafTaf + comPro + comBusiness
  const totalComAnnuelle = totalComMensuelle * 12

  const ETAPES = [
    {
      titre: t('account.step1Title'),
      detail: t('account.step1Detail'),
    },
    {
      titre: t('account.step2Title'),
      detail: t('account.step2Detail'),
    },
    {
      titre: t('account.step3Title'),
      detail: t('account.step3Detail'),
    },
  ]

  const MESSAGE_PARTAGE = (lien: string) =>
    `Salut ! Je te recommande Nopalou, le comparateur de prix N°1 au Sénégal. Tu peux créer ta boutique en ligne gratuitement (30 jours d'essai Pro offerts) et recevoir tes commandes directement sur WhatsApp. Crée ta boutique ici : ${lien}`

  useEffect(() => {
    if (statsInitiales !== undefined) return
    const cacheKey = 'nopalou_offline_apporteur_stats'
    const cached = localStorage.getItem(cacheKey)
    if (cached) { try { setStats(JSON.parse(cached)); setLoading(false) } catch(e) {} }

    import('./actions').then(m => {
      m.getMesStatsApporteur().then(fraiches => {
        setStats(fraiches)
        localStorage.setItem(cacheKey, JSON.stringify(fraiches))
      }).catch(err => {
        console.error('Erreur getMesStatsApporteur', err)
      }).finally(() => setLoading(false))
    })
  }, [statsInitiales])

  function activer() {
    setErreur(null)
    startTransition(async () => {
      const result = await devenirApporteur()
      if (result.error) { setErreur(result.error); return }
      const { getMesStatsApporteur } = await import('./actions')
      const fraiches = await getMesStatsApporteur()
      setStats(fraiches)
    })
  }

  if (loading && !stats) {
    return <p style={{ padding: 20 }}>{t('common.loading')}</p>
  }

  if (!stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>{t('account.howItWorks')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ETAPES.map((e, i) => (
              <div key={e.titre} style={{
                border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
                background: '#fff', display: 'flex', gap: 14,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: '#C75B00', background: '#FFF7ED',
                  borderRadius: '50%', width: 26, height: 26, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>{e.titre}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {erreur && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>
            {erreur}
          </div>
        )}
        <button
          onClick={activer}
          disabled={isPending}
          style={{ padding: '14px 32px', background: isPending ? '#9ca3af' : '#C75B00', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: isPending ? 'not-allowed' : 'pointer' }}
        >
          {isPending ? t('account.activating') : t('account.becomeApporteur')}
        </button>
      </div>
    )
  }

  const lien = `https://nopalou.com/creer-boutique?ref=${stats.code_apporteur}`
  const messageWhatsApp = MESSAGE_PARTAGE(lien)
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(messageWhatsApp)}`

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    })
  }

  const MATRICE_PITCHS: Record<CategorieCommerce, {
    label: string
    emoji: string
    sans_app: { pitch: string; demo: string; objection: string }
    avec_app: { pitch: string; demo: string; objection: string }
  }> = {
    mode: {
      label: 'Mode & Prêt-à-Porter',
      emoji: '👗',
      sans_app: {
        pitch: `« Bonjour ! Fini d'envoyer vos photos et tailles une par une sur WhatsApp. Avec Nopalou, vous avez votre vitrine en ligne et vos clientes commandent directement sur votre WhatsApp. 🎁 1er mois 100% offert : ${lien} »`,
        demo: 'Créer un article avec 3 tailles (S, M, L) en 20s et générer la Story HD marque blanche.',
        objection: 'Générez des stories automatiques sans logo Nopalou pour vos statuts WhatsApp.',
      },
      avec_app: {
        pitch: `« Bonjour ! Nopalou synchronise votre caisse physique avec votre vitrine WhatsApp à 0% de commission. Vos clientes voient votre stock en temps réel : ${lien} »`,
        demo: 'Import immédiat de fichier Excel + suivi à distance sur smartphone.',
        objection: 'Testez en parallèle pendant 30 jours gratuits sans rien modifier à votre caisse.',
      },
    },
    tech: {
      label: 'Téléphonie & High-Tech',
      emoji: '📱',
      sans_app: {
        pitch: `« Bonjour chef ! Soyez visible sur le comparateur N°1 au Sénégal, scannez les codes-barres par caméra et gérez vos garanties sans carnet papier. 🎁 1er mois offert : ${lien} »`,
        demo: 'Scanner un code-barres par caméra en 0.5s pour afficher le prix.',
        objection: 'Sécurise vos ventes et stocks même quand vous n\'êtes pas au magasin.',
      },
      avec_app: {
        pitch: `« Bonjour ! Nopalou vous apporte de nouveaux clients qualifiés depuis le comparateur web et offre 3 scanners (Caméra, Cloud, USB) à 5 000 F/mois : ${lien} »`,
        demo: 'Factures proforma et devis légaux OHADA en PDF en 10 secondes.',
        objection: 'Utilisez Nopalou comme canal d\'acquisition client à 0% de commission.',
      },
    },
    superette: {
      label: 'Supérette & Alimentation',
      emoji: '🛒',
      sans_app: {
        pitch: `« Salam alaykoum ! Transformez votre smartphone en Caisse tactile ultrarapide qui marche même sans connexion internet, avec carnet de dettes et relance WhatsApp 1-clic : ${lien} »`,
        demo: 'Faire une vente hors-ligne en mode avion et relancer une dette par WhatsApp.',
        objection: 'Fonctionne 100% sans internet grâce au mode Offline First.',
      },
      avec_app: {
        pitch: `« Bonjour ! Caisse tactile moderne avec codes PIN multi-caissiers et compatibilité douchette USB à seulement 5 000 F/mois : ${lien} »`,
        demo: 'Clôture de caisse Z automatique avec calcul des bénéfices nets.',
        objection: 'Gardez vos douchettes et imprimantes existantes.',
      },
    },
    quincaillerie: {
      label: 'Quincaillerie & Matériaux',
      emoji: '🔨',
      sans_app: {
        pitch: `« Bonjour chef ! Émettez des factures et devis légaux OHADA en PDF avec NINEA et RCCM pour les chantiers et entreprises en 10 secondes : ${lien} »`,
        demo: 'Création d\'un devis ciment/fer converti en facture PDF avec NINEA.',
        objection: 'Les factures PDF professionnelles vous font gagner les marchés d\'entreprises.',
      },
      avec_app: {
        pitch: `« Bonjour ! Scan OCR des factures d'achat fournisseurs pour mise à jour automatique des stocks volumineux : ${lien} »`,
        demo: 'Scan OCR d\'un bordereau de livraison fournisseur pour incrémenter le stock.',
        objection: 'Envoi instantané de la facture par WhatsApp au chef de chantier.',
      },
    },
    cosmetique: {
      label: 'Cosmétique & Beauté',
      emoji: '💄',
      sans_app: {
        pitch: `« Bonjour madame ! Mettez vos produits de beauté en valeur sur votre vitrine web et recevez vos commandes sur WhatsApp sans commission : ${lien} »`,
        demo: 'Catalogue visuel avec fiches conseils et commande directe.',
        objection: 'Donnez votre lien aux clientes pour qu\'elles recommandent depuis chez elles.',
      },
      avec_app: {
        pitch: `« Bonjour ! Lien unique pour bio Instagram et suivi des dettes/acomptes clientes en direct : ${lien} »`,
        demo: 'Story 1080×1920 avec logo de la boutique et prix promo.',
        objection: 'Fini les pertes de temps en messages privés Instagram.',
      },
    },
    resto: {
      label: 'Restauration & Snacks',
      emoji: '🍽️',
      sans_app: {
        pitch: `« Bonjour chef ! Menu interactif avec QR code et commande WhatsApp sans commission sur vos repas de midi : ${lien} »`,
        demo: 'Scan du menu QR code et commande directe sur WhatsApp.',
        objection: 'Mise à jour du plat du jour en 5 secondes sur votre smartphone.',
      },
      avec_app: {
        pitch: `« Bonjour ! Économisez les 20% à 30% de commission des plateformes de livraison en faisant commander vos clients en direct à 0% : ${lien} »`,
        demo: 'Impression ticket de caisse thermique Bluetooth en cuisine.',
        objection: 'Évitez les intermédiaires et conservez 100% de votre marge.',
      },
    },
    grossiste: {
      label: 'Grossiste & Demi-Gros',
      emoji: '📦',
      sans_app: {
        pitch: `« Salam alaykoum chef ! Gérez vos prix de gros par quantité, vos acomptes clients et votre inventaire sans erreur sur smartphone : ${lien} »`,
        demo: 'Import de 1 000 articles Excel en 3 secondes.',
        objection: 'Sécurise vos encaissements et dettes clients sans risque de perte.',
      },
      avec_app: {
        pitch: `« Bonjour ! Connectez vos commerciaux terrain en direct sur smartphone avec codes PIN et décrémentation de stock centralisée : ${lien} »`,
        demo: 'Prise de commande mobile par les vendeurs sur le terrain.',
        objection: 'Permissions sécurisées par code PIN pour chaque vendeur.',
      },
    },
  }

  const pitchActuel = MATRICE_PITCHS[selectedCat][selectedEquip]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header & Stats Principales */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
        borderRadius: 16, padding: '24px 28px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FDBA74', letterSpacing: '0.05em' }}>
            ESPACE PARRAINAGE &amp; APPORTEUR D&apos;AFFAIRES
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: '4px 0' }}>
            Code Parrain / Agent : <span style={{ color: '#F97316' }}>{stats.code_apporteur}</span>
          </h2>
          <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>
            Commission : <strong>{stats.taux_commission}% récurrent à vie</strong> sur chaque abonnement mensuel parrainé.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 18px', textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#94A3B8', display: 'block' }}>Total Dû</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#38BDF8' }}>{fcfa(stats.total_du)}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 18px', textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#94A3B8', display: 'block' }}>Déjà Versé</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#4ADE80' }}>{fcfa(stats.total_paye)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sous-Onglets Apporteur (avec défilement fluide sans troncature) */}
      <div
        className="nopalou-scroll-tabs"
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '2px solid #E2E8F0',
          paddingBottom: 2,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'kit', label: '🚀 Boîte à Outils Terrain', icon: Zap },
          { id: 'pitchs', label: '💬 Pitchs Personnalisés', icon: MessageSquare },
          { id: 'supports', label: '📄 Supports Imprimables', icon: Printer },
          { id: 'stats', label: `🏪 Boutiques Recrutées (${stats.boutiques.length})`, icon: Store },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeSubTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#C75B00' : '#64748B',
                borderBottom: isActive ? '3px solid #C75B00' : '3px solid transparent',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} color={isActive ? '#C75B00' : '#64748B'} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          SOUS-ONGLET 1 : BOÎTE À OUTILS & LIENS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'kit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bloc Lien de Partage */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 6 }}>
              🔗 Votre Lien de Parrainage Officiel :
            </span>
            <code style={{ fontSize: 13, background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, display: 'block', marginBottom: 14, wordBreak: 'break-all', color: '#C75B00', fontWeight: 700 }}>
              {lien}
            </code>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={copierLien}
                style={{ padding: '10px 18px', background: copie ? '#16a34a' : '#1C2B4A', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {copie ? <Check size={16} /> : <Copy size={16} />}
                {copie ? 'Lien copié !' : 'Copier mon lien'}
              </button>

              <a
                href={urlWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '10px 18px', background: '#25D366', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Phone size={16} /> Partager sur WhatsApp
              </a>

              <Link
                href="/guide-utilisation"
                target="_blank"
                style={{ padding: '10px 18px', background: '#FFF7ED', color: '#C75B00', border: '1px solid #FED7AA',
                  borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <BookOpen size={16} /> Guide Marchand Simplifié
              </Link>
            </div>
          </div>

          {/* Simulateur Multi-Forfaits de Gains Apporteur (20% Récurrent) */}
          <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💰</span>
                  <span>Simulateur de Revenus Passifs (20% Récurrent)</span>
                </span>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                  Ajustez le nombre de boutiques selon chaque forfait d&apos;abonnement mensuel :
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#FFEDD5', color: '#9A3412', padding: '3px 8px', borderRadius: 8 }}>
                20% à vie par abonnement
              </span>
            </div>

            {/* Grille des 3 Forfaits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {/* Forfait 1 : Taf Taf */}
              <div style={{ background: '#ffffff', border: '1px solid #FED7AA', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A' }}>🚀 Forfait Taf Taf</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#C75B00', background: '#FFF7ED', padding: '2px 6px', borderRadius: 6 }}>
                    2 500 F/m
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  Gain 20% : <strong style={{ color: '#16A34A' }}>500 FCFA / boutique / mois</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Boutiques :</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setNbTafTaf(prev => Math.max(0, prev - 1))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 800, cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={nbTafTaf}
                      onChange={(e) => setNbTafTaf(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ width: 50, textAlign: 'center', padding: '4px', borderRadius: 6, border: '1px solid #CBD5E1', fontWeight: 800, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => setNbTafTaf(prev => prev + 1)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 800, cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 750, color: '#1C2B4A', textAlign: 'right', borderTop: '1px dashed #E2E8F0', paddingTop: 6 }}>
                  = {fcfa(comTafTaf)} / mois
                </div>
              </div>

              {/* Forfait 2 : Pro */}
              <div style={{ background: '#ffffff', border: '1.5px solid #C75B00', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', boxShadow: '0 2px 8px rgba(199,91,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#1C2B4A' }}>⭐ Forfait Pro</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#ffffff', background: '#C75B00', padding: '2px 6px', borderRadius: 6 }}>
                    5 000 F/m
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  Gain 20% : <strong style={{ color: '#16A34A' }}>1 000 FCFA / boutique / mois</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Boutiques :</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setNbPro(prev => Math.max(0, prev - 1))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 800, cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={nbPro}
                      onChange={(e) => setNbPro(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ width: 50, textAlign: 'center', padding: '4px', borderRadius: 6, border: '1.5px solid #C75B00', fontWeight: 800, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => setNbPro(prev => prev + 1)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 800, cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', textAlign: 'right', borderTop: '1px dashed #E2E8F0', paddingTop: 6 }}>
                  = {fcfa(comPro)} / mois
                </div>
              </div>

              {/* Forfait 3 : Business VIP */}
              <div style={{ background: '#ffffff', border: '1px solid #BAE6FD', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A' }}>👑 Business VIP</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#0369A1', background: '#E0F2FE', padding: '2px 6px', borderRadius: 6 }}>
                    10 000 F/m
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  Gain 20% : <strong style={{ color: '#16A34A' }}>2 000 FCFA / boutique / mois</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Boutiques :</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setNbBusiness(prev => Math.max(0, prev - 1))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 800, cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={nbBusiness}
                      onChange={(e) => setNbBusiness(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ width: 50, textAlign: 'center', padding: '4px', borderRadius: 6, border: '1px solid #CBD5E1', fontWeight: 800, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => setNbBusiness(prev => prev + 1)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 800, cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 750, color: '#1C2B4A', textAlign: 'right', borderTop: '1px dashed #E2E8F0', paddingTop: 6 }}>
                  = {fcfa(comBusiness)} / mois
                </div>
              </div>
            </div>

            {/* Synthèse des Gains Récurrents */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
                borderRadius: 12,
                padding: '16px 20px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: '0 4px 14px rgba(15,23,42,0.2)',
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  Total {totalBoutiquesSimul} boutique{totalBoutiquesSimul > 1 ? 's' : ''} active{totalBoutiquesSimul > 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 13, color: '#CBD5E1' }}>
                  Revenu mensuel récurrent versé par Wave :
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#4ADE80', display: 'block', lineHeight: 1.1 }}>
                  {fcfa(totalComMensuelle)} <span style={{ fontSize: 14, fontWeight: 600, color: '#86EFAC' }}>/ mois</span>
                </span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  soit <strong>{fcfa(totalComAnnuelle)}</strong> / an de revenus passifs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SOUS-ONGLET 2 : PITCHS PERSONNALISÉS PAR CATÉGORIE & ÉQUIPEMENT
      ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'pitchs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sélecteurs */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                1. Type de Commerce :
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(Object.keys(MATRICE_PITCHS) as CategorieCommerce[]).map((catKey) => {
                  const c = MATRICE_PITCHS[catKey]
                  const isSel = selectedCat === catKey
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCat(catKey)}
                      style={{
                        padding: '6px 12px', borderRadius: 8,
                        border: isSel ? '2px solid #C75B00' : '1px solid #CBD5E1',
                        background: isSel ? '#FFF7ED' : '#F8FAFC',
                        color: isSel ? '#C75B00' : '#1C2B4A',
                        fontWeight: isSel ? 800 : 600, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      {c.emoji} {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                2. Situation du Commerçant :
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedEquip('sans_app')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: selectedEquip === 'sans_app' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                    background: selectedEquip === 'sans_app' ? '#F0FDF4' : '#fff',
                    color: selectedEquip === 'sans_app' ? '#166534' : '#64748B',
                    fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  ❌ N&apos;a pas d&apos;application
                </button>
                <button
                  onClick={() => setSelectedEquip('avec_app')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: selectedEquip === 'avec_app' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: selectedEquip === 'avec_app' ? '#EFF6FF' : '#fff',
                    color: selectedEquip === 'avec_app' ? '#1E40AF' : '#64748B',
                    fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  ✅ A déjà un logiciel / Excel
                </button>
              </div>
            </div>
          </div>

          {/* Fiche Pitch Personnalisée */}
          <div style={{ background: '#fff', border: '2px solid #C75B00', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#1C2B4A' }}>
                {MATRICE_PITCHS[selectedCat].emoji} {MATRICE_PITCHS[selectedCat].label}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pitchActuel.pitch)
                    alert('Pitch copié !')
                  }}
                  style={{ padding: '6px 12px', background: '#1C2B4A', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Copier
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(pitchActuel.pitch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '6px 12px', background: '#25D366', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '14px', fontSize: 14, color: '#1C2B4A', lineHeight: 1.5, fontWeight: 600 }}>
              {pitchActuel.pitch}
            </div>

            <div style={{ fontSize: 13, color: '#475569' }}>
              <strong>📱 Démo à montrer :</strong> {pitchActuel.demo}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SOUS-ONGLET 3 : SUPPORTS IMPRIMABLES
      ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'supports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            {
              titre: 'Flyer Démarchage A5',
              desc: 'Flyer officiel avec votre code parrainage et QR code démo.',
              url: `/assets/flyer-commercial-a5?code=${stats.code_apporteur}`,
            },
            {
              titre: 'Fiche Tarifs Officielle A4',
              desc: 'Grille tarifaire (Taf Taf 2 500 F, Pro 5 000 F, Business 10 000 F).',
              url: `/assets/fiche-tarifs-a4?code=${stats.code_apporteur}`,
            },
            {
              titre: 'Mémo de Poche Commercial',
              desc: 'Guide résumé des pitchs et des 10 objections de terrain.',
              url: `/assets/memo-poche-commercial?code=${stats.code_apporteur}`,
            },
            {
              titre: 'Badge Conseiller Officiel',
              desc: 'Carte d\'accréditation officielle avec QR code de vérification.',
              url: `/assets/badge-commercial?code=${stats.code_apporteur}`,
            },
          ].map((s, idx) => (
            <div key={idx} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>{s.titre}</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>{s.desc}</p>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 12px', background: '#1C2B4A', color: '#fff', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Download size={14} /> Télécharger HD
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SOUS-ONGLET 4 : BOUTIQUES RECRUTÉES
      ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'stats' && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 14px' }}>
            Vos Boutiques Recrutées ({stats.boutiques.length})
          </h3>
          {stats.boutiques.length === 0 ? (
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>Aucune boutique recrutée pour l&apos;instant. Utilisez vos pitchs et votre lien pour inscrire vos premiers commerçants !</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.boutiques.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#1C2B4A' }}>{b.nom}</span>
                  <span style={{ color: b.abonnement_statut === 'actif' ? '#16a34a' : '#94A3B8', fontWeight: 700 }}>
                    {b.plan ? `${b.plan} — ${b.abonnement_statut ?? 'inactif'}` : 'Essai / Gratuit'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
