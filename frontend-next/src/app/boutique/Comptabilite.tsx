'use client'
import { useEffect, useState, useTransition } from 'react'
import { listZones, createZone, deleteZone, listVentes, declarerVente } from './actions'
import { fcfa } from '@/lib/format'

interface Zone { id: string; nom: string; prix: number }
interface Vente {
  id: string; reference: string; nom_produit: string; quantite: number
  prix_unitaire: number; frais_livraison: number; montant_total: number
  client_nom: string | null; methode_paiement: string; created_at: string
}
interface Produit { id: string; nom: string; prix: number | null }

const inputStyle = {
  padding: '10px 14px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, width: '100%',
  background: '#fff', boxSizing: 'border-box' as const,
}

function VenteForm({ boutiqueId, produits, zones, onDone }: {
  boutiqueId: string; produits: Produit[]; zones: Zone[]; onDone: () => void
}) {
  const [produitId, setProduitId] = useState('')
  const [nomLibre, setNomLibre] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [prix, setPrix] = useState<number>(0)
  const [zoneId, setZoneId] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [paiement, setPaiement] = useState('cash')
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
      if (res.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
      <h4 style={{ margin: 0, fontSize: 14 }}>✅ Déclarer une vente</h4>
      {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <select value={produitId} onChange={e => handleProduit(e.target.value)} style={inputStyle}>
        <option value="">— Produit hors catalogue —</option>
        {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
      {!produitId && (
        <input placeholder="Nom du produit vendu" value={nomLibre} onChange={e => setNomLibre(e.target.value)} style={inputStyle} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input type="number" min={1} placeholder="Quantité" value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={inputStyle} />
        <input type="number" min={0} placeholder="Prix unitaire (FCFA)" value={prix} onChange={e => setPrix(Number(e.target.value))} style={inputStyle} />
      </div>
      <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
        <option value="">— Sans livraison —</option>
        {zones.map(z => <option key={z.id} value={z.id}>{z.nom} ({fcfa(z.prix)})</option>)}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input placeholder="Nom client (optionnel)" value={clientNom} onChange={e => setClientNom(e.target.value)} style={inputStyle} />
        <input placeholder="Téléphone client (optionnel)" value={clientTel} onChange={e => setClientTel(e.target.value)} style={inputStyle} />
      </div>
      <select value={paiement} onChange={e => setPaiement(e.target.value)} style={inputStyle}>
        <option value="cash">Espèces</option>
        <option value="wave">Wave</option>
        <option value="orange_money">Orange Money</option>
        <option value="virement">Virement</option>
      </select>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={submit} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>
          Enregistrer la vente
        </button>
        <button onClick={onDone} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

function ZonesManager({ boutiqueId, zones, onChange }: { boutiqueId: string; zones: Zone[]; onChange: () => void }) {
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function add() {
    if (!nom.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await createZone(boutiqueId, nom, prix)
      if (res.error) setError(res.error)
      else { setNom(''); setPrix(0); onChange() }
    })
  }

  function remove(id: string) {
    startTransition(async () => { await deleteZone(boutiqueId, id); onChange() })
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ fontSize: 14, margin: '0 0 8px' }}>📍 Zones de livraison</h4>
      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 6 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {zones.map(z => (
          <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px' }}>
            <span style={{ fontSize: 13 }}>{z.nom} — {fcfa(z.prix)}</span>
            <button onClick={() => remove(z.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Ex: Dakar" value={nom} onChange={e => setNom(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input type="number" min={0} placeholder="Prix" value={prix} onChange={e => setPrix(Number(e.target.value))} style={{ ...inputStyle, width: 120 }} />
        <button onClick={add} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontWeight: 700 }}>+</button>
      </div>
    </div>
  )
}

export default function Comptabilite({ boutiqueId }: { boutiqueId: string }) {
  const [zones, setZones] = useState<Zone[]>([])
  const [ventes, setVentes] = useState<Vente[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function reload() {
    setLoading(true)
    const [z, v] = await Promise.all([listZones(boutiqueId), listVentes(boutiqueId)])
    setZones(z); setVentes(v)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits`)
      .then(r => r.json())
      .then(d => setProduits(d.produits ?? []))
      .catch(() => setProduits([]))
  }, [boutiqueId]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalVentes = ventes.reduce((s, v) => s + Number(v.montant_total), 0)

  return (
    <div>
      <ZonesManager boutiqueId={boutiqueId} zones={zones} onChange={reload} />

      {showForm ? (
        <VenteForm boutiqueId={boutiqueId} produits={produits} zones={zones} onDone={() => { setShowForm(false); reload() }} />
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 18px', fontWeight: 700, cursor: 'pointer', marginBottom: 16,
        }}>
          ✅ Déclarer une vente
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>📒 Historique des ventes {ventes.length > 0 && `(${ventes.length} — total ${fcfa(totalVentes)})`}</h4>
        <a href={`/boutique/ventes/export/${boutiqueId}`} style={{ fontSize: 13, color: '#1d4ed8' }}>⬇ Export CSV</a>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : ventes.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucune vente enregistrée.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ventes.map(v => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{v.nom_produit} × {v.quantite}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{v.reference} · {new Date(v.created_at).toLocaleDateString('fr-FR')} {v.client_nom ? `· ${v.client_nom}` : ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#C75B00' }}>{fcfa(v.montant_total)}</span>
                <a href={`/boutique/ventes/facture/${boutiqueId}/${v.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1d4ed8' }}>Facture PDF</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
