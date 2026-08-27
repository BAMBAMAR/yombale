'use client'
import { useState, useEffect } from 'react'

interface Produit { id: string; nom: string; prix: number | null; images?: string[]; photo?: string }
interface Zone { id: string; nom: string; prix: number }

function fcfa(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' }

function helperLienWhatsapp(tel: string | null | undefined, message: string): string {
  if (!tel) return '#'
  const digits = tel.replace(/\D/g, '')
  const clean = digits.length === 9 ? '221' + digits : digits
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: '📍 Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: '📍 Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: '🚚 Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: '🏬 Retrait gratuit en boutique', prix: 0 },
]

export default function CommanderModal({
  boutiqueId,
  produit,
  whatsapp,
  nomBoutique,
  onClose,
  noteInitiale,
}: {
  boutiqueId: string
  produit: Produit
  whatsapp?: string | null
  nomBoutique?: string | null
  onClose: () => void
  noteInitiale?: string
}) {
  const [mode, setMode] = useState<'whatsapp' | 'formulaire'>('whatsapp')
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [adresse, setAdresse] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [note, setNote] = useState(noteInitiale ?? '')
  const [paiement, setPaiement] = useState('wave')
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [crossSell, setCrossSell] = useState<Produit[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  const [codePromo, setCodePromo] = useState('');
  const [promoApplique, setPromoApplique] = useState<{ code: string; reduction: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/zones/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setZones(data)
        else setZones(DEFAULT_ZONES)
      })
      .catch(() => setZones(DEFAULT_ZONES))

    // Chargement du pré-remplissage automatique des coordonnées (Zero-Effort Acheteur)
    try {
      const savedNom = localStorage.getItem('nopalou_client_nom')
      const savedTel = localStorage.getItem('nopalou_client_tel')
      const savedAdresse = localStorage.getItem('nopalou_client_adresse')
      if (savedNom) setNom(savedNom)
      if (savedTel) setTel(savedTel)
      if (savedAdresse) setAdresse(savedAdresse)
    } catch {}

    // Chargement des suggestions Cross-Sell
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits/${produit.id}/cross-sell`)
      .then(r => r.ok ? r.json() : { produits: [] })
      .then(data => {
        if (Array.isArray(data.produits)) setCrossSell(data.produits)
      })
      .catch(() => {})
  }, [boutiqueId, produit.id, backendUrl])

  const zoneSelectionnee = zoneId ? (zones.find(z => z.id === zoneId) || null) : null
  const fraisLivraison = zoneSelectionnee ? Number(zoneSelectionnee.prix || 0) : 0
  const sousTotalMain = produit.prix ? produit.prix * quantite : 0
  const sousTotalAddons = Object.entries(selectedAddons).reduce((acc, [pId, qte]) => {
    const item = crossSell.find(c => c.id === pId)
    return acc + (item && item.prix ? item.prix * qte : 0)
  }, 0)
  const sousTotal = sousTotalMain + sousTotalAddons
  const totalSansReduction = sousTotal + fraisLivraison
  const total = Math.max(0, totalSansReduction - (promoApplique ? promoApplique.reduction : 0))

  const messageWhatsappDirect = `Bonjour ${nomBoutique ? nomBoutique : 'vendeur'} ! Je suis intéressé(e) par l'article "${produit.nom}"${produit.prix ? ` (${fcfa(produit.prix)})` : ''} vu sur Nopalou. Est-il disponible ?`

  function toggleAddon(pId: string) {
    setSelectedAddons(prev => {
      const next = { ...prev }
      if (next[pId]) delete next[pId]
      else next[pId] = 1
      return next
    })
  }

  async function appliquerCodePromo() {
    if (!codePromo.trim()) {
      setPromoError('⚠️ Veuillez saisir un code promo')
      setPromoApplique(null)
      return
    }
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/promotions/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          code: codePromo,
          total_panier: sousTotal
        })
      })
      const data = await res.json()
      if (!res.ok || !data.valide) {
        setPromoError(data.error || 'Code promo invalide')
        setPromoApplique(null)
      } else {
        setPromoApplique({ code: data.code, reduction: data.montant_reduction })
      }
    } catch {
      setPromoError('Impossible de vérifier le code promo')
    } finally {
      setPromoLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const articlesPayload = [
      { produit_id: produit.id, nom_produit: produit.nom, quantite, prix_unitaire: produit.prix || 0 }
    ]

    Object.entries(selectedAddons).forEach(([pId, qte]) => {
      const addon = crossSell.find(c => c.id === pId)
      if (addon) {
        articlesPayload.push({
          produit_id: addon.id,
          nom_produit: addon.nom,
          quantite: qte,
          prix_unitaire: addon.prix || 0
        })
      }
    })

    try {
      if (paiement === 'carte_bancaire') {
        const stripeRes = await fetch(`${backendUrl}/api/boutiques/paiements/stripe/simuler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boutique_id: boutiqueId,
            montant: total,
            devise: 'XOF',
            card_number: cardNumber,
            exp_month: 12,
            exp_year: 2028,
            cvc: cardCvc
          })
        })
        const stripeData = await stripeRes.json()
        if (!stripeRes.ok || !stripeData.success) {
          setError(stripeData.error || 'Erreur lors du traitement de votre carte bancaire')
          setLoading(false)
          return
        }
      }

      const res = await fetch(`${backendUrl}/api/boutiques/commandes/express`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          client_nom: nom,
          client_telephone: tel,
          client_adresse: adresse || undefined,
          note: note || undefined,
          methode_paiement: paiement,
          frais_livraison: fraisLivraison,
          articles: articlesPayload,
          code_promo: promoApplique?.code || undefined,
          montant_reduction: promoApplique?.reduction || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok && !data.fallback_manuel) { setError(data.error ?? 'Erreur lors de la commande'); setLoading(false); return }
      
      if (data.wave_url) {
        window.location.href = data.wave_url
        return
      }

      if (data.fallback_manuel) {
        setPaiement('manuel')
        setError('💡 L\'API Wave direct étant momentanément indisponible, votre commande a été enregistrée. Effectuez votre transfert manuel vers le 77 720 20 86 (Wave/OM).')
        setLoading(false)
        return
      }

      // Sauvegarde Zero-Effort des coordonnées client
      try {
        if (nom) localStorage.setItem('nopalou_client_nom', nom)
        if (tel) localStorage.setItem('nopalou_client_tel', tel)
        if (adresse) localStorage.setItem('nopalou_client_adresse', adresse)
      } catch {}

      setSuccess(true)
    } catch {
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style jsx global>{`
          @keyframes modalSlideUp {
            from { transform: translateY(20px) scale(0.97); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .premium-input {
            width: 100%;
            padding: 12px 14px;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            color: #0f172a;
            background: #ffffff;
            transition: all 0.2s ease;
            box-sizing: border-box;
            outline: none;
          }
          .premium-input:focus {
            border-color: #C75B00;
            box-shadow: 0 0 0 3px rgba(199, 91, 0, 0.12);
            background: #fff;
          }
          .mode-tab-card {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 14px 16px;
            border-radius: 16px;
            border: 2px solid #e2e8f0;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: left;
            position: relative;
          }
          .mode-tab-card:hover {
            border-color: #cbd5e1;
            transform: translateY(-1px);
          }
          .mode-tab-card.active-whatsapp {
            border-color: #22c55e;
            background: #f0fdf4;
            box-shadow: 0 4px 16px -2px rgba(34, 197, 94, 0.2);
          }
          .mode-tab-card.active-formulaire {
            border-color: #C75B00;
            background: #fff7ed;
            box-shadow: 0 4px 16px -2px rgba(199, 91, 0, 0.2);
          }
          .payment-card-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 12px;
            border: 1.5px solid #e2e8f0;
            background: #ffffff;
            color: #1e293b;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
          }
          .payment-card-btn:hover:not(:disabled) {
            border-color: #cbd5e1;
            background: #f8fafc;
          }
          .payment-card-btn.selected {
            border-color: #C75B00;
            background: #fff7ed;
            color: #9a3412;
            box-shadow: 0 0 0 2px rgba(199, 91, 0, 0.15);
          }
        `}</style>

        {/* 1. Header Moderne avec Badge Boutique */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', background: '#ffedd5', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🏪 {nomBoutique || 'Boutique Certifiée'}
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Finaliser votre commande
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#e2e8f0',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              transition: 'background 0.2s',
            }}
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* 2. Mini Carte Produit & Récapitulatif Rapide */}
        <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 24, padding: '6px 10px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0' }}>🛍️</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {produit.nom}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                Quantité : <strong>{quantite}</strong> {produit.prix ? `• ${fcfa(produit.prix)} / unité` : ''}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block' }}>TOTAL ARTICLE</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#C75B00' }}>{fcfa(sousTotalMain)}</span>
          </div>
        </div>

        {/* 3. Sélecteur d'Onglets Premium & Visible (Choix du canal) */}
        <div style={{ padding: '16px 24px 8px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>👉</span> Choisissez comment vous souhaitez commander :
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Onglet 1: WhatsApp Direct */}
            <button
              type="button"
              onClick={() => setMode('whatsapp')}
              className={`mode-tab-card ${mode === 'whatsapp' ? 'active-whatsapp' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                  background: mode === 'whatsapp' ? '#22c55e' : '#e2e8f0',
                  color: mode === 'whatsapp' ? '#ffffff' : '#64748b',
                  letterSpacing: '0.04em'
                }}>
                  ⚡ 1-CLIC RAPIDE
                </span>
                <span style={{
                  fontSize: 13, width: 20, height: 20, borderRadius: '50%',
                  background: mode === 'whatsapp' ? '#22c55e' : 'transparent',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, border: mode === 'whatsapp' ? 'none' : '1.5px solid #cbd5e1'
                }}>
                  {mode === 'whatsapp' ? '✓' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 20 }}>💬</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: mode === 'whatsapp' ? '#15803d' : '#1e293b' }}>
                    WhatsApp Direct
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: mode === 'whatsapp' ? '#166534' : '#64748b', lineHeight: 1.3 }}>
                    Sans formulaire, échangez en direct
                  </p>
                </div>
              </div>
            </button>

            {/* Onglet 2: Commande avec Formulaire */}
            <button
              type="button"
              onClick={() => setMode('formulaire')}
              className={`mode-tab-card ${mode === 'formulaire' ? 'active-formulaire' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                  background: mode === 'formulaire' ? '#C75B00' : '#e2e8f0',
                  color: mode === 'formulaire' ? '#ffffff' : '#64748b',
                  letterSpacing: '0.04em'
                }}>
                  💳 PAIEMENT DIRECT
                </span>
                <span style={{
                  fontSize: 13, width: 20, height: 20, borderRadius: '50%',
                  background: mode === 'formulaire' ? '#C75B00' : 'transparent',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, border: mode === 'formulaire' ? 'none' : '1.5px solid #cbd5e1'
                }}>
                  {mode === 'formulaire' ? '✓' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: mode === 'formulaire' ? '#9a3412' : '#1e293b' }}>
                    Formulaire & Paiement
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: mode === 'formulaire' ? '#c2410c' : '#64748b', lineHeight: 1.3 }}>
                    Wave, OM, Espèces ou Crédit
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Contenu Scrollable selon le mode choisi */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}>
          
          {/* ================= MODE 1 : WHATSAPP DIRECT ================= */}
          {mode === 'whatsapp' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>📲</span>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#15803d' }}>
                    Commande instantanée avec le vendeur
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.45 }}>
                    Évitez la saisie de formulaires ! Cliquez sur le bouton ci-dessous pour ouvrir WhatsApp avec votre message pré-rempli pour <strong>{nomBoutique || 'le vendeur'}</strong>.
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  💬 Message prêt à envoyer :
                </p>
                <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', fontStyle: 'italic', lineHeight: 1.45 }}>
                  &ldquo;{messageWhatsappDirect}&rdquo;
                </div>
              </div>

              {/* Bouton Primaire WhatsApp */}
              <a
                href={helperLienWhatsapp(whatsapp || '221777202086', messageWhatsappDirect)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '16px 20px',
                  fontWeight: 900,
                  fontSize: 15.5,
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.4)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 20 }}>💬</span> Ouvrir WhatsApp Maintenant ({fcfa(sousTotalMain)}) →
              </a>

              {/* Alternative téléphonique */}
              {whatsapp && (
                <a
                  href={`tel:${whatsapp.replace(/\D/g, '')}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#ffffff',
                    color: '#475569',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '11px 16px',
                    fontWeight: 700,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <span>📞</span> Appeler la boutique directement
                </a>
              )}
            </div>
          ) : (
            /* ================= MODE 2 : FORMULAIRE EN LIGNE ================= */
            success ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: paiement === 'credit' ? '#e0f2fe' : '#ecfdf5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                  boxShadow: paiement === 'credit' ? '0 8px 20px rgba(2,132,199,0.2)' : '0 8px 20px rgba(22,163,74,0.2)'
                }}>
                  {paiement === 'credit' ? '💳' : '🎉'}
                </div>

                <div>
                  <h3 style={{ fontSize: 20, margin: '0 0 6px', color: paiement === 'credit' ? '#0369a1' : '#15803d', fontWeight: 900 }}>
                    {paiement === 'credit' ? 'Demande d\'Achat à Crédit Transmise !' : 'Commande Confirmée avec Succès !'}
                  </h3>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.5, maxWidth: 380 }}>
                    {paiement === 'credit' ? (
                      <>
                        La boutique <strong>{nomBoutique || 'vendeur'}</strong> a reçu votre demande. Elle sera ajoutée à votre Carnet client dès confirmation.
                      </>
                    ) : (
                      <>
                        La boutique a bien reçu votre commande et vous contactera sur le <strong>{tel}</strong> pour la livraison.
                      </>
                    )}
                  </p>
                </div>

                <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                    <span>Article</span>
                    <strong style={{ color: '#1e293b' }}>{produit.nom} (×{quantite})</strong>
                  </div>
                  {promoApplique && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                      <span>Code promo ({promoApplique.code})</span>
                      <span>-{fcfa(promoApplique.reduction)}</span>
                    </div>
                  )}
                  {fraisLivraison > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                      <span>Livraison</span>
                      <span>{fcfa(fraisLivraison)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#C75B00', borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 2 }}>
                    <span>Total {paiement === 'credit' ? 'à inscrire' : 'réglé'}</span>
                    <span>{fcfa(total)}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 14,
                    padding: '14px 20px',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                >
                  ✕ Fermer la fenêtre
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#b91c1c', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Section 1 : Vos Coordonnées */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span>👤</span> 1. Vos Coordonnées
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <input
                        required
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        className="premium-input"
                        placeholder="Prénom & Nom *"
                      />
                    </div>
                    <div>
                      <input
                        required
                        type="tel"
                        value={tel}
                        onChange={e => setTel(e.target.value)}
                        className="premium-input"
                        placeholder="Téléphone (ex: 77 123 45 67) *"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2 : Quantité & Livraison */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span>📍</span> 2. Quantité & Livraison
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: '2px 6px' }}>
                      <button
                        type="button"
                        onClick={() => setQuantite(Math.max(1, quantite - 1))}
                        style={{ width: 32, height: 36, border: 'none', background: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer', color: '#475569' }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                        {quantite}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantite(quantite + 1)}
                        style={{ width: 32, height: 36, border: 'none', background: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer', color: '#475569' }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ flex: 1 }}>
                      <select
                        value={zoneId}
                        onChange={e => setZoneId(e.target.value)}
                        className="premium-input"
                        style={{ height: 42, padding: '8px 12px' }}
                      >
                        <option value="">— Retrait gratuit en boutique —</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>
                            {z.nom} ({z.prix > 0 ? fcfa(z.prix) : 'Gratuit'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <input
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    className="premium-input"
                    placeholder="Adresse précise (Quartier, rue, repère...)"
                  />
                </div>

                {/* Section 3 : Mode de Paiement */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span>💳</span> 3. Mode de Paiement
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { value: 'wave', label: '🌊 Wave (Recommandé ⚡)', disabled: false },
                      { value: 'cash', label: '💵 Espèces à la livraison', disabled: false },
                      { value: 'credit', label: '💳 Demande d\'Achat à Crédit', disabled: false },
                      { value: 'manuel', label: '🧾 Dépôt Manuel Wave/OM', disabled: false },
                      { value: 'virement', label: '🏦 Virement bancaire', disabled: false },
                      { value: 'carte_bancaire', label: '💳 Carte bancaire (Stripe)', disabled: false },
                    ].map(m => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPaiement(m.value)}
                        className={`payment-card-btn ${paiement === m.value ? 'selected' : ''}`}
                      >
                        <span>{paiement === m.value ? '🔘' : '⚪'}</span>
                        <span style={{ flex: 1 }}>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {paiement === 'credit' && (
                    <div style={{ marginTop: 8, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
                      ℹ️ Votre demande d&apos;achat à crédit sera transmise directement au commerçant pour inscription dans son Carnet client.
                    </div>
                  )}

                  {paiement === 'carte_bancaire' && (
                    <div style={{ marginTop: 10, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🔒 Simulation Paiement Sécurisé Carte Bancaire (Stripe)
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Numéro de carte</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                          className="premium-input"
                          style={{ fontFamily: 'monospace' }}
                          placeholder="4242 4242 4242 4242"
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Expiration (MM/AA)</label>
                          <input
                            type="text"
                            value={cardExp}
                            onChange={e => setCardExp(e.target.value)}
                            className="premium-input"
                            style={{ fontFamily: 'monospace' }}
                            placeholder="12/28"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>CVC</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={e => setCardCvc(e.target.value)}
                            className="premium-input"
                            style={{ fontFamily: 'monospace' }}
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4 : Code Promo */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px' }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span>🏷️</span> Code Promo (optionnel)
                  </label>

                  {promoApplique ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>✅</span>
                        <div>
                          <strong style={{ fontSize: 14, color: '#166534' }}>{promoApplique.code}</strong>
                          <span style={{ fontSize: 13, color: '#15803d', marginLeft: 8, fontWeight: 700 }}>(-{fcfa(promoApplique.reduction)})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setPromoApplique(null); setCodePromo(''); }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: '4px 8px' }}
                      >
                        Retirer ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={codePromo}
                        onChange={e => setCodePromo(e.target.value.toUpperCase())}
                        className="premium-input"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace', flex: 1, padding: '9px 12px' }}
                        placeholder="Ex: SOLDE20"
                      />
                      <button
                        type="button"
                        onClick={appliquerCodePromo}
                        disabled={promoLoading || !codePromo.trim()}
                        style={{
                          padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff',
                          border: 'none', fontWeight: 800, fontSize: 13, cursor: (promoLoading || !codePromo.trim()) ? 'not-allowed' : 'pointer',
                          opacity: (promoLoading || !codePromo.trim()) ? 0.6 : 1, whiteSpace: 'nowrap'
                        }}
                      >
                        {promoLoading ? '...' : 'Appliquer'}
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{promoError}</p>
                  )}
                </div>

                {/* Section 5 : Cross-sell / Articles Complémentaires */}
                {crossSell.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fef3c7', borderRadius: 14, padding: '12px 14px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11.5, fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🔥 Ajouter un article complémentaire (1-Clic) :
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {crossSell.map(c => {
                        const isSelected = !!selectedAddons[c.id]
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleAddon(c.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 12px', borderRadius: 10, border: '1.5px solid',
                              borderColor: isSelected ? '#C75B00' : '#fde68a',
                              background: isSelected ? '#fff7ed' : '#ffffff',
                              cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{isSelected ? '✅' : '➕'}</span>
                              <span style={{ fontSize: 13, fontWeight: isSelected ? 800 : 600, color: '#1e293b' }}>{c.nom}</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00' }}>
                              +{c.prix ? fcfa(c.prix) : '0 FCFA'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Section 6 : Note optionnelle */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Note / Précisions particulières (optionnel)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="premium-input"
                    rows={2}
                    placeholder="Couleur, taille, instructions pour le livreur..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Section 7 : Récapitulatif Prix Élégant */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                    <span>{produit.nom} × {quantite}</span>
                    <strong style={{ color: '#1e293b' }}>{fcfa(sousTotalMain)}</strong>
                  </div>
                  {Object.entries(selectedAddons).map(([pId, qte]) => {
                    const addon = crossSell.find(c => c.id === pId)
                    if (!addon) return null
                    return (
                      <div key={pId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                        <span>+ {addon.nom} × {qte}</span>
                        <span>{fcfa((addon.prix || 0) * qte)}</span>
                      </div>
                    )
                  })}
                  {promoApplique && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                      <span>Réduction Code Promo ({promoApplique.code})</span>
                      <span>-{fcfa(promoApplique.reduction)}</span>
                    </div>
                  )}
                  {fraisLivraison > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                      <span>Livraison ({zoneSelectionnee?.nom?.split('(')[0]?.trim()})</span>
                      <span>{fcfa(fraisLivraison)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900, color: '#C75B00', borderTop: '1.5px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
                    <span>Total à régler</span>
                    <span>{fcfa(total)}</span>
                  </div>
                </div>

                {/* Bouton de Soumission Primaire */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#94a3b8' : '#C75B00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 20px',
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(199, 91, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? (
                    'Traitement en cours…'
                  ) : (
                    <>
                      <span>Confirmer ma commande • {fcfa(total)}</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <p style={{ margin: '0 auto', fontSize: 11.5, color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔒</span> Données protégées & Commande sécurisée par Nopalou
                </p>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  )
}
