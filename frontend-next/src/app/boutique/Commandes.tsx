'use client'

import { useState } from 'react'
import { updateStatutCommande } from './actions'
import { ZonesView } from './Comptabilite'
import { useTranslation } from '@/i18n/context'
import { useScrollNudge } from '@/hooks/useScrollNudge'
import ModalNouvelleCommandeWave from './ModalNouvelleCommandeWave'
import ModalDispatchLivreur from './ModalDispatchLivreur'
import ModalRetourCommande from './ModalRetourCommande'
import type { Commande } from './commandes/types'
import { regrouperCommandes } from './commandes/types'
import { useCommandesData } from './commandes/useCommandesData'
import CommandesToolbar from './commandes/CommandesToolbar'
import CommandeCard from './commandes/CommandeCard'
import CommandeGroupeCard from './commandes/CommandeGroupeCard'
import PanierAbandonneList from './commandes/PanierAbandonneList'

export default function Commandes({
  boutiqueId,
  boutique,
}: {
  boutiqueId: string
  boutique?: any
}) {
  const { t, formatNumber } = useTranslation()
  const [dispatchCommande, setDispatchCommande] = useState<Commande | null>(null)
  const [retourCommande, setRetourCommande] = useState<Commande | null>(null)
  const [showModalNouvelleCommande, setShowModalNouvelleCommande] = useState(false)

  const { scrollRef, scrollToCenter } = useScrollNudge()

  const {
    subTab,
    setSubTab,
    commandes,
    commandesFiltrees,
    paniersAbandonnes,
    loading,
    filtre,
    setFiltre,
    filtreCanal,
    setFiltreCanal,
    load,
    relancerWhatsApp,
    exportCommandesCSV,
    exportCommandesPDF,
  } = useCommandesData(boutiqueId, t)

  const filtreStatuts = [
    { key: '', label: t('common.all') },
    { key: 'en_attente', label: t('shop.statusPending') },
    { key: 'confirmee', label: t('shop.statusConfirmed') },
    { key: 'en_preparation', label: t('shop.statusPreparing') },
    { key: 'expediee', label: t('shop.statusShipped') },
    { key: 'livree', label: t('shop.statusDelivered') },
    { key: 'annulee', label: t('shop.statusCancelled') },
  ]

  const stats = {
    en_attente: commandes.filter((c) => c.statut === 'en_attente').length,
    total: commandes.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CommandesToolbar
        subTab={subTab}
        setSubTab={setSubTab}
        onNouvelleCommande={() => setShowModalNouvelleCommande(true)}
        pendingCount={stats.en_attente}
        filtre={filtre}
        setFiltre={setFiltre}
        filtreCanal={filtreCanal}
        setFiltreCanal={setFiltreCanal}
        totalOrdersCount={commandes.length}
        filtreStatuts={filtreStatuts}
        onExportCSV={exportCommandesCSV}
        onExportPDF={exportCommandesPDF}
        scrollRef={scrollRef}
        scrollToCenter={scrollToCenter}
        t={t}
        formatNumber={formatNumber}
      />

      {subTab === 'zones' ? (
        <ZonesView boutiqueId={boutiqueId} />
      ) : (
        <>
          {loading ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              aria-busy="true"
              aria-label={t('common.loading')}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
              ))}
            </div>
          ) : filtre === 'abandonne' ? (
            <PanierAbandonneList
              paniers={paniersAbandonnes}
              onRelancerWhatsApp={relancerWhatsApp}
              t={t}
            />
          ) : commandesFiltrees.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed #d1d5db',
              }}
            >
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                {t('shop.noOrdersFound')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {regrouperCommandes(commandesFiltrees).map((item, i) =>
                Array.isArray(item) ? (
                  <CommandeGroupeCard
                    key={item[0].groupe_commande ?? i}
                    commandes={item}
                    boutiqueId={boutiqueId}
                    onUpdate={load}
                    onDispatch={setDispatchCommande}
                    onRetour={setRetourCommande}
                  />
                ) : (
                  <CommandeCard
                    key={item.id}
                    commande={item}
                    boutiqueId={boutiqueId}
                    onUpdate={load}
                    onDispatch={setDispatchCommande}
                    onRetour={setRetourCommande}
                  />
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Nouvelle Commande & Lien Wave */}
      <ModalNouvelleCommandeWave
        boutiqueId={boutiqueId}
        isOpen={showModalNouvelleCommande}
        onClose={() => setShowModalNouvelleCommande(false)}
        onSuccess={load}
      />

      {/* Modal Dispatch Livreur Moto */}
      <ModalDispatchLivreur
        isOpen={Boolean(dispatchCommande)}
        onClose={() => setDispatchCommande(null)}
        commande={dispatchCommande}
        boutique={boutique || { nom: 'Ma Boutique', adresse: 'Point de retrait', ville: 'Dakar' }}
        onMarquerExpediee={(cId) => {
          updateStatutCommande(boutiqueId, cId, 'expediee').then(() => load())
        }}
      />

      {/* Modal Déclaration de Retour & Bon d'Avoir */}
      <ModalRetourCommande
        isOpen={Boolean(retourCommande)}
        onClose={() => setRetourCommande(null)}
        commande={retourCommande}
        boutiqueId={boutiqueId}
        onSuccess={() => {
          setRetourCommande(null)
          load()
        }}
      />
    </div>
  )
}
