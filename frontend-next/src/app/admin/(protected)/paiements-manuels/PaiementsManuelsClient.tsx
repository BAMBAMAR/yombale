'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, User, Phone, Hash, Calendar, ChevronDown } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Paiement {
  id: string
  reference: string
  montant: string
  methode: 'wave' | 'orange'
  telephone_expediteur: string
  transaction_id_client: string | null
  preuve_url: string | null
  statut: string
  motif_rejet: string | null
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  utilisateur_telephone: string | null
}

function decodeRef(ref: string): { type: string; label: string } {
  if (!ref) return { type: '—', label: ref }
  if (ref.startsWith('abmt_')) {
    const parts = ref.split('_')
    const rawPlan = parts[2]
    const plan = rawPlan === 'taf' || rawPlan === 'taf_taf' || rawPlan === 'decouverte'
      ? 'Taf Taf / Découverte'
      : rawPlan === 'pro' ? 'Pro' : rawPlan === 'business' ? 'Business VIP' : rawPlan || '?'
    const duree = parts[3] ? `${parts[3]} mois` : '1 mois'
    return { type: 'Abonnement boutique', label: `${plan} — ${duree}` }
  }
  if (ref.startsWith('ann_')) return { type: 'Annonce classifiée', label: 'Publication annonce' }
  if (ref.startsWith('immo_')) return { type: 'Sponsoring Immo', label: 'Mise en avant annonce immo' }
  if (ref.startsWith('bout_')) return { type: 'Sponsoring Boutique', label: 'Mise en avant boutique' }
  if (ref.startsWith('spimmo_')) return { type: 'Sponsoring Agence', label: 'Mise en avant agence' }
  if (ref.startsWith('prod_')) return { type: 'Sponsoring Produit', label: 'Mise en avant produit' }
  if (ref.startsWith('boost_')) return { type: 'Boost visibilité', label: 'Boost' }
  return { type: 'Autre', label: ref }
}

export default function PaiementsManuelsClient({
  initialPaiements, secret,
}: { initialPaiements: Paiement[]; secret: string }) {
  const [paiements, setPaiements] = useState(initialPaiements)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [rejetModal, setRejetModal] = useState<{ id: string; nom: string } | null>(null)
  const [motifRejet, setMotifRejet] = useState('')
  const [q, setQ] = useState('')
  const [methodeFilter, setMethodeFilter] = useState<'toutes' | 'wave' | 'orange'>('toutes')
  const [expanded, setExpanded] = useState<string | null>(null)

  const paiementsFiltres = paiements.filter(p => {
    if (methodeFilter !== 'toutes' && p.methode !== methodeFilter) return false
    if (!q.trim()) return true
    const term = q.trim().toLowerCase()
    return (
      p.reference?.toLowerCase().includes(term) ||
      p.utilisateur_nom?.toLowerCase().includes(term) ||
      p.utilisateur_email?.toLowerCase().includes(term) ||
      p.telephone_expediteur?.includes(term) ||
      p.transaction_id_client?.toLowerCase().includes(term)
    )
  })

  async function valider(id: string) {
    if (!window.confirm('Confirmer la validation ? L\'abonnement sera activé automatiquement.')) return
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`/api/paiement/manuel/${id}/valider`, {
        method: 'POST', headers: { 'X-Admin-Secret': secret },
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: '✓ Paiement validé — abonnement activé avec succès' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  async function confirmerRejet() {
    if (!rejetModal) return
    setEnCours(rejetModal.id)
    setMsg(null)
    try {
      const r = await fetch(`/api/paiement/manuel/${rejetModal.id}/rejeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ motif: motifRejet }),
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== rejetModal.id))
      setMsg({ type: 'ok', text: '✓ Paiement rejeté' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally {
      setEnCours(null)
      setRejetModal(null)
      setMotifRejet('')
    }
  }

  return (
    <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Feedback */}
      {msg && (
        <div style={{
          padding: '14px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b',
          border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {msg.type === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* Filtres */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher par client, référence, ID transaction opérateur..."
          style={{ flex: 1, minWidth: 260, padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
        />
        <select
          value={methodeFilter}
          onChange={e => setMethodeFilter(e.target.value as 'toutes' | 'wave' | 'orange')}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
        >
          <option value="toutes">Toutes les méthodes</option>
          <option value="wave">Wave</option>
          <option value="orange">Orange Money</option>
        </select>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          {paiementsFiltres.length} paiement(s)
        </div>
      </div>

      {/* Rappel numéros de réception */}
      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={16} color="#b45309" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
          <strong>Vos numéros de réception :</strong> Wave → <strong>777 20 20 86</strong> &nbsp;|&nbsp; Orange Money → <strong>777 20 20 86</strong>
          <br />Vérifiez que l&apos;ID transaction opérateur correspond dans votre historique avant de valider.
        </div>
      </div>

      {/* Liste des cartes */}
      {paiementsFiltres.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <CheckCircle2 size={44} color="#86efac" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Aucun paiement à traiter</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Tous les paiements ont été validés ou rejetés.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {paiementsFiltres.map(p => {
            const decoded = decodeRef(p.reference)
            const isExpanded = expanded === p.id
            const isLoading = enCours === p.id
            return (
              <div key={p.id} style={{
                background: '#fff',
                border: '2px solid #fbbf24',
                borderRadius: 14,
                boxShadow: '0 2px 10px rgba(251,191,36,0.10)',
                overflow: 'hidden'
              }}>
                {/* En-tête de carte */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  borderBottom: '1px solid #fef3c7'
                }}>
                  {/* Badge méthode */}
                  <div style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800, flexShrink: 0,
                    background: p.methode === 'wave' ? '#dbeafe' : '#ffedd5',
                    color: p.methode === 'wave' ? '#1d4ed8' : '#c2410c'
                  }}>
                    {p.methode === 'wave' ? 'Wave' : 'Orange Money'}
                  </div>

                  {/* Montant */}
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#15803d', letterSpacing: '-0.5px', flexShrink: 0 }}>
                    {Number(p.montant).toLocaleString('fr-FR')}
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>FCFA</span>
                  </div>

                  {/* Type décodé */}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{decoded.type}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{decoded.label}</div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {new Date(p.created_at).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>

                  {/* Toggle détails */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', flexShrink: 0 }}
                    title="Voir la référence technique"
                  >
                    <ChevronDown size={16} color="#64748b" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s', display: 'block' }} />
                  </button>
                </div>

                {/* Grille d'infos */}
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

                  {/* Client */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> Client
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{p.utilisateur_nom}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{p.utilisateur_email}</div>
                    {p.utilisateur_telephone && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>{p.utilisateur_telephone}</div>
                    )}
                  </div>

                  {/* Sens transfert */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={12} /> Sens du transfert
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{p.telephone_expediteur}</span>
                      <span style={{ color: '#94a3b8', margin: '0 8px', fontSize: 16 }}>→</span>
                      <span style={{ fontWeight: 700, color: p.methode === 'wave' ? '#1d4ed8' : '#ea580c' }}>
                        777 20 20 86
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      (ton numéro {p.methode === 'wave' ? 'Wave' : 'Orange Money'})
                    </div>
                  </div>

                  {/* ID Transaction */}
                  <div style={{
                    background: p.transaction_id_client ? '#f0fdf4' : '#fafafa',
                    border: `1px solid ${p.transaction_id_client ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: 10, padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.transaction_id_client ? '#15803d' : '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Hash size={12} /> ID Transaction opérateur
                    </div>
                    {p.transaction_id_client ? (
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', wordBreak: 'break-all', lineHeight: 1.4 }}>
                        {p.transaction_id_client}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Non renseigné par le client</div>
                    )}
                  </div>

                  {/* Preuve */}
                  {p.preuve_url && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 6 }}>
                        Capture écran
                      </div>
                      <a
                        href={p.preuve_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
                      >
                        Voir la preuve →
                      </a>
                    </div>
                  )}
                </div>

                {/* Référence technique (expandable) */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 14px' }}>
                    <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Référence interne</div>
                      <code style={{ fontSize: 11, color: '#475569', wordBreak: 'break-all', lineHeight: 1.6 }}>{p.reference}</code>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div style={{
                  padding: '14px 20px 18px',
                  display: 'flex', gap: 10,
                  borderTop: '1px solid #fef3c7',
                  background: '#fffbeb'
                }}>
                  <button
                    id={`btn-valider-${p.id}`}
                    onClick={() => valider(p.id)}
                    disabled={isLoading}
                    style={{
                      flex: 1, padding: '13px 20px', fontSize: 14, fontWeight: 800,
                      borderRadius: 10, border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      background: isLoading ? '#86efac' : '#16a34a', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {isLoading ? 'Validation en cours...' : 'Valider — Activer l\'abonnement'}
                  </button>
                  <button
                    id={`btn-rejeter-${p.id}`}
                    onClick={() => { setRejetModal({ id: p.id, nom: p.utilisateur_nom }); setMotifRejet('') }}
                    disabled={isLoading}
                    style={{
                      padding: '13px 22px', fontSize: 14, fontWeight: 800,
                      borderRadius: 10, border: '2px solid #dc2626',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      background: '#fff', color: '#dc2626',
                      display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
                    }}
                  >
                    <XCircle size={18} />
                    Rejeter
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modale rejet */}
      {rejetModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            maxWidth: 500, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <XCircle size={30} color="#dc2626" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Rejeter ce paiement</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Client : <strong>{rejetModal.nom}</strong></div>
              </div>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              Motif du rejet
              <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(optionnel — sera communiqué au client)</span>
            </label>
            <textarea
              value={motifRejet}
              onChange={e => setMotifRejet(e.target.value)}
              placeholder="Ex : Montant reçu incorrect (attendu 90 000 FCFA), ID transaction introuvable dans l'historique, numéro expéditeur ne correspond pas..."
              rows={4}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid #cbd5e1', fontSize: 14, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                marginBottom: 20
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setRejetModal(null); setMotifRejet('') }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#475569'
                }}
              >
                Annuler
              </button>
              <button
                id="btn-confirmer-rejet"
                onClick={confirmerRejet}
                disabled={enCours === rejetModal.id}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <XCircle size={16} />
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
