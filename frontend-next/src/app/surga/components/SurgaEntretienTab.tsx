'use client'

// frontend-next/src/app/surga/components/SurgaEntretienTab.tsx
// Préparation à l'entretien d'embauche : banque de questions, simulation, analyse constructive STAR
// Passerelles vers Notes (fiche de révision), Agenda (date et rappel) et Sama Xaalis (budget transport)
// Quotas : 1 simulation gratuite/semaine, illimité en Premium (D27)
// Modularité stricte < 450 lignes, zéro émoji, tokens CSS officiels

import React, { useState, useEffect } from 'react'
import {
  HelpCircle,
  Lightbulb,
  Mic,
  MicOff,
  Sparkles,
  FileText,
  Calendar,
  Wallet,
  Crown,
  ChevronRight,
  Send,
} from 'lucide-react'
import type { ProfilProData } from './SurgaProfilProTab'
import { saveLocalNote, saveLocalEvenement, saveLocalDepense } from '@/lib/surga-offline-sync'
import { getSurgaEmploiHeaders } from '@/lib/surga-emploi-api'

interface QuestionItem {
  id: string
  categorie: string
  question: string
  conseils: string
}

interface EvaluationResult {
  nb_mots: number
  points_forts: string[]
  axes_amelioration: string[]
  suggestion: string
}

interface SurgaEntretienTabProps {
  profil: ProfilProData
  droitsSimulation: {
    estPremium: boolean
    quotaAtteint: boolean
    simulationsSemaine: number
    message: string
  }
  onOpenPremium: () => void
  onNotifierSucces?: (message: string) => void
}

export default function SurgaEntretienTab({
  profil,
  droitsSimulation,
  onOpenPremium,
  onNotifierSucces,
}: SurgaEntretienTabProps) {
  const [secteur, setSecteur] = useState<string>('general')
  const [poste, setPoste] = useState<string>(profil.titre_professionnel || '')
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [indexQuestion, setIndexQuestion] = useState<number>(0)
  const [reponse, setReponse] = useState<string>('')
  const [afficherConseils, setAfficherConseils] = useState<boolean>(false)
  const [evaluant, setEvaluant] = useState<boolean>(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [enEcoute, setEnEcoute] = useState<boolean>(false)
  const [dateEntretien, setDateEntretien] = useState<string>('')
  const [noteEnregistree, setNoteEnregistree] = useState<boolean>(false)
  const [agendaEnregistre, setAgendaEnregistre] = useState<boolean>(false)
  const [budgetEnregistre, setBudgetEnregistre] = useState<boolean>(false)

  // Chargement de la banque de questions pour le secteur choisi
  useEffect(() => {
    fetch(`/api/surga/emploi/entretien/banque?secteur=${encodeURIComponent(secteur)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.questions)) {
          setQuestions(data.questions)
          setIndexQuestion(0)
          setEvaluation(null)
          setReponse('')
        }
      })
      .catch(() => {})
  }, [secteur])

  const questionCourante = questions[indexQuestion] || null

  // Reconnaissance vocale Web Speech API
  const handleBasculerMicro = () => {
    if (enEcoute) {
      setEnEcoute(false)
      return
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('La reconnaissance vocale n est pas supportée par votre navigateur. Vous pouvez saisir votre réponse au clavier.')
      return
    }

    try {
      const recognition = new SpeechRec()
      recognition.lang = 'fr-FR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setEnEcoute(true)
      recognition.onresult = (evt: any) => {
        const texte = evt.results[0][0].transcript
        setReponse((prev) => (prev ? `${prev} ${texte}` : texte))
      }
      recognition.onerror = () => setEnEcoute(false)
      recognition.onend = () => setEnEcoute(false)

      recognition.start()
    } catch {
      setEnEcoute(false)
    }
  }

  // Évaluation de la réponse
  const handleEvaluer = async () => {
    if (!reponse.trim() || !questionCourante) return
    setEvaluant(true)
    try {
      const res = await fetch('/api/surga/emploi/entretien/evaluer', {
        method: 'POST',
        headers: getSurgaEmploiHeaders(true),
        body: JSON.stringify({
          question: questionCourante.question,
          reponse,
          poste,
          secteur,
        }),
      })
      const data = await res.json()
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation)
        // Enregistrement de session
        fetch('/api/surga/emploi/entretien/session', {
          method: 'POST',
          headers: getSurgaEmploiHeaders(true),
        }).catch(() => {})
      }
    } finally {
      setEvaluant(false)
    }
  }

  // Passerelles transversales Surga
  const handleEnregistrerEnNote = () => {
    if (!questionCourante || !reponse.trim()) return
    const titre = `Révision Entretien : ${poste || 'Poste'} (${new Date().toLocaleDateString('fr-FR')})`
    const contenu = `Question préparée :\n${questionCourante.question}\n\nMa réponse :\n${reponse}\n\nConseils :\n${evaluation?.points_forts.join('\n') || ''}`
    saveLocalNote({ titre, contenu })
    setNoteEnregistree(true)
    onNotifierSucces?.('Fiche de révision enregistrée dans vos Notes.')
    setTimeout(() => setNoteEnregistree(false), 3000)
  }

  const handlePlanifierAgenda = () => {
    const dateCible = dateEntretien || new Date().toISOString().slice(0, 10)
    saveLocalEvenement({ titre: `Entretien : ${poste || 'Poste visé'}`, date_evenement: dateCible, heure_evenement: '09:00', est_rappel: true })
    setAgendaEnregistre(true)
    onNotifierSucces?.('Entretien planifié dans votre Agenda avec rappel la veille.')
    setTimeout(() => setAgendaEnregistre(false), 3000)
  }

  const handleInscrireBudgetTransport = () => {
    saveLocalDepense({ montant_xof: 3000, categorie: 'transport', note: `Transport entretien : ${poste || 'Entreprise'}` })
    setBudgetEnregistre(true)
    onNotifierSucces?.('Budget transport (3 000 FCFA) inscrit dans Sama Xaalis.')
    setTimeout(() => setBudgetEnregistre(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Statut Quota Hebdomadaire (D27 / Section 1 bis) */}
      <div
        className="surga-card"
        style={{
          padding: 14,
          backgroundColor: droitsSimulation.estPremium ? 'rgba(10, 92, 54, 0.05)' : 'var(--bg, #F8F5F0)',
          border: droitsSimulation.estPremium ? '1.5px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {droitsSimulation.estPremium ? (
              <Crown size={18} color="var(--price, #0A5C36)" />
            ) : (
              <HelpCircle size={18} color="var(--navy, #1C2B4A)" />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {droitsSimulation.estPremium
                  ? 'Surga Premium : Simulations illimitées'
                  : droitsSimulation.quotaAtteint
                  ? 'Quota hebdomadaire atteint'
                  : '1 simulation gratuite par semaine incluse'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
                {droitsSimulation.message}
              </div>
            </div>
          </div>
          {!droitsSimulation.estPremium && (
            <button
              type="button"
              onClick={onOpenPremium}
              className="surga-btn-secondary"
              style={{ fontSize: 11, padding: '5px 10px', fontWeight: 700 }}
            >
              Passer Premium
            </button>
          )}
        </div>
      </div>

      {/* 2. Configuration du poste & Secteur */}
      <div className="surga-card" style={{ padding: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px 0' }}>
          Ciblez votre entraînement
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Secteur d’activité</label>
            <select
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 8 }}
            >
              <option value="general">Général (Tous métiers)</option>
              <option value="comptabilite_finance">Comptabilité, Finance &amp; SYSCOHADA</option>
              <option value="commercial_vente">Commerce, Vente &amp; Négociation</option>
              <option value="informatique_tech">Informatique &amp; Développement</option>
              <option value="administration_rh">Administration, RH &amp; Secrétariat</option>
              <option value="logistique_transport">Logistique &amp; Transport Dakar</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Poste visé</label>
            <input
              type="text"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="Ex: Responsable Comptable"
              className="surga-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 8 }}
            />
          </div>
        </div>
      </div>

      {/* 3. Question courante et conseils */}
      {questionCourante && (
        <div className="surga-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase' }}>
              Question {indexQuestion + 1} sur {questions.length}
            </span>
            <button
              type="button"
              onClick={() => setAfficherConseils(!afficherConseils)}
              className="surga-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px' }}
            >
              <Lightbulb size={12} color="var(--accent, #C75B00)" />
              <span>{afficherConseils ? 'Masquer conseils' : 'Voir conseils'}</span>
            </button>
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.4, marginBottom: 10 }}>
            {questionCourante.question}
          </div>

          {afficherConseils && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: 'rgba(199, 91, 0, 0.06)',
                border: '1px solid var(--accent, #C75B00)',
                fontSize: 12,
                color: 'var(--navy, #1C2B4A)',
                marginBottom: 12,
              }}
            >
              <strong>Ce que le recruteur recherche :</strong> {questionCourante.conseils}
            </div>
          )}

          {/* Saisie de la réponse au clavier ou au micro */}
          <div style={{ position: 'relative' }}>
            <textarea
              rows={5}
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Exprimez votre réponse comme si vous étiez en face du recruteur..."
              className="surga-input"
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, resize: 'vertical' }}
            />
            <button
              type="button"
              onClick={handleBasculerMicro}
              title={enEcoute ? 'Arrêter la dictée vocale' : 'Dicter ma réponse à la voix'}
              style={{
                position: 'absolute',
                right: 10,
                bottom: 12,
                background: enEcoute ? '#DC2626' : 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 20,
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {enEcoute ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{enEcoute ? 'Écoute...' : 'Dicter'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              disabled={evaluant || !reponse.trim()}
              onClick={handleEvaluer}
              className="surga-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}
            >
              <Send size={13} />
              <span>{evaluant ? 'Analyse...' : 'Analyser ma réponse'}</span>
            </button>

            {indexQuestion < questions.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setIndexQuestion((i) => i + 1)
                  setEvaluation(null)
                  setReponse('')
                }}
                className="surga-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '8px 12px' }}
              >
                <span>Question suivante</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Résultat de l'analyse constructive */}
      {evaluation && (
        <div className="surga-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Sparkles size={16} color="var(--accent, #C75B00)" />
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Retour d’entraînement ({evaluation.nb_mots} mots)
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Points forts */}
            <div style={{ backgroundColor: 'rgba(10, 92, 54, 0.05)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--price, #0A5C36)', marginBottom: 4 }}>
                Points forts observés :
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--navy, #1C2B4A)' }}>
                {evaluation.points_forts.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Points d'amélioration */}
            <div style={{ backgroundColor: 'rgba(217, 119, 6, 0.06)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', marginBottom: 4 }}>
                Conseils pour faire la différence :
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--navy, #1C2B4A)' }}>
                {evaluation.axes_amelioration.map((axe, i) => (
                  <li key={i}>{axe}</li>
                ))}
              </ul>
            </div>

            {/* Suggestion inspirante */}
            {evaluation.suggestion && (
              <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', fontStyle: 'italic', padding: '6px 8px', borderLeft: '3px solid var(--accent, #C75B00)' }}>
                Exemple inspirant : {evaluation.suggestion}
              </div>
            )}
          </div>

          {/* 5. Passerelles transversales Surga */}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border, #E8DDD2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2, #5A4E42)', marginBottom: 8 }}>
              Actions transversales de préparation :
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={handleEnregistrerEnNote}
                className="surga-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 10px', width: 'auto' }}
              >
                <FileText size={13} color="var(--navy, #1C2B4A)" />
                <span>{noteEnregistree ? 'Fiche enregistrée' : 'Fiche de révision en Note'}</span>
              </button>
              <button
                type="button"
                onClick={handlePlanifierAgenda}
                className="surga-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 10px', width: 'auto' }}
              >
                <Calendar size={13} color="var(--accent, #C75B00)" />
                <span>{agendaEnregistre ? 'Rappels planifiés' : 'Planifier date Agenda'}</span>
              </button>
              <button
                type="button"
                onClick={handleInscrireBudgetTransport}
                className="surga-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 10px', width: 'auto' }}
              >
                <Wallet size={13} color="var(--price, #0A5C36)" />
                <span>{budgetEnregistre ? 'Budget inscrit' : 'Budget transport (3 000 F)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
