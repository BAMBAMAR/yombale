'use client'
import { useEffect, useState, useRef, useTransition } from 'react'
import {
  listZones, createZone, deleteZone,
  listVentes, declarerVente, deleteVente, updateVente,
  getDashboard, listDepenses, addDepense, deleteDepense, updateDepense,
  updateStock, getBoutiqueProduits
} from './actions'
import { fcfa, fmtDate, fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'

interface Zone    { id: string; nom: string; prix: number }
interface Vente   { id: string; reference: string; nom_produit: string; quantite: number; prix_unitaire: number; frais_livraison: number; montant_total: number; client_nom: string | null; methode_paiement: string; created_at: string; justificatif_url: string | null }
interface Produit { id: string; nom: string; prix: number | null; stock_quantite: number | null; quantite_stock?: number | null }
interface Depense { id: string; montant: number; categorie: string; description: string | null; date_depense: string; justificatif_url: string | null }
interface Dashboard {
  ca_mois: number; ca_mois_precedent: number; nb_ventes_mois: number; ca_total: number
  depenses_mois: number; depenses_total: number; benefice_mois: number
  top_produits: { nom_produit: string; total_vendu: number; ca: number }[]
  stock_alerte: { id: string; nom: string; stock_quantite: number }[]
}

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const inputStyle = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', background: '#fff', boxSizing: 'border-box' as const }
const labelStyle = { fontSize: 13, fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: 4 }

const CAT_DEPENSES = ['loyer', 'stock', 'transport', 'salaires', 'marketing', 'fournitures', 'taxes', 'autre']

// ── Dashboard ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', flex: '1 1 120px', minWidth: 120, boxSizing: 'border-box' }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color ?? '#111' }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

function DashboardView({ boutiqueId }: { boutiqueId: string }) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cacheKey = `nopalou_offline_compta_dash_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed) {
          setData(parsed)
          setLoading(false)
        }
      } catch(e) {}
    }

    getDashboard(boutiqueId)
      .then(d => { 
        if (d) {
          setData(d)
          localStorage.setItem(cacheKey, JSON.stringify(d))
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
      })
  }, [boutiqueId])

  if (loading) return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} aria-busy="true" aria-label="Chargement du tableau de bord comptable">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 86, flex: 1, minWidth: 140, borderRadius: 12 }} />
      ))}
    </div>
  )
  if (!data)   return <p style={{ color: '#dc2626', fontSize: 14 }}>Impossible de charger le tableau de bord.</p>

  const evol = data.ca_mois_precedent > 0
    ? ((data.ca_mois - data.ca_mois_precedent) / data.ca_mois_precedent * 100).toFixed(0)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs principaux */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          label="CA ce mois"
          value={fcfa(data.ca_mois)}
          sub={evol ? `${Number(evol) >= 0 ? '▲' : '▼'} ${Math.abs(Number(evol))}% vs mois dernier` : undefined}
          color="#1d4ed8"
        />
        <KpiCard label="Dépenses mois" value={fcfa(data.depenses_mois)} color="#dc2626" />
        <KpiCard
          label="Bénéfice net"
          value={fcfa(data.benefice_mois)}
          color={data.benefice_mois >= 0 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard label="Ventes mois" value={String(data.nb_ventes_mois)} sub="transactions" />
      </div>

      {/* Top produits */}
      {data.top_produits.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151' }}>🏆 Top produits ce mois</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.top_produits.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#374151' }}>{i + 1}. {p.nom_produit}</span>
                <span style={{ color: '#6b7280' }}>{p.total_vendu} vendu{p.total_vendu > 1 ? 's' : ''} · {fcfa(p.ca)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertes stock */}
      {data.stock_alerte.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>⚠️ Stock bas</p>
          {data.stock_alerte.map(p => (
            <p key={p.id} style={{ margin: '4px 0', fontSize: 13, color: '#b45309' }}>
              {p.nom} — <strong>{p.stock_quantite} restant{p.stock_quantite > 1 ? 's' : ''}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulaire vente ──────────────────────────────────────────────────────────

function VenteForm({ boutiqueId, produits, zones, onDone }: { boutiqueId: string; produits: Produit[]; zones: Zone[]; onDone: () => void }) {
  const [produitId, setProduitId] = useState('')
  const [nomLibre, setNomLibre] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prix, setPrix] = useState<number>(0)
  const [zoneId, setZoneId] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState('cash')
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleProduit(id: string) {
    setProduitId(id)
    const p = produits.find(p => p.id === id)
    if (p?.prix) setPrix(p.prix)
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await declarerVente(boutiqueId, {
        produit_id: produitId || undefined,
        nom_produit: produitId ? undefined : (nomLibre || 'Produit'),
        quantite, prix_unitaire: prix,
        zone_livraison_id: zoneId || undefined,
        client_nom: clientNom || undefined,
        client_telephone: clientTel || undefined,
        methode_paiement: paiement,
      })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/ventes/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      onDone()
    })
  }

  const stock = produits.find(p => p.id === produitId)?.stock_quantite

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Nouvelle vente</p>
      {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}

      {produits.length > 0 && (
        <div>
          <label style={labelStyle}>Produit du catalogue</label>
          <select value={produitId} onChange={e => handleProduit(e.target.value)} style={inputStyle}>
            <option value="">— Sélectionner (ou saisir manuellement) —</option>
            {produits.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom}{p.prix ? ` — ${fcfa(p.prix)}` : ''}{p.stock_quantite !== null ? ` (stock: ${p.stock_quantite})` : ''}
              </option>
            ))}
          </select>
          {stock !== null && stock !== undefined && stock <= 3 && (
            <p style={{ fontSize: 11, color: '#b45309', margin: '4px 0 0' }}>⚠️ Stock bas : {stock} restant{stock > 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {!produitId && (
        <div>
          <label style={labelStyle}>Nom du produit / service</label>
          <input value={nomLibre} onChange={e => setNomLibre(e.target.value)} style={inputStyle} placeholder="Ex: Réparation téléphone, Robe Wax…" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Quantité</label>
          <input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Prix unitaire (FCFA)</label>
          <input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {zones.length > 0 && (
        <div>
          <label style={labelStyle}>Zone de livraison</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
            <option value="">— Sans livraison —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fcfa(z.prix)}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nom client</label>
          <input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder="Optionnel" />
        </div>
        <div>
          <label style={labelStyle}>Téléphone client</label>
          <input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Mode de paiement</label>
        <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
          <option value="cash">Espèces</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
          <option value="virement">Virement</option>
        </select>
      </div>

      {prix > 0 && (
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>
          Total : {fcfa(prix * quantite + (zoneId ? (zones.find(z => z.id === zoneId)?.prix ?? 0) : 0))}
        </div>
      )}

      <div>
        <label style={labelStyle}>Pièce jointe (facture, reçu…)</label>
        <input
          type="file" accept="image/*,application/pdf"
          onChange={e => setFichier(e.target.files?.[0] ?? null)}
          style={{ fontSize: 13, color: '#374151' }}
        />
        {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
      </div>

      <button onClick={submit} disabled={uploading} style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: uploading ? 0.7 : 1 }}>
        {uploading ? 'Envoi du justificatif…' : 'Enregistrer la vente'}
      </button>
    </div>
  )
}

// ── Ventes ────────────────────────────────────────────────────────────────────

function EditVenteModal({ vente, boutiqueId, onClose, onDone }: { vente: Vente; boutiqueId: string; onClose: () => void; onDone: () => void }) {
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
      onDone(); onClose()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>Modifier la vente</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>
        {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
        <div>
          <label style={labelStyle}>Produit / service</label>
          <input value={nomProduit} onChange={e => setNomProduit(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Quantité</label><input type="number" min={1} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Prix unitaire (FCFA)</label><input type="number" min={0} value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} /></div>
        </div>
        <div>
          <label style={labelStyle}>Frais de livraison (FCFA)</label>
          <input type="number" min={0} value={frais} onChange={e => setFrais(Number(e.target.value))} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Nom client</label><input value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} placeholder="Optionnel" /></div>
          <div><label style={labelStyle}>Téléphone</label><input value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} placeholder="Optionnel" /></div>
        </div>
        <div>
          <label style={labelStyle}>Mode de paiement</label>
          <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
            <option value="cash">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="virement">Virement</option>
          </select>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>
          Nouveau total : {fcfa(prix * quantite + frais)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} style={{ flex: 1, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Enregistrer</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

function VentesView({ boutiqueId }: { boutiqueId: string }) {
  const [ventes, setVentes] = useState<Vente[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingVente, setEditingVente] = useState<Vente | null>(null)
  const [, startTransition] = useTransition()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    const cacheKeyV = `nopalou_offline_compta_ventes_${boutiqueId}`
    const cacheKeyZ = `nopalou_offline_compta_zones_${boutiqueId}`
    const cachedV = localStorage.getItem(cacheKeyV)
    const cachedZ = localStorage.getItem(cacheKeyZ)

    if (cachedV) { try { setVentes(JSON.parse(cachedV)) } catch(e) {} }
    if (cachedZ) { try { setZones(JSON.parse(cachedZ)) } catch(e) {} }

    try {
      const [v, z, p] = await Promise.all([
        listVentes(boutiqueId),
        listZones(boutiqueId),
        getBoutiqueProduits(boutiqueId),
      ])
      if (Array.isArray(v)) { setVentes(v); localStorage.setItem(cacheKeyV, JSON.stringify(v)) }
      if (Array.isArray(z)) { setZones(z); localStorage.setItem(cacheKeyZ, JSON.stringify(z)) }
      if (Array.isArray(p)) setProduits(p)
    } catch (err) {
      console.warn(`📊 [Comptabilité] Mode hors-ligne : utilisation du cache local ventes/zones (${cachedV ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function removeVente(id: string) {
    if (!confirm('Supprimer cette vente ? Elle ne sera plus comptabilisée.')) return
    setDeleting(id)
    startTransition(async () => {
      await deleteVente(boutiqueId, id)
      setDeleting(null)
      load()
    })
  }

  const methodeLabel: Record<string, string> = { cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement' }

  function exportVentesCSV() {
    const headers = ['Référence', 'Produit/Service', 'Quantité', 'Prix Unitaire (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)', 'Client', 'Mode Paiement', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      v.prix_unitaire,
      v.frais_livraison,
      v.montant_total,
      v.client_nom || 'Client Anonyme',
      methodeLabel[v.methode_paiement] || v.methode_paiement,
      fmtDateHeure(v.created_at)
    ])
    exportToCSV(`ventes_boutique_${boutiqueId}`, headers, rows)
  }

  function exportVentesPDF() {
    const headers = ['Réf.', 'Produit', 'Qte', 'Prix Unit.', 'Total', 'Client', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      `${v.prix_unitaire.toLocaleString('fr-FR')} FCFA`,
      `${v.montant_total.toLocaleString('fr-FR')} FCFA`,
      v.client_nom || 'Client Anonyme',
      fmtDateHeure(v.created_at)
    ])
    const totalCA = ventes.reduce((s, v) => s + Number(v.montant_total), 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Bilan des Ventes</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#16a34a;">Total Ventes Enregistrées : ${totalCA.toLocaleString('fr-FR')} FCFA (${ventes.length} transactions)</p>
      </div>
    `
    printPDFReport('Registre & Bilan des Ventes', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {editingVente && <EditVenteModal vente={editingVente} boutiqueId={boutiqueId} onClose={() => setEditingVente(null)} onDone={load} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{ventes.length} vente{ventes.length !== 1 ? 's' : ''} enregistrée{ventes.length !== 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportVentesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 Excel (CSV)
          </button>
          <button onClick={exportVentesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Imprimer PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + Déclarer une vente
          </button>
        </div>
      </div>

      {showForm && (
        <VenteForm boutiqueId={boutiqueId} produits={produits} zones={zones} onDone={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : ventes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          Aucune vente enregistrée. Cliquez sur &quot;+ Déclarer une vente&quot; pour commencer.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ventes.map(v => (
            <div key={v.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{v.nom_produit}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {v.quantite} × {fcfa(v.prix_unitaire)}
                  {v.frais_livraison > 0 ? ` + ${fcfa(v.frais_livraison)} livraison` : ''}
                  {v.client_nom ? ` · ${v.client_nom}` : ''}
                  {' · '}{methodeLabel[v.methode_paiement] ?? v.methode_paiement}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  {fmtDate(v.created_at)} · Réf {v.reference}
                </p>
                {v.justificatif_url && (
                  <a href={v.justificatif_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                    📎 Justificatif ↗
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1d4ed8' }}>{fcfa(v.montant_total)}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <a href={`/boutique/ventes/facture/${boutiqueId}/${v.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6b7280' }}>
                    PDF ↗
                  </a>
                  <button
                    onClick={() => setEditingVente(v)}
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11 }}
                  >✎</button>
                  <button
                    onClick={() => removeVente(v.id)}
                    disabled={deleting === v.id}
                    style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, opacity: deleting === v.id ? 0.5 : 1 }}
                    title="Archiver"
                  >✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dépenses ──────────────────────────────────────────────────────────────────

function DepenseCard({ depense: d, boutiqueId, onDelete, onUpdated }: {
  depense: Depense; boutiqueId: string; onDelete: (id: string) => void; onUpdated: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [eMontant, setEMontant] = useState(String(d.montant))
  const [eCategorie, setECategorie] = useState(d.categorie)
  const [eDesc, setEDesc] = useState(d.description ?? '')
  const [eDate, setEDate] = useState(d.date_depense.slice(0, 10))
  const [eError, setEError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const fileRef = { current: null as HTMLInputElement | null }

  function saveEdit() {
    if (!eMontant || Number(eMontant) <= 0) { setEError('Montant invalide'); return }
    setEError(null)
    startTransition(async () => {
      const res = await updateDepense(boutiqueId, d.id, {
        montant: Number(eMontant), categorie: eCategorie,
        description: eDesc || undefined, date_depense: eDate,
      })
      if (res.error) { setEError(res.error); return }
      setEditing(false); onUpdated()
    })
  }

  async function uploadJustificatif(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('justificatif', file)
      const res = await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${d.id}/justificatif`, {
        method: 'POST', body: form,
      })
      if (res.ok) onUpdated()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px' }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eError && <div style={{ background: '#fef2f2', borderRadius: 6, padding: '6px 10px', color: '#dc2626', fontSize: 12 }}>{eError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>Montant (FCFA)</label><input type="number" min={1} value={eMontant} onChange={e => setEMontant(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Date</label><input type="date" value={eDate} onChange={e => setEDate(e.target.value)} style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Catégorie</label>
            <select value={eCategorie} onChange={e => setECategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Description</label><input value={eDesc} onChange={e => setEDesc(e.target.value)} style={inputStyle} placeholder="Optionnel" /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Enregistrer</button>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
          </div>
        </div>
      ) : (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
              {d.categorie}
            </span>
            {d.description && <span style={{ fontSize: 13, color: '#374151' }}>{d.description}</span>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{fmtDate(d.date_depense)}</p>
          {/* Justificatif */}
          <div style={{ marginTop: 6 }}>
            {d.justificatif_url ? (
              <a href={d.justificatif_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                📎 Justificatif ↗
              </a>
            ) : (
              <>
                <input
                  ref={el => { fileRef.current = el }}
                  type="file" accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadJustificatif(f) }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {uploading ? 'Envoi…' : '+ Ajouter justificatif'}
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#dc2626' }}>{fcfa(d.montant)}</span>
          <button onClick={() => setEditing(true)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', fontSize: 12 }} title="Modifier">✎</button>
          <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }} title="Archiver">✕</button>
        </div>
      </div>
      )}
    </div>
  )
}

function DepensesView({ boutiqueId }: { boutiqueId: string }) {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('stock')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function load() {
    const cacheKey = `nopalou_offline_compta_depenses_${boutiqueId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) { try { setDepenses(JSON.parse(cached)) } catch(e) {} }

    try {
      const d = await listDepenses(boutiqueId)
      if (Array.isArray(d)) {
        setDepenses(d)
        localStorage.setItem(cacheKey, JSON.stringify(d))
      }
    } catch (err) {
      console.warn(`📊 [Comptabilité] Mode hors-ligne : utilisation du cache local dépenses (${cached ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!montant || Number(montant) <= 0) { setError('Montant invalide'); return }
    setError(null)
    startTransition(async () => {
      const res = await addDepense(boutiqueId, { montant: Number(montant), categorie, description: description || undefined, date_depense: date })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      setMontant(''); setDescription(''); setFichier(null); setShowForm(false)
      load()
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    startTransition(async () => { await deleteDepense(boutiqueId, id); load() })
  }

  const total = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const now = new Date(); const mois = `${MOIS_NOMS[now.getMonth()]} ${now.getFullYear()}`

  function exportDepensesCSV() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant (FCFA)']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      d.montant
    ])
    exportToCSV(`depenses_boutique_${boutiqueId}`, headers, rows)
  }

  function exportDepensesPDF() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      `${Number(d.montant).toLocaleString('fr-FR')} FCFA`
    ])
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Registre des Dépenses</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#dc2626;">Total Dépenses : ${total.toLocaleString('fr-FR')} FCFA (${depenses.length} entrées)</p>
      </div>
    `
    printPDFReport('Registre des Dépenses', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Total affiché : <strong style={{ color: '#dc2626' }}>{fcfa(total)}</strong></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportDepensesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 Excel (CSV)
          </button>
          <button onClick={exportDepensesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Imprimer PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + Ajouter une dépense
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Montant (FCFA) *</label>
              <input type="number" min={1} value={montant} onChange={e => setMontant(e.target.value)} style={inputStyle} placeholder="Ex: 25000" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Catégorie</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="Ex: Achat stock riz, Livraison DHL…" />
          </div>
          <div>
            <label style={labelStyle}>Pièce jointe (facture, reçu…)</label>
            <input
              type="file" accept="image/*,application/pdf"
              onChange={e => setFichier(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13, color: '#374151' }}
            />
            {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={submit} disabled={uploading} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? 'Envoi du justificatif…' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : depenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          Aucune dépense enregistrée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {depenses.map(d => (
            <DepenseCard key={d.id} depense={d} boutiqueId={boutiqueId} onDelete={remove} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export function StockView({ boutiqueId }: { boutiqueId: string }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [stockVal, setStockVal] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function load() {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutiqueId)
      if (prods && prods.length > 0) {
        setProduits(prods)
      } else {
        // Fallback si vide + potentiellement hors ligne
        const cache = localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`)
        if (cache) {
          try {
            const parsed = JSON.parse(cache)
            if (Array.isArray(parsed)) setProduits(parsed)
          } catch {}
        }
      }
    } catch (e) {
      console.warn("StockView offline fallback", e)
      const cache = localStorage.getItem(`nopalou_pos_produits_${boutiqueId}`)
      if (cache) {
        try {
          const parsed = JSON.parse(cache)
          if (Array.isArray(parsed)) setProduits(parsed)
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function saveStock(produitId: string) {
    const val = stockVal[produitId]
    if (val === undefined || val === '') return
    startTransition(async () => {
      await updateStock(boutiqueId, produitId, Number(val))
      setEditing(null)
      load()
    })
  }

  function exportStockCSV() {
    const headers = ['ID Produit', 'Nom Produit', 'Prix (FCFA)', 'Quantité en Stock', 'Statut Stock']
    const rows = produits.map(p => [
      p.id,
      p.nom,
      p.prix || 0,
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? 'STOCK BAS' : 'DISPONIBLE'
    ])
    exportToCSV(`inventaire_stock_${boutiqueId}`, headers, rows)
  }

  function exportStockPDF() {
    const headers = ['ID', 'Nom Produit', 'Prix', 'Stock Restant', 'Statut']
    const rows = produits.map(p => [
      p.id.slice(0, 8),
      p.nom,
      p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—',
      (p.quantite_stock ?? p.stock_quantite) ?? 'Non suivi',
      (p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '⚠️ BAS' : '✅ OK'
    ])
    printPDFReport('Inventaire État des Stocks', `Boutique ${boutiqueId}`, headers, rows)
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>

  if (produits.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
      Aucun produit dans le catalogue. Ajoutez des produits via l&apos;onglet &quot;Catalogue produits&quot;.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Inventaire ({produits.length} références)</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportStockCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📥 Excel (CSV)
          </button>
          <button onClick={exportStockPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Imprimer PDF
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {produits.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>ID: {p.id.slice(0, 8)}</p>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              {p.prix ? `${p.prix.toLocaleString('fr-FR')} FCFA` : '—'}
            </div>
          </div>
          {editing === p.id ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                value={stockVal[p.id] ?? ((p.quantite_stock ?? p.stock_quantite) ?? '')}
                onChange={e => setStockVal(prev => ({ ...prev, [p.id]: e.target.value }))}
                style={{ ...inputStyle, width: 80 }}
                autoFocus
              />
              <button onClick={() => saveStock(p.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: (p.quantite_stock ?? p.stock_quantite) === null ? '#f1f5f9' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#fef2f2' : '#dcfce7',
                color: (p.quantite_stock ?? p.stock_quantite) === null ? '#9ca3af' : (p.quantite_stock ?? p.stock_quantite)! <= 3 ? '#dc2626' : '#16a34a',
              }}>
                {(p.quantite_stock ?? p.stock_quantite) === null ? 'Non suivi' : `${(p.quantite_stock ?? p.stock_quantite)} en stock`}
              </span>
              <button onClick={() => { setEditing(p.id); setStockVal(prev => ({ ...prev, [p.id]: String((p.quantite_stock ?? p.stock_quantite) ?? '') })) }}
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                Modifier
              </button>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  )
}

// ── Saisie Express ───────────────────────────────────────────────────────────

function SaisieExpressView({ boutiqueId }: { boutiqueId: string }) {
  const [mode, setMode] = useState<'vente' | 'depense'>('vente')
  const [produits, setProduits] = useState<Produit[]>([])
  const [produitSel, setProduitSel] = useState<string>('')
  const [nomLibre, setNomLibre] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [prix, setPrix] = useState('')
  const [methodePaiement, setMethodePaiement] = useState('especes')
  const [clientNom, setClientNom] = useState('')
  
  // Dépense
  const [montantDepense, setMontantDepense] = useState('')
  const [catDepense, setCatDepense] = useState('stock')
  const [descDepense, setDescDepense] = useState('')

  const [loading, setLoading] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState('')

  useEffect(() => {
    getBoutiqueProduits(boutiqueId).then(p => setProduits(p || [])).catch(() => {})
  }, [boutiqueId])

  const handleSelectProduit = (pId: string) => {
    setProduitSel(pId)
    const p = produits.find(item => item.id === pId)
    if (p) {
      setNomLibre(p.nom)
      if (p.prix) setPrix(String(p.prix))
    }
  }

  const [modalScannerVente, setModalScannerVente] = useState(false)
  const videoVenteRef = useRef<HTMLVideoElement | null>(null)
  const streamVenteRef = useRef<MediaStream | null>(null)
  const [ocrDetectionsVente, setOcrDetectionsVente] = useState<string[]>([])
  const [statusScannerVente, setStatusScannerVente] = useState('')

  async function demarrerScannerVente() {
    setModalScannerVente(true)
    setOcrDetectionsVente([])
    setStatusScannerVente('📷 Cadrez le nom sur l’emballage du produit...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamVenteRef.current = stream
      if (videoVenteRef.current) {
        videoVenteRef.current.srcObject = stream
        await videoVenteRef.current.play().catch(() => {})
      }
      if (typeof window !== 'undefined' && 'TextDetector' in window) {
        const detector = new (window as any).TextDetector()
        const timer = setInterval(async () => {
          if (videoVenteRef.current && videoVenteRef.current.readyState === 4) {
            try {
              const texts = await detector.detect(videoVenteRef.current)
              if (texts && texts.length > 0) {
                const extraits = texts.map((t: any) => t.rawValue).filter((t: string) => t && t.length > 2)
                if (extraits.length > 0) {
                  setOcrDetectionsVente(prev => Array.from(new Set([...extraits, ...prev])).slice(0, 6))
                }
              }
            } catch (e) {}
          }
        }, 600)
        ;(videoVenteRef.current as any)._textTimer = timer
      }
    } catch (e) {
      setStatusScannerVente('❌ Impossible d’accéder à la caméra.')
    }
  }

  function arreterScannerVente() {
    if (videoVenteRef.current && (videoVenteRef.current as any)._textTimer) {
      clearInterval((videoVenteRef.current as any)._textTimer)
    }
    if (streamVenteRef.current) {
      streamVenteRef.current.getTracks().forEach(t => t.stop())
      streamVenteRef.current = null
    }
    setModalScannerVente(false)
  }

  function capturerEtLireNomVente() {
    if (!videoVenteRef.current) return
    setStatusScannerVente('🔍 Analyse du texte sur l’emballage...')
    const canvas = document.createElement('canvas')
    canvas.width = videoVenteRef.current.videoWidth || 640
    canvas.height = videoVenteRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(videoVenteRef.current, 0, 0, canvas.width, canvas.height)

    if (typeof window !== 'undefined' && 'TextDetector' in window) {
      const detector = new (window as any).TextDetector()
      detector.detect(canvas).then((texts: any[]) => {
        if (texts && texts.length > 0) {
          const trouves = texts.map((t: any) => t.rawValue).filter((t: string) => t && t.trim().length > 1)
          if (trouves.length > 0) {
            setOcrDetectionsVente(Array.from(new Set(trouves)).slice(0, 6))
            const meilleur = trouves.sort((a, b) => b.length - a.length)[0]
            setNomLibre(meilleur)
            setStatusScannerVente(`✅ Nom capturé : "${meilleur}"`)
            return
          }
        }
        setStatusScannerVente('⚠️ Aucun texte détecté automatiquement. Saisissez le nom.')
      }).catch(() => {
        setStatusScannerVente('⚠️ Détection indisponible sur ce navigateur.')
      })
    } else {
      setStatusScannerVente('📷 Prenez une photo nette du nom sur le produit.')
    }
  }

  const handleValiderVenteRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    const qteNum = Number(quantite) || 1
    const prixNum = Number(prix) || 0
    if (prixNum <= 0) {
      alert('Veuillez saisir un prix valide (> 0).')
      return
    }

    setLoading(true)
    const res = await declarerVente(boutiqueId, {
      produit_id: produitSel || undefined,
      nom_produit: nomLibre.trim() || 'Vente rapide',
      quantite: qteNum,
      prix_unitaire: prixNum,
      methode_paiement: methodePaiement,
      client_nom: clientNom.trim() || undefined,
    })

    setLoading(false)
    if (res.success) {
      setMsgSuccess('⚡ Vente enregistrée avec succès !')
      setNomLibre('')
      setPrix('')
      setQuantite('1')
      setProduitSel('')
      setClientNom('')
      setTimeout(() => setMsgSuccess(''), 3000)
    } else {
      alert(res.error || 'Erreur lors de l’enregistrement')
    }
  }

  const handleValiderDepenseRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    const mNum = Number(montantDepense) || 0
    if (mNum <= 0) {
      alert('Veuillez saisir un montant valide.')
      return
    }

    setLoading(true)
    const res = await addDepense(boutiqueId, {
      montant: mNum,
      categorie: catDepense,
      description: descDepense.trim() || undefined,
    })

    setLoading(false)
    if (res.success) {
      setMsgSuccess('⚡ Dépense enregistrée avec succès !')
      setMontantDepense('')
      setDescDepense('')
      setTimeout(() => setMsgSuccess(''), 3000)
    } else {
      alert(res.error || 'Erreur lors de l’enregistrement')
    }
  }

  const totalCalculVente = (Number(quantite) || 1) * (Number(prix) || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Selector Mode Vente / Dépense */}
      <div style={{ display: 'flex', gap: 10, background: '#f1f5f9', padding: 6, borderRadius: 16, border: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={() => setMode('vente')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'vente' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: mode === 'vente' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'vente' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ + Vente Rapide (Encaissement)
        </button>

        <button
          type="button"
          onClick={() => setMode('depense')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'depense' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: mode === 'depense' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'depense' ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ - Dépense Rapide (Sortie Caisse)
        </button>
      </div>

      {msgSuccess && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
          {msgSuccess}
        </div>
      )}

      {mode === 'vente' ? (
        <form onSubmit={handleValiderVenteRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              💰 Encaissement d&apos;une Vente Directe
            </h3>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              ⚡ Saisie 1-Clic Sans POS
            </span>
          </div>

          {produits.length > 0 && (
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Sélectionner un produit du catalogue (Optionnel)</label>
              <select
                value={produitSel}
                onChange={e => handleSelectProduit(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              >
                <option value="">-- Choisir un produit du catalogue --</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>{p.nom} {p.prix ? `(${fcfa(p.prix)})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Article / Libellé de la vente *</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                required
                placeholder="Ex: Sac de riz 25kg, Canette de boisson, Vente comptoir"
                value={nomLibre}
                onChange={e => setNomLibre(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12, flex: 1 }}
              />
              <button
                type="button"
                onClick={demarrerScannerVente}
                style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                title="Scanner le nom écrit sur le produit par caméra"
              >
                📷 Scan Nom
              </button>
            </div>
          </div>

          {modalScannerVente && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>📷 Scanner le Nom pour la Vente</h4>
                  <button type="button" onClick={arreterScannerVente} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>{statusScannerVente}</p>
                <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: '#000', position: 'relative' }}>
                  <video ref={videoVenteRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 30, border: '2px dashed #38bdf8', borderRadius: 12, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Cadrez le texte du produit ici
                    </span>
                  </div>
                </div>
                <button type="button" onClick={capturerEtLireNomVente} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                  📸 Capturer & Lire le Nom sur le produit
                </button>
                {ocrDetectionsVente.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: '#f8fafc', padding: 10, borderRadius: 10 }}>
                    {ocrDetectionsVente.map((txt, idx) => (
                      <button key={idx} type="button" onClick={() => { setNomLibre(txt); arreterScannerVente(); }} style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {txt}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={arreterScannerVente} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 800, cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Prix Unitaire (FCFA) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ex: 15000"
                value={prix}
                onChange={e => setPrix(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 900, color: '#0f172a' }}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Quantité *</label>
              <input
                type="number"
                required
                min="1"
                value={quantite}
                onChange={e => setQuantite(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 900 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Mode de Paiement Reçu</label>
              <select
                value={methodePaiement}
                onChange={e => setMethodePaiement(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              >
                <option value="especes">💵 Espèces (Cash)</option>
                <option value="wave">🌊 Wave Senegal</option>
                <option value="orange_money">🍊 Orange Money</option>
                <option value="carte">💳 Carte Bancaire</option>
                <option value="cheque">📜 Chèque</option>
              </select>
            </div>

            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Nom du Client (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Client comptoir"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
              />
            </div>
          </div>

          {/* Total Calculé en Direct */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Encaissé</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fcfa(totalCalculVente)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff', border: 'none', borderRadius: 14, padding: '16px',
              fontWeight: 900, fontSize: 15, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            {loading ? 'Enregistrement de la vente...' : '✓ Valider & Enregistrer la Vente'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleValiderDepenseRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              📉 Comptabiliser une Dépense / Sortie de Caisse
            </h3>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 12, border: '1px solid #fecaca' }}>
              ⚡ Sortie Caisse Rapide
            </span>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Catégorie de Dépense</label>
            <select
              value={catDepense}
              onChange={e => setCatDepense(e.target.value)}
              style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
            >
              <option value="stock">📦 Achats Stock / Fournisseur</option>
              <option value="transport">🚚 Transport / Livraisons</option>
              <option value="loyer">🏠 Loyer Commerce</option>
              <option value="salaires">👥 Salaires & Avances Personnel</option>
              <option value="fournitures">💡 Électricité, Eau & Fournitures</option>
              <option value="marketing">📣 Marketing & Publicité</option>
              <option value="taxes">⚖️ Taxes & Fiscalité</option>
              <option value="autre">➕ Autre dépense informelle</option>
            </select>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Montant de la Dépense (FCFA) *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="Ex: 2500"
              value={montantDepense}
              onChange={e => setMontantDepense(e.target.value)}
              style={{ ...inputStyle, borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 900, color: '#ef4444' }}
            />
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>Description / Note explicative</label>
            <input
              type="text"
              placeholder="Ex: Achat fournitures bureau, Transport marchandises Medina..."
              value={descDepense}
              onChange={e => setDescDepense(e.target.value)}
              style={{ ...inputStyle, borderRadius: 12, padding: 12 }}
            />
          </div>

          {/* Total Sortie en Direct */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>TOTAL SORTIE CAISSE</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{fcfa(Number(montantDepense) || 0)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff', border: 'none', borderRadius: 14, padding: '16px',
              fontWeight: 900, fontSize: 15, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            {loading ? 'Enregistrement de la dépense...' : '✓ Valider & Enregistrer la Dépense'}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Comptabilite({ boutiqueId, initialTab = 'dashboard' }: { boutiqueId: string; initialTab?: 'dashboard' | 'express' | 'ventes' | 'depenses' }) {
  const [tab, setTab] = useState<'dashboard' | 'express' | 'ventes' | 'depenses'>(initialTab)

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  const tabBtn = (t: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(t)} style={{
      padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: tab === t ? 700 : 500,
      color: tab === t ? '#C75B00' : '#6b7280',
      borderBottom: tab === t ? '2px solid #C75B00' : '2px solid transparent',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  )

  return (
    <div>
      <div className="nopalou-scroll-tabs" style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {tabBtn('dashboard', '📊 Tableau de bord')}
        {tabBtn('express',   '⚡ Saisie Express (Ventes & Dépenses)')}
        {tabBtn('ventes',    '💰 Ventes')}
        {tabBtn('depenses',  '📉 Dépenses')}
      </div>

      {tab === 'dashboard' && <DashboardView boutiqueId={boutiqueId} />}
      {tab === 'express'   && <SaisieExpressView boutiqueId={boutiqueId} />}
      {tab === 'ventes'    && <VentesView    boutiqueId={boutiqueId} />}
      {tab === 'depenses'  && <DepensesView  boutiqueId={boutiqueId} />}
    </div>
  )
}

// ── Zones de livraison ────────────────────────────────────────────────────────

export function ZonesView({ boutiqueId }: { boutiqueId: string }) {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [, startTransition] = useTransition()

  async function load() { setLoading(true); const z = await listZones(boutiqueId); setZones(z); setLoading(false) }
  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!nom.trim() || !prix) return
    startTransition(async () => {
      await createZone(boutiqueId, nom.trim(), Number(prix))
      setNom(''); setPrix(''); setShowForm(false); load()
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    startTransition(async () => { await deleteZone(boutiqueId, id); load() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{zones.length} zone{zones.length !== 1 ? 's' : ''} de livraison</p>
        <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
          + Ajouter une zone
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nom de la zone</label>
            <input value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Ex: Dakar Plateau, Banlieue…" />
          </div>
          <div style={{ width: 130 }}>
            <label style={labelStyle}>Frais (FCFA)</label>
            <input type="number" min={0} value={prix} onChange={e => setPrix(e.target.value)} style={inputStyle} placeholder="0" />
          </div>
          <button onClick={submit} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Ajouter</button>
        </div>
      )}

      {loading ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p> : zones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          Aucune zone de livraison. Ajoutez-en pour calculer les frais automatiquement.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zones.map(z => (
            <div key={z.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{z.nom}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{fcfa(z.prix)}</span>
                <button onClick={() => remove(z.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
