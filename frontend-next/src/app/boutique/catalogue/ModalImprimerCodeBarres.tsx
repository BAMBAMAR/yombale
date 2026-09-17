'use client'

import React, { useState } from 'react'
import { Printer, Tag, Sliders, X, Layers, Grid, Check, ShieldCheck } from 'lucide-react'
import { genererSVGCodeBarresEAN13 } from '../boutiqueHelpers'
import { useToast } from '@/context/ToastContext'

export interface ProduitPourEtiquette {
  id: string
  nom: string
  prix?: number | null
  code_barre?: string | null
}

interface ModalImprimerCodeBarresProps {
  isOpen: boolean
  onClose: () => void
  produits: ProduitPourEtiquette[]
  nomBoutique?: string
}

type FormatEtiquette = 'a4_24' | 'a4_40' | 'thermal'

export default function ModalImprimerCodeBarres({
  isOpen,
  onClose,
  produits,
  nomBoutique = 'Nopalou Marchand',
}: ModalImprimerCodeBarresProps) {
  const { toast } = useToast()
  const [format, setFormat] = useState<FormatEtiquette>('a4_24')
  const [quantiteParProduit, setQuantiteParProduit] = useState<number>(1)
  const [afficherPrix, setAfficherPrix] = useState<boolean>(true)
  const [afficherNomBoutique, setAfficherNomBoutique] = useState<boolean>(true)

  if (!isOpen || produits.length === 0) return null

  // Construction de la liste aplatie des étiquettes à imprimer
  const etiquettesAImprimer: ProduitPourEtiquette[] = []
  for (const prod of produits) {
    const qte = Math.max(1, quantiteParProduit)
    for (let i = 0; i < qte; i++) {
      etiquettesAImprimer.push(prod)
    }
  }

  const handleImprimer = () => {
    try {
      const printWin = window.open('', '_blank', 'width=900,height=750')
      if (!printWin) {
        toast.error('Veuillez autoriser les fenêtres pop-up pour lancer l\'impression.')
        return
      }

      const stylesA4_24 = `
        @page { size: A4 portrait; margin: 8mm 6mm; }
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #fff; }
        .sheet {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 37mm;
          gap: 2mm;
          page-break-after: always;
          box-sizing: border-box;
        }
        .label {
          border: 1px dashed #cbd5e1;
          box-sizing: border-box;
          padding: 3mm 4mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: space-between;
          text-align: center;
          overflow: hidden;
        }
        .store { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
        .name { font-size: 10px; font-weight: 800; color: #0f172a; line-height: 1.2; max-height: 24px; overflow: hidden; }
        .price { font-size: 11px; font-weight: 900; color: #000000; }
        .barcode svg { width: 100%; max-width: 48mm; height: 14mm; }
        .ean-code { font-family: monospace; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; }
      `

      const stylesA4_40 = `
        @page { size: A4 portrait; margin: 8mm 5mm; }
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #fff; }
        .sheet {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 29.7mm;
          gap: 1.5mm;
          page-break-after: always;
          box-sizing: border-box;
        }
        .label {
          border: 1px dashed #cbd5e1;
          box-sizing: border-box;
          padding: 2mm 3mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: space-between;
          text-align: center;
          overflow: hidden;
        }
        .store { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #475569; }
        .name { font-size: 9px; font-weight: 800; color: #0f172a; line-height: 1.1; max-height: 20px; overflow: hidden; }
        .price { font-size: 10px; font-weight: 900; color: #000000; }
        .barcode svg { width: 100%; max-width: 38mm; height: 11mm; }
        .ean-code { font-family: monospace; font-size: 8px; font-weight: bold; letter-spacing: 1px; }
      `

      const stylesThermal = `
        @page { size: 58mm auto; margin: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 4mm; background: #fff; width: 58mm; box-sizing: border-box; }
        .sheet { display: flex; flex-direction: column; gap: 4mm; }
        .label {
          border-bottom: 1px dashed #94a3b8;
          padding-bottom: 3mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          page-break-inside: avoid;
        }
        .store { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 2px; }
        .name { font-size: 11px; font-weight: 800; color: #000; margin-bottom: 2px; }
        .price { font-size: 13px; font-weight: 900; color: #000; margin-bottom: 3px; }
        .barcode svg { width: 100%; max-width: 48mm; height: 16mm; }
        .ean-code { font-family: monospace; font-size: 10px; font-weight: bold; letter-spacing: 1.5px; margin-top: 2px; }
      `

      const cssChosen = format === 'a4_24' ? stylesA4_24 : format === 'a4_40' ? stylesA4_40 : stylesThermal

      const labelsHtml = etiquettesAImprimer.map((prod) => {
        const ean = prod.code_barre || '2001234567890'
        const svgBarcode = genererSVGCodeBarresEAN13(ean)
        const prixStr = prod.prix != null ? `${new Intl.NumberFormat('fr-FR').format(prod.prix)} FCFA` : ''

        return `
          <div class="label">
            ${afficherNomBoutique ? `<div class="store">${nomBoutique}</div>` : ''}
            <div class="name">${prod.nom}</div>
            ${afficherPrix && prixStr ? `<div class="price">${prixStr}</div>` : ''}
            <div class="barcode">${svgBarcode}</div>
            <div class="ean-code">${ean}</div>
          </div>
        `
      }).join('')

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Étiquettes Codes-Barres - ${nomBoutique}</title>
          <style>${cssChosen}</style>
        </head>
        <body>
          <div class="sheet">${labelsHtml}</div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1500);
            };
          </script>
        </body>
        </html>
      `)
      printWin.document.close()
      toast.success(`${etiquettesAImprimer.length} étiquette(s) envoyée(s) à l'impression !`)
      onClose()
    } catch {
      toast.error('Erreur lors de la génération de la planche d\'étiquettes.')
    }
  }

  // Aperçu du premier produit
  const premierProduit = produits[0]
  const previewEan = premierProduit?.code_barre || '2001234567890'
  const previewSvg = genererSVGCodeBarresEAN13(previewEan)

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          background: '#ffffff',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Entête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#FFF3E8',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Imprimer les Étiquettes Codes-Barres
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: '2px 0 0' }}>
                {produits.length} référence(s) sélectionnée(s) • Planches A4 adhésives ou rouleau caisse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Choix du format */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 8 }}>
            Format d&apos;impression
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <button
              type="button"
              onClick={() => setFormat('a4_24')}
              style={{
                background: format === 'a4_24' ? '#FFF3E8' : '#F8F5F0',
                border: `1.5px solid ${format === 'a4_24' ? 'var(--accent, #C75B00)' : '#E8DDD2'}`,
                borderRadius: 12,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Grid size={18} color={format === 'a4_24' ? 'var(--accent, #C75B00)' : '#64748b'} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>A4 (24 étiquettes)</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>70 × 37 mm universel</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('a4_40')}
              style={{
                background: format === 'a4_40' ? '#FFF3E8' : '#F8F5F0',
                border: `1.5px solid ${format === 'a4_40' ? 'var(--accent, #C75B00)' : '#E8DDD2'}`,
                borderRadius: 12,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Layers size={18} color={format === 'a4_40' ? 'var(--accent, #C75B00)' : '#64748b'} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>A4 (40 étiquettes)</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>52.5 × 29.7 mm compact</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('thermal')}
              style={{
                background: format === 'thermal' ? '#FFF3E8' : '#F8F5F0',
                border: `1.5px solid ${format === 'thermal' ? 'var(--accent, #C75B00)' : '#E8DDD2'}`,
                borderRadius: 12,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Printer size={18} color={format === 'thermal' ? 'var(--accent, #C75B00)' : '#64748b'} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Thermique</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>Rouleau 58 / 80 mm</span>
            </button>
          </div>
        </div>

        {/* Paramètres & Quantité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
              Exemplaires par produit
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantiteParProduit}
              onChange={(e) => setQuantiteParProduit(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 14,
                fontWeight: 700,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={afficherPrix}
                onChange={(e) => setAfficherPrix(e.target.checked)}
              />
              Afficher le prix FCFA
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={afficherNomBoutique}
                onChange={(e) => setAfficherNomBoutique(e.target.checked)}
              />
              Afficher le nom de la boutique
            </label>
          </div>
        </div>

        {/* Aperçu direct de l'étiquette */}
        <div
          style={{
            background: 'var(--bg, #F8F5F0)',
            border: '1px dashed var(--border, #E8DDD2)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
            Aperçu étiquette (référence 1 sur {produits.length})
          </span>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px 16px',
              maxWidth: 220,
              width: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {afficherNomBoutique && (
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                {nomBoutique}
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '2px 0' }}>
              {premierProduit?.nom}
            </div>
            {afficherPrix && premierProduit?.prix != null && (
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--price, #0A5C36)', margin: '2px 0' }}>
                {new Intl.NumberFormat('fr-FR').format(premierProduit.prix)} FCFA
              </div>
            )}
            <div
              dangerouslySetInnerHTML={{ __html: previewSvg }}
              style={{ margin: '6px 0 2px', display: 'flex', justifyContent: 'center' }}
            />
            <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
              {previewEan}
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
            Total : <strong>{etiquettesAImprimer.length} étiquette(s)</strong> générée(s)
          </span>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleImprimer}
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)',
            }}
          >
            <Printer size={16} />
            Lancer l&apos;impression ({etiquettesAImprimer.length})
          </button>
        </div>
      </div>
    </div>
  )
}
