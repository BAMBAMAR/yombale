'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import BienForm from '../../components/BienForm'

export default function EditerBienPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const bienId = params?.bienId as string

  const [bien, setBien] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function chargerBien() {
      try {
        setLoading(true)
        const res = await fetch(`/api/biens/agence/${slug}/${bienId}`, {
          headers: getImmoAuthHeaders(),
        })
        const data = await res.json()
        if (res.ok && data.success && data.bien) {
          setBien(data.bien)
        } else {
          setErrorMsg(data.error || 'Bien introuvable.')
        }
      } catch (err) {
        console.error('[LOAD_BIEN_EDIT_ERR]', err)
        setErrorMsg('Erreur lors du chargement des données du bien.')
      } finally {
        setLoading(false)
      }
    }

    if (slug && bienId) {
      chargerBien()
    }
  }, [slug, bienId])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── En-tête Mobile-First ── */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href={`/agence/${slug}/biens/${bienId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 700,
            color: '#64748B',
            textDecoration: 'none',
            marginBottom: 6,
          }}
        >
          <ArrowLeft size={15} />
          Retour à la fiche du bien
        </Link>
        <h1 className="agence-title" style={{ fontSize: 22 }}>
          {bien ? `Modifier : ${bien.titre}` : 'Modifier le bien immobilier'}
        </h1>
        <p className="agence-subtitle" style={{ fontSize: 13 }}>
          Mise à jour des photos, vidéos, commodités et conditions tarifaires.
        </p>
      </div>

      {loading && (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#64748B',
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--accent, #C75B00)' }} />
          <div>Chargement des données du bien…</div>
        </div>
      )}

      {errorMsg && !loading && (
        <div
          style={{
            padding: '14px 16px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!loading && bien && (
        <BienForm
          slug={slug}
          initialBien={bien}
          onSuccess={() => router.push(`/agence/${slug}/biens/${bienId}`)}
          onCancel={() => router.push(`/agence/${slug}/biens/${bienId}`)}
        />
      )}
    </div>
  )
}
