'use client'

import React from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import {
  MapPin, Building2, Star, ArrowRight, MessageCircle,
  ShoppingBag, Sparkles, Check
} from 'lucide-react'
import { getCategoryCoverPhoto } from '@/lib/boutique-covers'
import BadgeVerification from '@/components/BadgeVerification'
import { sponsoringActif } from '@/lib/sponsoring'
import BadgeSponsorise from '@/components/BadgeSponsorise'

export interface ProduitApercu {
  id: string
  nom: string
  prix: number | string
  prix_barre?: number | string | null
  image: string | null
  slug?: string | null
}

export interface BoutiqueItem {
  id: string
  slug: string | null
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  horaires: Record<string, string> | null
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  plan_actif: 'pro' | 'business' | null
  statut_verification?: 'non_verifie' | 'verifie' | 'certifie'
  note_moyenne?: number | string
  total_avis?: number
  total_produits?: number
  produits_apercu?: ProduitApercu[]
  created_at: string
}

function estOuvertActuellement(horaires?: Record<string, string> | null): { ouverte: boolean; label: string } {
  if (!horaires || Object.keys(horaires).length === 0) {
    return { ouverte: true, label: 'Ouvert 7j/7' }
  }
  const joursKeys = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const now = new Date()
  const jourActuel = joursKeys[now.getDay()]
  const plage = horaires[jourActuel]

  if (!plage || plage.toLowerCase().includes('fermé')) {
    return { ouverte: false, label: 'Fermé' }
  }

  const match = plage.match(/(\d{1,2})[:h](\d{2})?\s*-\s*(\d{1,2})[:h](\d{2})?/)
  if (match) {
    const startHour = parseInt(match[1], 10)
    const endHour = parseInt(match[3], 10)
    const currentHour = now.getHours()
    if (currentHour >= startHour && currentHour < endHour) {
      return { ouverte: true, label: `Ouvert jusqu'à ${endHour}h` }
    } else {
      return { ouverte: false, label: `Fermé (Ouvre à ${startHour}h)` }
    }
  }
  return { ouverte: true, label: 'Ouvert' }
}

function formatPrixFCFA(val: number | string | undefined | null) {
  if (val === undefined || val === null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return `${val} F`
  return new Intl.NumberFormat('fr-SN').format(num) + ' F'
}

export default function BoutiqueCard({
  boutique,
  searchQuery = '',
}: {
  boutique: BoutiqueItem
  searchQuery?: string
}) {
  const b = boutique
  const sponsorActif = sponsoringActif(b.sponsorise, b.sponsor_jusqu_au)
  const estPro = b.plan_actif === 'pro'
  const estBusiness = b.plan_actif === 'business'
  const statutOuverture = estOuvertActuellement(b.horaires)
  const whatsappNumber = b.whatsapp || b.telephone
  const estMisEnAvant = estBusiness || estPro || sponsorActif

  const coverImageSrc = b.cover_url || getCategoryCoverPhoto(b.nom, b.categorie)
  const words = b.nom.trim().split(/\s+/)
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : b.nom.slice(0, 2).toUpperCase()
  const boutiqueLien = `/boutiques/${b.slug || b.id}`

  const produits = b.produits_apercu || []
  const hasProduits = produits.length > 0
  const qClean = searchQuery.trim().toLowerCase()

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: estMisEnAvant ? '1.5px solid #fde68a' : '1px solid #e5e7eb',
        boxShadow: estMisEnAvant ? '0 8px 24px -4px rgba(245, 158, 11, 0.14)' : '0 4px 16px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, boxShadow 0.2s ease',
        position: 'relative',
      }}
    >
      {/* ── COUVERTURE HD ── */}
      <div style={{ width: '100%', height: 110, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
        <ExternalImg src={coverImageSrc} alt={b.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />

        {/* Statut ouverture */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          background: 'rgba(255, 255, 255, 0.94)', color: '#0f172a', backdropFilter: 'blur(8px)',
          padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statutOuverture.ouverte ? '#16a34a' : '#94a3b8',
            boxShadow: statutOuverture.ouverte ? '0 0 6px rgba(22,163,74,0.6)' : 'none'
          }} />
          <span>{statutOuverture.label}</span>
        </div>

        {/* Badges Business / Pro / Sponsorisé */}
        {estBusiness && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--navy, #1C2B4A)', color: '#fff', padding: '3px 9px', borderRadius: 14, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} style={{ color: '#fbbf24' }} />
            <span>Business</span>
          </div>
        )}
        {estPro && !estBusiness && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--accent, #C75B00)', color: '#fff', padding: '3px 9px', borderRadius: 14, fontSize: 11, fontWeight: 800 }}>
            Vendeur Pro
          </div>
        )}
        {/* AUD-160 : un placement payant est toujours signalé */}
        <BadgeSponsorise actif={sponsorActif} style={{ bottom: 8, left: 10 }} />
      </div>

      {/* ── CORPS DE CARTE ── */}
      <div style={{ padding: '0 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* LOGO & AVIS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -28, marginBottom: 8, position: 'relative', zIndex: 3 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12, overflow: 'hidden',
            border: '3px solid #fff', background: b.logo_url ? '#fff' : '#fff7ed',
            boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ExternalImg src={b.logo_url} alt={b.nom} fallback={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {b.total_avis && b.total_avis > 0 && b.note_moyenne ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fffbeb', padding: '3px 8px', borderRadius: 10, border: '1px solid #fef3c7' }}>
              <Star size={12} style={{ color: '#d97706', fill: '#d97706' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e' }}>
                {Number(b.note_moyenne).toFixed(1)} / 5 ({b.total_avis})
              </span>
            </div>
          ) : null}
        </div>

        {/* NOM DE LA BOUTIQUE */}
        <h3 style={{ margin: '0 0 4px', fontSize: 15.5, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
          <Link href={boutiqueLien} prefetch={false} style={{ color: 'inherit', textDecoration: 'none' }}>
            {b.nom}
          </Link>
        </h3>
        {/* AUD-140 : badge seulement si attribué par Nopalou */}
        {(b.statut_verification === 'verifie' || b.statut_verification === 'certifie') && (
          <div style={{ margin: '0 0 6px' }}>
            <BadgeVerification statut={b.statut_verification} compact />
          </div>
        )}

        {/* DESCRIPTION COURTE */}
        {b.description && (
          <p style={{
            margin: '0 0 10px', fontSize: 12, color: '#6b7280', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {b.description}
          </p>
        )}

        {/* ── RUBAN PREVIEW DES PRODUITS (MINI-GALERIE) ── */}
        <div style={{
          marginTop: 'auto',
          marginBottom: 10,
          background: '#f8fafc',
          borderRadius: 12,
          padding: '8px 10px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#475569' }}>
              <ShoppingBag size={12} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>
                {b.total_produits && b.total_produits > 0
                  ? `${b.total_produits} article${b.total_produits > 1 ? 's' : ''} disponible${b.total_produits > 1 ? 's' : ''}`
                  : 'Catalogue produits'}
              </span>
            </span>
            <Link
              href={boutiqueLien}
              prefetch={false}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', textDecoration: 'none' }}
            >
              Voir tout →
            </Link>
          </div>

          {hasProduits ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {produits.slice(0, 4).map(prod => {
                const isMatch = qClean && (
                  prod.nom.toLowerCase().includes(qClean) ||
                  (prod.slug && prod.slug.toLowerCase().includes(qClean))
                )

                return (
                  <Link
                    key={prod.id}
                    href={`${boutiqueLien}/produits/${prod.id}`}
                    prefetch={false}
                    title={`${prod.nom} — ${formatPrixFCFA(prod.prix)}`}
                    style={{
                      textDecoration: 'none',
                      position: 'relative',
                      borderRadius: 8,
                      overflow: 'hidden',
                      aspectRatio: '1 / 1',
                      background: '#ffffff',
                      border: isMatch ? '1.5px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                      boxShadow: isMatch ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {prod.image ? (
                      <ExternalImg
                        src={prod.image}
                        alt={prod.nom}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ShoppingBag size={18} />
                      </div>
                    )}

                    {/* Badge Promo si prix barré */}
                    {prod.prix_barre && Number(prod.prix_barre) > Number(prod.prix) && (
                      <span style={{
                        position: 'absolute', top: 3, right: 3, zIndex: 3,
                        background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 900,
                        padding: '1.5px 4px', borderRadius: 4, lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }}>
                        PROMO
                      </span>
                    )}

                    {/* Gradient de lisibilité & Prix */}
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.4) 65%, transparent 100%)',
                      padding: '2px 3px',
                      textAlign: 'center',
                    }}>
                      <span style={{
                        display: 'block',
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.1,
                      }}>
                        {formatPrixFCFA(prod.prix)}
                      </span>
                      {prod.prix_barre && Number(prod.prix_barre) > Number(prod.prix) && (
                        <span style={{
                          display: 'block',
                          fontSize: 8,
                          color: '#cbd5e1',
                          textDecoration: 'line-through',
                          lineHeight: 1,
                          marginTop: 1
                        }}>
                          {formatPrixFCFA(prod.prix_barre)}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: '#64748b' }}>
              Catalogue disponible directement sur WhatsApp
            </div>
          )}
        </div>

        {/* LIEU & CATÉGORIE */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11.5, color: '#4b5563', marginBottom: 12 }}>
          {b.ville && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f8fafc', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>
              <MapPin size={11} style={{ color: 'var(--accent, #C75B00)' }} /> {b.ville}
            </span>
          )}
          {b.categorie && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f8fafc', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>
              <Building2 size={11} style={{ color: '#475569' }} /> {b.categorie}
            </span>
          )}
        </div>

        {/* BOUTONS D'ACTION */}
        <div style={{ display: 'grid', gridTemplateColumns: whatsappNumber ? '1fr auto' : '1fr', gap: 8 }}>
          <Link
            href={boutiqueLien}
            prefetch={false}
            style={{
              textAlign: 'center', background: 'var(--accent, #C75B00)', color: '#fff',
              padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
              fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(199,91,0,0.2)',
            }}
          >
            <span>Visiter la boutique</span>
            <ArrowRight size={13} />
          </Link>

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${b.nom}, j'ai vu votre boutique sur Nopalou !`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25d366', color: '#fff', padding: '8px 11px',
                borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37,211,102,0.2)',
              }}
              title="Contacter sur WhatsApp"
            >
              <MessageCircle size={15} />
            </a>
          )}
        </div>

      </div>
    </div>
  )
}
