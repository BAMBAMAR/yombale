'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Repeat, Plus, Play, Pause, XCircle, ShoppingBag, MessageCircle, Calendar, Phone, MapPin, X } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface Abonnement {
  id: string
  client_nom: string
  client_telephone: string
  client_adresse: string | null
  frequence: 'hebdomadaire' | 'bimensuel' | 'mensuel'
  statut: 'actif' | 'pause' | 'annule'
  montant_total: number
  items_json: any[]
  prochain_renouvellement: string
  notes: string | null
  created_at: string
}

interface AbonnementsManagerProps {
  boutiqueId: string
  boutiqueNom?: string
  token: string
}

export default function AbonnementsManager({ boutiqueId, boutiqueNom = 'Ma Boutique', token }: AbonnementsManagerProps) {
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [clientNom, setClientNom] = useState('')
  const [clientTelephone, setClientTelephone] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [frequence, setFrequence] = useState<'hebdomadaire' | 'bimensuel' | 'mensuel'>('hebdomadaire')
  const [montantTotal, setMontantTotal] = useState('')
  const [notes, setNotes] = useState('')
  const [datePremiereLivraison, setDatePremiereLivraison] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const fetchAbonnements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/abonnements`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.abonnements) {
        setAbonnements(data.abonnements)
      }
    } catch (err) {
      console.warn('[ABONNEMENTS FETCH ERR]', err)
    } finally {
      setLoading(false)
    }
  }, [backendUrl, boutiqueId, token])

  useEffect(() => {
    if (boutiqueId && token) {
      fetchAbonnements()
    }
  }, [boutiqueId, token, fetchAbonnements])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientNom.trim() || !clientTelephone.trim()) {
      setErrorMsg('Le nom et le téléphone du client sont obligatoires')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    const payload = {
      client_nom: clientNom.trim(),
      client_telephone: clientTelephone.trim(),
      client_adresse: clientAdresse.trim() || null,
      frequence,
      montant_total: parseFloat(montantTotal) || 0,
      notes: notes.trim() || null,
      date_premiere_livraison: datePremiereLivraison || undefined
    }

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/abonnements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setIsModalOpen(false)
        setClientNom('')
        setClientTelephone('')
        setClientAdresse('')
        setMontantTotal('')
        setNotes('')
        fetchAbonnements()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      console.warn('[ABONNEMENT SAVE ERR]', err)
      setErrorMsg('Erreur de communication avec le serveur')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatut = async (aboId: string, newStatut: 'actif' | 'pause' | 'annule') => {
    try {
      setActionLoadingId(aboId)
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/abonnements/${aboId}/statut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ statut: newStatut })
      })
      if (res.ok) {
        setAbonnements(prev => prev.map(a => a.id === aboId ? { ...a, statut: newStatut } : a))
      }
    } catch (err) {
      console.warn('[ABO UPDATE STATUT ERR]', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleGenererCommande = async (abo: Abonnement) => {
    try {
      setActionLoadingId(abo.id)
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/abonnements/${abo.id}/generer-commande`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.commande) {
        alert(`Commande générée avec succès : ${data.commande.reference} (${fcfa(data.commande.montant_total)})`)
        fetchAbonnements()
      }
    } catch (err) {
      console.warn('[ABO GEN CMD ERR]', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRelanceWa = (abo: Abonnement) => {
    const cleanTel = (abo.client_telephone || '').replace(/\D/g, '')
    const targetTel = cleanTel.length === 9 ? '221' + cleanTel : cleanTel
    const dateStr = new Date(abo.prochain_renouvellement).toLocaleDateString('fr-FR')
    const msg = `Bonjour ${abo.client_nom} ! Votre prochaine livraison d'abonnement auprès de *${boutiqueNom}* est programmée pour le *${dateStr}* (Montant : ${fcfa(abo.montant_total)}).\n\nConfirmez-vous la livraison à l'adresse suivante : ${abo.client_adresse || 'adresse habituelle'} ?`
    window.open(`https://wa.me/${targetTel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const filtered = abonnements.filter(a => !filterStatut || a.statut === filterStatut)

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Repeat size={22} color="#0A5C36" />
            Commandes Récurrentes & Abonnements
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Automatisez les livraisons régulières de denrées, eau minérale, paniers bio ou services récurrents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            background: '#0A5C36',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(10, 92, 54, 0.25)'
          }}
        >
          <Plus size={16} />
          Nouvel Abonnement
        </button>
      </div>

      {/* Filtres de statut */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'actif', 'pause', 'annule'].map(st => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatut(st)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: filterStatut === st ? '1.5px solid #0A5C36' : '1px solid #cbd5e1',
              background: filterStatut === st ? '#f0fdf4' : '#ffffff',
              color: filterStatut === st ? '#0A5C36' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {st === '' ? 'Tous les contrats' : st.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Chargement des abonnements...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 36, textAlign: 'center' }}>
          <Repeat size={32} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
          <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Aucun abonnement enregistré</p>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: '#64748b' }}>
            Fidélisez vos clients en leur proposant un approvisionnement automatique récurrent.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#0A5C36',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Créer un premier contrat
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(abo => (
            <div
              key={abo.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A' }}>{abo.client_nom}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: abo.statut === 'actif' ? '#dcfce7' : abo.statut === 'pause' ? '#fef3c7' : '#f1f5f9',
                      color: abo.statut === 'actif' ? '#166534' : abo.statut === 'pause' ? '#92400e' : '#64748b'
                    }}
                  >
                    {abo.statut.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                    {abo.frequence.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} /> {abo.client_telephone}
                  </span>
                  {abo.client_adresse && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {abo.client_adresse}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#1C2B4A' }}>
                    <Calendar size={13} /> Prochain cycle : {new Date(abo.prochain_renouvellement).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0A5C36' }}>{fcfa(abo.montant_total)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>par cycle</div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleRelanceWa(abo)}
                    title="Envoyer confirmation WhatsApp"
                    style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#25D366', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === abo.id || abo.statut !== 'actif'}
                    onClick={() => handleGenererCommande(abo)}
                    style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                  >
                    <ShoppingBag size={14} /> Générer commande
                  </button>

                  {abo.statut === 'actif' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatut(abo.id, 'pause')}
                      title="Mettre en pause"
                      style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #fde68a', background: '#fef3c7', color: '#92400e', cursor: 'pointer' }}
                    >
                      <Pause size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatut(abo.id, 'actif')}
                      title="Réactiver"
                      style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', cursor: 'pointer' }}
                    >
                      <Play size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, maxWidth: 500, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1C2B4A' }}>Nouveau Contrat d&apos;Abonnement</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Nom du client *</label>
                <input
                  type="text"
                  placeholder="Ex: Awa Ndiaye"
                  value={clientNom}
                  onChange={e => setClientNom(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Téléphone client (WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="Ex: 77 123 45 67"
                  value={clientTelephone}
                  onChange={e => setClientTelephone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Adresse de livraison récurrente</label>
                <input
                  type="text"
                  placeholder="Ex: Mermoz, Immeuble A, Appart 4"
                  value={clientAdresse}
                  onChange={e => setClientAdresse(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Fréquence de livraison</label>
                  <select
                    value={frequence}
                    onChange={e => setFrequence(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="hebdomadaire">Hebdomadaire (7j)</option>
                    <option value="bimensuel">Bi-mensuel (14j)</option>
                    <option value="mensuel">Mensuel (30j)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Montant total par cycle (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 15000"
                    value={montantTotal}
                    onChange={e => setMontantTotal(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Première date de livraison (optionnelle)</label>
                <input
                  type="date"
                  value={datePremiereLivraison}
                  onChange={e => setDatePremiereLivraison(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Notes / Composition du panier</label>
                <textarea
                  rows={2}
                  placeholder="Ex: 2 packs d'eau + 1 sac de riz 5kg..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#0A5C36', color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Création...' : 'Créer l\'abonnement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
