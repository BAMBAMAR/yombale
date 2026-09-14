import React from 'react'
import { Sparkles } from 'lucide-react'
import { Annonce } from './types'

export default function AnnonceStatutBadge({ annonce }: { annonce: Annonce }) {
  const isBooste = Boolean(annonce.boost_until && new Date(annonce.boost_until) > new Date())
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {annonce.rejete ? (
        <span className="admin-annonce-statut admin-annonce-statut--rejete">Rejetée</span>
      ) : annonce.actif ? (
        <span className="admin-annonce-statut admin-annonce-statut--active">Active</span>
      ) : (
        <span className="admin-annonce-statut admin-annonce-statut--attente">En attente</span>
      )}
      {isBooste && (
        <span
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Sparkles size={11} fill="#fff" />
          <span>Boosté ({new Date(annonce.boost_until!).toLocaleDateString('fr-FR')})</span>
        </span>
      )}
    </div>
  )
}
