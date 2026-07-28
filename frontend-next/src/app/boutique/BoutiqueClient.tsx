'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit, marquerProduitPartage, publierProduitAnnonce, getBoutiqueProduits, updateStock, duplicateProduit } from './actions'
import Comptabilite from './Comptabilite'
import Commandes from './Commandes'
import AnalyticsClient from './analytics/AnalyticsClient'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import { fcfa, lienBoutiqueWhatsapp } from '@/lib/format'
import type { ActionState } from '@/lib/backend-fetch'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
import BoutonPartager from '@/components/BoutonPartager'
import BatchImportModal from './BatchImportModal'
import BoutiqueAdmins from './BoutiqueAdmins'
import BoutiqueCaissiers from './BoutiqueCaissiers'
import { Store, PlusCircle, Monitor, Settings, Edit, Eye, Trash2, ArrowLeft, MapPin, Tag, Phone, Share2 } from 'lucide-react'

import { CATEGORIES, PRODUIT_CATEGORIES } from '@/lib/categories'

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

type TypeVarianteId = 'couleur' | 'taille' | 'pointure' | 'stockage' | 'capacite' | 'autre'

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

export const CHAMP_VERS_TYPE_VARIANTE: Record<'taille' | 'couleur' | 'stockage', TypeVarianteId> = {
  taille: 'taille',
  couleur: 'couleur',
  stockage: 'stockage',
}

export function champVisibleSelonVariante(champ: 'taille' | 'couleur' | 'stockage', typesVarianteActifs: Set<TypeVarianteId>): boolean {
  return !typesVarianteActifs.has(CHAMP_VERS_TYPE_VARIANTE[champ])
}

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

export function CaracChips({ label, name, value, onChange, suggestions, allowAutre = true, required: req = false }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  suggestions: string[]; allowAutre?: boolean; required?: boolean
}) {
  const estSuggestion = suggestions.includes(value)
  const [modeAutre, setModeAutre] = useState(!!value && !estSuggestion)

  function choisir(val: string) {
    setModeAutre(false)
    onChange(name, value === val ? '' : val)
  }

  function activerAutre() {
    setModeAutre(true)
    onChange(name, '')
  }

  return (
    <div>
      <label style={labelStyle}>{label}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: modeAutre ? 8 : 0 }}>
        {suggestions.map(val => {
          const selectionnee = !modeAutre && value === val
          return (
            <button
              key={val} type="button" onClick={() => choisir(val)}
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
        {allowAutre && (
          <button
            type="button" onClick={activerAutre}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: modeAutre ? '2px solid #C75B00' : '1px dashed #d1d5db',
              background: modeAutre ? '#fff7f0' : '#fff',
              color: modeAutre ? '#C75B00' : '#374151',
            }}
          >
            Autre
          </button>
        )}
      </div>
      {allowAutre && modeAutre && (
        <input
          type="text" value={value} onChange={e => onChange(name, e.target.value)}
          style={inputStyle} placeholder="Autre valeur…"
        />
      )}
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

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 18, margin: 0 }}>
        {boutique ? 'Modifier la boutique' : 'Créer une boutique'}
      </h2>

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>
          {state.error}
        </div>
      )}

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={boutique.logo_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>Logo actuel</span>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Photo de couverture (max 5 Mo)</label>
          <input name="cover" type="file" accept="image/*" style={{ fontSize: 13 }} />
          {boutique?.cover_url && (
            <div style={{ marginTop: 6, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={boutique.cover_url} alt="" style={{ width: '100%', height: 50, objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <SubmitButton label={boutique ? 'Enregistrer' : 'Créer la boutique'} />
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'none', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, cursor: 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Formulaire produit ────────────────────────────────────────────────────────

// PRODUIT_CATEGORIES is imported from '@/lib/categories'

const NOMS_PAR_DEFAUT: Record<string, string> = {
  'smartphones':  'Smartphone — à modifier',
  'informatique': 'Article informatique — à modifier',
  'tv-electro':   'TV / Électroménager — à modifier',
  'mode':         'Article mode — à modifier',
  'maison':       'Article maison — à modifier',
  'auto-moto':    'Véhicule — à modifier',
  'jeux':         'Jeu / Console — à modifier',
  'alimentation': 'Produit alimentaire — à modifier',
  'beaute':       'Produit beauté — à modifier',
  'services':     'Service — à modifier',
  'autre':        'Produit — à modifier',
}

export function nomParDefautPourCategorie(categorie: string): string {
  return NOMS_PAR_DEFAUT[categorie] ?? 'Produit — à modifier'
}

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
  onSuccess: () => void
}) {
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

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  const hasCaracFields = cat && cat !== 'autre' && !modeRapide

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 16, margin: 0 }}>
        {produit ? 'Modifier le produit' : 'Ajouter un produit'}
      </h3>

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
          {state.error}
        </div>
      )}

      {/* Champs cachés pour caractéristiques + catégorie */}
      <input type="hidden" name="categorie" value={cat} />
      <input type="hidden" name="caracteristiques" value={JSON.stringify(carac)} />
      <input type="hidden" name="variantes" value={JSON.stringify(variantes.filter(v => v.nom.trim() && v.valeurs.length > 0))} />

      {/* Catégorie */}
      <div>
        <label style={labelStyle}>Catégorie du produit</label>
        <select
          value={cat}
          onChange={e => { setCat(e.target.value); setCarac({}) }}
          style={inputStyle}
        >
          <option value="">— Sélectionner une catégorie —</option>
          {PRODUIT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Nom */}
      {modeRapide ? (
        <input type="hidden" name="nom" value={nomParDefautPourCategorie(cat)} />
      ) : (
        <div>
          <label style={labelStyle}>Nom du produit <span style={{ color: '#dc2626' }}>*</span></label>
          <input name="nom" required maxLength={300} defaultValue={produit?.nom ?? (modeInitial === 'rapide' ? nomParDefautPourCategorie(cat) : undefined)} style={inputStyle} placeholder="Ex: iPhone 14 Pro 256 Go" />
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
          <label style={labelStyle}>Description</label>
          <textarea name="description" rows={3} defaultValue={produit?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Détails supplémentaires, accessoires inclus, garantie…" />
        </div>
      )}

      {/* Prix */}
      <div className={modeRapide ? '' : 'bq-form-grid-2'} style={modeRapide ? { display: 'grid' } : undefined}>
        <div>
          <label style={labelStyle}>Prix (FCFA) <span style={{ color: '#dc2626' }}>*</span></label>
          <input name="prix" type="number" min={0} required defaultValue={produit?.prix ?? ''} style={inputStyle} placeholder="Ex: 350 000" />
        </div>
        {!modeRapide && (
          <div>
            <label style={labelStyle}>Prix barré <span style={{ fontSize: 11, color: '#9ca3af' }}>(ancien prix)</span></label>
            <input name="prix_barre" type="number" min={0} defaultValue={produit?.prix_barre ?? ''} style={inputStyle} placeholder="Ex: 400 000" />
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <label style={labelStyle}>Photos du produit <span style={{ fontSize: 11, color: '#9ca3af' }}>(max 5, 5 Mo chacune)</span></label>
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
              <p>Cliquez pour ajouter des photos</p>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} />
                  <button type="button" className="photo-remove" onClick={() => removeImageExistante(i)} aria-label="Supprimer">✕</button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={`nouvelle-${i}`} className="photo-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Nouvelle photo ${i + 1}`} />
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
            {enStock ? '✅ En stock' : '❌ Rupture de stock'}
          </span>
        </div>
      )}

      {imagesExistantes.length === 0 && photos.length === 0 && (
        <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>Ajoutez au moins une photo.</p>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <SubmitButton label={produit ? 'Enregistrer' : 'Ajouter le produit'} disabled={imagesExistantes.length === 0 && photos.length === 0} />
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'none', border: '1px solid #d1d5db',
          borderRadius: 8, fontSize: 14, cursor: 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Marketing / partage de la boutique ────────────────────────────────────────

function MarketingBoutique({ boutique, onVoirJamaisPartages, planActif }: { boutique: Boutique; onVoirJamaisPartages: () => void; planActif: 'pro' | 'business' | null }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${boutique.slug || boutique.id}`
  const messageBoutique = `Découvrez ${boutique.nom} sur Nopalou !\n\n${lienBoutique}`
  const lienAssistant = lienBoutiqueWhatsapp(boutique.slug || boutique.id)
  const messageAssistant = `Découvrez ${boutique.nom} sur Nopalou et commandez directement sur WhatsApp !\n\n${lienAssistant}`

  const [nbJamaisPartages, setNbJamaisPartages] = useState<number | null>(null)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    let annule = false
    getBoutiqueProduits(boutique.id)
      .then(produits => {
        if (annule) return
        setNbJamaisPartages(produits.filter(p => !p.partage_le).length)
      })
      .catch(() => { if (!annule) setNbJamaisPartages(0) })
    return () => { annule = true }
  }, [boutique.id])

  return (
    <div>
      {nbJamaisPartages === null ? null : nbJamaisPartages > 0 ? (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 20 }}>📢</span>
          <p style={{ margin: 0, fontSize: 13, color: '#78350f', flex: 1, minWidth: 200 }}>
            <strong>{nbJamaisPartages} produit{nbJamaisPartages > 1 ? 's' : ''}</strong> n&apos;{nbJamaisPartages > 1 ? 'ont' : 'a'} jamais été partagé{nbJamaisPartages > 1 ? 's' : ''} — un partage régulier aide vos produits à être vus.
          </p>
          <button
            onClick={onVoirJamaisPartages}
            style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Voir ces produits →
          </button>
        </div>
      ) : (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <p style={{ margin: 0, fontSize: 13, color: '#166534' }}>
            Tous vos produits ont déjà été partagés au moins une fois.
          </p>
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px',
        marginBottom: 16,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {boutique.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={boutique.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 28 }}>🏪</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{boutique.nom}</p>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{lienBoutique}</p>
        </div>
        <BoutonPartager
          lien={lienBoutique}
          message={messageBoutique}
          lienVisuel={`/assets/boutique/${boutique.id}/story`}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px',
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28 }}>🤖</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Assistant WhatsApp de la boutique</p>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Ce lien ouvre directement votre catalogue dans l&apos;assistant Nopalou — vos clients peuvent chercher, voir vos produits et commander sans quitter WhatsApp.
          </p>
        </div>
        <BoutonPartager
          lien={lienAssistant}
          message={messageAssistant}
          lienVisuel={`/assets/boutique/${boutique.id}/story`}
        />
      </div>

      <div style={{
        marginTop: 16, padding: '16px 20px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Un visuel prêt à partager pour votre palier actuel ({planActif === 'business' ? 'Business' : planActif === 'pro' ? 'Pro' : 'Gratuit'}) :
        </p>
        <a
          href={`/assets/palier/${planActif ?? 'gratuit'}/carre`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px', background: '#1C2B4A', color: '#fff', borderRadius: 8,
            fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          🖼 Voir le visuel →
        </a>
      </div>
    </div>
  )
}

// ── Gestionnaire de catalogue produits ───────────────────────────────────────

function CatalogueProduits({ boutique, planActif, prixPro, filtreInitial }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number; filtreInitial?: 'jamais_partage' }) {
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
      const produits = await getBoutiqueProduits(boutique.id)
      setProduits(produits)
    } catch {
      setProduits([])
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
          onSuccess={() => {
            setMode('list')
            setSuccessMsg(editing ? '✅ Produit modifié !' : '✅ Produit ajouté !')
            loadProduits()
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} / {quota} max
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBatchModal(true)}
            style={{
              background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            📦 Ajout par Batch (Catalogue)
          </button>
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            style={{
              background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ⚡ Ajout rapide
          </button>
          <button
            onClick={() => setMode({ creating: 'detaille' })}
            style={{
              background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Ajout détaillé
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
            <div key={p.id} className="bq-produit-row">
              {/* Image */}
              <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.images?.[0]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.images[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24 }}>📦</span>
                }
              </div>
              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.nom}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                  {p.prix && <span style={{ fontSize: 13, color: '#C75B00', fontWeight: 700 }}>{fcfa(p.prix)}</span>}
                  {p.prix_barre && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{fcfa(p.prix_barre)}</span>}
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 20,
                    background: p.en_stock ? '#dcfce7' : '#fee2e2',
                    color: p.en_stock ? '#16a34a' : '#dc2626', fontWeight: 700,
                  }}>
                    {p.en_stock ? 'En stock' : 'Rupture'}
                  </span>

                  {editingStockId === p.id ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        value={stockInputVal}
                        onChange={e => setStockInputVal(e.target.value)}
                        style={{ width: 60, padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11, height: 20 }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveStock(p.id)}
                        style={{ padding: '2px 6px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditingStockId(null)}
                        style={{ padding: '2px 6px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingStockId(p.id)
                        setStockInputVal(String(p.stock_quantite ?? 0))
                      }}
                      style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer',
                        border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: 4
                      }}
                      title="Modifier la quantité en stock"
                    >
                      📦 Stock : {p.stock_quantite ?? 0} ✏️
                    </span>
                  )}
                  <span
                    title="Statut de synchronisation avec l'assistant et le catalogue WhatsApp Business"
                    style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                      background: p.whatsapp_sync_statut === 'synchronise' || !p.whatsapp_sync_statut ? '#dcfce7' : p.whatsapp_sync_statut === 'echec' ? '#fee2e2' : '#eff6ff',
                      color: p.whatsapp_sync_statut === 'synchronise' || !p.whatsapp_sync_statut ? '#166534' : p.whatsapp_sync_statut === 'echec' ? '#991b1b' : '#1d4ed8',
                      border: p.whatsapp_sync_statut === 'synchronise' || !p.whatsapp_sync_statut ? '1px solid #bbf7d0' : p.whatsapp_sync_statut === 'echec' ? '1px solid #fecaca' : '1px solid #bfdbfe',
                    }}
                  >
                    {p.whatsapp_sync_statut === 'echec' ? '❌ Échec WhatsApp' : p.whatsapp_sync_statut === 'en_attente' ? '⏳ Synchro WhatsApp' : '💬 Actif sur WhatsApp'}
                  </span>
                  {p.nom.endsWith('— à modifier') && (
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 20,
                      background: '#fef3c7', color: '#b45309', fontWeight: 700,
                    }}>
                      ✏️ À compléter
                    </span>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <button
                  onClick={() => setMode({ editing: p })}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (!confirm('Voulez-vous dupliquer ce produit ?')) return
                    startTransition(async () => {
                      const res = await duplicateProduit(boutique.id, p.id)
                      if (res.error) alert(res.error)
                      else {
                        setSuccessMsg('Produit dupliqué avec succès !')
                        loadProduits()
                      }
                    })
                  }}
                  style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  📄 Dupliquer
                </button>
                <BoutonPartager
                  lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  message={
                    p.prix_barre && p.prix && p.prix_barre > p.prix
                      ? `🔥 ${p.nom} en promo : ${fcfa(p.prix)} au lieu de ${fcfa(p.prix_barre)} !\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`
                      : `${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`
                  }
                  lienVisuel={`/assets/produit-boutique/${p.id}/story?boutiqueId=${boutique.id}`}
                  onPartage={() => { marquerProduitPartage(boutique.id, p.id).catch(() => {}) }}
                />

                <button
                  onClick={() => {
                    if (!confirm('Voulez-vous publier ce produit comme annonce classifiée ?')) return
                    startTransition(async () => {
                      const res = await publierProduitAnnonce(boutique.id, p.id)
                      if (res.error) alert(res.error)
                      else if (res.besoin_paiement) alert(res.message)
                      else { setSuccessMsg(res.message || 'Publié avec succès en annonce !') }
                    })
                  }}
                  title="Publier comme annonce"
                  style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  📢 Annonce
                </button>
                <button
                  onClick={() => {
                    if (!confirm('Supprimer ce produit ?')) return
                    setDeleteError(null)
                    startTransition(async () => {
                      const res = await deleteProduit(boutique.id, p.id)
                      if (res.error) setDeleteError(res.error)
                      else { setSuccessMsg('Produit supprimé.'); loadProduits() }
                    })
                  }}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Carte boutique ────────────────────────────────────────────────────────────

function BoutiqueCard({ boutique, planActif, onEdit, onDelete, onSponsoring, onPayerManuel, onManage }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onEdit: () => void
  onDelete: () => void
  onSponsoring?: () => void
  onPayerManuel?: () => void
  onManage: () => void
}) {
  const sponsorActif = boutique.sponsorise && boutique.sponsor_jusqu_au && new Date(boutique.sponsor_jusqu_au) > new Date()

  return (
    <div className="card-premium" style={{ marginBottom: 20 }}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Logo */}
          {boutique.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={boutique.logo_url} alt={boutique.nom}
              style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 12, flexShrink: 0, border: '1px solid var(--border)' }} />
          ) : (
            <div style={{ width: 68, height: 68, borderRadius: 12, background: 'linear-gradient(135deg, #fff8f2 0%, #fdf0e6 100%)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={32} style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontWeight: 800, fontSize: 19, margin: 0, color: 'var(--navy)' }}>{boutique.nom}</h2>
                {planActif === 'business' && <span className="badge-premium" style={{ background: 'var(--navy)', color: '#fff' }}>💼 Business</span>}
                {planActif === 'pro'      && <span className="badge-premium" style={{ background: 'var(--accent)', color: '#fff' }}>⭐ Pro</span>}
                {sponsorActif            && <span className="badge-premium" style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fcd34d' }}>Mis en avant</span>}
              </div>
              <span className="badge-premium" style={{ color: boutique.actif ? '#16a34a' : 'var(--text3)', background: boutique.actif ? '#f0fdf4' : '#f9fafb', borderColor: boutique.actif ? '#bbf7d0' : 'var(--border)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: boutique.actif ? '#16a34a' : 'var(--text3)', display: 'inline-block', marginRight: 6 }}></span>
                {boutique.actif ? 'Active' : 'Inactive'}
              </span>
            </div>

            {boutique.description && (
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 12px', lineHeight: 1.5 }}>{boutique.description}</p>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {boutique.categorie && (
                <span className="badge-premium">
                  <Tag size={13} style={{ color: 'var(--text2)' }} /> {boutique.categorie}
                </span>
              )}
              {boutique.ville && (
                <span className="badge-premium">
                  <MapPin size={13} style={{ color: 'var(--text2)' }} /> {boutique.ville}
                </span>
              )}
              {boutique.telephone && (
                <span className="badge-premium">
                  <Phone size={13} style={{ color: 'var(--text2)' }} /> {boutique.telephone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={onManage} className="btn-premium btn-premium-primary" style={{ padding: '9px 18px', fontSize: 13 }}>
            Gérer la boutique →
          </button>
          <a href="/boutique/caisse" className="btn-premium btn-premium-success" style={{ padding: '9px 18px', fontSize: 13 }}>
            <Monitor size={15} /> Caisse POS
          </a>
          <button onClick={onEdit} className="btn-premium btn-premium-secondary" style={{ padding: '9px 16px', fontSize: 13 }}>
            Modifier
          </button>
          <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer" className="btn-premium btn-premium-secondary" style={{ padding: '9px 16px', fontSize: 13 }}>
            Voir <Eye size={14} />
          </a>
          {onSponsoring && (
            <button onClick={onSponsoring} className="btn-premium btn-premium-secondary" style={{ padding: '9px 16px', fontSize: 13, color: '#b45309', borderColor: '#fcd34d', backgroundColor: '#fffbeb', marginLeft: 'auto' }}>
              Mettre en avant
            </button>
          )}
          {onPayerManuel && (
            <button onClick={onPayerManuel} className="btn-premium btn-premium-secondary" style={{ padding: '9px 16px', fontSize: 13, color: '#b45309', borderColor: '#fcd34d', backgroundColor: '#ffffff', marginLeft: onSponsoring ? undefined : 'auto' }}>
              Payer
            </button>
          )}
          <button onClick={onDelete} className="btn-premium btn-premium-danger" style={{ padding: '9px 16px', fontSize: 13, marginLeft: (!onSponsoring && !onPayerManuel) ? 'auto' : undefined }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vue de gestion d'une boutique — layout sidebar ────────────────────────────

const NAV_ITEMS: { key: 'produits' | 'commandes' | 'compta' | 'analytics' | 'infos' | 'marketing' | 'admins' | 'caissiers'; icon: string; label: string }[] = [
  { key: 'produits',   icon: '🛍',  label: 'Catalogue' },
  { key: 'commandes',  icon: '📋',  label: 'Commandes' },
  { key: 'compta',     icon: '💰',  label: 'Comptabilité' },
  { key: 'analytics',  icon: '📊',  label: 'Analytics' },
  { key: 'infos',      icon: '⚙️', label: 'Paramètres' },
  { key: 'marketing',  icon: '📣',  label: 'Marketing' },
  { key: 'admins',     icon: '👥',  label: 'Administrateurs' },
  { key: 'caissiers',  icon: '🏪',  label: 'Caissiers POS' },
]

function BoutiqueManage({ boutique, planActif, onBack, onEdit, prixPro }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
}) {
  const [tab, setTab] = useState<'produits' | 'commandes' | 'compta' | 'analytics' | 'infos' | 'marketing' | 'admins' | 'caissiers'>('produits')
  const [filtreProduitsMarketing, setFiltreProduitsMarketing] = useState<'jamais_partage' | undefined>(undefined)
  const [nbEnAttente, setNbEnAttente] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const planColor = planActif === 'business' ? '#1e3a5f' : planActif === 'pro' ? '#C75B00' : '#6b7280'

  // Polling toutes les 30s pour détecter nouvelles commandes en attente
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
      <aside className="bq-sidebar">
        {/* Boutique header dans sidebar */}
        <div className="bq-sidebar-header">
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
            ← Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {boutique.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={boutique.logo_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏪</div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boutique.nom}</p>
              {planActif && <span style={{ fontSize: 10, color: planColor, fontWeight: 700 }}>{planActif === 'business' ? '💼 Business' : '⭐ Pro'}</span>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="bq-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); if (item.key === 'commandes') setNbEnAttente(0) }} className={`bq-nav-item${tab === item.key ? ' active' : ''}`}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.key === 'commandes' && nbEnAttente > 0 && (
                <span className="bq-nav-badge">{nbEnAttente}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Liens rapides */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="/boutique/caisse"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: '#16a34a', textDecoration: 'none', borderRadius: 6, fontWeight: 700, background: '#f0fdf4' }}>
            🛒 Caisse POS (Physique) ↗
          </a>
          <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: '#6b7280', textDecoration: 'none', borderRadius: 6 }}>
            Voir la boutique ↗
          </a>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="bq-main">
        {/* Titre de section */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 20, margin: 0, color: '#111' }}>
            {NAV_ITEMS.find(i => i.key === tab)?.icon}{' '}
            {{ produits: 'Catalogue produits', commandes: 'Commandes', compta: 'Comptabilité', analytics: 'Analytics', infos: 'Paramètres boutique', marketing: 'Marketing', admins: 'Gestion des Admins', caissiers: 'Gestion des Caissiers' }[tab]}
          </h2>
          {tab === 'produits'  && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Gérez vos produits, stocks et tarifs.</p>}
          {tab === 'commandes' && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Commandes reçues — web et WhatsApp. Mettez à jour les statuts.</p>}
          {tab === 'compta'    && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Ventes, dépenses, stock et zones de livraison.</p>}
          {tab === 'analytics' && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Vues, clics et performances de votre boutique.</p>}
          {tab === 'infos'     && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Modifiez les informations, contacts et photos.</p>}
        </div>

        {tab === 'produits'  && <CatalogueProduits boutique={boutique} planActif={planActif} prixPro={prixPro} filtreInitial={filtreProduitsMarketing} />}
        {tab === 'commandes' && <Commandes boutiqueId={boutique.id} />}
        {tab === 'compta'    && <Comptabilite boutiqueId={boutique.id} />}
        {tab === 'analytics' && <AnalyticsClient boutiques={[{ id: boutique.id, nom: boutique.nom }]} />}
        {tab === 'infos'    && (
          <div style={{ maxWidth: 580 }}>
            <BoutiqueForm boutique={boutique} onCancel={onBack} onSuccess={onEdit} />
          </div>
        )}
        {tab === 'marketing' && <MarketingBoutique boutique={boutique} onVoirJamaisPartages={() => { setFiltreProduitsMarketing('jamais_partage'); setTab('produits') }} planActif={planActif} />}
        {tab === 'admins'    && <BoutiqueAdmins boutiqueId={boutique.id} />}
        {tab === 'caissiers' && <BoutiqueCaissiers boutiqueId={boutique.id} />}
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
  planActif?: 'pro' | 'business' | null
  codeApporteurDefaut?: string
  userId: string
  settings: Record<string, string>
}) {
  type Mode = 'list' | 'create' | { editing: Boutique } | { managing: Boutique }
  const [mode, setMode] = useState<Mode>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState<string | null>(null)
  const [manuelBoutiqueId, setManuelBoutiqueId] = useState<string | null>(null)
  const [, startSponsoring] = useTransition()
  const router = useRouter()

  const searchParams = useSearchParams()
  const manageId = searchParams.get('manage') || searchParams.get('id')

  useEffect(() => {
    if (manageId && boutiques.length > 0) {
      const targetBoutique = boutiques.find(b => b.id === manageId || b.slug === manageId)
      if (targetBoutique) {
        setMode({ managing: targetBoutique })
      }
    }
  }, [manageId, boutiques])

  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const waveActif    = settings.paiement_wave !== 'false'
  const montantSponsor = Number(settings.prix_sponsoring) || 5000
  const prixPro = Number(settings.plan_pro_prix) || 15000

  async function handleSponsoring(boutiqueId: string) {
    setSponsorError(null)
    startSponsoring(async () => {
      const res = await initierWaveBoutiqueSponsoring(boutiqueId)
      if (res.ok && res.url) window.location.href = res.url
      else setSponsorError(res.error ?? 'Impossible d\'initialiser le paiement.')
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette boutique définitivement ?')) return
    setDeleteError(null)
    const result = await deleteBoutique(id)
    if (result.error) setDeleteError(result.error)
    else { setSuccessMsg('Boutique supprimée.'); router.refresh() }
  }

  function handleSuccess() {
    const isEdit = typeof mode === 'object' && 'editing' in mode
    setSuccessMsg(isEdit ? '✅ Boutique modifiée !' : '✅ Boutique créée !')
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
      <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 24px' }}>
        <BoutiqueManage
          boutique={mode.managing}
          planActif={planActif ?? null}
          onBack={() => setMode('list')}
          onEdit={() => { setSuccessMsg('✅ Boutique modifiée !'); setMode('list'); router.refresh() }}
          prixPro={prixPro}
        />
      </div>
    )
  }

  // Vue liste
  return (
    <div style={{ maxWidth: 880, margin: '32px auto', padding: '0 20px 80px' }}>
      {/* Navigation fil d'Ariane & Retour Compte */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Link href="/compte" className="btn-back-account" aria-label="Retourner à l'espace mon compte" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Mon compte
        </Link>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Ma boutique</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--navy)' }}>Ma boutique</h1>
            <span style={{ fontSize: 12, fontWeight: 700, background: '#f5ece3', color: 'var(--navy)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20 }}>
              {boutiques.length} / 3 boutique{boutiques.length > 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6, margin: 0 }}>Gérez vos points de vente, catalogue produits, ventes et comptabilité.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/boutique/caisse" className="btn-premium btn-premium-secondary" style={{ border: '1.5px solid var(--border)' }}>
            <Monitor size={16} /> Ouvrir ma Caisse POS
          </Link>
          {canCreate && (
            <button onClick={() => setMode('create')} className="btn-premium btn-premium-primary">
              <PlusCircle size={16} /> Créer une boutique
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
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#92400e' }}>Passez en Boutique Pro</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b45309' }}>Catalogue · Comptabilité · Analytics · Placement prioritaire — {prixPro.toLocaleString('fr-FR')} FCFA/mois</p>
          </div>
          <span style={{ color: '#C75B00', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>Voir les plans →</span>
        </Link>
      )}

      {boutiques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏪</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Créez votre boutique en ligne</p>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>Vendez vos produits directement sur Nopalou.</p>
          <button onClick={() => setMode('create')} style={{
            padding: '12px 28px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Créer ma boutique
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {boutiques.map(b => (
            <BoutiqueCard
              key={b.id}
              boutique={b}
              planActif={planActif ?? null}
              onEdit={() => setMode({ editing: b })}
              onDelete={() => handleDelete(b.id)}
              onSponsoring={waveActif ? () => handleSponsoring(b.id) : undefined}
              onPayerManuel={manuelActif ? () => setManuelBoutiqueId(b.id) : undefined}
              onManage={() => setMode({ managing: b })}
            />
          ))}
        </div>
      )}

      {manuelBoutiqueId && (
        <ModalPaiementManuel
          reference={`bout_${userId}_${manuelBoutiqueId}`}
          montant={montantSponsor}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setManuelBoutiqueId(null)}
          onSuccess={() => { setManuelBoutiqueId(null); router.refresh() }}
        />
      )}
    </div>
  )
}
