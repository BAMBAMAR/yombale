'use client'

import React from 'react'
import Link from 'next/link'
import { Tag } from 'lucide-react'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { Annonce } from './types'

interface BoutiqueAnnoncesTabProps {
  annonces: Annonce[]
}

export default function BoutiqueAnnoncesTab({ annonces }: BoutiqueAnnoncesTabProps) {
  if (annonces.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
        <Tag size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#9ca3af' }} />
        <p style={{ margin: 0 }}>Aucune annonce pour l&apos;instant.</p>
      </div>
    )
  }

  return (
    <div className="boutique-annonces-grid">
      {annonces.map(a => {
        const img = a.photos?.[0] ?? null
        return (
          <Link href={`/annonces/${a.id}`} key={a.id} className="boutique-annonce-card">
            <div className="boutique-annonce-img">
              {img ? (
                <img src={cloudinaryHQ(img, { width: 400 })} alt={a.titre} loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                  <Tag size={28} style={{ color: '#94a3b8' }} />
                </div>
              )}
            </div>
            <div className="boutique-annonce-body">
              <p className="boutique-annonce-titre">{a.titre}</p>
              <p className="boutique-annonce-prix">{a.prix ? fcfa(a.prix) : 'Prix à négocier'}</p>
              {a.ville && (
                <p className="boutique-annonce-ville">
                  {[a.quartier, a.ville].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
