'use client'
import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit, marquerProduitPartage, publierProduitAnnonce, getBoutiqueProduits, updateStock, duplicateProduit } from './actions'
import Comptabilite from './Comptabilite'
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
import GestionDocuments from './GestionDocuments'
import GestionFournisseurs from './GestionFournisseurs'
import BoutiqueLogs from './BoutiqueLogs'
import QrCodeShareModal from '@/components/QrCodeShareModal'
import ModalPartageProduit from '@/components/ModalPartageProduit'
import { Store, PlusCircle, Monitor, Settings, Edit, Eye, Trash2, ArrowLeft, MapPin, Tag, Phone, Share2, Zap, BookOpen, ShoppingBag, FileText, ShoppingCart, ClipboardList, Star, AlertTriangle, CheckCircle2, XCircle, Sparkles, Copy, Check, Download, ExternalLink, MessageCircle, Flame, Send, CheckSquare, Square } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { sauvegarderProduitsLocaux, obtenirProduitsLocaux } from '@/lib/db-offline'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { capturerEtOptimiserImageOCR, jouerBipScan } from '@/lib/ocr-helper'

import { CATEGORIES, PRODUIT_CATEGORIES } from '@/lib/categories'
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
  slug: string | null
  mode_fonctionnement?: 'hybride_pos' | 'pure_player'
  meta_pixel_id?: string | null
  tiktok_pixel_id?: string | null
  ga4_id?: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  created_at: string
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

// ── Caractéristiques par catégorie ────────────────────────────────────────────

const ETATS_PRODUIT = ['Neuf', 'Bon état', 'Occasion', 'Pour pièces']
const GENRES_MODE   = ['Homme', 'Femme', 'Enfant', 'Unisexe']
const PLATEFORMES   = ['PS4', 'PS5', 'Xbox One', 'Xbox Series', 'Nintendo Switch', 'PC', 'Mobile']
const POUR_QUI      = ['Homme', 'Femme', 'Mixte']

// ── Types de variantes prédéfinis ──────────────────────────────────────────────

const COULEURS_PALETTE: { nom: string; hex: string }[] = [
  { nom: 'Noir',        hex: '#111111' },
  { nom: 'Blanc',       hex: '#ffffff' },
  { nom: 'Gris',        hex: '#9ca3af' },
  { nom: 'Rouge',       hex: '#dc2626' },
  { nom: 'Bleu',        hex: '#2563eb' },
  { nom: 'Bleu marine', hex: '#1e3a5f' },
  { nom: 'Vert',        hex: '#16a34a' },
  { nom: 'Jaune',       hex: '#eab308' },
  { nom: 'Orange',      hex: '#f97316' },
  { nom: 'Rose',        hex: '#ec4899' },
  { nom: 'Violet',      hex: '#9333ea' },
  { nom: 'Marron',      hex: '#78350f' },
  { nom: 'Beige',       hex: '#e7d7c1' },
  { nom: 'Or',          hex: '#d4af37' },
  { nom: 'Argent',      hex: '#c0c0c0' },
  { nom: 'Bordeaux',    hex: '#7f1d1d' },
]

const TAILLES_VETEMENT = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const POINTURES_CHAUSSURE = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
const STOCKAGES_RAM = ['4 Go', '8 Go', '16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To']
const CAPACITES_PUISSANCE = ['0,75 CV', '1 CV', '1,5 CV', '2 CV', '2,5 CV', '3 CV', '100 L', '150 L', '200 L', '300 L', '400 L']

interface TypeVariante {
  id: TypeVarianteId
  label: string
  nomVariante: string
  suggestions: string[]
  repetable: boolean
}

const TYPES_VARIANTE: TypeVariante[] = [
  { id: 'couleur',  label: '🎨 Couleur',              nomVariante: 'Couleur',   suggestions: COULEURS_PALETTE.map(c => c.nom), repetable: false },
  { id: 'taille',   label: '📏 Taille (vêtement)',     nomVariante: 'Taille',    suggestions: TAILLES_VETEMENT,     repetable: false },
  { id: 'pointure', label: '👟 Pointure (chaussure)',  nomVariante: 'Pointure',  suggestions: POINTURES_CHAUSSURE,  repetable: false },
  { id: 'stockage', label: '💾 Stockage / RAM',        nomVariante: 'Stockage',  suggestions: STOCKAGES_RAM,        repetable: false },
  { id: 'capacite', label: '⚙️ Capacité / Puissance',  nomVariante: 'Capacité',  suggestions: CAPACITES_PUISSANCE,  repetable: false },
  { id: 'autre',    label: '➕ Autre (personnalisé)',   nomVariante: '',          suggestions: [],                   repetable: true },
]

function CaracField({ label, name, value, onChange, placeholder, required: req = false }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>{label}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <input
        type="text" value={value} onChange={e => onChange(name, e.target.value)}
        style={inputStyle} placeholder={placeholder} required={req}
      />
    </div>
  )
}

function CaracSelect({ label, name, value, onChange, options, required: req = false }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  options: string[]; required?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>{label}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <select value={value} onChange={e => onChange(name, e.target.value)} style={inputStyle} required={req}>
        <option value="">Choisir…</option>
        {options.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
  )
}

const MARQUES_MODE = ['Zara', 'Nike', 'Adidas', 'H&M', 'Shein']
const MARQUES_SMARTPHONE = ['Samsung', 'Apple', 'Xiaomi', 'Tecno', 'Infinix']
const MARQUES_INFORMATIQUE = ['Dell', 'Lenovo', 'HP', 'Asus', 'Apple']
const MARQUES_TV_ELECTRO = ['Samsung', 'LG', 'Hisense', 'TCL']
const MARQUES_AUTO = ['Toyota', 'Yamaha', 'Hyundai', 'Kia']
const MARQUES_MAISON = ['IKEA', 'Broyhill']
const MATIERES_MODE = ['Coton', 'Lin', 'Cuir', 'Synthétique', 'Denim']
const MATIERES_MAISON = ['Bois', 'Métal', 'Tissu', 'Verre', 'Plastique']
const TYPES_ARTICLE_MAISON = ['Canapé', 'Lit', 'Table', 'Armoire', 'Chaise']
const TYPES_ARTICLE_TV_ELECTRO = ['TV', 'Frigo', 'Clim', 'Machine à laver', 'Congélateur']
const CARBURANTS = ['Essence', 'Diesel', 'Hybride', 'Électrique']
const CONDITIONNEMENTS = ['Sachet', 'Boîte', 'Vrac', 'Bouteille']
const TYPES_BEAUTE = ['Crème', 'Parfum', 'Shampoing', 'Savon', 'Maquillage']

function CaracteristiquesFields({ slug, values, onChange, typesVarianteActifs }: {
  slug: string; values: Record<string, string>; onChange: (k: string, v: string) => void
  typesVarianteActifs: Set<TypeVarianteId>
}) {
  const f = (k: string) => values[k] ?? ''

  if (slug === 'smartphones') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"   name="marque"   value={f('marque')}   onChange={onChange} suggestions={MARQUES_SMARTPHONE} />
      <CaracField  label="Modèle"   name="modele"   value={f('modele')}   onChange={onChange} placeholder="iPhone 14 Pro…" />
      {champVisibleSelonVariante('stockage', typesVarianteActifs) && (
        <CaracChips label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} suggestions={STOCKAGES_RAM} />
      )}
      <CaracField  label="RAM"      name="ram"      value={f('ram')}      onChange={onChange} placeholder="8 Go…" />
      {champVisibleSelonVariante('couleur', typesVarianteActifs) && (
        <CaracChips label="Couleur" name="couleur" value={f('couleur')} onChange={onChange} suggestions={COULEURS_PALETTE.map(c => c.nom)} />
      )}
      <CaracSelect label="État"     name="etat"     value={f('etat')}     onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'informatique') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"     name="marque"     value={f('marque')}     onChange={onChange} suggestions={MARQUES_INFORMATIQUE} />
      <CaracField  label="Modèle"     name="modele"     value={f('modele')}     onChange={onChange} placeholder="XPS 15…" />
      <CaracField  label="Processeur" name="processeur" value={f('processeur')} onChange={onChange} placeholder="Intel i7, AMD Ryzen…" />
      <CaracField  label="RAM"        name="ram"        value={f('ram')}        onChange={onChange} placeholder="16 Go…" />
      {champVisibleSelonVariante('stockage', typesVarianteActifs) && (
        <CaracChips label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} suggestions={STOCKAGES_RAM} />
      )}
      <CaracSelect label="État"       name="etat"       value={f('etat')}       onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'tv-electro') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"       name="marque"       value={f('marque')}       onChange={onChange} suggestions={MARQUES_TV_ELECTRO} />
      <CaracField  label="Modèle"       name="modele"       value={f('modele')}       onChange={onChange} placeholder="55QN90B…" />
      <CaracChips  label="Type"         name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_ARTICLE_TV_ELECTRO} />
      <CaracField  label="Taille/Capa." name="taille"       value={f('taille')}       onChange={onChange} placeholder="55 pouces, 300 L…" />
      <CaracSelect label="État"         name="etat"         value={f('etat')}         onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'auto-moto') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"      name="marque"      value={f('marque')}      onChange={onChange} suggestions={MARQUES_AUTO} />
      <CaracField  label="Modèle"      name="modele"      value={f('modele')}      onChange={onChange} placeholder="Corolla, R1…" />
      <div>
        <label style={labelStyle}>Année</label>
        <input type="number" min={1970} max={2026} value={f('annee')} onChange={e => onChange('annee', e.target.value)}
          style={inputStyle} placeholder="2020" />
      </div>
      <CaracField  label="Kilométrage" name="kilometrage" value={f('kilometrage')} onChange={onChange} placeholder="45 000 km" />
      <CaracChips  label="Carburant"   name="carburant"   value={f('carburant')}   onChange={onChange} suggestions={CARBURANTS} />
      <CaracSelect label="État"        name="etat"        value={f('etat')}        onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'mode') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"  name="marque"  value={f('marque')}  onChange={onChange} suggestions={MARQUES_MODE} />
      {champVisibleSelonVariante('taille', typesVarianteActifs) && (
        <CaracChips label="Taille" name="taille" value={f('taille')} onChange={onChange} suggestions={TAILLES_VETEMENT} />
      )}
      <CaracChips  label="Genre"   name="genre"   value={f('genre')}   onChange={onChange} suggestions={GENRES_MODE} allowAutre={false} />
      <CaracChips  label="Matière" name="matiere" value={f('matiere')} onChange={onChange} suggestions={MATIERES_MODE} />
      <CaracSelect label="État"    name="etat"    value={f('etat')}    onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'maison') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Type d'article" name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_ARTICLE_MAISON} />
      <CaracChips  label="Marque"         name="marque"       value={f('marque')}       onChange={onChange} suggestions={MARQUES_MAISON} />
      <CaracChips  label="Matière"        name="matiere"      value={f('matiere')}      onChange={onChange} suggestions={MATIERES_MAISON} />
      <CaracField  label="Dimensions"     name="dimensions"   value={f('dimensions')}   onChange={onChange} placeholder="120×80×75 cm" />
      <CaracSelect label="État"           name="etat"         value={f('etat')}         onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'jeux') return (
    <div className="bq-form-grid-2">
      <CaracSelect label="Plateforme" name="plateforme" value={f('plateforme')} onChange={onChange} options={PLATEFORMES} />
      <CaracField  label="Éditeur"    name="editeur"    value={f('editeur')}    onChange={onChange} placeholder="EA, Ubisoft…" />
      <CaracSelect label="État"       name="etat"       value={f('etat')}       onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'alimentation') return (
    <div className="bq-form-grid-2">
      <CaracField label="Poids / Quantité"   name="poids_quantite"  value={f('poids_quantite')}  onChange={onChange} placeholder="500g, 1L, 12 unités…" />
      <CaracChips label="Conditionnement"    name="conditionnement" value={f('conditionnement')} onChange={onChange} suggestions={CONDITIONNEMENTS} />
      <CaracField label="Date de péremption" name="date_peremption" value={f('date_peremption')} onChange={onChange} placeholder="12/2025" />
      <CaracField label="Origine / Marque"   name="marque"          value={f('marque')}          onChange={onChange} placeholder="Dakar Produits…" />
    </div>
  )

  if (slug === 'beaute') return (
    <div className="bq-form-grid-2">
      <CaracField  label="Marque"       name="marque"       value={f('marque')}       onChange={onChange} placeholder="L'Oréal, Nivea…" />
      <CaracChips  label="Type"         name="type_produit" value={f('type_produit')} onChange={onChange} suggestions={TYPES_BEAUTE} />
      <CaracChips  label="Pour qui"     name="pour_qui"     value={f('pour_qui')}     onChange={onChange} suggestions={POUR_QUI} allowAutre={false} />
      <CaracField  label="Contenance"   name="contenance"   value={f('contenance')}   onChange={onChange} placeholder="200 ml, 50 g…" />
    </div>
  )

  if (slug === 'services') return (
    <div className="bq-form-grid-2">
      <CaracChips label="Type de service"    name="type_service"     value={f('type_service')}     onChange={onChange} suggestions={['Plomberie', 'Cours', 'Transport', 'Ménage', 'Réparation']} />
      <CaracField label="Zone d'intervention" name="zone_intervention" value={f('zone_intervention')} onChange={onChange} placeholder="Dakar, Plateau…" />
      <CaracField label="Durée / Fréquence"  name="duree"            value={f('duree')}            onChange={onChange} placeholder="1h, par séance…" />
      <CaracField label="Disponibilité"      name="disponibilite"    value={f('disponibilite')}    onChange={onChange} placeholder="Lun-Ven 8h-18h…" />
    </div>
  )

  return null
}

// ── Helpers de style ──────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (state.success) {
      setSuccessMsg(boutique ? '✅ Paramètres de la boutique enregistrés avec succès !' : '✅ Boutique créée avec succès !')
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onSuccess()
      const t = setTimeout(() => setSuccessMsg(null), 6000)
      return () => clearTimeout(t)
    } else if (state.error) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
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

      <SectionTitle>⚡ Mode d&apos;exploitation</SectionTitle>
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
              🏪 Mode Hybride (Magasin + Web)
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Caisse enregistreuse POS, stickers codes-barres EAN-13, carnet de dettes client et vente web.
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
              ⚡ Mode Pure Player (E-Commerce Web)
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Interface 100% digitale axée sur les commandes web, les livraisons, le marketing et l&apos;analytics.
            </span>
          </label>
        </div>
      </div>

      <SectionTitle>👁️ Visibilité sur Nopalou</SectionTitle>
      <div>
        <label style={labelStyle}>Statut de la boutique</label>
        <select name="actif" defaultValue={boutique?.actif !== false ? 'true' : 'false'} style={inputStyle}>
          <option value="true">🟢 Active (En ligne & visible dans la liste des boutiques)</option>
          <option value="false">🔴 Désactivée (Masquée & retirée du catalogue Nopalou)</option>
        </select>
        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
          En désactivant votre boutique, elle n&apos;apparaîtra plus dans le catalogue public. Vous seul pourrez continuer à y accéder.
        </p>
      </div>

      <SectionTitle>📋 Informations</SectionTitle>

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
        <label style={labelStyle}>Catégorie</label>
        <select name="categorie" defaultValue={boutique?.categorie ?? ''} style={inputStyle}>
          <option value="">— Sélectionner —</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
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

      <SectionTitle>📞 Contact</SectionTitle>

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

      <SectionTitle>📊 Pixels Publicitaires & Tracking ROAS</SectionTitle>

      <div className="bq-form-grid-2">
        <div>
          <label style={labelStyle}>Meta Facebook Pixel ID</label>
          <input name="meta_pixel_id" defaultValue={boutique?.meta_pixel_id ?? ''} style={inputStyle} placeholder="Ex: 123456789012345" />
        </div>
        <div>
          <label style={labelStyle}>
            TikTok Pixel ID
            <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, marginLeft: 6, fontWeight: 700 }}>
              Pixel Actif · Sync Catalogue Direct (⏳ Bientôt)
            </span>
          </label>
          <input name="tiktok_pixel_id" defaultValue={boutique?.tiktok_pixel_id ?? ''} style={inputStyle} placeholder="Ex: C1234567890ABC" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Google Analytics GA4 ID</label>
        <input name="ga4_id" defaultValue={boutique?.ga4_id ?? ''} style={inputStyle} placeholder="Ex: G-XYZ1234567" />
      </div>

      <SectionTitle>👁️ Visibilité & Désactivation dans l'Annuaire Public</SectionTitle>
      <div>
        <label style={labelStyle}>Visibilité publique de votre boutique</label>
        <select
          name="actif"
          defaultValue={boutique?.actif !== false ? 'true' : 'false'}
          style={inputStyle}
        >
          <option value="true">🟢 Active (Visible dans le catalogue public et la recherche Nopalou)</option>
          <option value="false">🔴 Désactivée (Masquée du catalogue public et hors-ligne pour les clients)</option>
        </select>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
          Une boutique désactivée ne sera plus visible par les visiteurs sur /boutiques mais reste totalement accessible pour votre gestion interne et votre caisse POS.
        </p>
      </div>

      <SectionTitle>🔗 Lien personnalisé</SectionTitle>

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
        <SubmitButton label={boutique ? '💾 Enregistrer la boutique' : '✨ Créer la boutique'} />
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

function genererSVGCodeBarresEAN13(codeStr: string): string {
  let code = (codeStr || '2001234567890').replace(/\D/g, '')
  if (code.length < 13) code = code.padEnd(13, '0')

  const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"]
  const G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"]
  const R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"]

  const parities = [
    "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLGLG",
    "LGLGGL", "LGGLGL", "LGLGLG", "LGLGLG", "LGGLGG"
  ]

  const firstDigit = parseInt(code[0], 10) || 0
  const parity = parities[firstDigit] || "LLLLLL"

  let bin = "101" // Guard gauche

  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(code[i], 10) || 0
    bin += (parity[i - 1] === 'L') ? L[digit] : G[digit]
  }

  bin += "01010" // Guard centre

  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(code[i], 10) || 0
    bin += R[digit]
  }

  bin += "101" // Guard droite

  let svgRects = ''
  const barWidth = 2
  const height = 45

  for (let i = 0; i < bin.length; i++) {
    if (bin[i] === '1') {
      const isGuard = (i < 3) || (i >= 45 && i < 50) || (i >= 92)
      const h = isGuard ? height + 6 : height
      svgRects += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${h}" fill="#000000" />`
    }
  }

  const totalWidth = bin.length * barWidth
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 8}" width="${totalWidth}" height="${height + 8}">${svgRects}</svg>`
}

// ── Formulaire produit ────────────────────────────────────────────────────────

// PRODUIT_CATEGORIES is imported from '@/lib/categories'


function ValeursLibres({ valeurs, onAjouter, onRetirer }: {
  valeurs: string[]; onAjouter: (v: string) => void; onRetirer: (v: string) => void
}) {
  const [saisie, setSaisie] = useState('')

  function ajouter() {
    const val = saisie.trim()
    if (!val || valeurs.includes(val)) return
    onAjouter(val)
    setSaisie('')
  }

  return (
    <div>
      {valeurs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {valeurs.map(val => (
            <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
              {val}
              <button type="button" onClick={() => onRetirer(val)} style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text" value={saisie} onChange={e => setSaisie(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouter() } }}
          style={{ ...inputStyle, flex: 1 }} placeholder="Valeur, Entrée pour ajouter"
        />
        <button type="button" onClick={ajouter} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Ajouter
        </button>
      </div>
    </div>
  )
}

function ProduitForm({ boutiqueId, boutiqueCat, produit, modeInitial = 'detaille', onCancel, onSuccess }: {
  boutiqueId: string
  boutiqueCat?: string | null
  produit?: Produit
  modeInitial?: 'rapide' | 'detaille'
  onCancel: () => void
  onSuccess: (produitCree?: any) => void
}) {
  const { t, isRtl } = useTranslation()
  const action = produit
    ? updateProduit.bind(null, boutiqueId, produit.id)
    : createProduit.bind(null, boutiqueId)
  const [state, formAction] = useFormState<ActionState, FormData>(action, {})
  const [enStock, setEnStock] = useState(produit?.en_stock !== false)
  const [cat, setCat] = useState(produit?.categorie ?? boutiqueCat ?? '')
  const [carac, setCarac] = useState<Record<string, string>>(
    produit?.caracteristiques ?? {}
  )
  const [modeRapide, setModeRapide] = useState(modeInitial === 'rapide' && !produit)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imagesExistantes, setImagesExistantes] = useState<string[]>(produit?.images ?? [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [nomForm, setNomForm] = useState<string>(produit?.nom ?? (modeInitial === 'rapide' ? nomParDefautPourCategorie(cat) : ''))
  const [codeBarreForm, setCodeBarreForm] = useState<string>((produit as any)?.code_barre || '')
  const [prixForm, setPrixForm] = useState<string>(produit?.prix != null ? String(produit.prix) : '')
  const [prixAchatForm, setPrixAchatForm] = useState<string>((produit as any)?.prix_achat != null ? String((produit as any).prix_achat) : '')
  const [prixBarreForm, setPrixBarreForm] = useState<string>(produit?.prix_barre != null ? String(produit.prix_barre) : '')
  const [descForm, setDescForm] = useState<string>(produit?.description ?? '')

  // Baguette Magique (Import Rapide)
  const [magicUrl, setMagicUrl] = useState<string>('')
  const [magicLoading, setMagicLoading] = useState<boolean>(false)
  const [magicResult, setMagicResult] = useState<any>(null)
  const [magicFeedback, setMagicFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (produit?.nom) setNomForm(produit.nom)
    setCodeBarreForm((produit as any)?.code_barre || '')
    if (produit?.prix != null) setPrixForm(String(produit.prix))
    if ((produit as any)?.prix_achat != null) setPrixAchatForm(String((produit as any).prix_achat))
    if (produit?.prix_barre != null) setPrixBarreForm(String(produit.prix_barre))
    if (produit?.description != null) setDescForm(produit.description)
  }, [produit])

  async function executerMagicImport() {
    const url = magicUrl.trim();
    if (!url) {
      setMagicFeedback({ type: 'error', text: 'Veuillez coller un lien de produit (AliExpress, Shein, Amazon, etc.)' });
      return;
    }
    setMagicLoading(true);
    setMagicFeedback(null);
    try {
      const res = await fetch('/api/boutiques/magic-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (res.ok && data) {
        if (data.titre) setNomForm(data.titre);
        if (data.prix > 0) setPrixForm(String(data.prix));
        if (data.prix_achat > 0) setPrixAchatForm(String(data.prix_achat));
        if (data.prix_barre > 0) setPrixBarreForm(String(data.prix_barre));
        if (data.description) setDescForm(data.description);
        if (data.categorie && data.categorie !== 'divers') setCat(data.categorie);
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setImagesExistantes(data.images);
        }
        setMagicResult(data);
        setMagicFeedback({
          type: 'success',
          text: `✨ Produit importé avec succès ! ${data.images?.length || 0} photo(s) ajoutée(s).`
        });
        setModeRapide(false); // Basculer pour afficher description et photos
      } else {
        setMagicFeedback({ type: 'error', text: data.error || 'Impossible d\'importer les détails depuis ce lien.' });
      }
    } catch (e) {
      setMagicFeedback({ type: 'error', text: 'Erreur réseau lors de la communication avec le serveur.' });
    } finally {
      setMagicLoading(false);
    }
  }

  useEffect(() => {
    // Ne pré-remplir le nom par défaut que si le champ est strictement vide ou contient un placeholder par défaut
    if (cat && !nomForm) {
      setNomForm(nomParDefautPourCategorie(cat))
    }
  }, [cat])

  const [modalFormScanner, setModalFormScanner] = useState<boolean>(false)
  const [scannerTarget, setScannerTarget] = useState<'nom' | 'ean'>('nom')
  const [scannerStatus, setScannerStatus] = useState<string>('Initialisation de la caméra...')
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)

  const videoFormRef = useRef<HTMLVideoElement | null>(null)
  const streamFormRef = useRef<MediaStream | null>(null)
  const html5ScannerFormRef = useRef<any>(null)

  function genererCodeBarreForm() {
    const prefixe = "200"
    const corps = Math.floor(100000000 + Math.random() * 900000000).toString()
    const base12 = prefixe + corps
    let somme = 0
    for (let i = 0; i < 12; i++) {
      const val = parseInt(base12[i], 10)
      somme += (i % 2 === 0) ? val : val * 3
    }
    const check = (10 - (somme % 10)) % 10
    setCodeBarreForm(base12 + check)
  }

  async function demarrerFormScanner(target: 'nom' | 'ean' = 'nom') {
    setScannerTarget(target)
    setModalFormScanner(true)
    setOcrDetections([])
    setOcrLoading(false)
    setScannerStatus(target === 'nom' ? '📷 Cadrez le texte du produit...' : '📷 Placez le code-barres dans le cadre...')

    if (target === 'nom') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        streamFormRef.current = stream
        if (videoFormRef.current) {
          videoFormRef.current.srcObject = stream
          await videoFormRef.current.play().catch(() => {})
        }

        // Tenter la détection native de texte ou de code si disponible
        if (typeof window !== 'undefined' && 'TextDetector' in window) {
          const detector = new (window as any).TextDetector()
          const timer = setInterval(async () => {
            if (videoFormRef.current && videoFormRef.current.readyState === 4) {
              try {
                const texts = await detector.detect(videoFormRef.current)
                if (texts && texts.length > 0) {
                  const extraits = texts.map((t: any) => t.rawValue).filter((t: string) => t && t.length > 2)
                  if (extraits.length > 0) {
                    setOcrDetections(prev => Array.from(new Set([...extraits, ...prev])).slice(0, 6))
                  }
                }
              } catch (e) {}
            }
          }, 600)
          ;(videoFormRef.current as any)._textTimer = timer
        }
      } catch (e) {
        setScannerStatus('❌ Impossible d’accéder à la caméra. Vérifiez les permissions de votre navigateur.')
      }
    } else {
      // Scanner EAN avec Html5Qrcode
      setTimeout(async () => {
        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
          if (html5ScannerFormRef.current) {
            try {
              await html5ScannerFormRef.current.stop()
              html5ScannerFormRef.current.clear()
            } catch (e) {}
            html5ScannerFormRef.current = null
          }

          const container = document.getElementById('produit-form-scanner-reader')
          if (!container) return

          const scanner = new Html5Qrcode('produit-form-scanner-reader')
          html5ScannerFormRef.current = scanner

          const config = {
            fps: 15,
            qrbox: { width: 250, height: 160 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE
            ]
          }

          const onScanSuccess = (decodedText: string) => {
            setCodeBarreForm(decodedText)
            setScannerStatus(`✅ Code scanné : ${decodedText}`)
            setTimeout(() => {
              arreterFormScanner()
            }, 600)
          }

          try {
            await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          } catch (errEnv) {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
          }
        } catch (err) {
          setScannerStatus('❌ Erreur de chargement du module de scan.')
        }
      }, 300)
    }
  }

  async function capturerEtLireNomTexte() {
    if (!videoFormRef.current) return
    setOcrLoading(true)
    setScannerStatus('🔍 Optimisation de l’image & lecture OCR…')

    const imageBase64 = capturerEtOptimiserImageOCR(videoFormRef.current, {
      cropRatioWidth: 0.85,
      cropRatioHeight: 0.60,
      rehausserContraste: true
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setScannerStatus('❌ Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setNomForm(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipScan('succes')
        setScannerStatus(`✅ Nom capturé : "${data.nom}"`)
        setTimeout(() => {
          arreterFormScanner()
        }, 1200)
      } else {
        jouerBipScan('alerte')
        setScannerStatus(`⚠️ ${data.error || 'Aucun texte lisible capturé. Veuillez réessayer.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipScan('alerte')
      setScannerStatus('❌ Erreur lors de l’analyse OCR. Réessayez.')
    }
  }


  function arreterFormScanner() {
    if (videoFormRef.current && (videoFormRef.current as any)._textTimer) {
      clearInterval((videoFormRef.current as any)._textTimer)
    }
    if (streamFormRef.current) {
      streamFormRef.current.getTracks().forEach(t => t.stop())
      streamFormRef.current = null
    }
    if (html5ScannerFormRef.current) {
      try {
        html5ScannerFormRef.current.stop()
        html5ScannerFormRef.current.clear()
      } catch (e) {}
      html5ScannerFormRef.current = null
    }
    setModalFormScanner(false)
  }

  function syncFileInput(files: File[]) {
    if (!fileRef.current) return
    const dt = new DataTransfer()
    files.forEach(f => dt.items.add(f))
    fileRef.current.files = dt.files
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const restant = 5 - imagesExistantes.length
    const files = Array.from(e.target.files ?? []).slice(0, Math.max(0, restant))
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
    syncFileInput(files)
  }

  function removeNouvellePhoto(i: number) {
    const next = photos.filter((_, j) => j !== i)
    setPhotos(next)
    setPreviews(prev => prev.filter((_, j) => j !== i))
    syncFileInput(next)
  }

  function removeImageExistante(i: number) {
    setImagesExistantes(prev => prev.filter((_, j) => j !== i))
  }

  const [variantes, setVariantes] = useState<Variante[]>(produit?.variantes ?? [])
  const [nomsPersonnalises, setNomsPersonnalises] = useState<Record<number, string>>({})

  const typesDejaUtilises = new Set(
    variantes
      .map(v => v.typeId)
      .filter((t): t is TypeVarianteId => !!t && t !== 'autre')
  )
  const typesDisponibles = TYPES_VARIANTE.filter(t => t.repetable || !typesDejaUtilises.has(t.id))

  useEffect(() => {
    setCarac(prev => {
      let changed = false
      const next = { ...prev }
      for (const champ of ['taille', 'couleur', 'stockage'] as const) {
        if (!champVisibleSelonVariante(champ, typesDejaUtilises) && champ in next) {
          delete next[champ]
          changed = true
        }
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesDejaUtilises.size, Array.from(typesDejaUtilises).join(',')])

  function ajouterOption(typeId: TypeVarianteId) {
    const type = TYPES_VARIANTE.find(t => t.id === typeId)!
    setVariantes(prev => [...prev, { nom: type.nomVariante, valeurs: [], typeId: type.id }])
  }

  function renommerOptionPersonnalisee(index: number, nom: string) {
    setNomsPersonnalises(prev => ({ ...prev, [index]: nom }))
    setVariantes(prev => prev.map((v, i) => i === index ? { ...v, nom } : v))
  }

  function retirerOption(index: number) {
    setVariantes(prev => prev.filter((_, i) => i !== index))
    setNomsPersonnalises(prev => { const next = { ...prev }; delete next[index]; return next })
  }

  function toggleValeur(index: number, valeur: string) {
    setVariantes(prev => prev.map((v, i) => {
      if (i !== index) return v
      if (v.valeurs.includes(valeur)) return { ...v, valeurs: v.valeurs.filter(x => x !== valeur) }
      return { ...v, valeurs: [...v.valeurs, valeur] }
    }))
  }

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const produitFormTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.success) {
      setSuccessMsg(produit ? '✅ Produit modifié avec succès !' : '✅ Produit ajouté au catalogue avec succès !')
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (produitFormTopRef.current) {
        produitFormTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onSuccess((state as any)?.produit)
      const t = setTimeout(() => setSuccessMsg(null), 6000)
      return () => clearTimeout(t)
    } else if (state.error) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (produitFormTopRef.current) {
        produitFormTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [state, produit, onSuccess])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  const hasCaracFields = cat && cat !== 'autre' && !modeRapide

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60 }}>
      <div ref={produitFormTopRef} />
      <h3 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 16, margin: 0 }}>
        {produit ? t('shop.editProductTitle') : t('shop.addProductTitle')}
      </h3>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', color: '#166534', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{successMsg}</span>
        </div>
      )}

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
          {state.error}
        </div>
      )}

      {!produit && (
        <div style={{ background: '#f0fdf4', padding: 18, borderRadius: 14, border: '1.5px dashed #22c55e', marginBottom: 16, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🌟</span>
              <span>Baguette Magique (Import Rapide)</span>
            </label>
            <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
              AliExpress • SHEIN • Amazon • Shopify
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
            <input
              id="magic-url"
              type="url"
              value={magicUrl}
              onChange={e => setMagicUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); executerMagicImport(); } }}
              placeholder="Collez le lien du produit (AliExpress, Shein, Amazon, Alibaba, etc.)..."
              style={{
                flex: '1 1 220px',
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1px solid #86efac',
                fontSize: 13.5,
                background: '#ffffff',
                outline: 'none',
                color: '#0f172a'
              }}
            />
            <button
              type="button"
              onClick={executerMagicImport}
              disabled={magicLoading}
              className="npl-btn npl-btn-success npl-btn-md"
              style={{ flex: '0 0 auto', color: '#ffffff', whiteSpace: 'nowrap', padding: '0 20px', borderRadius: 10, fontWeight: 800 }}
            >
              {magicLoading ? '⏳ Analyse en cours...' : '🪄 Importer'}
            </button>
          </div>

          {magicFeedback && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              background: magicFeedback.type === 'success' ? '#dcfce7' : '#fef2f2',
              color: magicFeedback.type === 'success' ? '#166534' : '#dc2626',
              border: `1px solid ${magicFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {magicFeedback.text}
            </div>
          )}

          {magicResult && (
            <div style={{
              marginTop: 12,
              background: '#ffffff',
              padding: 12,
              borderRadius: 10,
              border: '1px solid #bbf7d0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
                <span>Source détectée : <strong style={{ color: '#0f172a' }}>{magicResult.source_name || 'E-commerce'}</strong></span>
                {magicResult.categorie && magicResult.categorie !== 'divers' && (
                  <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>
                    Catégorie : {magicResult.categorie}
                  </span>
                )}
              </div>

              {magicResult.images && magicResult.images.length > 0 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {magicResult.images.map((imgUrl: string, idx: number) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Aperçu ${idx + 1}`}
                      style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                    />
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>
                💡 Prix de vente suggéré : {magicResult.prix?.toLocaleString('fr-FR')} FCFA
                {magicResult.prix_achat > 0 && (
                  <span style={{ color: '#64748b', fontWeight: 500, marginLeft: 6 }}>
                    (Coût d'achat estimé : {magicResult.prix_achat?.toLocaleString('fr-FR')} FCFA)
                  </span>
                )}
              </div>
            </div>
          )}

          <p style={{ fontSize: 11.5, color: '#15803d', margin: '8px 0 0', lineHeight: 1.4 }}>
            Récupère automatiquement le titre nettoyé, le prix converti en FCFA, la description et jusqu&apos;à 5 photos haute résolution.
          </p>
        </div>
      )}

      {/* Champs cachés pour caractéristiques + catégorie + code-barres + images */}
      <input type="hidden" name="images" value={JSON.stringify(imagesExistantes)} />
      <input type="hidden" name="categorie" value={cat} />
      <input type="hidden" name="code_barre" value={codeBarreForm} />
      <input type="hidden" name="caracteristiques" value={JSON.stringify(carac)} />
      <input type="hidden" name="variantes" value={JSON.stringify(variantes.filter(v => v.nom.trim() && v.valeurs.length > 0))} />

      {/* Catégorie */}
      <div>
        <label style={labelStyle}>{t('shop.productCategory')}</label>
        <select
          value={cat}
          onChange={e => { setCat(e.target.value); setCarac({}) }}
          style={inputStyle}
        >
          <option value="">— {t('shop.productCategory')} —</option>
          {PRODUIT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Nom du produit (Affiche toujours avec Scan Nom, y compris en Ajout Rapide) */}
      <div>
        <label style={labelStyle}>{t('shop.productName')} <span style={{ color: '#dc2626' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            name="nom"
            required
            maxLength={300}
            value={nomForm}
            onChange={e => setNomForm(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 200px', width: '100%', boxSizing: 'border-box' }}
            placeholder="Ex: Eau Minérale Kirène 1.5L (ou scanné)"
          />
          <button
            type="button"
            onClick={() => demarrerFormScanner('nom')}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
            title="Scanner le nom écrit sur l'emballage du produit"
          >
            <span>📷</span>
            <span>Scan Nom</span>
          </button>
        </div>
      </div>

      {/* Code-Barres EAN-13 (Affiche toujours avec Scan EAN & Générer EAN, y compris en Ajout Rapide) */}
      <div>
        <label style={labelStyle}>Code-Barres EAN-13 (Optionnel)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={codeBarreForm}
            onChange={e => setCodeBarreForm(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 200px', width: '100%', boxSizing: 'border-box' }}
            placeholder="Ex: 600123456789 (Scannez ou tapez)"
          />
          <button
            type="button"
            onClick={genererCodeBarreForm}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
            title="Générer un code EAN-13 valide automatiquement"
          >
            <span>🎲</span>
            <span>Générer EAN</span>
          </button>
          <button
            type="button"
            onClick={() => demarrerFormScanner('ean')}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
            title="Scanner le code-barres EAN avec la caméra"
          >
            <span>📷</span>
            <span>Scan EAN</span>
          </button>
        </div>
      </div>

      {/* Modale scanner caméra (Scan Nom ou Scan EAN) */}
      {modalFormScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                {scannerTarget === 'nom' ? '📷 Scan du Nom écrit sur le produit' : '📷 Scanner Code-Barres EAN'}
              </h4>
              <button onClick={arreterFormScanner} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>{scannerStatus}</p>

            {scannerTarget === 'nom' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: '#000', position: 'relative' }}>
                  <video ref={videoFormRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 30, border: '2px dashed #38bdf8', borderRadius: 12, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Placez l'écriture du produit ici
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={capturerEtLireNomTexte}
                  disabled={ocrLoading}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {ocrLoading ? '⏳ Lecture du texte...' : '📸 Capturer & Lire le Nom sur l\'emballage'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Nom du produit capturé / à valider :</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={nomForm}
                      onChange={e => setNomForm(e.target.value)}
                      placeholder="Nom du produit..."
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #0284c7', fontSize: 13, fontWeight: 700, outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={arreterFormScanner}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ✅ Valider
                    </button>
                  </div>
                </div>

                {ocrDetections.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>Mots / Textes détectés à l'image (cliquez pour choisir) :</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ocrDetections.map((txt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNomForm(txt)}
                          style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <div id="produit-form-scanner-reader" style={{ width: '100%', height: '100%' }} />
              </div>
            )}

            <button onClick={arreterFormScanner} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 800, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Caractéristiques dynamiques par catégorie */}
      {hasCaracFields && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Caractéristiques
          </p>
          <CaracteristiquesFields slug={cat} values={carac} onChange={handleCarac} typesVarianteActifs={typesDejaUtilises} />
        </div>
      )}

      {/* Variantes (options + valeurs) */}
      {!modeRapide && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Variantes (optionnel)
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
            Ajoutez une option (ex: Couleur) puis cliquez sur les valeurs proposées.
          </p>

          {variantes.map((v, i) => {
            const type = TYPES_VARIANTE.find(t => t.id === v.typeId)
            const estCouleur = v.typeId === 'couleur'
            const estPersonnalise = !type || v.typeId === 'autre'

            return (
              <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < variantes.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  {estPersonnalise ? (
                    <input
                      type="text" value={nomsPersonnalises[i] ?? v.nom} onChange={e => renommerOptionPersonnalisee(i, e.target.value)}
                      style={{ ...inputStyle, flex: 1 }} placeholder="Nom de l'option (ex: Matière)"
                    />
                  ) : (
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#374151' }}>{type?.label}</span>
                  )}
                  <button type="button" onClick={() => retirerOption(i)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>

                {estCouleur ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {COULEURS_PALETTE.map(c => {
                      const selectionnee = v.valeurs.includes(c.nom)
                      return (
                        <button
                          key={c.nom} type="button" onClick={() => toggleValeur(i, c.nom)}
                          title={c.nom}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                          }}
                        >
                          <span style={{
                            width: 28, height: 28, borderRadius: '50%', background: c.hex,
                            border: selectionnee ? '3px solid #C75B00' : '2px solid #d1d5db',
                            boxShadow: c.hex === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
                            display: 'block',
                          }} />
                          <span style={{ fontSize: 10, color: selectionnee ? '#C75B00' : '#6b7280', fontWeight: selectionnee ? 700 : 500 }}>{c.nom}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : type ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {type.suggestions.map(val => {
                      const selectionnee = v.valeurs.includes(val)
                      return (
                        <button
                          key={val} type="button" onClick={() => toggleValeur(i, val)}
                          style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: selectionnee ? '2px solid #C75B00' : '1px solid #d1d5db',
                            background: selectionnee ? '#fff7f0' : '#fff',
                            color: selectionnee ? '#C75B00' : '#374151',
                          }}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <ValeursLibres valeurs={v.valeurs} onAjouter={val => toggleValeur(i, val)} onRetirer={val => toggleValeur(i, val)} />
                )}
              </div>
            )
          })}

          {typesDisponibles.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: variantes.length > 0 ? 12 : 0 }}>
              {typesDisponibles.map(t => (
                <button
                  key={t.id} type="button" onClick={() => ajouterOption(t.id)}
                  style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                >
                  + {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {!modeRapide && (
        <div>
          <label style={labelStyle}>{t('shop.descriptionLabel')}</label>
          <textarea
            name="description"
            rows={3}
            value={descForm}
            onChange={e => setDescForm(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Détails supplémentaires, accessoires inclus, garantie…"
          />
        </div>
      )}

      {/* Prix de Vente, Prix d'Achat (Coût) & Prix Barré */}
      <div className={modeRapide ? '' : 'bq-form-grid-2'} style={{ display: 'grid', gridTemplateColumns: modeRapide ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div>
          <label style={labelStyle}>{t('shop.productPrice')} (FCFA) <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>({t('common.optional') || 'Optionnel'})</span></label>
          <input
            name="prix"
            type="number"
            min={0}
            value={prixForm}
            onChange={e => setPrixForm(e.target.value)}
            style={inputStyle}
            placeholder="Ex: 15 000 (Vente)"
          />
        </div>
        <div>
          <label style={labelStyle}>Prix d&apos;achat / Coût (FCFA) <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>({t('common.optional') || 'Optionnel'})</span></label>
          <input
            name="prix_achat"
            type="number"
            min={0}
            value={prixAchatForm}
            onChange={e => setPrixAchatForm(e.target.value)}
            style={inputStyle}
            placeholder="Ex: 10 000 (Coût)"
            title="Utilisé pour calculer vos marges et la valeur de votre stock"
          />
        </div>
        {!modeRapide && (
          <div>
            <label style={labelStyle}>{t('shop.productPriceStrikethrough')}</label>
            <input
              name="prix_barre"
              type="number"
              min={0}
              value={prixBarreForm}
              onChange={e => setPrixBarreForm(e.target.value)}
              style={inputStyle}
              placeholder="Ex: 20 000"
            />
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <label style={labelStyle}>{t('shop.photosLabel')} <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>({t('common.optional') || 'Optionnel'} — {t('shop.photosHelpText')})</span></label>
        <div className="photos-zone">
          {imagesExistantes.length + photos.length < 5 && (
            <div
              className="photos-dropzone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              tabIndex={0}
              role="button"
              aria-label="Ajouter des photos"
            >
              <span style={{ fontSize: 28 }}>📷</span>
              <p>Cliquez pour ajouter des photos (Optionnel)</p>
            </div>
          )}
          <input
            ref={fileRef}
            name="photos"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotos}
          />

          {(imagesExistantes.length > 0 || previews.length > 0) && (
            <div className="photos-previews">
              {imagesExistantes.map((src, i) => (
                <div key={`existante-${i}`} className="photo-thumb">
                  <ExternalImg src={src} alt={`Photo ${i + 1}`} />
                  <button type="button" className="photo-remove" onClick={() => removeImageExistante(i)} aria-label="Supprimer">✕</button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={`nouvelle-${i}`} className="photo-thumb">
                  <ExternalImg src={src} alt={`Nouvelle photo ${i + 1}`} />
                  <button type="button" className="photo-remove" onClick={() => removeNouvellePhoto(i)} aria-label="Supprimer">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modeRapide && (
        <button
          type="button"
          onClick={() => setModeRapide(false)}
          style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}
        >
          Voir tous les champs (description, caractéristiques…)
        </button>
      )}

      {/* En stock toggle */}
      <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />
      {!modeRapide && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={() => setEnStock(!enStock)} style={{
            width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: enStock ? '#16a34a' : '#d1d5db', transition: 'background .2s', position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: enStock ? 20 : 4,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', display: 'block',
            }} />
          </button>
          <span style={{ fontSize: 13, color: '#374151' }}>
            {enStock ? `✅ ${t('shop.inStock')}` : `❌ ${t('shop.outOfStock')}`}
          </span>
        </div>
      )}

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
        <SubmitButton label={produit ? `💾 ${t('shop.saveProductBtn')}` : `➕ ${t('shop.newProduct')}`} />
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
        }}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

// ── Hub Marketing & Visibilité de la boutique ──────────────────────────────────

function MarketingBoutique({
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

function CatalogueProduits({ boutique, planActif, prixPro, filtreInitial, userId: userIdProp }: { boutique: Boutique; planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null; prixPro: number; filtreInitial?: 'jamais_partage'; userId?: string }) {
  const { t, isRtl, formatNumber, formatPrice } = useTranslation()
  const userId = userIdProp || 'anonymous'
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | { creating: 'rapide' | 'detaille' } | { editing: Produit }>('list')
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec' | 'jamais_partage'>(filtreInitial ?? 'tous')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes')
  const [, startTransition] = useTransition()
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [stockInputVal, setStockInputVal] = useState<string>('')
  const [produitADupliquer, setProduitADupliquer] = useState<Produit | null>(null)
  const [dupNom, setDupNom] = useState<string>('')
  const [dupPrix, setDupPrix] = useState<string>('')
  const [dupStock, setDupStock] = useState<string>('')
  const [menuActionsOuvertId, setMenuActionsOuvertId] = useState<string | null>(null)
  const [partageModalData, setPartageModalData] = useState<{ produit: Produit; isNew?: boolean } | null>(null)
  const [selectedProdIds, setSelectedProdIds] = useState<Set<string>>(new Set())

  async function saveStock(produitId: string) {
    const val = Number(stockInputVal)
    if (isNaN(val) || val < 0) return
    startTransition(async () => {
      const res = await updateStock(boutique.id, produitId, val)
      if (res.error) {
        alert(res.error)
      } else {
        setEditingStockId(null)
        loadProduits()
      }
    })
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function loadProduits() {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutique.id)
      if (prods && Array.isArray(prods) && prods.length > 0) {
        setProduits(prods)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_pos_produits_${boutique.id}`, JSON.stringify(prods))
        }
        sauvegarderProduitsLocaux(prods, boutique.id, userId).catch(() => {})
      } else if (prods && Array.isArray(prods) && prods.length === 0 && typeof window !== 'undefined') {
        // Vérifier la connectivité réelle par un ping rapide
        const pingOk = await fetch('/api/ping', { cache: 'no-store', signal: AbortSignal.timeout(3000) }).then(r => r.ok).catch(() => false)
        if (pingOk) {
          // En ligne confirmé : la boutique est vraiment vide, vérifier le cache avant d'effacer
          const cachedExistants = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
          if (!cachedExistants || cachedExistants.length === 0) {
            setProduits([])
          } else {
            setProduits(cachedExistants)
          }
        } else {
          // Hors-ligne : restaurer depuis le cache local
          const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
          if (cached && cached.length > 0) {
            setProduits(cached)
          } else {
            const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
            if (localProds) {
              try {
                const parsed = JSON.parse(localProds)
                if (Array.isArray(parsed)) setProduits(parsed)
              } catch {}
            }
          }
        }
      } else {
        const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
        if (cached && cached.length > 0) {
          setProduits(cached)
        } else {
          const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
          if (localProds) {
            try {
              const parsed = JSON.parse(localProds)
              if (Array.isArray(parsed) && parsed.length > 0) setProduits(parsed)
              else setProduits([])
            } catch {
              setProduits([])
            }
          } else {
            setProduits([])
          }
        }
      }
    } catch {
      const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
      if (cached && cached.length > 0) {
        setProduits(cached)
      } else {
        const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
        if (localProds) {
          try {
            const parsed = JSON.parse(localProds)
            if (Array.isArray(parsed) && parsed.length > 0) setProduits(parsed)
            else setProduits([])
          } catch {
            setProduits([])
          }
        } else {
          setProduits([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProduits() }, [boutique.id])

  if (!planActif) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fcd34d' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⭐</span>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Catalogue disponible en Boutique Pro</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Ajoutez vos produits avec photos et prix. Vos clients peuvent parcourir votre catalogue directement sur Nopalou.
        </p>
        <Link href="/boutique/abonnement" style={{
          display: 'inline-block', background: '#C75B00', color: '#fff',
          padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700,
        }}>
          Passer en Pro — {prixPro.toLocaleString('fr-FR')} FCFA/mois
        </Link>
      </div>
    )
  }

  const quota = planActif === 'business' ? '∞' : '50'

  const categoriesDisponibles = Array.from(new Set(produits.map(p => p.categorie).filter(Boolean))) as string[]

  const produitsFiltres = produits.filter(p => {
    if (rechercheTexte.trim() && !p.nom.toLowerCase().includes(rechercheTexte.trim().toLowerCase())) return false
    if (filtreStatut === 'jamais_partage') { if (p.partage_le) return false }
    else if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) return false
    if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false
    return true
  })

  if (typeof mode === 'object' && ('creating' in mode || 'editing' in mode)) {
    const editing = 'editing' in mode ? mode.editing : undefined
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          boutiqueCat={boutique.categorie}
          produit={editing}
          modeInitial={'creating' in mode ? mode.creating : 'detaille'}
          onCancel={() => setMode('list')}
          onSuccess={(produitCree) => {
            setMode('list')
            setSuccessMsg(editing ? '✅ Produit modifié !' : '✅ Produit ajouté au catalogue !')
            loadProduits()
            if (!editing && produitCree) {
              setPartageModalData({ produit: produitCree, isNew: true })
            }
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {showBatchModal && (
        <BatchImportModal
          boutiqueId={boutique.id}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => loadProduits()}
        />
      )}

      {produitADupliquer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a', fontWeight: 800 }}>📄 Dupliquer le produit</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Personnalisez le nouveau produit avant de le créer.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Nom du produit</label>
                <input
                  type="text"
                  value={dupNom}
                  onChange={e => setDupNom(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                  placeholder="Ex: Sac de Ciment Sococim (Copie)"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Prix unitaire (FCFA)</label>
                  <input
                    type="number"
                    value={dupPrix}
                    onChange={e => setDupPrix(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                    placeholder="Ex: 3500"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Stock initial</label>
                  <input
                    type="number"
                    value={dupStock}
                    onChange={e => setDupStock(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                    placeholder="Ex: 10"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setProduitADupliquer(null)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!dupNom.trim()) return alert('Le nom est requis')
                  startTransition(async () => {
                    const res = await duplicateProduit(boutique.id, produitADupliquer.id, {
                      nom: dupNom,
                      prix: dupPrix !== '' ? Number(dupPrix) : undefined,
                      stock_quantite: dupStock !== '' ? Number(dupStock) : undefined
                    })
                    if (res.error) alert(res.error)
                    else {
                      setSuccessMsg('Produit dupliqué avec succès !')
                      setProduitADupliquer(null)
                      loadProduits()
                    }
                  })
                }}
                style={{ flex: 1.5, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                🚀 Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bq-catalogue-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} / {quota} max
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBatchModal(true)}
            className="bq-catalogue-btn"
            style={{
              background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            📦 Batch
          </button>
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            className="bq-catalogue-btn"
            style={{
              background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ⚡ Rapide
          </button>
          <button
            onClick={() => setMode({ creating: 'detaille' })}
            className="bq-catalogue-btn"
            style={{
              background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Détaillé
          </button>
        </div>
      </div>

      {produits.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={rechercheTexte}
            onChange={e => setRechercheTexte(e.target.value)}
            style={{ flex: '1 1 180px', padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value as typeof filtreStatut)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="synchronise">✓ Sur WhatsApp</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="echec">✗ Échec</option>
            <option value="jamais_partage">📢 Jamais partagés</option>
          </select>
          {categoriesDisponibles.length > 1 && (
            <select
              value={filtreCategorie}
              onChange={e => setFiltreCategorie(e.target.value)}
              style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
            >
              <option value="toutes">Toutes les catégories</option>
              {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 14, marginBottom: 12, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {deleteError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, marginBottom: 12 }}>
          {deleteError}
        </div>
      )}

      {/* ── BARRE D'ACTIONS GROUPÉES DE SÉLECTION MULTIPLE ── */}
      {selectedProdIds.size > 0 && (
        <div
          style={{
            position: 'sticky',
            top: 10,
            zIndex: 30,
            background: 'linear-gradient(135deg, #1C2B4A 0%, #0F1D35 100%)',
            color: '#ffffff',
            borderRadius: 14,
            padding: '12px 18px',
            marginBottom: 16,
            boxShadow: '0 10px 25px rgba(15,29,53,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛍️</span>
            <span style={{ fontSize: 13.5, fontWeight: 800 }}>
              {selectedProdIds.size} produit{selectedProdIds.size > 1 ? 's' : ''} sélectionné{selectedProdIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const prods = produits.filter(p => selectedProdIds.has(p.id))
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
                const contact = boutique.whatsapp || boutique.telephone || ''
                const msg = `🛍️ *Découvrez notre sélection chez ${boutique.nom} !*\n\n` +
                  prods.map((p, i) => `${i + 1}. *${p.nom}* — ${p.prix ? fcfa(p.prix) : 'Prix sur demande'}\n👉 ${siteUrl}/boutiques/${boutique.slug || boutique.id}/produits/${p.id}`).join('\n\n') +
                  `\n\n🚚 Livraison disponible à ${boutique.ville || 'Dakar'}\n${contact ? `💬 Commandez directement au ${contact} !` : ''}`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              style={{
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageCircle size={15} />
              <span>Partager sur WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const prods = produits.filter(p => selectedProdIds.has(p.id))
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
                const msg = `🛍️ *Sélection ${boutique.nom}* :\n\n` +
                  prods.map((p, i) => `• ${p.nom} : ${p.prix ? fcfa(p.prix) : 'Prix sur demande'} (${siteUrl}/boutiques/${boutique.slug || boutique.id}/produits/${p.id})`).join('\n')
                navigator.clipboard.writeText(msg)
                alert('Liste copiée dans le presse-papier !')
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Copy size={14} />
            </button>

            <button
              type="button"
              onClick={() => setSelectedProdIds(new Set())}
              style={{
                background: 'none',
                color: '#94a3b8',
                border: 'none',
                padding: '7px 8px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : produits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>📦</span>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>Aucun produit dans votre catalogue.</p>
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Ajouter mon premier produit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produitsFiltres.map(p => (
            <div key={p.id} className="bq-produit-card" style={{
              background: '#ffffff', border: selectedProdIds.has(p.id) ? '1.5px solid #0284c7' : '1px solid #e2e8f0', borderRadius: 14,
              padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.15s ease'
            }}>
              {/* Ligne Supérieure : Checkbox + Image + Nom + Prix + Badges */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Case à cocher pour partage groupé */}
                <div style={{ display: 'flex', alignItems: 'center', height: 60 }}>
                  <input
                    type="checkbox"
                    checked={selectedProdIds.has(p.id)}
                    onChange={() => {
                      const next = new Set(selectedProdIds)
                      if (next.has(p.id)) next.delete(p.id)
                      else next.add(p.id)
                      setSelectedProdIds(next)
                    }}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0284c7' }}
                    title="Sélectionner pour le partage groupé"
                  />
                </div>

                {/* Image */}
                <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ExternalImg src={p.images?.[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Informations */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#0f172a', lineHeight: '1.25' }}>{p.nom}</h4>
                    {p.prix && <span style={{ fontSize: 15, color: '#C75B00', fontWeight: 900, whiteSpace: 'nowrap' }}>{fcfa(p.prix)}</span>}
                  </div>

                  {/* Rangée des Badges (Stock, Code-Barres, WhatsApp) */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                    {/* Stock */}
                    {editingStockId === p.id ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <input
                          type="number"
                          value={stockInputVal}
                          onChange={e => setStockInputVal(e.target.value)}
                          style={{ width: 60, padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11, height: 22 }}
                          autoFocus
                        />
                        <button onClick={() => saveStock(p.id)} style={{ padding: '2px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>OK</button>
                        <button onClick={() => setEditingStockId(null)} style={{ padding: '2px 8px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                      </div>
                    ) : (
                      <span
                        onClick={(e) => { e.stopPropagation(); setEditingStockId(p.id); setStockInputVal(String(p.quantite_stock ?? p.stock_quantite ?? 0)) }}
                        style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: p.en_stock ? '#f0fdf4' : '#fef2f2', color: p.en_stock ? '#15803d' : '#dc2626', fontWeight: 800, cursor: 'pointer', border: p.en_stock ? '1px solid #bbf7d0' : '1px solid #fecaca' }}
                        title="Cliquez pour modifier le stock"
                      >
                        📦 {t('shop.stockQty')}: {formatNumber(p.quantite_stock ?? p.stock_quantite ?? 0)} ✏️
                      </span>
                    )}

                    {/* Code-barres EAN */}
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: (p as any).code_barre ? '#f0f9ff' : '#fff7ed', color: (p as any).code_barre ? '#0369a1' : '#c2410c', border: (p as any).code_barre ? '1px solid #bae6fd' : '1px solid #fed7aa' }}>
                      {(p as any).code_barre ? `🏷️ CB: ${(p as any).code_barre}` : '⚠️ Sans EAN'}
                    </span>

                    {/* WhatsApp */}
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                      }}
                      title="Actif sur le Chatbot & prêt au partage WhatsApp 1-Clic"
                    >
                      💬 WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Rangée d'Actions Inférieure (Propre, Épurée & 100% Responsive) */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 10, position: 'relative' }}>
                {/* Actions Principales (Modifier & Partager) */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setMode({ editing: p })}
                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    ✏️ {t('common.edit')}
                  </button>

                  <button
                    onClick={() => setPartageModalData({ produit: p, isNew: false })}
                    style={{
                      background: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 1px 3px rgba(37,211,102,0.3)',
                    }}
                    title="Partager ce produit (WhatsApp, Story HD, Réseaux)"
                  >
                    <MessageCircle size={14} />
                    <span>{t('common.share') || 'Partager'}</span>
                  </button>
                </div>

                {/* Menu Déroulant Actions Secondaires */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setMenuActionsOuvertId(menuActionsOuvertId === p.id ? null : p.id)}
                    style={{
                      background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8,
                      padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span>{t('shop.actionsMenu')}</span> ▾
                  </button>

                  {menuActionsOuvertId === p.id && (
                    <>
                      <div
                        onClick={() => setMenuActionsOuvertId(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                      />
                      <div className="bq-actions-dropdown" style={{
                        position: 'absolute', right: 0, left: 'auto', bottom: 'calc(100% + 6px)', background: '#ffffff', border: '1px solid #cbd5e1',
                        borderRadius: 10, padding: 6, zIndex: 9999, boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200, maxWidth: 'calc(100vw - 32px)'
                      }}>
                        <button
                          onClick={() => { setMenuActionsOuvertId(null); setMode({ editing: p }); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, textAlign: 'left', whiteSpace: 'nowrap' }}
                        >
                          🏷️ {t('shop.scanBarcodeModalTitle')}
                        </button>
                        <button
                          onClick={(e) => {
                            setMenuActionsOuvertId(null);
                            e.stopPropagation();
                            const ean = (p as any).code_barre || '2001234567891';
                            const svgBarcode = genererSVGCodeBarresEAN13(ean);
                            const printWin = window.open('', '_blank', 'width=480,height=400');
                            if (!printWin) return;
                            printWin.document.write(`
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Étiquette ${p.nom}</title>
                                <style>
                                  @page { size: 50mm 30mm; margin: 0; }
                                  body {
                                    font-family: Arial, sans-serif; margin: 0; padding: 4px 6px;
                                    text-align: center; width: 50mm; height: 30mm; box-sizing: border-box;
                                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                                  }
                                  .title { font-size: 11px; font-weight: 800; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 46mm; margin-bottom: 2px; }
                                  .price { font-size: 13px; font-weight: 900; color: #000; margin-bottom: 4px; }
                                  .barcode-num { font-family: monospace; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-top: 2px; }
                                  svg { display: block; margin: 0 auto; max-width: 44mm; height: auto; }
                                </style>
                              </head>
                              <body>
                                <div class="title">${p.nom}</div>
                                <div class="price">${p.prix ? `${new Intl.NumberFormat('fr-FR').format(p.prix)} FCFA` : ''}</div>
                                <div class="barcode-svg">${svgBarcode}</div>
                                <div class="barcode-num">${ean}</div>
                                <script>window.onload = () => { window.print(); window.close(); }</script>
                              </body>
                              </html>
                            `);
                            printWin.document.close();
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#0284c7', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, textAlign: 'left', whiteSpace: 'nowrap' }}
                        >
                          🖨️ {t('shop.printBarcodeLabels')}
                        </button>
                        <button
                          onClick={() => {
                            setMenuActionsOuvertId(null);
                            setProduitADupliquer(p);
                            setDupNom(`${p.nom} (Copie)`);
                            setDupPrix(p.prix?.toString() || '');
                            setDupStock(p.stock_quantite?.toString() || '');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, textAlign: 'left', whiteSpace: 'nowrap' }}
                        >
                          📄 {t('shop.duplicateProduct')}
                        </button>
                        <button
                          onClick={() => {
                            setMenuActionsOuvertId(null);
                            if (!confirm('Publier ce produit comme annonce classifiée ?')) return;
                            startTransition(async () => {
                              const res = await publierProduitAnnonce(boutique.id, p.id);
                              if (res.error) alert(res.error);
                              else if (res.besoin_paiement) alert(res.message);
                              else { setSuccessMsg(res.message || 'Publié avec succès en annonce !'); }
                            });
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#b45309', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, textAlign: 'left', whiteSpace: 'nowrap' }}
                        >
                          📢 {t('shop.publishAd')}
                        </button>
                        <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                        <button
                          onClick={() => {
                            setMenuActionsOuvertId(null);
                            if (!confirm('Supprimer ce produit ?')) return;
                            setDeleteError(null);
                            startTransition(async () => {
                              const res = await deleteProduit(boutique.id, p.id);
                              if (res.error) setDeleteError(res.error);
                              else { setSuccessMsg('Produit supprimé.'); loadProduits(); }
                            });
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 6, textAlign: 'left', whiteSpace: 'nowrap' }}
                        >
                          🗑️ {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALE DE PARTAGE PRODUIT 1-CLIC (100% MARQUE BLANCHE) ── */}
      {partageModalData && (
        <ModalPartageProduit
          isOpen={!!partageModalData}
          onClose={() => setPartageModalData(null)}
          produit={partageModalData.produit}
          boutique={boutique}
          isNewlyCreated={partageModalData.isNew}
        />
      )}
    </div>

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
                {planActif === 'business' && <span className="badge-premium" style={{ background: '#1e3a8a', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none' }}>💼 Business</span>}
                {planActif === 'pro'      && <span className="badge-premium" style={{ background: '#C75B00', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none' }}>⭐ Pro</span>}
                {(planActif === 'decouverte' || planActif === 'taf_taf') && <span className="badge-premium" style={{ background: '#22c55e', color: '#064e3b', fontSize: 10, padding: '2px 6px', border: 'none' }}>⚡ Taf Taf</span>}
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
              {boutique.actif !== false ? '🟢 Active' : '⚪ Inactive'}
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

        {/* Actions Financières et Principales (Bas de carte) */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/payer-sponsoring-boutique/${boutique.id}`} className="btn-premium" style={{ flex: 1, minWidth: 120, padding: '8px 12px', fontSize: 13, color: '#b45309', borderColor: '#fcd34d', backgroundColor: '#fffbeb', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
              ⭐ Mettre en avant
            </Link>
            <Link href="/boutique/abonnement" className="btn-premium" style={{ flex: 1, minWidth: 120, padding: '8px 12px', fontSize: 13, color: '#1e3a8a', borderColor: '#bfdbfe', backgroundColor: '#eff6ff', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
              📖 {t('shop.subscription')}
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {boutique.mode_fonctionnement !== 'pure_player' && (
              <a href="/boutique/caisse" className="btn-premium btn-premium-success" style={{ flex: 1, minWidth: 120, padding: '10px 16px', fontSize: 14, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }} onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}>
                <Monitor size={16} /> {t('shop.pos')}
              </a>
            )}
            <button onClick={onManage} className="btn-premium btn-premium-primary" style={{ flex: boutique.mode_fonctionnement !== 'pure_player' ? 1.5 : 1, minWidth: 140, padding: '10px 16px', fontSize: 14, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
              {t('shop.manageShop')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Vue de gestion d'une boutique — layout sidebar ────────────────────────────

function BoutiqueEquipe({ boutiqueId }: { boutiqueId: string }) {
  const [subTab, setSubTab] = useState<'admins' | 'caissiers'>('admins')
  const { t } = useTranslation()
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
        <button
          onClick={() => setSubTab('admins')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: subTab === 'admins' ? '2px solid #C75B00' : '1px solid #d1d5db',
            background: subTab === 'admins' ? '#fff7f0' : '#fff',
            color: subTab === 'admins' ? '#C75B00' : '#374151',
          }}
        >
          👥 {t('shop.admins')}
        </button>
        <button
          onClick={() => setSubTab('caissiers')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: subTab === 'caissiers' ? '2px solid #C75B00' : '1px solid #d1d5db',
            background: subTab === 'caissiers' ? '#fff7f0' : '#fff',
            color: subTab === 'caissiers' ? '#C75B00' : '#374151',
          }}
        >
          🏪 {t('shop.caissiers')}
        </button>
      </div>

      {subTab === 'admins' ? (
        <BoutiqueAdmins boutiqueId={boutiqueId} />
      ) : (
        <BoutiqueCaissiers boutiqueId={boutiqueId} />
      )}
    </div>
  )
}

type ManageTab = 'dashboard' | 'produits' | 'commandes' | 'carnet' | 'express' | 'compta' | 'analytics' | 'infos' | 'marketing' | 'equipe' | 'admins' | 'caissiers' | 'documents' | 'fournisseurs' | 'fiscalite' | 'journal' | 'developer'

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
  const { t, formatNumber } = useTranslation()
  const [produitsCount, setProduitsCount] = useState<number | null>(null)
  const [stockAlertsCount, setStockAlertsCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const cacheKey = `nopalou_offline_dash_counts_${boutique.id}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const { count, alerts } = JSON.parse(cached)
        if (typeof count === 'number') setProduitsCount(count)
        if (typeof alerts === 'number') setStockAlertsCount(alerts)
        setLoading(false)
      } catch (e) {}
    }

    getBoutiqueProduits(boutique.id)
      .then(produits => {
        if (!active) return
        const count = produits.length
        const alerts = produits.filter(p => !p.en_stock || ((p.quantite_stock ?? p.stock_quantite) !== null && (p.quantite_stock ?? p.stock_quantite)! <= 3)).length
        setProduitsCount(count)
        setStockAlertsCount(alerts)
        localStorage.setItem(cacheKey, JSON.stringify({ count, alerts }))
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [boutique.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Grille de statistiques clés — 4 colonnes Desktop / 2 colonnes Mobile */}
      <div className="bq-kpi-grid">
        <div className="bq-kpi-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(26,22,18,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.pendingOrdersCount')}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={16} style={{ color: 'var(--navy)' }} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: nbEnAttente > 0 ? 'var(--accent)' : 'var(--navy)' }}>{formatNumber(nbEnAttente)}</p>
          </div>
          <button onClick={() => onNavigate('commandes')} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: 8, textDecoration: 'underline', textAlign: 'left' }}>
            {t('shop.viewOrders')}
          </button>
        </div>

        <div className="bq-kpi-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(26,22,18,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.catalog')}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingBag size={16} style={{ color: 'var(--navy)' }} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--navy)' }}>{loading ? '...' : formatNumber(produitsCount ?? 0)}</p>
          </div>
          <button onClick={() => onNavigate('produits')} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: 8, textDecoration: 'underline', textAlign: 'left' }}>
            {t('shop.manageCatalogBtn')}
          </button>
        </div>

        <div className="bq-kpi-card" style={{ background: stockAlertsCount && stockAlertsCount > 0 ? '#fffbeb' : 'var(--card)', border: stockAlertsCount && stockAlertsCount > 0 ? '1px solid #fcd34d' : '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(26,22,18,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: stockAlertsCount && stockAlertsCount > 0 ? '#b45309' : 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.stockAlerts')}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: stockAlertsCount && stockAlertsCount > 0 ? '#fef3c7' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={16} style={{ color: stockAlertsCount && stockAlertsCount > 0 ? '#b45309' : 'var(--navy)' }} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: stockAlertsCount && stockAlertsCount > 0 ? '#b45309' : 'var(--navy)' }}>{loading ? '...' : formatNumber(stockAlertsCount ?? 0)}</p>
          </div>
          <button onClick={() => onNavigate('fournisseurs')} style={{ background: 'none', border: 'none', color: stockAlertsCount && stockAlertsCount > 0 ? '#b45309' : 'var(--navy)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: 8, textDecoration: 'underline', textAlign: 'left' }}>
            {t('shop.restockBtn')}
          </button>
        </div>

        <div className="bq-kpi-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(26,22,18,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.shopTierTitle')}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Star size={16} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: planActif === 'business' ? 'var(--navy)' : planActif === 'pro' ? 'var(--accent)' : planActif === 'decouverte' || planActif === 'taf_taf' ? 'var(--price)' : 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {planActif === 'business' ? 'Business' : planActif === 'pro' ? 'Pro' : planActif === 'decouverte' || planActif === 'taf_taf' ? 'Taf Taf' : 'Gratuit'}
            </p>
          </div>
          <Link href="/boutique/abonnement" style={{ color: 'var(--navy)', fontSize: 11.5, fontWeight: 700, textDecoration: 'underline', display: 'inline-block', marginTop: 8 }}>
            {t('shop.manageTierBtn')}
          </Link>
        </div>
      </div>

      {/* Raccourcis d'action rapide — Grille fluide 2 colonnes sans conteneur lourd */}
      <div className="bq-actions-container" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, boxShadow: '0 4px 16px rgba(26,22,18,0.03)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 900, color: 'var(--navy)', letterSpacing: '-0.01em' }}>⚡ {t('shop.quickActions')}</h3>
        <div className="bq-actions-grid">
          
          <button
            onClick={() => onNavigate('compta', 'express')}
            className="bq-action-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', WebkitFontSmoothing: 'antialiased',
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)', transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={19} style={{ color: 'var(--price)' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 12.5, color: 'var(--text1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickSalesExpenses')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickSalesExpensesDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('carnet')}
            className="bq-action-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', WebkitFontSmoothing: 'antialiased',
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)', transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={19} style={{ color: 'var(--red)' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 12.5, color: 'var(--text1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickDebtBook')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickDebtBookDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('produits')}
            className="bq-action-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', WebkitFontSmoothing: 'antialiased',
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)', transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PlusCircle size={19} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 12.5, color: 'var(--text1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.newProduct')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Photos, prix & détails</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="bq-action-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', WebkitFontSmoothing: 'antialiased',
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)', transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={19} style={{ color: 'var(--navy)' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 12.5, color: 'var(--text1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.documents')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Document client PDF</p>
            </div>
          </button>

          {boutique.mode_fonctionnement !== 'pure_player' && (
            <a
              href="/boutique/caisse"
              className="bq-action-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)',
                textDecoration: 'none', WebkitFontSmoothing: 'antialiased',
                boxShadow: '0 2px 6px rgba(26,22,18,0.03)', transition: 'all 0.15s ease',
              }}
              onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingCart size={19} style={{ color: 'var(--navy)' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 12.5, color: 'var(--text1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickPos')}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickPosDesc')}</p>
              </div>
            </a>
          )}

          <button
            onClick={() => onOpenQrModal ? onOpenQrModal() : onNavigate('marketing')}
            className="bq-action-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 12, background: 'var(--card)', border: '1.5px solid var(--border)',
              cursor: 'pointer', textAlign: 'left', WebkitFontSmoothing: 'antialiased',
              boxShadow: '0 2px 6px rgba(26,22,18,0.03)', transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Share2 size={19} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 12.5, color: 'var(--text1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickQr')}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('shop.quickQrDesc')}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

interface NavItem {
  key: ManageTab
  icon: string
  label: string
  minPlan?: 'pro' | 'business'
}

interface NavGroup {
  icon: string
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
}: {
  navGroups: NavGroup[]
  activeTab: ManageTab
  onSetTab: (tab: ManageTab) => void
  isAllowed: (minPlan?: 'pro' | 'business') => boolean
  nbEnAttente: number
  formatNumber: (n: number) => string
  sheetTitle: string
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Trouver l'item actif
  const activeItem = navGroups.flatMap(g => g.items).find(i => i.key === activeTab)
  const currentIcon = activeItem?.icon || '🏠'
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
          onClick={onBack}
          aria-label="Retour aux boutiques"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="mobile-nav-compact-current">
          <span className="mobile-nav-compact-current-icon">{currentIcon}</span>
          <span className="mobile-nav-compact-current-label">{currentLabel}</span>
          {nbEnAttente > 0 && (
            <span className="mobile-bs-item-badge mobile-bs-item-badge--count" style={{ fontSize: 10, padding: '1px 6px' }}>
              {formatNumber(nbEnAttente)}
            </span>
          )}
        </div>

        <button
          type="button"
          className="mobile-nav-compact-toggle"
          onClick={openSheet}
          aria-label="Ouvrir la navigation"
        >
          ☰
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
              <span className="mobile-bs-title">🏪 {sheetTitle}</span>
              <button type="button" className="mobile-bs-close" onClick={closeSheet} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="mobile-bs-body">
              {navGroups.map((group, gIdx) => {
                const hasActive = group.items.some(i => i.key === activeTab)
                return (
                  <div key={gIdx} className={`mobile-bs-group${hasActive ? ' mobile-bs-group--active' : ''}`}>
                    <div className="mobile-bs-group-title">
                      <span className="mobile-bs-group-title-icon">{group.icon}</span>
                      <span>{group.title}</span>
                    </div>
                    <div className="mobile-bs-group-items">
                      {group.items.map(item => {
                        const allowed = isAllowed(item.minPlan)
                        const isActive = activeTab === item.key
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
                            <span className="mobile-bs-item-icon">{item.icon}</span>
                            <span className="mobile-bs-item-label">{item.label}</span>
                            {!allowed && (
                              <span className={`mobile-bs-item-badge ${item.minPlan === 'business' ? 'mobile-bs-item-badge--lock-business' : 'mobile-bs-item-badge--lock'}`}>
                                🔒 {item.minPlan === 'business' ? 'Business' : 'Pro'}
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
            </div>

            <div className="mobile-bs-footer">
              <a
                href="/boutique/caisse"
                className="mobile-bs-footer-link"
                style={{ background: '#F0FDF4', color: '#16a34a', border: '1px solid #BBF7D0' }}
                onClick={closeSheet}
              >
                <span>🛒</span>
                <span>{t('caisse.posTitle') || 'Caisse POS'}</span>
              </a>
              <a
                href="/compte"
                className="mobile-bs-footer-link"
                style={{ background: '#F1F5F9', color: '#1e3a5f', border: '1px solid #E2E8F0' }}
                onClick={closeSheet}
              >
                <span>👤</span>
                <span>{t('shop.merchantAccount')}</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BoutiqueManage({ boutique, planActif, onBack, onEdit, prixPro, initialTab: initialTabProp }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
  initialTab?: string
}) {
  const { t, formatNumber } = useTranslation()
  const validTabs: ManageTab[] = ['dashboard','produits','commandes','carnet','express','compta','analytics','infos','marketing','equipe','admins','caissiers','documents','fournisseurs','fiscalite','journal','developer']
  const resolvedInitialTab: ManageTab = validTabs.includes(initialTabProp as ManageTab) ? (initialTabProp as ManageTab) : 'dashboard'

  const NAV_GROUPS: NavGroup[] = [
    {
      icon: '🛒',
      title: t('shop.navGroupSalesClients'),
      items: [
        { key: 'dashboard',   icon: '🏠', label: t('shop.overview') },
        { key: 'commandes',   icon: '📋', label: t('shop.orders') },
        { key: 'carnet',      icon: '📒', label: t('shop.debts') },
        { key: 'documents',   icon: '📄', label: t('shop.documents'), minPlan: 'pro' },
      ],
    },
    {
      icon: '📦',
      title: t('shop.navGroupCatalogStock'),
      items: [
        { key: 'produits',     icon: '🛍️', label: t('shop.catalog') },
        { key: 'fournisseurs', icon: '📦', label: t('shop.suppliers'), minPlan: 'pro' },
      ],
    },
    {
      icon: '💰',
      title: t('shop.navGroupFinanceReports'),
      items: [
        { key: 'express',     icon: '⚡', label: t('shop.saisieExpress') || 'Saisie Express', minPlan: 'pro' },
        { key: 'compta',      icon: '💰', label: t('shop.accounting'), minPlan: 'pro' },
        { key: 'fiscalite',   icon: '⚖️', label: t('shop.taxSettings'), minPlan: 'pro' },
        { key: 'analytics',   icon: '📊', label: t('shop.analytics'), minPlan: 'pro' },
      ],
    },
    {
      icon: '⚙️',
      title: t('shop.navGroupSettingsTeam'),
      items: [
        { key: 'equipe',      icon: '👥', label: t('shop.team'), minPlan: 'business' },
        { key: 'journal',     icon: '📜', label: t('shop.auditLog'), minPlan: 'business' },
        { key: 'developer',   icon: '🔌', label: t('shop.developer'), minPlan: 'business' },
        { key: 'marketing',   icon: '📣', label: t('shop.marketing') },
        { key: 'infos',       icon: '⚙️', label: t('shop.settings') },
      ],
    },
  ]

  const [tab, setTab] = useState<ManageTab>(resolvedInitialTab)
  const [subTabCompta, setSubTabCompta] = useState<'dashboard' | 'express' | 'ventes' | 'depenses'>('express')
  const [showQrModal, setShowQrModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleNavigateFromDashboard = (targetTab: ManageTab, subTab?: string) => {
    if (targetTab === 'compta') {
      setSubTabCompta(subTab === 'dashboard' ? 'dashboard' : 'express')
    }
    setTab(targetTab)
  }

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
  }, [tab])

  const [filtreProduitsMarketing, setFiltreProduitsMarketing] = useState<'jamais_partage' | undefined>(undefined)
  const [nbEnAttente, setNbEnAttente] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()
  const planColor = planActif === 'business' ? '#1e3a5f' : planActif === 'pro' ? '#C75B00' : planActif === 'decouverte' || planActif === 'taf_taf' ? '#16a34a' : '#6b7280'
  const planLabel = planActif === 'business' ? '💼 Business' : planActif === 'pro' ? '⭐ Pro' : planActif === 'decouverte' || planActif === 'taf_taf' ? '⚡ Taf Taf' : 'Gratuit'

  const isAllowed = (minPlan?: 'pro' | 'business') => {
    if (!minPlan) return true
    if (planActif === 'business') return true
    if (minPlan === 'pro' && planActif === 'pro') return true
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
          setToast(`🛒 ${diff} nouvelle${diff > 1 ? 's' : ''} commande${diff > 1 ? 's' : ''} en attente !`)
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

  const tabInfoMap: Record<ManageTab, { title: string; icon: string; desc: string }> = {
    dashboard:   { icon: '🏠', title: t('shop.overview'), desc: t('shop.overviewDesc') },
    produits:    { icon: '🛍️', title: t('shop.catalog'), desc: t('shop.catalogDesc') },
    commandes:   { icon: '📋', title: t('shop.orders'), desc: t('shop.ordersDesc') },
    carnet:      { icon: '📒', title: t('shop.debts'), desc: t('shop.debtsDesc') },
    express:     { icon: '⚡', title: t('shop.saisieExpress') || 'Saisie Express', desc: t('shop.saisieExpressDesc') || 'Enregistrement ultra-rapide des ventes et dépenses du jour avec scan OCR.' },
    compta:      { icon: '💰', title: t('shop.accounting'), desc: t('shop.accountingDesc') },
    analytics:   { icon: '📊', title: t('shop.analytics'), desc: t('shop.analyticsDesc') },
    infos:       { icon: '⚙️', title: t('shop.settings'), desc: t('shop.settingsDesc') },
    marketing:   { icon: '📣', title: t('shop.marketing'), desc: t('shop.marketingDesc') },
    equipe:      { icon: '👥', title: t('shop.team'), desc: t('shop.teamDesc') },
    admins:      { icon: '👥', title: t('shop.admins'), desc: t('shop.adminsDesc') },
    caissiers:   { icon: '🏪', title: t('shop.caissiers'), desc: t('shop.caissiersDesc') },
    documents:   { icon: '📄', title: t('shop.documents'), desc: t('shop.documentsDesc') },
    fournisseurs: { icon: '📦', title: t('shop.suppliers'), desc: t('shop.suppliersDesc') },
    fiscalite:   { icon: '⚖️', title: t('shop.taxSettings'), desc: t('shop.taxSettingsDesc') },
    journal:     { icon: '📜', title: t('shop.auditLog'), desc: t('shop.auditLogDesc') },
    developer:   { icon: '🔌', title: t('shop.developer'), desc: t('shop.developerDesc') },
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
        <span style={{ fontSize: 24 }}>🛒</span>
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
              onClick={onBack}
              className="bq-back-btn"
              style={{
                background: 'var(--pos-surface2, #FAF8F5)',
                border: '1.5px solid var(--pos-border, #E8DDD2)',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--pos-navy, #1C2B4A)',
                fontWeight: 800,
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(26,22,18,0.05)',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #C75B00)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>{t('shop.myAccountBack')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="bq-sidebar-close-btn"
              title="Fermer tout le menu pour agrandir l'espace de travail"
              style={{
                background: 'var(--pos-surface2, #FAF8F5)',
                border: '1.5px solid var(--pos-border, #E8DDD2)',
                borderRadius: 10,
                padding: '6px 10px',
                cursor: 'pointer',
                color: 'var(--pos-navy, #1C2B4A)',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 1px 3px rgba(26,22,18,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>✕</span>
              <span>{t('shop.closeMenu') || 'Fermer le menu'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {boutique.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={boutique.logo_url}
                alt={boutique.nom}
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 12, flexShrink: 0, boxShadow: '0 3px 10px rgba(26,22,18,0.12)', border: '1.5px solid #ffffff' }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 900,
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(199, 91, 0, 0.28)',
                  letterSpacing: '-0.02em',
                }}
              >
                {boutique.nom ? boutique.nom.slice(0, 2).toUpperCase() : 'NP'}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>
                {boutique.nom}
              </p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="npl-btn npl-btn-secondary npl-btn-sm"
                  style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                >
                  <span>📱</span>
                  <span>QR & Vitrine</span>
                </button>
                {planActif && (
                  <span className={planActif === 'business' ? 'npl-badge npl-badge-success' : planActif === 'pro' ? 'npl-badge npl-badge-brand' : 'npl-badge npl-badge-neutral'} style={{ fontSize: 10, padding: '2px 6px' }}>
                    <span className="npl-badge-dot" />
                    <span>{planActif.toUpperCase()}</span>
                  </span>
                )}
              </div>
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
                  background: hasActiveItem ? 'linear-gradient(135deg, #FFF9F5 0%, #FFF3E8 100%)' : '#FAF8F5',
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
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{group.icon}</span>
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
                    color: hasActiveItem ? '#9A3412' : '#334155',
                  }}>
                    {formatNumber(group.items.length)}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </button>

              <div style={{
                display: isExpanded ? 'flex' : 'none',
                flexDirection: 'column',
                gap: 2,
                marginTop: 4,
                paddingLeft: 6,
                borderLeft: hasActiveItem ? '2.5px solid var(--accent, #C75B00)' : '2px solid #E8DDD2',
                marginLeft: 8,
                animation: 'fadeSlideDown 0.15s ease-out',
              }}>
                {group.items.map(item => {
                  const allowed = isAllowed(item.minPlan)
                  const isActive = tab === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
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
                        color: isActive ? 'var(--accent, #C75B00)' : '#1F2937',
                        background: isActive ? '#FFF3E8' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.12s, color 0.12s',
                      }}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ whiteSpace: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                      {!allowed && (
                        <span style={{ fontSize: 9, background: item.minPlan === 'business' ? '#1e3a5f' : '#C75B00', color: '#fff', padding: '2px 5px', borderRadius: 4, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' }}>
                          🔒 {item.minPlan === 'business' ? 'Business' : 'Pro'}
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

        {/* Nav Mobile — Bottom-Sheet (remplace les 2 niveaux de pills) */}
        <nav className="bq-nav-mobile" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          {/* Ancien 2 niveaux masqué par CSS */}
        </nav>

        {/* Bottom-Sheet Mobile Navigation — Boutique */}
        <BoutiqueMobileBottomSheet
          navGroups={NAV_GROUPS}
          activeTab={tab}
          onSetTab={setTab}
          isAllowed={isAllowed}
          nbEnAttente={nbEnAttente}
          formatNumber={formatNumber}
          sheetTitle={boutique.nom}
          onBack={onBack}
        />

        {/* Liens rapides (Desktop seulement) */}
        <div className="bq-sidebar-quick-links" style={{ padding: '12px 8px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {boutique.mode_fonctionnement === 'pure_player' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 12, color: '#C75B00', borderRadius: 6, fontWeight: 800, background: '#fff7ed', border: '1px solid #ffedd5' }}>
              <span>{t('shop.purePlayerMode')}</span>
            </div>
          ) : isAllowed('pro') ? (
            <a href="/boutique/caisse"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, color: '#16a34a', textDecoration: 'none', borderRadius: 6, fontWeight: 700, background: '#f0fdf4' }}
              onClick={() => typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)}
            >
              <span>{t('shop.posPhysicalLink')}</span>
            </a>
          ) : (
            <a href="/boutique/abonnement"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, color: '#475569', textDecoration: 'none', borderRadius: 6, fontWeight: 700, background: '#f8fafc', border: '1px dashed #cbd5e1' }}
              title="La Caisse POS (Physique) nécessite la formule Pro ou Business"
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('caisse.posTitle')}</span>
              <span style={{ fontSize: 9, background: '#C75B00', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 4 }}>
                🔒 Pro
              </span>
            </a>
          )}
          <a href="/guide-utilisation" target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: '#C75B00', textDecoration: 'none', borderRadius: 6, fontWeight: 750, background: '#fff7ed', border: '1px solid #ffedd5' }}>
            <span>📖 Guide d&apos;utilisation</span>
          </a>
          <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: '#6b7280', textDecoration: 'none', borderRadius: 6 }}>
            {t('shop.viewPublicShopLink')}
          </a>
          <a href="/compte"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: '#1e3a5f', textDecoration: 'none', borderRadius: 6, fontWeight: 700, background: '#f1f5f9' }}>
            {t('shop.merchantAccount')}
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

        {/* Titre de section & Statut Visibilité Boutique */}
        <div className="bq-main-tab-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 20, margin: 0, color: '#111', fontWeight: 900 }}>
              {currentTabInfo.icon} {currentTabInfo.title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{currentTabInfo.desc}</p>
          </div>

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
                if (res.ok) {
                  router.refresh()
                } else {
                  alert('Erreur lors de la modification du statut.')
                }
              } catch (e) {
                alert('Erreur réseau')
              }
            }}
            title={boutique.actif !== false ? 'Cliquez pour désactiver et masquer votre boutique du catalogue public' : 'Cliquez pour réactiver votre boutique'}
            style={{
              background: boutique.actif !== false ? '#F0FDF4' : '#FFF1F2',
              border: `1.5px solid ${boutique.actif !== false ? '#BBF7D0' : '#FECDD3'}`,
              color: boutique.actif !== false ? '#166534' : '#991B1B',
              fontSize: 12.5,
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(26,22,18,0.04)'
            }}
          >
            {boutique.actif !== false ? (
              <>
                <CheckCircle2 size={15} style={{ color: '#166534' }} />
                <span>{t('shop.shopActive')}</span>
              </>
            ) : (
              <>
                <XCircle size={15} style={{ color: '#991B1B' }} />
                <span>{t('shop.shopInactive')}</span>
              </>
            )}
          </button>
        </div>

        {!tabAllowed ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '40px 24px', textAlign: 'center', maxWidth: 560, margin: '40px auto', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              {t('shop.featureLockedTitle', { plan: currentNavItem?.minPlan === 'business' ? 'Business' : 'Pro' })}
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {currentNavItem?.minPlan === 'business' 
                ? t('shop.featureLockedDesc')
                : t('shop.featureLockedDesc')}
            </p>
            <a 
              href="/boutique/abonnement"
              style={{ display: 'inline-block', background: currentNavItem?.minPlan === 'business' ? '#1e3a5f' : '#C75B00', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
            >
              {t('shop.upgradePlanBtn')}
            </a>
          </div>
        ) : (
          <>
            {tab === 'dashboard'   && <BoutiqueDashboard boutique={boutique} planActif={planActif} nbEnAttente={nbEnAttente} onNavigate={handleNavigateFromDashboard} />}
            {tab === 'produits'    && <CatalogueProduits boutique={boutique} planActif={planActif} prixPro={prixPro} filtreInitial={filtreProduitsMarketing} />}
            {tab === 'commandes'   && <Commandes boutiqueId={boutique.id} />}
            {tab === 'carnet'      && <CarnetDettes boutique={boutique} planActif={planActif} />}
            {tab === 'express'     && <Comptabilite boutiqueId={boutique.id} boutiqueNom={boutique.nom} initialTab="express" />}
            {tab === 'compta'      && <Comptabilite boutiqueId={boutique.id} boutiqueNom={boutique.nom} initialTab={subTabCompta === 'express' ? 'bilan' : (subTabCompta as any)} />}
            {tab === 'analytics'   && <AnalyticsClient boutiques={[{ id: boutique.id, nom: boutique.nom }]} />}
            {tab === 'infos'       && (
              <div style={{ maxWidth: 580 }}>
                <BoutiqueForm boutique={boutique} onCancel={onBack} onSuccess={() => router.refresh()} />
              </div>
            )}
            {tab === 'marketing'   && <MarketingBoutique boutique={boutique} onVoirJamaisPartages={() => { setFiltreProduitsMarketing('jamais_partage'); setTab('produits') }} onOpenQrModal={() => setShowQrModal(true)} onNavigate={(t) => setTab(t)} planActif={planActif} />}
            {tab === 'equipe'      && <BoutiqueEquipe boutiqueId={boutique.id} />}
            {tab === 'admins'      && <BoutiqueAdmins boutiqueId={boutique.id} />}
            {tab === 'caissiers'   && <BoutiqueCaissiers boutiqueId={boutique.id} />}
            {tab === 'documents'   && <GestionDocuments boutiqueId={boutique.id} />}
            {tab === 'fournisseurs' && <GestionFournisseurs boutiqueId={boutique.id} />}
            {tab === 'fiscalite'   && <ParametresFiscalite boutique={boutique} onUpdate={() => router.refresh()} />}
            {tab === 'journal'     && <BoutiqueLogs boutiqueId={boutique.id} />}
            {tab === 'developer'   && <PortailDeveloppeurBoutique boutiqueId={boutique.id} planActif={planActif || 'decouverte'} />}
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
        } catch (e) {}
      }
    }
  }, [boutiques])

  const searchParams = useSearchParams()
  const manageId = searchParams.get('manage') || searchParams.get('id')
  const tabParam = searchParams.get('tab')
  const lockedParam = searchParams.get('locked')

  useEffect(() => {
    const listToSearch = boutiquesList.length > 0 ? boutiquesList : boutiques
    
    setMode(prevMode => {
      // 1. Si on gère déjà une boutique manuellement
      if (typeof prevMode === 'object' && 'managing' in prevMode) {
        // Rafraîchir les données de la boutique active (si modifiées par le réseau/cache)
        const updatedTarget = listToSearch.find(b => b.id === prevMode.managing.id)
        if (updatedTarget && updatedTarget !== prevMode.managing) {
          return { managing: updatedTarget }
        }
        return prevMode // On ne touche à rien
      }

      // 2. Si on n'est pas encore en mode 'managing', on lit l'URL
      if (manageId && listToSearch.length > 0) {
        const targetBoutique = listToSearch.find(b => b.id === manageId || b.slug === manageId)
        if (targetBoutique) return { managing: targetBoutique }
      } else if ((tabParam || lockedParam) && listToSearch.length > 0) {
        return { managing: listToSearch[0] }
      }
      
      return prevMode
    })
  }, [manageId, tabParam, lockedParam, boutiquesList, boutiques])

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
            console.warn("Erreur préchargement background pour boutique", b.id, e);
          }
        });
      }, 1200);

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
          planActif={planActifEffectif ?? null}
          initialTab={tabParam ?? undefined}
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
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Mes Boutiques
            </h1>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              padding: '3px 10px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
              {boutiques.length} / 3 autorisée{boutiques.length > 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
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
            border: '1.5px solid #cbd5e1',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}>
            <Monitor size={16} style={{ color: '#0f172a' }} />
            <span>{t('shop.openPosBtn')}</span>
          </Link>

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
          <span style={{ fontSize: 32, flexShrink: 0 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#92400e' }}>{t('shop.proBannerTitle')}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b45309' }}>{t('shop.proBannerDesc')} — {prixPro.toLocaleString('fr-FR')} FCFA/mois</p>
          </div>
          <span style={{ color: '#C75B00', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{t('shop.viewPlans')}</span>
        </Link>
      )}

      {boutiquesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏪</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{t('shop.createShopPrompt')}</p>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>{t('shop.createShopDesc')}</p>
          <button onClick={() => setMode('create')} style={{
            padding: '12px 28px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
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
          <span>📡</span> Mode Hors-Ligne (Données en cache)
        </div>
      )}
    </main>
  )
}
