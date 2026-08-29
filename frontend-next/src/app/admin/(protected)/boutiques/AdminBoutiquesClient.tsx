'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  modererBoutique,
  activerSponsoringBoutique,
  supprimerBoutique,
  batchModererBoutiques,
  batchSupprimerBoutiques,
  relancerCatalogueBoutique,
  batchRelancerCatalogueBoutiques,
  updateRelanceCatalogueConfig,
} from '@/app/actions/admin'
import { activerPlanTest } from '../abonnements/actions'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'
import ExternalImg from '@/components/ExternalImg'

export interface Boutique {
  id: string
  nom: string
  slug?: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp?: string | null
  adresse: string | null
  ville: string | null
  logo_url: string | null
  actif: boolean
  sponsorise: boolean
  sponsor_jusqu_au: string | null
  plan_actif: 'pro' | 'business' | null
  plan_fin: string | null
  created_at: string
  derniere_relance_catalogue_at?: string | null
  nb_relances_catalogue?: number
  nb_produits?: number
  proprietaire_nom: string | null
  proprietaire_prenom?: string | null
  proprietaire_email: string | null
  proprietaire_telephone?: string | null
}

interface RelanceConfig {
  actif: boolean
  seuil: number
  delai_heures: number
  intervalle_jours: number
  titre: string
  template: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isSponsorActif(b: Boutique) {
  if (!b.sponsorise) return false
  if (!b.sponsor_jusqu_au) return true
  return new Date(b.sponsor_jusqu_au) > new Date()
}

/**
 * Génère le message WhatsApp personnalisé pour le lien wa.me ou aperçu
 */
function genererMessageGuide(b: Boutique, template?: string) {
  const prenom = b.proprietaire_prenom
    || (b.proprietaire_nom ? b.proprietaire_nom.trim().split(' ')[0] : 'Cher Marchand')
  const nom = b.proprietaire_nom || 'Marchand'
  const boutiqueNom = b.nom || 'Votre boutique'
  const nbProduits = b.nb_produits ?? 0
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutique?tab=produits&id=${b.id}`
  const lienCaisse = `${siteUrl}/boutique/caisse?manage=${b.id}`
  const lienAccueil = `${siteUrl}/boutiques/${b.slug || b.id}`

  const tpl = template || `👋 Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! 🎉\n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les moyens les plus simples d'alimenter votre boutique :\n\n1️⃣ 💬 *Directement par Message WhatsApp* :\nEnvoyez simplement le nom et le prix d'un article à ce numéro (ex: *« Robe Soie 15000 »*) avec une photo : il est publié immédiatement sur votre vitrine !\n\n2️⃣ 📦 *L'Import Intelligent Multi-Plateformes (Shopify, WooCommerce, Excel)* :\nImportez tout votre catalogue existant en 1 seul clic sans aucune ressaisie.\n\n3️⃣ 🛍️ *Depuis votre Espace Marchand Épuré* :\nRendez-vous sur : {lien_boutique}\nAjoutez vos articles en 5 secondes grâce au formulaire Express.\n\n4️⃣ ⚡ *La Caisse POS Magasin Tactile* :\nEnregistrez vos ventes et tenez votre carnet de dettes client : {lien_caisse}\n\n5️⃣ 📊 *Votre Bilan du Jour instantané* :\nTapez simplement *« Bilan »* sur WhatsApp pour connaître votre chiffre d'affaires et vos encaissements du jour.\n\nBesoin d'aide ou d'un accompagnement personnalisé ? Répondez directement à ce message, l'équipe Nopalou est là pour vous ! 🤝`

  return tpl
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, nom)
    .replace(/\{boutique_nom\}/gi, boutiqueNom)
    .replace(/\{nb_produits\}/gi, String(nbProduits))
    .replace(/\{lien_boutique\}/gi, lienBoutique)
    .replace(/\{lien_caisse\}/gi, lienCaisse)
    .replace(/\{lien_accueil\}/gi, lienAccueil)
}

/**
 * Modale de Paramétrage de l'Automatisation par Cron
 */
function ModalConfigAutomatisation({
  config,
  stats,
  onClose,
  onSaved,
}: {
  config: RelanceConfig
  stats?: Record<string, number>
  onClose: () => void
  onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [actif, setActif] = useState<boolean>(config?.actif ?? false)
  const [seuil, setSeuil] = useState<number>(config?.seuil ?? 1)
  const [delaiHeures, setDelaiHeures] = useState<number>(config?.delai_heures ?? 24)
  const [intervalleJours, setIntervalleJours] = useState<number>(config?.intervalle_jours ?? 7)
  const [titre, setTitre] = useState<string>(config?.titre || '🛍️ Nopalou — Ajoutez vos produits')
  const [template, setTemplate] = useState<string>(
    config?.template ||
      `👋 Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! 🎉\n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les 5 façons rapides d'ajouter vos articles :\n\n1️⃣ 🪄 *L'Import Magique par Photo (IA)* :\nPrenez en photo vos articles ou une facture/catalogue et envoyez-les directement ici sur WhatsApp ou dans votre espace. L'IA crée la fiche produit (titre, description, prix) en 3 secondes !\n\n2️⃣ 🛍️ *Depuis votre Espace Marchand* :\nRendez-vous sur : {lien_boutique}\nCliquez sur « Ajouter un produit » pour renseigner photos, prix et stock.\n\n3️⃣ ⚡ *La Saisie Express (Caisse POS)* :\nEnregistrez vos articles en 1 clic lors de vos ventes au comptoir : {lien_caisse}\n\n4️⃣ 📊 *L'Import Excel / CSV* :\nImportez tout votre catalogue d'un coup si vous avez déjà un fichier.\n\n5️⃣ 🤖 *Discussion avec l'Assistant WhatsApp* :\nÉcrivez simplement les noms et prix de vos articles à ce numéro, l'assistant les enregistre directement.\n\nBesoin d'aide ou d'un conseil ? Répondez directement à ce message, l'équipe Nopalou vous accompagne ! 🤝`
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
        setMsg({ type: 'ok', text: '✅ Configuration de relance enregistrée avec succès !' })
        setTimeout(() => {
          onSaved()
          onClose()
        }, 1200)
      }
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', overflow: 'hidden',
        border: '1px solid #e2e8f0', fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: '#0f172a', color: '#fff', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🤖</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                Automatisation &amp; Cron de Relance Marchands
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
                Relance automatique quotidienne des marchands sans catalogue (Onboarding)
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 24, maxHeight: '82vh', overflowY: 'auto' }}>
          {msg && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
              background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
              color: msg.type === 'ok' ? '#166534' : '#991b1b'
            }}>
              {msg.text}
            </div>
          )}

          {/* Stats rapides */}
          {stats && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10,
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 20
            }}>
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
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: actif ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${actif ? '#86efac' : '#cbd5e1'}`,
            borderRadius: 14, padding: '16px 20px', marginBottom: 20
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: actif ? '#166534' : '#334155' }}>
                {actif ? '🟢 Automatisation Activée' : '⚪ Automatisation Désactivée'}
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
                color: '#fff', border: 'none', borderRadius: 24, padding: '8px 18px',
                fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }}
            >
              {actif ? 'Désactiver' : 'Activer'}
            </button>
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
                <option value={0}>🔴 0 produit uniquement</option>
                <option value={1}>🟠 ≤ 1 produit (Recommandé)</option>
                <option value={2}>🟡 ≤ 2 produits</option>
                <option value={3}>🔵 ≤ 3 produits</option>
                <option value={5}>⚪ ≤ 5 produits</option>
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
                Variables : <code>{'{prenom}'}</code>, <code>{'{boutique_nom}'}</code>, <code>{'{nb_produits}'}</code>, <code>{'{lien_boutique}'}</code>, <code>{'{lien_caisse}'}</code>
              </span>
            </div>
            <textarea
              rows={9}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 12, lineHeight: 1.5, fontFamily: 'monospace', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: '#1e3a5f', color: '#fff', fontWeight: 800, cursor: 'pointer',
                opacity: pending ? 0.7 : 1
              }}
            >
              {pending ? 'Enregistrement…' : '💾 Sauvegarder la Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Modale d'Envoi de Relance Catalogue (Unitaire ou Groupé)
 */
function ModalRelanceCatalogue({
  boutiques,
  defaultTemplate,
  onClose,
  onFinished,
}: {
  boutiques: Boutique[]
  defaultTemplate?: string
  onClose: () => void
  onFinished: () => void
}) {
  const [pending, startTransition] = useTransition()
  const isMultiple = boutiques.length > 1
  const firstBoutique = boutiques[0]

  const [message, setMessage] = useState<string>(() =>
    genererMessageGuide(firstBoutique, defaultTemplate)
  )
  const [titre, setTitre] = useState<string>(`🛍️ ${firstBoutique.nom} — Ajoutez vos produits`)
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Modèles prédéfinis
  const TEMPLATES = [
    {
      label: '🪄 Guide 5 Méthodes (IA, POS, Formulaire, CSV, Chatbot)',
      tpl: `👋 Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! 🎉\n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les 5 façons rapides d'ajouter vos articles :\n\n1️⃣ 🪄 *L'Import Magique par Photo (IA)* :\nPrenez en photo vos articles ou une facture/catalogue et envoyez-les directement ici sur WhatsApp ou dans votre espace. L'IA crée la fiche produit (titre, description, prix) en 3 secondes !\n\n2️⃣ 🛍️ *Depuis votre Espace Marchand* :\nRendez-vous sur : {lien_boutique}\nCliquez sur « Ajouter un produit » pour renseigner photos, prix et stock.\n\n3️⃣ ⚡ *La Saisie Express (Caisse POS)* :\nEnregistrez vos articles en 1 clic lors de vos ventes au comptoir : {lien_caisse}\n\n4️⃣ 📊 *L'Import Excel / CSV* :\nImportez tout votre catalogue d'un coup si vous avez déjà un fichier.\n\n5️⃣ 🤖 *Discussion avec l'Assistant WhatsApp* :\nÉcrivez simplement les noms et prix de vos articles à ce numéro, l'assistant les enregistre directement.\n\nBesoin d'aide ou d'un conseil ? Répondez directement à ce message, l'équipe Nopalou vous accompagne ! 🤝`
    },
    {
      label: '🤝 Offre d\'Accompagnement & Aide Personnalisée',
      tpl: `👋 Bonjour {prenom} !\n\nNous avons remarqué que votre boutique *{boutique_nom}* n'a pas encore de produits en ligne. \n\n🚀 Nous pouvons vous aider gratuitement à intégrer vos articles ! Si vous avez une liste de prix, des photos ou un catalogue, envoyez-les nous simplement en répondant à ce message.\n\nOu ajoutez-les directement depuis votre espace : {lien_boutique}\n\nÀ très vite sur Nopalou ! 🇸🇳`
    },
    {
      label: '⚡ Rappel Court : Lancez votre 1ère Vente',
      tpl: `👋 Bonjour {prenom} !\n\nVotre boutique *{boutique_nom}* est prête à vendre ! 🛍️\n\nIl ne vous reste plus qu'à ajouter vos premiers articles pour commencer à encaisser par Wave et Orange Money.\n\n👉 Ajoutez vos produits ici : {lien_boutique}\n\nUne question ? Répondez-nous directement ! 💬`
    }
  ]

  function handleSelectTemplate(tplStr: string) {
    setMessage(genererMessageGuide(firstBoutique, tplStr))
  }

  function handleSendServer() {
    setStatusMsg(null)
    startTransition(async () => {
      if (isMultiple) {
        const ids = boutiques.map(b => b.id)
        const res = await batchRelancerCatalogueBoutiques(ids, message, titre)
        if (res.error) {
          setStatusMsg({ type: 'err', text: res.error })
        } else {
          setStatusMsg({
            type: 'ok',
            text: `✅ ${res.successCount} relance(s) envoyée(s) avec succès ! ${res.errorCount ? `(${res.errorCount} erreurs)` : ''}`
          })
          setTimeout(() => {
            onFinished()
            onClose()
          }, 1500)
        }
      } else {
        const res = await relancerCatalogueBoutique(firstBoutique.id, message, titre)
        if (res.error) {
          setStatusMsg({ type: 'err', text: res.error })
        } else {
          setStatusMsg({ type: 'ok', text: `✅ Relance envoyée avec succès au marchand ${firstBoutique.nom} !` })
          setTimeout(() => {
            onFinished()
            onClose()
          }, 1500)
        }
      }
    })
  }

  const destinationTel = firstBoutique.whatsapp || firstBoutique.telephone || firstBoutique.proprietaire_telephone || ''
  const cleanPhone = destinationTel.replace(/\D/g, '')
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`}?text=${encodeURIComponent(message)}` : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', overflow: 'hidden',
        border: '1px solid #e2e8f0', fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: '#C75B00', color: '#fff', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>💬</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {isMultiple ? `Relancer ${boutiques.length} Marchands` : `Relancer ${firstBoutique.nom}`}
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>
                {isMultiple
                  ? `${boutiques.length} boutiques sélectionnées pour l'onboarding catalogue`
                  : `Destinataire : ${firstBoutique.proprietaire_nom || 'Marchand'} (${destinationTel || 'sans tél'})`
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {statusMsg && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
              background: statusMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
              color: statusMsg.type === 'ok' ? '#166534' : '#991b1b'
            }}>
              {statusMsg.text}
            </div>
          )}

          {/* Choix du modèle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Choisir un modèle pré-rédigé :
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TEMPLATES.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTemplate(t.tpl)}
                  style={{
                    textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: '#f8fafc', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#1e293b'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message à envoyer */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Aperçu &amp; Personnalisation du message :
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 12, lineHeight: 1.5, fontFamily: 'monospace', resize: 'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Annuler
            </button>

            {!isMultiple && waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '10px 18px', borderRadius: 8, background: '#25D366', color: '#fff',
                  textDecoration: 'none', fontWeight: 800, fontSize: 13, display: 'inline-flex',
                  alignItems: 'center', gap: 6
                }}
              >
                📱 Ouvrir WhatsApp Web
              </a>
            )}

            <button
              type="button"
              onClick={handleSendServer}
              disabled={pending}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: '#C75B00', color: '#fff', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', opacity: pending ? 0.7 : 1, display: 'inline-flex',
                alignItems: 'center', gap: 6
              }}
            >
              {pending ? 'Envoi en cours…' : `🚀 Envoyer via API Serveur ${isMultiple ? `(${boutiques.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalGestionMarchand({ boutique, onClose, onRefresh }: { boutique: Boutique; onClose: () => void; onRefresh: () => void }) {
  const [pending, startTransition] = useTransition()
  const [planSelect, setPlanSelect] = useState<'pro' | 'business'>(boutique.plan_actif || 'pro')
  const [joursSelect, setJoursSelect] = useState<number>(30)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const sponsorActif = isSponsorActif(boutique)

  async function handleActiverPlan() {
    if (!boutique.proprietaire_email) {
      setMsg({ type: 'err', text: 'Email propriétaire manquant' })
      return
    }
    setMsg(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('email', boutique.proprietaire_email!)
      fd.append('plan', planSelect)
      fd.append('jours', String(joursSelect))

      const res = await activerPlanTest({}, fd)
      if (res.error) {
        setMsg({ type: 'err', text: res.error })
      } else {
        setMsg({ type: 'ok', text: res.info || 'Plan activé avec succès !' })
        setTimeout(() => {
          onRefresh()
          onClose()
        }, 1200)
      }
    })
  }

  function handleToggleSponsor() {
    startTransition(async () => {
      await activerSponsoringBoutique(boutique.id, !sponsorActif)
      onRefresh()
      onClose()
    })
  }

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onRefresh()
      onClose()
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        border: '1px solid #e2e8f0', fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header Modal */}
        <div style={{
          background: boutique.plan_actif === 'business' ? '#1e3a5f' : boutique.plan_actif === 'pro' ? '#C75B00' : '#0f172a',
          color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏪</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{boutique.nom}</h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
                👤 {boutique.proprietaire_nom || 'Propriétaire'} ({boutique.proprietaire_email || 'sans email'})
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {msg && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
              background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
              color: msg.type === 'ok' ? '#166534' : '#991b1b'
            }}>
              {msg.text}
            </div>
          )}

          {/* Section Plan & Attribution */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              ⭐ Activation / Changement d&apos;Abonnement
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Formule :</label>
                <select
                  value={planSelect}
                  onChange={e => setPlanSelect(e.target.value as 'pro' | 'business')}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="pro">🟠 Pro (5 000 FCFA/mois)</option>
                  <option value="business">🔵 Business (10 000 FCFA/mois)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Durée engagée :</label>
                <select
                  value={joursSelect}
                  onChange={e => setJoursSelect(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
                >
                  <option value={30}>1 Mois (30j)</option>
                  <option value={90}>3 Mois (90j — 10% reduc)</option>
                  <option value={180}>6 Mois (180j — 15% reduc)</option>
                  <option value={365}>1 An (365j — 25% reduc)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleActiverPlan}
              disabled={pending}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: planSelect === 'business' ? '#1e3a5f' : '#C75B00', color: '#fff',
                border: 'none', cursor: 'pointer', opacity: pending ? 0.7 : 1
              }}
            >
              {pending ? 'Activation en cours…' : `Accorder l'Abonnement ${planSelect.toUpperCase()}`}
            </button>
          </div>

          {/* Section Modération Rapide */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={handleToggleSponsor}
              disabled={pending}
              style={{
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none',
                background: sponsorActif ? '#fee2e2' : '#fef3c7',
                color: sponsorActif ? '#991b1b' : '#92400e', cursor: 'pointer'
              }}
            >
              {sponsorActif ? '❌ Enlever Sponsoring' : '⭐ Mettre en Sponsoring'}
            </button>

            <button
              onClick={handleToggleActif}
              disabled={pending}
              style={{
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none',
                background: boutique.actif ? '#fee2e2' : '#dcfce7',
                color: boutique.actif ? '#991b1b' : '#166534', cursor: 'pointer'
              }}
            >
              {boutique.actif ? '🔴 Désactiver Boutique' : '🟢 Réactiver Boutique'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BoutiqueRow({
  boutique,
  isSelected,
  onToggleSelect,
  onAction,
  onOpenGestion,
  onOpenRelance,
}: {
  boutique: Boutique
  isSelected: boolean
  onToggleSelect: () => void
  onAction: () => void
  onOpenGestion: (b: Boutique) => void
  onOpenRelance: (b: Boutique) => void
}) {
  const [pending, startTransition] = useTransition()
  const sponsorActif = isSponsorActif(boutique)
  const nbProduits = boutique.nb_produits ?? 0

  function handleToggleActif() {
    startTransition(async () => {
      await modererBoutique(boutique.id, !boutique.actif)
      onAction()
    })
  }

  function handleSupprimer() {
    if (!window.confirm(`Supprimer définitivement la boutique "${boutique.nom}" ?`)) return
    startTransition(async () => {
      await supprimerBoutique(boutique.id)
      onAction()
    })
  }

  const tel = boutique.whatsapp || boutique.telephone || boutique.proprietaire_telephone || ''
  const cleanPhone = tel.replace(/\D/g, '')
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`}?text=${encodeURIComponent(genererMessageGuide(boutique))}` : null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      background: '#fff', border: '1px solid var(--border)',
      borderLeft: boutique.plan_actif === 'business' ? '4px solid #1e3a5f'
                : boutique.plan_actif === 'pro'      ? '4px solid #C75B00'
                : sponsorActif                        ? '4px solid #D97706'
                : '4px solid var(--border)',
      borderRadius: 10, padding: '12px 16px',
      opacity: pending ? 0.5 : 1,
      transition: 'opacity .2s',
    }}>
      {/* Checkbox */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      {/* Logo */}
      <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {boutique.logo_url
          ? <ExternalImg src={boutique.logo_url} alt={boutique.nom} style={{ width: 52, height: 52, objectFit: 'cover' }} fallback={<span style={{ fontSize: 22 }}>🏪</span>} />
          : <span style={{ fontSize: 22 }}>🏪</span>
        }
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{boutique.nom}</span>
          {boutique.plan_actif === 'business' && (
            <span style={{ fontSize: 10, background: '#1e3a5f', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>💼 BUSINESS</span>
          )}
          {boutique.plan_actif === 'pro' && (
            <span style={{ fontSize: 10, background: '#C75B00', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>⭐ PRO</span>
          )}
          {sponsorActif && (
            <span style={{ fontSize: 10, background: '#D97706', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>SPONSOR</span>
          )}

          {/* Badge Nombre de Produits */}
          <span style={{
            fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
            background: nbProduits === 0 ? '#fee2e2' : nbProduits === 1 ? '#ffedd5' : nbProduits <= 3 ? '#fef9c3' : '#dcfce7',
            color: nbProduits === 0 ? '#991b1b' : nbProduits === 1 ? '#9a3412' : nbProduits <= 3 ? '#854d0e' : '#166534',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            {nbProduits === 0 ? '🔴 0 produit (vide)' : nbProduits === 1 ? '🟠 1 produit' : nbProduits <= 3 ? `🟡 ${nbProduits} produits` : `🟢 ${nbProduits} produits`}
          </span>

          {boutique.nb_relances_catalogue && boutique.nb_relances_catalogue > 0 ? (
            <span
              title={boutique.derniere_relance_catalogue_at ? `Dernière relance le ${formatDate(boutique.derniere_relance_catalogue_at)}` : ''}
              style={{ fontSize: 10, background: '#ede9fe', color: '#5b21b6', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}
            >
              💬 {boutique.nb_relances_catalogue} relance{boutique.nb_relances_catalogue > 1 ? 's' : ''}
            </span>
          ) : null}

          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{boutique.categorie ?? ''}</span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 1 }}>
          👤 {boutique.proprietaire_nom || '—'} · {boutique.proprietaire_email || '—'}
          {boutique.telephone ? ` · 📞 ${boutique.telephone}` : ''}
          {boutique.whatsapp && boutique.whatsapp !== boutique.telephone ? ` · 💬 ${boutique.whatsapp}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          📍 {[boutique.adresse, boutique.ville].filter(Boolean).join(', ') || 'Dakar'}
          {' · '}Créée le {formatDate(boutique.created_at)}
          {boutique.plan_actif && boutique.plan_fin && (
            <span style={{ color: boutique.plan_actif === 'business' ? '#1e3a5f' : '#C75B00', fontWeight: 600 }}>
              {' · '}Plan jusqu&apos;au {formatDate(boutique.plan_fin)}
            </span>
          )}
          {sponsorActif && boutique.sponsor_jusqu_au && (
            <span style={{ color: '#D97706', fontWeight: 600 }}>
              {' · '}Sponsor jusqu&apos;au {formatDate(boutique.sponsor_jusqu_au)}
            </span>
          )}
        </div>
      </div>

      {/* Statut */}
      <div style={{ flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          background: boutique.actif ? '#dcfce7' : '#f1f5f9',
          color: boutique.actif ? '#16a34a' : '#94a3b8',
        }}>
          {boutique.actif ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onOpenRelance(boutique)}
            style={{
              flex: 1, background: '#C75B00', color: '#fff', border: 'none',
              borderRadius: 6, fontSize: 11, padding: '6px 8px', fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4
            }}
            title="Envoyer le guide d'ajout de produits au marchand"
          >
            💬 Relancer
          </button>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366', color: '#fff', borderRadius: 6, padding: '6px 8px',
                fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Ouvrir directement dans WhatsApp Web avec message pré-rempli"
            >
              📱
            </a>
          )}
        </div>

        <button
          onClick={() => onOpenGestion(boutique)}
          style={{
            background: '#1e3a5f', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 11, padding: '6px 10px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          ⚙️ Gérer le marchand
        </button>

        <a
          href={`/admin/migration`}
          style={{
            background: '#0284c7', color: '#fff', border: 'none', textDecoration: 'none',
            borderRadius: 6, fontSize: 11, padding: '6px 10px', fontWeight: 700, textAlign: 'center',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4
          }}
        >
          🚀 Migrer Catalogue
        </a>

        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href={`/boutiques/${boutique.slug || boutique.id}`}
            target="_blank" rel="noreferrer"
            className="admin-btn"
            style={{ fontSize: 11, flex: 1, textAlign: 'center', textDecoration: 'none', background: '#f8fafc', color: 'var(--navy)', border: '1px solid var(--border)' }}
          >
            Voir ↗
          </a>
          <button
            onClick={handleToggleActif}
            disabled={pending}
            className={`admin-btn ${boutique.actif ? 'admin-btn--rejeter' : 'admin-btn--approuver'}`}
            style={{ fontSize: 11, flex: 1 }}
          >
            {pending ? '…' : boutique.actif ? 'Désact.' : 'Réact.'}
          </button>
          <button
            onClick={handleSupprimer}
            disabled={pending}
            className="admin-btn admin-btn--rejeter"
            style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminBoutiquesClient({
  boutiques,
  initialRelanceConfig,
  initialRelanceStats,
}: {
  boutiques: Boutique[]
  initialRelanceConfig?: RelanceConfig
  initialRelanceStats?: Record<string, number>
}) {
  const [, startTransition] = useTransition()
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null)
  const [relanceModalBoutiques, setRelanceModalBoutiques] = useState<Boutique[] | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  // Configuration relance
  const [relanceConfig] = useState<RelanceConfig>(
    initialRelanceConfig || {
      actif: false,
      seuil: 1,
      delai_heures: 24,
      intervalle_jours: 7,
      titre: '🛍️ Nopalou — Ajoutez vos produits',
      template: '',
    }
  )

  // Filtres et recherche
  const [q, setQ] = useState('')
  const [activeTab, setActiveTab] = useState<'toutes' | 'abonnees' | 'sponsorisees' | 'inactives'>('toutes')
  const [seuilProduits, setSeuilProduits] = useState<'tous' | '0' | '1' | '2' | '3' | '5'>('tous')

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  // Filtrage combiné réactif
  const boutiquesFiltrees = useMemo(() => {
    let list = [...boutiques]

    // 1. Onglet
    if (activeTab === 'abonnees') {
      list = list.filter(b => b.plan_actif)
    } else if (activeTab === 'sponsorisees') {
      list = list.filter(b => isSponsorActif(b))
    } else if (activeTab === 'inactives') {
      list = list.filter(b => !b.actif)
    }

    // 2. Seuil de produits
    if (seuilProduits === '0') {
      list = list.filter(b => (b.nb_produits ?? 0) === 0)
    } else if (seuilProduits === '1') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 1)
    } else if (seuilProduits === '2') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 2)
    } else if (seuilProduits === '3') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 3)
    } else if (seuilProduits === '5') {
      list = list.filter(b => (b.nb_produits ?? 0) <= 5)
    }

    // 3. Recherche textuelle
    if (q.trim()) {
      const term = q.trim().toLowerCase()
      list = list.filter(b => {
        return (
          b.nom?.toLowerCase().includes(term) ||
          b.description?.toLowerCase().includes(term) ||
          b.categorie?.toLowerCase().includes(term) ||
          b.proprietaire_nom?.toLowerCase().includes(term) ||
          b.proprietaire_email?.toLowerCase().includes(term) ||
          b.telephone?.includes(term) ||
          b.whatsapp?.includes(term) ||
          b.ville?.toLowerCase().includes(term) ||
          b.adresse?.toLowerCase().includes(term) ||
          b.id.toLowerCase().includes(term)
        )
      })
    }

    return list
  }, [boutiques, activeTab, seuilProduits, q])

  // Compteurs
  const counts = useMemo(() => ({
    toutes: boutiques.length,
    abonnees: boutiques.filter(b => b.plan_actif).length,
    sponsorisees: boutiques.filter(b => isSponsorActif(b)).length,
    inactives: boutiques.filter(b => !b.actif).length,
    zeroProduit: boutiques.filter(b => (b.nb_produits ?? 0) === 0).length,
    max1Produit: boutiques.filter(b => (b.nb_produits ?? 0) <= 1).length,
  }), [boutiques])

  const allIds = boutiquesFiltrees.map(b => b.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBatchActiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererBoutiques(selectedIds, true)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchDesactiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererBoutiques(selectedIds, false)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchSupprimerBoutiques(selectedIds)
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchRelancer = () => {
    const targets = boutiques.filter(b => selectedIds.includes(b.id))
    if (targets.length > 0) {
      setRelanceModalBoutiques(targets)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'relancer',
      label: '💬 Relancer Catalogue (Guide WhatsApp)',
      icon: '💬',
      color: 'amber',
      onClick: handleBatchRelancer,
    },
    {
      key: 'activer',
      label: 'Activer les boutiques',
      icon: '🟢',
      color: 'green',
      onClick: handleBatchActiver,
    },
    {
      key: 'desactiver',
      label: 'Désactiver les boutiques',
      icon: '🔴',
      color: 'amber',
      onClick: handleBatchDesactiver,
    },
    {
      key: 'supprimer',
      label: 'Supprimer définitivement',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ces boutiques ?',
      onClick: handleBatchSupprimer,
    },
  ]

  const abonnees     = boutiquesFiltrees.filter(b => b.plan_actif)
  const sponsorisees = boutiquesFiltrees.filter(b => !b.plan_actif && isSponsorActif(b))
  const autres       = boutiquesFiltrees.filter(b => !b.plan_actif && !isSponsorActif(b))

  return (
    <div className="admin-annonces-sections" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barre d'outils supérieure avec configuration d'automatisation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 18px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
            🎯 Onboarding Catalogue :
          </span>
          <span style={{
            fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
            background: counts.zeroProduit > 0 ? '#fee2e2' : '#f1f5f9',
            color: counts.zeroProduit > 0 ? '#991b1b' : '#64748b'
          }}>
            🔴 {counts.zeroProduit} boutique(s) à 0 produit
          </span>
          <span style={{
            fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
            background: '#ffedd5', color: '#9a3412'
          }}>
            🟠 {counts.max1Produit} boutique(s) ≤ 1 produit
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowConfigModal(true)}
          style={{
            background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(30,58,95,0.2)'
          }}
        >
          <span>⚙️ Automatisation Relances (Cron)</span>
          <span style={{
            background: relanceConfig.actif ? '#22c55e' : '#64748b',
            color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 800
          }}>
            {relanceConfig.actif ? 'ACTIF' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Barre de recherche et Filtre de Seuil Catalogue */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher une boutique par nom, propriétaire, e-mail, téléphone, ville, catégorie..."
            style={{
              width: '100%', padding: '10px 40px 10px 42px', borderRadius: 10, border: '1px solid #cbd5e1',
              fontSize: 14, outline: 'none', fontFamily: 'system-ui, sans-serif'
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sélecteur de Seuil Catalogue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
            Catalogue :
          </label>
          <select
            value={seuilProduits}
            onChange={e => setSeuilProduits(e.target.value as any)}
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1',
              fontSize: 13, fontWeight: 700, background: '#fff', color: '#1e293b', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="tous">📋 Tous les volumes</option>
            <option value="0">🔴 0 produit (Boutique vide)</option>
            <option value="1">🟠 ≤ 1 produit</option>
            <option value="2">🟡 ≤ 2 produits</option>
            <option value="3">🔵 ≤ 3 produits</option>
            <option value="5">⚪ ≤ 5 produits</option>
          </select>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: 4 }}>
        {[
          { key: 'toutes', label: '📋 Toutes', count: counts.toutes, color: '#1e3a5f' },
          { key: 'abonnees', label: '⭐ Abonnées Pro/Business', count: counts.abonnees, color: '#C75B00' },
          { key: 'sponsorisees', label: '⚡ Sponsorisées', count: counts.sponsorisees, color: '#D97706' },
          { key: 'inactives', label: '⏸ Inactives', count: counts.inactives, color: '#dc2626' },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '9px 16px', borderRadius: '10px 10px 0 0', border: 'none', fontSize: 13,
              fontWeight: 700, cursor: 'pointer',
              background: activeTab === t.key ? t.color : '#f8fafc',
              color: activeTab === t.key ? '#fff' : '#475569',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {t.label}
            <span style={{
              background: activeTab === t.key ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
              padding: '2px 7px', borderRadius: 10, fontSize: 11
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={boutiquesFiltrees.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="boutique(s)"
      />

      {abonnees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 24 }}>
          <h2 className="admin-section-titre" style={{ color: '#C75B00' }}>
            ⭐ Abonnés Pro / Business
            <span className="admin-section-count">{abonnees.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {abonnees.map(b => (
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
                onOpenRelance={bqt => setRelanceModalBoutiques([bqt])}
              />
            ))}
          </div>
        </section>
      )}

      {sponsorisees.length > 0 && (
        <section className="admin-annonces-section" style={{ marginBottom: 24 }}>
          <h2 className="admin-section-titre" style={{ color: '#D97706' }}>
            ⚡ Boutiques sponsorisées
            <span className="admin-section-count">{sponsorisees.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {sponsorisees.map(b => (
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
                onOpenRelance={bqt => setRelanceModalBoutiques([bqt])}
              />
            ))}
          </div>
        </section>
      )}

      {autres.length > 0 && (
        <section className="admin-annonces-section">
          <h2 className="admin-section-titre">
            Autres boutiques
            <span className="admin-section-count">{autres.length}</span>
          </h2>
          <div className="admin-annonces-list">
            {autres.map(b => (
              <BoutiqueRow
                key={b.id}
                boutique={b}
                isSelected={selectedIds.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onAction={refresh}
                onOpenGestion={setSelectedBoutique}
                onOpenRelance={bqt => setRelanceModalBoutiques([bqt])}
              />
            ))}
          </div>
        </section>
      )}

      {boutiquesFiltrees.length === 0 && (
        <p className="admin-empty" style={{ textAlign: 'center', padding: 32, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          Aucune boutique ne correspond à vos critères de recherche.
        </p>
      )}

      {selectedBoutique && (
        <ModalGestionMarchand
          boutique={selectedBoutique}
          onClose={() => setSelectedBoutique(null)}
          onRefresh={refresh}
        />
      )}

      {relanceModalBoutiques && (
        <ModalRelanceCatalogue
          boutiques={relanceModalBoutiques}
          defaultTemplate={relanceConfig.template}
          onClose={() => setRelanceModalBoutiques(null)}
          onFinished={refresh}
        />
      )}

      {showConfigModal && (
        <ModalConfigAutomatisation
          config={relanceConfig}
          stats={initialRelanceStats}
          onClose={() => setShowConfigModal(false)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
