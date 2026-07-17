'use client'
import { useState } from 'react'
import CommanderModal from '../../CommanderModal'

interface Variante {
  nom: string
  valeurs: string[]
}

interface Props {
  boutiqueId: string
  produit: { id: string; nom: string; prix: number | null }
  enStock: boolean
  waUrl: string | null
  telUrl: string | null
  variantes: Variante[]
}

export default function ProduitCTA({ boutiqueId, produit, enStock, waUrl, telUrl, variantes }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [selection, setSelection] = useState<Record<string, string>>({})

  const aDesVariantes = variantes.length > 0
  const selectionComplete = !aDesVariantes || variantes.every(v => selection[v.nom])
  const peutCommander = enStock && selectionComplete

  const noteVariantes = aDesVariantes
    ? variantes.map(v => `${v.nom}: ${selection[v.nom] ?? '—'}`).join(', ')
    : undefined

  return (
    <>
      {showModal && (
        <CommanderModal
          boutiqueId={boutiqueId}
          produit={produit}
          onClose={() => setShowModal(false)}
          noteInitiale={noteVariantes}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Sélecteurs de variantes */}
        {aDesVariantes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {variantes.map(v => (
              <div key={v.nom}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  {v.nom} {!selection[v.nom] && <span style={{ color: '#dc2626', fontWeight: 500 }}>— à choisir</span>}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {v.valeurs.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelection(prev => ({ ...prev, [v.nom]: val }))}
                      style={{
                        padding: '7px 16px', borderRadius: 20, border: '2px solid',
                        borderColor: selection[v.nom] === val ? '#C75B00' : '#e5e7eb',
                        background: selection[v.nom] === val ? '#fff7f0' : '#fff',
                        color: selection[v.nom] === val ? '#C75B00' : '#374151',
                        fontWeight: selection[v.nom] === val ? 700 : 500,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton Commander sur le site — prioritaire, en orange */}
        <button
          onClick={() => setShowModal(true)}
          disabled={!peutCommander}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: peutCommander ? '#C75B00' : '#e5e7eb',
            color: peutCommander ? '#fff' : '#9ca3af',
            padding: '14px 24px', borderRadius: 12, border: 'none',
            fontWeight: 800, fontSize: 16, cursor: peutCommander ? 'pointer' : 'not-allowed',
            boxShadow: peutCommander ? '0 4px 14px rgba(199,91,0,.25)' : 'none',
          }}
        >
          🛒 {!enStock ? 'Rupture de stock' : !selectionComplete ? 'Choisissez une option ci-dessus' : 'Commander sur le site'}
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
