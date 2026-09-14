'use client'

import React from 'react'
import { CaracChips } from '@/components/CaracChips'
import { champVisibleSelonVariante, type TypeVarianteId } from '../boutiqueHelpers'
import {
  inputStyle,
  labelStyle,
  ETATS_PRODUIT,
  GENRES_MODE,
  PLATEFORMES,
  POUR_QUI,
  COULEURS_PALETTE,
  TAILLES_VETEMENT,
  STOCKAGES_RAM,
  MARQUES_MODE,
  MARQUES_SMARTPHONE,
  MARQUES_INFORMATIQUE,
  MARQUES_TV_ELECTRO,
  MARQUES_AUTO,
  MARQUES_MAISON,
  MATIERES_MODE,
  MATIERES_MAISON,
  TYPES_ARTICLE_MAISON,
  TYPES_ARTICLE_TV_ELECTRO,
  CARBURANTS,
  CONDITIONNEMENTS,
  TYPES_BEAUTE,
  MARQUES_PARFUM,
  CONCENTRATIONS_PARFUM,
  FAMILLES_OLFACTIVES,
  MARQUES_OPTIQUE,
  TYPES_LUNETTES,
  FORMES_MONTURE,
  PROTECTIONS_UV,
} from './constants'

export function CaracField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required: req = false,
}: {
  label: string
  name: string
  value: string
  onChange: (k: string, v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {req && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(name, e.target.value)}
        style={inputStyle}
        placeholder={placeholder}
        required={req}
      />
    </div>
  )
}

export function CaracSelect({
  label,
  name,
  value,
  onChange,
  options,
  required: req = false,
}: {
  label: string
  name: string
  value: string
  onChange: (k: string, v: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {req && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(name, e.target.value)}
        style={inputStyle}
        required={req}
      >
        <option value="">Choisir…</option>
        {options.map(o => (
          <option key={o} value={o.toLowerCase()}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

export function CaracteristiquesFields({
  slug,
  values,
  onChange,
  typesVarianteActifs,
}: {
  slug: string
  values: Record<string, string>
  onChange: (k: string, v: string) => void
  typesVarianteActifs: Set<TypeVarianteId>
}) {
  const f = (k: string) => values[k] ?? ''

  if (slug === 'smartphones')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_SMARTPHONE} />
        <CaracField label="Modèle" name="modele" value={f('modele')} onChange={onChange} placeholder="iPhone 14 Pro…" />
        {champVisibleSelonVariante('stockage', typesVarianteActifs) && (
          <CaracChips label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} suggestions={STOCKAGES_RAM} />
        )}
        <CaracField label="RAM" name="ram" value={f('ram')} onChange={onChange} placeholder="8 Go…" />
        {champVisibleSelonVariante('couleur', typesVarianteActifs) && (
          <CaracChips label="Couleur" name="couleur" value={f('couleur')} onChange={onChange} suggestions={COULEURS_PALETTE.map(c => c.nom)} />
        )}
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'informatique')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_INFORMATIQUE} />
        <CaracField label="Modèle" name="modele" value={f('modele')} onChange={onChange} placeholder="XPS 15…" />
        <CaracField label="Processeur" name="processeur" value={f('processeur')} onChange={onChange} placeholder="Intel i7, AMD Ryzen…" />
        <CaracField label="RAM" name="ram" value={f('ram')} onChange={onChange} placeholder="16 Go…" />
        {champVisibleSelonVariante('stockage', typesVarianteActifs) && (
          <CaracChips label="Stockage" name="stockage" value={f('stockage')} onChange={onChange} suggestions={STOCKAGES_RAM} />
        )}
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'tv-electro')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_TV_ELECTRO} />
        <CaracField label="Modèle" name="modele" value={f('modele')} onChange={onChange} placeholder="55QN90B…" />
        <CaracChips label="Type" name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_ARTICLE_TV_ELECTRO} />
        <CaracField label="Taille/Capa." name="taille" value={f('taille')} onChange={onChange} placeholder="55 pouces, 300 L…" />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'auto-moto')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_AUTO} />
        <CaracField label="Modèle" name="modele" value={f('modele')} onChange={onChange} placeholder="Corolla, R1…" />
        <div>
          <label style={labelStyle}>Année</label>
          <input
            type="number"
            min={1970}
            max={2026}
            value={f('annee')}
            onChange={e => onChange('annee', e.target.value)}
            style={inputStyle}
            placeholder="2020"
          />
        </div>
        <CaracField label="Kilométrage" name="kilometrage" value={f('kilometrage')} onChange={onChange} placeholder="45 000 km" />
        <CaracChips label="Carburant" name="carburant" value={f('carburant')} onChange={onChange} suggestions={CARBURANTS} />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'mode')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_MODE} />
        {champVisibleSelonVariante('taille', typesVarianteActifs) && (
          <CaracChips label="Taille" name="taille" value={f('taille')} onChange={onChange} suggestions={TAILLES_VETEMENT} />
        )}
        <CaracChips label="Genre" name="genre" value={f('genre')} onChange={onChange} suggestions={GENRES_MODE} allowAutre={false} />
        <CaracChips label="Matière" name="matiere" value={f('matiere')} onChange={onChange} suggestions={MATIERES_MODE} />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'maison')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Type d'article" name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_ARTICLE_MAISON} />
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_MAISON} />
        <CaracChips label="Matière" name="matiere" value={f('matiere')} onChange={onChange} suggestions={MATIERES_MAISON} />
        <CaracField label="Dimensions" name="dimensions" value={f('dimensions')} onChange={onChange} placeholder="120×80×75 cm" />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'jeux')
    return (
      <div className="bq-form-grid-2">
        <CaracSelect label="Plateforme" name="plateforme" value={f('plateforme')} onChange={onChange} options={PLATEFORMES} />
        <CaracField label="Éditeur" name="editeur" value={f('editeur')} onChange={onChange} placeholder="EA, Ubisoft…" />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'alimentation')
    return (
      <div className="bq-form-grid-2">
        <CaracField label="Poids / Quantité" name="poids_quantite" value={f('poids_quantite')} onChange={onChange} placeholder="500g, 1L, 12 unités…" />
        <CaracChips label="Conditionnement" name="conditionnement" value={f('conditionnement')} onChange={onChange} suggestions={CONDITIONNEMENTS} />
        <CaracField label="Date de péremption" name="date_peremption" value={f('date_peremption')} onChange={onChange} placeholder="12/2025" />
        <CaracField label="Origine / Marque" name="marque" value={f('marque')} onChange={onChange} placeholder="Dakar Produits…" />
      </div>
    )

  if (slug === 'beaute')
    return (
      <div className="bq-form-grid-2">
        <CaracField label="Marque" name="marque" value={f('marque')} onChange={onChange} placeholder="L'Oréal, Nivea…" />
        <CaracChips label="Type" name="type_produit" value={f('type_produit')} onChange={onChange} suggestions={TYPES_BEAUTE} />
        <CaracChips label="Pour qui" name="pour_qui" value={f('pour_qui')} onChange={onChange} suggestions={POUR_QUI} allowAutre={false} />
        <CaracField label="Contenance" name="contenance" value={f('contenance')} onChange={onChange} placeholder="200 ml, 50 g…" />
      </div>
    )

  if (slug === 'parfum')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_PARFUM} />
        <CaracChips label="Concentration" name="concentration" value={f('concentration')} onChange={onChange} suggestions={CONCENTRATIONS_PARFUM} />
        <CaracChips label="Famille olfactive" name="famille_olfactive" value={f('famille_olfactive')} onChange={onChange} suggestions={FAMILLES_OLFACTIVES} />
        <CaracChips label="Genre" name="pour_qui" value={f('pour_qui')} onChange={onChange} suggestions={POUR_QUI} allowAutre={false} />
        <CaracField label="Contenance" name="contenance" value={f('contenance')} onChange={onChange} placeholder="100 ml, 50 ml, 200 ml…" />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'optique')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Marque" name="marque" value={f('marque')} onChange={onChange} suggestions={MARQUES_OPTIQUE} />
        <CaracChips label="Type de lunettes" name="type_article" value={f('type_article')} onChange={onChange} suggestions={TYPES_LUNETTES} />
        <CaracChips label="Forme monture" name="forme_monture" value={f('forme_monture')} onChange={onChange} suggestions={FORMES_MONTURE} />
        <CaracChips label="Protection verres" name="protection_uv" value={f('protection_uv')} onChange={onChange} suggestions={PROTECTIONS_UV} />
        <CaracChips label="Matière monture" name="matiere" value={f('matiere')} onChange={onChange} suggestions={['Acétate', 'Métal', 'Titane', 'Plastique injecté', 'Bois']} />
        <CaracSelect label="État" name="etat" value={f('etat')} onChange={onChange} options={ETATS_PRODUIT} />
      </div>
    )

  if (slug === 'services')
    return (
      <div className="bq-form-grid-2">
        <CaracChips label="Type de service" name="type_service" value={f('type_service')} onChange={onChange} suggestions={['Plomberie', 'Cours', 'Transport', 'Ménage', 'Réparation']} />
        <CaracField label="Zone d'intervention" name="zone_intervention" value={f('zone_intervention')} onChange={onChange} placeholder="Dakar, Plateau…" />
        <CaracField label="Durée / Fréquence" name="duree" value={f('duree')} onChange={onChange} placeholder="1h, par séance…" />
        <CaracField label="Disponibilité" name="disponibilite" value={f('disponibilite')} onChange={onChange} placeholder="Lun-Ven 8h-18h…" />
      </div>
    )

  return null
}
