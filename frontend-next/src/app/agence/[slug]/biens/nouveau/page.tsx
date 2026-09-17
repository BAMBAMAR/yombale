'use client'

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import BienForm from '../components/BienForm'

export default function NouveauBienPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── En-tête Mobile-First ── */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href={`/agence/${slug}/biens`}
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
          Retour au portefeuille
        </Link>
        <h1 className="agence-title" style={{ fontSize: 22 }}>Ajouter un bien immobilier</h1>
        <p className="agence-subtitle" style={{ fontSize: 13 }}>
          Création rapide depuis le terrain avec photos directes par smartphone et vidéos.
        </p>
      </div>

      <BienForm
        slug={slug}
        onSuccess={() => router.push(`/agence/${slug}/biens`)}
        onCancel={() => router.push(`/agence/${slug}/biens`)}
      />
    </div>
  )
}
