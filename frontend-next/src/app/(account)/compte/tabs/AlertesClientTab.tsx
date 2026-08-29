'use client'

import React from 'react'
import FormAlerte from '@/components/FormAlerte'
import MesAlertesClient from '@/components/MesAlertesClient'
import { useTranslation } from '@/i18n/context'
import { Bell, Info } from 'lucide-react'

export default function AlertesClientTab({ userId }: { userId: string }) {
  const { t } = useTranslation()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* En-tête */}
      <div style={{
        background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
        border: '1px solid #E8DDD2',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 8px rgba(26,22,18,0.04)',
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #C75B00 0%, #EA580C 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(199,91,0,0.25)',
        }}>
          <Bell size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            {t('account.navPriceAlerts') || 'Mes alertes prix'}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13.5, lineHeight: 1.5 }}>
            {t('account.alertsSubtitle') || 'Recevez une notification instantanée sur WhatsApp ou par Email dès qu’un produit atteint votre prix cible.'}
          </p>
        </div>
      </div>

      {/* Bannière explicative WhatsApp */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#15803D',
        fontSize: 13,
        fontWeight: 600,
      }}>
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          💡 <strong>Astuce :</strong> Vous pouvez également configurer une alerte en un clic directement depuis n’importe quelle fiche produit du catalogue !
        </span>
      </div>

      {/* Grille principale */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* Colonne 1: Formulaire de création */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '24px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 20 }}>➕</span>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              {t('account.createAlert') || 'Créer une alerte prix'}
            </h2>
          </div>
          <FormAlerte userId={userId} />
        </div>

        {/* Colonne 2: Liste des alertes actives */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '24px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              {t('account.myActiveAlerts') || 'Mes alertes actives'}
            </h2>
          </div>
          <MesAlertesClient userId={userId} />
        </div>
      </div>
    </div>
  )
}
