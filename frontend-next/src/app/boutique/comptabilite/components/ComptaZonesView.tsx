'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { listZones, createZone, deleteZone } from '../../actions'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import type { Zone } from '../types'
import { inputStyle, labelStyle } from '../utils'

export default function ComptaZonesView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [, startTransition] = useTransition()

  async function load() {
    setLoading(true)
    const cacheKeyZ = `nopalou_offline_compta_zones_${boutiqueId}`
    const cachedZ = typeof window !== 'undefined' ? localStorage.getItem(cacheKeyZ) : null
    if (cachedZ) {
      try {
        setZones(JSON.parse(cachedZ))
        setLoading(false)
      } catch (e) {
        console.warn('[Nopalou:ComptaZonesView:cache]', e)
      }
    }

    try {
      const z = await listZones(boutiqueId)
      if (Array.isArray(z)) {
        setZones(z)
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKeyZ, JSON.stringify(z))
        }
      }
    } catch (err) {
      console.warn('[Zones] Mode hors-ligne : utilisation du cache local.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [boutiqueId])

  function submit() {
    if (!nom.trim() || !prix) return
    startTransition(async () => {
      await createZone(boutiqueId, nom.trim(), Number(prix))
      setNom('')
      setPrix('')
      setShowForm(false)
      load()
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    startTransition(async () => {
      await deleteZone(boutiqueId, id)
      load()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {zones.length} {t('shop.deliveryZonesTitle')}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            fontSize: 13,
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + {t('shop.addDeliveryZone')}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t('shop.zoneName')}</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={inputStyle}
              placeholder="Ex: Dakar Plateau, Banlieue…"
            />
          </div>
          <div style={{ width: 130 }}>
            <label style={labelStyle}>{t('shop.zoneFee')}</label>
            <input
              type="number"
              min={0}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              style={inputStyle}
              placeholder="0"
            />
          </div>
          <button
            onClick={submit}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t('common.save')}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</p>
      ) : zones.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #d1d5db',
            color: '#9ca3af',
            fontSize: 14,
          }}
        >
          {t('common.noData')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zones.map((z) => (
            <div
              key={z.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{z.nom}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{fcfa(z.prix)}</span>
                <button
                  onClick={() => remove(z.id)}
                  style={{
                    background: 'none',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
