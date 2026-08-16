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
  const [lignesSelectionnees, setLignesSelectionnees] = useState<Array<{ produitId: string; nom: string; quantite: number; prix: number }>>([])

  // Actions states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [documentEnEdition, setDocumentEnEdition] = useState<any | null>(null)

  // Search & Status Filter
  const [rechercheDoc, setRechercheDoc] = useState<string>('')
  const [statutFiltreDoc, setStatutFiltreDoc] = useState<string>('tous')

  const chargerDonnees = async () => {
    const cacheKeyDocs = `nopalou_offline_docs_${boutiqueId}`
    const cacheKeyClients = `nopalou_offline_clients_${boutiqueId}`
    const cacheKeyProds = `nopalou_offline_prods_${boutiqueId}`

    const cDocs = localStorage.getItem(cacheKeyDocs)
    if (cDocs) { try { setDocuments(JSON.parse(cDocs)) } catch(e) {} }
    const cClients = localStorage.getItem(cacheKeyClients)
    if (cClients) { try { setClients(JSON.parse(cClients)) } catch(e) {} }
    const cProds = localStorage.getItem(cacheKeyProds)
    if (cProds) { try { setProduits(JSON.parse(cProds)) } catch(e) {} }

    if (!cDocs) setLoading(true)

    try {
      const docs = await getBoutiqueDocuments(boutiqueId)
      setDocuments(docs)
      localStorage.setItem(cacheKeyDocs, JSON.stringify(docs))

      // Charger clients pour le formulaire
      const resClients = await fetch(`/api/boutiques/${boutiqueId}/credits-clients`)
      if (resClients.ok) {
        const dClients = await resClients.json()
        setClients(dClients.clients || [])
        localStorage.setItem(cacheKeyClients, JSON.stringify(dClients.clients || []))
      }

      // Charger catalogue pour le formulaire
      const prods = await getBoutiqueProduits(boutiqueId)
      setProduits(prods || [])
      localStorage.setItem(cacheKeyProds, JSON.stringify(prods || []))
    } catch (err) {
      console.error('Erreur chargement documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  const handleSoumettreDocument = async (e: React.FormEvent) => {
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
        const nomFinal = l.nom?.trim() || (prodObj ? prodObj.nom : 'Article / Prestation')
        return {
          id: (l.produitId && l.produitId !== 'custom') ? l.produitId : null,
          nom: nomFinal,
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

      if (documentEnEdition) {
        const res = await modifierBoutiqueDocument(boutiqueId, documentEnEdition.id, payload)
        if (res.error) {
          alert(res.error)
        } else {
          alert(`Document ${documentEnEdition.reference} modifié avec succès !`)
          setModalOuvert(false)
          resetForm()
          chargerDonnees()
        }
      } else {
        const res = await creerBoutiqueDocument(boutiqueId, payload)
        if (res.error) {
          alert(res.error)
        } else {
          alert(`Document ${res.reference} créé avec succès !`)
          setModalOuvert(false)
          resetForm()
          chargerDonnees()
        }
      }
    } catch (err) {
      console.error('Erreur soumission document:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTypeDoc('facture')
    setClientIdSelected('')
    setStatutDoc('brouillon')
    setNoteDoc('')
    setLignesSelectionnees([{ produitId: 'custom', nom: '', quantite: 1, prix: 0 }])
  }

  const handleOuvrirEdition = (doc: any) => {
    setDocumentEnEdition(doc)
    setTypeDoc(doc.type)
    setClientIdSelected(doc.client_id || '')
    setStatutDoc(doc.statut)
    setNoteDoc(doc.notes || '')
    
    const parsedItems = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items
    const lines = (parsedItems || []).map((item: any) => {
      let pId = item.id || item.produit_id || item.produitId || ''
      if (!pId || !produits.some(p => p.id === pId)) {
        if (item.nom && produits.length > 0) {
          const foundByName = produits.find(p => p.nom?.toLowerCase() === item.nom?.toLowerCase())
          if (foundByName) pId = foundByName.id; else pId = 'custom'
        } else {
          pId = 'custom'
        }
      }
      const unitPrice = Number(item.prix_unitaire ?? item.prix ?? item.prix_unitaire_ht ?? 0)
      return {
        produitId: pId,
        nom: item.nom || item.description || '',
        quantite: Number(item.quantite || 1),
        prix: unitPrice
      }
    })
    setLignesSelectionnees(lines.length > 0 ? lines : [{ produitId: 'custom', nom: '', quantite: 1, prix: 0 }])
    setModalOuvert(true)
  }

  const handleAjouterLigne = () => {
    setLignesSelectionnees(prev => [...prev, { produitId: 'custom', nom: '', quantite: 1, prix: 0 }])
  }

  const handleModifierLigne = (index: number, champ: string, valeur: any) => {
    setLignesSelectionnees(prev => prev.map((l, i) => {
      if (i === index) {
        const updated = { ...l, [champ]: valeur }
        if (champ === 'produitId') {
          if (valeur === 'custom' || !valeur) {
            updated.produitId = 'custom'
          } else {
            const prod = produits.find(p => p.id === valeur)
            if (prod) {
              updated.nom = prod.nom
              updated.prix = Number(prod.prix)
            }
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

  const qDoc = rechercheDoc.trim().toLowerCase()
  const documentsFiltrés = documents.filter(d => {
    const matchType = typeFiltre === 'tous' || d.type === typeFiltre
    const matchStatut = statutFiltreDoc === 'tous' || d.statut === statutFiltreDoc
    const matchSearch = !qDoc ||
      d.reference?.toLowerCase().includes(qDoc) ||
      d.client_nom?.toLowerCase().includes(qDoc) ||
      d.client_ninea?.toLowerCase().includes(qDoc)
    return matchType && matchStatut && matchSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre d'outils et filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
          <input
            type="text"
            value={rechercheDoc}
            onChange={e => setRechercheDoc(e.target.value)}
            placeholder="🔍 Rechercher par référence, nom client..."
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 200, flex: 1, outline: 'none' }}
          />
          <div className="nopalou-scroll-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['tous', 'facture', 'devis', 'proforma'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFiltre(t)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: typeFiltre === t ? '#1e3a5f' : '#ffffff',
                  color: typeFiltre === t ? '#ffffff' : '#475569',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap'
                }}
              >
                {t === 'tous' ? '📁 Tous' : t === 'facture' ? '🧾 Factures' : t === 'devis' ? '📝 Devis' : '📋 Proformas'}
              </button>
            ))}
          </div>
          <select
            value={statutFiltreDoc}
            onChange={e => setStatutFiltreDoc(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', outline: 'none' }}
          >
            <option value="tous">Tous statuts</option>
            <option value="brouillon">⏳ Brouillon</option>
            <option value="valide">✅ Validé</option>
            <option value="paye">💵 Payé</option>
            <option value="envoye">📩 Envoyé</option>
          </select>
        </div>
        <button
          onClick={() => { setDocumentEnEdition(null); resetForm(); setModalOuvert(true); }}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                    <td style={{ padding: 12 }}>{client ? client.nom : 'Passant (Anonyme)'}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.total_ht)}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.total_tva)}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(doc.total_ttc)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: doc.statut === 'paye' ? '#d1fae5' : doc.statut === 'valide' ? '#e0e7ff' : '#f3f4f6',
                        color: doc.statut === 'paye' ? '#065f46' : doc.statut === 'valide' ? '#3730a3' : '#374151'
                      }}>
                        {doc.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'pdf') window.open(`/api/boutiques/${boutiqueId}/documents/${doc.id}/pdf`, '_blank');
                          else if (val === 'edit') handleOuvrirEdition(doc);
                          else if (val === 'convert') handleConvertirEnFacture(doc.id, doc.reference);
                          else if (val === 'delete') handleSupprimerDocument(doc.id, doc.reference);
                          e.target.value = '';
                        }}
                        defaultValue=""
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>⚡ Actions ▾</option>
                        <option value="pdf">🖨️ Télécharger / Imprimer PDF</option>
                        <option value="edit">✏️ Modifier le document</option>
                        {(doc.type === 'devis' || doc.type === 'proforma') && (
                          <option value="convert">🔄 Convertir en Facture</option>
                        )}
                        <option value="delete">🗑️ Supprimer</option>
                      </select>
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
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {documentEnEdition ? `Modifier le document ${documentEnEdition.reference}` : 'Créer un nouveau document'}
            </h3>
            <form onSubmit={handleSoumettreDocument} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lignesSelectionnees.map((ligne, idx) => {
                    const isCatalogProd = produits.some(p => p.id === ligne.produitId);
                    const estProduitHorsCatalogue = !isCatalogProd || ligne.produitId === 'custom' || !ligne.produitId;
                    const totalLigne = Number(ligne.quantite || 0) * Number(ligne.prix || 0);

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          
                          <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Article / Produit *</label>
                            <select
                              value={isCatalogProd ? ligne.produitId : 'custom'}
                              onChange={e => handleModifierLigne(idx, 'produitId', e.target.value)}
                              style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 600, height: 38 }}
                            >
                              <option value="custom">✏️ Article hors catalogue / Saisie libre</option>
                              {produits.length > 0 && (
                                <optgroup label="Catalogue Produits">
                                  {produits.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom} ({fcfa(p.prix)})</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>

                          <div style={{ width: 90, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Quantité *</label>
                            <input
                              type="number"
                              min="1"
                              value={ligne.quantite}
                              onChange={e => handleModifierLigne(idx, 'quantite', Number(e.target.value))}
                              style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 700, height: 38 }}
                              placeholder="Qté"
                              required
                            />
                          </div>

                          <div style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Prix Unit. (FCFA) *</label>
                            <input
                              type="number"
                              min="0"
                              value={ligne.prix}
                              onChange={e => handleModifierLigne(idx, 'prix', Number(e.target.value))}
                              style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 700, height: 38 }}
                              placeholder="Prix Unit"
                              required
                            />
                          </div>

                          <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Total (FCFA)</label>
                            <div style={{ padding: '9px 10px', background: '#e2e8f0', borderRadius: 6, fontSize: 12.5, fontWeight: 900, color: '#0f172a', height: 38, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              {fcfa(totalLigne)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 800, color: 'transparent' }}>•</label>
                            <button
                              type="button"
                              onClick={() => handleSupprimerLigne(idx)}
                              style={{ padding: '0 12px', height: 38, background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 6, cursor: 'pointer', fontWeight: 800, fontSize: 14 }}
                              title="Supprimer cette ligne"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {estProduitHorsCatalogue && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 800, color: '#0284c7' }}>Désignation / Nom de l&apos;article ou prestation hors catalogue *</label>
                            <input
                              type="text"
                              value={ligne.nom}
                              onChange={e => handleModifierLigne(idx, 'nom', e.target.value)}
                              placeholder="Ex: Prestation réparation écran, Article spécifique..."
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff', fontWeight: 600 }}
                              required
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}

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
                  {isSubmitting ? 'Enregistrement...' : documentEnEdition ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
