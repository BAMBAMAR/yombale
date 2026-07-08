'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit } from './actions'
import Comptabilite from './Comptabilite'
import Commandes from './Commandes'
import AnalyticsClient from './analytics/AnalyticsClient'
import { initierWaveBoutiqueSponsoring } from '@/app/actions/paiement'
import { fcfa } from '@/lib/format'
import type { ActionState } from '@/lib/backend-fetch'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

const CATEGORIES = [
  { value: 'smartphones',  label: 'Smartphones' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'tv-electro',   label: 'TV & Électro' },
  { value: 'mode',         label: 'Mode' },
  { value: 'maison',       label: 'Maison' },
  { value: 'auto-moto',    label: 'Auto & Moto' },
  { value: 'jeux',         label: 'Jeux' },
  { value: 'services',     label: 'Services' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'beaute',       label: 'Beauté' },
  { value: 'autre',        label: 'Autre' },
]

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

interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
}

// ── Caractéristiques par catégorie ────────────────────────────────────────────

const ETATS_PRODUIT = ['Neuf', 'Bon état', 'Occasion', 'Pour pièces']
const GENRES_MODE   = ['Homme', 'Femme', 'Enfant', 'Unisexe']
const PLATEFORMES   = ['PS4', 'PS5', 'Xbox One', 'Xbox Series', 'Nintendo Switch', 'PC', 'Mobile']
const POUR_QUI      = ['Homme', 'Femme', 'Mixte']

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

function CaracteristiquesFields({ slug, values, onChange }: {
  slug: string; values: Record<string, string>; onChange: (k: string, v: string) => void
}) {
  const f = (k: string) => values[k] ?? ''

  if (slug === 'smartphones') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField    label="Marque"   name="marque"   value={f('marque')}   onChange={onChange} placeholder="Samsung, Apple…" required />
      <CaracField    label="Modèle"   name="modele"   value={f('modele')}   onChange={onChange} placeholder="iPhone 14 Pro…" />
      <CaracField    label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} placeholder="128 Go, 256 Go…" />
      <CaracField    label="RAM"      name="ram"      value={f('ram')}      onChange={onChange} placeholder="8 Go…" />
      <CaracField    label="Couleur"  name="couleur"  value={f('couleur')}  onChange={onChange} placeholder="Noir, Bleu…" />
      <CaracSelect   label="État"     name="etat"     value={f('etat')}     onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'informatique') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField  label="Marque"     name="marque"     value={f('marque')}     onChange={onChange} placeholder="Dell, Lenovo, HP…" required />
      <CaracField  label="Modèle"     name="modele"     value={f('modele')}     onChange={onChange} placeholder="XPS 15…" />
      <CaracField  label="Processeur" name="processeur" value={f('processeur')} onChange={onChange} placeholder="Intel i7, AMD Ryzen…" />
      <CaracField  label="RAM"        name="ram"        value={f('ram')}        onChange={onChange} placeholder="16 Go…" />
      <CaracField  label="Stockage"   name="stockage"   value={f('stockage')}   onChange={onChange} placeholder="512 Go SSD…" />
      <CaracSelect label="État"       name="etat"       value={f('etat')}       onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'tv-electro') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField  label="Marque"       name="marque"       value={f('marque')}       onChange={onChange} placeholder="Samsung, LG…" required />
      <CaracField  label="Modèle"       name="modele"       value={f('modele')}       onChange={onChange} placeholder="55QN90B…" />
      <CaracField  label="Type"         name="type_article" value={f('type_article')} onChange={onChange} placeholder="TV, Frigo, Clim…" />
      <CaracField  label="Taille/Capa." name="taille"       value={f('taille')}       onChange={onChange} placeholder="55 pouces, 300 L…" />
      <CaracSelect label="État"         name="etat"         value={f('etat')}         onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'auto-moto') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField  label="Marque"      name="marque"      value={f('marque')}      onChange={onChange} placeholder="Toyota, Yamaha…" required />
      <CaracField  label="Modèle"      name="modele"      value={f('modele')}      onChange={onChange} placeholder="Corolla, R1…" required />
      <div>
        <label style={labelStyle}>Année <span style={{ color: '#dc2626' }}>*</span></label>
        <input type="number" min={1970} max={2026} value={f('annee')} onChange={e => onChange('annee', e.target.value)}
          style={inputStyle} placeholder="2020" required />
      </div>
      <CaracField  label="Kilométrage" name="kilometrage" value={f('kilometrage')} onChange={onChange} placeholder="45 000 km" />
      <CaracField  label="Carburant"   name="carburant"   value={f('carburant')}   onChange={onChange} placeholder="Essence, Diesel, Hybride…" />
      <CaracSelect label="État"        name="etat"        value={f('etat')}        onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'mode') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField  label="Marque"  name="marque"  value={f('marque')}  onChange={onChange} placeholder="Zara, Nike…" />
      <CaracField  label="Taille"  name="taille"  value={f('taille')}  onChange={onChange} placeholder="M, 42, XL…" required />
      <CaracSelect label="Genre"   name="genre"   value={f('genre')}   onChange={onChange} options={GENRES_MODE} />
      <CaracField  label="Matière" name="matiere" value={f('matiere')} onChange={onChange} placeholder="Coton, Lin, Cuir…" />
      <CaracSelect label="État"    name="etat"    value={f('etat')}    onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'maison') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField  label="Type d'article" name="type_article" value={f('type_article')} onChange={onChange} placeholder="Canapé, Lit, Table…" required />
      <CaracField  label="Marque"         name="marque"       value={f('marque')}       onChange={onChange} placeholder="IKEA, Broyhill…" />
      <CaracField  label="Matière"        name="matiere"      value={f('matiere')}      onChange={onChange} placeholder="Bois, Métal, Tissu…" />
      <CaracField  label="Dimensions"     name="dimensions"   value={f('dimensions')}   onChange={onChange} placeholder="120×80×75 cm" />
      <CaracSelect label="État"           name="etat"         value={f('etat')}         onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'jeux') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracSelect label="Plateforme" name="plateforme" value={f('plateforme')} onChange={onChange} options={PLATEFORMES} required />
      <CaracField  label="Éditeur"    name="editeur"    value={f('editeur')}    onChange={onChange} placeholder="EA, Ubisoft…" />
      <CaracSelect label="État"       name="etat"       value={f('etat')}       onChange={onChange} options={ETATS_PRODUIT} required />
    </div>
  )

  if (slug === 'alimentation') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField label="Poids / Quantité"   name="poids_quantite"  value={f('poids_quantite')}  onChange={onChange} placeholder="500g, 1L, 12 unités…" />
      <CaracField label="Conditionnement"    name="conditionnement" value={f('conditionnement')} onChange={onChange} placeholder="Sachet, Boîte, Vrac…" />
      <CaracField label="Date de péremption" name="date_peremption" value={f('date_peremption')} onChange={onChange} placeholder="12/2025" />
      <CaracField label="Origine / Marque"   name="marque"          value={f('marque')}          onChange={onChange} placeholder="Dakar Produits…" />
    </div>
  )

  if (slug === 'beaute') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField  label="Marque"       name="marque"       value={f('marque')}       onChange={onChange} placeholder="L'Oréal, Nivea…" />
      <CaracField  label="Type"         name="type_produit" value={f('type_produit')} onChange={onChange} placeholder="Crème, Parfum, Shampoing…" required />
      <CaracSelect label="Pour qui"     name="pour_qui"     value={f('pour_qui')}     onChange={onChange} options={POUR_QUI} />
      <CaracField  label="Contenance"   name="contenance"   value={f('contenance')}   onChange={onChange} placeholder="200 ml, 50 g…" />
    </div>
  )

  if (slug === 'services') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CaracField label="Type de service"    name="type_service"     value={f('type_service')}     onChange={onChange} placeholder="Plomberie, Cours, Transport…" required />
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} style={{
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
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, margin: 0 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

const PRODUIT_CATEGORIES = [
  { value: 'smartphones',  label: '📱 Téléphone / Smartphone' },
  { value: 'informatique', label: '💻 Informatique' },
  { value: 'tv-electro',   label: '📺 TV & Électroménager' },
  { value: 'mode',         label: '👗 Mode & Vêtements' },
  { value: 'maison',       label: '🏠 Maison & Décoration' },
  { value: 'auto-moto',    label: '🚗 Auto & Moto' },
  { value: 'jeux',         label: '🎮 Jeux & Consoles' },
  { value: 'alimentation', label: '🍚 Alimentation' },
  { value: 'beaute',       label: '💄 Beauté & Soins' },
  { value: 'services',     label: '🛠 Services' },
  { value: 'autre',        label: '📦 Autre' },
]

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

function ProduitForm({ boutiqueId, boutiqueCat, produit, onCancel, onSuccess }: {
  boutiqueId: string
  boutiqueCat?: string | null
  produit?: Produit
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

  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  const hasCaracFields = cat && cat !== 'autre'

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, margin: 0 }}>
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
      <div>
        <label style={labelStyle}>Nom du produit <span style={{ color: '#dc2626' }}>*</span></label>
        <input name="nom" required maxLength={300} defaultValue={produit?.nom} style={inputStyle} placeholder="Ex: iPhone 14 Pro 256 Go" />
      </div>

      {/* Caractéristiques dynamiques par catégorie */}
      {hasCaracFields && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Caractéristiques
          </p>
          <CaracteristiquesFields slug={cat} values={carac} onChange={handleCarac} />
        </div>
      )}

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" rows={3} defaultValue={produit?.description ?? ''} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Détails supplémentaires, accessoires inclus, garantie…" />
      </div>

      {/* Prix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Prix (FCFA)</label>
          <input name="prix" type="number" min={0} defaultValue={produit?.prix ?? ''} style={inputStyle} placeholder="Ex: 350 000" />
        </div>
        <div>
          <label style={labelStyle}>Prix barré <span style={{ fontSize: 11, color: '#9ca3af' }}>(ancien prix)</span></label>
          <input name="prix_barre" type="number" min={0} defaultValue={produit?.prix_barre ?? ''} style={inputStyle} placeholder="Ex: 400 000" />
        </div>
      </div>

      {/* Photo */}
      <div>
        <label style={labelStyle}>Photo du produit <span style={{ fontSize: 11, color: '#9ca3af' }}>(max 5 Mo)</span></label>
        <input name="image" type="file" accept="image/*" style={{ fontSize: 14 }} />
        {produit?.images?.[0] && (
          <div style={{ marginTop: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={produit.images[0]} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </div>
        )}
      </div>

      {/* En stock toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />
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

      <div style={{ display: 'flex', gap: 12 }}>
        <SubmitButton label={produit ? 'Enregistrer' : 'Ajouter le produit'} />
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

// ── Gestionnaire de catalogue produits ───────────────────────────────────────

function CatalogueProduits({ boutique, planActif, prixPro }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'create' | { editing: Produit }>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec'>('tous')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes')
  const [, startTransition] = useTransition()

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function loadProduits() {
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutique.id}/produits`)
      const data = await res.json()
      setProduits(data.produits ?? [])
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
    if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) return false
    if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false
    return true
  })

  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          boutiqueCat={boutique.categorie}
          produit={typeof mode === 'object' ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={() => {
            setMode('list')
            setSuccessMsg(typeof mode === 'object' ? '✅ Produit modifié !' : '✅ Produit ajouté !')
            loadProduits()
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} / {quota} max
        </p>
        <button
          onClick={() => setMode('create')}
          style={{
            background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Ajouter un produit
        </button>
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
            onClick={() => setMode('create')}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Ajouter mon premier produit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produitsFiltres.map(p => (
            <div key={p.id} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px',
            }}>
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
                  <span
                    title={p.whatsapp_sync_statut === 'echec' ? (p.whatsapp_sync_erreur || 'Échec de synchronisation') : undefined}
                    style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 20, fontWeight: 700,
                      background: p.whatsapp_sync_statut === 'synchronise' ? '#dcfce7' : p.whatsapp_sync_statut === 'echec' ? '#fee2e2' : '#f1f5f9',
                      color: p.whatsapp_sync_statut === 'synchronise' ? '#16a34a' : p.whatsapp_sync_statut === 'echec' ? '#dc2626' : '#64748b',
                    }}
                  >
                    {p.whatsapp_sync_statut === 'synchronise' ? '✓ Sur WhatsApp' : p.whatsapp_sync_statut === 'echec' ? '✗ Échec' : '⏳ En attente'}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setMode({ editing: p })}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Modifier
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
  const planColor = planActif === 'business' ? '#1e3a5f' : planActif === 'pro' ? '#C75B00' : '#e5e7eb'

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,.07)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
    }}>
      {/* Bande colorée plan */}
      <div style={{ height: 4, background: planColor }} />

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Logo */}
          {boutique.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={boutique.logo_url} alt={boutique.nom}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, flexShrink: 0, border: '1px solid #f0f0f0' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'linear-gradient(135deg,#f0f4ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
              🏪
            </div>
          )}

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, margin: 0, color: '#111' }}>{boutique.nom}</h2>
                {planActif === 'business' && <span style={{ fontSize: 11, background: '#1e3a5f', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: '.02em' }}>💼 Business</span>}
                {planActif === 'pro'      && <span style={{ fontSize: 11, background: '#C75B00', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>⭐ Pro</span>}
                {sponsorActif            && <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>Mis en avant</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0, color: boutique.actif ? '#16a34a' : '#9ca3af', background: boutique.actif ? '#dcfce7' : '#f1f5f9' }}>
                {boutique.actif ? '● Active' : '○ Inactive'}
              </span>
            </div>

            {boutique.description && (
              <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 4px', lineHeight: 1.5 }}>{boutique.description}</p>
            )}
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0', display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {[boutique.categorie, boutique.ville, boutique.telephone].filter(Boolean).map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <button onClick={onManage} style={{
            fontSize: 13, color: '#fff', background: '#C75B00', border: 'none',
            borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 700,
            boxShadow: '0 1px 4px rgba(199,91,0,.3)',
          }}>
            Gérer la boutique →
          </button>
          <button onClick={onEdit} style={{
            fontSize: 13, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
          }}>
            Modifier
          </button>
          <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer" style={{
            fontSize: 13, color: '#374151', background: '#f8fafc', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '8px 16px', fontWeight: 600, textDecoration: 'none',
          }}>
            Voir ↗
          </a>
          {onSponsoring && (
            <button onClick={onSponsoring} style={{
              fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, marginLeft: 'auto',
            }}>
              ⭐ Mettre en avant
            </button>
          )}
          {onPayerManuel && (
            <button onClick={onPayerManuel} style={{
              fontSize: 13, color: '#92400e', background: '#fff', border: '1px solid #fcd34d',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
              marginLeft: onSponsoring ? undefined : 'auto',
            }}>
              🧾 Payer
            </button>
          )}
          <button onClick={onDelete} style={{
            fontSize: 13, color: '#dc2626', background: 'none', border: '1px solid #fecaca',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
          }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vue de gestion d'une boutique — layout sidebar ────────────────────────────

const NAV_ITEMS: { key: 'produits' | 'commandes' | 'compta' | 'analytics' | 'infos'; icon: string; label: string }[] = [
  { key: 'produits',  icon: '🛍',  label: 'Catalogue' },
  { key: 'commandes', icon: '📋',  label: 'Commandes' },
  { key: 'compta',    icon: '💰',  label: 'Comptabilité' },
  { key: 'analytics', icon: '📊',  label: 'Analytics' },
  { key: 'infos',     icon: '⚙️', label: 'Paramètres' },
]

function BoutiqueManage({ boutique, planActif, onBack, onEdit, prixPro }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
}) {
  const [tab, setTab] = useState<'produits' | 'commandes' | 'compta' | 'analytics' | 'infos'>('produits')
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

    <div style={{ display: 'flex', gap: 0, minHeight: '70vh', background: '#f8fafc', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        {/* Boutique header dans sidebar */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f3f4f6' }}>
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
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); if (item.key === 'commandes') setNbEnAttente(0) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: tab === item.key ? '#fff7f0' : 'none',
              color: tab === item.key ? '#C75B00' : '#374151',
              fontWeight: tab === item.key ? 700 : 500,
              fontSize: 13, marginBottom: 2, textAlign: 'left' as const,
              borderLeft: tab === item.key ? '3px solid #C75B00' : '3px solid transparent',
              position: 'relative',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.key === 'commandes' && nbEnAttente > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#dc2626', color: '#fff',
                  borderRadius: 20, fontSize: 10, fontWeight: 800,
                  padding: '2px 7px', minWidth: 18, textAlign: 'center',
                }}>
                  {nbEnAttente}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Liens rapides */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #f3f4f6' }}>
          <a href={`/boutiques/${boutique.slug || boutique.id}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: '#6b7280', textDecoration: 'none', borderRadius: 6 }}>
            Voir la boutique ↗
          </a>
        </div>
      </aside>

      {/* Contenu principal */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px', overflowY: 'auto' }}>
        {/* Titre de section */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, margin: 0, color: '#111' }}>
            {NAV_ITEMS.find(i => i.key === tab)?.icon}{' '}
            {{ produits: 'Catalogue produits', commandes: 'Commandes', compta: 'Comptabilité', analytics: 'Analytics', infos: 'Paramètres boutique' }[tab]}
          </h2>
          {tab === 'produits'  && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Gérez vos produits, stocks et tarifs.</p>}
          {tab === 'commandes' && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Commandes reçues — web et WhatsApp. Mettez à jour les statuts.</p>}
          {tab === 'compta'    && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Ventes, dépenses, stock et zones de livraison.</p>}
          {tab === 'analytics' && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Vues, clics et performances de votre boutique.</p>}
          {tab === 'infos'     && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Modifiez les informations, contacts et photos.</p>}
        </div>

        {tab === 'produits'  && <CatalogueProduits boutique={boutique} planActif={planActif} prixPro={prixPro} />}
        {tab === 'commandes' && <Commandes boutiqueId={boutique.id} />}
        {tab === 'compta'    && <Comptabilite boutiqueId={boutique.id} />}
        {tab === 'analytics' && <AnalyticsClient boutiques={[{ id: boutique.id, nom: boutique.nom }]} />}
        {tab === 'infos'    && (
          <div style={{ maxWidth: 580 }}>
            <BoutiqueForm boutique={boutique} onCancel={onBack} onSuccess={onEdit} />
          </div>
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
    <div style={{ maxWidth: 860, margin: '40px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, margin: 0, color: '#111' }}>Ma boutique</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{boutiques.length}/3 boutique{boutiques.length > 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <button onClick={() => setMode('create')} style={{
            padding: '10px 20px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(29,78,216,.25)',
          }}>
            + Créer une boutique
          </button>
        )}
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
