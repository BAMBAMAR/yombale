'use client'
import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit, marquerProduitPartage, publierProduitAnnonce, getBoutiqueProduits, updateStock, duplicateProduit, getDashboard, getCreditsClients } from './actions'
import Comptabilite, { SaisieExpressView } from './Comptabilite'
import CarnetDettes from './CarnetDettes'
import Commandes from './Commandes'
import AnalyticsClient from './analytics/AnalyticsClient'
import PortailDeveloppeurBoutique from './PortailDeveloppeurBoutique'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import { fcfa, lienBoutiqueWhatsapp } from '@/lib/format'
import type { ActionState } from '@/lib/backend-fetch'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
import BoutonPartager from '@/components/BoutonPartager'
import BatchImportModal from './BatchImportModal'
import BoutiqueAdmins from './BoutiqueAdmins'
import BoutiqueCaissiers from './BoutiqueCaissiers'
import ParametresFiscalite from './ParametresFiscalite'
import ParametresFidelitePromos from './ParametresFidelitePromos'
import GestionDocuments from './GestionDocuments'
import GestionFournisseurs from './GestionFournisseurs'
import BoutiqueLogs from './BoutiqueLogs'
import SocialShopManager from './SocialShopManager'
import StudioPersonnalisation from './StudioPersonnalisation'
import MarketingBoutique from './MarketingBoutique'
import BoutiqueEquipe from './BoutiqueEquipe'
import QrCodeShareModal from '@/components/QrCodeShareModal'
import ModalPartageProduit from '@/components/ModalPartageProduit'
import ProductTourModal from './ProductTourModal'
import ProduitForm from './ProduitForm'
import CatalogueProduits from './CatalogueProduits'
import BoutiqueProduitsTab from './components/BoutiqueProduitsTab'
import BoutiqueProduitModal from './components/BoutiqueProduitModal'
export { ProduitForm, CatalogueProduits, BoutiqueProduitsTab, BoutiqueProduitModal }

import DashboardFacile from './components/DashboardFacile'
import {
  Store, PlusCircle, Monitor, Settings, Edit, Eye, Trash2, ArrowLeft, MapPin, Tag, Phone, Share2, Zap, BookOpen, ShoppingBag, FileText, ShoppingCart, ClipboardList, Star, AlertTriangle, CheckCircle2, XCircle, Sparkles, Copy, Check, Download, ExternalLink, MessageCircle, Flame, Send, CheckSquare, Square,
  LayoutDashboard, Truck, Receipt, Scale, BarChart3, Users, Gift, ScrollText, Code2, Megaphone, ShieldCheck, QrCode, Lock, ChevronDown, ChevronRight, Menu, X, LucideIcon, Package, Plus, Search, Info, Printer, ArrowUpDown, Filter, Palette
} from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { sauvegarderProduitsLocaux, obtenirProduitsLocaux } from '@/lib/db-offline'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer, rechercherInfosProduitEan, toggleTorcheCamera } from '@/lib/scanner-helper'

import { CATEGORIES, PRODUIT_CATEGORIES } from '@/lib/categories'
import { createVoiceListener, parseAjoutProduitIntent, demanderPermissionMicrophone, getMessageErreurMicro } from '@/lib/voice-assistant'
import { CaracChips } from '@/components/CaracChips'
import {
  type TypeVarianteId,
  CHAMP_VERS_TYPE_VARIANTE,
  champVisibleSelonVariante,
  nomParDefautPourCategorie,
} from './boutiqueHelpers'

export { CaracChips, CHAMP_VERS_TYPE_VARIANTE, champVisibleSelonVariante, nomParDefautPourCategorie }

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  site_web: string | null
  facebook: string | null
  instagram: string | null
  tiktok?: string | null
  youtube?: string | null
  slug: string | null
  mode_fonctionnement?: 'hybride_pos' | 'pure_player'
  meta_pixel_id?: string | null
  tiktok_pixel_id?: string | null
  ga4_id?: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  fidelite_actif?: boolean
  fidelite_type?: 'cagnotte' | 'tampons'
  fidelite_taux_cashback?: number
  fidelite_tampons_max?: number
  fidelite_seuil_tampon?: number
  pos_remise_max_caissier?: number
  pos_remise_seuil_auto_montant?: number
  pos_remise_seuil_auto_pct?: number
  pos_remise_motifs?: any
  couleur_theme?: string | null
  couleur_secondaire?: string | null
  slogan?: string | null
  theme_style?: string | null
  forme_boutons?: string | null
  bandeau_promo?: string | null
  bandeau_promo_actif?: boolean
  message_accueil?: string | null
  disposition_catalogue?: string | null
  horaires?: Record<string, string> | null
  created_at: string
  plan_actif?: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  plan_souscrit?: string | null
  is_trial?: boolean
  jours_restants_essai?: number
}

interface Variante {
  nom: string
  valeurs: string[]
  typeId?: string
}

interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  stock_quantite: number | null
  quantite_stock?: number | null
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes: Variante[] | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
  partage_le: string | null
}



const inputStyle = {
  padding: '10px 14px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, width: '100%',
  background: '#fff', boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: 13, fontWeight: 600 as const, color: '#374151',
  display: 'block' as const, marginBottom: 4,
}

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || disabled} style={{
      padding: '10px 24px', background: pending ? '#94a3b8' : '#1d4ed8',
      color: '#fff', border: 'none', borderRadius: 8,
      fontSize: 14, fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
    }}>
      {pending ? 'En cours…' : label}
    </button>
  )
}

// ── Formulaire boutique ───────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', margin: '4px 0 0', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
      {children}
    </p>
  )
}

function BoutiqueForm({ boutique, onCancel, onSuccess, codeApporteurDefaut }: {
  boutique?: Boutique
  onCancel: () => void
  onSuccess: () => void
  codeApporteurDefaut?: string
}) {
  const action = boutique ? updateBoutique.bind(null, boutique.id) : createBoutique
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})
  const [modeSelect, setModeSelect] = useState<'hybride_pos' | 'pure_player'>(boutique?.mode_fonctionnement || 'hybride_pos')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const formTopRef = useRef<HTMLDivElement>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSuccessMsg(boutique ? 'Paramètres de la boutique enregistrés avec succès !' : 'Boutique créée avec succès !')
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onSuccess()
      const t = setTimeout(() => setSuccessMsg(null), 6000)
      return () => clearTimeout(t)
    } else if (state.error && handledRef.current !== state) {
      handledRef.current = state
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [state, boutique, onSuccess])

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 }}>
      <div ref={formTopRef} />
      <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 18, margin: 0 }}>
        {boutique ? 'Modifier la boutique' : 'Créer une boutique'}
      </h2>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', color: '#166534', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span>{successMsg}</span>
        </div>
      )}

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, fontWeight: 600 }}>
          {state.error}
        </div>
      )}

      <SectionTitle>Comment fonctionne votre boutique ?</SectionTitle>
      <input type="hidden" name="mode_fonctionnement" value={modeSelect} />
      <div>
        <label style={labelStyle}>Choisissez la configuration de votre tableau de bord</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 6 }}>
          <label style={{
            display: 'flex', flexDirection: 'column', padding: 12, borderRadius: 8,
            border: '2px solid ' + (modeSelect === 'hybride_pos' ? '#16a34a' : '#e5e7eb'),
            background: modeSelect === 'hybride_pos' ? '#f0fdf4' : '#ffffff', cursor: 'pointer'
          }}>
            <input
              type="radio"
              value="hybride_pos"
              checked={modeSelect === 'hybride_pos'}
              onChange={() => setModeSelect('hybride_pos')}
              style={{ display: 'none' }}
            />
            <span style={{ fontWeight: 800, fontSize: 13, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}>
              Magasin + Vente en ligne
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Vendez en boutique avec la caisse, gérez vos dettes clients et recevez aussi des commandes en ligne.
            </span>
          </label>

          <label style={{
            display: 'flex', flexDirection: 'column', padding: 12, borderRadius: 8,
            border: '2px solid ' + (modeSelect === 'pure_player' ? '#C75B00' : '#e5e7eb'),
            background: modeSelect === 'pure_player' ? '#fff7ed' : '#ffffff', cursor: 'pointer'
          }}>
            <input
              type="radio"
              value="pure_player"
              checked={modeSelect === 'pure_player'}
              onChange={() => setModeSelect('pure_player')}
              style={{ display: 'none' }}
            />
            <span style={{ fontWeight: 800, fontSize: 13, color: '#C75B00', display: 'flex', alignItems: 'center', gap: 6 }}>
              100% Vente en ligne
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Votre boutique est uniquement en ligne. Vous recevez des commandes par le site et WhatsApp.
            </span>
          </label>
        </div>
      </div>

      <SectionTitle>Informations</SectionTitle>

      <div>
        <label style={labelStyle}>Nom de la boutique *</label>
        <input name="nom" required maxLength={200} defaultValue={boutique?.nom} style={inputStyle} placeholder="Ex: Tech Dakar" />
      </div>
      {!boutique && (
        <div>
          <label style={labelStyle}>Code apporteur (si recommandé par quelqu&apos;un)</label>
          <input name="code_apporteur" maxLength={20} defaultValue={codeApporteurDefaut} style={inputStyle} placeholder="Ex: A3F9K2" />
        </div>
      )}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" rows={3} defaultValue={boutique?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Décrivez votre boutique…" />
      </div>
      <div>
        <label style={labelStyle}>Catégorie principale</label>
        <select name="categorie" defaultValue={boutique?.categorie ?? ''} style={inputStyle}>
          <option value="">— Sélectionner —</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
          Définit votre rayon principal dans l&apos;annuaire Nopalou et adapte automatiquement les attributs suggérés lors de l&apos;ajout de nouveaux produits.
        </p>
      </div>
      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Adresse</label>
          <input name="adresse" defaultValue={boutique?.adresse ?? ''} style={inputStyle} placeholder="Av. Cheikh Anta Diop" />
        </div>
        <div>
          <label style={labelStyle}>Ville</label>
          <input name="ville" defaultValue={boutique?.ville ?? 'Dakar'} style={inputStyle} placeholder="Dakar" />
        </div>
      </div>

      <SectionTitle>Contact</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Téléphone</label>
          <input name="telephone" type="tel" defaultValue={boutique?.telephone ?? ''} style={inputStyle} placeholder="77 000 00 00" />
        </div>
        <div>
          <label style={labelStyle}>WhatsApp</label>
          <input name="whatsapp" type="tel" defaultValue={boutique?.whatsapp ?? ''} style={inputStyle} placeholder="77 000 00 00" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Site web</label>
        <input name="site_web" type="url" defaultValue={boutique?.site_web ?? ''} style={inputStyle} placeholder="https://votresite.com" />
      </div>
      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Page Facebook</label>
          <input name="facebook" type="url" defaultValue={boutique?.facebook ?? ''} style={inputStyle} placeholder="https://facebook.com/…" />
        </div>
        <div>
          <label style={labelStyle}>Instagram</label>
          <input name="instagram" type="url" defaultValue={boutique?.instagram ?? ''} style={inputStyle} placeholder="https://instagram.com/…" />
        </div>
      </div>
      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>TikTok</label>
          <input name="tiktok" type="url" defaultValue={(boutique as any)?.tiktok ?? ''} style={inputStyle} placeholder="https://www.tiktok.com/@maboutique" />
        </div>
        <div>
          <label style={labelStyle}>YouTube</label>
          <input name="youtube" type="url" defaultValue={(boutique as any)?.youtube ?? ''} style={inputStyle} placeholder="https://www.youtube.com/@machannel" />
        </div>
      </div>

      <SectionTitle>Publicité en ligne (optionnel)</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Meta Facebook Pixel ID</label>
          <input name="meta_pixel_id" defaultValue={boutique?.meta_pixel_id ?? ''} style={inputStyle} placeholder="Ex: 123456789012345" />
        </div>
        <div>
          <label style={labelStyle}>
            TikTok Pixel ID
            <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, marginLeft: 6, fontWeight: 700 }}>
              Pixel Actif · Sync Catalogue Direct (Bientôt)
            </span>
          </label>
          <input name="tiktok_pixel_id" defaultValue={boutique?.tiktok_pixel_id ?? ''} style={inputStyle} placeholder="Ex: C1234567890ABC" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Google Analytics GA4 ID</label>
        <input name="ga4_id" defaultValue={boutique?.ga4_id ?? ''} style={inputStyle} placeholder="Ex: G-XYZ1234567" />
      </div>

      <SectionTitle>👁️ Visibilité de votre boutique</SectionTitle>
      <div>
        <label style={labelStyle}>Visibilité publique de votre boutique</label>
        <select
          name="actif"
          defaultValue={boutique?.actif !== false ? 'true' : 'false'}
          style={inputStyle}
        >
          <option value="true">Active (Visible dans le catalogue public et la recherche Nopalou)</option>
          <option value="false">Désactivée (Masquée du catalogue public et hors-ligne pour les clients)</option>
        </select>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
          Une boutique désactivée ne sera plus visible par les visiteurs sur /boutiques mais reste totalement accessible pour votre gestion interne et votre caisse POS.
        </p>
      </div>

      <SectionTitle>🔗 Adresse web de votre boutique</SectionTitle>

      <div>
        <label style={labelStyle}>URL de votre boutique</label>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
          <span style={{ padding: '10px 12px', background: '#f3f4f6', borderRight: '1px solid #d1d5db', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
            nopalou.com/boutiques/
          </span>
          <input
            name="slug"
            defaultValue={boutique?.slug ?? ''}
            style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }}
            placeholder="mon-nom-de-boutique"
            maxLength={80}
            onChange={e => {
              e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
          Lettres minuscules, chiffres et tirets uniquement. Laissez vide pour générer automatiquement depuis le nom.
        </p>
      </div>

      <SectionTitle>🖼 Photos</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Logo (max 5 Mo)</label>
          <input name="logo" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.logo_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <ExternalImg src={boutique.logo_url} alt="Logo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>Logo actuel</span>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Photo de couverture (max 5 Mo)</label>
          <input name="cover" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.cover_url && (
            <div style={{ marginTop: 6, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <ExternalImg src={boutique.cover_url} alt="Couverture" style={{ width: '100%', height: 50, objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>

      <SectionTitle>Export & Portabilité des données</SectionTitle>
      <div style={{ background: '#FFFDF9', border: '1.5px solid #FED7AA', borderRadius: 14, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#9A3412' }}>
            Sauvegarder l'intégralité de ma boutique
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#C2410C' }}>
            Téléchargez en 1 clic vos produits, clients, dettes, commandes et historique en fichier JSON sécurisé.
          </p>
        </div>
        <a
          href={`/api/boutiques/${boutique?.id}/export-complet`}
          download
          className="btn-npl btn-npl-secondary btn-npl-sm"
          style={{ borderColor: '#FED7AA', color: '#9A3412', background: '#FFF7ED', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span></span>
          <span>Exporter ma boutique (.JSON)</span>
        </a>
      </div>

      <div style={{
        position: 'sticky',
        bottom: 12,
        zIndex: 40,
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: 12,
        boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
      }}>
        <SubmitButton label={boutique ? '💾 Enregistrer la boutique' : 'Créer la boutique'} />
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  )
}


// ── Carte boutique ────────────────────────────────────────────────────────────

function BoutiqueCard({ boutique, planActif, onEdit, onDelete, onManage }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onEdit: () => void
  onDelete: () => void
  onManage: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const sponsorActif = boutique.sponsorise && boutique.sponsor_jusqu_au && new Date(boutique.sponsor_jusqu_au) > new Date()
  const [togglingStatut, setTogglingStatut] = useState(false)

  const handleToggleStatut = async () => {
    const nouveauStatut = !boutique.actif
    const msg = nouveauStatut 
      ? 'Voulez-vous réactiver votre boutique et la rendre visible dans l’annuaire Nopalou ?' 
      : 'Voulez-vous désactiver (masquer) votre boutique du catalogue public Nopalou ?'
    if (!confirm(msg)) return

    setTogglingStatut(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: nouveauStatut }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Erreur lors de la modification du statut.')
      }
    } catch {
      alert('Erreur de réseau')
    } finally {
      setTogglingStatut(false)
    }
  }

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', background: '#fff', overflow: 'hidden' }}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* En-tête : Logo, Nom, Statut, et Actions secondaires */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap', minWidth: 0, overflow: 'hidden' }}>
          {/* Logo et Nom */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: '1 1 200px', minWidth: 0 }}>
            {boutique.logo_url ? (
              <ExternalImg src={boutique.logo_url} alt={boutique.nom} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12, flexShrink: 0, border: '1px solid #e2e8f0' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #fff8f2 0%, #fdf0e6 100%)', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={28} style={{ color: '#C75B00' }} />
              </div>
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontWeight: 800, fontSize: 18, margin: '0 0 6px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.nom}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {boutique.is_trial ? (
                  <span className="badge-premium" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: 10, padding: '2px 8px', border: 'none' }}>
                    1er mois Offert (VIP)
                  </span>
                ) : (
                  <>
                    {planActif === 'business' && <span className="badge-premium" style={{ background: '#1e3a8a', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none' }}>Business</span>}
                    {planActif === 'pro'      && <span className="badge-premium" style={{ background: '#C75B00', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none' }}>Pro</span>}
                    {(planActif === 'decouverte' || planActif === 'taf_taf') && <span className="badge-premium" style={{ background: '#22c55e', color: '#064e3b', fontSize: 10, padding: '2px 6px', border: 'none' }}>Taf Taf</span>}
                    {(!planActif || (planActif as any) === 'gratuit') && <span className="badge-premium" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: 10, padding: '2px 6px' }}>🌱 Gratuit</span>}
                  </>
                )}
                {boutique.mode_fonctionnement === 'pure_player' ? (
                  <span className="badge-premium" style={{ background: '#fff7ed', color: '#c75b00', borderColor: '#ffedd5', fontSize: 10, padding: '2px 6px' }}>Web</span>
                ) : (
                  <span className="badge-premium" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', fontSize: 10, padding: '2px 6px' }}>POS</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Secondaires (Icônes) et Statut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0, maxWidth: '100%' }}>
            <button
              onClick={handleToggleStatut}
              disabled={togglingStatut}
              title={boutique.actif ? "Cliquez pour désactiver (masquer) votre boutique du catalogue public" : "Cliquez pour réactiver et rendre visible votre boutique"}
              style={{
                background: boutique.actif !== false ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${boutique.actif !== false ? '#bbf7d0' : '#e2e8f0'}`,
                color: boutique.actif !== false ? '#15803d' : '#64748b',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: boutique.actif !== false ? '#22c55e' : '#94a3b8', display: 'inline-block' }}></span>
              {boutique.actif !== false ? 'Active' : '⚪ Inactive'}
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer" title="Voir la boutique" style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
                <Eye size={16} />
              </a>
              <button onClick={onEdit} title="Modifier" style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Edit size={16} />
              </button>
              <button onClick={onDelete} title="Supprimer" style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Corps de la carte */}
        {boutique.description && (
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{boutique.description}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 'auto' }}>
          {boutique.categorie && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <Tag size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.categorie}</span>
            </div>
          )}
          {boutique.ville && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <MapPin size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.ville}</span>
            </div>
          )}
          {boutique.telephone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <Phone size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /> {boutique.telephone}
            </div>
          )}
        </div>

        {/* Actions Principales et Liens de Gestion (Bas de carte) */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Rangée 1 : Services Boutique (Mise en avant & Offre) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href={`/payer-sponsoring-boutique/${boutique.id}`}
              style={{
                flex: 1,
                minWidth: 110,
                padding: '7px 10px',
                fontSize: 12,
                color: '#475569',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <span></span>
              <span>Mettre en avant</span>
            </Link>
            <Link
              href="/boutique/abonnement"
              style={{
                flex: 1,
                minWidth: 110,
                padding: '7px 10px',
                fontSize: 12,
                color: '#475569',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <span></span>
              <span>{t('shop.subscription')}</span>
            </Link>
          </div>

          {/* Rangée 2 : CTA Dominant */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {boutique.mode_fonctionnement !== 'pure_player' && (
              <a
                href={`/boutique/caisse?b=${boutique.id}`}
                style={{
                  flex: 1,
                  minWidth: 110,
                  minHeight: 42,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 6,
                  alignItems: 'center',
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  color: '#16a34a',
                  borderRadius: 10,
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(22,163,74,0.08)'
                }}
                onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
              >
                <Monitor size={15} />
                <span>{t('shop.pos')}</span>
              </a>
            )}
            <button
              onClick={onManage}
              style={{
                flex: boutique.mode_fonctionnement !== 'pure_player' ? 1.5 : 1,
                minWidth: 130,
                minHeight: 42,
                padding: '9px 14px',
                fontSize: 13.5,
                fontWeight: 800,
                display: 'flex',
                justifyContent: 'center',
                gap: 6,
                alignItems: 'center',
                background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(199,91,0,0.22)'
              }}
            >
              <span>{t('shop.manageShop')}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Vue de gestion d'une boutique — layout sidebar ────────────────────────────

export type ManageTab = 'dashboard' | 'produits' | 'commandes' | 'carnet' | 'express' | 'compta' | 'analytics' | 'personnaliser' | 'infos' | 'marketing' | 'social' | 'equipe' | 'admins' | 'caissiers' | 'documents' | 'fournisseurs' | 'fiscalite' | 'journal' | 'developer' | 'fidelite'

function BoutiqueDashboard({
  boutique,
  planActif,
  nbEnAttente,
  onNavigate,
  onOpenQrModal,
}: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  nbEnAttente: number
  onNavigate: (tab: ManageTab, subTab?: string) => void
  onOpenQrModal?: () => void
}) {
  const { t, formatPrice, formatNumber } = useTranslation()
  const [produitsCount, setProduitsCount] = useState<number | null>(null)
  const [stockAlertsCount, setStockAlertsCount] = useState<number | null>(null)
  const [caMois, setCaMois] = useState<number | null>(null)
  const [dettesTotal, setDettesTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [modeEssentiel, setModeEssentiel] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`nopalou_mode_essentiel_${boutique.id}`) === 'true'
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`nopalou_onboarding_dismissed_${boutique.id}`) === 'true'
      setOnboardingDismissed(dismissed)
    }
  }, [boutique.id])

  useEffect(() => {
    let active = true
    const cacheKey = `nopalou_offline_dash_counts_${boutique.id}`
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
    if (cached) {
      try {
        const { count, alerts, ca, dettes } = JSON.parse(cached)
        if (typeof count === 'number') setProduitsCount(count)
        if (typeof alerts === 'number') setStockAlertsCount(alerts)
        if (typeof ca === 'number') setCaMois(ca)
        if (typeof dettes === 'number') setDettesTotal(dettes)
        setLoading(false)
      } catch (e) { console.warn('[Nopalou:BoutiqueClient:L779]', e); }
    }

    // Chargement parallèle sécurisé via Server Actions (évite les erreurs 401 en client-side)
    Promise.allSettled([
      getBoutiqueProduits(boutique.id),
      getDashboard(boutique.id),
      getCreditsClients(boutique.id)
    ]).then(([resProduits, resDash, resCredits]) => {
      if (!active) return
      let count = produitsCount || 0
      let alerts = stockAlertsCount || 0
      let ca = caMois || 0
      let dettes = dettesTotal || 0

      if (resProduits.status === 'fulfilled' && Array.isArray(resProduits.value)) {
        const prods = resProduits.value
        count = prods.length
        alerts = prods.filter(p => !p.en_stock || ((p.quantite_stock ?? p.stock_quantite) !== null && (p.quantite_stock ?? p.stock_quantite)! <= 3)).length
        setProduitsCount(count)
        setStockAlertsCount(alerts)
      }

      if (resDash.status === 'fulfilled' && resDash.value && typeof resDash.value.ca_mois === 'number') {
        ca = resDash.value.ca_mois
        setCaMois(ca)
      }

      if (resCredits.status === 'fulfilled' && resCredits.value?.clients && Array.isArray(resCredits.value.clients)) {
        dettes = resCredits.value.clients.filter((c: any) => c.solde > 0).reduce((s: number, c: any) => s + Number(c.solde), 0)
        setDettesTotal(dettes)
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ count, alerts, ca, dettes }))
      } catch (err) { console.warn('[Nopalou:BoutiqueClient:L814]', err); }
      setLoading(false)
    })

    return () => { active = false }
  }, [boutique.id])

  const hasProducts = Boolean(produitsCount && produitsCount > 0)
  const hasLogoOrCover = Boolean(boutique.logo_url || boutique.cover_url)
  const hasDesc = Boolean(boutique.description && boutique.description.trim().length > 5)
  const hasPhone = Boolean(boutique.whatsapp || boutique.telephone)
  const isBienvenue = typeof window !== 'undefined' && window.location.search.includes('bienvenue')

  const stepsDone = [true, hasPhone, hasProducts, hasLogoOrCover || hasDesc].filter(Boolean).length
  const pctReady = Math.round((stepsDone / 4) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      
      {/* ── SÉLECTEUR DE MODE MARCHAND (ESSENTIEL 4 BOUTONS vs GESTION COMPLÈTE) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 14px',
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{modeEssentiel ? '' : ''}</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {modeEssentiel ? 'Mode Essentiel (Boutiquier)' : 'Mode Gestion Complète'}
            </span>
            <p style={{ margin: 0, fontSize: 11.5, color: '#64748B' }}>
              {modeEssentiel ? '4 actions capitales pour vendre vite au comptoir' : 'Vue 360° avec tous les indicateurs et modules'}
            </p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2 }}>
          <button
            type="button"
            onClick={() => {
              setModeEssentiel(false)
              if (typeof window !== 'undefined') localStorage.setItem(`nopalou_mode_essentiel_${boutique.id}`, 'false')
            }}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              background: !modeEssentiel ? '#FFFFFF' : 'transparent',
              color: !modeEssentiel ? 'var(--navy, #1C2B4A)' : '#64748B',
              boxShadow: !modeEssentiel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Mode Complet
          </button>
          <button
            type="button"
            onClick={() => {
              setModeEssentiel(true)
              if (typeof window !== 'undefined') localStorage.setItem(`nopalou_mode_essentiel_${boutique.id}`, 'true')
            }}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              background: modeEssentiel ? 'var(--accent, #C75B00)' : 'transparent',
              color: modeEssentiel ? '#FFFFFF' : '#64748B',
              boxShadow: modeEssentiel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Mode Essentiel (4 Boutons)
          </button>
        </div>
      </div>

      {modeEssentiel ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* CARTE 1 : OUVRIR LA CAISSE POS TACTILE */}
          <div style={{
            background: 'linear-gradient(145deg, #FFF7ED 0%, #FFFFFF 100%)',
            border: '2px solid #FED7AA',
            borderRadius: 18,
            padding: 22,
            boxShadow: '0 4px 14px rgba(199,91,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FFEDD5', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={28} />
                </div>
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                  100% Hors-Ligne
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                1. Caisse POS Tactile
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Encaissez vos clients en boutique par <strong>Espèces, Wave direct</strong> ou <strong>Orange Money</strong> (0% commission). Ventes rapides et tickets de caisse.
              </p>
            </div>
            <a
              href={`/boutique/caisse?b=${boutique.id}`}
              onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 15,
                padding: '14px 20px',
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(199,91,0,0.25)',
              }}
            >
              <span>Encaisser Maintenant</span>
              <span style={{ fontSize: 18 }}>→</span>
            </a>
          </div>

          {/* CARTE 2 : AJOUTER & GÉRER LES PRODUITS */}
          <div style={{
            background: 'linear-gradient(145deg, #F0FDF4 0%, #FFFFFF 100%)',
            border: '2px solid #BBF7D0',
            borderRadius: 18,
            padding: 22,
            boxShadow: '0 4px 14px rgba(22,163,74,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={28} />
                </div>
                <span style={{ background: '#F1F5F9', color: '#334155', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                  {loading ? '...' : `${formatNumber(produitsCount ?? 0)} produits`}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                2. Mes Produits & Stocks
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Prenez une photo de vos articles, fixez vos prix en FCFA, configurez vos variantes (tailles/couleurs) et suivez vos alertes stocks.
              </p>
              {stockAlertsCount && stockAlertsCount > 0 ? (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#D97706', fontWeight: 750 }}>
                  {stockAlertsCount} article(s) bientôt en rupture
                </p>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => onNavigate('produits')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#16A34A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14.5,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                }}
              >
                <span>+ Ajouter Produit</span>
              </button>
            </div>
          </div>

          {/* CARTE 3 : MON CARNET DE DETTES CLIENTS */}
          <div style={{
            background: 'linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 100%)',
            border: '2px solid #FECACA',
            borderRadius: 18,
            padding: 22,
            boxShadow: '0 4px 14px rgba(220,38,38,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={28} />
                </div>
                <span style={{
                  background: dettesTotal && dettesTotal > 0 ? '#FEE2E2' : '#DCFCE7',
                  color: dettesTotal && dettesTotal > 0 ? '#B91C1C' : '#166534',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  {dettesTotal && dettesTotal > 0 ? 'Dettes en cours' : '✓ Zéro impayé'}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                3. Carnet de Dettes & Crédits
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Enregistrez les crédits accordés à vos clients de confiance et envoyez un <strong>rappel WhatsApp courtois</strong> avec lien de règlement Wave en 1 clic.
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 850, color: dettesTotal && dettesTotal > 0 ? '#DC2626' : '#16A34A' }}>
                {loading ? '...' : (dettesTotal && dettesTotal > 0 ? `Total à recouvrer : ${formatPrice(dettesTotal)}` : 'Aucun crédit client en attente')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('carnet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 15,
                padding: '14px 20px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
              }}
            >
              <span>Consulter le Carnet</span>
              <span style={{ fontSize: 18 }}>→</span>
            </button>
          </div>

          {/* CARTE 4 : MES VENTES & CHIFFRE D'AFFAIRES */}
          <div style={{
            background: 'linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 100%)',
            border: '2px solid #BFDBFE',
            borderRadius: 18,
            padding: 22,
            boxShadow: '0 4px 14px rgba(37,99,235,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={28} />
                </div>
                <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                  ● Ce mois
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                4. Mes Ventes du Jour & du Mois
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Consultez le total de vos encaissements (Espèces, Wave, Orange Money) et traitez les commandes reçues via votre vitrine web ou WhatsApp.
              </p>
              <div style={{ margin: '8px 0 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {loading ? '...' : (caMois !== null ? `${formatPrice(caMois)}` : '0 FCFA')}
                </span>
                {nbEnAttente > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 750, color: '#DC2626' }}>
                    ({nbEnAttente} commande(s) à préparer)
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => onNavigate('compta')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14.5,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                }}
              >
                <span>Bilan & Ventes</span>
                <span style={{ fontSize: 18 }}>→</span>
              </button>
              {nbEnAttente > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('commandes')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: '1.5px solid #FECACA',
                    fontWeight: 800,
                    fontSize: 13,
                    padding: '14px 16px',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  Commandes ({nbEnAttente})
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── ASSISTANT D'ONBOARDING COMPACT & ESCAMOTABLE ── */}
          {(!hasProducts || pctReady < 100 || isBienvenue) && !onboardingDismissed && (
            <div style={{
              background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF7ED 100%)',
              border: '1.5px solid #FED7AA',
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 2px 8px rgba(199,91,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 200 }}>
                  <span style={{ fontSize: 16 }}></span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {pctReady === 100 ? 'Boutique 100% prête à vendre !' : `Boutique prête à ${pctReady}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnboardingOpen(!onboardingOpen)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--accent, #C75B00)',
                      fontSize: 12, fontWeight: 750, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0
                    }}
                  >
                    <span>{onboardingOpen ? 'Masquer détails ▴' : 'Voir les étapes ▾'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingDismissed(true)
                    if (typeof window !== 'undefined') localStorage.setItem(`nopalou_onboarding_dismissed_${boutique.id}`, 'true')
                  }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: '2px 6px' }}
                  title="Ne plus afficher"
                >
                  ✕
                </button>
              </div>

              {onboardingOpen && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #FED7AA', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#FFFFFF', border: hasProducts ? '1px solid #BBF7D0' : '1px solid #FED7AA', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>1. Produits</span>
                      <span style={{ fontSize: 11, fontWeight: 750, color: hasProducts ? '#16A34A' : '#C75B00' }}>{hasProducts ? '✓ Prêt' : 'À ajouter'}</span>
                    </div>
                    <button type="button" onClick={() => onNavigate('produits')} className="btn-npl btn-npl-primary btn-npl-sm" style={{ width: '100%', height: 28, fontSize: 11.5 }}>
                      {hasProducts ? 'Gérer catalogue' : 'Ajouter un produit'}
                    </button>
                  </div>

                  <div style={{ background: '#FFFFFF', border: (hasLogoOrCover || hasDesc) ? '1px solid #BBF7D0' : '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>🎨 2. Profil</span>
                      <span style={{ fontSize: 11, fontWeight: 750, color: (hasLogoOrCover || hasDesc) ? '#16A34A' : '#64748B' }}>{(hasLogoOrCover || hasDesc) ? '✓ Rempli' : 'Optionnel'}</span>
                    </div>
                    <button type="button" onClick={() => onNavigate('infos')} className="btn-npl btn-npl-secondary btn-npl-sm" style={{ width: '100%', height: 28, fontSize: 11.5 }}>
                      Modifier profil
                    </button>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>3. WhatsApp</span>
                      <span style={{ fontSize: 11, fontWeight: 750, color: '#16A34A' }}>1-Clic</span>
                    </div>
                    <button type="button" onClick={() => onOpenQrModal ? onOpenQrModal() : onNavigate('marketing')} className="btn-npl btn-npl-secondary btn-npl-sm" style={{ width: '100%', height: 28, fontSize: 11.5, borderColor: '#FED7AA', color: '#C75B00', background: '#FFF7ED' }}>
                      Partager vitrine
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GRILLE DES 4 MÉTRIQUES OPÉRATIONNELLES (HERO KPIs) — Style Meta Dashboard ── */}
          <div className="bq-kpi-grid">
            {/* KPI 1 : Chiffre d'Affaires du Mois */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNavigate('compta')}
              onKeyDown={e => e.key === 'Enter' && onNavigate('compta')}
              className="bq-kpi-card"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                minHeight: 92,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              title="Cliquez pour accéder au journal et au bilan comptable"
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="num-tabular" style={{ fontSize: 22, fontWeight: 850, color: 'var(--navy, #1C2B4A)', lineHeight: '28px', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : (caMois !== null ? `${formatPrice(caMois)}` : '0 FCFA')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  ● Ce mois
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Chiffre d&apos;affaires</span>
                <span title="Total des encaissements enregistrés ce mois-ci (ventes caisse POS et commandes web)" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
                </span>
                <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
              </div>
            </div>

            {/* KPI 2 : Commandes en attente */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNavigate('commandes')}
              onKeyDown={e => e.key === 'Enter' && onNavigate('commandes')}
              className="bq-kpi-card"
              style={{
                background: '#FFFFFF',
                border: nbEnAttente > 0 ? '1.5px solid #FED7AA' : '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                minHeight: 92,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              title="Cliquez pour gérer et préparer vos commandes"
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="num-tabular" style={{ fontSize: 22, fontWeight: 850, color: nbEnAttente > 0 ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)', lineHeight: '28px', letterSpacing: '-0.02em' }}>
                  {formatNumber(nbEnAttente)}
                </span>
                {nbEnAttente > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    ● {nbEnAttente} à traiter
                  </span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    ✓ À jour
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>{t('shop.pendingOrdersCount')}</span>
                <span title="Commandes clients en attente de préparation ou d'expédition" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
                </span>
                <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
              </div>
            </div>

            {/* KPI 3 : Alertes Stock */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNavigate('produits')}
              onKeyDown={e => e.key === 'Enter' && onNavigate('produits')}
              className="bq-kpi-card"
              style={{
                background: '#FFFFFF',
                border: stockAlertsCount && stockAlertsCount > 0 ? '1.5px solid #FCD34D' : '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                minHeight: 92,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              title="Cliquez pour réapprovisionner ou ajuster vos stocks"
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="num-tabular" style={{ fontSize: 22, fontWeight: 850, color: stockAlertsCount && stockAlertsCount > 0 ? '#B45309' : 'var(--navy, #1C2B4A)', lineHeight: '28px', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : formatNumber(stockAlertsCount ?? 0)}
                </span>
                {stockAlertsCount && stockAlertsCount > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    Faible
                  </span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    ✓ En stock
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>{t('shop.stockAlerts')}</span>
                <span title="Articles dont le stock est épuisé ou inférieur au seuil d'alerte configuré" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
                </span>
                <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
              </div>
            </div>

            {/* KPI 4 : Dettes Clients / Carnet */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(dettesTotal && dettesTotal > 0 ? 'carnet' : 'produits')}
              onKeyDown={e => e.key === 'Enter' && onNavigate(dettesTotal && dettesTotal > 0 ? 'carnet' : 'produits')}
              className="bq-kpi-card"
              style={{
                background: '#FFFFFF',
                border: dettesTotal && dettesTotal > 0 ? '1.5px solid #FECACA' : '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                minHeight: 92,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              title="Cliquez pour consulter le carnet de dettes et relancer les clients"
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="num-tabular" style={{ fontSize: 22, fontWeight: 850, color: dettesTotal && dettesTotal > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)', lineHeight: '28px', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : (dettesTotal && dettesTotal > 0 ? `${formatPrice(dettesTotal)}` : `${formatNumber(produitsCount ?? 0)} art.`)}
                </span>
                {dettesTotal && dettesTotal > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    ● À recouvrer
                  </span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    ✓ Zéro dette
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
                  {dettesTotal && dettesTotal > 0 ? 'Dettes clients' : t('shop.catalog')}
                </span>
                <span title="Montant total des crédits et dettes clients en cours à recouvrer via relance WhatsApp" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
                </span>
                <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
              </div>
            </div>
          </div>

          {/* ── HUB D'ACTIONS RAPIDES TACTILES 1-TAP (Style Wave / Square) ── */}
          <div style={{ background: 'var(--card, #ffffff)', border: '1px solid var(--border, #E8DDD2)', borderRadius: 'var(--r-xl, 16px)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', letterSpacing: '-0.01em' }}>
                  Actions rapides
                </h3>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-subtle, #8C7E74)', fontWeight: 600 }}>1-Tap direct</span>
            </div>

            {/* Grille 4 tuiles tactiles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: 12,
            }}>
              {/* Tuile 1 : Vente Express */}
              <button
                type="button"
                onClick={() => onNavigate('express')}
                className="bq-action-tile"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '16px 12px', borderRadius: 14, background: '#F0FDF4', border: '1.5px solid #BBF7D0',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', gap: 8,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <Zap size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>Vente Express</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803D', fontWeight: 600 }}>Scan & Comptoir</p>
                </div>
              </button>

              {/* Tuile 2 : Caisse POS */}
              {boutique.mode_fonctionnement !== 'pure_player' ? (
                <a
                  href={`/boutique/caisse?b=${boutique.id}`}
                  className="bq-action-tile"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '16px 12px', borderRadius: 14, background: '#FFF3E8', border: '1.5px solid #FED7AA',
                    cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'all 0.15s ease', gap: 8,
                  }}
                  onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent, #C75B00)' }}>
                    <ShoppingCart size={22} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>Caisse POS</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 600 }}>Plein écran</p>
                  </div>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('commandes')}
                  className="bq-action-tile"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '16px 12px', borderRadius: 14, background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', gap: 8,
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>Commandes</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#1D4ED8', fontWeight: 600 }}>Web & WhatsApp</p>
                  </div>
                </button>
              )}

              {/* Tuile 3 : Nouveau Produit */}
              <button
                type="button"
                onClick={() => onNavigate('produits')}
                className="bq-action-tile"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '16px 12px', borderRadius: 14, background: '#FAF8F5', border: '1.5px solid #E8DDD2',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', gap: 8,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-muted, #F1F5F9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy, #1C2B4A)' }}>
                  <PlusCircle size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>Ajouter Produit</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle, #8C7E74)', fontWeight: 600 }}>Photo & Prix</p>
                </div>
              </button>

              {/* Tuile 4 : Carnet de Dettes */}
              <button
                type="button"
                onClick={() => onNavigate('carnet')}
                className="bq-action-tile"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '16px 12px', borderRadius: 14, background: '#FEF2F2', border: '1.5px solid #FECACA',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', gap: 8,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>Carnet Dettes</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>Crédit & Relance</p>
                </div>
              </button>
            </div>

            {/* Puces secondaires compactes */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border-light, #F1E9E0)' }}>
              <button
                type="button"
                onClick={() => onNavigate('documents')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', fontSize: 12, fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)', cursor: 'pointer',
                }}
              >
                <FileText size={13} style={{ color: 'var(--navy)' }} />
                <span>Factures & Devis</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('compta')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', fontSize: 12, fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)', cursor: 'pointer',
                }}
              >
                <Receipt size={13} style={{ color: '#16A34A' }} />
                <span>Comptabilité</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', fontSize: 12, fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)', cursor: 'pointer',
                }}
              >
                <BarChart3 size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>Statistiques</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('equipe')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', fontSize: 12, fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)', cursor: 'pointer',
                }}
              >
                <Users size={13} style={{ color: '#6366F1' }} />
                <span>Équipe</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface NavItem {
  key: ManageTab
  icon: LucideIcon
  label: string
  minPlan?: 'pro' | 'business'
}

interface NavGroup {
  icon: LucideIcon
  title: string
  items: NavItem[]
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT BOTTOM-SHEET — Navigation mobile Boutique
   ════════════════════════════════════════════════════════════════ */

function BoutiqueMobileBottomSheet({
  navGroups,
  activeTab,
  onSetTab,
  isAllowed,
  nbEnAttente,
  formatNumber,
  sheetTitle,
  onBack,
  boutiqueId,
  hasMultipleBoutiques = false,
  boutiques = [],
  onSelectBoutique,
  showAdvancedNav = false,
  onToggleAdvancedNav,
}: {
  navGroups: NavGroup[]
  activeTab: ManageTab
  onSetTab: (tab: ManageTab) => void
  isAllowed: (minPlan?: 'pro' | 'business') => boolean
  nbEnAttente: number
  formatNumber: (n: number) => string
  sheetTitle: string
  onBack: () => void
  boutiqueId: string
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onSelectBoutique?: (b: Boutique) => void
  showAdvancedNav?: boolean
  onToggleAdvancedNav?: () => void
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Trouver l'item actif
  const activeItem = navGroups.flatMap(g => g.items).find(i => i.key === activeTab)
  const CurrentIcon = activeItem?.icon || LayoutDashboard
  const currentLabel = activeItem?.label || sheetTitle

  function openSheet() {
    setIsOpen(true)
    setIsClosing(false)
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
  }

  function closeSheet() {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  }, [])

  return (
    <div className="mobile-nav-compact mobile-nav-compact--boutique">
      {/* Barre compacte */}
      <div className="mobile-nav-compact-bar">
        <button
          type="button"
          className="mobile-nav-compact-back"
          onClick={() => {
            if (activeTab !== 'dashboard') {
              onSetTab('dashboard')
            } else if (hasMultipleBoutiques) {
              onBack()
            } else {
              router.push('/compte')
            }
          }}
          aria-label={
            activeTab !== 'dashboard'
              ? "Retour à l'accueil de la boutique"
              : hasMultipleBoutiques
                ? "Retour à mes boutiques"
                : "Retour à mon compte"
          }
          title={
            activeTab !== 'dashboard'
              ? "Retour au tableau de bord"
              : hasMultipleBoutiques
                ? "Retour à mes boutiques"
                : "Retour à mon compte"
          }
        >
          <ArrowLeft size={16} />
        </button>

        <button
          type="button"
          className="mobile-nav-compact-dropdown"
          onClick={openSheet}
          aria-label={`Menu boutique: ${currentLabel}`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="mobile-nav-compact-dropdown-content">
            <span className="mobile-nav-compact-current-icon">
              <CurrentIcon size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            </span>
            <span className="mobile-nav-compact-current-label">{currentLabel}</span>
            {nbEnAttente > 0 && (
              <span className="mobile-bs-item-badge mobile-bs-item-badge--count" style={{ fontSize: 10, padding: '1px 6px' }}>
                {formatNumber(nbEnAttente)}
              </span>
            )}
          </div>
          <ChevronDown size={14} className="mobile-nav-compact-chevron" />
        </button>
      </div>

      {/* Bottom Sheet */}
      {isOpen && (
        <>
          <div className="mobile-bs-overlay" onClick={closeSheet} aria-hidden="true" />
          <div className={`mobile-bs-panel${isClosing ? ' mobile-bs-panel--closing' : ''}`}>
            <div className="mobile-bs-handle">
              <div className="mobile-bs-handle-bar" />
            </div>

            <div className="mobile-bs-header">
              <span className="mobile-bs-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Store size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>{sheetTitle}</span>
              </span>
              <button type="button" className="mobile-bs-close" onClick={closeSheet} aria-label="Fermer">
                ✕
              </button>
            </div>

            {/* Sélecteur Multi-Boutiques Rapide (Mobile) */}
            {boutiques && boutiques.length > 1 && (
              <div style={{ padding: '8px 16px', background: '#F8FAF5', borderBottom: '1px solid #E8DDD2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mes Boutiques ({boutiques.length})
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {boutiques.map(b => {
                    const isCurrent = b.id === boutiqueId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          closeSheet();
                          if (!isCurrent && onSelectBoutique) onSelectBoutique(b);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: isCurrent ? '1.5px solid #16a34a' : '1px solid #d1d5db',
                          background: isCurrent ? '#f0fdf4' : '#ffffff',
                          color: isCurrent ? '#166534' : '#1C2B4A',
                          fontWeight: isCurrent ? 800 : 600,
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: isCurrent ? 'default' : 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <span>{b.nom}</span>
                        {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mobile-bs-body">
              {navGroups.map((group, gIdx) => {
                const hasActive = group.items.some(i => i.key === activeTab)
                const GroupIcon = group.icon
                return (
                  <div key={gIdx} className={`mobile-bs-group${hasActive ? ' mobile-bs-group--active' : ''}`}>
                    <div className="mobile-bs-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GroupIcon size={14} className="mobile-bs-group-title-icon" />
                      <span>{group.title}</span>
                    </div>
                    <div className="mobile-bs-group-items">
                      {group.items.map(item => {
                        const allowed = isAllowed(item.minPlan)
                        const isActive = activeTab === item.key
                        const ItemIcon = item.icon
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`mobile-bs-item${isActive ? ' mobile-bs-item--active' : ''}`}
                            onClick={() => {
                              onSetTab(item.key)
                              closeSheet()
                            }}
                          >
                            <ItemIcon size={16} className="mobile-bs-item-icon" />
                            <span className="mobile-bs-item-label">{item.label}</span>
                            {!allowed && (
                              <span className={`mobile-bs-item-badge ${item.minPlan === 'business' ? 'mobile-bs-item-badge--lock-business' : 'mobile-bs-item-badge--lock'}`}>
                                {item.minPlan === 'business' ? 'Business' : 'Pro'}
                              </span>
                            )}
                            {allowed && item.key === 'commandes' && nbEnAttente > 0 && (
                              <span className="mobile-bs-item-badge mobile-bs-item-badge--count">
                                {formatNumber(nbEnAttente)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {onToggleAdvancedNav && (
                <div style={{ padding: '6px 8px 12px' }}>
                  <button
                    type="button"
                    onClick={onToggleAdvancedNav}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: showAdvancedNav ? '1.5px solid var(--accent, #C75B00)' : '1.5px dashed var(--border-medium, #D1C4B4)',
                      background: showAdvancedNav ? 'var(--orange2, #FFF3E8)' : '#FAF8F5',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: showAdvancedNav ? 'var(--accent, #C75B00)' : 'var(--text-subtle, #8C7E74)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ChevronDown
                      size={14}
                      style={{
                        transform: showAdvancedNav ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                    <span>{showAdvancedNav ? 'Masquer les options avancées' : 'Plus d\'options (comptabilité, rapports...)'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mobile-bs-footer">
              <a
                href={`/boutique/caisse?b=${boutiqueId}`}
                className="mobile-bs-footer-link"
                style={{ background: '#F0FDF4', color: '#16a34a', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  if (typeof window !== 'undefined') localStorage.setItem('nopalou_pos_active_boutique_id', boutiqueId);
                  closeSheet();
                }}
              >
                <ShoppingCart size={15} />
                <span>{t('caisse.posTitle') || 'Caisse POS'}</span>
              </a>
              <a
                href="/compte"
                className="mobile-bs-footer-link"
                style={{ background: 'var(--surface-subtle)', color: 'var(--navy)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={closeSheet}
              >
                <Store size={15} />
                <span>{t('shop.merchantAccount')}</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BoutiqueManage({
  boutique,
  planActif,
  onBack,
  onEdit,
  prixPro,
  initialTab: initialTabProp,
  hasMultipleBoutiques = false,
  boutiques = [],
  onSelectBoutique,
  onCreateBoutique,
}: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
  initialTab?: string
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onSelectBoutique?: (b: Boutique) => void
  onCreateBoutique?: () => void
}) {
  const router = useRouter()
  const { t, formatNumber } = useTranslation()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const validTabs: ManageTab[] = ['dashboard','produits','commandes','carnet','express','compta','analytics','personnaliser','infos','marketing','social','equipe','admins','caissiers','documents','fournisseurs','fiscalite','journal','developer','fidelite']
  const resolvedInitialTab: ManageTab = validTabs.includes(initialTabProp as ManageTab) ? (initialTabProp as ManageTab) : 'dashboard'

  // ── Navigation Progressive : Essentiel (visible par défaut) + Avancé (sur demande) ──
  const NAV_ESSENTIAL: NavGroup[] = [
    {
      icon: LayoutDashboard,
      title: t('shop.navGroupSalesClients') || 'Mon activité',
      items: [
        { key: 'dashboard',   icon: LayoutDashboard, label: t('shop.overview') || 'Accueil' },
        { key: 'commandes',   icon: ClipboardList, label: t('shop.orders') || 'Mes commandes' },
        { key: 'carnet',      icon: BookOpen, label: t('shop.debts') || 'Carnet de dettes' },
      ],
    },
    {
      icon: Package,
      title: t('shop.navGroupCatalogStock') || 'Mes produits',
      items: [
        { key: 'produits',     icon: ShoppingBag, label: t('shop.catalog') || 'Catalogue' },
      ],
    },
    {
      icon: Megaphone,
      title: t('shop.navGroupMarketingSettings') || 'Vitrine & Personnalisation',
      items: [
        { key: 'personnaliser', icon: Palette, label: '🎨 Personnaliser ma boutique' },
        { key: 'social',      icon: Share2, label: 'Réseaux sociaux & Social Shop' },
        { key: 'marketing',   icon: Megaphone, label: t('shop.marketing') || 'Partager ma boutique' },
        { key: 'infos',       icon: Settings, label: t('shop.settings') || 'Paramètres' },
      ],
    },
  ]

  const NAV_ADVANCED: NavGroup[] = [
    {
      icon: Receipt,
      title: t('shop.navGroupFinanceReports') || 'Comptabilité & Rapports',
      items: [
        { key: 'express',     icon: Zap, label: t('shop.saisieExpress') || 'Ventes & Dépenses rapides', minPlan: 'pro' },
        { key: 'compta',      icon: Receipt, label: t('shop.accounting') || 'Comptabilité détaillée', minPlan: 'pro' },
        { key: 'analytics',   icon: BarChart3, label: t('shop.analytics') || 'Statistiques', minPlan: 'pro' },
        { key: 'documents',   icon: FileText, label: t('shop.documents') || 'Factures & Devis', minPlan: 'pro' },
      ],
    },
    {
      icon: Settings,
      title: t('shop.navGroupSettingsTeam') || 'Paramètres avancés',
      items: [
        { key: 'fournisseurs', icon: Truck, label: t('shop.suppliers') || 'Fournisseurs', minPlan: 'pro' },
        { key: 'fidelite',    icon: Gift, label: t('shop.fidelitePromos') || 'Fidélité & Promotions' },
        { key: 'fiscalite',   icon: Scale, label: t('shop.taxSettings') || 'Fiscalité & TVA', minPlan: 'pro' },
        { key: 'equipe',      icon: Users, label: t('shop.team') || 'Mon équipe', minPlan: 'business' },
        { key: 'journal',     icon: ScrollText, label: t('shop.auditLog') || 'Journal d\'activité', minPlan: 'business' },
        { key: 'developer',   icon: Code2, label: t('shop.developer') || 'Portail développeur', minPlan: 'business' },
      ],
    },
  ]

  // L'utilisateur peut basculer pour voir les options avancées
  const [showAdvancedNav, setShowAdvancedNav] = useState(false)

  // Groupes de navigation effectifs selon le mode
  const NAV_GROUPS: NavGroup[] = showAdvancedNav ? [...NAV_ESSENTIAL, ...NAV_ADVANCED] : NAV_ESSENTIAL

  const [tab, setTab] = useState<ManageTab>(resolvedInitialTab)
  const [subTabCompta, setSubTabCompta] = useState<'bilan' | 'dashboard' | 'express' | 'ventes' | 'depenses'>('bilan')
  const [showQrModal, setShowQrModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleBoutiqueSaved = useCallback(() => {
    router.refresh()
  }, [router])

  // Navigation fluide entre onglets avec persistance historique pushState
  const handleNavigateTab = (targetTab: ManageTab, subTab?: string) => {
    if (targetTab === 'compta') {
      setSubTabCompta((subTab as any) || 'bilan')
    }
    // Auto-déplier les options avancées si l'onglet cible est dans la section avancée
    const isAdvancedTab = NAV_ADVANCED.some(g => g.items.some(i => i.key === targetTab))
    if (isAdvancedTab && !showAdvancedNav) {
      setShowAdvancedNav(true)
    }
    if (typeof window !== 'undefined' && targetTab !== tab) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', targetTab)
      window.history.pushState({ tab: targetTab, boutiqueManage: true }, '', url.toString())
    }
    setTab(targetTab)
  }

  // Écouteur popstate pour que le bouton retour du navigateur / smartphone revienne entre les onglets sans quitter la boutique
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      const currentTab = (url.searchParams.get('tab') as ManageTab) || 'dashboard'
      if (validTabs.includes(currentTab)) {
        setTab(currentTab)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigateFromDashboard = (targetTab: ManageTab, subTab?: string) => {
    handleNavigateTab(targetTab, subTab)
  }

  // Auto-expand advanced nav if the initial tab is in the advanced section
  useEffect(() => {
    const isAdvancedTab = NAV_ADVANCED.some(g => g.items.some(i => i.key === resolvedInitialTab))
    if (isAdvancedTab) setShowAdvancedNav(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getGroupIdxForTab = (t: ManageTab): number => {
    const idx = NAV_GROUPS.findIndex(g => g.items.some(i => i.key === t))
    return idx >= 0 ? idx : 0
  }
  const [activeGroupIdx, setActiveGroupIdx] = useState<number>(() => getGroupIdxForTab(resolvedInitialTab))

  // Par défaut, tous les groupes de catégories sont dépliés
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(() => {
    const defaultExpanded: Record<number, boolean> = {}
    NAV_GROUPS.forEach((_, idx) => {
      defaultExpanded[idx] = true
    })
    return defaultExpanded
  })

  useEffect(() => {
    const gIdx = getGroupIdxForTab(tab)
    setActiveGroupIdx(gIdx)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('tab') !== tab) {
        url.searchParams.set('tab', tab)
        window.history.replaceState(null, '', url.toString())
      }
    }
  }, [tab])

  const [filtreProduitsMarketing, setFiltreProduitsMarketing] = useState<'jamais_partage' | undefined>(undefined)
  const [nbEnAttente, setNbEnAttente] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [isModeFacile, setIsModeFacile] = useState<boolean>(() => {
    try { return localStorage.getItem('nopalou_dashboard_mode_facile') === 'true' } catch { return false }
  })
  const isTrialActive = Boolean(boutique.is_trial)
  const joursRestantsEssai = boutique.jours_restants_essai ?? 30
  const effectivePlan = isTrialActive ? 'business' : planActif

  const planColor = isTrialActive
    ? '#4f46e5'
    : planActif === 'business' ? '#1e3a5f' : planActif === 'pro' ? '#C75B00' : planActif === 'decouverte' || planActif === 'taf_taf' ? '#16a34a' : '#6b7280'

  const planLabel = isTrialActive
    ? `1er mois Offert (${joursRestantsEssai}j)`
    : planActif === 'business' ? 'Business' : planActif === 'pro' ? 'Pro' : planActif === 'decouverte' || planActif === 'taf_taf' ? 'Taf Taf' : 'Gratuit'

  const isAllowed = (minPlan?: 'pro' | 'business') => {
    // RÈGLE D'OR : Pour le 1er mois gratuit, tous les forfaits ont accès à toutes les fonctionnalités
    if (isTrialActive) return true
    if (!minPlan) return true
    if (effectivePlan === 'business') return true
    if (minPlan === 'pro' && effectivePlan === 'pro') return true
    return false
  }

  const allNavItems = NAV_GROUPS.flatMap(g => g.items)
  const currentNavItem = allNavItems.find(i => i.key === tab)
  const tabAllowed = isAllowed(currentNavItem?.minPlan)

  // Polling toutes les 30s pour détecter nouvelles commandes en attente
  useEffect(() => {
    if (boutique?.id && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('manage') !== boutique.id) {
        url.searchParams.set('manage', boutique.id)
        window.history.replaceState(null, '', url.toString())
      }
    }
  }, [boutique?.id])
  useEffect(() => {
    let lastCount = -1
    async function check() {
      try {
        const res = await fetch(`/api/compta-proxy/${boutique.id}/commandes-count`)
        if (!res.ok) return
        const { count } = await res.json()
        if (lastCount >= 0 && count > lastCount) {
          const diff = count - lastCount
          setToast(`${diff} nouvelle${diff > 1 ? 's' : ''} commande${diff > 1 ? 's' : ''} en attente !`)
          setTimeout(() => setToast(null), 6000)
        }
        lastCount = count
        setNbEnAttente(count)
      } catch { /* silencieux */ }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [boutique.id])

  const tabInfoMap: Record<ManageTab, { title: string; icon: LucideIcon; desc: string }> = {
    dashboard:   { icon: LayoutDashboard, title: t('shop.overview'), desc: t('shop.overviewDesc') },
    produits:    { icon: ShoppingBag, title: t('shop.catalog'), desc: t('shop.catalogDesc') },
    commandes:   { icon: ClipboardList, title: t('shop.orders'), desc: t('shop.ordersDesc') },
    carnet:      { icon: BookOpen, title: t('shop.debts'), desc: t('shop.debtsDesc') },
    express:     { icon: Zap, title: t('shop.saisieExpress') || 'Saisie Express', desc: t('shop.saisieExpressDesc') || 'Enregistrement ultra-rapide des ventes et dépenses du jour avec scan OCR.' },
    compta:      { icon: Receipt, title: t('shop.accounting'), desc: t('shop.accountingDesc') },
    analytics:   { icon: BarChart3, title: t('shop.analytics'), desc: t('shop.analyticsDesc') },
    infos:       { icon: Settings, title: t('shop.settings'), desc: t('shop.settingsDesc') },
    marketing:   { icon: Megaphone, title: t('shop.marketing'), desc: t('shop.marketingDesc') },
    social:      { icon: Share2, title: 'Réseaux Sociaux & Social Shop', desc: 'Connectez et transformez vos publications Instagram, TikTok et Facebook en boutique interactive.' },
    equipe:      { icon: Users, title: t('shop.team'), desc: t('shop.teamDesc') },
    admins:      { icon: ShieldCheck, title: t('shop.admins'), desc: t('shop.adminsDesc') },
    caissiers:   { icon: Store, title: t('shop.caissiers'), desc: t('shop.caissiersDesc') },
    documents:   { icon: FileText, title: t('shop.documents'), desc: t('shop.documentsDesc') },
    fournisseurs: { icon: Truck, title: t('shop.suppliers'), desc: t('shop.suppliersDesc') },
    fiscalite:   { icon: Scale, title: t('shop.taxSettings'), desc: t('shop.taxSettingsDesc') },
    fidelite:    { icon: Gift, title: t('shop.fidelitePromos') || 'Fidélité & Promotions', desc: t('shop.fidelitePromosDesc') || 'Configurez le programme de fidélité, le cashback, les plafonds de remise caisse et les codes promo.' },
    personnaliser: { icon: Palette, title: 'Personnaliser ma vitrine', desc: 'Définissez l\'ambiance, les couleurs, la bannière et le slogan uniques de votre boutique en ligne.' },
    journal:     { icon: ScrollText, title: t('shop.auditLog'), desc: t('shop.auditLogDesc') },
    developer:   { icon: Code2, title: t('shop.developer'), desc: t('shop.developerDesc') },
  }

  const currentTabInfo = tabInfoMap[tab] ?? tabInfoMap.dashboard

  return (
    <>
    {/* Toast nouvelle commande */}
    {toast && (
      <div
        onClick={() => { setTab('commandes'); setToast(null) }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1e3a5f', color: '#fff', borderRadius: 14,
          padding: '14px 20px', fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,.25)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320,
          animation: 'slideUp .3s ease',
        }}
      >
        <span style={{ fontSize: 24 }}></span>
        <div>
          <p style={{ margin: 0 }}>{toast}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, opacity: .75 }}>Cliquer pour voir</p>
        </div>
        <button onClick={e => { e.stopPropagation(); setToast(null) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, padding: 0, marginLeft: 4, opacity: .7 }}>✕</button>
      </div>
    )}
    <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

    <div className="bq-manage-layout">

      {/* Sidebar */}
      <aside className={`bq-sidebar${!isSidebarOpen ? ' bq-sidebar--hidden' : ''}`}>
        {/* Boutique header dans sidebar — Design System Nopalou Premium */}
        <div className="bq-sidebar-header" style={{ paddingBottom: 16, borderBottom: '1px solid var(--pos-border, #E8DDD2)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => {
                if (tab !== 'dashboard') {
                  handleNavigateTab('dashboard')
                } else if (hasMultipleBoutiques) {
                  onBack()
                } else {
                  router.push('/compte')
                }
              }}
              className="bq-back-btn"
              title={
                tab !== 'dashboard'
                  ? "Retourner à l'accueil de la boutique"
                  : hasMultipleBoutiques
                    ? "Retourner à la liste de mes boutiques"
                    : "Retourner à mon compte"
              }
              style={{
                background: '#ffffff',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 12,
                color: '#1C2B4A',
                fontWeight: 800,
                padding: '7px 11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flex: '1 1 auto',
                minWidth: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C75B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab !== 'dashboard'
                  ? t('shop.homeShopBack')
                  : hasMultipleBoutiques
                    ? t('shop.myShopsBack')
                    : t('shop.myAccountBack')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="bq-sidebar-close-btn"
              title={t('shop.closeMenu') || "Fermer le menu latéral"}
              aria-label={t('shop.closeMenu') || "Fermer le menu latéral"}
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                background: '#ffffff',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#64748B',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ lineHeight: 1 }}>✕</span>
            </button>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF8F0 100%)',
            border: '1px solid #E8DDD2',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: '0 2px 8px rgba(28,43,74,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* Ligne 1 : Logo + Nom + Badges de Statut */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {boutique.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={boutique.logo_url}
                  alt={boutique.nom}
                  style={{
                    width: 44,
                    height: 44,
                    objectFit: 'cover',
                    borderRadius: 12,
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(28,43,74,0.12)',
                    border: '1.5px solid #ffffff'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)',
                    letterSpacing: '0.02em',
                    border: '1.5px solid #ffffff',
                  }}
                >
                  {boutique.nom ? boutique.nom.slice(0, 2).toUpperCase() : 'NP'}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {boutiques && boutiques.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setIsSwitcherOpen(v => !v)}
                      style={{
                        background: isSwitcherOpen ? '#fff' : 'transparent',
                        border: isSwitcherOpen ? '1px solid var(--accent, #C75B00)' : '1px solid transparent',
                        borderRadius: 8,
                        padding: '1px 5px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        minWidth: 0,
                        maxWidth: '100%',
                        textAlign: 'left',
                        boxShadow: isSwitcherOpen ? '0 2px 6px rgba(199,91,0,0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="Changer de boutique"
                    >
                      <h2 style={{
                        margin: 0,
                        fontWeight: 850,
                        fontSize: 15.5,
                        color: 'var(--navy, #1C2B4A)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.02em',
                      }}>
                        {boutique.nom}
                      </h2>
                      <ChevronDown size={14} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0, transform: isSwitcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                    </button>
                  ) : (
                    <h2 style={{
                      margin: 0,
                      fontWeight: 850,
                      fontSize: 15.5,
                      color: 'var(--navy, #1C2B4A)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.02em',
                    }}>
                      {boutique.nom}
                    </h2>
                  )}

                  {planActif && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        padding: '1.5px 6px',
                        borderRadius: 5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: isTrialActive ? '#EEF2FF' : planActif === 'business' ? '#FEF3C7' : planActif === 'pro' ? '#FFF3E8' : '#F1F5F9',
                        color: isTrialActive ? '#4338CA' : planActif === 'business' ? '#B45309' : planActif === 'pro' ? '#C75B00' : '#475569',
                        border: isTrialActive ? '1px solid #C7D2FE' : planActif === 'business' ? '1px solid #FCD34D' : planActif === 'pro' ? '1px solid #FED7AA' : '1px solid #E2E8F0',
                        flexShrink: 0,
                      }}
                    >
                      {isTrialActive ? 'ESSAI VIP' : planActif === 'business' ? 'VIP' : planActif.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Dropdown Menu Sélecteur de Boutique */}
                {isSwitcherOpen && boutiques && boutiques.length > 1 && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                      onClick={() => setIsSwitcherOpen(false)}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      zIndex: 1000,
                      background: '#ffffff',
                      border: '1.5px solid #E8DDD2',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(28,43,74,0.18)',
                      width: 250,
                      padding: '6px',
                    }}>
                      <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Mes Boutiques ({boutiques.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {boutiques.map(b => {
                          const isCurrent = b.id === boutique.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setIsSwitcherOpen(false);
                                if (!isCurrent && onSelectBoutique) onSelectBoutique(b);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: isCurrent ? '1.5px solid #BBF7D0' : '1px solid transparent',
                                background: isCurrent ? '#F0FDF4' : 'transparent',
                                cursor: isCurrent ? 'default' : 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.12s ease',
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: isCurrent ? 800 : 600, fontSize: 13, color: isCurrent ? '#166534' : '#1C2B4A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {b.nom}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B' }}>
                                  {b.ville || 'Sénégal'}
                                </div>
                              </div>
                              {isCurrent && (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#DCFCE7', padding: '2px 6px', borderRadius: 6 }}>
                                  Actif
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {boutiques.length < 3 && onCreateBoutique && (
                        <div style={{ borderTop: '1px solid #E8DDD2', marginTop: 6, paddingTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSwitcherOpen(false);
                              onCreateBoutique();
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '7px 10px',
                              borderRadius: 8,
                              border: 'none',
                              background: '#FFF3E8',
                              color: 'var(--accent, #C75B00)',
                              fontSize: 12,
                              fontWeight: 750,
                              cursor: 'pointer',
                            }}
                          >
                            <span>+</span>
                            <span>Créer une autre boutique</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Pastille Interactive En Ligne / Masquée */}
                  <button
                    type="button"
                    onClick={async () => {
                      const nouveauStatut = !boutique.actif
                      const msg = nouveauStatut 
                        ? 'Voulez-vous réactiver votre boutique et la rendre visible dans l’annuaire public Nopalou ?' 
                        : 'Voulez-vous désactiver (masquer) votre boutique du catalogue public Nopalou ?'
                      if (!confirm(msg)) return
                      try {
                        const res = await fetch(`/api/boutiques/${boutique.id}/statut`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ actif: nouveauStatut }),
                        })
                        if (res.ok) router.refresh()
                        else alert('Erreur lors de la modification du statut.')
                      } catch {
                        alert('Erreur réseau')
                      }
                    }}
                    style={{
                      background: boutique.actif !== false ? '#F0FDF4' : '#F8FAFC',
                      border: boutique.actif !== false ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      color: boutique.actif !== false ? '#15803D' : '#64748B',
                      fontSize: 11,
                      fontWeight: 750,
                      padding: '2px 8px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s ease',
                    }}
                    title={boutique.actif !== false ? 'Boutique en ligne (cliquez pour masquer)' : 'Boutique masquée (cliquez pour activer)'}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: boutique.actif !== false ? '#16A34A' : '#94A3B8',
                        boxShadow: boutique.actif !== false ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : 'none',
                        flexShrink: 0,
                      }}
                    />
                    <span>{boutique.actif !== false ? 'En ligne' : 'Masquée'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ligne 2 : Actions Rapides Ma Boutique (Vitrine + Personnaliser + QR) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6, paddingTop: 6, borderTop: '1px solid rgba(232,221,210,0.6)' }}>
              <a
                href={`/boutiques/${boutique.slug || boutique.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: boutique.couleur_theme || '#C75B00',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 8px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
                title="Voir la vitrine publique telle que la voient vos clients"
              >
                <Eye size={13} style={{ flexShrink: 0 }} />
                <span>Ma vitrine ↗</span>
              </a>

              <button
                type="button"
                onClick={() => handleNavigateTab('personnaliser')}
                style={{
                  background: tab === 'personnaliser' ? '#f0fdf4' : '#ffffff',
                  border: tab === 'personnaliser' ? '1.5px solid #16a34a' : '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '7px 8px',
                  fontSize: 11.5,
                  fontWeight: 750,
                  color: tab === 'personnaliser' ? '#166534' : 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
                title="Personnaliser les couleurs, le style et la bannière"
              >
                <Palette size={13} style={{ color: boutique.couleur_theme || '#C75B00', flexShrink: 0 }} />
                <span>Design</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nav Desktop (Toutes catégories dépliées par défaut, ouverture/fermeture manuelle au clic uniquement) */}
        <nav 
          className="bq-nav bq-nav-desktop" 
          style={{ padding: '8px 4px' }}
        >
          {NAV_GROUPS.map((group, gIdx) => {
            const hasActiveItem = group.items.some(i => i.key === tab)
            const isExpanded = expandedGroups[gIdx] ?? true
            const GroupIcon = group.icon
            return (
            <div 
              key={gIdx} 
              className="bq-nav-group" 
              style={{ marginBottom: 8 }}
            >
              <button 
                type="button"
                className={`bq-nav-group-header${hasActiveItem ? ' bq-nav-group-header--active' : ''}`}
                onClick={() => setExpandedGroups(prev => ({ ...prev, [gIdx]: !isExpanded }))}
                aria-expanded={isExpanded}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 11px',
                  background: hasActiveItem ? 'linear-gradient(135deg, #FFF9F5 0%, #FFF3E8 100%)' : 'var(--surface-muted, #FAF8F5)',
                  border: hasActiveItem ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  boxShadow: hasActiveItem ? '0 2px 6px rgba(199,91,0,0.12)' : '0 1px 2px rgba(26,22,18,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <GroupIcon size={15} style={{ color: hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)', flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {group.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 750,
                    padding: '2px 6px',
                    borderRadius: 12,
                    background: hasActiveItem ? '#FED7AA' : 'rgba(28,43,74,0.08)',
                    color: hasActiveItem ? '#9A3412' : 'var(--text-strong)',
                  }}>
                    {formatNumber(group.items.length)}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{
                      color: hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </button>

              <div style={{
                display: isExpanded ? 'flex' : 'none',
                flexDirection: 'column',
                gap: 2,
                marginTop: 4,
                paddingLeft: 6,
                borderLeft: hasActiveItem ? '2.5px solid var(--accent, #C75B00)' : '2px solid var(--border)',
                marginLeft: 8,
                animation: 'fadeSlideDown 0.15s ease-out',
              }}>
                {group.items.map(item => {
                  const allowed = isAllowed(item.minPlan)
                  const isActive = tab === item.key
                  const ItemIcon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavigateTab(item.key)}
                      className={`bq-nav-item${isActive ? ' active' : ''}`}
                      style={{
                        opacity: allowed ? 1 : 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: isActive ? 750 : 600,
                        color: isActive ? 'var(--accent, #C75B00)' : 'var(--text-strong)',
                        background: isActive ? 'var(--orange2, #FFF3E8)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.12s, color 0.12s',
                      }}
                    >
                      <ItemIcon size={16} style={{ color: isActive ? 'var(--accent, #C75B00)' : 'var(--text-subtle)', flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                      {!allowed && (
                        <span style={{ fontSize: 9, background: item.minPlan === 'business' ? 'var(--navy)' : 'var(--accent)', color: '#fff', padding: '2px 5px', borderRadius: 4, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' }}>
                          {item.minPlan === 'business' ? 'Business' : 'Pro'}
                        </span>
                      )}
                      {allowed && item.key === 'commandes' && nbEnAttente > 0 && (
                        <span className="bq-nav-badge">{formatNumber(nbEnAttente)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            )
          })}
        </nav>

        {/* Bouton bascule : Afficher/Masquer les options avancées */}
        <div style={{ padding: '4px 12px 12px' }}>
          <button
            type="button"
            onClick={() => setShowAdvancedNav(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              border: showAdvancedNav ? '1.5px solid var(--accent, #C75B00)' : '1.5px dashed var(--border-medium, #D1C4B4)',
              background: showAdvancedNav ? 'var(--orange2, #FFF3E8)' : 'transparent',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 800,
              color: showAdvancedNav ? 'var(--accent, #C75B00)' : 'var(--text-subtle, #8C7E74)',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronDown
              size={14}
              style={{
                transform: showAdvancedNav ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
            <span>{showAdvancedNav ? 'Masquer les options avancées' : 'Plus d\'options (comptabilité, rapports...)'}</span>
          </button>

          {/* Panneau dépliable interactif visible UNIQUEMENT sur mobile lorsque showAdvancedNav est actif (display: none !important sur desktop) */}
          {showAdvancedNav && (
            <div className="bq-advanced-mobile-panel" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NAV_ADVANCED.map((group, gIdx) => (
                <div key={gIdx} style={{ background: '#FAF8F5', border: '1px solid #E8DDD2', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, fontWeight: 800, color: 'var(--navy, #1C2B4A)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <group.icon size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                    <span>{group.title}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                    {group.items.map(item => {
                      const allowed = isAllowed(item.minPlan)
                      const isActive = tab === item.key
                      const ItemIcon = item.icon
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleNavigateTab(item.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: isActive ? 800 : 600,
                            color: isActive ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                            background: isActive ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                            border: isActive ? '1.5px solid var(--accent, #C75B00)' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: isActive ? '0 2px 6px rgba(199,91,0,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <ItemIcon size={14} style={{ color: isActive ? 'var(--accent, #C75B00)' : '#64748B', flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                            {item.label}
                          </span>
                          {!allowed && (
                            <span style={{ fontSize: 8.5, background: item.minPlan === 'business' ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)', color: '#fff', padding: '1px 4px', borderRadius: 3, fontWeight: 800 }}>
                              
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav Mobile — Bottom-Sheet (remplace les 2 niveaux de pills) */}
        <nav className="bq-nav-mobile" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          {/* Ancien 2 niveaux masqué par CSS */}
        </nav>

        {/* Bottom-Sheet Mobile Navigation — Boutique */}
        <BoutiqueMobileBottomSheet
          navGroups={NAV_GROUPS}
          activeTab={tab}
          onSetTab={(newTab) => handleNavigateTab(newTab)}
          isAllowed={isAllowed}
          nbEnAttente={nbEnAttente}
          formatNumber={formatNumber}
          sheetTitle={boutique.nom}
          onBack={onBack}
          boutiqueId={boutique.id}
          hasMultipleBoutiques={hasMultipleBoutiques}
          boutiques={boutiques}
          onSelectBoutique={onSelectBoutique}
          showAdvancedNav={showAdvancedNav}
          onToggleAdvancedNav={() => setShowAdvancedNav(v => !v)}
        />

        {/* Liens rapides (Desktop seulement) */}
        <div className="bq-sidebar-quick-links" style={{ padding: '12px 8px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {boutique.mode_fonctionnement === 'pure_player' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 12, color: 'var(--accent)', borderRadius: 8, fontWeight: 800, background: 'var(--orange2)', border: '1px solid #fed7aa' }}>
              <span>{t('shop.purePlayerMode')}</span>
            </div>
          ) : (
            <a href={`/boutique/caisse?b=${boutique.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, color: '#16a34a', textDecoration: 'none', borderRadius: 8, fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0' }}
              onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCart size={14} />
                <span>{t('shop.posPhysicalLink')}</span>
              </span>
            </a>
          )}
          <a href="/guide-utilisation" target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', borderRadius: 8, fontWeight: 750, background: 'var(--orange2)', border: '1px solid #fed7aa' }}>
            <BookOpen size={14} />
            <span>Guide d&apos;utilisation</span>
          </a>
          <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-subtle)', textDecoration: 'none', borderRadius: 8 }}>
            <ExternalLink size={14} />
            <span>{t('shop.viewPublicShopLink')}</span>
          </a>
          <a href="/compte"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: 'var(--navy)', textDecoration: 'none', borderRadius: 8, fontWeight: 700, background: 'var(--surface-subtle)' }}>
            <Store size={14} />
            <span>{t('shop.merchantAccount')}</span>
          </a>
        </div>
      </aside>

      <QrCodeShareModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        url={typeof window !== 'undefined' ? `${window.location.origin}/boutiques/${boutique.slug || boutique.id}` : `https://nopalou.com/boutiques/${boutique.slug || boutique.id}`}
        boutiqueNom={boutique.nom}
      />

      {/* Contenu principal */}
      <main className={`bq-main${!isSidebarOpen ? ' bq-main--expanded' : ''}`}>
        {!isSidebarOpen && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="bq-sidebar-open-btn"
              title="Réafficher le menu de la boutique"
              style={{
                background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #2D3E6B 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 3px 10px rgba(28,43,74,0.18)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 14 }}>☰</span>
              <span>Afficher le menu ({boutique.nom})</span>
            </button>
          </div>
        )}

        {/* BANDEAU OFFICIEL 1ER MOIS GRATUIT — ACCÈS TOTAL VIP */}
        {isTrialActive && (
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #312e81 100%)',
            color: '#ffffff',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 16px rgba(30,58,95,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
              }}>
                
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 14, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>1er Mois 100% Offert — Accès Total VIP Actif</span>
                  <span style={{ background: '#22c55e', color: '#064e3b', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                    {joursRestantsEssai} jour{joursRestantsEssai > 1 ? 's' : ''} restant{joursRestantsEssai > 1 ? 's' : ''}
                  </span>
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#e0e7ff', lineHeight: 1.4 }}>
                  Toutes les fonctionnalités Nopalou sont débloquées (Caisse POS tactile, Saisie Express, Compta, Factures PDF, Équipe, API). Profitez-en pour digitaliser 100% de votre boutique !
                </p>
              </div>
            </div>
            <a
              href="/boutique/abonnement"
              style={{
                background: '#ffffff',
                color: '#1e3a5f',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            >
              Voir les formules →
            </a>
          </div>
        )}

        {/* Titre de section Desktop */}
        <div className="bq-main-tab-header" style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            {(() => {
              const TabHeaderIcon = currentTabInfo.icon
              return (
                <h2 style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 20, margin: 0, color: 'var(--navy)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TabHeaderIcon size={20} style={{ color: 'var(--accent, #C75B00)' }} />
                  <span>{currentTabInfo.title}</span>
                </h2>
              )
            })()}
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>{currentTabInfo.desc}</p>
          </div>
        </div>

        {!tabAllowed ? (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl, 16px)', padding: '40px 24px', textAlign: 'center', maxWidth: 560, margin: '40px auto', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--orange2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px' }}>
              {t('shop.featureLockedTitle', { plan: currentNavItem?.minPlan === 'business' ? 'Business' : 'Pro' })}
            </h3>
            <p style={{ color: 'var(--text-subtle)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {currentNavItem?.minPlan === 'business' 
                ? t('shop.featureLockedDesc')
                : t('shop.featureLockedDesc')}
            </p>
            <a 
              href="/boutique/abonnement"
              className="btn-npl btn-npl-primary btn-npl-lg"
              style={{ display: 'inline-flex', background: currentNavItem?.minPlan === 'business' ? 'var(--navy)' : 'var(--accent)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 14px rgba(199,91,0,0.25)' }}
            >
              {t('shop.upgradePlanBtn')}
            </a>
          </div>
        ) : (
          <>
            {tab === 'dashboard'   && (
              isModeFacile ? (
                <DashboardFacile
                  boutiqueNom={boutique.nom}
                  boutiqueId={boutique.id}
                  onOuvrirAjoutProduit={() => { setFiltreProduitsMarketing(undefined); setTab('produits'); }}
                  onNaviguerOnglet={(t) => setTab(t as any)}
                  onBasculerModeComplet={() => {
                    setIsModeFacile(false);
                    try { localStorage.setItem('nopalou_dashboard_mode_facile', 'false'); } catch (err) { console.warn('[Nopalou:BoutiqueClient:L3035]', err); }
                  }}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModeFacile(true);
                        try { localStorage.setItem('nopalou_dashboard_mode_facile', 'true'); } catch (err) { console.warn('[Nopalou:BoutiqueClient:L3045]', err); }
                      }}
                      style={{
                        background: 'var(--orange2, #FFF3E8)',
                        border: '1px solid #FED7AA',
                        color: 'var(--accent, #C75B00)',
                        borderRadius: 10,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 3px rgba(199,91,0,0.1)'
                      }}
                    >
                      <span>Activer le Mode Facile (Caisse Taf-Taf)</span>
                    </button>
                  </div>
                  <BoutiqueDashboard boutique={boutique} planActif={effectivePlan} nbEnAttente={nbEnAttente} onNavigate={handleNavigateFromDashboard} />
                </>
              )
            )}
            {tab === 'produits'    && <CatalogueProduits boutique={boutique} planActif={effectivePlan} prixPro={prixPro} filtreInitial={filtreProduitsMarketing} />}
            {tab === 'commandes'   && <Commandes boutiqueId={boutique.id} boutique={boutique} />}
            {tab === 'carnet'      && <CarnetDettes boutique={boutique} planActif={effectivePlan} />}
            {tab === 'express'     && <SaisieExpressView boutiqueId={boutique.id} />}
            {tab === 'compta'      && <Comptabilite boutiqueId={boutique.id} boutiqueNom={boutique.nom} initialTab={subTabCompta as any} />}
            {tab === 'analytics'   && <AnalyticsClient boutiques={[{ id: boutique.id, nom: boutique.nom }]} />}
            {tab === 'personnaliser' && (
              <StudioPersonnalisation boutique={boutique as any} onSaved={handleBoutiqueSaved} />
            )}
            {tab === 'infos'       && (
              <div style={{ maxWidth: 580 }}>
                <BoutiqueForm boutique={boutique} onCancel={onBack} onSuccess={handleBoutiqueSaved} />
              </div>
            )}
            {tab === 'marketing'   && <MarketingBoutique boutique={boutique} onVoirJamaisPartages={() => { setFiltreProduitsMarketing('jamais_partage'); setTab('produits') }} onOpenQrModal={() => setShowQrModal(true)} onNavigate={(t) => setTab(t)} planActif={effectivePlan} />}
            {tab === 'social'      && <SocialShopManager boutiqueId={boutique.id} boutiqueNom={boutique.nom} boutiqueSlug={boutique.slug} />}
            {tab === 'equipe'      && <BoutiqueEquipe boutiqueId={boutique.id} />}
            {tab === 'admins'      && <BoutiqueAdmins boutiqueId={boutique.id} />}
            {tab === 'caissiers'   && <BoutiqueCaissiers boutiqueId={boutique.id} />}
            {tab === 'documents'   && <GestionDocuments boutiqueId={boutique.id} />}
            {tab === 'fournisseurs' && <GestionFournisseurs boutiqueId={boutique.id} />}
            {tab === 'fiscalite'   && <ParametresFiscalite boutique={boutique} onUpdate={() => router.refresh()} />}
            {tab === 'fidelite'    && <ParametresFidelitePromos boutique={boutique} onUpdate={() => router.refresh()} />}
            {tab === 'journal'     && <BoutiqueLogs boutiqueId={boutique.id} />}
            {tab === 'developer'   && <PortailDeveloppeurBoutique boutiqueId={boutique.id} planActif={effectivePlan || 'decouverte'} />}
          </>
        )}
      </main>
    </div>
    </>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function BoutiqueClient({
  boutiques,
  canCreate,
  planActif,
  codeApporteurDefaut,
  userId,
  settings,
}: {
  boutiques: Boutique[]
  canCreate: boolean
  planActif?: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  codeApporteurDefaut?: string
  userId: string
  settings: Record<string, string>
}) {
  const { t } = useTranslation()
  type Mode = 'list' | 'create' | { editing: Boutique } | { managing: Boutique }
  const [mode, setMode] = useState<Mode>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState<string | null>(null)
  const [manuelBoutiqueId, setManuelBoutiqueId] = useState<string | null>(null)
  const [, startSponsoring] = useTransition()
  const router = useRouter()

  const [boutiquesList, setBoutiquesList] = useState<Boutique[]>(boutiques)

  const isReallyOnline = useOnlineStatus()
  const [dashboardOffline, setDashboardOffline] = useState(false)
  useEffect(() => {
    setDashboardOffline(!isReallyOnline);
  }, [isReallyOnline]);

  const [showProductTour, setShowProductTour] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const tourDone = localStorage.getItem('nopalou_merchant_tour_done')
        if (!tourDone && boutiques.length > 0) {
          const t = setTimeout(() => setShowProductTour(true), 1200)
          return () => clearTimeout(t)
        }
      } catch (e) { console.warn('[Nopalou:BoutiqueClient:L3147]', e); }
    }
  }, [boutiques.length])
  // ── Plan actif : persistance offline ─────────────────────────────────────────
  // Sauvegarde le plan dès qu'il est connu (online) et le restaure depuis le
  // cache lorsque la prop serveur est null (mode hors-ligne / page non-SSR).
  const [planActifEffectif, setPlanActifEffectif] = useState<'pro' | 'business' | 'decouverte' | 'taf_taf' | null>(() => {
    if (planActif) return planActif as any
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('nopalou_plan_actif')
      if (cached) return cached as any
    }
    return null
  })

  useEffect(() => {
    if (planActif) {
      setPlanActifEffectif(planActif as any)
      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_plan_actif', planActif)
      }
    } else {
      setPlanActifEffectif(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nopalou_plan_actif')
      }
    }
  }, [planActif])

  useEffect(() => {
    if (boutiques && boutiques.length > 0) {
      setBoutiquesList(boutiques)
      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(boutiques))
      }
    } else {
      const cachedStr = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_user_boutiques') : null
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr)
          if (cached && Array.isArray(cached) && cached.length > 0) {
            setBoutiquesList(cached)
          }
        } catch (e) { console.warn('[Nopalou:BoutiqueClient:L3190]', e); }
      }
    }
  }, [boutiques])

  const searchParams = useSearchParams()
  const manageId = searchParams.get('manage') || searchParams.get('id') || searchParams.get('b') || searchParams.get('boutique')
  const tabParam = searchParams.get('tab')
  const lockedParam = searchParams.get('locked')

  useEffect(() => {
    const listToSearch = boutiquesList.length > 0 ? boutiquesList : boutiques
    
    setMode(prevMode => {
      // 1. Si l'URL spécifie explicitement une boutique (?id=... ou ?manage=... ou ?b=...), celle-ci est prioritaire
      if (manageId && listToSearch.length > 0) {
        const targetBoutique = listToSearch.find(b => b.id === manageId || b.slug === manageId || b.nom?.toLowerCase() === manageId.toLowerCase())
        if (targetBoutique) return { managing: targetBoutique }
      }

      // 2. Si on gère déjà une boutique manuellement
      if (typeof prevMode === 'object' && 'managing' in prevMode) {
        // Rafraîchir les données de la boutique active (si modifiées par le réseau/cache)
        const updatedTarget = listToSearch.find(b => b.id === prevMode.managing.id)
        if (updatedTarget && updatedTarget !== prevMode.managing) {
          return { managing: updatedTarget }
        }
        return prevMode // On ne touche à rien
      }

      // 3. Si on n'est pas encore en mode 'managing' mais qu'un onglet est demandé
      if (tabParam && tabParam !== 'caisse' && listToSearch.length > 0) {
        return { managing: listToSearch[0] }
      }

      // 4. Si le marchand n'a qu'une seule boutique et arrive sur /boutique : ouverture directe du dashboard de sa boutique
      if (listToSearch.length === 1 && prevMode === 'list' && !searchParams.get('list')) {
        return { managing: listToSearch[0] }
      }
      
      return prevMode
    })
  }, [manageId, tabParam, lockedParam, boutiquesList, boutiques, searchParams])

  // ── Préchargement Global (Offline Sync) ───────────────────────────────────────────────
  // Charge toutes les données (catalogue, historique caisse, clients) en arrière-plan
  // dès la connexion pour garantir un fonctionnement hors-ligne optimal.
  useEffect(() => {
    if (typeof window !== 'undefined' && isReallyOnline) {
      const preloadTimer = setTimeout(() => {
        const fetchLow = (url: string) => fetch(url, { priority: 'low' } as any);
        const boutiquesAPrecharger = boutiquesList.length > 0 ? boutiquesList : boutiques;
        boutiquesAPrecharger.forEach(async (b) => {
          try {
            // 1. Précharger le catalogue de produits
            const prods = await getBoutiqueProduits(b.id);
            if (prods && Array.isArray(prods)) {
              const prodsFormates = prods.map((p: any) => {
                let stockVal = Number(p.stock ?? p.quantite_stock ?? p.stock_quantite);
                if (isNaN(stockVal)) stockVal = 10;
                return { ...p, stock: stockVal };
              });
              localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prodsFormates));
              sauvegarderProduitsLocaux(prodsFormates, b.id, userId).catch(() => {});
            }

            // 2. Précharger l'historique de caisse
            import('./actions').then(({ getPosHistorique }) => {
              getPosHistorique(b.id).then(hist => {
                if (hist && Array.isArray(hist) && hist.length > 0) {
                  localStorage.setItem(`nopalou_pos_historique_${b.id}`, JSON.stringify(hist));
                }
              }).catch(() => {});
            }).catch(() => {});

            // 3. Précharger le carnet de clients (Crédits)
            const resClients = await fetchLow(`/api/boutiques/${b.id}/credits-clients`).catch(() => null);
            if (resClients && resClients.ok) {
              const dataClients = await resClients.json().catch(() => null);
              if (dataClients && dataClients.clients && Array.isArray(dataClients.clients)) {
                import('@/lib/db-offline').then(({ sauvegarderClientsLocaux }) => {
                  sauvegarderClientsLocaux(dataClients.clients, b.id, userId).catch(() => {});
                }).catch(() => {});
              }
            }

            // 4. Précharger Analytics
            fetchLow(`/api/analytics/boutique/${b.id}`)
              .then(r => r.ok ? r.json() : Promise.reject())
              .then(data => {
                if (data.stats) localStorage.setItem(`nopalou_offline_analytics_${b.id}`, JSON.stringify(data));
              }).catch(() => {});

            // 5. Précharger Admins
            fetchLow(`/api/boutiques/${b.id}/admins`)
              .then(r => r.ok ? r.json() : Promise.reject())
              .then(data => {
                if (data.admins) localStorage.setItem(`nopalou_offline_admins_${b.id}`, JSON.stringify(data.admins));
              }).catch(() => {});

            // 6. Précharger Caissiers
            fetchLow(`/api/boutiques/${b.id}/caissiers`)
              .then(r => r.ok ? r.json() : Promise.reject())
              .then(data => {
                if (data.caissiers) localStorage.setItem(`nopalou_offline_caissiers_${b.id}`, JSON.stringify(data.caissiers));
              }).catch(() => {});

            // 7. Précharger le Journal d'Audit & Historique des Actions
            fetchLow(`/api/boutiques/${b.id}/logs?limit=150`)
              .then(r => r.ok ? r.json() : Promise.reject())
              .then(data => {
                if (data.logs) localStorage.setItem(`nopalou_offline_logs_${b.id}_tous`, JSON.stringify(data.logs));
              }).catch(() => {});

          } catch (e) {
            console.error('[Preload Offline] Erreur préchargement boutique', b.id, e);
          }
        });
      }, 2500);

      return () => clearTimeout(preloadTimer);
    }
  }, [boutiquesList, boutiques, isReallyOnline]);

  // État et Listener pour le mode hors-ligne du Dashboard gérés plus haut

  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const waveActif    = settings.paiement_wave !== 'false'
  const montantSponsor = Number(settings.prix_sponsoring) || 5000
  const prixPro = Number(settings.plan_pro_prix) || 5000

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette boutique définitivement ?')) return
    setDeleteError(null)
    const result = await deleteBoutique(id)
    if (result.error) setDeleteError(result.error)
    else { setSuccessMsg('Boutique supprimée.'); router.refresh() }
  }

  function handleSuccess() {
    const isEdit = typeof mode === 'object' && 'editing' in mode
    setSuccessMsg(isEdit ? 'Boutique modifiée avec succès !' : 'Boutique créée avec succès !')
    setMode('list')
    router.refresh()
  }

  // Mode formulaire création
  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
        <BoutiqueForm
          boutique={typeof mode === 'object' && 'editing' in mode ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={handleSuccess}
          codeApporteurDefaut={codeApporteurDefaut}
        />
      </div>
    )
  }

  // Mode gestion — layout pleine largeur avec sidebar
  if (typeof mode === 'object' && 'managing' in mode) {
    return (
      <div className="bq-manage-outer-wrap" style={{ maxWidth: 1360, margin: '32px auto', padding: '0 24px' }}>
        <BoutiqueManage
          boutique={mode.managing}
          boutiques={boutiquesList}
          planActif={planActifEffectif ?? null}
          initialTab={tabParam ?? undefined}
          hasMultipleBoutiques={boutiquesList.length > 1}
          onSelectBoutique={(b) => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href)
              url.searchParams.set('manage', b.id)
              window.history.replaceState(null, '', url.toString())
            }
            setMode({ managing: b })
          }}
          onCreateBoutique={() => setMode('create')}
          onBack={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href)
              url.searchParams.delete('manage')
              url.searchParams.delete('id')
              url.searchParams.delete('tab')
              url.searchParams.delete('locked')
              window.history.replaceState(null, '', url.pathname)
            }
            setMode('list')
          }}
          onEdit={() => { setSuccessMsg('Boutique modifiée avec succès !'); setMode('list'); router.refresh() }}
          prixPro={prixPro}
        />
      </div>
    )
  }

  // Vue liste
  return (
    <main className="bq-list-outer-wrap" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 20px 80px', overflowX: 'hidden' }}>
      {/* Navigation Fil d'Ariane Standard Nopalou */}
      <nav
        aria-label="Fil d'Ariane"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          background: 'var(--orange2, #FFF3E8)',
          padding: '5px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(199, 91, 0, 0.12)',
          boxShadow: '0 1px 3px rgba(199, 91, 0, 0.05)',
          marginBottom: 16,
        }}
      >
        <Link
          href="/compte"
          style={{
            color: 'var(--text2, #6B5E52)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Mon compte
        </Link>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #C75B00)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
          Mes boutiques
        </span>
      </nav>

      {/* Header Principal Harmonisé & Unifié */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px 28px',
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: 'var(--shadow-xs)',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0, letterSpacing: '-0.02em' }}>
              Mes Boutiques
            </h1>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              background: 'var(--orange2, #FFF3E8)',
              color: 'var(--accent, #C75B00)',
              border: '1px solid rgba(199, 91, 0, 0.2)',
              padding: '3px 10px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent, #C75B00)' }} />
              {boutiques.length} / 3 autorisée{boutiques.length > 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2, #6B5E52)', margin: 0, lineHeight: 1.5 }}>
            Gérez vos points de vente, catalogue produits, encaissements et caisse enregistreuse POS.
          </p>
        </div>

        {/* Boutons d'Action Clairs & Alignés */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/boutique/caisse" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            background: '#ffffff',
            border: '1.5px solid var(--border, #E8DDD2)',
            color: 'var(--navy, #1C2B4A)',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(26,22,18,0.04)',
            transition: 'all 0.15s ease'
          }}>
            <Monitor size={16} style={{ color: 'var(--navy, #1C2B4A)' }} />
            <span>{t('shop.openPosBtn')}</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowProductTour(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Revoir le guide de démarrage en 3 étapes"
          >
            <span></span>
            <span>Guide 3 étapes</span>
          </button>

          {canCreate && (
            <button onClick={() => setMode('create')} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #C75B00 0%, #a84c00 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
              transition: 'all 0.15s ease'
            }}>
              <PlusCircle size={16} />
              <span>{t('shop.createShop')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', color: '#16a34a', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {(deleteError || sponsorError) && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
          {deleteError || sponsorError}
        </div>
      )}

      {/* Bannière pro */}
      {!planActif && boutiques.length > 0 && (
        <Link href="/boutique/abonnement" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'linear-gradient(135deg, #fff8f0 0%, #fff3e0 100%)',
          border: '1px solid #f59e0b', borderRadius: 14,
          padding: '16px 20px', marginBottom: 24, textDecoration: 'none',
        }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}></span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#92400e' }}>{t('shop.proBannerTitle')}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b45309' }}>{t('shop.proBannerDesc')} — {prixPro.toLocaleString('fr-FR')} FCFA/mois</p>
          </div>
          <span style={{ color: '#C75B00', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{t('shop.viewPlans')}</span>
        </Link>
      )}

      {boutiquesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}></p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{t('shop.createShopPrompt')}</p>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>{t('shop.createShopDesc')}</p>
          <button onClick={() => setMode('create')} style={{
            padding: '12px 28px', background: 'var(--accent, #C75B00)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(199,91,0,0.25)'
          }}>
            {t('shop.createMyFirstShop')}
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', 
          gap: 24,
          alignItems: 'start'
        }}>
          {boutiquesList.map(b => (
            <BoutiqueCard
              key={b.id}
              boutique={b}
              planActif={planActifEffectif ?? null}
              onEdit={() => setMode({ editing: b })}
              onDelete={() => handleDelete(b.id)}
              onManage={() => setMode({ managing: b })}
            />
          ))}
        </div>
      )}

      {/* Notification Hors-Ligne Dashboard */}
      {dashboardOffline && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#c2410c', color: 'white', padding: '10px 24px', borderRadius: 30,
          fontWeight: 700, fontSize: 14, zIndex: 999999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap'
        }}>
          <span></span> Mode Hors-Ligne (Données en cache)
        </div>
      )}

      {/* Product Tour Onboarding Marchand (Audit 94+/100) */}
      <ProductTourModal
        isOpen={showProductTour}
        onClose={() => setShowProductTour(false)}
        onAjouterProduitDirect={() => {
          setShowProductTour(false)
          if (boutiquesList.length > 0) {
            setMode({ managing: boutiquesList[0] })
            router.push(`/boutique?manage=${boutiquesList[0].id}&tab=produits`)
          }
        }}
      />
    </main>
  )
}
