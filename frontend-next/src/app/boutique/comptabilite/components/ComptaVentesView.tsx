'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Vente, Zone, Produit } from '../types'
import { listVentes, listZones, deleteVente, getBoutiqueProduits } from '../../actions'
import { fcfa } from '../utils'
import { fmtDate, fmtDateHeure } from '@/lib/format'
import { exportToCSV, printPDFReport, exportSyscohadaGeneralLedgerCSV } from '@/lib/export'
import { useTranslation } from '@/i18n/context'
import { ComptaEditVenteModal } from './ComptaEditVenteModal'
import { ComptaVenteForm } from './ComptaVenteForm'

interface ComptaVentesViewProps {
  boutiqueId: string
}

export function ComptaVentesView({ boutiqueId }: ComptaVentesViewProps) {
  const { t } = useTranslation()
  const [ventes, setVentes] = useState<Vente[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingVente, setEditingVente] = useState<Vente | null>(null)
  const [, startTransition] = useTransition()

  async function load() {
    const cacheKeyV = `nopalou_offline_compta_ventes_${boutiqueId}`
    const cacheKeyZ = `nopalou_offline_compta_zones_${boutiqueId}`
    const cachedV = typeof window !== 'undefined' ? localStorage.getItem(cacheKeyV) : null
    const cachedZ = typeof window !== 'undefined' ? localStorage.getItem(cacheKeyZ) : null

    if (cachedV) { try { setVentes(JSON.parse(cachedV)) } catch (e) { console.warn('[Nopalou:ComptaVentes:CacheV]', e) } }
    if (cachedZ) { try { setZones(JSON.parse(cachedZ)) } catch (e) { console.warn('[Nopalou:ComptaVentes:CacheZ]', e) } }

    try {
      const [v, z, p] = await Promise.all([
        listVentes(boutiqueId),
        listZones(boutiqueId),
        getBoutiqueProduits(boutiqueId),
      ])
      if (Array.isArray(v)) {
        setVentes(v)
        if (typeof window !== 'undefined') localStorage.setItem(cacheKeyV, JSON.stringify(v))
      }
      if (Array.isArray(z)) {
        setZones(z)
        if (typeof window !== 'undefined') localStorage.setItem(cacheKeyZ, JSON.stringify(z))
      }
      if (Array.isArray(p)) setProduits(p)
    } catch (err) {
      console.warn(`[Comptabilité] Mode hors-ligne : utilisation du cache local ventes/zones (${cachedV ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function removeVente(id: string) {
    if (!confirm(t('common.confirmDelete') || 'Supprimer cette vente ? Elle ne sera plus comptabilisée.')) return
    setDeleting(id)
    startTransition(async () => {
      await deleteVente(boutiqueId, id)
      setDeleting(null)
      load()
    })
  }

  const methodeLabel: Record<string, string> = { cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement' }

  function exportVentesCSV() {
    const headers = ['Référence', 'Produit/Service', 'Quantité', 'Prix Unitaire (FCFA)', 'Livraison (FCFA)', 'Total (FCFA)', 'Client', 'Mode Paiement', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      v.prix_unitaire,
      v.frais_livraison,
      v.montant_total,
      v.client_nom || 'Client Anonyme',
      methodeLabel[v.methode_paiement] || v.methode_paiement,
      fmtDateHeure(v.created_at)
    ])
    exportToCSV(`ventes_boutique_${boutiqueId}`, headers, rows)
  }

  function exportVentesPDF() {
    const headers = ['Réf.', 'Produit', 'Qte', 'Prix Unit.', 'Total', 'Client', 'Date']
    const rows = ventes.map(v => [
      v.reference || v.id.slice(0, 8),
      v.nom_produit,
      v.quantite,
      `${v.prix_unitaire.toLocaleString('fr-FR')} FCFA`,
      `${v.montant_total.toLocaleString('fr-FR')} FCFA`,
      v.client_nom || 'Client Anonyme',
      fmtDateHeure(v.created_at)
    ])
    const totalCA = ventes.reduce((s, v) => s + Number(v.montant_total), 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Bilan des Ventes</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#16a34a;">Total Ventes Enregistrées : ${totalCA.toLocaleString('fr-FR')} FCFA (${ventes.length} transactions)</p>
      </div>
    `
    printPDFReport('Registre & Bilan des Ventes', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  function exportVentesSyscohada() {
    exportSyscohadaGeneralLedgerCSV(
      `Boutique_${boutiqueId}`,
      'Journal_Ventes',
      ventes.map(v => ({
        id: v.id,
        reference: v.reference,
        date: v.created_at,
        nom_produit: v.nom_produit,
        quantite: v.quantite,
        montant_total: v.montant_total,
        methode_paiement: v.methode_paiement,
        client_nom: v.client_nom,
      }))
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {editingVente && <ComptaEditVenteModal vente={editingVente} boutiqueId={boutiqueId} onClose={() => setEditingVente(null)} onDone={load} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{ventes.length} {t('shop.totalSales').toLowerCase()}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportVentesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.exportCsv')}
          </button>
          <button onClick={exportVentesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.exportPdf')}
          </button>
          <button onClick={exportVentesSyscohada} style={{ fontSize: 12, color: '#1e3a5f', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Exporter pour expert-comptable au format officiel SYSCOHADA (Sage, Odoo, Saari)">
            SYSCOHADA
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + {t('shop.declareSaleBtn')}
          </button>
        </div>
      </div>

      {showForm && (
        <ComptaVenteForm boutiqueId={boutiqueId} produits={produits} zones={zones} onDone={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>
      ) : ventes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          {t('shop.noSalesRegistered')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ventes.map(v => (
            <div key={v.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{v.nom_produit}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {v.quantite} × {fcfa(v.prix_unitaire)}
                  {v.frais_livraison > 0 ? ` + ${fcfa(v.frais_livraison)} livraison` : ''}
                  {v.client_nom ? ` · ${v.client_nom}` : ''}
                  {' · '}{methodeLabel[v.methode_paiement] ?? v.methode_paiement}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  {fmtDate(v.created_at)} · Réf {v.reference}
                </p>
                {v.justificatif_url && (
                  <a href={v.justificatif_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                    📎 {t('shop.attachReceiptLabel')} ↗
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1d4ed8' }}>{fcfa(v.montant_total)}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <a href={`/boutique/ventes/facture/${boutiqueId}/${v.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6b7280' }}>
                    PDF ↗
                  </a>
                  <button
                    onClick={() => setEditingVente(v)}
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11 }}
                  >✎</button>
                  <button
                    onClick={() => removeVente(v.id)}
                    disabled={deleting === v.id}
                    style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, opacity: deleting === v.id ? 0.5 : 1 }}
                    title="Archiver"
                  >✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
