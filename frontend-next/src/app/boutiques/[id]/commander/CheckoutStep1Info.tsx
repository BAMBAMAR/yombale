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
  // Au moins 9 chiffres (formats « +221 77 123 45 67 », « 77 123 45 67 » acceptés)
  const canProceed = nom.trim().length >= 2 && tel.replace(/\D/g, '').length >= 9

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
          {zones.map((z) => {
            const isRetrait = z.id === 'retrait-boutique' || z.nom.toLowerCase().includes('retrait')
            const isAConvenir = z.id === 'a_convenir' || z.id === 'a-convenir' || z.nom.toLowerCase().includes('convenir')
            const labelPrix = isAConvenir ? '' : isRetrait ? ' — Gratuit' : ` — ${z.prix.toLocaleString('fr-FR')} FCFA`
            return (
              <option key={z.id} value={z.id}>
                {z.nom}{labelPrix}
              </option>
            )
          })}
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

      {/* AUD-168 : le motif du bouton inactif est dit, pas laissé à deviner */}
      {!canProceed && (
        <p role="status" style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text2, #5A4E42)' }}>
          Renseignez votre nom et un numéro de téléphone (9 chiffres) pour continuer.
        </p>
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
