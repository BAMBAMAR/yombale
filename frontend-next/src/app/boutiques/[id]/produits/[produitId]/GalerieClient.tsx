'use client'
import { useState } from 'react'
import { cloudinaryHQ } from '@/lib/cloudinary'

export default function GalerieClient({
  images,
  nom,
  enStock,
}: {
  images: string[]
  nom: string
  enStock: boolean
}) {
  const [idx, setIdx] = useState(0)
  const imgs = images?.length ? images : []
  const current = imgs[idx] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Image principale */}
      <div style={{
        width: '100%', paddingTop: '100%', position: 'relative',
        background: '#f8fafc', borderRadius: 16, overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {current
          // eslint-disable-next-line @next/next/no-img-element
          ? <img
              src={cloudinaryHQ(current, { width: 700 })}
              alt={nom}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>📦</span>
        }
        {!enStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 15, padding: '8px 20px', borderRadius: 20 }}>
              Rupture de stock
            </span>
          </div>
        )}
        {/* Flèches navigation si plusieurs images */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
              style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,.9)', cursor: 'pointer',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              }}
              aria-label="Image précédente"
            >‹</button>
            <button
              onClick={() => setIdx(i => (i + 1) % imgs.length)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,.9)', cursor: 'pointer',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              }}
              aria-label="Image suivante"
            >›</button>
            {/* Compteur */}
            <span style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(0,0,0,.5)', color: '#fff',
              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            }}>
              {idx + 1}/{imgs.length}
            </span>
          </>
        )}
      </div>

      {/* Miniatures */}
      {imgs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                border: idx === i ? '2px solid #C75B00' : '2px solid #e2e8f0',
                padding: 0, cursor: 'pointer', background: 'none',
                transition: 'border-color .15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloudinaryHQ(src, { width: 150 })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
