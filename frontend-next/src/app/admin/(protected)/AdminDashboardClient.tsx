'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, Users, Store, ShoppingBag, AlertCircle, CheckCircle2,
  Clock, ShieldAlert, Zap, MessageCircle, Package, Layers, Award,
  ArrowUpRight, RefreshCw, Smartphone, Home, Tag, Handshake, Briefcase, Flag
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface DashboardStats {
  period: string
  generatedAt: string
  finances: {
    ca_total_ventes: number
    nb_ventes_total: number
    mrr: number
    abonnements_actifs: number
    nouveaux_abonnements_periode: number
    abonnements_business: number
    abonnements_pro: number
    abonnements_decouverte: number
    paiements_valides_periode: number
  }
  utilisateurs: {
    total: number
    nouveaux_periode: number
    verifies: number
    suspendus: number
    apporteurs: number
  }
  boutiques: {
    total: number
    actives: number
    nouvelles_periode: number
    sponsorisees: number
    zero_produit: number
  }
  commandes: {
    total: number
    volume: number
    en_attente: number
    livrees: number
  }
  catalogue: {
    produits_scrapes: number
    produits_marchands: number
    produits_en_stock: number
    annonces_total: number
    annonces_actives: number
    immo_total: number
    immo_actives: number
  }
  whatsapp: {
    sessions_chatbot_actives: number
    messages_traites_periode: number
    optouts: number
    leads_total: number
    leads_convertis: number
    messages_prospection_periode: number
  }
  actionCenter: {
    totalActionsRequises: number
    alertes: {
      annonces_en_attente: number
      immo_en_attente: number
      immo_demandes_sponsoring: number
      paiements_manuels_en_attente: number
      partenaires_en_attente: number
      support_en_attente: number
      boutiques_zero_produit: number
    }
  }
}

const PERIODES = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 derniers jours' },
  { id: '30d', label: '30 derniers jours' },
  { id: 'all', label: 'Tout l\'historique' },
]

export default function AdminDashboardClient({
  initialStats,
  secret,
}: {
  initialStats: DashboardStats
  secret: string
}) {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [period, setPeriod] = useState<string>(initialStats?.period || '30d')
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/dashboard/stats?period=${newPeriod}`, {
          headers: { 'X-Admin-Secret': secret },
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('[CHANGE_PERIOD_ERR]', err)
      }
    })
  }

  const { finances, utilisateurs, boutiques, commandes, catalogue, whatsapp, actionCenter } = stats || {}

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60 }}>
      {/* En-tête avec Sélecteur de Période */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            🚀 Console de Pilotage Nopalou
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Vue panoramique en temps réel : finances, marchands, catalogue, opérations & alertes.
          </p>
        </div>

        {/* Sélecteur de Période */}
        <div style={{ display: 'flex', background: '#fff', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          {PERIODES.map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              disabled={isPending}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: period === p.id ? '#1e293b' : 'transparent',
                color: period === p.id ? '#fff' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔴 ACTION CENTER : À Traiter Immédiatement */}
      {actionCenter && actionCenter.totalActionsRequises > 0 ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '1px solid #fecdd3',
            borderRadius: 14,
            padding: '20px',
            marginBottom: 28,
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🔴</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#9f1239' }}>
                Action Center — {actionCenter.totalActionsRequises} action(s) requise(s)
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#be123c' }}>
                Éléments en attente nécessitant une modération ou intervention de l'équipe administrative.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {actionCenter.alertes.annonces_en_attente > 0 && (
              <Link
                href="/admin/annonces"
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #fda4af',
                  textDecoration: 'none',
                  color: '#9f1239',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Annonces à valider</span>
                <span style={{ background: '#e11d48', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                  {actionCenter.alertes.annonces_en_attente}
                </span>
              </Link>
            )}

            {actionCenter.alertes.immo_en_attente > 0 && (
              <Link
                href="/admin/immo"
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #fda4af',
                  textDecoration: 'none',
                  color: '#9f1239',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Immo à valider</span>
                <span style={{ background: '#e11d48', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                  {actionCenter.alertes.immo_en_attente}
                </span>
              </Link>
            )}

            {actionCenter.alertes.paiements_manuels_en_attente > 0 && (
              <Link
                href="/admin/paiements-manuels"
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #fda4af',
                  textDecoration: 'none',
                  color: '#9f1239',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Dépôts Wave/OM</span>
                <span style={{ background: '#e11d48', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                  {actionCenter.alertes.paiements_manuels_en_attente}
                </span>
              </Link>
            )}

            {actionCenter.alertes.partenaires_en_attente > 0 && (
              <Link
                href="/admin/partenaires"
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #fda4af',
                  textDecoration: 'none',
                  color: '#9f1239',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Demandes Partenaires</span>
                <span style={{ background: '#e11d48', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                  {actionCenter.alertes.partenaires_en_attente}
                </span>
              </Link>
            )}

            {actionCenter.alertes.immo_demandes_sponsoring > 0 && (
              <Link
                href="/admin/immo"
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #fda4af',
                  textDecoration: 'none',
                  color: '#9f1239',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Sponsoring Immo</span>
                <span style={{ background: '#e11d48', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                  {actionCenter.alertes.immo_demandes_sponsoring}
                </span>
              </Link>
            )}

            {actionCenter.alertes.boutiques_zero_produit > 0 && (
              <Link
                href="/admin/boutiques"
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #fed7aa',
                  textDecoration: 'none',
                  color: '#9a3412',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Boutiques 0 produit</span>
                <span style={{ background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                  {actionCenter.alertes.boutiques_zero_produit}
                </span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#15803d',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Tous les flux sont à jour ! Aucune modération ni paiement urgent en attente.</span>
        </div>
      )}

      {/* 💰 BLOC 1 : FINANCES & REVENUS */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <DollarSign size={18} color="#16a34a" /> Performances Financières & MRR
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>MRR Abonnements</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', margin: '6px 0 2px' }}>
            {fcfa(finances?.mrr || 0)}
          </div>
          <span style={{ fontSize: 12, color: '#475569' }}>
            {finances?.abonnements_actifs || 0} abonnement(s) actif(s)
          </span>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ventes Commerçants</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0284c7', margin: '6px 0 2px' }}>
            {fcfa(finances?.ca_total_ventes || 0)}
          </div>
          <span style={{ fontSize: 12, color: '#475569' }}>
            {finances?.nb_ventes_total || 0} vente(s) POS & comptoir
          </span>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Abonnements par Forfait</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              👑 VIP: {finances?.abonnements_business || 0}
            </span>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              ⭐ Pro: {finances?.abonnements_pro || 0}
            </span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              🛍️ Taf: {finances?.abonnements_decouverte || 0}
            </span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Volume Commandes Web</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#475569', margin: '6px 0 2px' }}>
            {fcfa(commandes?.volume || 0)}
          </div>
          <span style={{ fontSize: 12, color: '#475569' }}>
            {commandes?.total || 0} commande(s) passée(s)
          </span>
        </div>
      </div>

      {/* 👥 BLOC 2 : MARCHANDS & UTILISATEURS */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Store size={18} color="#0284c7" /> Écosystème Marchands & Comptes
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Boutiques Actives</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            {boutiques?.actives || 0} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>/ {boutiques?.total || 0}</span>
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>
            +{boutiques?.nouvelles_periode || 0} sur la période
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Comptes Utilisateurs</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            {utilisateurs?.total || 0}
          </div>
          <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4, fontWeight: 600 }}>
            +{utilisateurs?.nouveaux_periode || 0} nouveaux inscrits
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Boutiques Sponsorisées</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
            {boutiques?.sponsorisees || 0}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Mises en avant sur la plateforme
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Apporteurs d'Affaires</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>
            {utilisateurs?.apporteurs || 0}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Prescripteurs actifs enregistrés
          </div>
        </div>
      </div>

      {/* 📦 BLOC 3 : CATALOGUE & ACTIVITÉ */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Package size={18} color="#9333ea" /> Produits, Annonces & WhatsApp
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Produits Marchands</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            {catalogue?.produits_marchands || 0}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
            {catalogue?.produits_en_stock || 0} articles en stock
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Produits Scrapés</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            {catalogue?.produits_scrapes || 0}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Comparateur multi-marchands
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Annonces Classifiées & Immo</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            {(catalogue?.annonces_actives || 0) + (catalogue?.immo_actives || 0)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {catalogue?.annonces_actives || 0} classifiées + {catalogue?.immo_actives || 0} immo
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>CRM Leads & Prospection</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {whatsapp?.leads_total || 0}
          </div>
          <div style={{ fontSize: 12, color: '#15803d', marginTop: 4, fontWeight: 600 }}>
            {whatsapp?.leads_convertis || 0} commerçants convertis
          </div>
        </div>
      </div>

      {/* ⚡ RACCOURCIS DE GESTION RAPIDE */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>
        ⚡ Raccourcis Opérationnels
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <Link
          href="/admin/feature-flags"
          style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: 10,
            padding: '14px',
            textDecoration: 'none',
            color: '#7e22ce',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Flag size={16} /> Feature Flags (No-Code)
        </Link>

        <Link
          href="/admin/categories"
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 10,
            padding: '14px',
            textDecoration: 'none',
            color: '#0369a1',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Layers size={16} /> Gérer les Catégories
        </Link>

        <Link
          href="/admin/boutiques"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px',
            textDecoration: 'none',
            color: '#1e293b',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Store size={16} /> Liste des Boutiques
        </Link>

        <Link
          href="/admin/tarifs"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px',
            textDecoration: 'none',
            color: '#1e293b',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Tag size={16} /> Tarifs & Promotions
        </Link>

        <Link
          href="/admin/reversements"
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            padding: '14px',
            textDecoration: 'none',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <DollarSign size={16} /> Reversements Wave 1-Clic
        </Link>

        <Link
          href="/admin/prospection"
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '14px',
            textDecoration: 'none',
            color: '#15803d',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MessageCircle size={16} /> Campagnes WhatsApp
        </Link>
      </div>
    </div>
  )
}
