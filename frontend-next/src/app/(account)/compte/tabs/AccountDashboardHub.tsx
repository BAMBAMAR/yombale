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
  Bell, 
  Monitor, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Tag
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── 1. Hero Card Profil & Statut ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
        borderRadius: 16,
        padding: '22px 24px',
        border: '1.5px solid #E8DDD2',
        boxShadow: '0 4px 16px rgba(26,22,18,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 900,
            boxShadow: '0 4px 12px rgba(28,43,74,0.22)',
            flexShrink: 0,
          }}>
            {initiale}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 900,
                color: 'var(--navy, #1C2B4A)',
                letterSpacing: '-0.02em',
              }}>
                Bonjour, {nom} 👋
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#DCFCE7',
                color: '#166534',
                border: '1px solid #BBF7D0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                Compte actif
              </span>
              {hasBoutique && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'var(--orange2, #FFF3E8)',
                  color: 'var(--accent, #C75B00)',
                  border: '1px solid rgba(199,91,0,0.2)',
                }}>
                  🏪 Commerçant
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              {email || 'Bienvenue dans votre centre de contrôle Nopalou'}
            </p>
          </div>
        </div>

        {/* Bouton d'action rapide vers profil */}
        <Link
          href="/compte?tab=profil"
          onClick={(e) => { e.preventDefault(); onNavigateTab('profil'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            background: '#ffffff',
            border: '1.5px solid var(--border, #E8DDD2)',
            padding: '8px 16px',
            borderRadius: 10,
            textDecoration: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={15} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Modifier mon profil</span>
        </Link>
      </div>

      {/* ── 2. Grille de Raccourcis Prioritaires (Quick Actions Hub) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>⚡</span>
            <span>Raccourcis & Accès rapides</span>
          </h2>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            Accédez à vos espaces en 1 clic
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 14,
        }}>

          {/* Raccourci 1: Ma Boutique & POS */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            border: '1.5px solid #E8DDD2',
            boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FFF3E8 0%, #FFEDD5 100%)',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Store size={22} />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: hasBoutique ? '#DCFCE7' : '#FEF3C7',
                color: hasBoutique ? '#166534' : '#92400E',
                border: hasBoutique ? '1px solid #BBF7D0' : '1px solid #FDE68A',
              }}>
                {hasBoutique ? `${boutiques.length} boutique${boutiques.length > 1 ? 's' : ''}` : 'Gratuit'}
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {hasBoutique ? (premiereBoutique?.nom || 'Ma Boutique') : 'Ouvrir ma Boutique'}
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                {hasBoutique 
                  ? 'Gérez vos ventes, catalogue produits, commandes et Caisse POS.' 
                  : 'Créez votre boutique en ligne avec Caisse enregistreuse POS.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <Link
                href={hasBoutique ? '/boutique' : '/creer-boutique'}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#ffffff',
                  fontWeight: 750,
                  fontSize: 12.5,
                  textDecoration: 'none',
                }}
              >
                <span>{hasBoutique ? 'Gérer ma boutique' : 'Créer ma boutique'}</span>
                <ArrowRight size={14} />
              </Link>
              {hasBoutique && (
                <Link
                  href="/boutique/caisse"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: 'var(--navy, #1C2B4A)',
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                  }}
                  title="Ouvrir la caisse enregistreuse"
                >
                  <Monitor size={14} />
                  <span>Caisse POS</span>
                </Link>
              )}
            </div>
          </div>

          {/* Raccourci 2: Mes Commandes (Suivi Achats) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            border: '1.5px solid #E8DDD2',
            boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Package size={22} />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
              }}>
                Achats
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Mes Commandes
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                Suivez en temps réel l&apos;état de vos commandes passées auprès des boutiques.
              </p>
            </div>

            <Link
              href="/compte?tab=suivi-commande"
              onClick={(e) => { e.preventDefault(); onNavigateTab('suivi-commande'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 750,
                fontSize: 12.5,
                textDecoration: 'none',
              }}
            >
              <span>Suivre mes commandes</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Raccourci 3: Mes Annonces & Ventes */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            border: '1.5px solid #E8DDD2',
            boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Tag size={22} />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: annonces.length > 0 ? '#DCFCE7' : '#F1F5F9',
                color: annonces.length > 0 ? '#166534' : '#64748B',
                border: annonces.length > 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
              }}>
                {annonces.length} annonce{annonces.length > 1 ? 's' : ''}
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Mes Annonces
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                {annonces.length > 0 
                  ? `${annoncesActives} active(s) en ligne. Gérez vos prix et vos boosts.` 
                  : 'Vendez vos téléphones, meubles, voitures ou vêtements en direct.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Link
                href="/compte?tab=mes-annonces"
                onClick={(e) => { e.preventDefault(); onNavigateTab('mes-annonces'); }}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: 'var(--navy, #1C2B4A)',
                  fontWeight: 750,
                  fontSize: 12.5,
                  textDecoration: 'none',
                }}
              >
                <span>Mes annonces ({annonces.length})</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/deposer-annonce"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 12.5,
                  textDecoration: 'none',
                }}
                title="Déposer une annonce"
              >
                <PlusCircle size={15} />
                <span>Publier</span>
              </Link>
            </div>
          </div>

          {/* Raccourci 4: Programme Apporteur d'Affaires (20%) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            border: '1.5px solid #E8DDD2',
            boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Users size={22} />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
              }}>
                20% de commission
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Espace Apporteur (Parrainage)
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                Recommandez Nopalou à des commerçants et touchez 20% sur chaque abonnement.
              </p>
            </div>

            <Link
              href="/compte?tab=apporteur"
              onClick={(e) => { e.preventDefault(); onNavigateTab('apporteur'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#B45309',
                fontWeight: 750,
                fontSize: 12.5,
                textDecoration: 'none',
              }}
            >
              <span>Accéder à mes commissions</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Raccourci 5: Favoris & Alertes Prix */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            border: '1.5px solid #E8DDD2',
            boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                color: '#DB2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Heart size={22} />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#FDF2F8',
                color: '#BE185D',
                border: '1px solid #FBCFE8',
              }}>
                Coups de cœur
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Favoris & Alertes
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                Retrouvez vos articles sauvegardés et vos alertes de baisse de prix.
              </p>
            </div>

            <Link
              href="/compte?tab=favoris"
              onClick={(e) => { e.preventDefault(); onNavigateTab('favoris'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 750,
                fontSize: 12.5,
                textDecoration: 'none',
              }}
            >
              <span>Voir mes favoris</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Raccourci 6: Immobilier */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            border: '1.5px solid #E8DDD2',
            boxShadow: '0 2px 8px rgba(26,22,18,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Home size={22} />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#F5F3FF',
                color: '#6D28D9',
                border: '1px solid #DDD6FE',
              }}>
                Immo
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Biens Immobiliers
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                Gérez vos locations et ventes de villas, appartements et terrains.
              </p>
            </div>

            <Link
              href="/compte?tab=mes-annonces-immo"
              onClick={(e) => { e.preventDefault(); onNavigateTab('mes-annonces-immo'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 750,
                fontSize: 12.5,
                textDecoration: 'none',
              }}
            >
              <span>Mes annonces immo</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>

      {/* ── 3. Bloc d'Accueil Actif & Suggestions (si 0 annonce ou compte neuf) ── */}
      {annonces.length === 0 && (
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px 28px',
          border: '1.5px solid #E8DDD2',
          boxShadow: '0 4px 16px rgba(26,22,18,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FFF3E8 0%, #FFEDD5 100%)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}>
              🚀
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Prêt à démarrer sur Nopalou ?
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                Que souhaitez-vous réaliser aujourd&apos;hui ? Choisissez une action rapide :
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 14,
            marginTop: 18,
          }}>
            {/* Action 1 */}
            <Link
              href="/deposer-annonce"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px',
                borderRadius: 12,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 24 }}>📣</span>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5, color: 'var(--navy, #1C2B4A)' }}>
                  Vendre un article
                </strong>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Publiez en 1 min (Gratuit)
                </span>
              </div>
            </Link>

            {/* Action 2 */}
            <Link
              href={hasBoutique ? '/boutique' : '/creer-boutique'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px',
                borderRadius: 12,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 24 }}>🏪</span>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5, color: 'var(--navy, #1C2B4A)' }}>
                  {hasBoutique ? 'Ma Boutique' : 'Créer ma Boutique'}
                </strong>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Vitrine web & Caisse POS
                </span>
              </div>
            </Link>

            {/* Action 3 */}
            <Link
              href="/boutiques"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px',
                borderRadius: 12,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 24 }}>🛍️</span>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5, color: 'var(--navy, #1C2B4A)' }}>
                  Explorer les Boutiques
                </strong>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Achetez auprès des vendeurs
                </span>
              </div>
            </Link>

            {/* Action 4 */}
            <Link
              href="/compte?tab=apporteur"
              onClick={(e) => { e.preventDefault(); onNavigateTab('apporteur'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px',
                borderRadius: 12,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 24 }}>💰</span>
              <div>
                <strong style={{ display: 'block', fontSize: 13.5, color: 'var(--navy, #1C2B4A)' }}>
                  Devenir Apporteur
                </strong>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Gagnez 20% de commissions
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ── 4. Aperçu des annonces récentes (si l'utilisateur en a au moins une) ── */}
      {annonces.length > 0 && (
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '20px 24px',
          border: '1.5px solid #E8DDD2',
          boxShadow: '0 4px 16px rgba(26,22,18,0.03)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Vos dernières annonces
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
                {annoncesActives} en ligne sur {annonces.length} déposée(s)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/compte?tab=mes-annonces"
                onClick={(e) => { e.preventDefault(); onNavigateTab('mes-annonces'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: 'var(--accent, #C75B00)',
                  textDecoration: 'none',
                }}
              >
                <span>Tout gérer ({annonces.length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 12,
          }}>
            {annonces.slice(0, 3).map((a: any) => {
              const photo = a.photos?.[0] ?? null
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: '#FAF8F5',
                    border: '1px solid #E8DDD2',
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
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
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        📷
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 750,
                      color: 'var(--navy, #1C2B4A)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {a.titre}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--accent, #C75B00)', fontWeight: 800 }}>
                      {a.prix ? fcfa(a.prix) : 'Prix sur demande'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 6,
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
      )}

    </div>
  )
}
