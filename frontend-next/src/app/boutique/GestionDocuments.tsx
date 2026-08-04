'use client'

import { useEffect, useState } from 'react'
import { getBoutiqueDocuments, creerBoutiqueDocument, modifierBoutiqueDocument, supprimerBoutiqueDocument, getBoutiqueProduits } from './actions'
import { fcfa } from '@/lib/format'

export default function GestionDocuments({ boutiqueId }: { boutiqueId: string }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [typeFiltre, setTypeFiltre] = useState<string>('tous')
  const [clients, setClients] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])

  // Modal State
  const [modalOuvert, setModalOuvert] = useState<boolean>(false)
  const [typeDoc, setTypeDoc] = useState<'facture' | 'devis' | 'proforma'>('facture')
  const [clientIdSelected, setClientIdSelected] = useState<string>('')
  const [statutDoc, setStatutDoc] = useState<'brouillon' | 'valide' | 'paye'>('brouillon')
  const [noteDoc, setNoteDoc] = useState<string>('')
  const [lignesSelectionnees, setLignesSelectionnees] = useState<Array<{ produitId: string; quantite: number; prix: number }>>([])

  // Actions states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const chargerDonnees = async () => {
    try {
      setLoading(true)
      const docs = await getBoutiqueDocuments(boutiqueId)
      setDocuments(docs)

      // Charger clients pour le formulaire
      const resClients = await fetch(`/api/boutiques/${boutiqueId}/credits-clients`)
      if (resClients.ok) {
        const dClients = await resClients.json()
        setClients(dClients.clients || [])
      }

      // Charger catalogue pour le formulaire
      const prods = await getBoutiqueProduits(boutiqueId)
      setProduits(prods || [])
    } catch (err) {
      console.error('Erreur chargement documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  const handleCreerDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lignesSelectionnees.length === 0) {
      alert('Veuillez ajouter au moins un produit au document.')
      return
    }

    try {
      setIsSubmitting(true)
      // Formater les items pour l'API
      const itemsFormates = lignesSelectionnees.map(l => {
        const prodObj = produits.find(p => p.id === l.produitId)
        return {
          id: l.produitId,
          nom: prodObj ? prodObj.nom : 'Produit inconnu',
          quantite: l.quantite,
          prix: l.prix
        }
      })

      const payload = {
        type: typeDoc,
        client_id: clientIdSelected || null,
        statut: statutDoc,
        notes: noteDoc,
        items: itemsFormates
      }

      const res = await creerBoutiqueDocument(boutiqueId, payload)
      if (res.error) {
        alert(res.error)
      } else {
        alert(`Document ${res.reference} créé avec succès !`)
        setModalOuvert(false)
        resetForm()
        chargerDonnees()
      }
    } catch (err) {
      console.error('Erreur creation document:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTypeDoc('facture')
    setClientIdSelected('')
    setStatutDoc('brouillon')
    setNoteDoc('')
    setLignesSelectionnees([])
  }

  const handleAjouterLigne = () => {
    setLignesSelectionnees(prev => [...prev, { produitId: '', quantite: 1, prix: 0 }])
  }

  const handleModifierLigne = (index: number, champ: string, valeur: any) => {
    setLignesSelectionnees(prev => prev.map((l, i) => {
      if (i === index) {
        const updated = { ...l, [champ]: valeur }
        // Remplir le prix par défaut du produit sélectionné
        if (champ === 'produitId') {
          const prod = produits.find(p => p.id === valeur)
          if (prod) {
            updated.prix = Number(prod.prix)
          }
        }
        return updated
      }
      return l
    }))
  }

  const handleSupprimerLigne = (index: number) => {
    setLignesSelectionnees(prev => prev.filter((_, i) => i !== index))
  }

  const handleConvertirEnFacture = async (docId: string, ref: string) => {
    if (!confirm(`Voulez-vous vraiment convertir le devis/proforma ${ref} en Facture de vente ?`)) return
    try {
      const res = await modifierBoutiqueDocument(boutiqueId, docId, { type: 'facture', statut: 'valide' })
      if (res.error) {
        alert(res.error)
      } else {
        alert('Document converti en Facture avec succès !')
        chargerDonnees()
      }
    } catch (err) {
      console.error('Erreur conversion document:', err)
    }
  }

  const handleSupprimerDocument = async (docId: string, ref: string) => {
    if (!confirm(`Voulez-vous supprimer définitivement le document ${ref} ?`)) return
    try {
      const res = await supprimerBoutiqueDocument(boutiqueId, docId)
      if (res.error) {
        alert(res.error)
      } else {
        alert('Document supprimé avec succès !')
        chargerDonnees()
      }
    } catch (err) {
      console.error('Erreur suppression document:', err)
    }
  }

  const documentsFiltrés = typeFiltre === 'tous' 
    ? documents 
    : documents.filter(d => d.type === typeFiltre)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre d'outils et filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['tous', 'facture', 'devis', 'proforma'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFiltre(t)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: typeFiltre === t ? '#1e3a5f' : '#ffffff',
                color: typeFiltre === t ? '#ffffff' : '#475569',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize'
              }}
            >
              {t === 'tous' ? '📁 Tous' : t === 'facture' ? '🧾 Factures' : t === 'devis' ? '📝 Devis' : '📋 Proformas'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetForm(); setModalOuvert(true); }}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          ➕ Nouveau Document
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>Chargement des documents de vente...</p>
      ) : documentsFiltrés.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
          📂 Aucun document enregistré pour le moment.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Référence</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Type</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Client</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Montant HT</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>TVA</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>TTC</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: 12, color: '#374151', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentsFiltrés.map((doc: any) => {
                const client = clients.find(c => c.id === doc.client_id)
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: '#1e3a5f' }}>{doc.reference}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: doc.type === 'facture' ? '#e0f2fe' : doc.type === 'devis' ? '#fef3c7' : '#ecfdf5',
                        color: doc.type === 'facture' ? '#0369a1' : doc.type === 'devis' ? '#b45309' : '#047857'
                      }}>
                        {doc.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{client ? `${client.prenom} ${client.nom}` : 'Passant (Anonyme)'}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.montant_ht)}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.montant_tva)}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(doc.montant_ttc)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: doc.statut === 'paye' ? '#d1fae5' : doc.statut === 'valide' ? '#e0e7ff' : '#f3f4f6',
                        color: doc.statut === 'paye' ? '#065f46' : doc.statut === 'valide' ? '#3730a3' : '#374151'
                      }}>
                        {doc.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, display: 'flex', gap: 6 }}>
                      {(doc.type === 'devis' || doc.type === 'proforma') && (
                        <button
                          onClick={() => handleConvertirEnFacture(doc.id, doc.reference)}
                          style={{ padding: '4px 8px', borderRadius: 6, background: '#3b82f6', color: '#ffffff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          🔄 Facturer
                        </button>
                      )}
                      <button
                        onClick={() => handleSupprimerDocument(doc.id, doc.reference)}
                        style={{ padding: '4px 8px', borderRadius: 6, background: '#ef4444', color: '#ffffff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Document Modal */}
      {modalOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Créer un nouveau document</h3>
            <form onSubmit={handleCreerDocument} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Type de document</label>
                  <select value={typeDoc} onChange={e => setTypeDoc(e.target.value as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
                    <option value="facture">Facture</option>
                    <option value="devis">Devis</option>
                    <option value="proforma">Proforma</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Statut initial</label>
                  <select value={statutDoc} onChange={e => setStatutDoc(e.target.value as any)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
                    <option value="brouillon">Brouillon</option>
                    <option value="valide">Validé</option>
                    {typeDoc === 'facture' && <option value="paye">Payé</option>}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Associer un client (Facultatif)</label>
                <select value={clientIdSelected} onChange={e => setClientIdSelected(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
                  <option value="">-- Client Passant (Anonyme) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.telephone})</option>
                  ))}
                </select>
              </div>

              {/* Lignes d'articles */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Articles du document</h4>
                  <button type="button" onClick={handleAjouterLigne} style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    ➕ Ajouter un article
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lignesSelectionnees.map((ligne, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        value={ligne.produitId}
                        onChange={e => handleModifierLigne(idx, 'produitId', e.target.value)}
                        style={{ flex: 2, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                        required
                      >
                        <option value="">-- Choisir un produit --</option>
                        {produits.map(p => (
                          <option key={p.id} value={p.id}>{p.nom} ({fcfa(p.prix)})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={e => handleModifierLigne(idx, 'quantite', Number(e.target.value))}
                        style={{ width: 80, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                        placeholder="Qte"
                        required
                      />
                      <input
                        type="number"
                        value={ligne.prix}
                        onChange={e => handleModifierLigne(idx, 'prix', Number(e.target.value))}
                        style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
                        placeholder="Prix Unit"
                        required
                      />
                      <button type="button" onClick={() => handleSupprimerLigne(idx)} style={{ padding: '8px 12px', background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 6, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes / Conditions de vente</label>
                <textarea
                  value={noteDoc}
                  onChange={e => setNoteDoc(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', resize: 'vertical' }}
                  rows={2}
                  placeholder="Ex: Validité du devis: 15 jours..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <button type="button" onClick={() => setModalOuvert(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
