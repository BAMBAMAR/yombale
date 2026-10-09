'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Edit2,
  Plus,
  CheckCircle2,
  XCircle,
  Tag,
  Sparkles,
  RefreshCw,
  X,
  Save,
  Trash2,
  Percent,
} from 'lucide-react'

export interface PlanItem {
  id: string
  nom: string
  type: string
  description: string
  tarifs: {
    hebdomadaire: number
    mensuel: number
    annuel: number
  }
  avantages: string[]
  actif?: boolean
  badge_promo?: string
}

export default function AdminPlansTab() {
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [chargement, setChargement] = useState(true)
  const [planEnEdition, setPlanEnEdition] = useState<PlanItem | null>(null)
  const [modalOuverte, setModalOuverte] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)

  // Champs du formulaire modal
  const [formNom, setFormNom] = useState('')
  const [formType, setFormType] = useState('b2c')
  const [formDescription, setFormDescription] = useState('')
  const [formHebdo, setFormHebdo] = useState(0)
  const [formMensuel, setFormMensuel] = useState(1500)
  const [formAnnuel, setFormAnnuel] = useState(15000)
  const [formPromo, setFormPromo] = useState('')
  const [formAvantages, setFormAvantages] = useState<string[]>([])
  const [nouvelAvantage, setNouvelAvantage] = useState('')

  const chargerPlans = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/surga/plans')
      const data = await res.json()
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les formules.' })
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerPlans()
  }, [chargerPlans])

  const ouvrirEdition = (plan: PlanItem) => {
    setPlanEnEdition(plan)
    setFormNom(plan.nom)
    setFormType(plan.type || 'b2c')
    setFormDescription(plan.description || '')
    setFormHebdo(plan.tarifs.hebdomadaire ?? 0)
    setFormMensuel(plan.tarifs.mensuel)
    setFormAnnuel(plan.tarifs.annuel)
    setFormPromo(plan.badge_promo || '')
    setFormAvantages(plan.avantages || [])
    setModalOuverte(true)
  }

  const ouvrirCreation = () => {
    setPlanEnEdition(null)
    setFormNom('')
    setFormType('b2c')
    setFormDescription('')
    setFormHebdo(0)
    setFormMensuel(2000)
    setFormAnnuel(20000)
    setFormPromo('')
    setFormAvantages(['Support prioritaire', 'Accès illimité'])
    setModalOuverte(true)
  }

  const ajouterAvantage = () => {
    if (!nouvelAvantage.trim()) return
    setFormAvantages((prev) => [...prev, nouvelAvantage.trim()])
    setNouvelAvantage('')
  }

  const supprimerAvantage = (index: number) => {
    setFormAvantages((prev) => prev.filter((_, i) => i !== index))
  }

  const basculerVente = async (plan: PlanItem) => {
    const nouvelEtat = !(plan.actif !== false)
    try {
      const res = await fetch(`/api/admin/surga/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: nouvelEtat }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: nouvelEtat ? `${plan.nom} est de nouveau en vente.` : `${plan.nom} est retiré de la vente (les abonnements déjà payés restent valables).` })
        chargerPlans()
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Changement refusé.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau lors de la mise à jour.' })
    } finally {
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault()
    setSauvegardeEnCours(true)

    const payload = {
      nom: formNom,
      type: formType,
      description: formDescription,
      tarifHebdo: Number(formHebdo),
      tarifMensuel: Number(formMensuel),
      tarifAnnuel: Number(formAnnuel),
      avantages: formAvantages,
      badgePromo: formPromo,
    }

    try {
      const url = planEnEdition ? `/api/admin/surga/plans/${planEnEdition.id}` : '/api/admin/surga/plans'
      const method = planEnEdition ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'succes', texte: 'Tarifs et formule mis à jour avec succès.' })
        setModalOuverte(false)
        chargerPlans()
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Erreur lors de la sauvegarde.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau lors de la mise à jour.' })
    } finally {
      setSauvegardeEnCours(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            backgroundColor: message.type === 'succes' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? '#10B981' : '#EF4444',
            border: `1px solid ${message.type === 'succes' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {message.type === 'succes' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{message.texte}</span>
        </div>
      )}

      {/* En-tête avec bouton Créer */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '18px 24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
            Gestionnaire des Tarifs &amp; Formules Surga
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Fixez le prix de chaque durée (7 jours, 30 jours, 12 mois) en FCFA ; un prix à 0 retire cette durée de l’offre. Toute modification est vue par l’application et par le paiement Wave dans les secondes qui suivent. Le paiement est unique : Wave ne renouvelle pas tout seul.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={chargerPlans}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={chargement ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={ouvrirCreation}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#0B132B', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} color="#F59E0B" />
            <span>Ajouter une formule</span>
          </button>
        </div>
      </div>

      {/* Grille des Formules Configurables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
        {plans.map((p) => {
          const enVente = p.actif !== false
          return (
            <div
              key={p.id}
              style={{
                opacity: enVente ? 1 : 0.7,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: p.type === 'b2b' ? '#06B6D4' : '#F59E0B' }}>
                    {p.type === 'b2b' ? 'Espace Pro B2B' : 'Particulier B2C'}
                  </span>
                  {!enVente && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(100, 116, 139, 0.15)', color: '#475569' }}>
                      Hors vente
                    </span>
                  )}
                  {p.badge_promo && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#D97706' }}>
                      {p.badge_promo}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{p.nom}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, minHeight: 34 }}>{p.description}</div>

                {/* Bloc Tarifs Fixés */}
                <div style={{ margin: '14px 0', padding: '12px 14px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>7 jours :</span>
                    {p.tarifs.hebdomadaire > 0 ? (
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                        {p.tarifs.hebdomadaire.toLocaleString('fr-FR')} FCFA <small style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>/semaine</small>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Non proposé</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #CBD5E1' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>30 jours :</span>
                    {p.tarifs.mensuel > 0 ? (
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                        {p.tarifs.mensuel.toLocaleString('fr-FR')} FCFA <small style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>/30 jours</small>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Non proposé</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #CBD5E1' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>12 mois :</span>
                    {p.tarifs.annuel > 0 ? (
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                        {p.tarifs.annuel.toLocaleString('fr-FR')} FCFA <small style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>/an</small>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Non proposé</span>
                    )}
                  </div>
                </div>

                {/* Avantages inclus */}
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                  Privilèges inclus ({p.avantages?.length || 0}) :
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.avantages?.slice(0, 4).map((av, idx) => (
                    <li key={idx}>{av}</li>
                  ))}
                  {(p.avantages?.length || 0) > 4 && (
                    <li style={{ color: '#64748B', fontStyle: 'italic' }}>+{p.avantages.length - 4} autre(s) avantage(s)...</li>
                  )}
                </ul>
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => basculerVente(p)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: enVente ? '#FFFFFF' : '#0B132B', color: enVente ? '#475569' : '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  {enVente ? 'Retirer de la vente' : 'Remettre en vente'}
                </button>
                <button
                  type="button"
                  onClick={() => ouvrirEdition(p)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Edit2 size={13} color="#F59E0B" />
                  <span>Fixer / Modifier les tarifs</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal d'édition des tarifs */}
      {modalOuverte && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                {planEnEdition ? `Modifier les tarifs : ${planEnEdition.nom}` : 'Créer une nouvelle formule'}
              </div>
              <button type="button" onClick={() => setModalOuverte(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={soumettreFormulaire} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Nom de la formule</label>
                <input type="text" required value={formNom} onChange={(e) => setFormNom(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>7 jours (FCFA)</label>
                  <input type="number" required min="0" step="100" value={formHebdo} onChange={(e) => setFormHebdo(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 800, color: '#0F172A' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#10B981', display: 'block', marginBottom: 4 }}>30 jours (FCFA)</label>
                  <input type="number" required min="0" step="100" value={formMensuel} onChange={(e) => setFormMensuel(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '2px solid #10B981', fontSize: 14, fontWeight: 800, color: '#0F172A' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>12 mois (FCFA)</label>
                  <input type="number" required min="0" step="100" value={formAnnuel} onChange={(e) => setFormAnnuel(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 800, color: '#0F172A' }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: -6 }}>0 = cette durée n’est pas proposée. La durée de 30 jours s’applique à partir du paiement.</div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Badge Promotionnel (ex: 2 mois offerts)</label>
                <input type="text" value={formPromo} onChange={(e) => setFormPromo(e.target.value)} placeholder="Optionnel" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Description courte</label>
                <textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Avantages et privilèges inclus</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="text" value={nouvelAvantage} onChange={(e) => setNouvelAvantage(e.target.value)} placeholder="Nouvel avantage..." style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
                  <button type="button" onClick={ajouterAvantage} style={{ padding: '7px 12px', borderRadius: 6, border: 'none', backgroundColor: '#0B132B', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Ajouter</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                  {formAvantages.map((av, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 4, backgroundColor: '#F8FAFC', fontSize: 12 }}>
                      <span>&bull; {av}</span>
                      <button type="button" onClick={() => supprimerAvantage(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                <button type="button" onClick={() => setModalOuverte(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={sauvegardeEnCours} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={14} />
                  <span>{sauvegardeEnCours ? 'Sauvegarde...' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
