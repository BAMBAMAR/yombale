'use client'

import React, { useState, useEffect } from 'react'
import { fcfa } from '@/lib/format'

export interface ClientFidelite {
  id: string
  telephone: string
  nom: string
  points_solde: number
  cagnotte_fcfa: number
  nb_visites: number
  total_depense: number
  tampons_actuels: number
  rang_fidelite: string
}

interface PosFideliteModalProps {
  boutiqueId: string
  clientSelectionne: ClientFidelite | null
  totalPanier: number
  cagnotteDeduite: number
  onSelectClient: (client: ClientFidelite | null) => void
  onDeduireCagnotte: (montant: number) => void
  onClose: () => void
}

export default function PosFideliteModal({
  boutiqueId,
  clientSelectionne,
  totalPanier,
  cagnotteDeduite,
  onSelectClient,
  onDeduireCagnotte,
  onClose,
}: PosFideliteModalProps) {
  const [recherche, setRecherche] = useState('')
  const [clients, setClients] = useState<ClientFidelite[]>([])
  const [loading, setLoading] = useState(false)
  const [modeEnrolement, setModeEnrolement] = useState(false)

  // Formulaire enrôlement
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouveauTel, setNouveauTel] = useState('')
  const [enroling, setEnroling] = useState(false)

  const chargerClients = async (q: string = '') => {
    if (!boutiqueId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/fidelite/rechercher?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (e) {
      console.error('[FIDELITE LOAD ERR]', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerClients(recherche)
  }, [boutiqueId, recherche])

  const handleEnroler = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouveauNom.trim() || !nouveauTel.trim()) return
    setEnroling(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/fidelite/enroler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nouveauNom, telephone: nouveauTel }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.client) {
          onSelectClient(data.client)
          onClose()
        }
      } else {
        alert('Erreur lors de l’enrôlement fidélité.')
      }
    } catch (e) {
      console.error('[ENROLER ERR]', e)
    } finally {
      setEnroling(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1.5px solid #bfdbfe',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⭐</span> Programme de Fidélité Client
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 32, height: 32, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Si un client est déjà sélectionné : Affichage de sa carte et déduction cagnotte */}
        {clientSelectionne && (
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', color: '#ffffff', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 20px rgba(30,58,95,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 800, textTransform: 'uppercase' }}>
                  Carte Fidélité Active ({clientSelectionne.rang_fidelite.toUpperCase()})
                </span>
                <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 900 }}>{clientSelectionne.nom}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#cbd5e1' }}>📱 {clientSelectionne.telephone}</p>
              </div>
              <button
                type="button"
                onClick={() => { onSelectClient(null); onDeduireCagnotte(0); }}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Changer
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
              <div>
                <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Cagnotte Disponible</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#4ade80' }}>{fcfa(clientSelectionne.cagnotte_fcfa)}</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Tampons Récoltés</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>
                  {clientSelectionne.tampons_actuels} / 10 🎫
                </span>
              </div>
            </div>

            {/* Boutons d'utilisation de la cagnotte */}
            {clientSelectionne.cagnotte_fcfa > 0 && totalPanier > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {cagnotteDeduite === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const deductionMax = Math.min(totalPanier, clientSelectionne.cagnotte_fcfa)
                      onDeduireCagnotte(deductionMax)
                    }}
                    style={{ flex: 1, padding: '10px', background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
                  >
                    💰 Déduire la cagnotte (-{fcfa(Math.min(totalPanier, clientSelectionne.cagnotte_fcfa))})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeduireCagnotte(0)}
                    style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                  >
                    Annuler déduction ({fcfa(cagnotteDeduite)})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recherche client fidélité */}
        {!clientSelectionne && !modeEnrolement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                autoFocus
                placeholder="🔍 Numéro WhatsApp (ex: 77 123 45 67) ou Nom..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setModeEnrolement(true)}
                style={{ padding: '0 14px', background: '#C75B00', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Nouveau Client
              </button>
            </div>

            {/* Liste des résultats */}
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: 20 }}>Recherche des clients...</p>
              ) : clients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Aucun client fidélité trouvé</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNouveauTel(recherche)
                      setModeEnrolement(true)
                    }}
                    style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Créer la carte pour &quot;{recherche}&quot; →
                  </button>
                </div>
              ) : (
                clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { onSelectClient(c); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', transition: 'background 0.12s' }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{c.nom}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>📱 {c.telephone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#16a34a', display: 'block' }}>{fcfa(c.cagnotte_fcfa)}</span>
                      <span style={{ fontSize: 10.5, color: '#d97706', fontWeight: 700 }}>{c.tampons_actuels}/10 tampons</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Formulaire d'enrôlement rapide en 10 secondes */}
        {modeEnrolement && (
          <form onSubmit={handleEnroler} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>⚡ Enrôlement Express Carte Fidélité</h4>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Nom complet *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Awa Diop"
                value={nouveauNom}
                onChange={(e) => setNouveauNom(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Téléphone WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="Ex: 77 123 45 67"
                value={nouveauTel}
                onChange={(e) => setNouveauTel(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setModeEnrolement(false)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={enroling}
                style={{ flex: 1.5, padding: '10px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}
              >
                {enroling ? 'Création...' : '✓ Créer & Sélectionner'}
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
