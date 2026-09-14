'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import {
  ShoppingBag, Store, MapPin, CreditCard, MessageCircle,
  CheckCircle2, Zap, AlertCircle, ArrowRight, Phone, ShieldCheck, Layers
} from 'lucide-react'
import EchelonnementConfigurator from '@/app/boutiques/[id]/commander/EchelonnementConfigurator'

interface Zone {
  id: string
  nom: string
  prix: number
}

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: 'Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: 'Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: 'Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: '🏬 Retrait gratuit en boutique', prix: 0 },
]

function fcfa(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function CheckoutExpressContent() {
  const searchParams = useSearchParams()
  const refParam = searchParams.get('ref') || searchParams.get('r') || ''
  const produitId = searchParams.get('produit') || searchParams.get('p') || ''
  const boutiqueIdParam = searchParams.get('boutique') || searchParams.get('b') || ''
  const phoneParam = searchParams.get('phone') || searchParams.get('tel') || ''
  const nomParam = searchParams.get('nom') || ''
  const payParam = (searchParams.get('pay') || searchParams.get('m') || '').toLowerCase()
  const quantiteParam = parseInt(searchParams.get('q') || '1', 10)

  const [loading, setLoading] = useState<boolean>(true)
  const [produitInfo, setProduitInfo] = useState<{ id: string; nom: string; prix: number; photo?: string | null; boutiqueNom?: string; boutiqueId?: string } | null>(null)
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [quantite, setQuantite] = useState<number>(quantiteParam > 0 ? quantiteParam : 1)

  // Form states
  const [clientNom, setClientNom] = useState(nomParam)
  const [clientTel, setClientTel] = useState(phoneParam)
  const [clientAdresse, setClientAdresse] = useState('')
  const [methodePaiement, setMethodePaiement] = useState<'wave' | 'orange_money' | 'cash' | 'echelonne'>(
    searchParams.get('echelonne') === '1'
      ? 'echelonne'
      : payParam === 'cash'
      ? 'cash'
      : payParam === 'om' || payParam === 'orange_money'
      ? 'orange_money'
      : 'wave'
  )
  const [formuleEchelonnee, setFormuleEchelonnee] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [autoRedirecting, setAutoRedirecting] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [orderRef, setOrderRef] = useState<string>(refParam)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [useSequestre, setUseSequestre] = useState<boolean>(true)
  const [sequestrePin, setSequestrePin] = useState<string | null>(null)

  const autoParam = searchParams.get('auto') === '1'
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // 1. Priorité absolue : Si une référence de commande existe (ex: C-MU118UXF)
        if (refParam) {
          const cRes = await fetch(`${backendUrl}/api/boutiques/commandes/suivi?ref=${encodeURIComponent(refParam)}`).catch(() => null)
          if (cRes && cRes.ok) {
            const cData = await cRes.json()
            const cmd = cData.commandes?.[0]
            if (cmd) {
              const prixTot = Number(cmd.montant_total) || 0
              const qte = Number(cmd.quantite) || 1
              const prixUnit = Number(cmd.prix_unitaire) || (qte > 0 ? Math.round(prixTot / qte) : prixTot)

              setProduitInfo({
                id: cmd.produit_id || cmd.id,
                nom: cmd.nom_produit || 'Produit Nopalou',
                prix: prixUnit,
                photo: null,
                boutiqueNom: cmd.boutique_nom || 'Boutique Partenaire',
                boutiqueId: cmd.boutique_id,
              })
              setQuantite(qte)
              if (cmd.client_nom) setClientNom(cmd.client_nom)
              if (cmd.client_telephone) setClientTel(cmd.client_telephone)
              if (cmd.client_adresse) setClientAdresse(cmd.client_adresse)
              setOrderRef(cmd.reference)

              if (searchParams.get('echelonne') === '1' || cmd.methode_paiement === 'credit' || cmd.methode_paiement === 'echelonne') {
                setMethodePaiement('echelonne')
              }

              const bId = cmd.boutique_id || boutiqueIdParam
              if (bId) {
                const zRes = await fetch(`${backendUrl}/api/comptabilite/${bId}/zones/public`).catch(() => null)
                if (zRes && zRes.ok) {
                  const zData = await zRes.json()
                  if (Array.isArray(zData) && zData.length > 0) setZones(zData)
                }
              }
              setLoading(false)
              return
            }
          }
        }

        // 2. Chargement standard par produitId et/ou boutiqueId
        if (produitId) {
          const res = await fetch(`${backendUrl}/api/produits/${produitId}`).catch(() => null)
          if (res && res.ok) {
            const data = await res.json()
            setProduitInfo({
              id: data.id,
              nom: data.nom || data.titre || 'Produit Nopalou',
              prix: Number(data.prix || data.prix_min) || 0,
              photo: data.images?.[0] || data.photo || null,
              boutiqueNom: data.boutique_nom || 'Boutique Partenaire',
              boutiqueId: data.boutique_id || boutiqueIdParam,
            })
          } else if (boutiqueIdParam) {
            // Fallback dans le catalogue de la boutique
            const bRes = await fetch(`${backendUrl}/api/boutiques/${boutiqueIdParam}/produits`).catch(() => null)
            if (bRes && bRes.ok) {
              const bData = await bRes.json()
              const found = (bData.produits || []).find((p: any) => p.id === produitId)
              if (found) {
                setProduitInfo({
                  id: found.id,
                  nom: found.nom,
                  prix: Number(found.prix) || 0,
                  photo: found.images?.[0] || null,
                  boutiqueNom: 'Boutique Partenaire',
                  boutiqueId: boutiqueIdParam,
                })
              }
            }
          }
        }
        if (boutiqueIdParam) {
          const zRes = await fetch(`${backendUrl}/api/comptabilite/${boutiqueIdParam}/zones/public`).catch(() => null)
          if (zRes && zRes.ok) {
            const zData = await zRes.json()
            if (Array.isArray(zData) && zData.length > 0) setZones(zData)
          }
        }
      } catch (err) {
        console.error('[CHECKOUT EXPRESS]', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [produitId, boutiqueIdParam, refParam, searchParams, backendUrl])

  const zoneSelectionnee = zones.find(z => z.id === zoneId) || DEFAULT_ZONES[0]
  const fraisLivraison = zoneSelectionnee ? zoneSelectionnee.prix : 1500
  const sousTotal = (produitInfo?.prix || 0) * quantite
  const totalGlobal = sousTotal > 0 ? (sousTotal + fraisLivraison) : fraisLivraison

  // Auto redirection immédiate vers Wave si auto=1
  useEffect(() => {
    if (!loading && autoParam && methodePaiement === 'wave' && !submitting && !success && !autoRedirecting) {
      setAutoRedirecting(true)
      const refTemp = refParam || orderRef || `CMD-${Date.now().toString(36).toUpperCase()}`
      fetch(`${backendUrl}/api/paiement/wave/initier-express`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: totalGlobal > 0 ? totalGlobal : 1500,
          reference: refTemp,
          nom_produit: produitInfo?.nom || 'Commande Express Wave',
        }),
      })
        .then(res => res.json())
        .then(waveData => {
          if (waveData.wave_url) {
            window.location.href = waveData.wave_url
          } else {
            setAutoRedirecting(false)
          }
        })
        .catch(() => setAutoRedirecting(false))
    }
  }, [loading, autoParam, methodePaiement, totalGlobal, produitInfo, backendUrl, submitting, success, autoRedirecting, refParam, orderRef])

  // WhatsApp direct link generator
  const messageWhatsapp = `Bonjour ! Je souhaite valider la commande suivante via WhatsApp :\n\n` +
    `${quantite}x ${produitInfo?.nom || 'Produit'} (${fcfa(sousTotal)})\n` +
    `Livraison (${zoneSelectionnee?.nom}): ${fcfa(fraisLivraison)}\n` +
    `TOTAL: ${fcfa(totalGlobal)}\n\n` +
    `Nom: ${clientNom || 'Non renseigné'}\n` +
    `Téléphone: ${clientTel || 'Non renseigné'}\n` +
    `Adresse: ${clientAdresse || 'À préciser'}\n` +
    `Mode de paiement souhaité: ${methodePaiement === 'wave' ? 'Wave' : methodePaiement === 'orange_money' ? 'Orange Money' : methodePaiement === 'echelonne' ? 'Paiement échelonné' : 'Cash à la livraison'}`

  const lienWhatsapp = `https://wa.me/221777202086?text=${encodeURIComponent(messageWhatsapp)}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientNom.trim() || !clientTel.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet et votre numéro de téléphone.')
      return
    }
    setErrorMsg(null)
    setSubmitting(true)

    try {
      const montantAPayer = methodePaiement === 'echelonne'
        ? (formuleEchelonnee?.apport || Math.round(totalGlobal * 0.2))
        : totalGlobal

      const targetBoutique = produitInfo?.boutiqueId || boutiqueIdParam || 'general'
      const referenceToUse = refParam || orderRef || `CMD-${Date.now().toString(36).toUpperCase()}`

      const res = await fetch(`${backendUrl}/api/comptabilite/${targetBoutique}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: referenceToUse,
          produit_id: produitId || produitInfo?.id || undefined,
          nom_produit: produitInfo?.nom || 'Commande Express',
          prix_unitaire: produitInfo?.prix || 0,
          quantite,
          client_nom: clientNom.trim(),
          client_telephone: clientTel.trim(),
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: methodePaiement === 'echelonne' ? 'credit_echelonne' : methodePaiement,
          zone_livraison_id: zoneId || undefined,
          source: 'whatsapp_express_web',
          plan_echelonne: methodePaiement === 'echelonne' && formuleEchelonnee ? {
            apport: formuleEchelonnee.apport,
            nb_echeances: formuleEchelonnee.nb_echeances,
            frequence: formuleEchelonnee.frequence,
            echeances: formuleEchelonnee.calcul?.echeances || [],
          } : undefined,
        }),
      })

      const data = await res.json()
      const finalRef = data.reference || referenceToUse
      setOrderRef(finalRef)

      if (useSequestre && methodePaiement !== 'cash') {
        try {
          const seqRes = await fetch(`${backendUrl}/api/paiement-sequestre/activer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: finalRef,
              telephoneClient: clientTel.trim(),
              montantTotal: montantAPayer,
              nomBoutique: produitInfo?.boutiqueNom || 'Boutique Partenaire',
            }),
          }).catch(() => null)
          if (seqRes && seqRes.ok) {
            const seqData = await seqRes.json().catch(() => ({}))
            if (seqData.pin) {
              setSequestrePin(seqData.pin)
            }
          }
        } catch (sErr) {
          console.warn('[SEQUESTRE ERR]', sErr)
        }
      }

      if (methodePaiement === 'wave' || methodePaiement === 'echelonne') {
        try {
          const waveRes = await fetch(`${backendUrl}/api/paiement/wave/initier-express`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              montant: montantAPayer,
              reference: finalRef,
              nom_produit: methodePaiement === 'echelonne'
                ? `Acompte échelonné : ${produitInfo?.nom || 'Commande'}`
                : (produitInfo?.nom || 'Commande Express'),
            }),
          }).catch(() => null)

          if (waveRes && waveRes.ok) {
            const waveData = await waveRes.json()
            if (waveData.wave_url) {
              window.location.href = waveData.wave_url
              return
            }
            if (waveData.fallback_manuel) {
              setErrorMsg('L\'API Wave direct étant momentanément indisponible, effectuez votre transfert au 77 720 20 86 (Wave/OM). Votre commande est bien enregistrée.')
            }
          }
        } catch (wErr) {
          console.error('[WAVE INIT ERR]', wErr)
        }
      }

      setSuccess(true)
    } catch {
      setOrderRef(refParam || `CMD-${Date.now().toString(36).toUpperCase()}`)
      setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (autoRedirecting) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', boxShadow: '0 20px 50px rgba(0,163,224,0.15)', border: '1px solid #e0f7ff', maxWidth: 460, width: '100%' }}>
          <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}></span>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0084b4', margin: '0 0 12px' }}>Redirection vers Wave…</h2>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', lineHeight: 1.5 }}>
            Nous préparons votre paiement sécurisé Wave pour <strong>{produitInfo?.nom || 'votre commande'}</strong>.
          </p>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '4px solid #e0f7ff', borderTopColor: '#00a3e0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ maxWidth: 540, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}></span>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#166534', margin: '0 0 8px' }}>Commande Confirmée !</h2>
          <p style={{ fontSize: 15, color: '#475569', margin: '0 0 16px' }}>
            Votre commande <strong>{orderRef}</strong> a bien été transmise.
          </p>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'left', margin: '20px 0', border: '1px solid #e2e8f0', fontSize: 14 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#0f172a' }}>Récapitulatif :</p>
            <p style={{ margin: '0 0 4px', color: '#334155' }}>• {quantite}x {produitInfo?.nom || 'Produit'}</p>
            <p style={{ margin: '0 0 4px', color: '#334155' }}>• Total: <strong>{fcfa(totalGlobal)}</strong></p>
            <p style={{ margin: '0 0 4px', color: '#334155' }}>• Mode de paiement: <strong>{methodePaiement.toUpperCase()}</strong></p>
            <p style={{ margin: 0, color: '#334155' }}>• Tél: {clientTel}</p>
          </div>

          {useSequestre && (
            <div style={{ background: '#FFF3E8', borderRadius: 14, padding: 18, border: '2px solid #C75B00', margin: '16px 0', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C75B00', fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}>
                <ShieldCheck size={18} />
                <span>Protection Séquestre Nopalou Pay Safe Active</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#1A1612' }}>
                Vos fonds sont retenus en sécurité. Voici votre code secret de déblocage :
              </p>
              {sequestrePin ? (
                <div style={{ display: 'inline-block', letterSpacing: '0.25em', fontSize: 24, fontWeight: 900, background: '#fff', color: '#1C2B4A', padding: '8px 20px', borderRadius: 10, border: '2px dashed #C75B00', marginBottom: 8 }}>
                  {sequestrePin}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: '#16A34A', fontWeight: 700, marginBottom: 8 }}>
                  Envoyé par WhatsApp sur votre téléphone
                </div>
              )}
              <p style={{ margin: 0, fontSize: 11.5, color: '#5A4E42', lineHeight: 1.3 }}>
                <strong>Ne communiquez ce code au livreur qu&apos;après avoir vérifié votre colis !</strong>
              </p>
            </div>
          )}

          <a
            href={`https://wa.me/221777202086?text=${encodeURIComponent(`Bonjour, je souhaite suivre ma commande ${orderRef}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#25D366', color: '#fff', padding: '14px 24px', borderRadius: 12,
              fontWeight: 800, textDecoration: 'none', fontSize: 15, width: '100%', marginBottom: 12,
            }}
          >
            <span></span> Suivre ma commande sur WhatsApp
          </a>

          <Link href="/" style={{ color: '#64748b', fontSize: 14, textDecoration: 'underline' }}>
            Retour à l'accueil Nopalou
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 540, margin: '20px auto', padding: '0 16px 40px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* En-tête marque */}
      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent, #C75B00)', letterSpacing: '-0.02em' }}>NOPALOU</span>
        </Link>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text2, #6B5E52)', fontWeight: 600 }}>
          Validation Express de Commande Sécurisée
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border, #E8DDD2)' }}>
        
        {/* Détails du Produit */}
        {produitInfo ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border, #E8DDD2)', marginBottom: 20 }}>
            <ExternalImg src={produitInfo.photo} alt={produitInfo.nom} fallback="" style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover', background: 'var(--bg, #F8F5F0)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Store size={12} />
                <span>{produitInfo.boutiqueNom}</span>
              </span>
              <h1 style={{ margin: '2px 0 4px', fontSize: 15.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{produitInfo.nom}</h1>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>{fcfa(produitInfo.prix)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', borderRadius: 8, padding: '3px 6px' }}>
              <button type="button" onClick={() => setQuantite(Math.max(1, quantite - 1))} style={{ background: 'none', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: '2px 6px', color: 'var(--text2)' }}>-</button>
              <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--navy, #1C2B4A)' }}>{quantite}</span>
              <button type="button" onClick={() => setQuantite(quantite + 1)} style={{ background: 'none', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: '2px 6px', color: 'var(--text2)' }}>+</button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2, #6B5E52)' }}>Chargement des informations du produit...</div>
        ) : null}

        {/* Sélection Zone de Livraison */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text2, #6B5E52)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MapPin size={15} style={{ color: 'var(--accent)' }} />
            <span>Zone de livraison</span>
          </label>
          <select
            value={zoneId}
            onChange={e => setZoneId(e.target.value)}
            className="input-npl"
            style={{ height: 42 }}
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom} ({z.prix > 0 ? fcfa(z.prix) : 'Gratuit'})</option>
            ))}
          </select>
        </div>

        {/* Récapitulatif Tarifaire */}
        <div style={{ background: 'var(--bg, #F8F5F0)', borderRadius: 14, padding: 16, marginBottom: 24, border: '1px solid var(--border, #E8DDD2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text2, #6B5E52)', marginBottom: 6 }}>
            <span>Sous-total ({quantite} art.)</span>
            <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{fcfa(sousTotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text2, #6B5E52)', marginBottom: 10 }}>
            <span>Livraison ({zoneSelectionnee?.nom?.split('(')[0] || 'Dakar'})</span>
            <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{fcfa(fraisLivraison)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900, color: 'var(--accent, #C75B00)', borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 10 }}>
            <span>TOTAL À PAYER</span>
            <span>{fcfa(totalGlobal)}</span>
          </div>
        </div>

        {/* Choix des 2 modes de commande / paiement */}
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--text2, #6B5E52)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} style={{ color: 'var(--accent)' }} />
            <span>Choisissez votre mode de finalisation :</span>
          </p>

          {/* Option 1: Paiement Direct WhatsApp */}
          <a
            href={lienWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#16a34a', color: '#fff', padding: '14px 18px', borderRadius: 12,
              fontWeight: 800, fontSize: 14.5, textDecoration: 'none', boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
              textAlign: 'center',
            }}
          >
            <MessageCircle size={18} />
            <span>Option 1 : Paiement Direct via WhatsApp →</span>
          </a>
        </div>

        {/* Option 2: Formulaire en ligne (Wave / OM / Cash) */}
        <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 20 }}>
          <p style={{ margin: '0 0 14px', fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCard size={16} style={{ color: 'var(--accent)' }} />
            <span>Option 2 : Formulaire de commande directe (1 Clic)</span>
          </p>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 4 }}>NOM & PRÉNOM *</label>
              <input
                type="text"
                required
                placeholder="Ex: Babacar Ndiaye"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                className="input-npl"
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 4 }}>TÉLÉPHONE *</label>
              <input
                type="tel"
                required
                placeholder="Ex: 77 123 45 67"
                value={clientTel}
                onChange={e => setClientTel(e.target.value)}
                className="input-npl"
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 4 }}>ADRESSE DE LIVRAISON</label>
              <input
                type="text"
                placeholder="Ex: Sacré-Cœur 3, Immeuble..."
                value={clientAdresse}
                onChange={e => setClientAdresse(e.target.value)}
                className="input-npl"
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--text2, #6B5E52)', display: 'block', marginBottom: 4 }}>MODE DE PAIEMENT</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('wave')}
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: methodePaiement === 'wave' ? '2px solid #00A8FF' : '1px solid var(--border, #E8DDD2)',
                    background: methodePaiement === 'wave' ? '#f0f9ff' : '#fff', color: 'var(--navy, #1C2B4A)', fontWeight: 750, fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  ⚡ Wave (Direct)
                </button>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('orange_money')}
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: methodePaiement === 'orange_money' ? '2px solid #ff6600' : '1px solid var(--border, #E8DDD2)',
                    background: methodePaiement === 'orange_money' ? '#fff7ed' : '#fff', color: 'var(--navy, #1C2B4A)', fontWeight: 750, fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  🟠 Orange Money
                </button>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('cash')}
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: methodePaiement === 'cash' ? '2px solid #16a34a' : '1px solid var(--border, #E8DDD2)',
                    background: methodePaiement === 'cash' ? '#f0fdf4' : '#fff', color: 'var(--navy, #1C2B4A)', fontWeight: 750, fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  💵 Espèces à la livraison
                </button>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('echelonne')}
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: methodePaiement === 'echelonne' ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                    background: methodePaiement === 'echelonne' ? '#fff7ed' : '#fff', color: 'var(--accent, #C75B00)', fontWeight: 750, fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  💳 Payer en plusieurs fois
                </button>
              </div>
            </div>

            {/* Configurateur interactif d'échelonnement si sélectionné */}
            {methodePaiement === 'echelonne' && (
              <div style={{ marginTop: 8 }}>
                <EchelonnementConfigurator
                  montantTotal={totalGlobal}
                  boutiqueId={produitInfo?.boutiqueId || boutiqueIdParam || ''}
                  onFormuleChoisie={(f) => setFormuleEchelonnee(f)}
                />
              </div>
            )}

            {/* Toggle Protection Séquestre Nopalou Pay Safe */}
            {methodePaiement !== 'echelonne' && (
              <div
                onClick={() => setUseSequestre(!useSequestre)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: useSequestre ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  background: useSequestre ? 'var(--orange2, #FFF3E8)' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginTop: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={useSequestre}
                  onChange={e => setUseSequestre(e.target.checked)}
                  style={{ marginTop: 3, accentColor: 'var(--accent, #C75B00)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <ShieldCheck size={16} color="var(--accent, #C75B00)" />
                    <strong style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                      Activer Nopalou Pay Safe (Séquestre Anti-Arnaque)
                    </strong>
                    <span style={{ fontSize: 9.5, fontWeight: 900, background: '#16A34A', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>
                      GRATUIT
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #5A4E42)', lineHeight: 1.35 }}>
                    Fonds bloqués et versés au marchand uniquement après confirmation de livraison avec votre code PIN secret.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-npl btn-npl-primary btn-npl-lg"
              style={{
                marginTop: 8, width: '100%', fontSize: 14.5,
              }}
            >
              {submitting
                ? 'Validation en cours...'
                : methodePaiement === 'echelonne'
                ? `Régler l'acompte Wave (${fcfa(formuleEchelonnee?.apport || Math.round(totalGlobal * 0.2))}) & Valider →`
                : `Valider et Payer la commande (${fcfa(totalGlobal)}) →`}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

export default function CheckoutExpressPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>}>
      <CheckoutExpressContent />
    </Suspense>
  )
}
