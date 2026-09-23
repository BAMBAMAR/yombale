'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MessageSquare,
  Star,
  Trash2,
  Search,
  Filter,
  Store,
  User,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { supprimerAvisBoutique } from '@/app/actions/admin'

interface AvisItem {
  id: string
  note: number
  commentaire: string
  nom_client: string
  telephone_client: string
  created_at: string
  boutique_id: string
  boutique_nom: string
  boutique_slug: string
}

interface AvisClientProps {
  initialAvis: AvisItem[]
  total: number
  token: string
}

export default function AvisClient({ initialAvis, total }: AvisClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [avisList, setAvisList] = useState<AvisItem[]>(initialAvis)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [selectedNote, setSelectedNote] = useState(searchParams.get('note') || '')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<AvisItem | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; message: string } | null>(null)

  const showToast = (type: 'ok' | 'err', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set('q', searchTerm.trim())
    if (selectedNote) params.set('note', selectedNote)
    router.push(`/admin/avis?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!confirmModal) return
    const id = confirmModal.id
    setDeletingId(id)

    try {
      const res = await supprimerAvisBoutique(id)
      if (res.error) {
        showToast('err', res.error)
      } else {
        setAvisList(prev => prev.filter(a => a.id !== id))
        showToast('ok', 'Avis supprimé avec succès.')
        setConfirmModal(null)
      }
    } catch {
      showToast('err', 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const renderStars = (note: number) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            fill={s <= note ? '#f59e0b' : 'none'}
            color={s <= note ? '#f59e0b' : '#cbd5e1'}
          />
        ))}
        <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4, color: '#334155' }}>
          {note}/5
        </span>
      </div>
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
            <MessageSquare size={22} color="#8b5cf6" />
            Modération des Avis & Commentaires
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Supervisez les retours clients et modérez les avis litigieux ou diffamatoires sur les boutiques.
          </p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#475569' }}>
          {total} avis enregistrés
        </div>
      </div>

      {/* Barre de filtres */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Rechercher par client, commentaire, boutique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="#64748b" />
          <select
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
          >
            <option value="">Toutes les notes</option>
            <option value="1">1 étoile (Critique)</option>
            <option value="2">2 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="5">5 étoiles (Parfait)</option>
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

        {(searchTerm || selectedNote) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedNote('')
              router.push('/admin/avis')
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

      {/* Liste des avis */}
      {avisList.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748b' }}>
          <MessageSquare size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, fontSize: 15, color: '#334155' }}>Aucun avis trouvé</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Modifiez vos critères de recherche ou réinitialisez les filtres.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avisList.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#1c2b4a' }}>
                    <Store size={14} color="#64748b" />
                    {item.boutique_nom}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>&bull;</span>
                  {renderStars(item.note)}
                  <span style={{ color: '#cbd5e1' }}>&bull;</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                    <Calendar size={13} />
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <button
                  onClick={() => setConfirmModal(item)}
                  disabled={deletingId === item.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #fee2e2',
                    background: '#fff',
                    color: '#b91c1c',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Supprimer cet avis"
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </div>

              {/* Contenu commentaire */}
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                {item.commentaire ? `« ${item.commentaire} »` : <em style={{ color: '#94a3b8' }}>Aucun commentaire texte rédigé</em>}
              </div>

              {/* Auteur */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} color="#94a3b8" />
                  {item.nom_client || 'Client anonyme'}
                </span>
                {item.telephone_client && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} color="#94a3b8" />
                    {item.telephone_client}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de Confirmation de Suppression */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
              Confirmer la suppression de l'avis
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
              Êtes-vous certain de vouloir supprimer définitivement cet avis de <strong>{confirmModal.nom_client || 'Client'}</strong> sur la boutique <strong>{confirmModal.boutique_nom}</strong> ? Cette action est irréversible et sera consignée dans le journal d'audit.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmModal(null)}
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
                onClick={handleDelete}
                disabled={deletingId === confirmModal.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#dc2626',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {deletingId === confirmModal.id ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
