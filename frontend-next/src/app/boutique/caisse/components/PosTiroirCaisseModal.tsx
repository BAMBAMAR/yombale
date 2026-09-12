'use client'

import React, { useState, useEffect } from 'react'
import { fcfa } from '@/lib/format'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Truck,
  ShoppingBag,
  Coins,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  History,
} from 'lucide-react'

export interface MouvementCaisse {
  id: string
  session_id: string
  type: 'entree' | 'sortie'
  montant: number
  motif: string
  beneficiaire?: string
  caissier_nom: string
  created_at?: string
}

interface PosTiroirCaisseModalProps {
  isOpen: boolean
  sessionId: string
  boutiqueId: string
  caissierNom: string
  fondInitial: number
  ventesEspeces: number
  onClose: () => void
  onMouvementEnregistre?: () => void
}

const MOTIFS_SORTIE = [
  { id: 'tiak_tiak', label: 'Paiement Coursier / Tiak-Tiak', icon: Truck },
  { id: 'fournitures', label: 'Achats / Fournitures boutique', icon: ShoppingBag },
  { id: 'prelevement', label: 'Prélèvement gérant', icon: UserCheck },
  { id: 'autre_sortie', label: 'Autre dépense justifiée', icon: FileText },
]

const MOTIFS_ENTREE = [
  { id: 'appoint', label: 'Appoint de monnaie (pièces/billets)', icon: Coins },
  { id: 'apport', label: 'Apport de trésorerie gérant', icon: Banknote },
  { id: 'remboursement', label: 'Retour / Remboursement fournisseur', icon: ArrowDownLeft },
  { id: 'autre_entree', label: 'Autre entrée d\'espèces', icon: FileText },
]

const MONTANTS_RAPIDES = [1000, 2000, 5000, 10000, 25000, 50000]

export default function PosTiroirCaisseModal({
  isOpen,
  sessionId,
  boutiqueId,
  caissierNom,
  fondInitial,
  ventesEspeces,
  onClose,
  onMouvementEnregistre,
}: PosTiroirCaisseModalProps) {
  const [tab, setTab] = useState<'sortie' | 'entree' | 'historique'>('sortie')
  const [montant, setMontant] = useState<string>('')
  const [motifSelectionne, setMotifSelectionne] = useState<string>(MOTIFS_SORTIE[0].label)
  const [motifPersonnalise, setMotifPersonnalise] = useState<string>('')
  const [beneficiaire, setBeneficiaire] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [mouvements, setMouvements] = useState<MouvementCaisse[]>([])
  const [loadingMouvements, setLoadingMouvements] = useState<boolean>(false)
  const [messageToast, setMessageToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Charger les mouvements de la session courante
  useEffect(() => {
    if (!isOpen || !sessionId || !boutiqueId) return

    let isMounted = true
    setLoadingMouvements(true)

    fetch(`/api/boutiques/${boutiqueId}/pos-sessions/${sessionId}/mouvements`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Erreur chargement'))))
      .then((data) => {
        if (isMounted && Array.isArray(data.mouvements)) {
          setMouvements(data.mouvements)
        }
      })
      .catch((err) => {
        console.warn('[Nopalou:PosTiroirCaisse] Impossible de charger les mouvements:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingMouvements(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, sessionId, boutiqueId])

  if (!isOpen) return null

  const totalEntrees = mouvements
    .filter((m) => m.type === 'entree')
    .reduce((sum, m) => sum + Number(m.montant || 0), 0)

  const totalSorties = mouvements
    .filter((m) => m.type === 'sortie')
    .reduce((sum, m) => sum + Number(m.montant || 0), 0)

  const soldeTheoriqueActuel = fondInitial + ventesEspeces + totalEntrees - totalSorties

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montantNum = Number(montant)
    if (!montantNum || montantNum <= 0) {
      setMessageToast({ type: 'error', text: 'Veuillez saisir un montant supérieur à 0 FCFA.' })
      return
    }

    const motifFinal = motifPersonnalise.trim() ? `${motifSelectionne} - ${motifPersonnalise.trim()}` : motifSelectionne

    setSubmitting(true)
    setMessageToast(null)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/pos-sessions/${sessionId}/mouvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tab === 'sortie' ? 'sortie' : 'entree',
          montant: montantNum,
          motif: motifFinal,
          beneficiaire: beneficiaire.trim() || undefined,
          caissier_nom: caissierNom,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      if (data.mouvement) {
        setMouvements((prev) => [data.mouvement, ...prev])
      }

      setMontant('')
      setMotifPersonnalise('')
      setBeneficiaire('')
      setMessageToast({
        type: 'success',
        text: tab === 'sortie' ? 'Sortie d\'espèces enregistrée avec succès !' : 'Entrée d\'espèces enregistrée !',
      })

      if (onMouvementEnregistre) {
        onMouvementEnregistre()
      }
    } catch (err: any) {
      setMessageToast({ type: 'error', text: err.message || 'Échec d\'enregistrement du mouvement.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 580,
          maxHeight: '94vh',
          overflowY: 'auto',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Banknote size={20} color="#C75B00" />
              <span>Gestion du Tiroir-Caisse</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Session #{sessionId?.slice(-8) || sessionId} • Opérateur : <strong>{caissierNom}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Synthèse Trésorerie Actuelle */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 14,
            padding: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Fond + Ventes Espèces
            </span>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
              {fcfa(fondInitial + ventesEspeces)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase' }}>
              Mouvements (E / S)
            </span>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', marginTop: 2 }}>
              +{fcfa(totalEntrees)} / -{fcfa(totalSorties)}
            </div>
          </div>
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '4px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>
              Espèces Théoriques
            </span>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1e3a5f', marginTop: 1 }}>
              {fcfa(soldeTheoriqueActuel)}
            </div>
          </div>
        </div>

        {/* Message Toast */}
        {messageToast && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: messageToast.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: messageToast.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: messageToast.type === 'success' ? '#166534' : '#991b1b',
            }}
          >
            {messageToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{messageToast.text}</span>
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 4 }}>
          <button
            type="button"
            onClick={() => {
              setTab('sortie')
              setMotifSelectionne(MOTIFS_SORTIE[0].label)
              setMessageToast(null)
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 9,
              border: 'none',
              background: tab === 'sortie' ? '#ffffff' : 'transparent',
              color: tab === 'sortie' ? '#c2410c' : '#64748b',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: tab === 'sortie' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <ArrowUpRight size={15} />
            <span>Sortie d&apos;espèces</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('entree')
              setMotifSelectionne(MOTIFS_ENTREE[0].label)
              setMessageToast(null)
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 9,
              border: 'none',
              background: tab === 'entree' ? '#ffffff' : 'transparent',
              color: tab === 'entree' ? '#0A5C36' : '#64748b',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: tab === 'entree' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <ArrowDownLeft size={15} />
            <span>Entrée d&apos;espèces</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('historique')
              setMessageToast(null)
            }}
            style={{
              flex: 0.9,
              padding: '9px 12px',
              borderRadius: 9,
              border: 'none',
              background: tab === 'historique' ? '#ffffff' : 'transparent',
              color: tab === 'historique' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: tab === 'historique' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <History size={15} />
            <span>Historique ({mouvements.length})</span>
          </button>
        </div>

        {tab === 'historique' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingMouvements ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Chargement des mouvements...
              </div>
            ) : mouvements.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Aucun mouvement d&apos;espèces enregistré pour cette session.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {mouvements.map((m) => {
                  const isSortie = m.type === 'sortie'
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isSortie ? '#fef2f2' : '#f0fdf4',
                            color: isSortie ? '#dc2626' : '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSortie ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{m.motif}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {m.beneficiaire ? `Bénéficiaire : ${m.beneficiaire} • ` : ''}
                            Par {m.caissier_nom}
                            {m.created_at ? ` • ${new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: isSortie ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {isSortie ? '-' : '+'}{fcfa(Number(m.montant))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Montant */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Montant en FCFA *
              </label>
              <input
                type="number"
                min={100}
                step={50}
                required
                autoFocus
                placeholder="Ex: 2500"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 18,
                  fontWeight: 900,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Raccourcis montants rapides */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MONTANTS_RAPIDES.map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setMontant(String(mt))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: montant === String(mt) ? '#0f172a' : '#f1f5f9',
                    color: montant === String(mt) ? '#ffffff' : '#334155',
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +{fcfa(mt)}
                </button>
              ))}
            </div>

            {/* Motifs fréquents */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Motif de l&apos;opération *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {(tab === 'sortie' ? MOTIFS_SORTIE : MOTIFS_ENTREE).map((item) => {
                  const Icon = item.icon
                  const isSelected = motifSelectionne === item.label
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMotifSelectionne(item.label)}
                      style={{
                        padding: '10px',
                        borderRadius: 10,
                        border: isSelected
                          ? tab === 'sortie' ? '2px solid #ea580c' : '2px solid #0A5C36'
                          : '1px solid #e2e8f0',
                        background: isSelected
                          ? tab === 'sortie' ? '#fffaf5' : '#f0fdf4'
                          : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        textAlign: 'left',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Icon size={16} color={isSelected ? (tab === 'sortie' ? '#ea580c' : '#0A5C36') : '#64748b'} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? '#0f172a' : '#475569',
                          lineHeight: 1.25,
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Motif personnalisé / Détails */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Précisions ou commentaire libre (facultatif)
              </label>
              <input
                type="text"
                maxLength={140}
                placeholder="Ex: Livreur Mamadou - Course Ouakam"
                value={motifPersonnalise}
                onChange={(e) => setMotifPersonnalise(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Bénéficiaire */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Bénéficiaire / Destinataire (facultatif)
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="Ex: Moussa Diop (Tiak-Tiak) - 77 123 45 67"
                value={beneficiaire}
                onChange={(e) => setBeneficiaire(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  background: tab === 'sortie' ? '#ea580c' : '#0A5C36',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 900,
                  fontSize: 13.5,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: tab === 'sortie' ? '0 4px 12px rgba(234,88,12,0.25)' : '0 4px 12px rgba(10,92,54,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Plus size={16} />
                <span>
                  {submitting
                    ? 'Enregistrement...'
                    : tab === 'sortie'
                    ? 'Valider la Sortie d\'espèces'
                    : 'Valider l\'Entrée d\'espèces'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
