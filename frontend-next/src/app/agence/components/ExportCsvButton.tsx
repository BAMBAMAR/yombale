'use client'

import React, { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { showToast } from '@/context/ToastContext'

interface ExportCsvButtonProps {
  slug: string
  type: string
  label?: string
}

export default function ExportCsvButton({ slug, type, label }: ExportCsvButtonProps) {
  const [downloading, setDownloading] = useState(false)

  async function handleExport() {
    try {
      setDownloading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const urlWithToken = token
        ? `/api/agences/agence/${slug}/export/${type}?token=${encodeURIComponent(token)}`
        : `/api/agences/agence/${slug}/export/${type}`

      const res = await fetch(urlWithToken, {
        headers,
      })

      if (!res.ok) {
        throw new Error('Erreur lors du téléchargement du fichier CSV')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}_${type}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      showToast(`Export ${type} téléchargé avec succès !`, 'success', 'Export CSV')
    } catch (err: any) {
      console.error('[EXPORT_CSV_ERR]', err)
      showToast(err.message || 'Impossible d\'exporter les données', 'error', 'Export CSV')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={downloading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 8,
        border: '1px solid var(--border, #E8DDD2)',
        background: '#FFFFFF',
        color: 'var(--navy, #1C2B4A)',
        fontSize: 13,
        fontWeight: 650,
        cursor: downloading ? 'wait' : 'pointer',
        transition: 'all 0.15s ease',
      }}
      title={`Exporter les ${type} en format Excel CSV`}
    >
      {downloading ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
      <span>{label || 'Exporter CSV'}</span>
    </button>
  )
}
