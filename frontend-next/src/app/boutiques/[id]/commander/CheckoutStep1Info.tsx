'use client'

import React from 'react'
import { User, Phone, MapPin, Truck, ChevronRight } from 'lucide-react'
import type { Zone } from './types'

interface CheckoutStep1InfoProps {
  nom: string
  setNom: (val: string) => void
  tel: string
  setTel: (val: string) => void
  adresse: string
  setAdresse: (val: string) => void
  zoneId: string
  setZoneId: (val: string) => void
  zones: Zone[]
  note?: string
  setNote?: (val: string) => void
  onNext: () => void
}

export default function CheckoutStep1Info({
  nom,
  setNom,
  tel,
  setTel,
  adresse,
  setAdresse,
  zoneId,
  setZoneId,
  zones,
  note,
  setNote,
  onNext,
}: CheckoutStep1InfoProps) {
  const canProceed = nom.trim().length >= 2 && tel.trim().length >= 9

  return (
    <div className="checkout-step-container">
      <div>
        <div className="checkout-step-badge">Étape 1 sur 3</div>
        <h3 className="checkout-step-title">Vos coordonnées de livraison</h3>
      </div>

      <div className="checkout-field">
        <label htmlFor="checkout-nom">
          <User size={15} /> Nom complet *
        </label>
        <input
          id="checkout-nom"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: Fatou Ndiaye"
          autoComplete="name"
          required
        />
      </div>

      <div className="checkout-field">
        <label htmlFor="checkout-tel">
          <Phone size={15} /> Numéro de téléphone / WhatsApp *
        </label>
        <input
          id="checkout-tel"
          type="tel"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          placeholder="Ex: 77 123 45 67"
          autoComplete="tel"
          required
        />
      </div>

      <div className="checkout-field">
        <label htmlFor="checkout-adresse">
          <MapPin size={15} /> Adresse ou repère de livraison
        </label>
        <input
          id="checkout-adresse"
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Ex: Mermoz, en face de la pharmacie"
          autoComplete="street-address"
        />
      </div>

      <div className="checkout-field">
        <label htmlFor="checkout-zone">
          <Truck size={15} /> Zone de livraison
        </label>
        <select
          id="checkout-zone"
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nom} — {z.prix > 0 ? `${z.prix.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
            </option>
          ))}
        </select>
      </div>

      {setNote && (
        <div className="checkout-field">
          <label htmlFor="checkout-note">Instructions particulières (facultatif)</label>
          <input
            id="checkout-note"
            type="text"
            value={note || ''}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Appeler à l'arrivée"
          />
        </div>
      )}

      <button
        type="button"
        className="btn-npl btn-npl-lg btn-npl-primary"
        style={{ width: '100%', marginTop: 8 }}
        disabled={!canProceed}
        onClick={onNext}
      >
        <span>Continuer vers le paiement</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
