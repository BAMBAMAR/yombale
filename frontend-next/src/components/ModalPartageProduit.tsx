'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'
import { publierProduitAnnonce } from '@/app/boutique/actions'
import { 
  Share2, MessageCircle, Copy, Check, Download, 
  Sparkles, ExternalLink, Tag, Smartphone, Send, X 
} from 'lucide-react'

export interface ModalPartageProduitProps {
  isOpen: boolean
  onClose: () => void
  produit: {
    id: string
    nom: string
    prix?: number | null
    prix_barre?: number | null
    images?: string[]
    categorie?: string | null
  }
  boutique: {
    id: string
    nom: string
    slug?: string | null
    whatsapp?: string | null
    telephone?: string | null
    ville?: string | null
  }
  isNewlyCreated?: boolean
  onAnnoncePubliee?: () => void
}

type TemplateType = 'promo' | 'statut' | 'credit' | 'reseaux'

export default function ModalPartageProduit({
  isOpen,
  onClose,
  produit,
  boutique,
  isNewlyCreated = false,
  onAnnoncePubliee,
}: ModalPartageProduitProps) {
  const { t } = useTranslation()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('promo')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)
  const [canWebShare, setCanWebShare] = useState<boolean>(false)
  const [publishingAnnonce, setPublishingAnnonce] = useState<boolean>(false)
  const [annonceStatus, setAnnonceStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [annonceMsg, setAnnonceMsg] = useState<string>('')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const boutiqueIdentifier = boutique.slug || boutique.id
  const productUrl = `${siteUrl}/boutiques/${boutiqueIdentifier}/produits/${produit.id}`
  const storyVisualUrl = `/assets/produit-boutique/${produit.id}/story?boutiqueId=${boutique.id}`
  const contactTel = boutique.whatsapp || boutique.telephone || ''
  const ville = boutique.ville || 'Dakar'

  const remise = (produit.prix && produit.prix_barre && produit.prix_barre > produit.prix)
    ? Math.round((1 - produit.prix / produit.prix_barre) * 100)
    : null

  // Vérifier si la Web Share API est supportée
  useEffect(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && !!navigator.share) {
      setCanWebShare(true)
    }
  }, [])

  // Modèles de messages rédigés au nom du commerçant (100% Marque Blanche)
  const templates = useMemo(() => {
    const prixFmt = produit.prix ? fcfa(produit.prix) : 'Prix sur demande'
    const cleanBoutiqueNom = boutique.nom.replace(/[\s\-_]+/g, '')
    const cleanCat = (produit.categorie || 'Shopping').replace(/[\s\-_]+/g, '')

    return {
      promo: remise
        ? `🔥 OFFRE SPÉCIALE chez ${boutique.nom} !\n\n${produit.nom} est en promotion exceptionnelle à ${prixFmt} (au lieu de ${fcfa(produit.prix_barre!)} — remise -${remise}%) !\n\n🚚 Livraison rapide disponible à ${ville} et partout au Sénégal.\n👉 Voir le produit et commander : ${productUrl}\n${contactTel ? `💬 WhatsApp direct : ${contactTel}` : ''}`
        : `🔥 NOUVEL ARRIVAGE chez ${boutique.nom} !\n\n${produit.nom} est maintenant disponible en stock à ${prixFmt}.\n\n🚚 Livraison rapide disponible.\n👉 Voir et commander : ${productUrl}\n${contactTel ? `💬 WhatsApp direct : ${contactTel}` : ''}`,

      statut: `✨ ${produit.nom} disponible chez ${boutique.nom} !\n💰 Prix : ${prixFmt}${remise ? ` (-${remise}%)` : ''}\n📍 ${ville}\n📲 Commandez directement ici : ${productUrl}`,

      credit: `🤝 Facilité de paiement chez ${boutique.nom} !\n\nBesoin de "${produit.nom}" (${prixFmt}) ?\nPassez votre commande ou demandez un paiement échelonné en magasin.\n\n👉 Accéder à la boutique : ${productUrl}\n${contactTel ? `💬 Contactez-nous : ${contactTel}` : ''}`,

      reseaux: `✨ Retrouvez "${produit.nom}" chez ${boutique.nom} !\n\n💰 Prix : ${prixFmt}${remise ? ` (Promo -${remise}%)` : ''}\n📍 ${ville}, Sénégal\n🚚 Livraison express disponible !\n\n👉 Lien pour commander dans notre bio ou ici : ${productUrl}\n\n#Dakar #Senegal #${cleanBoutiqueNom} #${cleanCat} #ShoppingDakar #BoutiqueDakar #BonPlanSenegal`,
    }
  }, [produit, boutique, productUrl, contactTel, ville, remise])

  // Synchroniser le message affiché lors du changement de template
  useEffect(() => {
    setCustomMessage(templates[selectedTemplate])
  }, [selectedTemplate, templates])

  if (!isOpen) return null

  const handleCopierMessage = () => {
    navigator.clipboard.writeText(customMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePartagerWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(customMessage)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  const handleWebShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: `${produit.nom} — ${boutique.nom}`,
        text: customMessage,
        url: productUrl,
      })
    } catch (err) {
      // Ignorer si l'utilisateur a annulé le partage
    }
  }

  const handlePublierAnnonce = async () => {
    setPublishingAnnonce(true)
    setAnnonceStatus('idle')
    try {
      const res = await publierProduitAnnonce(boutique.id, produit.id)
      if (res.error) {
        setAnnonceStatus('error')
        setAnnonceMsg(res.error)
      } else {
        setAnnonceStatus('success')
        setAnnonceMsg(res.message || '✅ Annonce Nopalou publiée avec succès !')
        onAnnoncePubliee?.()
      }
    } catch {
      setAnnonceStatus('error')
      setAnnonceMsg('Erreur de connexion lors de la publication')
    } finally {
      setPublishingAnnonce(false)
    }
  }

  const firstImg = produit.images?.[0]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: 580,
          width: '100%',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 18,
            top: 18,
            background: '#f1f5f9',
            border: 'none',
            borderRadius: 20,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: 800,
            color: '#64748b',
          }}
          title={t('common.close')}
        >
          <X size={18} />
        </button>

        {/* Titre & Sous-titre */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>{isNewlyCreated ? '🎉' : '🚀'}</span>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
              {isNewlyCreated ? 'Produit ajouté avec succès !' : 'Partager ce produit'}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Partagez immédiatement sur vos réseaux pour attirer vos clients et déclencher des ventes.
          </p>
        </div>

        {/* Carte Résumé Produit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 16,
            padding: '12px 16px',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {firstImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstImg}
                alt={produit.nom}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 26 }}>🛍️</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 800,
                color: '#0f172a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {produit.nom}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#16a34a' }}>
                {produit.prix ? fcfa(produit.prix) : 'Prix sur demande'}
              </span>
              {produit.prix_barre && (
                <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>
                  {fcfa(produit.prix_barre)}
                </span>
              )}
              {remise && (
                <span
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 8,
                  }}
                >
                  -{remise}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sélecteur de Modèle de Message */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
            Sélectionnez le type de message à partager :
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {[
              { key: 'promo', label: '🔥 Promo / Nouveauté', desc: 'Message vendeur complet' },
              { key: 'statut', label: '📱 Statut WhatsApp', desc: 'Court & percutant' },
              { key: 'credit', label: '💳 Achat / Crédit', desc: 'Facilités de paiement' },
              { key: 'reseaux', label: '📸 Insta & TikTok', desc: 'Avec hashtags Sénégal' },
            ].map(tpl => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => setSelectedTemplate(tpl.key as TemplateType)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: selectedTemplate === tpl.key ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: selectedTemplate === tpl.key ? '#f0f9ff' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: selectedTemplate === tpl.key ? '#0284c7' : '#0f172a' }}>
                  {tpl.label}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, color: '#64748b' }}>
                  {tpl.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Éditeur de Message Pré-rempli */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#334155' }}>
              Message personnalisé (modifiable) :
            </label>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {customMessage.length} caractères
            </span>
          </div>
          <textarea
            rows={4}
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1.5px solid #cbd5e1',
              fontSize: 12.5,
              lineHeight: 1.5,
              color: '#0f172a',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Boutons d'Action Principaux */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Bouton WhatsApp 1-Clic */}
          <button
            type="button"
            onClick={handlePartagerWhatsApp}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 12,
              border: 'none',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
            }}
          >
            <MessageCircle size={18} />
            <span>Partager sur WhatsApp (1-Clic)</span>
          </button>

          {/* Boutons Secondaires (Web Share & Copier) */}
          <div style={{ display: 'grid', gridTemplateColumns: canWebShare ? '1fr 1fr' : '1fr', gap: 8 }}>
            {canWebShare && (
              <button
                type="button"
                onClick={handleWebShare}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #0284c7',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Share2 size={15} />
                <span>Autres applications</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopierMessage}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: copied ? '#10b981' : '#f8fafc',
                color: copied ? '#ffffff' : '#334155',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'Message copié !' : 'Copier le message'}</span>
            </button>
          </div>

          {/* Téléchargement de la Story HD 100% Marque Blanche */}
          <a
            href={storyVisualUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: 12.5,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box',
            }}
          >
            <Download size={15} style={{ color: '#0284c7' }} />
            <span>🖼️ Télécharger le visuel Story HD (1080×1920)</span>
          </a>
        </div>

        {/* Liens Réseaux Sociaux & Annonce */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {/* Partage direct web */}
          <div style={{ display: 'flex', gap: 6 }}>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: 11.5,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(customMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#f0f9ff',
                color: '#0284c7',
                fontSize: 11.5,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Send size={13} /> Telegram
            </a>
          </div>

          {/* Publier en annonce Nopalou */}
          <button
            type="button"
            onClick={handlePublierAnnonce}
            disabled={publishingAnnonce || annonceStatus === 'success'}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: annonceStatus === 'success' ? '#f0fdf4' : '#ffffff',
              color: annonceStatus === 'success' ? '#166534' : '#334155',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: (publishingAnnonce || annonceStatus === 'success') ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Tag size={13} />
            <span>{publishingAnnonce ? 'Publication…' : annonceStatus === 'success' ? '✓ Annonce en ligne' : '🏷️ Publier en Annonce'}</span>
          </button>
        </div>

        {annonceMsg && (
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              fontWeight: 700,
              color: annonceStatus === 'success' ? '#16a34a' : '#dc2626',
              textAlign: 'center',
            }}
          >
            {annonceMsg}
          </p>
        )}
      </div>
    </div>
  )
}
