'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { listZones, createZone, deleteZone } from '../../actions'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import { useToast } from '@/context/ToastContext'
import { MapPin, Sparkles, Plus, Trash2 } from 'lucide-react'
import type { Zone } from '../types'
import { inputStyle, labelStyle } from '../utils'

const PRESETS_REGIONS = [
  { nom: 'Thiès (Centre & Gare)', prix: 2500 },
  { nom: 'Mbour & Saly (Petite-Côte)', prix: 3000 },
  { nom: 'Touba & Diourbel', prix: 3500 },
  { nom: 'Saint-Louis & Ndiolofène', prix: 4000 },
  { nom: 'Kaolack & Bassin Arachidier', prix: 4000 },
  { nom: 'Ziguinchor (Casamance GP/Poste)', prix: 5000 },
]

const PRESETS_DAKAR = [
  { nom: 'Dakar Centre (Plateau, Médina, Fann)', prix: 1500 },
  { nom: 'Almadies, Ngor, Ouakam, Mamelles', prix: 2000 },
  { nom: 'Banlieue (Pikine, Guédiawaye, Rufisque)', prix: 2500 },
]

export default function ComptaZonesView({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [injecting, setInjecting] = useState(false)
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
    } catch {
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
      const res = await createZone(boutiqueId, nom.trim(), Number(prix))
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Zone « ${nom.trim()} » ajoutée avec succès !`)
        setNom('')
        setPrix('')
        setShowForm(false)
        load()
      }
    })
  }

  function remove(id: string, zoneNom: string) {
    startTransition(async () => {
      const res = await deleteZone(boutiqueId, id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Zone « ${zoneNom} » supprimée`)
        load()
      }
    })
  }

  async function injecterPresets(presets: typeof PRESETS_REGIONS, label: string) {
    setInjecting(true)
    let ajoutes = 0
    try {
      const nomsExistants = new Set(zones.map((z) => z.nom.toLowerCase().trim()))
      for (const item of presets) {
        if (!nomsExistants.has(item.nom.toLowerCase().trim())) {
          await createZone(boutiqueId, item.nom, item.prix)
          ajoutes++
        }
      }
      if (ajoutes > 0) {
        toast.success(`${ajoutes} zone(s) de livraison ${label} ajoutée(s) !`)
        await load()
      } else {
        toast.info(`Toutes les zones ${label} sont déjà présentes dans votre catalogue.`)
      }
    } catch {
      toast.error('Erreur lors de l’injection des zones')
    } finally {
      setInjecting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {zones.length} {t('shop.deliveryZonesTitle')} configurée(s)
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => injecterPresets(PRESETS_REGIONS, 'Régions Sénégal')}
            disabled={injecting}
            style={{
              fontSize: 12,
              background: '#FFF7ED',
              color: 'var(--accent, #C75B00)',
              border: '1.5px solid #FED7AA',
              borderRadius: 6,
              padding: '6px 12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Ajouter en 1 clic Thiès, Mbour, Touba, Saint-Louis, Kaolack, Ziguinchor"
          >
            <MapPin size={13} />
            <span>Régions Sénégal (1-clic)</span>
          </button>

          <button
            type="button"
            onClick={() => injecterPresets(PRESETS_DAKAR, 'Grand Dakar')}
            disabled={injecting}
            style={{
              fontSize: 12,
              background: '#EFF6FF',
              color: '#1D4ED8',
              border: '1.5px solid #BFDBFE',
              borderRadius: 6,
              padding: '6px 12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Ajouter en 1 clic Dakar Centre, Almadies/Ngor, et Banlieue"
          >
            <Sparkles size={13} />
            <span>Grand Dakar</span>
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              fontSize: 12.5,
              background: 'var(--navy, #1C2B4A)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} />
            <span>{t('shop.addDeliveryZone')}</span>
          </button>
        </div>
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
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>{t('shop.zoneName')}</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={inputStyle}
              placeholder="Ex: Dakar Plateau, Banlieue, Thiès…"
            />
          </div>
          <div style={{ width: 140 }}>
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
              background: 'var(--price, #0A5C36)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontWeight: 800,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color="#64748b" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>{z.nom}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--price, #0A5C36)' }}>{fcfa(z.prix)}</span>
                <button
                  onClick={() => remove(z.id, z.nom)}
                  style={{
                    background: 'none',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="Supprimer cette zone"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

