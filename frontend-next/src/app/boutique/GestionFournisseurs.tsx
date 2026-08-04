'use client'

import { useEffect, useState } from 'react'
import {
  getFournisseurs,
  creerFournisseur,
  modifierFournisseur,
  supprimerFournisseur,
  getCommandesFournisseurs,
  creerCommandeFournisseur,
  recevoirCommandeFournisseur,
  getBoutiqueProduits
} from './actions'
import { fcfa } from '@/lib/format'

export default function GestionFournisseurs({ boutiqueId }: { boutiqueId: string }) {
  const [subTab, setSubTab] = useState<'fournisseurs' | 'commandes'>('fournisseurs')
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [commandes, setCommandes] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Modals state
  const [modalFOUOuvert, setModalFOUOuvert] = useState<boolean>(false)
  const [modalCMDOuvert, setModalCMDOuvert] = useState<boolean>(false)

  // Form Fournisseur State
  const [fouEditId, setFouEditId] = useState<string | null>(null)
  const [fouNom, setFouNom] = useState<string>('')
  const [fouTel, setFouTel] = useState<string>('')
  const [fouEmail, setFouEmail] = useState<string>('')
  const [fouAdr, setFouAdr] = useState<string>('')

  // Form Commande State
  const [cmdFournisseurId, setCmdFournisseurId] = useState<string>('')
  const [cmdLignes, setCmdLignes] = useState<Array<{ produitId: string; quantite: number; prixAchat: number }>>([])

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const chargerDonnees = async () => {
    try {
      setLoading(true)
      const [fous, cmds] = await Promise.all([
        getFournisseurs(boutiqueId),
        getCommandesFournisseurs(boutiqueId)
      ])
      setFournisseurs(fous)
      setCommandes(cmds)

      // Catalogue pour le formulaire d'achat
      const prods = await getBoutiqueProduits(boutiqueId)
      setProduits(prods || [])
    } catch (err) {
      console.error('Erreur chargement donnees fournisseurs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  const handleSoumettreFormFournisseur = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fouNom) return

    try {
      setIsSubmitting(true)
      const payload = {
        nom: fouNom,
        telephone: fouTel,
        email: fouEmail,
        adresse: fouAdr
      }

      let res: any
      if (fouEditId) {
        res = await modifierFournisseur(boutiqueId, fouEditId, payload)
      } else {
        res = await creerFournisseur(boutiqueId, payload)
      }

      if (res.error) {
        alert(res.error)
      } else {
        alert(fouEditId ? 'Fournisseur modifié avec succès !' : 'Fournisseur ajouté avec succès !')
        setModalFOUOuvert(false)
        resetFouForm()
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ouvrirEditionFournisseur = (f: any) => {
    setFouEditId(f.id)
    setFouNom(f.nom || '')
    setFouTel(f.telephone || '')
    setFouEmail(f.email || '')
    setFouAdr(f.adresse || '')
    setModalFOUOuvert(true)
  }

  const handleCreerCommande = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cmdFournisseurId) {
      alert('Veuillez sélectionner un fournisseur.')
      return
    }
    if (cmdLignes.length === 0) {
      alert('Veuillez ajouter au moins un produit à la commande.')
      return
    }

    try {
      setIsSubmitting(true)
      const itemsFormates = cmdLignes.map(l => {
        const prod = produits.find(p => p.id === l.produitId)
        return {
          id: l.produitId,
          nom: prod ? prod.nom : 'Produit inconnu',
          quantite: l.quantite,
          prix_achat: l.prixAchat
        }
      })

      const res = await creerCommandeFournisseur(boutiqueId, {
        fournisseur_id: cmdFournisseurId,
        items: itemsFormates
      })

      if (res.error) {
        alert(res.error)
      } else {
        alert('Bon de commande créé avec succès !')
        setModalCMDOuvert(false)
        resetCmdForm()
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecevoirCommande = async (cmdId: string) => {
    if (!confirm('La réception de cette commande augmentera le stock des produits et créera une dépense comptable. Confirmer ?')) return
    try {
      const res = await recevoirCommandeFournisseur(boutiqueId, cmdId, { statut: 'recue' })
      if (res.error) {
        alert(res.error)
      } else {
        alert('Commande réceptionnée et stocks mis à jour !')
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSupprimerFournisseur = async (fId: string, nom: string) => {
    if (!confirm(`Supprimer le fournisseur ${nom} ?`)) return
    try {
      const res = await supprimerFournisseur(boutiqueId, fId)
      if (res.error) {
        alert(res.error)
      } else {
        alert('Fournisseur supprimé avec succès !')
        chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const resetFouForm = () => {
    setFouEditId(null)
    setFouNom('')
    setFouTel('')
    setFouEmail('')
    setFouAdr('')
  }

  const resetCmdForm = () => {
    setCmdFournisseurId('')
    setCmdLignes([])
  }

  const handleAjouterLigneCmd = () => {
    setCmdLignes(prev => [...prev, { produitId: '', quantite: 1, prixAchat: 0 }])
  }

  const handleModifierLigneCmd = (index: number, champ: string, valeur: any) => {
    setCmdLignes(prev => prev.map((l, i) => {
      if (i === index) {
        return { ...l, [champ]: valeur }
      }
      return l
    }))
  }

  const handleSupprimerLigneCmd = (index: number) => {
    setCmdLignes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: 16, paddingBottom: 4 }}>
        <button
          onClick={() => setSubTab('fournisseurs')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'fournisseurs' ? 700 : 500,
            color: subTab === 'fournisseurs' ? '#C75B00' : '#475569', borderBottom: subTab === 'fournisseurs' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          👤 Fournisseurs
        </button>
        <button
          onClick={() => setSubTab('commandes')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'commandes' ? 700 : 500,
            color: subTab === 'commandes' ? '#C75B00' : '#475569', borderBottom: subTab === 'commandes' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          📝 Achats / Bons de Commande
        </button>
      </div>

      {subTab === 'fournisseurs' ? (
        <>
          {/* Outils Fournisseur */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { resetFouForm(); setModalFOUOuvert(true); }}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              ➕ Ajouter
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>Chargement des fournisseurs...</p>
          ) : fournisseurs.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              👤 Aucun fournisseur enregistré pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fournisseurs.map((f: any) => (
                <div key={f.id} style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{f.nom}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: '#6b7280' }}>
                        {f.telephone && <span>📞 {f.telephone}</span>}
                        {f.email && <span>✉️ {f.email}</span>}
                        {f.adresse && <span>📍 {f.adresse}</span>}
                        {!f.telephone && !f.email && !f.adresse && <span style={{ fontStyle: 'italic' }}>Aucune info de contact</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => ouvrirEditionFournisseur(f)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleSupprimerFournisseur(f.id, f.nom)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Outils Commandes */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { resetCmdForm(); setModalCMDOuvert(true); }}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              ➕ Nouvelle Commande Stock
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>Chargement des commandes...</p>
          ) : commandes.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              📝 Aucun bon de commande ou achat enregistré.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Référence</th>
                    <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Fournisseur</th>
                    <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Total Achat</th>
                    <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Statut</th>
                    <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.map((cmd: any) => {
                    const fou = fournisseurs.find(f => f.id === cmd.fournisseur_id)
                    const totalVal = Number(cmd.montant_total ?? cmd.total_achat ?? 0)
                    const rawDate = cmd.created_at || cmd.date_commande || cmd.date_livraison
                    const dateFmt = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR') : '—'
                    const isRecue = cmd.statut === 'recu' || cmd.statut === 'recue'
                    return (
                      <tr key={cmd.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 12, fontWeight: 700 }}>{cmd.reference}</td>
                        <td style={{ padding: 12 }}>{fou ? fou.nom : 'Inconnu'}</td>
                        <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(totalVal)}</td>
                        <td style={{ padding: 12 }}>{dateFmt}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: isRecue ? '#d1fae5' : '#fee2e2',
                            color: isRecue ? '#065f46' : '#9a3412'
                          }}>
                            {isRecue ? 'REÇUE' : 'EN ATTENTE'}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          {!isRecue && (
                            <button
                              onClick={() => handleRecevoirCommande(cmd.id)}
                              style={{ padding: '6px 12px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              📥 Réceptionner
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal Fournisseur */}
      {modalFOUOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>{fouEditId ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</h3>
            <form onSubmit={handleSoumettreFormFournisseur} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nom / Raison Sociale *</label>
                <input required value={fouNom} onChange={e => setFouNom(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: ETS Diouf & Frères" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Téléphone</label>
                <input value={fouTel} onChange={e => setFouTel(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: +221 77 123 45 67" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Email</label>
                <input type="email" value={fouEmail} onChange={e => setFouEmail(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: contact@dioufetfreres.sn" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Adresse</label>
                <input value={fouAdr} onChange={e => setFouAdr(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} placeholder="Ex: Sandaga, Dakar" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <button type="button" onClick={() => setModalFOUOuvert(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? (fouEditId ? 'Modification...' : 'Ajout en cours...') : (fouEditId ? 'Enregistrer' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Commande */}
      {modalCMDOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Nouveau bon de commande d’achat</h3>
            <form onSubmit={handleCreerCommande} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Sélectionner le fournisseur *</label>
                <select value={cmdFournisseurId} onChange={e => setCmdFournisseurId(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} required>
                  <option value="">-- Choisir un fournisseur --</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>

              {/* Lignes d’achats */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Articles à commander</h4>
                  <button type="button" onClick={handleAjouterLigneCmd} style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    ➕ Ajouter article
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cmdLignes.map((ligne, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        value={ligne.produitId}
                        onChange={e => handleModifierLigneCmd(idx, 'produitId', e.target.value)}
                        style={{ flex: 2, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                        required
                      >
                        <option value="">-- Choisir un produit --</option>
                        {produits.map(p => (
                          <option key={p.id} value={p.id}>{p.nom} (Stock actuel : {p.stock_quantite ?? p.quantite_stock ?? 0})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={e => handleModifierLigneCmd(idx, 'quantite', Number(e.target.value))}
                        style={{ width: 80, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                        placeholder="Qte"
                        required
                      />
                      <input
                        type="number"
                        value={ligne.prixAchat}
                        onChange={e => handleModifierLigneCmd(idx, 'prixAchat', Number(e.target.value))}
                        style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                        placeholder="Prix Achat Unit"
                        required
                      />
                      <button type="button" onClick={() => handleSupprimerLigneCmd(idx)} style={{ padding: '8px 12px', background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 6, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <button type="button" onClick={() => setModalCMDOuvert(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? 'Création...' : 'Créer Bon de Commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
