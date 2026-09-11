'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/context'
import { lienBoutiqueWhatsapp, fcfa } from '@/lib/format'
import { getBoutiqueProduits } from './actions'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import type { ManageTab } from './BoutiqueClient'
import type { Boutique } from './boutiqueTypes'
import ExternalImg from '@/components/ExternalImg'
import BoutonPartager from '@/components/BoutonPartager'
import {
  ExternalLink,
  Share2,
  Sparkles,
  Copy,
  Check,
  Download,
  MessageCircle,
  Flame,
  Send,
  QrCode,
  Lock,
  ChevronRight,
  TrendingUp,
  Star,
} from 'lucide-react'

export default function MarketingBoutique({
  boutique,
  onVoirJamaisPartages,
  planActif,
  onOpenQrModal,
  onNavigate,
}: {
  boutique: Boutique
  onVoirJamaisPartages: () => void
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onOpenQrModal?: () => void
  onNavigate?: (tab: ManageTab) => void
}) {
  const { t } = useTranslation()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${boutique.slug || boutique.id}`
  const lienAssistant = lienBoutiqueWhatsapp(boutique.slug || boutique.id)
  const contactTel = boutique.whatsapp || boutique.telephone || ''
  const ville = boutique.ville || 'Dakar'
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const slugOrId = boutique.slug || boutique.id
  const metaXmlUrl = `${backendUrl}/api/flux-catalogue/${slugOrId}/meta.xml`
  const metaCsvUrl = `${backendUrl}/api/flux-catalogue/${slugOrId}/catalogue.csv`

  const [nbJamaisPartages, setNbJamaisPartages] = useState<number | null>(null)
  const [totalProduits, setTotalProduits] = useState<number>(0)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [sponsoringEnCours, setSponsoringEnCours] = useState(false)

  useEffect(() => {
    let annule = false
    getBoutiqueProduits(boutique.id)
      .then(produits => {
        if (annule) return
        setTotalProduits(produits.length)
        setNbJamaisPartages(produits.filter(p => !p.partage_le).length)
      })
      .catch(() => {
        if (!annule) {
          setTotalProduits(0)
          setNbJamaisPartages(0)
        }
      })
    return () => { annule = true }
  }, [boutique.id])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const handleSendWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleActiverSponsoring = async () => {
    setSponsoringEnCours(true)
    try {
      const res = await initierWaveBoutiqueSponsoring(boutique.id)
      if (res.url) {
        window.location.href = res.url
      } else if (res.error) {
        alert(res.error)
      }
    } catch {
      alert('Impossible d\'initier le sponsoring Wave')
    } finally {
      setSponsoringEnCours(false)
    }
  }

  // Modèles de messages de campagne 100% Marque Blanche (au nom du marchand)
  const modelesCampagnes = [
    {
      id: 'lancement',
      icon: '🚀',
      titre: 'Lancement & Présentation de la vitrine',
      desc: 'Idéal pour annoncer votre vitrine à tous vos contacts et groupes WhatsApp.',
      message: `Bonjour ! 👋\n\nDécouvrez notre vitrine officielle en ligne chez *${boutique.nom}* !\n\n🛍️ Retrouvez tous nos articles avec photos, prix et stock à jour.\n👉 Accéder au catalogue et commander : ${lienBoutique}\n\n🚚 Livraison rapide disponible à ${ville} et partout au Sénégal.\n${contactTel ? `💬 Contact WhatsApp direct : ${contactTel}` : ''}`,
    },
    {
      id: 'promo',
      icon: '🔥',
      titre: 'Vente Flash & Promo du Week-End',
      desc: 'Pour booster vos ventes rapidement avec une offre à durée limitée.',
      message: `🔥 *VENTE FLASH CHEZ ${boutique.nom.toUpperCase()} !* 🔥\n\nProfitez de réductions exclusives sur notre sélection d'articles en stock ce week-end !\n\n👉 Découvrez les promotions ici : ${lienBoutique}\n\n⚠️ Offre valable dans la limite des stocks disponibles.\n💬 Commandez directement en répondant à ce message ou sur notre vitrine !`,
    },
    {
      id: 'arrivage',
      icon: '📦',
      titre: 'Nouvel Arrivage & Nouveautés',
      desc: 'Pour notifier vos clients fidèles de l\'arrivée de nouveaux articles.',
      message: `✨ *NOUVEAUX ARRIVAGES DISPONIBLES !* ✨\n\nDe nouveaux articles viennent d'arriver chez *${boutique.nom}* !\n\n👉 Découvrez toutes les nouveautés en photo : ${lienBoutique}\n\n📦 Stock limité — premier arrivé, premier servi !\n${contactTel ? `💬 WhatsApp : ${contactTel}` : ''}`,
    },
    {
      id: 'fetes',
      icon: '🎉',
      titre: 'Fêtes & Événements (Tabaski / Magal / Fin d\'année)',
      desc: 'Pour souhaiter de bonnes fêtes et proposer votre sélection spéciale.',
      message: `✨ Toute l'équipe de *${boutique.nom}* vous souhaite d'excellentes fêtes !\n\nPour préparer vos cadeaux et vos achats en toute sérénité, découvrez notre sélection spéciale :\n👉 ${lienBoutique}\n\n🚚 Livraison garantie à ${ville} et dans toutes les régions.\n💬 Écrivez-nous pour réserver dès maintenant !`,
    },
  ]

  const isSponsorise = boutique.sponsorise && boutique.sponsor_jusqu_au && new Date(boutique.sponsor_jusqu_au) > new Date()
  const dateFinSponsoring = boutique.sponsor_jusqu_au ? new Date(boutique.sponsor_jusqu_au).toLocaleDateString('fr-FR') : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1050, width: '100%' }}>
      {/* ── BANNIÈRE EN-TÊTE DU HUB ── */}
      <div
        className="mkt-banner"
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0F1D35 100%)',
          borderRadius: 20,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(15, 29, 53, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              flexShrink: 0,
            }}
          >
            📣
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              Hub Marketing &amp; Visibilité
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              Diffusez votre vitrine, animez vos réseaux sociaux et multipliez vos ventes en quelques clics.
            </p>
          </div>
        </div>

        {isSponsorise ? (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.18)',
              border: '1.5px solid #eab308',
              borderRadius: 12,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Star size={18} style={{ color: '#facc15' }} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fef08a' }}>
              ⭐ Sponsorisé actif jusqu&apos;au {dateFinSponsoring}
            </span>
          </div>
        ) : null}
      </div>

      {/* ── SECTION 1 : VITRINE & DIFFUSION RAPIDE ── */}
      <div
        className="mkt-card"
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🌐</span>
          <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
            1. Liens de la Vitrine &amp; Partage 1-Clic
          </h3>
        </div>

        <div className="mkt-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Carte Vitrine Marchand */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 14,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {boutique.logo_url ? (
                  <ExternalImg src={boutique.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 24 }}>🏪</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{boutique.nom}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lienBoutique}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <BoutonPartager
                lien={lienBoutique}
                message={`Découvrez notre vitrine officielle ${boutique.nom} !\n\n${lienBoutique}`}
                lienVisuel={`/assets/boutique/${boutique.id}/story`}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(lienBoutique, 'lien_boutique')}
                style={{
                  padding: '7px 12px',
                  background: copiedKey === 'lien_boutique' ? '#10b981' : '#ffffff',
                  color: copiedKey === 'lien_boutique' ? '#ffffff' : '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedKey === 'lien_boutique' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey === 'lien_boutique' ? 'Copié !' : 'Copier lien'}</span>
              </button>
              <a
                href={`/assets/boutique/${boutique.id}/story`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '7px 12px',
                  background: '#f1f5f9',
                  color: '#0f172a',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Download size={14} style={{ color: '#0284c7' }} />
                <span>Story HD (1080×1920)</span>
              </a>
            </div>
          </div>

          {/* Carte Assistant WhatsApp Bot */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 14,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 24 }}>🤖</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#166534' }}>
                  Assistant WhatsApp Catalogue 24/7
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#15803d' }}>
                  Vos clients consultent vos articles et commandent directement dans WhatsApp.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <BoutonPartager
                lien={lienAssistant}
                message={`Découvrez le catalogue de ${boutique.nom} et commandez directement sur WhatsApp !\n\n${lienAssistant}`}
                lienVisuel={`/assets/boutique/${boutique.id}/story`}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(lienAssistant, 'lien_assistant')}
                style={{
                  padding: '7px 12px',
                  background: copiedKey === 'lien_assistant' ? '#10b981' : '#ffffff',
                  color: copiedKey === 'lien_assistant' ? '#ffffff' : '#166534',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedKey === 'lien_assistant' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey === 'lien_assistant' ? 'Copié !' : 'Copier lien'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2 : BOÎTE À OUTILS DE MESSAGES PRÊTS À L'EMPLOI ── */}
      <div
        className="mkt-card"
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
            2. Messages Prêts à l&apos;Emploi (Générateur 1-Clic)
          </h3>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Gagnez du temps : choisissez un modèle déjà rédigé au nom de votre boutique et envoyez-le directement sur WhatsApp ou vos statuts.
        </p>

        <div className="mkt-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {modelesCampagnes.map(campagne => (
            <div
              key={campagne.id}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                minWidth: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{campagne.icon}</span>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    {campagne.titre}
                  </h4>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#64748b' }}>
                  {campagne.desc}
                </p>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: '#334155',
                    maxHeight: 110,
                    overflowY: 'auto',
                    whiteSpace: 'pre-line',
                    fontFamily: 'inherit',
                  }}
                >
                  {campagne.message}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(campagne.message)}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#25D366',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MessageCircle size={15} />
                  <span>Envoyer (WhatsApp)</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(campagne.message, campagne.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: copiedKey === campagne.id ? '#10b981' : '#ffffff',
                    color: copiedKey === campagne.id ? '#ffffff' : '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copiedKey === campagne.id ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedKey === campagne.id ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3 : DIFFUSION & RELANCE DES PRODUITS ── */}
      <div
        className="mkt-card"
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>📢</span>
          <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
            3. Suivi &amp; Diffusion des Produits du Catalogue
          </h3>
        </div>

        {nbJamaisPartages === null ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Chargement des statistiques de partage…</p>
        ) : nbJamaisPartages > 0 ? (
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fcd34d',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#92400e' }}>
                  {nbJamaisPartages} produit{nbJamaisPartages > 1 ? 's' : ''} sur {totalProduits} n&apos;{nbJamaisPartages > 1 ? 'ont' : 'a'} jamais été partagé{nbJamaisPartages > 1 ? 's' : ''}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#b45309' }}>
                  Un partage régulier de vos fiches produits augmente vos ventes de +40% sur WhatsApp et les réseaux.
                </p>
              </div>
            </div>
            <button
              onClick={onVoirJamaisPartages}
              style={{
                background: '#C75B00',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Voir ces {nbJamaisPartages} produits →
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>✅</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#166534' }}>
              Bravo ! Tous vos produits ({totalProduits}) ont déjà été partagés au moins une fois.
            </p>
          </div>
        )}
      </div>

      {/* ── SECTION 4 : RÉSEAUX SOCIAUX & PIXELS PUBLICITAIRES ── */}
      <div
        className="mkt-card"
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
              4. Réseaux Sociaux &amp; Pixels Publicitaires
            </h3>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('fiscalite')}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              ⚙️ Configurer mes pixels &amp; réseaux
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {/* Pixel Meta Facebook */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#1e3a8a' }}>📘 Meta Facebook Pixel</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).meta_pixel_id ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).meta_pixel_id ? `✓ Actif (${(boutique as any).meta_pixel_id})` : '⚪ Non configuré'}
            </p>
          </div>

          {/* Pixel TikTok */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>🎵 TikTok Pixel</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).tiktok_pixel_id ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).tiktok_pixel_id ? `✓ Actif (${(boutique as any).tiktok_pixel_id})` : '⚪ Non configuré'}
            </p>
          </div>

          {/* Page Facebook */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#1d4ed8' }}>🌐 Page Facebook</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).facebook ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).facebook ? '✓ Connectée' : '⚪ Non renseignée'}
            </p>
          </div>

          {/* Compte Instagram */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#e11d48' }}>📸 Instagram</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).instagram ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).instagram ? '✓ Connecté' : '⚪ Non renseigné'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 5 : SUPPORTS PHYSIQUES & BOOSTER ── */}
      <div className="mkt-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* QR Code & Comptoir Physique */}
        <div
          className="mkt-card"
          style={{
            background: '#ffffff',
            borderRadius: 18,
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
            minWidth: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                QR Code Comptoir &amp; Vitrine
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.45 }}>
              Imprimez un QR Code haute définition pour votre comptoir physique. Vos clients scannent et accèdent à votre vitrine ou demandent un crédit client.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenQrModal?.()}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#1C2B4A',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>📱 Ouvrir &amp; Télécharger le QR Code</span>
          </button>
        </div>

        {/* Booster de Visibilité Sponsoring */}
        <div
          className="mkt-card"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: 18,
            border: '1.5px solid #fde68a',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
            minWidth: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#92400e' }}>
                Booster de Visibilité (Sponsoring)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#78350f', lineHeight: 1.45 }}>
              Placez votre boutique en tête de liste des recherches à Dakar et sur la page d&apos;accueil pour maximiser vos visites.
            </p>
          </div>

          <button
            type="button"
            disabled={sponsoringEnCours}
            onClick={handleActiverSponsoring}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#C75B00',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: sponsoringEnCours ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>{sponsoringEnCours ? 'Initialisation…' : '🚀 Activer le Sponsoring Wave'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Gestionnaire de catalogue produits ───────────────────────────────────────

