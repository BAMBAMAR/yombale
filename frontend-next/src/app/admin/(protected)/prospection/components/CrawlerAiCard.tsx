'use client'

import React, { useState } from 'react'
import { Bot, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Globe } from 'lucide-react'

interface Props {
  secret: string
  onSuccess?: () => void
}

interface CrawlResult {
  succes: boolean
  annoncesTrouvees: number
  annoncesInserees: number
  leadsSynchronises: number
  erreurs?: string[]
  diagnostic?: string
}

export default function CrawlerAiCard({ secret, onSuccess }: Props) {
  const [url, setUrl] = useState('')
  const [maxItems, setMaxItems] = useState(15)
  const [sourceLabel, setSourceLabel] = useState('crawler-web')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CrawlResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLancerCrawl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/prospection/crawler-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          url: url.trim(),
          maxItems,
          sourceLabel: sourceLabel.trim() || 'crawler-web',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du crawling de la page')
      }

      setResult({
        succes: data.succes,
        annoncesTrouvees: data.annoncesTrouvees || 0,
        annoncesInserees: data.annoncesInserees || 0,
        leadsSynchronises: data.leadsSynchronises || 0,
        erreurs: data.erreurs,
        diagnostic: data.diagnostic,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(10, 92, 54, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bot size={22} color="#0A5C36" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
            Crawler Sémantique IA (Playwright &amp; Nettoyage DOM)
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
            Aspire n&apos;importe quelle page web : nettoyage anti-bruit, extraction de prix FCFA et contacts 221, puis stockage Cloudinary.
          </p>
        </div>
      </div>

      <form onSubmit={handleLancerCrawl} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800, color: '#1C2B4A', display: 'block', marginBottom: 6 }}>
            URL de la page cible
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: '#94A3B8' }}>
              <Globe size={16} />
            </span>
            <input
              type="url"
              required
              placeholder="https://www.exemple-site.sn/locations-appartements"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
              Max annonces à extraire
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxItems}
              onChange={(e) => setMaxItems(parseInt(e.target.value, 10) || 15)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
              Label de source
            </label>
            <input
              type="text"
              placeholder="crawler-web"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          style={{
            background: '#0A5C36',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(10, 92, 54, 0.25)',
            transition: 'all 0.2s',
            opacity: loading || !url.trim() ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Analyse et extraction en cours...
            </>
          ) : (
            <>
              Lancer le Crawl Intelligent
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#DC2626',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: result.annoncesInserees > 0 ? 'rgba(10, 92, 54, 0.08)' : 'rgba(199, 91, 0, 0.08)',
            border: result.annoncesInserees > 0 ? '1px solid rgba(10, 92, 54, 0.25)' : '1px solid rgba(199, 91, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {result.annoncesInserees > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--price)', fontWeight: 800, fontSize: 14 }}>
              <CheckCircle2 size={18} />
              <span>Crawling terminé avec succès !</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 800, fontSize: 14 }}>
              <AlertCircle size={18} />
              <span>Crawling terminé : aucune annonce créée</span>
            </div>
          )}
          {(result.diagnostic || (result.erreurs && result.erreurs.length > 0)) && (
            <div style={{ fontSize: 12.5, color: 'var(--navy)', lineHeight: 1.45 }}>
              {[result.diagnostic, ...(result.erreurs || [])].filter(Boolean).join(' — ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#1C2B4A' }}>
            <span><strong>{result.annoncesTrouvees}</strong> annonces analysées</span>
            <span>•</span>
            <span><strong>+{result.annoncesInserees}</strong> créées au catalogue</span>
            <span>•</span>
            <span><strong>+{result.leadsSynchronises}</strong> leads CRM WhatsApp</span>
          </div>
        </div>
      )}
    </div>
  )
}
