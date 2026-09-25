'use client'

import React, { useState } from 'react'
import {
  Building2,
  Plus,
  AlertTriangle,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { BienOption } from './ModalNouveauLocataire'
import { BailData } from './ModalEditerLocataire'

interface TabBiensLocataireProps {
  slug: string
  locataireId: string
  bauxList: BailData[]
  biensDispo: BienOption[]
  onBailCreated: () => void
}

export function TabBiensLocataire({
  slug,
  locataireId,
  bauxList,
  biensDispo,
  onBailCreated,
}: TabBiensLocataireProps) {
  const [showAjoutBien, setShowAjoutBien] = useState(false)
  const [nouveauBail, setNouveauBail] = useState({
    bien_id: '',
    loyer_mensuel: '',
    charges: '0',
    depot_garantie: '',
    date_debut: new Date().toISOString().split('T')[0],
    duree_mois: '12',
    jour_echeance: '5',
  })
  const [savingBail, setSavingBail] = useState(false)
  const [errorBail, setErrorBail] = useState<string | null>(null)

  async function handleAssocierNouveauBien(e: React.FormEvent) {
    e.preventDefault()
    if (!nouveauBail.bien_id) {
      setErrorBail('Veuillez sélectionner un bien disponible.')
      return
    }
    if (!nouveauBail.loyer_mensuel || parseFloat(nouveauBail.loyer_mensuel) <= 0) {
      setErrorBail('Le loyer mensuel doit être supérieur à zéro.')
      return
    }

    try {
      setSavingBail(true)
      setErrorBail(null)

      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          bien_id: nouveauBail.bien_id,
          locataire_id: locataireId,
          date_debut: nouveauBail.date_debut,
          duree_mois: parseInt(nouveauBail.duree_mois, 10) || 12,
          loyer_mensuel: parseFloat(nouveauBail.loyer_mensuel),
          charges: parseFloat(nouveauBail.charges) || 0,
          depot_garantie: parseFloat(nouveauBail.depot_garantie) || 0,
          jour_echeance: parseInt(nouveauBail.jour_echeance, 10) || 5,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création du bail.')
      }

      setShowAjoutBien(false)
      setNouveauBail({
        bien_id: '',
        loyer_mensuel: '',
        charges: '0',
        depot_garantie: '',
        date_debut: new Date().toISOString().split('T')[0],
        duree_mois: '12',
        jour_echeance: '5',
      })
      onBailCreated()
    } catch (err: unknown) {
      setErrorBail(err instanceof Error ? err.message : 'Erreur lors de l\'association du bien.')
    } finally {
      setSavingBail(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Biens actuellement sous contrat pour ce locataire
        </div>
        {!showAjoutBien && (
          <button
            type="button"
            onClick={() => setShowAjoutBien(true)}
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Associer un autre bien</span>
          </button>
        )}
      </div>

      {errorBail && (
        <div
          style={{
            padding: '10px 14px',
            background: '#FEE2E2',
            color: '#DC2626',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <AlertCircle size={16} />
          {errorBail}
        </div>
      )}

      {/* Formulaire d'ajout d'un nouveau bien */}
      {showAjoutBien && (
        <div
          style={{
            background: '#FAF8F5',
            border: '1.5px dashed var(--accent, #C75B00)',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
              Nouveau contrat de location pour ce locataire
            </div>
            <button
              type="button"
              onClick={() => setShowAjoutBien(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleAssocierNouveauBien}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Sélectionner le bien disponible *
              </label>
              <select
                required
                value={nouveauBail.bien_id}
                onChange={e => {
                  const bId = e.target.value
                  const sel = biensDispo.find(b => b.id === bId)
                  setNouveauBail({
                    ...nouveauBail,
                    bien_id: bId,
                    loyer_mensuel: sel?.prix_location ? String(sel.prix_location) : nouveauBail.loyer_mensuel,
                  })
                }}
                className="form-select"
                style={{ width: '100%', padding: '8px 10px', fontSize: 12.5 }}
              >
                <option value="">-- Choisir un bien du portefeuille --</option>
                {biensDispo.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} ({b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} F` : 'Libre'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Loyer mensuel (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  value={nouveauBail.loyer_mensuel}
                  onChange={e => setNouveauBail({ ...nouveauBail, loyer_mensuel: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12.5 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Charges (FCFA)
                </label>
                <input
                  type="number"
                  value={nouveauBail.charges}
                  onChange={e => setNouveauBail({ ...nouveauBail, charges: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12.5 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Date de début de bail
                </label>
                <input
                  type="date"
                  value={nouveauBail.date_debut}
                  onChange={e => setNouveauBail({ ...nouveauBail, date_debut: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12.5 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Jour d&apos;échéance mensuel
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={nouveauBail.jour_echeance}
                  onChange={e => setNouveauBail({ ...nouveauBail, jour_echeance: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', fontSize: 12.5 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowAjoutBien(false)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingBail}
                className="btn-npl"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: 'var(--price, #0A5C36)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: savingBail ? 'not-allowed' : 'pointer',
                }}
              >
                <Check size={14} />
                {savingBail ? 'Association...' : 'Valider et créer le bail'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des baux existants */}
      {bauxList.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            background: '#FAF8F5',
            borderRadius: 10,
            border: '1px solid var(--border, #E8DDD2)',
            color: '#64748B',
          }}
        >
          <Building2 size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
            Aucun bien actuellement sous bail
          </div>
          <p style={{ fontSize: 12.5, margin: '4px 0 12px' }}>
            Ce locataire n&apos;a pas encore de bail actif rattaché.
          </p>
          {!showAjoutBien && (
            <button
              type="button"
              onClick={() => setShowAjoutBien(true)}
              style={{
                padding: '7px 14px',
                borderRadius: 6,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Associer un premier bien
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bauxList.map((bx, idx) => (
            <div
              key={bx.bail_id || idx}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Building2 size={15} color="var(--accent, #C75B00)" />
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
                      {bx.bien_titre}
                    </span>
                  </div>
                  {(bx.quartier || bx.ville) && (
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {[bx.quartier, bx.ville].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: bx.statut === 'actif' ? '#DCFCE7' : '#F1F5F9',
                    color: bx.statut === 'actif' ? '#166534' : '#64748B',
                  }}
                >
                  {bx.statut === 'actif' ? 'Bail actif' : bx.statut}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: '1px solid #F1EBE4',
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Loyer</span>
                  <span style={{ fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                    {Number(bx.loyer_mensuel).toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Début</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {bx.date_debut ? new Date(bx.date_debut).toLocaleDateString('fr-FR') : '-'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Impayés</span>
                  {Number(bx.nb_impayes || 0) > 0 ? (
                    <span style={{ fontWeight: 800, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <AlertTriangle size={11} /> {bx.nb_impayes} retard(s)
                    </span>
                  ) : (
                    <span style={{ fontWeight: 600, color: '#166534' }}>À jour</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
