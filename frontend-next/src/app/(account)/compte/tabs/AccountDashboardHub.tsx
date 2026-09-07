'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { 
  Store, 
  ShoppingBag, 
  Package, 
  PlusCircle, 
  User, 
  Users, 
  Home, 
  Heart, 
  Monitor, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Tag,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react'

interface Props {
  nom: string
  email: string | null
  initiale: string
  userId: string
  session: any
  onNavigateTab: (tabKey: string) => void
}

export default function AccountDashboardHub({
  nom,
  email,
  initiale,
  userId,
  session,
  onNavigateTab,
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  const [annonces, setAnnonces] = useState<any[]>([])
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Récupération des annonces depuis cache ou API
    const cacheAnnoncesKey = `nopalou_offline_annonces_${userId}`
    const cachedAnnonces = typeof window !== 'undefined' ? localStorage.getItem(cacheAnnoncesKey) : null
    if (cachedAnnonces) {
      try {
        setAnnonces(JSON.parse(cachedAnnonces))
      } catch (_) {}
    }

    // 2. Récupération des boutiques depuis cache ou API
    const cachedBoutiques = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_user_boutiques') : null
    if (cachedBoutiques) {
      try {
        setBoutiques(JSON.parse(cachedBoutiques))
      } catch (_) {}
    }

    // Fetch réseau en arrière-plan
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch('/api/annonces/mine', { headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.annonces) {
            setAnnonces(d.annonces)
            localStorage.setItem(cacheAnnoncesKey, JSON.stringify(d.annonces))
          }
        })
        .catch(() => {}),

      fetch('/api/boutiques/mine', { headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const bList = d?.boutiques || (Array.isArray(d) ? d : [])
          if (bList.length > 0) {
            setBoutiques(bList)
            localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(bList))
          }
        })
        .catch(() => {})
    ]).finally(() => setLoading(false))
  }, [userId])

  const hasBoutique = boutiques.length > 0
  const premiereBoutique = hasBoutique ? boutiques[0] : null
  const annoncesActives = annonces.filter(a => a.actif).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 1. Hero Card Profil & Statut Compact (Harmonisé avec Boutique) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
        borderRadius: 14,
        padding: '16px 20px',
        border: '1.5px solid #E8DDD2',
        boxShadow: '0 2px 10px rgba(26,22,18,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 900,
            boxShadow: '0 3px 10px rgba(28,43,74,0.2)',
            flexShrink: 0,
          }}>
            {initiale}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(17px, 3.5vw, 20px)',
                fontWeight: 900,
                color: 'var(--navy, #1C2B4A)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Bonjour, {nom} 👋
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 10,
                background: '#DCFCE7',
                color: '#166534',
                border: '1px solid #BBF7D0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                Actif
              </span>
              {hasBoutique && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: 'var(--orange2, #FFF3E8)',
                  color: 'var(--accent, #C75B00)',
                  border: '1px solid rgba(199,91,0,0.2)',
                }}>
                  🏪 Commerçant
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email || 'Centre de contrôle de votre compte Nopalou'}
            </p>
          </div>
        </div>

        <Link
          href="/compte?tab=profil"
          onClick={(e) => { e.preventDefault(); onNavigateTab('profil'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            background: '#ffffff',
            border: '1.5px solid var(--border, #E8DDD2)',
            padding: '7px 14px',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={14} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Profil</span>
        </Link>
      </div>

      {/* ── 2. Grille de 4 KPIs d'Activité en Direct (Harmonisé Boutique) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(145px, 100%), 1fr))',
        gap: 10,
      }}>
        {/* KPI 1 : Ma Boutique */}
        <Link
          href={hasBoutique ? '/boutique' : '/creer-boutique'}
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '12px 14px',
            border: '1.5px solid #E8DDD2',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ma Boutique
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#FFF3E8', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={14} />
            </div>
          </div>
          <div style={{ margin: '8px 0 2px' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {hasBoutique ? boutiques.length : '0'}
            </span>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
              {hasBoutique ? (boutiques.length > 1 ? 'boutiques' : 'boutique') : 'boutique'}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {hasBoutique ? 'Ouvrir le tableau ➔' : 'Créer ma boutique ➔'}
          </span>
        </Link>

        {/* KPI 2 : Mes Annonces */}
        <Link
          href="/compte?tab=mes-annonces"
          onClick={(e) => { e.preventDefault(); onNavigateTab('mes-annonces'); }}
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '12px 14px',
            border: '1.5px solid #E8DDD2',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mes Annonces
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={14} />
            </div>
          </div>
          <div style={{ margin: '8px 0 2px' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {annoncesActives}
            </span>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
              / {annonces.length} actives
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            Gérer mes annonces ➔
          </span>
        </Link>

        {/* KPI 3 : Mes Commandes */}
        <Link
          href="/compte?tab=suivi-commande"
          onClick={(e) => { e.preventDefault(); onNavigateTab('suivi-commande'); }}
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '12px 14px',
            border: '1.5px solid #E8DDD2',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Commandes
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} />
            </div>
          </div>
          <div style={{ margin: '8px 0 2px' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Suivi
            </span>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
              en direct
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            Voir mes achats ➔
          </span>
        </Link>

        {/* KPI 4 : Affiliation 20% */}
        <Link
          href="/compte?tab=apporteur"
          onClick={(e) => { e.preventDefault(); onNavigateTab('apporteur'); }}
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '12px 14px',
            border: '1.5px solid #E8DDD2',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Commissions
            </span>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} />
            </div>
          </div>
          <div style={{ margin: '8px 0 2px' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              20%
            </span>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
              parrainage
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            Espace apporteur ➔
          </span>
        </Link>
      </div>

      {/* ── 3. Hub d'Actions Rapides 1-Tap (Tactile & Aéré) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>⚡</span>
            <span>Actions Rapides</span>
          </h2>
          <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
            Accès direct en 1-tap
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(145px, 100%), 1fr))',
          gap: 10,
        }}>
          {/* Tuile 1 : Publier une Annonce */}
          <Link
            href="/deposer-annonce"
            style={{
              background: 'linear-gradient(135deg, #C75B00 0%, #EA580C 100%)',
              borderRadius: 12,
              padding: '14px 12px',
              color: '#ffffff',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 3px 10px rgba(199,91,0,0.22)',
              minHeight: 85,
            }}
          >
            <PlusCircle size={24} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              Vendre un article
            </span>
          </Link>

          {/* Tuile 2 : Ma Boutique / POS */}
          <Link
            href={hasBoutique ? '/boutique' : '/creer-boutique'}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 12px',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid #E8DDD2',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)',
              minHeight: 85,
            }}
          >
            <Store size={22} style={{ color: 'var(--accent, #C75B00)' }} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              {hasBoutique ? 'Ma Boutique' : 'Créer Boutique'}
            </span>
          </Link>

          {/* Tuile 3 : Suivi Commandes */}
          <Link
            href="/compte?tab=suivi-commande"
            onClick={(e) => { e.preventDefault(); onNavigateTab('suivi-commande'); }}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 12px',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid #E8DDD2',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)',
              minHeight: 85,
            }}
          >
            <Package size={22} style={{ color: '#2563EB' }} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              Mes Commandes
            </span>
          </Link>

          {/* Tuile 4 : Commissions / Affiliation */}
          <Link
            href="/compte?tab=apporteur"
            onClick={(e) => { e.preventDefault(); onNavigateTab('apporteur'); }}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '14px 12px',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid #E8DDD2',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)',
              minHeight: 85,
            }}
          >
            <Users size={22} style={{ color: '#D97706' }} />
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              Mes Commissions
            </span>
          </Link>
        </div>
      </div>

      {/* ── 4. Raccourcis Horizontaux (Pills) vers les Espaces Secondaires ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
      }}>
        {hasBoutique && (
          <Link
            href="/boutique/caisse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 20,
              background: '#ffffff',
              border: '1px solid #E8DDD2',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 750,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            <Monitor size={14} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Caisse POS</span>
          </Link>
        )}

        <Link
          href="/compte?tab=favoris"
          onClick={(e) => { e.preventDefault(); onNavigateTab('favoris'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid #E8DDD2',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          <Heart size={14} style={{ color: '#DB2777' }} />
          <span>Favoris</span>
        </Link>

        <Link
          href="/compte?tab=mes-annonces-immo"
          onClick={(e) => { e.preventDefault(); onNavigateTab('mes-annonces-immo'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid #E8DDD2',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          <Home size={14} style={{ color: '#7C3AED' }} />
          <span>Immobilier</span>
        </Link>

        <Link
          href="/boutiques"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid #E8DDD2',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          <ShoppingBag size={14} style={{ color: '#059669' }} />
          <span>Explorer boutiques</span>
        </Link>
      </div>

      {/* ── 5. Vos Dernières Annonces ou Onboarding Compact (Zéro Déchet Visuel) ── */}
      {annonces.length > 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 18px',
          border: '1.5px solid #E8DDD2',
          boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Vos dernières annonces
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                {annoncesActives} en ligne sur {annonces.length} déposée(s)
              </p>
            </div>

            <Link
              href="/compte?tab=mes-annonces"
              onClick={(e) => { e.preventDefault(); onNavigateTab('mes-annonces'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 750,
                color: 'var(--accent, #C75B00)',
                textDecoration: 'none',
              }}
            >
              <span>Tout gérer ({annonces.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 10,
          }}>
            {annonces.slice(0, 3).map((a: any) => {
              const photo = a.photos?.[0] ?? null
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: '#FAF8F5',
                    border: '1px solid #E8DDD2',
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: '#E2E8F0',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cloudinaryHQ(photo, { width: 120 })}
                        alt={a.titre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        📷
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: 12.5,
                      fontWeight: 750,
                      color: 'var(--navy, #1C2B4A)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {a.titre}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--accent, #C75B00)', fontWeight: 800 }}>
                      {a.prix ? fcfa(a.prix) : 'Prix sur demande'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: 5,
                    background: a.actif ? '#DCFCE7' : '#FEF3C7',
                    color: a.actif ? '#166534' : '#92400E',
                    flexShrink: 0,
                  }}>
                    {a.actif ? 'Publiée' : 'En attente'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Onboarding compact & chaleureux (pas de pavé vide géant) */
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1.5px solid #E8DDD2',
          boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#FFF3E8',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              🚀
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Commencez à vendre sur Nopalou
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Déposez votre première annonce gratuite ou ouvrez votre boutique avec Caisse POS.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href="/deposer-annonce"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={14} />
              <span>Publier</span>
            </Link>
            {!hasBoutique && (
              <Link
                href="/creer-boutique"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#FAF8F5',
                  border: '1px solid #E8DDD2',
                  color: 'var(--navy, #1C2B4A)',
                  fontWeight: 750,
                  fontSize: 12,
                  textDecoration: 'none',
                }}
              >
                <Store size={14} />
                <span>Créer boutique</span>
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
