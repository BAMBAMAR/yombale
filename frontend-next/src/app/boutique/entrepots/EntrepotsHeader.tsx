'use client'

import React from 'react'
import { Warehouse, Plus, Boxes } from 'lucide-react'
import type { Entrepot } from '../GestionEntrepots'

interface EntrepotsHeaderProps {
  entrepots: Entrepot[]
  totalUnites: number
  ouvrirCreation: () => void
  ouvrirAjustement: () => void
}

export default function EntrepotsHeader({
  entrepots,
  totalUnites,
  ouvrirCreation,
  ouvrirAjustement,
}: EntrepotsHeaderProps) {
  return (
    <>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--orange2, #FFF3E8)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Warehouse size={22} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              Gestion Multi-Entrepôts &amp; Dépôts Physiques
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12.5,
                color: 'var(--text2, #6B5E52)',
              }}
            >
              Gérez vos stocks répartis par site (Sandaga, Colobane, Pikine, Rufisque, Touba)
              avec agrégation en temps réel.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={ouvrirAjustement}
            style={{
              padding: '9px 15px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Boxes size={15} />
            <span>Ajuster Stock Dépôt</span>
          </button>
          <button
            type="button"
            onClick={ouvrirCreation}
            className="btn-npl btn-npl-primary"
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
            }}
          >
            <Plus size={15} />
            <span>Nouveau Dépôt</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>
            Dépôts Actifs
          </span>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              marginTop: 4,
            }}
          >
            {entrepots.length} site{entrepots.length > 1 ? 's' : ''}
          </div>
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>
            Dépôt Principal
          </span>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--accent, #C75B00)',
              marginTop: 4,
            }}
          >
            {entrepots.find((e) => e.est_defaut)?.nom || 'Aucun défini'}
          </div>
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>
            Total Unités Réparties
          </span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0A5C36', marginTop: 4 }}>
            {totalUnites.toLocaleString('fr-FR')} unités
          </div>
        </div>
      </div>
    </>
  )
}
