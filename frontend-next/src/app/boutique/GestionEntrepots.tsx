'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Warehouse, Plus, MapPin, Phone, User, CheckCircle2, Star, Edit, Package, Boxes, AlertCircle, X, RefreshCw } from 'lucide-react'

export interface Entrepot {
  id: string
  boutique_id: string
  nom: string
  adresse: string | null
  ville: string
  responsable: string | null
  telephone: string | null
  est_defaut: boolean
  actif: boolean
  created_at: string
}

export interface StockEntrepot {
  id: string
  produit_id: string
  produit_nom: string
  entrepot_id: string
  entrepot_nom: string
  quantite: number
  seuil_alerte: number
}

interface ProduitSimple {
  id: string
  nom: string
  stock_quantite: number
}

export default function GestionEntrepots({ boutiqueId }: { boutiqueId: string }) {
  const [entrepots, setEntrepots] = useState<Entrepot[]>([])
  const [stocks, setStocks] = useState<StockEntrepot[]>([])
  const [produits, setProduits] = useState<ProduitSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modale Ajout / Édition
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('Dakar')
  const [responsable, setResponsable] = useState('')
  const [telephone, setTelephone] = useState('')
  const [estDefaut, setEstDefaut] = useState(false)
  const [saving, setSaving] = useState(false)

  // Modale Transfert / Ajustement Stock
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduitId, setSelectedProduitId] = useState('')
  const [selectedEntrepotId, setSelectedEntrepotId] = useState('')
  const [quantiteStock, setQuantiteStock] = useState<number>(0)
  const [savingStock, setSavingStock] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [resE, resS, resP] = await Promise.all([
        fetch(`/api/boutiques/${boutiqueId}/entrepots`, { headers }),
        fetch(`/api/boutiques/${boutiqueId}/entrepots/stocks`, { headers }),
        fetch(`/api/boutiques/${boutiqueId}/produits`, { headers }),
      ])

      if (resE.ok) {
        const dataE = await resE.json()
        setEntrepots(dataE.entrepots || [])
      }
      if (resS.ok) {
        const dataS = await resS.json()
        setStocks(dataS.stocks || [])
      }
      if (resP.ok) {
        const dataP = await resP.json()
        setProduits(dataP.produits || [])
      }
    } catch (err: any) {
      console.warn('[GestionEntrepots:chargerDonnees]', err)
      setError('Impossible de charger les données des entrepôts.')
    } finally {
      setLoading(false)
    }
  }, [boutiqueId, token])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  const ouvrirCreation = () => {
    setEditingId(null)
    setNom('')
    setAdresse('')
    setVille('Dakar')
    setResponsable('')
    setTelephone('')
    setEstDefaut(entrepots.length === 0)
    setShowModal(true)
  }

  const ouvrirEdition = (e: Entrepot) => {
    setEditingId(e.id)
    setNom(e.nom)
    setAdresse(e.adresse || '')
    setVille(e.ville || 'Dakar')
    setResponsable(e.responsable || '')
    setTelephone(e.telephone || '')
    setEstDefaut(e.est_defaut)
    setShowModal(true)
  }

  const handleEnregistrerEntrepot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)
    try {
      const url = editingId
        ? `/api/boutiques/${boutiqueId}/entrepots/${editingId}`
        : `/api/boutiques/${boutiqueId}/entrepots`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nom: nom.trim(),
          adresse: adresse.trim() || null,
          ville: ville.trim() || 'Dakar',
          responsable: responsable.trim() || null,
          telephone: telephone.trim() || null,
          est_defaut: estDefaut,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de l’enregistrement')

      setShowModal(false)
      chargerDonnees()
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleEnregistrerStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduitId || !selectedEntrepotId) return
    setSavingStock(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/entrepots/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          produit_id: selectedProduitId,
          entrepot_id: selectedEntrepotId,
          quantite: Number(quantiteStock),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de la mise à jour du stock')

      setShowStockModal(false)
      chargerDonnees()
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour stock')
    } finally {
      setSavingStock(false)
    }
  }

  const totalUnites = stocks.reduce((sum, s) => sum + (Number(s.quantite) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* En-tête avec statistiques & Bouton Nouveau */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: 'var(--shadow-xs)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--orange2, #FFF3E8)', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warehouse size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Gestion Multi-Entrepôts & Dépôts Physiques
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text2, #6B5E52)' }}>
                Gérez vos stocks répartis par site (Sandaga, Colobane, Pikine, Rufisque, Touba) avec agrégation en temps réel.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (entrepots.length > 0 && produits.length > 0) {
                setSelectedEntrepotId(entrepots[0].id)
                setSelectedProduitId(produits[0].id)
                setQuantiteStock(0)
                setShowStockModal(true)
              } else {
                alert('Veuillez créer au moins un entrepôt et un produit au préalable.')
              }
            }}
            style={{ padding: '9px 15px', borderRadius: 8, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Boxes size={15} />
            <span>Ajuster Stock Dépôt</span>
          </button>
          <button
            type="button"
            onClick={ouvrirCreation}
            className="btn-npl btn-npl-primary"
            style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--accent, #C75B00)', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none' }}
          >
            <Plus size={15} />
            <span>Nouveau Dépôt</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 14, color: '#dc2626', fontSize: 13, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: '14px 18px' }}>
          <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>Dépôts Actifs</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>{entrepots.length} site{entrepots.length > 1 ? 's' : ''}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: '14px 18px' }}>
          <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>Dépôt Principal</span>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent, #C75B00)', marginTop: 4 }}>
            {entrepots.find(e => e.est_defaut)?.nom || 'Aucun défini'}
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: '14px 18px' }}>
          <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>Total Unités Réparties</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0A5C36', marginTop: 4 }}>{totalUnites.toLocaleString('fr-FR')} unités</div>
        </div>
      </div>

      {/* Grille des Entrepôts */}
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Warehouse size={16} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Sites Physiques & Dépôts Enregistrés</span>
        </h4>

        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13, padding: 16 }}>Chargement des entrepôts...</div>
        ) : entrepots.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px dashed var(--border, #E8DDD2)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <Warehouse size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Aucun dépôt physique configuré</p>
            <p style={{ margin: '4px 0 16px', fontSize: 13, color: '#64748b' }}>Créez votre premier entrepôt (ex: Boutique Principale Sandaga) pour isoler les stocks.</p>
            <button type="button" onClick={ouvrirCreation} style={{ padding: '8px 16px', background: 'var(--accent, #C75B00)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              + Ajouter un dépôt
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {entrepots.map((e) => (
              <div key={e.id} style={{ background: '#ffffff', border: `1.5px solid ${e.est_defaut ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`, borderRadius: 14, padding: 18, position: 'relative', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{e.nom}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <MapPin size={13} style={{ color: 'var(--accent, #C75B00)' }} /> {e.ville} {e.adresse ? `· ${e.adresse}` : ''}
                    </span>
                  </div>
                  {e.est_defaut && (
                    <span style={{ background: 'var(--orange2, #FFF3E8)', color: 'var(--accent, #C75B00)', padding: '3px 8px', borderRadius: 12, fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Star size={11} /> Principal
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 10, fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {e.responsable && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={13} /> {e.responsable}
                    </span>
                  )}
                  {e.telephone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} /> {e.telephone}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => ouvrirEdition(e)}
                    style={{ padding: '5px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11.5, fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit size={12} /> Modifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tableau de Ventilation des Stocks par Entrepôt */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border, #E8DDD2)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border, #E8DDD2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Boxes size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Ventilation des Stocks par Produit & Dépôt</span>
          </h4>
          <button type="button" onClick={chargerDonnees} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {stocks.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Aucun stock ventilé pour le moment. Cliquez sur « Ajuster Stock Dépôt » pour affecter vos marchandises aux différents sites.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg, #F8F5F0)', color: 'var(--text2, #6B5E52)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Produit</th>
                  <th style={{ padding: '10px 14px' }}>Entrepôt / Dépôt</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quantité</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr key={`${s.produit_id}_${s.entrepot_id}`} style={{ borderTop: '1px solid var(--border, #E8DDD2)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{s.produit_nom}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Warehouse size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                        {s.entrepot_nom}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: s.quantite > 0 ? '#0A5C36' : '#dc2626' }}>
                      {s.quantite}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduitId(s.produit_id)
                          setSelectedEntrepotId(s.entrepot_id)
                          setQuantiteStock(s.quantite)
                          setShowStockModal(true)
                        }}
                        style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Ajuster
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création / Édition Entrepôt */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {editingId ? 'Modifier l’entrepôt' : 'Ajouter un nouveau dépôt'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnregistrerEntrepot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Nom du site *</label>
                <input
                  type="text"
                  placeholder="Ex: Entrepôt Keur Massar, Dépôt Sandaga..."
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Ville</label>
                  <input
                    type="text"
                    value={ville}
                    onChange={e => setVille(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Téléphone</label>
                  <input
                    type="text"
                    placeholder="Ex: 77 123 45 67"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Adresse détaillée</label>
                <input
                  type="text"
                  placeholder="Ex: Rond-Point Colobane, Magasin N°12"
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Responsable du site</label>
                <input
                  type="text"
                  placeholder="Ex: Moussa Diop"
                  value={responsable}
                  onChange={e => setResponsable(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={estDefaut}
                  onChange={e => setEstDefaut(e.target.checked)}
                />
                <span style={{ fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>Définir comme dépôt principal par défaut</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 14px', borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--accent, #C75B00)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustement de Stock */}
      {showStockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Ajuster le stock dans un dépôt
              </h3>
              <button type="button" onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnregistrerStock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Produit</label>
                <select
                  value={selectedProduitId}
                  onChange={e => setSelectedProduitId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                >
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (Stock global : {p.stock_quantite})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Dépôt / Entrepôt cible</label>
                <select
                  value={selectedEntrepotId}
                  onChange={e => setSelectedEntrepotId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                >
                  {entrepots.map(e => (
                    <option key={e.id} value={e.id}>{e.nom} ({e.ville}) {e.est_defaut ? '— Principal' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Quantité en stock sur ce site</label>
                <input
                  type="number"
                  min="0"
                  value={quantiteStock}
                  onChange={e => setQuantiteStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setShowStockModal(false)} style={{ padding: '8px 14px', borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={savingStock} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--accent, #C75B00)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                  {savingStock ? 'Mise à jour...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
