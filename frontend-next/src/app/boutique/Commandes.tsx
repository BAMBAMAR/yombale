'use client'
import { useEffect, useState, useTransition } from 'react'
import { listCommandes, updateStatutCommande } from './actions'
import { fmtDateHeure } from '@/lib/format'

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
    startTransition(async () => {
      await updateStatutCommande(boutiqueId, commande.id, statut)
      setLoading(false)
      onUpdate()
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
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  💳 {({ wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement' } as Record<string,string>)[commande.methode_paiement] ?? commande.methode_paiement}
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

          {/* Actions de statut */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {next.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Passer à :</span>
                {next.map(s => {
                  const info = STATUTS.find(x => x.key === s)!
                  return (
                    <button key={s} onClick={() => changeStatut(s)} disabled={loading} style={{
                      fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
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

export default function Commandes({ boutiqueId }: { boutiqueId: string }) {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('')

  async function load() {
    setLoading(true)
    const data = await listCommandes(boutiqueId, filtre)
    setCommandes(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [boutiqueId, filtre])

  const stats = {
    en_attente: commandes.filter(c => c.statut === 'en_attente').length,
    total: commandes.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats rapides */}
      {stats.en_attente > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          ⏳ {stats.en_attente} commande{stats.en_attente > 1 ? 's' : ''} en attente de confirmation
        </div>
      )}

      {/* Filtres statut */}
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
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : commandes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            {filtre ? 'Aucune commande avec ce statut.' : 'Aucune commande reçue pour l\'instant.'}
          </p>
          {!filtre && (
            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Les commandes apparaîtront ici dès qu&apos;un client commande depuis votre boutique ou via WhatsApp.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {regrouperCommandes(commandes).map((item, i) =>
            Array.isArray(item)
              ? <CommandeGroupeCard key={item[0].groupe_commande ?? i} commandes={item} boutiqueId={boutiqueId} onUpdate={load} />
              : <CommandeCard key={item.id} commande={item} boutiqueId={boutiqueId} onUpdate={load} />
          )}
        </div>
      )}
    </div>
  )
}
