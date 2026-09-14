import React, { useState, useTransition } from 'react'
import { Bot, Save, X, RefreshCw, Store, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateRelanceCatalogueConfig, executerCronRelanceCatalogueAction } from '@/app/actions/admin'
import { RelanceConfig, RelanceEligible } from './types'

interface ModalConfigAutomatisationProps {
  config: RelanceConfig
  stats?: Record<string, number>
  eligibles?: RelanceEligible[]
  onClose: () => void
  onSaved: () => void
}

export default function ModalConfigAutomatisation({
  config,
  stats,
  eligibles = [],
  onClose,
  onSaved,
}: ModalConfigAutomatisationProps) {
  const [pending, startTransition] = useTransition()
  const [testingCron, setTestingCron] = useState(false)
  const [actif, setActif] = useState<boolean>(config?.actif ?? false)
  const [seuil, setSeuil] = useState<number>(config?.seuil ?? 1)
  const [delaiHeures, setDelaiHeures] = useState<number>(config?.delai_heures ?? 24)
  const [intervalleJours, setIntervalleJours] = useState<number>(config?.intervalle_jours ?? 7)
  const [titre, setTitre] = useState<string>(config?.titre || 'Nopalou — Ajoutez vos produits')
  const [template, setTemplate] = useState<string>(
    config?.template ||
      `Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! \n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les 5 façons rapides d'ajouter vos articles :\n\n1. *L'Import Magique par Photo (IA)* :\nPrenez en photo vos articles ou une facture/catalogue et envoyez-les directement ici sur WhatsApp ou dans votre espace. L'IA crée la fiche produit (titre, description, prix) en 3 secondes !\n\n2. *Depuis votre Espace Marchand* :\nRendez-vous sur : {lien_boutique}\nCliquez sur « Ajouter un produit » pour renseigner photos, prix et stock.\n\n3. *La Saisie Express (Caisse POS)* :\nEnregistrez vos articles en 1 clic lors de vos ventes au comptoir : {lien_caisse}\n\n4. *L'Import Excel / CSV* :\nImportez tout votre catalogue d'un coup si vous avez déjà un fichier.\n\n5. *Discussion avec l'Assistant WhatsApp* :\nÉcrivez simplement les noms et prix de vos articles à ce numéro, l'assistant les enregistre directement.\n\nBesoin d'aide ou d'un conseil ? Répondez directement à ce message, l'équipe Nopalou vous accompagne !`
  )
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function handleSave() {
    setMsg(null)
    startTransition(async () => {
      const res = await updateRelanceCatalogueConfig({
        actif,
        seuil,
        delai_heures: delaiHeures,
        intervalle_jours: intervalleJours,
        titre,
        template,
      })
      if (res.error) {
        setMsg({ type: 'err', text: res.error })
      } else {
        setMsg({ type: 'ok', text: 'Configuration de relance enregistrée avec succès !' })
        setTimeout(() => {
          onSaved()
          onClose()
        }, 1200)
      }
    })
  }

  function handleTesterCron() {
    if (!window.confirm('Voulez-vous déclencher immédiatement le cycle de relance pour les boutiques éligibles ?')) return
    setMsg(null)
    setTestingCron(true)
    startTransition(async () => {
      try {
        const res = await executerCronRelanceCatalogueAction()
        if (res.error) {
          setMsg({ type: 'err', text: res.error })
        } else if (res.count === 0) {
          setMsg({ type: 'ok', text: 'Aucune boutique éligible pour le moment.' })
        } else {
          setMsg({
            type: 'ok',
            text: `Relance effectuée ! ${res.successCount ?? 0} message(s) envoyé(s)${res.errorCount ? ` (${res.errorCount} échecs)` : ''}.`,
          })
          onSaved()
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Erreur lors de l'exécution du cron"
        setMsg({ type: 'err', text: errMessage })
      } finally {
        setTestingCron(false)
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 680,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--navy, #0f172a)',
            color: '#fff',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bot size={28} color="var(--accent, #C75B00)" />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                Automatisation &amp; Cron de Relance Marchands
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
                Relance automatique quotidienne des marchands sans catalogue (Onboarding)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '82vh', overflowY: 'auto' }}>
          {msg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
                background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
                color: msg.type === 'ok' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

          {/* Stats rapides */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 10,
                background: '#f8fafc',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>{stats.count_0 ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>0 produit (Vide)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ea580c' }}>{stats.count_1 ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>1 produit</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ca8a04' }}>{stats.count_2 ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>2 produits</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{stats.count_plus_5 ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>&gt; 5 produits</div>
              </div>
            </div>
          )}

          {/* Interrupteur Actif */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: actif ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${actif ? '#86efac' : '#cbd5e1'}`,
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: actif ? '#166534' : '#334155' }}>
                {actif ? 'Automatisation Activée' : 'Automatisation Désactivée'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Le cron s&apos;exécute chaque matin à 10h00 pour relancer les boutiques ciblées.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActif(!actif)}
              style={{
                background: actif ? '#16a34a' : '#94a3b8',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {actif ? 'Désactiver' : 'Activer'}
            </button>
          </div>

          {/* Boutiques ciblées en attente */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Store size={16} />
                  <span>Boutiques ciblées actuellement : {eligibles?.length ?? 0}</span>
                </div>
                <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4 }}>
                  {eligibles && eligibles.length > 0 ? (
                    <span>
                      En attente du prochain passage :{' '}
                      <strong>{eligibles.map(b => `${b.nom} (${b.nb_produits} prod)`).join(', ')}</strong>
                    </span>
                  ) : (
                    <span>Toutes les boutiques ont déjà un catalogue ou ont été relancées récemment.</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleTesterCron}
                disabled={testingCron || pending}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: testingCron || pending ? 0.7 : 1,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)',
                }}
              >
                {testingCron && <RefreshCw size={14} className="animate-spin" />}
                <span>{testingCron ? 'Envoi en cours…' : 'Exécuter le Cron Maintenant'}</span>
              </button>
            </div>
          </div>

          {/* Paramètres de filtrage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Seuil maximum de produits :
              </label>
              <select
                value={seuil}
                onChange={e => setSeuil(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
              >
                <option value={0}>0 produit uniquement</option>
                <option value={1}>≤ 1 produit (Recommandé)</option>
                <option value={2}>≤ 2 produits</option>
                <option value={3}>≤ 3 produits</option>
                <option value={5}>≤ 5 produits</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Délai après inscription :
              </label>
              <select
                value={delaiHeures}
                onChange={e => setDelaiHeures(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
              >
                <option value={12}>12 heures</option>
                <option value={24}>24 heures (J+1)</option>
                <option value={48}>48 heures (J+2)</option>
                <option value={72}>72 heures (J+3)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Intervalle anti-harcèlement :
              </label>
              <select
                value={intervalleJours}
                onChange={e => setIntervalleJours(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
              >
                <option value={3}>3 jours minimum</option>
                <option value={7}>7 jours (1 semaine)</option>
                <option value={14}>14 jours (2 semaines)</option>
                <option value={30}>30 jours (1 mois)</option>
              </select>
            </div>
          </div>

          {/* Titre Template */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Titre du template WhatsApp (Meta) :
            </label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
            />
          </div>

          {/* Modèle de message */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                Guide / Message WhatsApp complet :
              </label>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Variables : <code>{'{prenom}'}</code>, <code>{'{boutique_nom}'}</code>, <code>{'{nb_produits}'}</code>,{' '}
                <code>{'{lien_boutique}'}</code>, <code>{'{lien_caisse}'}</code>
              </span>
            </div>
            <textarea
              rows={9}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--navy, #1e3a5f)',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: pending ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Save size={15} />
              {pending ? 'Enregistrement…' : 'Sauvegarder la Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
