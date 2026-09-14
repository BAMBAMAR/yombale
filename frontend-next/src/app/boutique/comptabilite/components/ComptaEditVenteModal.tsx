'use client'

import React, { useState, useTransition } from 'react'
import { Vente } from '../types'
import { updateVente } from '../../actions'
import { fcfa, inputStyle, labelStyle } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaEditVenteModalProps {
  vente: Vente
  boutiqueId: string
  onClose: () => void
  onDone: () => void
}

export function ComptaEditVenteModal({ vente, boutiqueId, onClose, onDone }: ComptaEditVenteModalProps) {
  const { t } = useTranslation()
  const [nomProduit, setNomProduit] = useState(vente.nom_produit)
  const [quantite, setQuantite] = useState(vente.quantite)
  const [prix, setPrix] = useState(vente.prix_unitaire)
  const [frais, setFrais] = useState(vente.frais_livraison)
  const [clientNom, setClientNom] = useState(vente.client_nom ?? '')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState(vente.methode_paiement)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await updateVente(boutiqueId, vente.id, {
        nom_produit: nomProduit, quantite, prix_unitaire: prix,
        frais_livraison: frais, client_nom: clientNom || undefined,
        client_telephone: clientTel || undefined, methode_paiement: paiement,
      })
      if (res.error) { setError(res.error); return }
      onDone()
      onClose()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{t('shop.editSaleModalTitle')}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>
        {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
        <div>
          <label style={labelStyle}>{t('shop.articleDesignationLabel')}</label>
          <input value={nomProduit} onChange={e => setNomProduit(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>{t('shop.quantityLabel')}</label><input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('shop.unitPriceLabel')}</label><input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} /></div>
        </div>
        <div>
          <label style={labelStyle}>{t('shop.deliveryFeeLabel')}</label>
          <input type="number" min={0} value={frais} onChange={e => setFrais(Number(e.target.value))} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div><label style={{ ...labelStyle, marginBottom: 4, display: 'block' }}>{t('shop.customerFullNameLabel')} <span style={{ fontWeight: 400, color: '#64748b' }}>({t('common.optional')})</span></label><input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder="Client comptoir" /></div>
          <div><label style={{ ...labelStyle, marginBottom: 4, display: 'block' }}>{t('shop.customerPhoneLabel')} <span style={{ fontWeight: 400, color: '#64748b' }}>({t('common.optional')})</span></label><input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" /></div>
        </div>
        <div>
          <label style={labelStyle}>{t('shop.paymentModePrompt')}</label>
          <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
            <option value="cash">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="virement">Virement</option>
          </select>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>
          {t('shop.newTotalLabel')} : {fcfa(prix * quantite + frais)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} style={{ flex: 1, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>{t('common.save')}</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  )
}
