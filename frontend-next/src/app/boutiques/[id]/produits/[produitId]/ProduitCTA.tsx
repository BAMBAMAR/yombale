'use client'
import { useState, useMemo } from 'react'
import CommanderModal from '../../CommanderModal'
import { useCart } from '@/context/CartContext'
import { fcfa } from '@/lib/format'
import { ShoppingCart } from 'lucide-react'

interface Variante {
  nom: string
  valeurs: string[]
}

export interface VarianteSku {
  id: string
  sku?: string | null
  code_barre?: string | null
  attributs: Record<string, string>
  prix: number
  prix_barre?: number | null
  stock_quantite?: number | null
  image_url?: string | null
}

interface Props {
  boutiqueId: string
  boutiqueNom?: string
  produit: { id: string; nom: string; prix: number | null; images?: string[]; prix_barre?: number | null }
  enStock: boolean
  waUrl: string | null
  telUrl: string | null
  variantes: Variante[]
  variantesSkus?: VarianteSku[]
  uniteVente?: string | null
}

export default function ProduitCTA({
  boutiqueId,
  boutiqueNom = 'Boutique',
  produit,
  enStock,
  waUrl,
  telUrl,
  variantes,
  variantesSkus = [],
  uniteVente = 'piece',
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [addedCart, setAddedCart] = useState(false)
  const { addToCart, openCart } = useCart()

  const aDesVariantes = variantes.length > 0
  const selectionComplete = !aDesVariantes || variantes.every(v => selection[v.nom])

  // Résolution du SKU correspondant si des SKUs sont enregistrés
  const matchingSku = useMemo(() => {
    if (!selectionComplete || variantesSkus.length === 0) return null
    return variantesSkus.find(sku => {
      return Object.entries(selection).every(([k, v]) => sku.attributs[k] === v)
    }) || null
  }, [selection, selectionComplete, variantesSkus])

  const prixActuel = matchingSku?.prix ?? produit.prix ?? 0
  const prixBarreActuel = matchingSku?.prix_barre ?? produit.prix_barre ?? null
  const stockActuel = matchingSku?.stock_quantite !== undefined ? matchingSku.stock_quantite : null
  const estEnStockVariante = stockActuel !== null ? stockActuel > 0 : enStock
  const peutCommander = estEnStockVariante && selectionComplete

  const noteVariantes = aDesVariantes
    ? variantes.map(v => `${v.nom}: ${selection[v.nom] ?? '—'}`).join(', ')
    : undefined

  const detailsVarianteText = aDesVariantes && selectionComplete
    ? Object.entries(selection).map(([k, v]) => `${k}: ${v}`).join(', ')
    : null

  function handleAddToCart() {
    if (!peutCommander) return
    addToCart(
      boutiqueId,
      boutiqueNom,
      {
        id: produit.id,
        nom: produit.nom,
        prix: prixActuel,
        images: matchingSku?.image_url ? [matchingSku.image_url, ...(produit.images || [])] : produit.images,
        varianteId: matchingSku?.id || null,
        detailsVariante: detailsVarianteText,
        uniteVente,
      },
      waUrl ? waUrl.replace(/.*wa\.me\//, '').split('?')[0] : null,
      true
    )
    setAddedCart(true)
    setTimeout(() => setAddedCart(false), 2000)
  }

  return (
    <>
      {showModal && (
        <CommanderModal
          boutiqueId={boutiqueId}
          produit={{
            id: produit.id,
            nom: produit.nom,
            prix: prixActuel,
          }}
          onClose={() => setShowModal(false)}
          noteInitiale={noteVariantes}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Sélecteurs de variantes */}
        {aDesVariantes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {variantes.map(v => (
              <div key={v.nom}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{v.nom} : <strong style={{ color: '#0f172a' }}>{selection[v.nom] || '—'}</strong></span>
                  {!selection[v.nom] && <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 12 }}>À sélectionner</span>}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {v.valeurs.map(val => {
                    const isSelected = selection[v.nom] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelection(prev => ({ ...prev, [v.nom]: val }))}
                        style={{
                          padding: '7px 16px', borderRadius: 20, border: '2px solid',
                          borderColor: isSelected ? '#C75B00' : '#cbd5e1',
                          background: isSelected ? '#fff7ed' : '#fff',
                          color: isSelected ? '#C75B00' : '#1e293b',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: 13, cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 6px rgba(199,91,0,0.15)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Récapitulatif Prix & Stock de la variante sélectionnée */}
            {selectionComplete && matchingSku && (
              <div style={{ paddingTop: 8, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Prix pour cette option :</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#C75B00' }}>{fcfa(prixActuel)}</span>
              </div>
            )}
          </div>
        )}

        {/* Boutons d'Action Panier & Commande */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!peutCommander}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: addedCart ? '#16a34a' : (peutCommander ? '#0f172a' : '#e2e8f0'),
              color: peutCommander ? '#fff' : '#94a3b8',
              padding: '14px 20px', borderRadius: 12, border: 'none',
              fontWeight: 800, fontSize: 15, cursor: peutCommander ? 'pointer' : 'not-allowed',
              boxShadow: peutCommander ? '0 4px 14px rgba(15,23,42,0.2)' : 'none',
              transition: 'background 0.2s ease',
            }}
          >
            <ShoppingCart size={18} />
            {addedCart ? '✅ Ajouté au panier !' : (!peutCommander && aDesVariantes && !selectionComplete ? 'Sélectionnez vos options ci-dessus' : 'Ajouter au panier')}
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={!peutCommander}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: peutCommander ? '#C75B00' : '#e2e8f0',
              color: peutCommander ? '#fff' : '#94a3b8',
              padding: '14px 20px', borderRadius: 12, border: 'none',
              fontWeight: 800, fontSize: 15, cursor: peutCommander ? 'pointer' : 'not-allowed',
              boxShadow: peutCommander ? '0 4px 14px rgba(199,91,0,0.25)' : 'none',
            }}
          >
            ⚡ {!estEnStockVariante ? 'Rupture de stock' : (!selectionComplete ? 'Sélectionnez une option' : 'Commander en direct (1 clic)')}
          </button>
        </div>

        {/* WhatsApp — secondaire */}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#f0fdf4', color: '#16a34a', border: '2px solid #86efac',
              padding: '12px 20px', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 14,
            }}
          >
            💬 Discuter avec le vendeur sur WhatsApp
          </a>
        )}

        {/* Téléphone */}
        {telUrl && (
          <a
            href={telUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#fff', color: '#1d4ed8', border: '2px solid #bfdbfe',
              padding: '12px 20px', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 14,
            }}
          >
            📞 Appeler au téléphone
          </a>
        )}
      </div>
    </>
  )
}
