'use client'

import React from 'react'
import { CommanderModalProps } from './commander/types'
import { useCommander } from './commander/useCommander'
import CommanderHeader from './commander/CommanderHeader'
import CommanderWhatsappView from './commander/CommanderWhatsappView'
import CommanderSuccessView from './commander/CommanderSuccessView'
import CommanderFormView from './commander/CommanderFormView'

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
          ) : commander.success ? (
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
          ) : (
            <CommanderFormView
              produit={produit}
              quantite={commander.quantite}
              setQuantite={commander.setQuantite}
              nom={commander.nom}
              setNom={commander.setNom}
              tel={commander.tel}
              setTel={commander.setTel}
              adresse={commander.adresse}
              setAdresse={commander.setAdresse}
              zoneId={commander.zoneId}
              setZoneId={commander.setZoneId}
              zones={commander.zones}
              zoneSelectionnee={commander.zoneSelectionnee}
              reductionClubVip={commander.reductionClubVip}
              clubVip={commander.clubVip}
              paiement={commander.paiement}
              setPaiement={commander.setPaiement}
              deviseStripe={commander.deviseStripe}
              setDeviseStripe={commander.setDeviseStripe}
              cardNumber={commander.cardNumber}
              setCardNumber={commander.setCardNumber}
              cardExp={commander.cardExp}
              setCardExp={commander.setCardExp}
              cardCvc={commander.cardCvc}
              setCardCvc={commander.setCardCvc}
              codePromo={commander.codePromo}
              setCodePromo={commander.setCodePromo}
              promoApplique={commander.promoApplique}
              promoLoading={commander.promoLoading}
              promoError={commander.promoError}
              appliquerCodePromo={commander.appliquerCodePromo}
              removePromo={commander.removePromo}
              crossSell={commander.crossSell}
              selectedAddons={commander.selectedAddons}
              toggleAddon={commander.toggleAddon}
              note={commander.note}
              setNote={commander.setNote}
              sousTotal={commander.sousTotal}
              sousTotalMain={commander.sousTotalMain}
              fraisLivraison={commander.fraisLivraison}
              total={commander.total}
              loading={commander.loading}
              error={commander.error}
              onSubmit={commander.submit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
