'use client'

import React from 'react'
import { CommanderModalProps } from './commander/types'
import { useCommander } from './commander/useCommander'
import CommanderHeader from './commander/CommanderHeader'
import CommanderWhatsappView from './commander/CommanderWhatsappView'
import CommanderSuccessView from './commander/CommanderSuccessView'
import CheckoutProgressBar from './commander/CheckoutProgressBar'
import CheckoutStep1Info from './commander/CheckoutStep1Info'
import CheckoutStep2Recap from './commander/CheckoutStep2Recap'

export default function CommanderModal({
  boutiqueId,
  produit,
  whatsapp,
  nomBoutique,
  onClose,
  noteInitiale,
}: CommanderModalProps) {
  const commander = useCommander({
    boutiqueId,
    produit,
    noteInitiale,
  })

  return (
    <div className="commander-modal-overlay" onClick={onClose}>
      <div className="commander-modal-box" onClick={e => e.stopPropagation()}>
        {/* En-tête & aperçu produit & onglets de commande */}
        <CommanderHeader
          nomBoutique={nomBoutique}
          produit={produit}
          quantite={commander.quantite}
          sousTotalMain={commander.sousTotalMain}
          mode={commander.mode}
          onModeChange={commander.setMode}
          onClose={onClose}
        />

        {/* Corps modal scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}>
          {commander.mode === 'whatsapp' ? (
            <CommanderWhatsappView
              produit={produit}
              nomBoutique={nomBoutique}
              whatsapp={whatsapp}
              sousTotalMain={commander.sousTotalMain}
              recordAbConversion={commander.recordAbConversion}
            />
          ) : commander.success || commander.step === 3 ? (
            <>
              <CheckoutProgressBar step={3} />
              <CommanderSuccessView
                produit={produit}
                quantite={commander.quantite}
                paiement={commander.paiement}
                nomBoutique={nomBoutique}
                tel={commander.tel}
                promoApplique={commander.promoApplique}
                reductionClubVip={commander.reductionClubVip}
                clubVip={commander.clubVip}
                fraisLivraison={commander.fraisLivraison}
                total={commander.total}
                onClose={onClose}
              />
            </>
          ) : commander.step === 1 ? (
            <>
              <CheckoutProgressBar step={1} />
              <CheckoutStep1Info
                nom={commander.nom}
                setNom={commander.setNom}
                tel={commander.tel}
                setTel={commander.setTel}
                adresse={commander.adresse}
                setAdresse={commander.setAdresse}
                zoneId={commander.zoneId}
                setZoneId={commander.setZoneId}
                zones={commander.zones}
                note={commander.note}
                setNote={commander.setNote}
                onNext={commander.nextStep}
              />
            </>
          ) : (
            <>
              <CheckoutProgressBar step={2} />
              <CheckoutStep2Recap
                produit={produit}
                quantite={commander.quantite}
                sousTotal={commander.sousTotal}
                fraisLivraison={commander.fraisLivraison}
                total={commander.total}
                paiement={commander.paiement}
                setPaiement={commander.setPaiement}
                promoApplique={commander.promoApplique}
                clubVip={commander.clubVip}
                reductionClubVip={commander.reductionClubVip}
                codePromo={commander.codePromo}
                setCodePromo={commander.setCodePromo}
                appliquerCodePromo={commander.appliquerCodePromo}
                removePromo={commander.removePromo}
                promoLoading={commander.promoLoading}
                promoError={commander.promoError}
                deviseStripe={commander.deviseStripe}
                setDeviseStripe={commander.setDeviseStripe}
                cardNumber={commander.cardNumber}
                setCardNumber={commander.setCardNumber}
                cardExp={commander.cardExp}
                setCardExp={commander.setCardExp}
                cardCvc={commander.cardCvc}
                setCardCvc={commander.setCardCvc}
                loading={commander.loading}
                error={commander.error}
                onSubmit={commander.submit}
                onBack={commander.prevStep}
                boutiqueId={boutiqueId}
                onFormuleChoisie={commander.setFormuleEchelonnement}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
