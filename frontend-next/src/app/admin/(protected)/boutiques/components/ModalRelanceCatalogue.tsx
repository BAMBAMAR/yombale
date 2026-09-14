import React, { useState, useTransition } from 'react'
import { MessageSquare, Phone, Send, X, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  relancerCatalogueBoutique,
  batchRelancerCatalogueBoutiques,
} from '@/app/actions/admin'
import { Boutique, genererMessageGuide } from './types'

interface ModalRelanceCatalogueProps {
  boutiques: Boutique[]
  defaultTemplate?: string
  onClose: () => void
  onFinished: () => void
}

const TEMPLATES = [
  {
    label: 'Guide 5 Méthodes (IA, POS, Formulaire, CSV, Chatbot)',
    tpl: `Bonjour {prenom}, félicitations pour la création de votre boutique *{boutique_nom}* sur Nopalou ! \n\nActuellement, votre boutique compte {nb_produits} produit(s). Pour commencer à recevoir des commandes et attirer des clients, voici les 5 façons rapides d'ajouter vos articles :\n\n1. *L'Import Magique par Photo (IA)* :\nPrenez en photo vos articles ou une facture/catalogue et envoyez-les directement ici sur WhatsApp ou dans votre espace. L'IA crée la fiche produit (titre, description, prix) en 3 secondes !\n\n2. *Depuis votre Espace Marchand* :\nRendez-vous sur : {lien_boutique}\nCliquez sur « Ajouter un produit » pour renseigner photos, prix et stock.\n\n3. *La Saisie Express (Caisse POS)* :\nEnregistrez vos articles en 1 clic lors de vos ventes au comptoir : {lien_caisse}\n\n4. *L'Import Excel / CSV* :\nImportez tout votre catalogue d'un coup si vous avez déjà un fichier.\n\n5. *Discussion avec l'Assistant WhatsApp* :\nÉcrivez simplement les noms et prix de vos articles à ce numéro, l'assistant les enregistre directement.\n\nBesoin d'aide ou d'un conseil ? Répondez directement à ce message, l'équipe Nopalou vous accompagne !`,
  },
  {
    label: "Offre d'Accompagnement & Aide Personnalisée",
    tpl: `Bonjour {prenom} !\n\nNous avons remarqué que votre boutique *{boutique_nom}* n'a pas encore de produits en ligne. \n\nNous pouvons vous aider gratuitement à intégrer vos articles ! Si vous avez une liste de prix, des photos ou un catalogue, envoyez-les nous simplement en répondant à ce message.\n\nOu ajoutez-les directement depuis votre espace : {lien_boutique}\n\nÀ très vite sur Nopalou !`,
  },
  {
    label: 'Rappel Court : Lancez votre 1ère Vente',
    tpl: `Bonjour {prenom} !\n\nVotre boutique *{boutique_nom}* est prête à vendre ! \n\nIl ne vous reste plus qu'à ajouter vos premiers articles pour commencer à encaisser par Wave et Orange Money.\n\nAjoutez vos produits ici : {lien_boutique}\n\nUne question ? Répondez-nous directement !`,
  },
]

export default function ModalRelanceCatalogue({
  boutiques,
  defaultTemplate,
  onClose,
  onFinished,
}: ModalRelanceCatalogueProps) {
  const [pending, startTransition] = useTransition()
  const isMultiple = boutiques.length > 1
  const firstBoutique = boutiques[0]

  const [message, setMessage] = useState<string>(() => genererMessageGuide(firstBoutique, defaultTemplate))
  const [titre, setTitre] = useState<string>(`${firstBoutique.nom} — Ajoutez vos produits`)
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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
            text: `${res.successCount} relance(s) envoyée(s) avec succès ! ${res.errorCount ? `(${res.errorCount} erreurs)` : ''}`,
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
          setStatusMsg({ type: 'ok', text: `Relance envoyée avec succès au marchand ${firstBoutique.nom} !` })
          setTimeout(() => {
            onFinished()
            onClose()
          }, 1500)
        }
      }
    })
  }

  const destinationTel =
    firstBoutique.whatsapp || firstBoutique.telephone || firstBoutique.proprietaire_telephone || ''
  const cleanPhone = destinationTel.replace(/\D/g, '')
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`}?text=${encodeURIComponent(message)}`
    : null

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
          maxWidth: 640,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--accent, #C75B00)',
            color: '#fff',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MessageSquare size={26} />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {isMultiple ? `Relancer ${boutiques.length} Marchands` : `Relancer ${firstBoutique.nom}`}
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>
                {isMultiple
                  ? `${boutiques.length} boutiques sélectionnées pour l'onboarding catalogue`
                  : `Destinataire : ${firstBoutique.proprietaire_nom || 'Marchand'} (${destinationTel || 'sans tél'})`}
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

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {statusMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
                background: statusMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
                color: statusMsg.type === 'ok' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {statusMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
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
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #e2e8f0)',
                    background: '#f8fafc',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#1e293b',
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
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

            {!isMultiple && waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: '#25D366',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Phone size={14} />
                Ouvrir WhatsApp Web
              </a>
            )}

            <button
              type="button"
              onClick={handleSendServer}
              disabled={pending}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                opacity: pending ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Send size={14} />
              {pending ? 'Envoi en cours…' : `Envoyer via API Serveur ${isMultiple ? `(${boutiques.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
