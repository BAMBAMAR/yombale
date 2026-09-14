'use client'

import { useMemo } from 'react'

interface UsePosFinancesProps {
  activeBoutiqueObj: any
  clientsCredits: any[]
  clientCreditIdPOS: string
  sousTotalPanier: number
  netAPayer: number
  modePaiement: string
  montantRecu: string | number
  montantEspecesMixte: string | number
}

export function usePosFinances({
  activeBoutiqueObj,
  clientsCredits,
  clientCreditIdPOS,
  sousTotalPanier,
  netAPayer,
  modePaiement,
  montantRecu,
  montantEspecesMixte,
}: UsePosFinancesProps) {
  return useMemo(() => {
    const regimeFiscal = activeBoutiqueObj?.regime_fiscal || 'reel'
    const tvaDefaut = Number(activeBoutiqueObj?.tva_taux_defaut ?? 18.0)
    const estExonereClient = Boolean(clientsCredits.find((c) => c.id === clientCreditIdPOS)?.exonere_tva)
    const totalHT = Math.round(sousTotalPanier / (1 + tvaDefaut / 100))
    const totalTVA = sousTotalPanier - totalHT
    const timbreFiscal =
      activeBoutiqueObj?.timbre_fiscal_applicable && modePaiement === 'especes'
        ? Math.min(5000, Number((netAPayer * 0.01).toFixed(2)))
        : 0
    const resteAPayerMixte = Math.max(0, netAPayer - (Number(montantEspecesMixte) || 0))
    const monnaieARendre = Math.max(0, (Number(montantRecu) || netAPayer) - netAPayer)

    return {
      regimeFiscal,
      tvaDefaut,
      estExonereClient,
      totalHT,
      totalTVA,
      timbreFiscal,
      resteAPayerMixte,
      monnaieARendre,
    }
  }, [
    activeBoutiqueObj,
    clientsCredits,
    clientCreditIdPOS,
    sousTotalPanier,
    netAPayer,
    modePaiement,
    montantRecu,
    montantEspecesMixte,
  ])
}
