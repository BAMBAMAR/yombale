'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ExternalLink,
  ShieldCheck,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Store,
  Package,
} from 'lucide-react'
import { traiterSignalement } from '@/app/actions/admin'

interface SignalementItem {
  id: string
  type_cible: string
  cible_id: string
  motif: string
  description?: string
  statut: 'en_attente' | 'traite' | 'rejete'
  decision?: string
  traite_par?: string
  traite_le?: string
  created_at: string
  signale_par_nom?: string
  signale_par_email?: string
  traite_par_nom?: string
}

interface SignalementsClientProps {
  initialSignalements: SignalementItem[]
  total: number
  token: string
}

export default function SignalementsClient({ initialSignalements, total }: SignalementsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [signalements, setSignalements] = useState<SignalementItem[]>(initialSignalements)
  const [selectedStatut, setSelectedStatut] = useState(searchParams.get('statut') || '')
  const [selectedType, setSelectedType] = useState(searchParams.get('type_cible') || '')
  const [modalItem, setModalItem] = useState<{ item: SignalementItem; action: 'traite' | 'rejete' } | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; message: string } | null>(null)

  const showToast = (type: 'ok' | 'err', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (selectedStatut) params.set('statut', selectedStatut)
    if (selectedType) params.set('type_cible', selectedType)
    router.push(`/admin/signalements?${params.toString()}`)
  }

  const handleResolve = async () => {
    if (!modalItem) return
    const { item, action } = modalItem
    setSubmitting(true)

    try {
      const res = await traiterSignalement(item.id, action, decisionNote)
      if (res.error) {
        showToast('err', res.error)
      } else {
        setSignalements(prev =>
          prev.map(s => (s.id === item.id ? { ...s, statut: action, decision: decisionNote, traite_le: new Date().toISOString() } : s))
        )
        showToast('ok', `Signalement marqué comme ${action === 'traite' ? 'traité' : 'rejeté'}.`)
        setModalItem(null)
        setDecisionNote('')
      }
    } catch {
      showToast('err', 'Erreur lors du traitement')
    } finally {
      setSubmitting(false)
    }
  }

  const getTargetUrl = (type: string, id: string) => {
    if (type === 'annonce') return `/annonces/${id}`
    if (type === 'boutique') return `/b/${id}`
    if (type === 'utilisateur') return `/admin/comptes/${id}`
    return null
  }

  const getTargetIcon = (type: string) => {
    if (type === 'annonce') return <FileText size={14} color="#0284c7" />
    if (type === 'boutique') return <Store size={14} color="#8b5cf6" />
    if (type === 'utilisateur') return <User size={14} color="#10b981" />
    return <Package size={14} color="#f59e0b" />
  }

  const renderBadgeStatut = (statut: string) => {
    if (statut === 'en_attente') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
          <Clock size={12} />
          En attente
        </span>
      )
    }
    if (statut === 'traite') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
          <CheckCircle2 size={12} />
          Traité
        </span>
      )
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
        <XCircle size={12} />
        Rejeté
      </span>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#fff',
            backgroundColor: toast.type === 'ok' ? '#15803d' : '#dc2626',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={22} color="#ef4444" />
            Signalements d'Abus & Sécurité
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Traitez les signalements des utilisateurs concernant des contenus suspects, faux profils ou annonces frauduleuses.
          </p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#475569' }}>
          {total} signalement{total > 1 ? 's' : ''} au total
        </div>
      </div>

      {/* Barre de filtres */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="#64748b" />
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente (Prioritaire)</option>
            <option value="traite">Traités</option>
            <option value="rejete">Rejetés</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
          >
            <option value="">Tous les types de cible</option>
            <option value="annonce">Annonces</option>
            <option value="boutique">Boutiques</option>
            <option value="utilisateur">Utilisateurs</option>
            <option value="produit">Produits</option>
          </select>
        </div>

        <button
          onClick={applyFilters}
          style={{
            padding: '8px 16px',
            background: '#1c2b4a',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Filtrer
        </button>

        {(selectedStatut || selectedType) && (
          <button
            onClick={() => {
              setSelectedStatut('')
              setSelectedType('')
              router.push('/admin/signalements')
            }}
            style={{
              padding: '8px 14px',
              background: '#f1f5f9',
              color: '#475569',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste des signalements */}
      {signalements.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748b' }}>
          <ShieldCheck size={36} color="#16a34a" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, fontSize: 15, color: '#334155' }}>Aucun signalement trouvé</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Tous les signalements pour ces critères ont été traités avec succès.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {signalements.map((item) => {
            const targetUrl = getTargetUrl(item.type_cible, item.cible_id)

            return (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: item.statut === 'en_attente' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: item.statut === 'en_attente' ? '0 1px 4px rgba(239, 68, 68, 0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {renderBadgeStatut(item.statut)}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#334155', background: '#f8fafc', padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      {getTargetIcon(item.type_cible)}
                      {item.type_cible.toUpperCase()} : {item.cible_id ? item.cible_id.slice(0, 8) + '...' : 'Inconnue'}
                    </span>
                    {targetUrl && (
                      <Link
                        href={targetUrl}
                        target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Voir la cible <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>

                  {item.statut === 'en_attente' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          setModalItem({ item, action: 'traite' })
                          setDecisionNote('')
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#15803d',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Marquer Traité
                      </button>
                      <button
                        onClick={() => {
                          setModalItem({ item, action: 'rejete' })
                          setDecisionNote('')
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          color: '#64748b',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <XCircle size={13} />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>

                {/* Motif et Description */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                    Motif : {item.motif || 'Non précisé'}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                      {item.description}
                    </div>
                  )}
                </div>

                {/* Décision si déjà traité */}
                {item.decision && (
                  <div style={{ fontSize: 12, color: '#15803d', background: '#f0fdf4', padding: '8px 12px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                    <strong>Décision administrative :</strong> {item.decision}
                    {item.traite_par_nom && <span> &bull; Traité par {item.traite_par_nom}</span>}
                  </div>
                )}

                {/* Métadonnées auteur et date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} />
                    Signalé le {new Date(item.created_at).toLocaleString('fr-FR')}
                  </span>
                  {item.signale_par_nom && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} />
                      Par {item.signale_par_nom} ({item.signale_par_email || 'Email masqué'})
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Traitement */}
      {modalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 460, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
              {modalItem.action === 'traite' ? 'Valider et classer le signalement' : 'Rejeter le signalement'}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
              Indiquez la décision prise ou la justification administrative (ex: Contenu supprimé, Compte averti, Faux signalement).
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Note de décision (visible dans le journal d'audit)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: L'annonce a été vérifiée et désactivée pour tentative de fraude."
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setModalItem(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleResolve}
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: modalItem.action === 'traite' ? '#15803d' : '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {submitting ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
