'use client'

import React, { useState } from 'react'
import {
  BellRing,
  Send,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Crown,
  MessageSquareWarning,
  Star,
  LifeBuoy,
  Radio,
  ExternalLink,
} from 'lucide-react'
import { adminHeaders } from '@/app/actions/admin/admin-common'

interface SystemAlertsCardProps {
  secret: string
}

export default function SystemAlertsCard({ secret }: SystemAlertsCardProps) {
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleTestAlertes = async () => {
    setLoading(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/admin/system/test-alertes', {
        method: 'POST',
        headers: {
          ...adminHeaders(secret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canal: 'tous' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'ok',
          text: `Alerte test transmise avec succès vers WhatsApp (${data.phone || '+221 77 720 20 86'}) ! Vérifiez votre téléphone.`,
        })
      } else {
        setStatusMsg({
          type: 'err',
          text: data.error || "Erreur lors de l'envoi de l'alerte test",
        })
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.message || 'Erreur réseau de communication',
      })
    } finally {
      setLoading(false)
    }
  }

  const alertCategories = [
    {
      title: 'Paiements Manuels',
      desc: 'Déclarations Wave / OM avec reçus et montants',
      icon: CreditCard,
      color: '#0A5C36',
      badge: 'Priorité P0',
    },
    {
      title: 'Abonnements & Revenus',
      desc: 'Nouvelles souscriptions et renouvellements marchands',
      icon: Crown,
      color: '#C75B00',
      badge: 'Priorité P1',
    },
    {
      title: "Signalements d'Abus & Fraude",
      desc: 'Suspicion arnaque, produits ou boutiques signalés',
      icon: MessageSquareWarning,
      color: '#DC2626',
      badge: 'Priorité P0',
    },
    {
      title: 'Modération des Avis Clients',
      desc: 'Notes négatives (1 ou 2 étoiles) et signalements',
      icon: Star,
      color: '#D97706',
      badge: 'Priorité P1',
    },
    {
      title: 'Helpdesk & Support Client',
      desc: 'Nouveaux tickets urgents et litiges de commande',
      icon: LifeBuoy,
      color: '#1C2B4A',
      badge: 'Priorité P1',
    },
  ]

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: 22,
        border: '1px solid #e2e8f0',
        marginBottom: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: 16,
              fontWeight: 800,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BellRing size={18} color="#C75B00" />
            Alertes Administratives Multi-Canales (WhatsApp & Telegram)
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Supervision en temps réel des flux opérationnels sensibles directement sur votre smartphone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleTestAlertes}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #C75B00',
              background: loading ? '#f1f5f9' : '#C75B00',
              color: loading ? '#64748b' : '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'background 0.2s',
            }}
          >
            <Send size={14} />
            {loading ? 'Envoi en cours...' : 'Tester WhatsApp & Telegram'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: statusMsg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
            color: statusMsg.type === 'ok' ? '#15803d' : '#b91c1c',
            border: `1px solid ${statusMsg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Destinations Actives */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            background: '#F8F5F0',
            border: '1px solid #E8DDD2',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#25D366',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Phone size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C2B4A' }}>Canal WhatsApp Officiel</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>+221 77 720 20 86</div>
            </div>
          </div>
          <span
            style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShieldCheck size={12} /> Actif
          </span>
        </div>

        <div
          style={{
            background: '#F8F5F0',
            border: '1px solid #E8DDD2',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#24A1DE',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radio size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C2B4A' }}>Bot Telegram Admin</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Alertes push & topics</div>
            </div>
          </div>
          <span
            style={{
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Connecté
          </span>
        </div>
      </div>

      {/* Événements Métier Supervisés */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
        Événements Critiques Déclencheurs d&apos;Alertes Immédiates
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        {alertCategories.map((cat, idx) => {
          const IconComp = cat.icon
          return (
            <div
              key={idx}
              style={{
                border: '1px solid #f1f5f9',
                borderRadius: 8,
                padding: '10px 12px',
                background: '#fafbfc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 74,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  <IconComp size={15} color={cat.color} />
                  <span>{cat.title}</span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 4,
                    background: cat.badge === 'Priorité P0' ? '#fee2e2' : '#fef3c7',
                    color: cat.badge === 'Priorité P0' ? '#b91c1c' : '#92400e',
                  }}
                >
                  {cat.badge}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>{cat.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
