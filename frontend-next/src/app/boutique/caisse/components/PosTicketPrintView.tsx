'use client'

import React from 'react'
import QRCode from 'qrcode-svg'
import { fcfa } from '@/lib/format'
import { ClientFidelite } from './PosFideliteModal'

export interface VenteTicketPrint {
  id: string
  date: string
  heure: string
  caissier?: string
  total: number
  remise: number
  mode?: string
  recu?: number
  monnaie?: number
  ticket: Array<{
    quantite: number
    prixUnitaire: number
    produit: {
      nom: string
      code_barre?: string
    }
  }>
  detailMixte?: {
    especes: number
    autreMode: string
    autreMontant: number
  }
}

interface PosTicketPrintViewProps {
  vente?: VenteTicketPrint | null
  ticket?: any
  boutique?: any
  boutiqueNom?: string
  boutiqueAdresse?: string | null
  boutiqueTelephone?: string | null
  boutiqueLogo?: string | null
  messageBasTicket?: string | null
  regimeFiscal?: string | null
  estExonereClient?: boolean
  clientFidelite?: ClientFidelite | null
  onClose?: () => void
  fcfa?: (n: any) => string
}

export default function PosTicketPrintView({
  vente: venteProp,
  ticket,
  boutique,
  boutiqueNom,
  boutiqueAdresse,
  boutiqueTelephone,
  boutiqueLogo,
  messageBasTicket,
  regimeFiscal,
  estExonereClient,
  clientFidelite,
  onClose,
  fcfa: fcfaProp,
}: PosTicketPrintViewProps) {
  const vente = venteProp || ticket
  const bNom = boutiqueNom || boutique?.nom || 'Ma Boutique'
  const bAdresse = boutiqueAdresse || boutique?.adresse
  const bTelephone = boutiqueTelephone || boutique?.telephone
  const bLogo = boutiqueLogo || boutique?.logo

  const qrSvg = React.useMemo(() => {
    if (!vente?.id) return null
    try {
      const ticketRef = `TICK-${vente.id.slice(-8)}`
      const verifyUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/suivi-commande?ref=${ticketRef}`
        : `https://nopalou.com/suivi-commande?ref=${ticketRef}`
      const qr = new QRCode({
        content: verifyUrl,
        padding: 0,
        width: 72,
        height: 72,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M',
      })
      return qr.svg()
    } catch {
      return null
    }
  }, [vente?.id])

  if (!vente) return null

  return (
    <div className="ticket-print-container">
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        {boutiqueLogo && (
          <img
            src={boutiqueLogo}
            alt="Logo Boutique"
            style={{ maxWidth: 90, maxHeight: 45, objectFit: 'contain', margin: '0 auto 4px', display: 'block' }}
          />
        )}
        <div style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          . {boutiqueNom || 'NOPALOU BOUTIQUE'} .
        </div>
        {boutiqueAdresse && <div style={{ fontSize: 10, marginTop: 1 }}>{boutiqueAdresse}</div>}
        {boutiqueTelephone && <div style={{ fontSize: 10 }}>TEL : {boutiqueTelephone}</div>}
        <div style={{ fontSize: 10, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' }}>
          MERCI DE VOTRE VISITE - A BIENTOT
        </div>
        <div style={{ fontSize: 10, fontWeight: 'bold', marginTop: 3, borderTop: '1px dashed #000', paddingTop: 3 }}>
          {vente.caissier?.toUpperCase() || 'CAISSIER'} VOUS A SERVI :
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3px 0', fontSize: 10, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
        <span>CODE & ARTICLE</span>
        <span>MONTANT</span>
      </div>

      <div style={{ padding: '4px 0', borderBottom: '1px dashed #000' }}>
        {(vente.ticket || []).map((i: any, idx: number) => (
          <div key={idx} style={{ marginBottom: 4, fontSize: 10.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{i.produit?.code_barre ? `${i.produit.code_barre} ` : ''}{(i.produit?.nom || i.nom || 'Article').slice(0, 22)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8, fontSize: 10 }}>
              <span>{i.quantite} x {fcfa(i.prixUnitaire || i.prix)}</span>
              <span style={{ fontWeight: 'bold' }}>{fcfa(i.prixUnitaire * i.quantite)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, borderBottom: '1px dashed #000', padding: '5px 0' }}>
        {vente.remise > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>REMISE {(vente as any).remiseMotif ? `(${(vente as any).remiseMotif.slice(0, 20)})` : ''} :</span>
            <span>-{fcfa(vente.remise)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: '900', margin: '2px 0' }}>
          <span>TOTAL :</span>
          <span>{fcfa(vente.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
          <span>{vente.mode || 'ESPECES'} :</span>
          <span style={{ fontWeight: 'bold' }}>{fcfa(vente.total)}</span>
        </div>

        {vente.detailMixte ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8, fontSize: 10 }}>
              <span>- Espèces :</span>
              <span>{fcfa(vente.detailMixte.especes)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8, fontSize: 10 }}>
              <span>- {vente.detailMixte.autreMode} :</span>
              <span>{fcfa(vente.detailMixte.autreMontant)}</span>
            </div>
          </>
        ) : vente.mode === 'ESPECES' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <span>REÇU :</span>
              <span>{fcfa(vente.recu || vente.total)}</span>
            </div>
            {vente.monnaie && vente.monnaie > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 'bold' }}>
                <span>RENDU :</span>
                <span>{fcfa(vente.monnaie)}</span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Tableau Récapitulatif Fiscal Sénégal (Format Auchan) */}
      <div style={{ borderBottom: '1px dashed #000', padding: '4px 0', fontSize: 9.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 2 }}>
          <span>. TAUX</span>
          <span>VAL. TVA</span>
          <span>MONTANT HT</span>
        </div>
        {regimeFiscal === 'reel' && !estExonereClient ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>18.00%</span>
            <span>{fcfa(Math.round(vente.total * 0.18 / 1.18))}</span>
            <span>{fcfa(Math.round(vente.total / 1.18))}</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontStyle: 'italic' }}>
            TVA non applicable (Régime Simplifié CGI)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 'bold', padding: '4px 0', borderBottom: '1px dashed #000' }}>
        <span>NOMBRE DE PRODUITS :</span>
        <span>{(vente.ticket || []).reduce((sum: number, item: any) => sum + (item.quantite || 0), 0)}</span>
      </div>

      {/* Section Fidélité Reçu */}
      {clientFidelite && (
        <div style={{ borderBottom: '1px dashed #000', padding: '4px 0', fontSize: 10 }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>FIDÉLITÉ CLIENT :</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Client :</span>
            <span>{clientFidelite.nom}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cagnotte disponible :</span>
            <span style={{ fontWeight: 'bold' }}>{fcfa(clientFidelite.cagnotte_fcfa)}</span>
          </div>
        </div>
      )}

      {/* Bas de ticket & QR Code scannable de suivi / vérification */}
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 9.5 }}>
        {qrSvg ? (
          <div
            style={{ margin: '6px auto 4px', display: 'flex', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <div style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 'bold', fontSize: 11, margin: '4px 0' }}>
            ||| | ||||| |||| |||| ||| |||||||
          </div>
        )}
        <div style={{ fontSize: 9, color: '#333' }}>
          TICKET #{vente.id?.slice(-8) || '0001'} • {vente.date} {vente.heure}
        </div>
        <div style={{ marginTop: 4, fontWeight: 'bold' }}>
          {messageBasTicket || 'Dieureudieuf ! A bientôt chez nous.'}
        </div>
        <div style={{ marginTop: 2, fontSize: 8.5, color: '#555' }}>
          Nopalou POS • www.nopalou.com
        </div>
      </div>
    </div>
  )
}
