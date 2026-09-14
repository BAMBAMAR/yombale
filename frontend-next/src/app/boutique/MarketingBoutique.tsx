'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/context'
import { lienBoutiqueWhatsapp } from '@/lib/format'
import { getBoutiqueProduits } from './actions'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import type { ManageTab } from './BoutiqueClient'
import type { Boutique } from './boutiqueTypes'
import {
  Megaphone,
  Star,
  Package,
  TrendingUp,
} from 'lucide-react'
import MarketingVitrineDiffusion from './marketing/MarketingVitrineDiffusion'
import MarketingCampagnesList from './marketing/MarketingCampagnesList'
import MarketingPixelsAndPhysical from './marketing/MarketingPixelsAndPhysical'

interface MarketingBoutiqueProps {
  boutique: Boutique
  onVoirJamaisPartages: () => void
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onOpenQrModal?: () => void
  onNavigate?: (tab: ManageTab) => void
}

export default function MarketingBoutique({
  boutique,
  onVoirJamaisPartages,
  planActif,
  onOpenQrModal,
  onNavigate,
}: MarketingBoutiqueProps) {
  const { t } = useTranslation()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${boutique.slug || boutique.id}`
  const lienAssistant = lienBoutiqueWhatsapp(boutique.slug || boutique.id)
  const contactTel = boutique.whatsapp || boutique.telephone || ''
  const ville = boutique.ville || 'Dakar'

  const [nbJamaisPartages, setNbJamaisPartages] = useState<number | null>(null)
  const [totalProduits, setTotalProduits] = useState<number>(0)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [sponsoringEnCours, setSponsoringEnCours] = useState(false)

  useEffect(() => {
    let annule = false
    getBoutiqueProduits(boutique.id)
      .then((produits) => {
        if (annule) return
        setTotalProduits(produits.length)
        setNbJamaisPartages(produits.filter((p) => !p.partage_le).length)
      })
      .catch(() => {
        if (!annule) {
          setTotalProduits(0)
          setNbJamaisPartages(0)
        }
      })
    return () => {
      annule = true
    }
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
      alert("Impossible d'initier le sponsoring Wave")
    } finally {
      setSponsoringEnCours(false)
    }
  }

  // Modèles de messages de campagne 100% Marque Blanche (au nom du marchand)
  const modelesCampagnes = [
    {
      id: 'lancement',
      titre: 'Lancement & Présentation de la vitrine',
      desc: 'Idéal pour annoncer votre vitrine à tous vos contacts et groupes WhatsApp.',
      message: `Bonjour ! \n\nDécouvrez notre vitrine officielle en ligne chez *${boutique.nom}* !\n\nRetrouvez tous nos articles avec photos, prix et stock à jour.\nAccéder au catalogue et commander : ${lienBoutique}\n\nLivraison rapide disponible à ${ville} et partout au Sénégal.\n${contactTel ? `Contact WhatsApp direct : ${contactTel}` : ''}`,
    },
    {
      id: 'promo',
      titre: 'Vente Flash & Promo du Week-End',
      desc: 'Pour booster vos ventes rapidement avec une offre à durée limitée.',
      message: `*VENTE FLASH CHEZ ${boutique.nom.toUpperCase()} !* \n\nProfitez de réductions exclusives sur notre sélection d'articles en stock ce week-end !\n\nDécouvrez les promotions ici : ${lienBoutique}\n\nOffre valable dans la limite des stocks disponibles.\nCommandez directement en répondant à ce message ou sur notre vitrine !`,
    },
    {
      id: 'arrivage',
      titre: 'Nouvel Arrivage & Nouveautés',
      desc: "Pour notifier vos clients fidèles de l'arrivée de nouveaux articles.",
      message: `*NOUVEAUX ARRIVAGES DISPONIBLES !* \n\nDe nouveaux articles viennent d'arriver chez *${boutique.nom}* !\n\nDécouvrez toutes les nouveautés en photo : ${lienBoutique}\n\nStock limité — premier arrivé, premier servi !\n${contactTel ? `WhatsApp : ${contactTel}` : ''}`,
    },
    {
      id: 'fetes',
      titre: "Fêtes & Événements (Tabaski / Magal / Fin d'année)",
      desc: 'Pour souhaiter de bonnes fêtes et proposer votre sélection spéciale.',
      message: `Toute l'équipe de *${boutique.nom}* vous souhaite d'excellentes fêtes !\n\nPour préparer vos cadeaux et vos achats en toute sérénité, découvrez notre sélection spéciale :\n${lienBoutique}\n\nLivraison garantie à ${ville} et dans toutes les régions.\nÉcrivez-nous pour réserver dès maintenant !`,
    },
  ]

  const isSponsorise =
    boutique.sponsorise &&
    boutique.sponsor_jusqu_au &&
    new Date(boutique.sponsor_jusqu_au) > new Date()
  const dateFinSponsoring = boutique.sponsor_jusqu_au
    ? new Date(boutique.sponsor_jusqu_au).toLocaleDateString('fr-FR')
    : null

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
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Megaphone size={26} />
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

        {isSponsorise && (
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
              Sponsorisé actif jusqu&apos;au {dateFinSponsoring}
            </span>
          </div>
        )}
      </div>

      {/* ── SECTION 1 : VITRINE & DIFFUSION RAPIDE ── */}
      <MarketingVitrineDiffusion
        boutique={boutique}
        lienBoutique={lienBoutique}
        lienAssistant={lienAssistant}
        copiedKey={copiedKey}
        copyToClipboard={copyToClipboard}
      />

      {/* ── SECTION 2 : BOÎTE À OUTILS DE MESSAGES PRÊTS À L'EMPLOI ── */}
      <MarketingCampagnesList
        modelesCampagnes={modelesCampagnes}
        handleSendWhatsApp={handleSendWhatsApp}
        copyToClipboard={copyToClipboard}
        copiedKey={copiedKey}
      />

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
          <TrendingUp size={20} style={{ color: '#0f172a' }} />
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
              <Package size={24} style={{ color: '#b45309', flexShrink: 0 }} />
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
            <Package size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#166534' }}>
              Bravo ! Tous vos produits ({totalProduits}) ont déjà été partagés au moins une fois.
            </p>
          </div>
        )}
      </div>

      {/* ── SECTION 4 & 5 : RÉSEAUX SOCIAUX, PIXELS & SUPPORTS PHYSIQUES ── */}
      <MarketingPixelsAndPhysical
        boutique={boutique}
        onNavigate={onNavigate}
        onOpenQrModal={onOpenQrModal}
        sponsoringEnCours={sponsoringEnCours}
        handleActiverSponsoring={handleActiverSponsoring}
      />
    </div>
  )
}
