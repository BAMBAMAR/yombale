import React, { useState } from 'react'
import { ShieldCheck, HelpCircle } from 'lucide-react'
import { QUIZ_QUESTIONS } from './matriceData'

export default function ForceDeVenteTabFormation() {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)

  const handleQuizSelect = (qId: number, optIdx: number) => {
    const updated = { ...quizAnswers, [qId]: optIdx }
    setQuizAnswers(updated)
    if (Object.keys(updated).length === QUIZ_QUESTIONS.length) {
      let score = 0
      QUIZ_QUESTIONS.forEach(q => {
        if (updated[q.id] === q.correct) score++
      })
      setQuizScore(score)
    }
  }

  const reglesOr = [
    { num: '1', title: 'Tenue & Posture Pro', desc: 'Portez votre badge accrédité Nopalou visible. Souriez et adaptez votre langue (Wolof / Français).' },
    { num: '2', title: 'Respect du Commerçant', desc: 'Si un client entre dans la boutique, taisez-vous immédiatement et laissez le commerçant vendre.' },
    { num: '3', title: 'Zéro Jargon Technique', desc: 'Ne parlez pas de "SaaS", "cloud" ou "API". Parlez de "Caisse sur téléphone", "Dettes WhatsApp" et "0 commission".' },
    { num: '4', title: "Démonstration par l'Action", desc: "Ne décrivez pas l'application : montrez-la en direct en scannant un vrai produit sous ses yeux." },
    { num: '5', title: 'Écoute Active (80/20)', desc: 'Laissez le commerçant parler 80% du temps de ses difficultés quotidiennes de caisse et de dettes.' },
    { num: '6', title: 'Mise en avant du 1er Mois Offert', desc: 'Désarmez la peur de payer en rappelant que le 1er mois est 100% gratuit sans engagement.' },
    { num: '7', title: 'Onboarding Immédiat 30s', desc: "Ne laissez jamais le commerçant s'inscrire \"plus tard\". Ouvrez sa boutique par WhatsApp en 30s ou uploadez son fichier Excel/Shopify." },
    { num: '8', title: 'Création de Valeur Tangible', desc: "Envoyez 1 article avec photo et prix au bot WhatsApp pour qu'il voie immédiatement sa vitrine web active." },
    { num: '9', title: 'Preuve Sociale Locale', desc: 'Citez des boutiques voisines du même quartier déjà inscrites pour rassurer.' },
    { num: '10', title: 'Suivi et Fidélisation J+1', desc: 'Envoyez un message de félicitations le soir même pour créer une relation de confiance durable.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Les 10 Commandements */}
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldCheck size={22} color="var(--accent, #C75B00)" />
          Les 10 Règles d&apos;Or du Commercial Terrain d&apos;Élite
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {reglesOr.map(r => (
            <div
              key={r.num}
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--accent, #C75B00)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {r.num}
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 2px' }}>{r.title}</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz d'Auto-Évaluation des Commerciaux */}
      <div style={{ background: '#FFF7ED', border: '2px solid #FFEDD5', borderRadius: 16, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--accent, #C75B00)',
                margin: '0 0 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <HelpCircle size={20} />
              Quiz de Validation des Connaissances Commerciales
            </h2>
            <p style={{ fontSize: 13, color: '#9A3412', margin: 0 }}>
              Testez vos commerciaux pour vous assurer qu&apos;ils maîtrisent parfaitement les arguments clés.
            </p>
          </div>
          {quizScore !== null && (
            <div
              style={{
                background: quizScore >= 3 ? '#16A34A' : '#DC2626',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              Score : {quizScore} / {QUIZ_QUESTIONS.length} {quizScore >= 3 ? 'Validé !' : 'À réviser'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {QUIZ_QUESTIONS.map((q, idx) => {
            const selected = quizAnswers[q.id]
            const isAnswered = selected !== undefined
            return (
              <div key={q.id} style={{ background: '#fff', border: '1px solid #FED7AA', borderRadius: 12, padding: '16px 20px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 10 }}>
                  {idx + 1}. {q.q}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt, optIdx) => {
                    let btnBg = '#F8FAFC'
                    let btnBorder = '#E2E8F0'
                    let btnColor = '#1C2B4A'
                    if (isAnswered) {
                      if (optIdx === q.correct) {
                        btnBg = '#DCFCE7'
                        btnBorder = '#16A34A'
                        btnColor = '#15803D'
                      } else if (selected === optIdx) {
                        btnBg = '#FEE2E2'
                        btnBorder = '#DC2626'
                        btnColor = '#991B1B'
                      }
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleQuizSelect(q.id, optIdx)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${btnBorder}`,
                          background: btnBg,
                          color: btnColor,
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {isAnswered && (
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 8, marginBottom: 0, fontStyle: 'italic' }}>
                    {q.explication}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
