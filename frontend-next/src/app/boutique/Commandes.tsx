'use client'
import { useEffect, useState, useTransition } from 'react'
import { listCommandes, updateStatutCommande, creerBoutiqueDocument } from './actions'
import { fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import { ZonesView } from './Comptabilite'

interface Commande {
  id: string; reference: string; nom_produit: string; quantite: number
  prix_unitaire: number; montant_total: number; frais_livraison: number
  client_nom: string; client_telephone: string; client_adresse: string | null
  note: string | null; statut: string; source: string; created_at: string
  methode_paiement: string | null; groupe_commande: string | null
}

const STATUTS: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'en_attente',      label: 'En attente',      color: '#92400e', bg: '#fef3c7' },
  { key: 'confirmee',       label: 'Confirmée',       color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'en_preparation',  label: 'En préparation',  color: '#6d28d9', bg: '#f5f3ff' },
  { key: 'expediee',        label: 'Expédiée',        color: '#0369a1', bg: '#e0f2fe' },
  { key: 'livree',          label: 'Livrée',          color: '#16a34a', bg: '#dcfce7' },
  { key: 'annulee',         label: 'Annulée',         color: '#dc2626', bg: '#fef2f2' },
]

const TRANSITIONS: Record<string, string[]> = {
  en_attente:     ['confirmee', 'annulee'],
  confirmee:      ['en_preparation', 'annulee'],
  en_preparation: ['expediee', 'annulee'],
  expediee:       ['livree', 'annulee'],
  livree:         [],
  annulee:        [],
}

function statutStyle(statut: string) {
  const s = STATUTS.find(s => s.key === statut)
  return s ? { color: s.color, background: s.bg, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 } : {}
}

function statutLabel(statut: string) {
  return STATUTS.find(s => s.key === statut)?.label ?? statut
}

function CommandeCard({ commande, boutiqueId, onUpdate }: { commande: Commande; boutiqueId: string; onUpdate: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [correctStatut, setCorrectStatut] = useState(commande.statut)
  const [, startTransition] = useTransition()
  const next = TRANSITIONS[commande.statut] ?? []
  const fcfa = (n: number) => n > 0 ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : '—'

  function changeStatut(statut: string) {
    setLoading(true)
    startTransition(() => {
      updateStatutCommande(boutiqueId, commande.id, statut).then(() => {
        setLoading(false)
        onUpdate()
      }).catch(() => setLoading(false))
    })
  }

  function applyCorrection() {
    if (correctStatut === commande.statut) { setCorrecting(false); return }
    changeStatut(correctStatut)
    setCorrecting(false)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header commande */}
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={statutStyle(commande.statut)}>{statutLabel(commande.statut)}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {commande.nom_produit} × {commande.quantite}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {commande.client_nom} · {commande.client_telephone}
              {commande.source === 'whatsapp' && <span style={{ marginLeft: 6, background: '#dcfce7', color: '#16a34a', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>WhatsApp</span>}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#C75B00' }}>{fcfa(commande.montant_total)}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
            {fmtDateHeure(commande.created_at)}
          </p>
        </div>
        <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Détails */}
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 18px', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>CLIENT</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{commande.client_nom}</p>
              <a href={`tel:${commande.client_telephone}`} style={{ fontSize: 13, color: '#1d4ed8' }}>{commande.client_telephone}</a>
              <br />
              <a href={`https://wa.me/${commande.client_telephone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>💬 WhatsApp</a>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>COMMANDE</p>
              <p style={{ margin: 0, fontSize: 13 }}>Réf : <strong>{commande.reference}</strong></p>
              <p style={{ margin: 0, fontSize: 13 }}>{commande.quantite} × {fcfa(commande.prix_unitaire)}</p>
              {commande.frais_livraison > 0 && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>🚚 Livraison : {fcfa(commande.frais_livraison)}</p>}
              {commande.methode_paiement && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: commande.methode_paiement === 'credit' ? '#0369a1' : '#6b7280', fontWeight: commande.methode_paiement === 'credit' ? 800 : 400 }}>
                  💳 {({ wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement', credit: '💳 Demande d\'Achat à Crédit (Carnet)' } as Record<string,string>)[commande.methode_paiement] ?? commande.methode_paiement}
                </p>
              )}
              {commande.client_adresse && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>📍 {commande.client_adresse}</p>}
            </div>
          </div>
          {commande.note && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#92400e' }}>
              📝 {commande.note}
            </div>
          )}

          {/* Actions de statut & Validation Marchand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Actions Rapides Marchand */}
            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#334155' }}>⚡ Actions Marchand Instantanées :</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {commande.statut === 'en_attente' && (
                  <>
                    <button
                      onClick={() => changeStatut('confirmee')}
                      disabled={loading}
                      style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✅ Valider la commande
                    </button>

                    {(commande.methode_paiement === 'credit' || commande.note?.toLowerCase().includes('crédit')) && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              setLoading(true)
                              const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/approuver-commande`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  commande_id: commande.id,
                                  client_nom: commande.client_nom,
                                  client_telephone: commande.client_telephone,
                                  montant: commande.montant_total,
                                  nom_produit: commande.nom_produit,
                                  quantite: commande.quantite,
                                  reference: commande.reference,
                                }),
                              })
                              const data = await res.json()
                              if (!res.ok) {
                                alert(data.error || 'Erreur lors de l\'approbation de la demande à crédit.')
                                return
                              }
                              if (typeof onUpdate === 'function') onUpdate()
                              window.dispatchEvent(new Event('carnet_updated'))

                              const cleanTel = commande.client_telephone.replace(/\D/g, '')
                              const msgWa = encodeURIComponent(`Bonjour ${commande.client_nom}, votre demande d'achat à crédit de ${fcfa(commande.montant_total)} (${commande.nom_produit}) a été approuvée par la boutique et ajoutée à votre Carnet !`)
                              
                              if (confirm(`✅ Demande d'achat à crédit de ${commande.client_nom} approuvée et ajoutée à son Carnet client avec succès !\n\nSouhaitez-vous ouvrir WhatsApp pour envoyer la confirmation au client ?`)) {
                                window.open(`https://wa.me/${cleanTel}?text=${msgWa}`, '_blank')
                              }
                            } catch (err) {
                              alert('Erreur lors du traitement de la demande.')
                            } finally {
                              setLoading(false)
                            }
                          }}
                          disabled={loading}
                          style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          📒 Approuver & Ajouter au Carnet
                        </button>

                        <button
                          onClick={async () => {
                            if (!confirm(`Souhaitez-vous vraiment rejeter la demande d'achat à crédit de ${commande.client_nom} ?`)) return
                            changeStatut('annulee')
                          }}
                          disabled={loading}
                          style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          ❌ Rejeter la demande
                        </button>
                      </>
                    )}
                  </>
                )}

                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      const res = await creerBoutiqueDocument(boutiqueId, {
                        type: 'facture',
                        statut: 'valide',
                        notes: `Facture issue de la commande Réf: ${commande.reference}`,
                        items: [{ nom: commande.nom_produit, quantite: commande.quantite, prix: commande.prix_unitaire }]
                      })
                      if (res.error) alert(res.error)
                      else alert(`Facture ${res.reference || ''} générée avec succès !`)
                    } catch (e) {
                      alert('Erreur lors de la création de la facture.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  📄 Générer Facture PDF
                </button>

                <a
                  href={`https://wa.me/${(commande.client_telephone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${commande.client_nom}, votre commande Réf: ${commande.reference} (${commande.quantite}x ${commande.nom_produit} - ${fcfa(commande.montant_total)}) a été bien validée par notre boutique. Merci pour votre confiance !`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '6px 12px', background: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  📲 Confirmer sur WhatsApp
                </a>
              </div>
            </div>

            {next.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Passer au statut :</span>
                {next.map(s => {
                  const info = STATUTS.find(x => x.key === s)!
                  return (
                    <button key={s} onClick={() => changeStatut(s)} disabled={loading} style={{
                      fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                      background: info.bg, color: info.color, opacity: loading ? 0.6 : 1,
                    }}>
                      {info.label} →
                    </button>
                  )
                })}
              </div>
            )}
            {next.length === 0 && (
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Commande terminée.</p>
            )}
            {/* Correction de statut */}
            {!correcting ? (
              <button onClick={() => { setCorrecting(true); setCorrectStatut(commande.statut) }} style={{
                fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer', alignSelf: 'flex-start',
              }}>
                ✎ Corriger le statut
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Corriger vers :</span>
                <select value={correctStatut} onChange={e => setCorrectStatut(e.target.value)} style={{
                  fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 8px', background: '#fff',
                }}>
                  {STATUTS.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <button onClick={applyCorrection} disabled={loading} style={{
                  fontSize: 12, fontWeight: 700, background: '#374151', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                }}>Appliquer</button>
                <button onClick={() => setCorrecting(false)} style={{
                  fontSize: 12, background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
                  padding: '4px 10px', cursor: 'pointer', color: '#6b7280',
                }}>Annuler</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Regroupe les commandes partageant le même groupe_commande (panier multi-articles).
// Les commandes sans groupe (mono-produit, web classique) restent des entrées individuelles.
function regrouperCommandes(commandes: Commande[]): (Commande | Commande[])[] {
  const groupes = new Map<string, Commande[]>()
  const resultat: (Commande | Commande[])[] = []
  for (const c of commandes) {
    if (!c.groupe_commande) { resultat.push(c); continue }
    if (!groupes.has(c.groupe_commande)) {
      const groupe: Commande[] = []
      groupes.set(c.groupe_commande, groupe)
      resultat.push(groupe)
    }
    groupes.get(c.groupe_commande)!.push(c)
  }
  return resultat
}

function CommandeGroupeCard({ commandes, boutiqueId, onUpdate }: { commandes: Commande[]; boutiqueId: string; onUpdate: () => void }) {
  const [open, setOpen] = useState(false)
  const fcfa = (n: number) => n > 0 ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : '—'
  const premiere = commandes[0]
  const total = commandes.reduce((s, c) => s + Number(c.montant_total), 0)
  const statuts = new Set(commandes.map(c => c.statut))
  const statutAffiche = statuts.size === 1 ? premiere.statut : 'mixte'

  return (
    <div style={{ background: '#fff', border: '1px solid #C75B00', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12, background: '#fff7f0' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={{ background: '#C75B00', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            🛒 Panier · {commandes.length} articles
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {statutAffiche === 'mixte' ? 'Statuts multiples' : statutLabel(statutAffiche)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {premiere.client_nom} · {premiere.client_telephone}
              {premiere.source === 'whatsapp' && <span style={{ marginLeft: 6, background: '#dcfce7', color: '#16a34a', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>WhatsApp</span>}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#C75B00' }}>{fcfa(total)}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{fmtDateHeure(premiere.created_at)}</p>
        </div>
        <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 18px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commandes.map(c => (
            <CommandeCard key={c.id} commande={c} boutiqueId={boutiqueId} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

const FILTRE_STATUTS = [
  { key: '', label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'confirmee', label: 'Confirmées' },
  { key: 'en_preparation', label: 'En prépa.' },
  { key: 'expediee', label: 'Expédiées' },
  { key: 'livree', label: 'Livrées' },
  { key: 'annulee', label: 'Annulées' },
]

interface PanierAbandonne {
  id: string
  client_nom: string | null
  client_tel: string
  articles: { nom: string; quantite: number; prix: number }[]
  total: number
  relance_envoyee: boolean
  created_at: string
}

export default function Commandes({ boutiqueId }: { boutiqueId: string }) {
  const [subTab, setSubTab] = useState<'commandes' | 'zones'>('commandes')
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [paniersAbandonnes, setPaniersAbandonnes] = useState<PanierAbandonne[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('')
  const [filtreCanal, setFiltreCanal] = useState<'tous' | 'web' | 'caisse'>('tous')

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    const cacheKey = `nopalou_offline_commandes_${boutiqueId}_${filtre}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try { 
        const parsed = JSON.parse(cached)
        if (filtre === 'abandonne') setPaniersAbandonnes(parsed)
        else setCommandes(parsed)
      } catch(e) {}
    }
    if (!cached) setLoading(true)

    if (filtre === 'abandonne') {
      try {
        const res = await fetch(`/api/compta-proxy/${boutiqueId}/paniers-abandonnes`)
        let data
        if (!res.ok) {
          const directRes = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/paniers-abandonnes`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('nopalou_token') || ''}` }
          })
          data = await directRes.json()
        } else {
          data = await res.json()
        }
        setPaniersAbandonnes(data.paniers || [])
        localStorage.setItem(cacheKey, JSON.stringify(data.paniers || []))
      } catch {
        if (!cached) setPaniersAbandonnes([])
      }
    } else {
      try {
        const data = await listCommandes(boutiqueId, filtre)
        setCommandes(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      } catch (err) {
        if (!cached) setCommandes([])
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [boutiqueId, filtre])

  const commandesFiltrees = commandes.filter(c => {
    if (filtreCanal === 'caisse') return c.reference?.startsWith('POS') || c.source === 'pos_caisse'
    if (filtreCanal === 'web') return !c.reference?.startsWith('POS') && c.source !== 'pos_caisse'
    return true
  })

  async function relancerWhatsApp(cartId: string) {
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/paniers-abandonnes/${cartId}/relancer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nopalou_token') || ''}`
        }
      })
      const data = await res.json()
      if (data.lienWhatsapp) {
        window.open(data.lienWhatsapp, '_blank')
        load()
      }
    } catch {
      alert('Impossible de générer le lien de relance WhatsApp')
    }
  }

  const stats = {
    en_attente: commandes.filter(c => c.statut === 'en_attente').length,
    total: commandes.length,
  }

  function exportCommandesCSV() {
    const headers = ['Référence', 'Produit', 'Quantité', 'Prix Unit (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)', 'Client', 'Téléphone', 'Statut', 'Source', 'Date']
    const rows = commandesFiltrees.map(c => [
      c.reference || `CMD-${c.id.slice(0, 6)}`,
      c.nom_produit,
      c.quantite,
      c.prix_unitaire,
      c.frais_livraison,
      c.montant_total,
      c.client_nom,
      c.client_telephone,
      c.statut.toUpperCase(),
      c.source || 'web',
      fmtDateHeure(c.created_at)
    ])
    exportToCSV(`commandes_boutique_${boutiqueId}`, headers, rows)
  }

  function exportCommandesPDF() {
    const headers = ['Réf.', 'Produit', 'Qte', 'Total', 'Client', 'Tel', 'Statut', 'Date']
    const rows = commandesFiltrees.map(c => [
      c.reference || `CMD-${c.id.slice(0, 6)}`,
      c.nom_produit,
      c.quantite,
      `${Number(c.montant_total).toLocaleString('fr-FR')} FCFA`,
      c.client_nom,
      c.client_telephone,
      statutLabel(c.statut),
      fmtDateHeure(c.created_at)
    ])
    const totalM = commandesFiltrees.reduce((s, c) => s + Number(c.montant_total), 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Registre des Commandes Clients</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#C75B00;">Total : ${totalM.toLocaleString('fr-FR')} FCFA (${commandesFiltrees.length} commandes)</p>
      </div>
    `
    printPDFReport('Journal des Commandes Clients', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: 16, paddingBottom: 4 }}>
        <button
          onClick={() => setSubTab('commandes')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'commandes' ? 700 : 500,
            color: subTab === 'commandes' ? '#C75B00' : '#475569', borderBottom: subTab === 'commandes' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          📋 Commandes Clients
        </button>
        <button
          onClick={() => setSubTab('zones')}
          style={{
            background: 'none', border: 'none', padding: '6px 12px', fontSize: 14, fontWeight: subTab === 'zones' ? 700 : 500,
            color: subTab === 'zones' ? '#C75B00' : '#475569', borderBottom: subTab === 'zones' ? '2px solid #C75B00' : 'none', cursor: 'pointer'
          }}
        >
          🚚 Zones & Frais de Livraison
        </button>
      </div>

      {subTab === 'zones' ? (
        <ZonesView boutiqueId={boutiqueId} />
      ) : (
        <>
          {/* Stats rapides */}
      {stats.en_attente > 0 && filtre !== 'abandonne' && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          ⏳ {stats.en_attente} commande{stats.en_attente > 1 ? 's' : ''} en attente de confirmation
        </div>
      )}

      {/* Sélecteur de canal & Exports */}
      {filtre !== 'abandonne' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 4 }}>Source :</span>
            <button onClick={() => setFiltreCanal('tous')} style={{
              padding: '4px 12px', borderRadius: 16, border: '1px solid',
              borderColor: filtreCanal === 'tous' ? '#1e293b' : '#cbd5e1',
              background: filtreCanal === 'tous' ? '#1e293b' : '#fff',
              color: filtreCanal === 'tous' ? '#fff' : '#475569',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Toutes les ventes ({commandes.length})
            </button>
            <button onClick={() => setFiltreCanal('web')} style={{
              padding: '4px 12px', borderRadius: 16, border: '1px solid',
              borderColor: filtreCanal === 'web' ? '#2563eb' : '#cbd5e1',
              background: filtreCanal === 'web' ? '#eff6ff' : '#fff',
              color: filtreCanal === 'web' ? '#1d4ed8' : '#475569',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              🌐 Web & WhatsApp
            </button>
            <button onClick={() => setFiltreCanal('caisse')} style={{
              padding: '4px 12px', borderRadius: 16, border: '1px solid',
              borderColor: filtreCanal === 'caisse' ? '#ea580c' : '#cbd5e1',
              background: filtreCanal === 'caisse' ? '#fff7ed' : '#fff',
              color: filtreCanal === 'caisse' ? '#c75b00' : '#475569',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              🛒 Caisse POS
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={exportCommandesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px', fontWeight: 700, cursor: 'pointer' }}>
              📥 Excel (CSV)
            </button>
            <button onClick={exportCommandesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', fontWeight: 700, cursor: 'pointer' }}>
              📄 Imprimer PDF
            </button>
          </div>
        </div>
      )}

      {/* Filtres statut + Onglet Paniers Abandonnés */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTRE_STATUTS.map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)} style={{
            padding: '5px 12px', borderRadius: 20, border: '1px solid',
            borderColor: filtre === f.key ? '#C75B00' : '#e5e7eb',
            background: filtre === f.key ? '#fff7f0' : '#fff',
            color: filtre === f.key ? '#C75B00' : '#374151',
            fontWeight: filtre === f.key ? 700 : 500,
            fontSize: 12, cursor: 'pointer',
          }}>
            {f.label}
          </button>
        ))}

        <button
          onClick={() => setFiltre('abandonne')}
          style={{
            padding: '5px 14px', borderRadius: 20, border: '1px solid',
            borderColor: filtre === 'abandonne' ? '#dc2626' : '#fecaca',
            background: filtre === 'abandonne' ? '#fef2f2' : '#fff',
            color: filtre === 'abandonne' ? '#dc2626' : '#991b1b',
            fontWeight: filtre === 'abandonne' ? 800 : 600,
            fontSize: 12, cursor: 'pointer',
          }}
        >
          📢 Paniers Abandonnés
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true" aria-label="Chargement des commandes en cours">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtre === 'abandonne' ? (
        /* Liste des Paniers Abandonnés */
        paniersAbandonnes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🎉</p>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Aucun panier abandonné pour le moment !</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paniersAbandonnes.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{p.client_nom || 'Client Anonyme'}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>({p.client_tel})</span>
                    {p.relance_envoyee && (
                      <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                        ✓ Relance envoyée
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 4px', fontSize: 13, color: '#4b5563' }}>
                    Articles : {(p.articles || []).map(a => `${a.quantite}x ${a.nom}`).join(', ')}
                  </p>

                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Abandonné le {new Date(p.created_at).toLocaleString('fr-FR')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#dc2626' }}>
                    {new Intl.NumberFormat('fr-FR').format(p.total)} FCFA
                  </span>

                  <button
                    onClick={() => relancerWhatsApp(p.id)}
                    style={{
                      background: '#25D366', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(37,211,102,.25)'
                    }}
                  >
                    💬 Relancer sur WhatsApp (-5%) →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : commandesFiltrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            {filtre || filtreCanal !== 'tous' ? 'Aucune commande avec ce filtre.' : 'Aucune commande reçue pour l\'instant.'}
          </p>
          {!filtre && (
            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Les commandes apparaîtront ici dès qu&apos;un client commande depuis votre boutique, la caisse POS ou via WhatsApp.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {regrouperCommandes(commandesFiltrees).map((item, i) =>
            Array.isArray(item)
              ? <CommandeGroupeCard key={item[0].groupe_commande ?? i} commandes={item} boutiqueId={boutiqueId} onUpdate={load} />
              : <CommandeCard key={item.id} commande={item} boutiqueId={boutiqueId} onUpdate={load} />
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}

