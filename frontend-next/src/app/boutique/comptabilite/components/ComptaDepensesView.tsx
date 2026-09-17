'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { Depense } from '../types'
import { listDepenses, addDepense, deleteDepense } from '../../actions'
import { exportToCSV, printPDFReport } from '@/lib/export'
import { fcfa, inputStyle, labelStyle, CAT_DEPENSES, MOIS_NOMS } from '../utils'
import { capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import { useTranslation } from '@/i18n/context'
import { useToast } from '@/context/ToastContext'
import { ComptaDepenseCard } from './ComptaDepenseCard'

interface ComptaDepensesViewProps {
  boutiqueId: string
}

export function ComptaDepensesView({ boutiqueId }: ComptaDepensesViewProps) {
  const { t } = useTranslation()
  const { toast, confirmModal } = useToast()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('stock')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fichier, setFichier] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Scanner OCR Reçu / Dépense
  const [modalScannerTicket, setModalScannerTicket] = useState(false)
  const videoTicketRef = useRef<HTMLVideoElement | null>(null)
  const streamTicketRef = useRef<MediaStream | null>(null)
  const [ocrDetectionsTicket, setOcrDetectionsTicket] = useState<string[]>([])
  const [statusScannerTicket, setStatusScannerTicket] = useState('')
  const [ocrLoadingTicket, setOcrLoadingTicket] = useState(false)

  const demarrerScannerTicket = async () => {
    setModalScannerTicket(true)
    setOcrDetectionsTicket([])
    setStatusScannerTicket('Cadrez le ticket ou la facturette…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamTicketRef.current = stream
      if (videoTicketRef.current) {
        videoTicketRef.current.srcObject = stream
        await videoTicketRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerTicket('Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerTicket = () => {
    if (streamTicketRef.current) {
      streamTicketRef.current.getTracks().forEach(t => t.stop())
      streamTicketRef.current = null
    }
    setModalScannerTicket(false)
  }

  const capturerTicketOCR = async () => {
    if (!videoTicketRef.current) return
    setOcrLoadingTicket(true)
    setStatusScannerTicket('Lecture OCR du ticket / facturette…')

    const imageBase64 = capturerZoneViseurExacte(videoTicketRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoadingTicket(false)
      setStatusScannerTicket('Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoadingTicket(false)

      if (data.ok && data.nom) {
        setDescription(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetectionsTicket(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerTicket(`Texte extrait : "${data.nom}"`)
        setTimeout(() => arreterScannerTicket(), 1000)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerTicket(`${data.error || 'Aucun texte lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoadingTicket(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerTicket('Erreur de lecture OCR.')
    }
  }

  async function load() {
    const cacheKey = `nopalou_offline_compta_depenses_${boutiqueId}`
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
    if (cached) {
      try { setDepenses(JSON.parse(cached)) } catch (e) { console.warn('[Nopalou:ComptaDepenses:Cache]', e) }
    }

    try {
      const d = await listDepenses(boutiqueId)
      if (Array.isArray(d)) {
        setDepenses(d)
        if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(d))
      }
    } catch (err) {
      console.warn(`[Comptabilité] Mode hors-ligne : utilisation du cache local dépenses (${cached ? 'disponible' : 'vide'}).`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueId])

  function submit() {
    if (!montant || Number(montant) <= 0) { setError(t('errors.invalidAmount') || 'Montant invalide'); return }
    setError(null)
    startTransition(async () => {
      const res = await addDepense(boutiqueId, { montant: Number(montant), categorie, description: description || undefined, date_depense: date })
      if (res.error) { setError(res.error); return }
      if (fichier && res.id) {
        setUploading(true)
        const form = new FormData()
        form.append('justificatif', fichier)
        await fetch(`/api/compta-proxy/${boutiqueId}/depenses/${res.id}/justificatif`, { method: 'POST', body: form }).catch(() => null)
        setUploading(false)
      }
      setMontant(''); setDescription(''); setFichier(null); setShowForm(false)
      load()
    })
  }

  async function remove(id: string) {
    const ok = await confirmModal({
      title: 'Supprimer la dépense',
      message: t('common.confirmDelete') || 'Voulez-vous vraiment supprimer cette dépense ?',
      confirmLabel: 'Supprimer',
      isDanger: true,
    })
    if (!ok) return
    startTransition(async () => {
      await deleteDepense(boutiqueId, id)
      toast.success('Dépense supprimée')
      load()
    })
  }

  const total = depenses.reduce((s, d) => s + Number(d.montant), 0)

  function exportDepensesCSV() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant (FCFA)']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      d.montant
    ])
    exportToCSV(`depenses_boutique_${boutiqueId}`, headers, rows)
  }

  function exportDepensesPDF() {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant']
    const rows = depenses.map(d => [
      d.date_depense,
      d.categorie.toUpperCase(),
      d.description || '—',
      `${Number(d.montant).toLocaleString('fr-FR')} FCFA`
    ])
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px;">Registre des Dépenses</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#dc2626;">Total Dépenses : ${total.toLocaleString('fr-FR')} FCFA (${depenses.length} entrées)</p>
      </div>
    `
    printPDFReport('Registre des Dépenses', `Boutique ${boutiqueId}`, headers, rows, summaryHtml)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{t('shop.expenses')} : <strong style={{ color: '#dc2626' }}>{fcfa(total)}</strong></p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportDepensesCSV} style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.exportCsv')}
          </button>
          <button onClick={exportDepensesPDF} style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.exportPdf')}
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}>
            + {t('shop.declareExpenseBtn')}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('shop.expenseAmountLabel')}</label>
              <input type="number" min={1} value={montant} onChange={e => setMontant(e.target.value)} style={inputStyle} placeholder="Ex: 25000" />
            </div>
            <div>
              <label style={labelStyle}>{t('common.date') || 'Date'}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('shop.productCategory')}</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} style={inputStyle}>
              {CAT_DEPENSES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ ...labelStyle, margin: 0 }}>{t('shop.expenseReasonLabel')}</label>
              <button
                type="button"
                onClick={demarrerScannerTicket}
                style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {t('shop.scanReceiptOcrBtn')}
              </button>
            </div>
            <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="Ex: Achat stock riz, Livraison DHL…" />
            {ocrDetectionsTicket.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {ocrDetectionsTicket.map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDescription(txt)}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>{t('shop.attachReceiptLabel')}</label>
            <input
              type="file" accept="image/*,application/pdf"
              onChange={e => setFichier(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13, color: '#374151' }}
            />
            {fichier && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>📎 {fichier.name}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={submit} disabled={uploading} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? t('common.loading') : t('common.save')}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}>
              {t('common.cancel')}
            </button>
          </div>

          {/* Modal Scanner Ticket OCR */}
          {modalScannerTicket && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{t('shop.scanReceiptOcrBtn')}</h4>
                  <button type="button" onClick={arreterScannerTicket} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerTicket}</p>
                <div style={{ width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <video ref={videoTicketRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed #38bdf8', borderRadius: 8, pointerEvents: 'none' }} />
                </div>
                <button
                  type="button"
                  disabled={ocrLoadingTicket}
                  onClick={capturerTicketOCR}
                  style={{ width: '100%', padding: '10px', background: ocrLoadingTicket ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: ocrLoadingTicket ? 'not-allowed' : 'pointer' }}
                >
                  {ocrLoadingTicket ? t('common.loading') : t('shop.captureAndExtractNameBtn')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>
      ) : depenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: 14 }}>
          {t('shop.noExpensesRegistered')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {depenses.map(d => (
            <ComptaDepenseCard key={d.id} depense={d} boutiqueId={boutiqueId} onDelete={remove} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  )
}
