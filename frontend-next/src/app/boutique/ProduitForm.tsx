'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import ExternalImg from '@/components/ExternalImg'
import { createProduit, updateProduit } from './actions'
import { fcfa } from '@/lib/format'
import type { ActionState } from '@/lib/backend-fetch'
import { useTranslation } from '@/i18n/context'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer, rechercherInfosProduitEan, toggleTorcheCamera } from '@/lib/scanner-helper'
import { CATEGORIES, PRODUIT_CATEGORIES } from '@/lib/categories'
import { createVoiceListener, parseAjoutProduitIntent, demanderPermissionMicrophone, getMessageErreurMicro } from '@/lib/voice-assistant'
import { CaracChips } from '@/components/CaracChips'
import {
  type TypeVarianteId,
  CHAMP_VERS_TYPE_VARIANTE,
  champVisibleSelonVariante,
  nomParDefautPourCategorie,
  genererSVGCodeBarresEAN13,
} from './boutiqueHelpers'
import type { Boutique, Variante, Produit, VarianteSku } from './boutiqueTypes'
import { Eye } from 'lucide-react'

export const inputStyle = {
  padding: '10px 14px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, width: '100%',
  background: '#fff', boxSizing: 'border-box' as const,
}

export const labelStyle = {
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
  { id: 'capacite', label: 'Capacité / Puissance',  nomVariante: 'Capacité',  suggestions: CAPACITES_PUISSANCE,  repetable: false },
  { id: 'autre',    label: 'Autre (personnalisé)',   nomVariante: '',          suggestions: [],                   repetable: true },
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
const MARQUES_PARFUM = ['Dior', 'Chanel', 'Lattafa', 'Tom Ford', 'YSL', 'Armani', 'Guerlain', 'Hugo Boss']
const CONCENTRATIONS_PARFUM = ['Extrait de Parfum', 'Eau de Parfum (EDP)', 'Eau de Toilette (EDT)', 'Eau de Cologne', 'Brume']
const FAMILLES_OLFACTIVES = ['Boisé / Oud', 'Floral', 'Ambré / Oriental', 'Frais / Hespéridé', 'Gourmand / Vanillé', 'Épicé']
const MARQUES_OPTIQUE = ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Tom Ford', 'Persol', 'Dior']
const TYPES_LUNETTES = ['Lunettes de soleil', 'Lunettes de vue / Repos', 'Anti-lumière bleue', 'Monture créateur']
const FORMES_MONTURE = ['Aviateur', 'Ronde', 'Carrée / Rectangulaire', 'Papillon / Cat-Eye', 'Wayfarer', 'Hexagonale']
const PROTECTIONS_UV = ['UV400 (Catégorie 3)', 'Polarisé UV400', 'Verres Photochromiques', 'Sans protection']

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

  if (slug === 'parfum') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"            name="marque"            value={f('marque')}            onChange={onChange} suggestions={MARQUES_PARFUM} />
      <CaracChips  label="Concentration"     name="concentration"     value={f('concentration')}     onChange={onChange} suggestions={CONCENTRATIONS_PARFUM} />
      <CaracChips  label="Famille olfactive" name="famille_olfactive" value={f('famille_olfactive')} onChange={onChange} suggestions={FAMILLES_OLFACTIVES} />
      <CaracChips  label="Genre"             name="pour_qui"          value={f('pour_qui')}          onChange={onChange} suggestions={POUR_QUI} allowAutre={false} />
      <CaracField  label="Contenance"        name="contenance"        value={f('contenance')}        onChange={onChange} placeholder="100 ml, 50 ml, 200 ml…" />
      <CaracSelect label="État"              name="etat"              value={f('etat')}              onChange={onChange} options={ETATS_PRODUIT} />
    </div>
  )

  if (slug === 'optique') return (
    <div className="bq-form-grid-2">
      <CaracChips  label="Marque"            name="marque"            value={f('marque')}            onChange={onChange} suggestions={MARQUES_OPTIQUE} />
      <CaracChips  label="Type de lunettes"  name="type_article"      value={f('type_article')}      onChange={onChange} suggestions={TYPES_LUNETTES} />
      <CaracChips  label="Forme monture"     name="forme_monture"     value={f('forme_monture')}     onChange={onChange} suggestions={FORMES_MONTURE} />
      <CaracChips  label="Protection verres" name="protection_uv"     value={f('protection_uv')}     onChange={onChange} suggestions={PROTECTIONS_UV} />
      <CaracChips  label="Matière monture"   name="matiere"           value={f('matiere')}           onChange={onChange} suggestions={['Acétate', 'Métal', 'Titane', 'Plastique injecté', 'Bois']} />
      <CaracSelect label="État"              name="etat"              value={f('etat')}              onChange={onChange} options={ETATS_PRODUIT} />
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

function ProduitForm({ boutiqueId, boutiqueCat, produit, modeInitial = 'rapide', onCancel, onSuccess }: {
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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(!!produit)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imagesExistantes, setImagesExistantes] = useState<string[]>(produit?.images ?? [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [nomForm, setNomForm] = useState<string>(produit?.nom ?? (modeInitial === 'rapide' ? nomParDefautPourCategorie(cat) : ''))
  const [codeBarreForm, setCodeBarreForm] = useState<string>((produit as any)?.code_barre || '')
  const [prixForm, setPrixForm] = useState<string>(produit?.prix != null ? String(produit.prix) : '')
  const [prixAchatForm, setPrixAchatForm] = useState<string>((produit as any)?.prix_achat != null ? String((produit as any).prix_achat) : '')
  const [stockQuantiteForm, setStockQuantiteForm] = useState<string>(
    (produit as any)?.quantite_stock != null
      ? String((produit as any).quantite_stock)
      : produit?.stock_quantite != null
      ? String(produit.stock_quantite)
      : ''
  )
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
    if ((produit as any)?.quantite_stock != null) setStockQuantiteForm(String((produit as any).quantite_stock))
    else if (produit?.stock_quantite != null) setStockQuantiteForm(String(produit.stock_quantite))
    else setStockQuantiteForm('')
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
        const nbImgs = data.images?.length || 0;
        setMagicResult(data);
        setMagicFeedback({
          type: 'success',
          text: nbImgs > 0
            ? `Produit importé avec succès ! ${nbImgs} photo(s) ajoutée(s).`
            : `Fiche importée avec succès ! (Titre, Prix & Description remplis — ajoutez vos photos ci-dessous).`
        });
        setModeRapide(false); // Basculer pour afficher description et photos
        setShowAdvanced(true);
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

  // Assistant Vocal Ajout Produit (Wolof & Français)
  const [isListeningNom, setIsListeningNom] = useState<boolean>(false)
  const [voiceNomFeedback, setVoiceNomFeedback] = useState<string | null>(null)
  const voiceNomRecognitionRef = useRef<any>(null)

  const demarrerEcouteVocaleNom = async () => {
    if (isListeningNom) {
      try {
        voiceNomRecognitionRef.current?.stop()
      } catch (err) { console.warn('[Nopalou:ProduitForm:L442]', err); }
      setIsListeningNom(false)
      return
    }

    setVoiceNomFeedback(null)

    // 1. Demande de permission microphone au navigateur
    const perm = await demanderPermissionMicrophone()
    if (!perm.ok) {
      setIsListeningNom(false)
      setVoiceNomFeedback(getMessageErreurMicro(perm.error || 'not-allowed'))
      return
    }

    // 2. Lancement du listener universel
    const rec = createVoiceListener({
      lang: 'fr-FR',
      onStart: () => setIsListeningNom(true),
      onEnd: () => setIsListeningNom(false),
      onError: (err) => {
        setIsListeningNom(false)
        setVoiceNomFeedback(getMessageErreurMicro(err))
      },
      onResult: (transcript) => {
        setIsListeningNom(false)
        const parsed = parseAjoutProduitIntent(transcript)
        if (parsed.nom) {
          setNomForm(parsed.nom)
        }
        if (parsed.prix !== null && parsed.prix > 0) {
          setPrixForm(String(parsed.prix))
          setVoiceNomFeedback(`Dictée réussie : "${parsed.nom}" · Prix : ${fcfa(parsed.prix)}`)
        } else {
          setVoiceNomFeedback(`Nom dicté : "${parsed.nom}"`)
        }
        jouerBipEtVibrer('succes')
      }
    })

    if (rec) {
      voiceNomRecognitionRef.current = rec
      try {
        rec.start()
      } catch (e: any) {
        setIsListeningNom(false)
        setVoiceNomFeedback(getMessageErreurMicro(e?.name || 'not-allowed'))
      }
    } else {
      setVoiceNomFeedback("Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome, Edge ou Safari.")
    }
  }

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

  const [imageFligeeNom, setImageFligeeNom] = useState<string | null>(null)

  async function demarrerFormScanner(target: 'nom' | 'ean' = 'nom') {
    setScannerTarget(target)
    setModalFormScanner(true)
    setOcrDetections([])
    setOcrLoading(false)
    setImageFligeeNom(null)
    setScannerStatus(target === 'nom' ? 'Cadrez le nom sur l’emballage puis cliquez sur Capturer' : 'Placez le code-barres dans le cadre...')

    if (target === 'nom') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        })
        streamFormRef.current = stream
        if (videoFormRef.current) {
          videoFormRef.current.srcObject = stream
          await videoFormRef.current.play().catch(() => {})
        }
      } catch (e) {
        setScannerStatus('Impossible d’accéder à la caméra. Vérifiez les permissions.')
      }
    } else {
      setTimeout(async () => {
        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
          if (html5ScannerFormRef.current) {
            try {
              await html5ScannerFormRef.current.stop()
              html5ScannerFormRef.current.clear()
            } catch (e) { console.warn('[Nopalou:ProduitForm:L549]', e); }
            html5ScannerFormRef.current = null
          }

          const container = document.getElementById('produit-form-scanner-reader')
          if (!container) return

          const scanner = new Html5Qrcode('produit-form-scanner-reader')
          html5ScannerFormRef.current = scanner

          const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

          const onScanSuccess = async (decodedText: string) => {
            const cleanCode = decodedText.trim()
            setCodeBarreForm(cleanCode)
            jouerBipEtVibrer('succes')
            setScannerStatus(`Code scanné : ${cleanCode} — Recherche produit…`)

            // Lookup automatique OpenFoodFacts / base mondiale
            const info = await rechercherInfosProduitEan(cleanCode)
            if (info && info.nom) {
              if (!nomForm || nomForm.trim() === '') {
                setNomForm(info.nom)
              }
              setScannerStatus(`Produit reconnu : "${info.nom}"`)
            } else {
              setScannerStatus(`Code validé : ${cleanCode}`)
            }

            setTimeout(() => {
              arreterFormScanner()
            }, 800)
          }

          try {
            await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          } catch (errEnv) {
            try {
              await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            } catch (e) { console.warn('[Nopalou:ProduitForm:L588]', e); }
          }
        } catch (err) {
          setScannerStatus('Erreur d’initialisation du scanner.')
        }
      }, 250)
    }
  }

  async function capturerEtLireNomTexte() {
    if (!videoFormRef.current) return
    setOcrLoading(true)
    setScannerStatus('Analyse OCR en cours…')

    const imageBase64 = capturerZoneViseurExacte(videoFormRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setScannerStatus('Échec de capture d’image.')
      return
    }

    // Geler l'image dans le viseur pour reposer les mains
    setImageFligeeNom(imageBase64)

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
        jouerBipEtVibrer('succes')
        setScannerStatus(`Nom capturé : "${data.nom}" (cliquez sur une suggestion ci-dessous si besoin)`)
      } else {
        jouerBipEtVibrer('alerte')
        setScannerStatus(`${data.error || 'Aucun texte lisible détecté. Cliquez sur Reprendre pour réessayer.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipEtVibrer('alerte')
      setScannerStatus('Erreur lors de l’analyse OCR.')
    }
  }

  function arreterFormScanner() {
    setImageFligeeNom(null)
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
      } catch (e) { console.warn('[Nopalou:ProduitForm:L658]', e); }
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

  // ── Matrice 3D de Variantes (Combinaisons Cartésiennes, SKU & Stocks) ────────
  const [variantesSkus, setVariantesSkus] = useState<VarianteSku[]>(produit?.variantes_skus ?? [])

  useEffect(() => {
    const optionsValides = variantes.filter(o => o.nom && o.nom.trim() && o.valeurs && o.valeurs.length > 0)
    if (optionsValides.length === 0) {
      setVariantesSkus([])
      return
    }

    // Produit cartésien multi-dimensions (Taille × Couleur × Matière...)
    const combinaisons = optionsValides.reduce<Record<string, string>[]>(
      (acc, opt) => {
        const res: Record<string, string>[] = []
        for (const comb of acc) {
          for (const val of opt.valeurs) {
            res.push({ ...comb, [opt.nom.trim()]: val })
          }
        }
        return res
      },
      [{}]
    )

    setVariantesSkus(prev => {
      const basePrix = Number(prixForm) || produit?.prix || 0
      const baseStock = Number(stockQuantiteForm) || 0
      const slugProduit = (nomForm || 'ART').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROD'

      return combinaisons.map((comb, idx) => {
        const existing = prev.find(item => {
          const keys = Object.keys(comb)
          const itemKeys = Object.keys(item.attributs || {})
          return keys.length === itemKeys.length && keys.every(k => item.attributs[k] === comb[k])
        }) || (produit?.variantes_skus || []).find(item => {
          const keys = Object.keys(comb)
          const itemKeys = Object.keys(item.attributs || {})
          return keys.length === itemKeys.length && keys.every(k => item.attributs[k] === comb[k])
        })

        if (existing) {
          return {
            ...existing,
            attributs: comb,
            ordre: idx,
          }
        }

        const codeSuffix = Object.values(comb).map(v => v.slice(0, 3).toUpperCase()).join('-')
        const autoSku = `${slugProduit}-${codeSuffix}`

        return {
          sku: autoSku,
          code_barre: '',
          attributs: comb,
          prix: basePrix,
          stock_quantite: baseStock,
          actif: true,
          ordre: idx,
        }
      })
    })
  }, [variantes, nomForm, prixForm, stockQuantiteForm, produit?.variantes_skus, produit?.prix])

  function updateVarianteSku(index: number, champ: keyof VarianteSku, val: any) {
    setVariantesSkus(prev => prev.map((item, i) => i === index ? { ...item, [champ]: val } : item))
  }

  function alignerTousLesPrix() {
    const p = Number(prixForm) || produit?.prix || 0
    setVariantesSkus(prev => prev.map(item => ({ ...item, prix: p })))
  }

  function alignerTousLesStocks() {
    const s = Number(stockQuantiteForm) || 0
    setVariantesSkus(prev => prev.map(item => ({ ...item, stock_quantite: s })))
  }

  function regenererTousLesSkus() {
    const slugProduit = (nomForm || 'ART').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROD'
    setVariantesSkus(prev => prev.map((item) => {
      const codeSuffix = Object.values(item.attributs || {}).map(v => v.slice(0, 3).toUpperCase()).join('-')
      return {
        ...item,
        sku: `${slugProduit}-${codeSuffix}`,
      }
    }))
  }

  function genererEanPourVariante(index: number) {
    const prefix = '200' + Math.floor(Math.random() * 900000000 + 100000000).toString()
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(prefix[i], 10) * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    const code = prefix + checkDigit
    updateVarianteSku(index, 'code_barre', code)
  }

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const produitFormTopRef = useRef<HTMLDivElement>(null)
  const handledRef = useRef<any>(null)

  useEffect(() => {
    if (state.success && handledRef.current !== state) {
      handledRef.current = state
      setSuccessMsg(produit ? 'Produit modifié avec succès !' : 'Produit ajouté au catalogue avec succès !')
      if (produitFormTopRef.current) {
        produitFormTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onSuccess((state as any)?.produit)
      const t = setTimeout(() => setSuccessMsg(null), 6000)
      return () => clearTimeout(t)
    } else if (state.error && handledRef.current !== state) {
      handledRef.current = state
      if (produitFormTopRef.current) {
        produitFormTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [state, produit, onSuccess])

  function handleCarac(k: string, v: string) {
    setCarac(prev => ({ ...prev, [k]: v }))
  }

  const hasCaracFields = cat && cat !== 'autre' && showAdvanced

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60 }}>
      <div ref={produitFormTopRef} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
          {produit ? t('shop.editProductTitle') : 'Ajouter un produit (Mode Rapide 10s)'}
        </h3>
        {!produit && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: 20 }}>
            3 champs suffisent pour vendre
          </span>
        )}
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', color: '#166534', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{successMsg}</span>
        </div>
      )}

      {state.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
          {state.error}
        </div>
      )}

      {/* Champs cachés pour le formulaire */}
      <input type="hidden" name="images" value={JSON.stringify(imagesExistantes)} />
      <input type="hidden" name="categorie" value={cat} />
      <input type="hidden" name="code_barre" value={codeBarreForm} />
      <input type="hidden" name="quantite_stock" value={stockQuantiteForm} />
      <input type="hidden" name="caracteristiques" value={JSON.stringify(carac)} />
      <input type="hidden" name="variantes" value={JSON.stringify(variantes.filter(v => v.nom.trim() && v.valeurs.length > 0))} />
      <input type="hidden" name="variantes_skus" value={JSON.stringify(variantesSkus)} />
      <input type="hidden" name="en_stock" value={enStock ? 'true' : 'false'} />

      {/* ── 1. PHOTO DU PRODUIT ────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 16 }}>
        <label className="npl-label-airy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Photos de l&apos;article <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>(Max 5 — Recommandé)</span></span>
          <span style={{ fontSize: 11.5, color: '#1d4ed8', fontWeight: 700 }}>
            {imagesExistantes.length + photos.length}/5 photos
          </span>
        </label>
        
        <div className="photos-zone" style={{ marginTop: 8 }}>
          {imagesExistantes.length + photos.length < 5 && (
            <div
              className="photos-dropzone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              tabIndex={0}
              role="button"
              aria-label="Ajouter des photos"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '14px 18px',
                minHeight: 64,
                borderRadius: 12,
                border: '2px dashed #93c5fd',
                background: '#eff6ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: 26 }}></span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#1d4ed8' }}>
                  Toucher pour ajouter une photo
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                  Prenez une photo ou choisissez depuis votre galerie
                </p>
              </div>
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
            <div className="photos-previews" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              {imagesExistantes.map((src, i) => (
                <div key={`existante-${i}`} className="photo-thumb" style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <ExternalImg src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" className="photo-remove" onClick={() => removeImageExistante(i)} aria-label="Supprimer" style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={`nouvelle-${i}`} className="photo-thumb" style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '2px solid #3b82f6' }}>
                  <ExternalImg src={src} alt={`Nouvelle photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" className="photo-remove" onClick={() => removeNouvellePhoto(i)} aria-label="Supprimer" style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. NOM DU PRODUIT ────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: isListeningNom ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
        padding: 16,
        boxShadow: isListeningNom ? '0 4px 18px rgba(234, 88, 12, 0.15)' : 'none',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
          <label className="npl-label-airy" style={{ margin: 0 }}>
            Nom du produit <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <span style={{ fontSize: 12, color: '#ea580c', fontWeight: 700 }}>
            Dictez en Wolof ou Français (« Nom seul » ou « Nom + Prix »)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            name="nom"
            required
            maxLength={300}
            value={nomForm}
            onChange={e => setNomForm(e.target.value)}
            className="npl-input-airy"
            style={{ flex: '1 1 200px' }}
            placeholder="Ex: Robe Bazin Brodé / Lait Candia 1L..."
          />

          {/* Bouton Vocal Proéminent */}
          <button
            type="button"
            onClick={demarrerEcouteVocaleNom}
            className="npl-btn npl-btn-md"
            style={{
              flex: '0 0 auto',
              height: 48,
              whiteSpace: 'nowrap',
              borderRadius: 12,
              padding: '0 16px',
              fontWeight: 800,
              background: isListeningNom ? '#ea580c' : '#fff7ed',
              color: isListeningNom ? '#ffffff' : '#c2410c',
              border: isListeningNom ? '2px solid #9a3412' : '1.5px solid #fdba74',
              boxShadow: isListeningNom ? '0 0 0 4px rgba(234, 88, 12, 0.25)' : 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
            title={isListeningNom ? "Arrêter l'écoute" : "Dicter le nom ou le nom + prix (ex: 'Robe Bazin 15000', 'Lait Candia benn téemeer')"}
          >
            <span>{isListeningNom ? '' : ''}</span>
            <span>{isListeningNom ? 'Écoute…' : 'Dicter'}</span>
          </button>

          <button
            type="button"
            onClick={() => demarrerFormScanner('nom')}
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '0 0 auto', height: 48, whiteSpace: 'nowrap', borderRadius: 12, padding: '0 16px', fontWeight: 800 }}
            title="Scanner le nom écrit sur l'emballage du produit"
          >
            <span></span>
            <span>Scan Nom</span>
          </button>
        </div>

        {/* Message d'écoute active */}
        {isListeningNom && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 8,
            fontSize: 12.5,
            color: '#9a3412',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
            <span>Écoute en cours… Dites le nom (ex: <em>« Robe Bazin »</em>) ou avec le prix (ex: <em>« Robe Bazin 15 000 »</em>)</span>
          </div>
        )}

        {/* Feedback vocal ou alerte cadenas */}
        {voiceNomFeedback && (
          <div style={{
            marginTop: 10,
            padding: '9px 13px',
            background: voiceNomFeedback.includes('bloqué') || voiceNomFeedback.includes('indisponible') || voiceNomFeedback.includes('Erreur') || voiceNomFeedback.includes('Microphone')
              ? '#fef2f2'
              : '#f0fdf4',
            border: voiceNomFeedback.includes('bloqué') || voiceNomFeedback.includes('indisponible') || voiceNomFeedback.includes('Erreur') || voiceNomFeedback.includes('Microphone')
              ? '1.5px solid #fecaca'
              : '1px solid #bbf7d0',
            borderRadius: 8,
            fontSize: 12.5,
            color: voiceNomFeedback.includes('bloqué') || voiceNomFeedback.includes('indisponible') || voiceNomFeedback.includes('Erreur') || voiceNomFeedback.includes('Microphone')
              ? '#991b1b'
              : '#166534',
            fontWeight: 700,
            lineHeight: 1.4
          }}>
            {voiceNomFeedback}
          </div>
        )}
      </div>

      {/* ── 3. PRIX DE VENTE (FCFA) ───────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 16 }}>
        <label className="npl-label-airy">
          Prix de vente (FCFA) <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            name="prix"
            type="number"
            min={0}
            required
            value={prixForm}
            onChange={e => setPrixForm(e.target.value)}
            className="npl-input-airy"
            style={{ fontSize: 18, fontWeight: 800, paddingRight: 70, color: '#0f172a' }}
            placeholder="Ex: 15 000"
          />
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b', fontSize: 13, pointerEvents: 'none' }}>
            FCFA
          </span>
        </div>
      </div>

      {/* ── ACCORDÉON PROGRESSIVE DISCLOSURE : OPTIONS AVANCÉES ───────────── */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="npl-accordion-btn"
        style={{ marginTop: 4, padding: '14px 18px', borderRadius: 14, border: '1.5px solid #cbd5e1' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
          <span style={{ fontSize: 18 }}></span>
          <span>
            <strong style={{ display: 'block', fontSize: 13.5, color: '#0f172a' }}>
              Options avancées (Stock, Catégorie, Variantes, EAN, Description, Import)
            </strong>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
              {showAdvanced ? 'Cliquez pour masquer les champs secondaires' : 'Facultatif — à renseigner si nécessaire'}
            </span>
          </span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>
          {showAdvanced ? '▲ Replier' : '▼ Déplier'}
        </span>
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          
          {/* Baguette Magique (Import Rapide) */}
          {!produit && (
            <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 14, border: '1.5px dashed #22c55e', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13.5, fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span></span>
                  <span>Baguette Magique (Import Rapide URL)</span>
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
                  className="npl-input-airy"
                  style={{ flex: '1 1 220px', minHeight: 44, fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={executerMagicImport}
                  disabled={magicLoading}
                  className="npl-btn npl-btn-success npl-btn-md"
                  style={{ flex: '0 0 auto', color: '#ffffff', whiteSpace: 'nowrap', padding: '0 18px', borderRadius: 10, fontWeight: 800, height: 44 }}
                >
                  {magicLoading ? 'Analyse en cours...' : '🪄 Importer'}
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
                    Prix de vente suggéré : {magicResult.prix?.toLocaleString('fr-FR')} FCFA
                    {magicResult.prix_achat > 0 && (
                      <span style={{ color: '#64748b', fontWeight: 500, marginLeft: 6 }}>
                        (Coût d'achat estimé : {magicResult.prix_achat?.toLocaleString('fr-FR')} FCFA)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Catégorie */}
          <div>
            <label className="npl-label-airy">{t('shop.productCategory')}</label>
            <select
              value={cat}
              onChange={e => { setCat(e.target.value); setCarac({}) }}
              className="npl-input-airy"
            >
              <option value="">— {t('shop.productCategory')} —</option>
              {PRODUIT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Code-Barres EAN-13 */}
          <div>
            <label className="npl-label-airy">Code-Barres EAN-13 (Optionnel)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={codeBarreForm}
                onChange={e => setCodeBarreForm(e.target.value)}
                className="npl-input-airy"
                style={{ flex: '1 1 200px' }}
                placeholder="Ex: 600123456789 (Scannez ou tapez)"
              />
              <button
                type="button"
                onClick={genererCodeBarreForm}
                className="npl-btn npl-btn-secondary npl-btn-md"
                style={{ flex: '0 0 auto', height: 48, whiteSpace: 'nowrap', borderRadius: 12 }}
                title="Générer un code EAN-13 valide automatiquement"
              >
                <span>🎲</span>
                <span>Générer EAN</span>
              </button>
              <button
                type="button"
                onClick={() => demarrerFormScanner('ean')}
                className="npl-btn npl-btn-secondary npl-btn-md"
                style={{ flex: '0 0 auto', height: 48, whiteSpace: 'nowrap', borderRadius: 12 }}
                title="Scanner le code-barres EAN avec la caméra"
              >
                <span></span>
                <span>Scan EAN</span>
              </button>
            </div>
          </div>

          {/* Stock, Coût d'achat & Prix barré promo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div>
              <label className="npl-label-airy">Quantité en stock</label>
              <input
                name="stock_quantite"
                type="number"
                min={0}
                value={stockQuantiteForm}
                onChange={e => {
                  setStockQuantiteForm(e.target.value)
                  if (Number(e.target.value) > 0) setEnStock(true)
                  else if (e.target.value === '0') setEnStock(false)
                }}
                className="npl-input-airy"
                placeholder="Ex: 50"
              />
            </div>
            <div>
              <label className="npl-label-airy">Prix d&apos;achat / Coût (FCFA)</label>
              <input
                name="prix_achat"
                type="number"
                min={0}
                value={prixAchatForm}
                onChange={e => setPrixAchatForm(e.target.value)}
                className="npl-input-airy"
                placeholder="Ex: 10 000"
              />
            </div>
            <div>
              <label className="npl-label-airy">{t('shop.productPriceStrikethrough')}</label>
              <input
                name="prix_barre"
                type="number"
                min={0}
                value={prixBarreForm}
                onChange={e => setPrixBarreForm(e.target.value)}
                className="npl-input-airy"
                placeholder="Ex: 20 000"
              />
            </div>
          </div>

          {/* Toggle En stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <button type="button" onClick={() => setEnStock(!enStock)} style={{
              width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: enStock ? '#16a34a' : '#d1d5db', transition: 'background .2s', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: 3, left: enStock ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', display: 'block',
              }} />
            </button>
            <span style={{ fontSize: 13.5, color: '#334155', fontWeight: 700 }}>
              {enStock
                ? (stockQuantiteForm && Number(stockQuantiteForm) > 0 ? `En stock (${stockQuantiteForm} pcs)` : `${t('shop.inStock')}`)
                : `${t('shop.outOfStock')}`}
            </span>
          </div>

          {/* Caractéristiques dynamiques */}
          {hasCaracFields && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Caractéristiques
              </p>
              <CaracteristiquesFields slug={cat} values={carac} onChange={handleCarac} typesVarianteActifs={typesDejaUtilises} />
            </div>
          )}

          {/* Variantes */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Variantes (optionnel)
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
              Ajoutez une option (ex: Couleur, Taille) puis choisissez les valeurs.
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
                        className="npl-input-airy" style={{ flex: 1, minHeight: 40 }} placeholder="Nom de l'option (ex: Matière)"
                      />
                    ) : (
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#374151' }}>{type?.label}</span>
                    )}
                    <button type="button" onClick={() => retirerOption(i)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
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
                    style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                  >
                    + {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Matrice 3D des Combinaisons (SKU, Prix, Stock individualisés) ── */}
            {variantesSkus.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧊 Matrice 3D des Combinaisons</span>
                      <span style={{ fontSize: 11, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999 }}>
                        {variantesSkus.length} {variantesSkus.length > 1 ? 'combinaisons' : 'combinaison'}
                      </span>
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                      Gérez les stocks, prix et codes SKU individualisés par combinaison (Taille × Couleur × Matière...).
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={alignerTousLesPrix}
                      title="Copier le prix principal sur toutes les variantes"
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      Aligner prix ({prixForm || 0} F)
                    </button>
                    <button
                      type="button"
                      onClick={alignerTousLesStocks}
                      title="Copier la quantité en stock principale sur toutes les variantes"
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      Aligner stock ({stockQuantiteForm || 0})
                    </button>
                    <button
                      type="button"
                      onClick={regenererTousLesSkus}
                      title="Régénérer automatiquement les codes SKU"
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      🔢 SKU auto
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '8px 12px' }}>Combinaison</th>
                        <th style={{ padding: '8px 12px', width: 140 }}>Code SKU</th>
                        <th style={{ padding: '8px 12px', width: 120 }}>Prix (FCFA)</th>
                        <th style={{ padding: '8px 12px', width: 90 }}>Stock</th>
                        <th style={{ padding: '8px 12px', width: 150 }}>Code-barres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantesSkus.map((skuItem, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < variantesSkus.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(skuItem.attributs || {}).map(([cle, val]) => (
                                <span
                                  key={cle}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                                    borderRadius: 6, padding: '2px 6px', fontSize: 11, fontWeight: 600, color: '#1e293b'
                                  }}
                                >
                                  <span style={{ color: '#64748b', fontSize: 10 }}>{cle}:</span>
                                  <span>{val}</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              value={skuItem.sku ?? ''}
                              onChange={e => updateVarianteSku(idx, 'sku', e.target.value)}
                              placeholder="SKU-001"
                              style={{
                                width: '100%', padding: '6px 8px', fontSize: 11.5,
                                fontFamily: 'monospace', borderRadius: 6, border: '1px solid #cbd5e1',
                                background: '#ffffff', boxSizing: 'border-box'
                              }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              min={0}
                              value={skuItem.prix ?? ''}
                              onChange={e => updateVarianteSku(idx, 'prix', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder={prixForm || '0'}
                              style={{
                                width: '100%', padding: '6px 8px', fontSize: 12, fontWeight: 600,
                                borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box'
                              }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              min={0}
                              value={skuItem.stock_quantite ?? ''}
                              onChange={e => updateVarianteSku(idx, 'stock_quantite', e.target.value === '' ? 0 : Number(e.target.value))}
                              placeholder="0"
                              style={{
                                width: '100%', padding: '6px 8px', fontSize: 12, fontWeight: 700,
                                color: (skuItem.stock_quantite ?? 0) > 0 ? '#166534' : '#991b1b',
                                borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box'
                              }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input
                                type="text"
                                value={skuItem.code_barre ?? ''}
                                onChange={e => updateVarianteSku(idx, 'code_barre', e.target.value)}
                                placeholder="EAN13"
                                style={{
                                  flex: 1, padding: '6px 6px', fontSize: 11,
                                  borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => genererEanPourVariante(idx)}
                                title="Générer EAN13 aléatoire"
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: '5px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                              >
                                
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="npl-label-airy">{t('shop.descriptionLabel')}</label>
            <textarea
              name="description"
              rows={3}
              value={descForm}
              onChange={e => setDescForm(e.target.value)}
              className="npl-input-airy"
              style={{ minHeight: 80, resize: 'vertical' }}
              placeholder="Détails supplémentaires, conseils d'utilisation, garantie…"
            />
          </div>
        </div>
      )}

      {/* Modale scanner caméra (Scan Nom ou Scan EAN) */}
      {modalFormScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 460, border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                {scannerTarget === 'nom' ? 'Scan Nom Produit (Face avant emballage)' : 'Scanner Code-Barres EAN'}
              </h4>
              <button onClick={arreterFormScanner} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerStatus}</p>

            {scannerTarget === 'nom' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', background: '#000', position: 'relative', border: '1px solid #1e293b' }}>
                  {imageFligeeNom ? (
                    <img src={imageFligeeNom} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }} />
                  ) : (
                    <>
                      <video ref={videoFormRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed #38bdf8', borderRadius: 12, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)' }}>
                        <span style={{ background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
                          Placez l&apos;écriture du produit ici
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={capturerEtLireNomTexte}
                    disabled={ocrLoading}
                    style={{ flex: 1, background: '#0284c7', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 800, cursor: ocrLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {ocrLoading ? 'Analyse OCR en cours...' : (imageFligeeNom ? 'Reprendre la photo' : 'Capturer le nom du produit')}
                  </button>
                  {imageFligeeNom && (
                    <button
                      type="button"
                      onClick={() => setImageFligeeNom(null)}
                      style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Caméra active
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Nom extrait à enregistrer :</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={nomForm}
                      onChange={e => setNomForm(e.target.value)}
                      placeholder="Nom du produit..."
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #0284c7', fontSize: 13, fontWeight: 700, outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={arreterFormScanner}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Valider
                    </button>
                  </div>
                </div>

                {ocrDetections.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', background: '#f8fafc', padding: 8, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>Suggestions détectées (cliquez pour choisir) :</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ocrDetections.map((txt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNomForm(txt)}
                          style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', background: '#000', border: '1px solid #1e293b' }}>
                <div id="produit-form-scanner-reader" style={{ width: '100%', height: '100%' }} />
              </div>
            )}

            <button onClick={arreterFormScanner} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, padding: '9px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── BARRE D'ACTION STICKY EN BAS ─────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        bottom: 12,
        zIndex: 40,
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        border: '1.5px solid #cbd5e1',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
      }}>
        <div style={{ flex: 1 }}>
          <SubmitButton label={produit ? `💾 ${t('shop.saveProductBtn')}` : `Mettre en vente (10s)`} />
        </div>
        <button type="button" onClick={onCancel} style={{
          minHeight: 48, padding: '0 20px', background: '#f1f5f9', border: '1.5px solid #cbd5e1',
          borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#475569', cursor: 'pointer',
        }}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

export default ProduitForm
export { CaracteristiquesFields, ProduitForm }
