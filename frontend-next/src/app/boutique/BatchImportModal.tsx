'use client'
import { useState, useEffect } from 'react'
import { CATEGORIES } from '@/lib/categories'

interface TemplateProduit {
  id: string
  nom: string
  description: string
  categorie: string
  photo_defaut: string
}

interface SaisieProduit {
  template: TemplateProduit
  selectionne: boolean
  prix: string
  quantite: number
}

interface LigneFichier {
  id: string
  nom: string
  prix: number
  quantite: number
  categorie: string
  code_barre?: string
}

export default function BatchImportModal({
  boutiqueId,
  onClose,
  onSuccess,
}: {
  boutiqueId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [modeImport, setModeImport] = useState<'catalogue' | 'fichier'>('catalogue')
  const [categorieActive, setCategorieActive] = useState<string>('alimentation')
  const [catalogues, setCatalogues] = useState<Record<string, TemplateProduit[]>>({})
  const [saisies, setSaisies] = useState<Record<string, SaisieProduit>>({})
  const [lignesFichier, setLignesFichier] = useState<LigneFichier[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [rechercheCatalogue, setRechercheCatalogue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  // Lecture du fichier CSV / Excel
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length <= 1) {
          setError('Fichier vide ou format non valide')
          return
        }

        const parsed: LigneFichier[] = []
        // Sauter l'en-tête si présent
        const startIdx = lines[0].toLowerCase().includes('nom') || lines[0].toLowerCase().includes('prix') ? 1 : 0

        for (let i = startIdx; i < lines.length; i++) {
          const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''))
          if (cols.length >= 2 && cols[0]) {
            const nom = cols[0]
            const prix = Number(cols[1].replace(/\D/g, '')) || 0
            const quantite = cols[2] ? Number(cols[2]) || 1 : 10
            const categorie = cols[3] || 'alimentation'
            const code_barre = cols[4] || undefined

            if (nom && prix > 0) {
              parsed.push({
                id: `csv-${i}`,
                nom,
                prix,
                quantite,
                categorie,
                code_barre,
              })
            }
          }
        }

        if (parsed.length === 0) {
          setError('Aucun produit valide trouvé dans le fichier. Format attendu: Nom, Prix, Quantité, Catégorie')
        } else {
          setLignesFichier(parsed)
          setError(null)
        }
      } catch {
        setError('Impossible de lire le fichier')
      }
    }

    reader.readAsText(file)
  }

  useEffect(() => {
    fetch(`${backendUrl}/api/boutiques/catalogues-standards`)
      .then(res => res.json())
      .then(data => {
        if (data.catalogues) {
          setCatalogues(data.catalogues)
          const initialSaisies: Record<string, SaisieProduit> = {}
          Object.values(data.catalogues).flat().forEach((t: any) => {
            initialSaisies[t.id] = {
              template: t,
              selectionne: false,
              prix: '',
              quantite: 10,
            }
          })
          setSaisies(initialSaisies)
        }
      })
      .catch(() => setError('Impossible de charger le catalogue standard'))
      .finally(() => setLoading(false))
  }, [backendUrl])

  const templatesCategories = catalogues[categorieActive] || []

  function toggleSelection(id: string) {
    setSaisies(prev => ({
      ...prev,
      [id]: { ...prev[id], selectionne: !prev[id].selectionne }
    }))
  }

  function updatePrix(id: string, val: string) {
    setSaisies(prev => ({
      ...prev,
      [id]: { ...prev[id], prix: val, selectionne: true }
    }))
  }

  function updateQuantite(id: string, val: number) {
    setSaisies(prev => ({
      ...prev,
      [id]: { ...prev[id], quantite: Math.max(1, val) }
    }))
  }

  const produitsAEnvoyer = modeImport === 'catalogue'
    ? Object.values(saisies).filter(s => s.selectionne && Number(s.prix) > 0)
    : []

  async function validerBatch() {
    let payload: any[] = []

    if (modeImport === 'catalogue') {
      if (produitsAEnvoyer.length === 0) {
        setError('Veuillez sélectionner au moins 1 produit avec un prix valide (> 0 FCFA)')
        return
      }
      payload = produitsAEnvoyer.map(s => ({
        nom: s.template.nom,
        description: s.template.description,
        categorie: s.template.categorie,
        prix: Number(s.prix),
        quantite_stock: s.quantite,
        photo_defaut: s.template.photo_defaut,
        images: [s.template.photo_defaut],
        en_stock: true,
      }))
    } else {
      if (lignesFichier.length === 0) {
        setError('Veuillez sélectionner un fichier CSV/Excel contenant des produits valides')
        return
      }
      payload = lignesFichier.map(l => ({
        nom: l.nom,
        prix: l.prix,
        quantite_stock: l.quantite,
        categorie: l.categorie,
        en_stock: true,
      }))
    }

    const MAX_IMPORT = 50;
    if (payload.length > MAX_IMPORT) {
      setError(`Vous ne pouvez importer que ${MAX_IMPORT} produits à la fois. Vous en avez sélectionné ${payload.length}.`)
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/produits/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ produits: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’importation')

      setSuccessMsg(`🎉 ${data.count} produits ajoutés avec succès à votre boutique !`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (e: any) {
      setError(e.message || 'Erreur serveur lors de l’importation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* En-tête avec choix de méthode */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-archivo), sans-serif', color: '#111827' }}>
              📦 Importation par Lot (Batch Intake)
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
          </div>

          {/* Onglets Méthodes d'import */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#e5e7eb', padding: 4, borderRadius: 10 }}>
            <button
              onClick={() => setModeImport('catalogue')}
              style={{
                padding: '9px 12px', borderRadius: 8, border: 'none',
                background: modeImport === 'catalogue' ? '#fff' : 'transparent',
                color: modeImport === 'catalogue' ? '#C75B00' : '#4b5563',
                fontWeight: modeImport === 'catalogue' ? 800 : 500, fontSize: 13, cursor: 'pointer',
              }}
            >
              ⚡ 1. Catalogue Standard Prédéterminé (Sans fichier)
            </button>
            <button
              onClick={() => setModeImport('fichier')}
              style={{
                padding: '9px 12px', borderRadius: 8, border: 'none',
                background: modeImport === 'fichier' ? '#fff' : 'transparent',
                color: modeImport === 'fichier' ? '#1d4ed8' : '#4b5563',
                fontWeight: modeImport === 'fichier' ? 800 : 500, fontSize: 13, cursor: 'pointer',
              }}
            >
              📊 2. Import Fichier Excel / CSV (Fichier d&apos;inventaire)
            </button>
          </div>
        </div>

        {/* Navigation des catégories en mode catalogue */}
        {modeImport === 'catalogue' && (
          <div style={{
            display: 'flex', gap: 10, padding: '14px 24px', overflowX: 'auto', flexShrink: 0,
            borderBottom: '1px solid #e5e7eb', background: '#fff', alignItems: 'center', minHeight: 58,
          }}>
            {CATEGORIES.filter(c => c.value !== 'mixte').map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategorieActive(c.value)}
                style={{
                  padding: '9px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
                  background: categorieActive === c.value ? '#1d4ed8' : '#f3f4f6',
                  color: categorieActive === c.value ? '#fff' : '#4b5563',
                  fontWeight: categorieActive === c.value ? 800 : 600, fontSize: 13, cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.15s ease',
                  boxShadow: categorieActive === c.value ? '0 4px 10px rgba(199,91,0,0.25)' : 'none',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Contenu de la grille */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              {successMsg}
            </div>
          )}

          {modeImport === 'fichier' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Zone Glisser-Déposer File Input */}
              <div style={{ border: '2px dashed #93c5fd', background: '#eff6ff', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>📑</p>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>
                  Glissez-déposez votre fichier d&apos;inventaire (.csv ou .txt)
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#3b82f6' }}>
                  Format des colonnes : <strong>Nom, Prix, Quantité, Catégorie</strong>
                </p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'inline-block', fontSize: 13 }}
                />
              </div>

              {/* Prévisualisation des lignes lues */}
              {lignesFichier.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>
                      📋 {lignesFichier.length} articles détectés prêt à importer :
                    </span>
                    <button onClick={() => setLignesFichier([])} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Effacer</button>
                  </div>

                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lignesFichier.map((l, idx) => (
                      <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{idx + 1}. {l.nom}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: '#059669', fontWeight: 800 }}>{l.prix} FCFA</span>
                          <span style={{ color: '#6b7280' }}>Stock: {l.quantite}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Chargement du catalogue standard…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Barre de Recherche dans le catalogue */}
              <input
                type="text"
                placeholder="🔍 Rechercher un produit modèle (ex: Riz, Chargeur, Parfum, Ciment, Sac...)"
                value={rechercheCatalogue}
                onChange={e => setRechercheCatalogue(e.target.value)}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid #d1d5db',
                  fontSize: 14, background: '#fff', boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {templatesCategories.filter(t => {
                  if (!rechercheCatalogue.trim()) return true
                  const q = rechercheCatalogue.toLowerCase().trim()
                  return t.nom.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
                }).map(t => {
                  const item = saisies[t.id]
                  if (!item) return null
                  return (
                  <div
                    key={t.id}
                    style={{
                      background: '#fff', border: item.selectionne ? '2px solid #C75B00' : '1px solid #e5e7eb',
                      borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'center',
                      boxShadow: item.selectionne ? '0 4px 12px rgba(199,91,0,.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.selectionne}
                      onChange={() => toggleSelection(t.id)}
                      style={{ width: 18, height: 18, accentColor: '#C75B00', cursor: 'pointer' }}
                    />

                    <img
                      src={t.photo_defaut}
                      alt={t.nom}
                      style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', background: '#f3f4f6' }}
                    />

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>{t.nom}</p>
                      
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, display: 'block' }}>Prix unitaire (FCFA)</label>
                          <input
                            type="number"
                            placeholder="ex: 2500"
                            value={item.prix}
                            onChange={e => updatePrix(t.id, e.target.value)}
                            style={{
                              width: '100%', padding: '6px 8px', border: '1px solid #d1d5db',
                              borderRadius: 6, fontSize: 13, fontWeight: 600, boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div style={{ width: 70 }}>
                          <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, display: 'block' }}>Stock</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantite}
                            onChange={e => updateQuantite(t.id, Number(e.target.value))}
                            style={{
                              width: '100%', padding: '6px 8px', border: '1px solid #d1d5db',
                              borderRadius: 6, fontSize: 13, textAlign: 'center', boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modale */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            <span>{produitsAEnvoyer.length} produit(s) sélectionné(s)</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 18px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#4b5563' }}
            >
              Annuler
            </button>
            <button
              onClick={validerBatch}
              disabled={submitting || produitsAEnvoyer.length === 0}
              style={{
                padding: '10px 22px', background: produitsAEnvoyer.length > 0 ? '#C75B00' : '#9ca3af',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: produitsAEnvoyer.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: '0 2px 6px rgba(199,91,0,.25)',
              }}
            >
              {submitting ? 'Ajout en cours…' : `Ajouter les ${produitsAEnvoyer.length} article(s) →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
