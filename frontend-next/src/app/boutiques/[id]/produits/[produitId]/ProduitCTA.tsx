'use client'
import { useState } from 'react'
import CommanderModal from '../../CommanderModal'

interface Props {
  boutiqueId: string
  produit: { id: string; nom: string; prix: number | null }
  enStock: boolean
  waUrl: string | null
  telUrl: string | null
}

export default function ProduitCTA({ boutiqueId, produit, enStock, waUrl, telUrl }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && (
        <CommanderModal
          boutiqueId={boutiqueId}
          produit={produit}
          onClose={() => setShowModal(false)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Bouton Commander sur le site — prioritaire, en orange */}
        <button
          onClick={() => setShowModal(true)}
          disabled={!enStock}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: enStock ? '#C75B00' : '#e5e7eb',
            color: enStock ? '#fff' : '#9ca3af',
            padding: '14px 24px', borderRadius: 12, border: 'none',
            fontWeight: 800, fontSize: 16, cursor: enStock ? 'pointer' : 'not-allowed',
            boxShadow: enStock ? '0 4px 14px rgba(199,91,0,.25)' : 'none',
          }}
        >
          🛒 {enStock ? 'Commander sur le site' : 'Rupture de stock'}
        </button>

        {/* WhatsApp — secondaire */}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#f0fdf4', color: '#16a34a', border: '2px solid #86efac',
              padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 15,
            }}
          >
            💬 Contacter via WhatsApp
          </a>
        )}

        {/* Téléphone */}
        {telUrl && (
          <a
            href={telUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#fff', color: '#1d4ed8', border: '2px solid #bfdbfe',
              padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 15,
            }}
          >
            📞 Appeler le vendeur
          </a>
        )}
      </div>
    </>
  )
}
