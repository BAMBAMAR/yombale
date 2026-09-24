'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Plus,
  Share2,
  FileCheck2,
  BookOpen,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

interface AgenceOnboardingGuideProps {
  slug: string
  totalBiens: number
}

export default function AgenceOnboardingGuide({ slug, totalBiens }: AgenceOnboardingGuideProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if the agency has 0 properties and hasn't dismissed the guide
    if (totalBiens === 0) {
      try {
        const dismissed = localStorage.getItem(`npl_dismiss_immo_guide_${slug}`)
        if (!dismissed) {
          setVisible(true)
        }
      } catch {
        setVisible(true)
      }
    }
  }, [totalBiens, slug])

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(`npl_dismiss_immo_guide_${slug}`, 'true')
    } catch {
      // ignore localStorage errors
    }
  }

  const steps = [
    {
      num: 1,
      title: 'Enregistrez votre 1er bien',
      desc: 'Appartement, villa, local commercial ou terrain. Définissez loyer, pièces et photos.',
      href: `/agence/${slug}/biens/nouveau`,
      icon: Plus,
      cta: 'Créer un bien',
      primary: true,
    },
    {
      num: 2,
      title: 'Configurez votre vitrine publique',
      desc: 'Partagez votre catalogue officiel avec QR code sur WhatsApp, Instagram et vos statuts.',
      href: `/agences/${slug}`,
      icon: Share2,
      cta: 'Voir ma vitrine',
      external: true,
      primary: false,
    },
    {
      num: 3,
      title: 'Créez vos baux & mandats',
      desc: 'Automatisez les quittances de loyer avec QR code certifié et les paiements Wave.',
      href: `/agence/${slug}/locatif`,
      icon: FileCheck2,
      cta: 'Module Locatif',
      primary: false,
    },
  ]

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid var(--border, #E8DDD2)',
        borderRadius: 12,
        padding: '20px 22px',
        marginBottom: 20,
        boxShadow: '0 2px 10px rgba(28, 43, 74, 0.04)',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FFF5EB',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              Bienvenue sur votre Espace Agence Immobilière
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 13,
                color: '#64748B',
              }}
            >
              Suivez ces 3 étapes simples pour activer votre gestion locative et publier vos mandats.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/aide?cat=immo"
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12.5,
              color: 'var(--accent, #C75B00)',
              fontWeight: 700,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              background: '#FFF5EB',
            }}
          >
            <BookOpen size={14} />
            <span>Guide Agence</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer le guide d'accueil"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {steps.map(step => {
          const Icon = step.icon
          return (
            <div
              key={step.num}
              style={{
                background: step.primary ? '#FAF8F5' : '#FFFFFF',
                border: step.primary
                  ? '1px solid var(--accent, #C75B00)'
                  : '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: step.primary ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.num}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 750,
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    color: '#64748B',
                    lineHeight: 1.45,
                  }}
                >
                  {step.desc}
                </p>
              </div>

              <Link
                href={step.href}
                target={step.external ? '_blank' : undefined}
                rel={step.external ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: step.primary ? 'var(--accent, #C75B00)' : '#FFFFFF',
                  color: step.primary ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  border: step.primary ? 'none' : '1px solid var(--border, #E8DDD2)',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{step.cta}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
