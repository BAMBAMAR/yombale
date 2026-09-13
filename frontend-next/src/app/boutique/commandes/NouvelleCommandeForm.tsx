'use client'

import React from 'react'
import { MessageCircle, FileText } from 'lucide-react'
import { fcfa } from '@/lib/format'

export interface ZoneLivraison {
  id: string
  nom: string
  prix: number
}

interface NouvelleCommandeFormProps {
  produitsCatalogue: any[]
  nomProduit: string
  setNomProduit: (n: string) => void
  produitId: string
  handleSelectProduit: (prod: any) => void
  prixUnitaire: string
  setPrixUnitaire: (p: string) => void
  quantite: number
  setQuantite: (q: number) => void
  zones: ZoneLivraison[]
  zoneId: string
  handleSelectZone: (id: string) => void
  fraisLivraison: string
  setFraisLivraison: (f: string) => void
  clientTelephone: string
  setClientTelephone: (t: string) => void
  clientNom: string
  setClientNom: (n: string) => void
  clientAdresse: string
  setClientAdresse: (a: string) => void
  note: string
  setNote: (n: string) => void
  methodePaiement: 'wave' | 'cash' | 'orange_money'
  setMethodePaiement: (m: 'wave' | 'cash' | 'orange_money') => void
  montantFrais: number
  montantTotal: number
  loading: boolean
  handleSubmit: (e: React.FormEvent) => void
}

export default function NouvelleCommandeForm({
  produitsCatalogue,
  nomProduit,
  setNomProduit,
  produitId,
  handleSelectProduit,
  prixUnitaire,
  setPrixUnitaire,
  quantite,
  setQuantite,
  zones,
  zoneId,
  handleSelectZone,
  fraisLivraison,
  setFraisLivraison,
  clientTelephone,
  setClientTelephone,
  clientNom,
  setClientNom,
  clientAdresse,
  setClientAdresse,
  note,
  setNote,
  methodePaiement,
  setMethodePaiement,
  montantFrais,
  montantTotal,
  loading,
  handleSubmit,
}: NouvelleCommandeFormProps) {
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Choix ou saisie de l'article */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
            Article ou Publication convenue *
          </label>
          {produitsCatalogue.length > 0 && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              ou choisir du catalogue :
            </span>
          )}
        </div>

        {produitsCatalogue.length > 0 && (
          <select
            value={produitId}
            onChange={e => {
              const sel = produitsCatalogue.find(p => p.id === e.target.value)
              handleSelectProduit(sel)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: 12.5,
              marginBottom: 6,
            }}
          >
            <option value="">-- Saisie libre ou sélectionner un produit --</option>
            {produitsCatalogue.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom} ({fcfa(Number(p.prix || 0))})
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          required
          placeholder="Ex: Robe en soie verte (Vidéo TikTok #3)..."
          value={nomProduit}
          onChange={e => setNomProduit(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            fontWeight: 600,
            color: '#0f172a',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Prix unitaire et Quantité */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            Prix unitaire convenu (FCFA) *
          </label>
          <input
            type="number"
            required
            min="100"
            step="50"
            placeholder="Ex: 15000"
            value={prixUnitaire}
            onChange={e => setPrixUnitaire(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              fontWeight: 800,
              color: '#C75B00',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            Quantité
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantite}
            onChange={e => setQuantite(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              fontWeight: 700,
              color: '#0f172a',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Livraison */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
          Livraison (optionnel)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: zones.length > 0 ? '1.5fr 1fr' : '1fr', gap: 10 }}>
          {zones.length > 0 && (
            <select
              value={zoneId}
              onChange={e => handleSelectZone(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: 12.5,
                color: '#0f172a',
              }}
            >
              <option value="">-- Choisir une zone --</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.nom} ({fcfa(z.prix)})
                </option>
              ))}
            </select>
          )}
          <input
            type="number"
            min="0"
            step="100"
            placeholder="Frais de livraison (FCFA)"
            value={fraisLivraison}
            onChange={e => setFraisLivraison(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 600,
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Téléphone WhatsApp et Nom du Client */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            Numéro WhatsApp du Client *
          </label>
          <input
            type="tel"
            required
            placeholder="Ex: 77 123 45 67"
            value={clientTelephone}
            onChange={e => setClientTelephone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1.5px solid #25D366',
              fontSize: 13,
              fontWeight: 700,
              color: '#0f172a',
              background: '#f0fdf4',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            Nom du Client
          </label>
          <input
            type="text"
            placeholder="Ex: Fatou"
            value={clientNom}
            onChange={e => setClientNom(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Adresse et Note */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>
            Adresse / Quartier
          </label>
          <input
            type="text"
            placeholder="Ex: Almadies, près de la pharmacie"
            value={clientAdresse}
            onChange={e => setClientAdresse(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <FileText size={12} />
            <span>Note (taille, couleur...)</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Taille XL, Rouge bordeaux"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Mode de règlement */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
          Mode de règlement
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { id: 'wave', label: 'Wave (Lien direct)' },
            { id: 'cash', label: 'Paiement livraison' },
            { id: 'orange_money', label: 'Orange Money' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethodePaiement(m.id as any)}
              style={{
                padding: '8px 6px',
                borderRadius: 8,
                border: methodePaiement === m.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: methodePaiement === m.id ? '#f0f9ff' : '#ffffff',
                color: methodePaiement === m.id ? '#0284c7' : '#475569',
                fontSize: 11.5,
                fontWeight: methodePaiement === m.id ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Récapitulatif Total */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: '1px solid #fed7aa',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: 11.5, color: '#9a3412', fontWeight: 700, display: 'block' }}>
            TOTAL DE LA COMMANDE
          </span>
          <span style={{ fontSize: 11, color: '#c2410c' }}>
            {quantite} article(s) {montantFrais > 0 ? `+ ${fcfa(montantFrais)} livr.` : ''}
          </span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#C75B00' }}>
          {fcfa(montantTotal)}
        </span>
      </div>

      {/* Bouton de Soumission */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: loading ? '#94a3b8' : '#25D366',
          color: '#ffffff',
          fontSize: 14.5,
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: loading ? 'none' : '0 4px 14px rgba(37, 211, 102, 0.35)',
          transition: 'background 0.15s ease',
        }}
      >
        <MessageCircle size={18} />
        {loading ? 'Génération de la commande et du lien...' : 'Créer la commande & Envoyer sur WhatsApp'}
      </button>
    </form>
  )
}
