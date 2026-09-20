import { Ban, RefreshCw, Download, ShieldAlert, Search, Lock, Unlock } from 'lucide-react'
import type { BlacklistItem } from './types'

interface Props {
  loadingBlacklist: boolean
  onRefreshBlacklist: () => void
  onExportCSV: () => void
  onOpenAddModal: () => void
  blacklistSearch: string
  setBlacklistSearch: (s: string) => void
  filteredBlacklist: BlacklistItem[]
  onRemoveBlacklist: (phone: string) => void
}

export default function ProspectionTabBlacklist({
  loadingBlacklist,
  onRefreshBlacklist,
  onExportCSV,
  onOpenAddModal,
  blacklistSearch,
  setBlacklistSearch,
  filteredBlacklist,
  onRemoveBlacklist,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête & Actions Blacklist */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ban size={22} color="#DC2626" /> Gestion de la Liste Noire &amp; Conformité Anti-Spam
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Tous les numéros ayant répondu <code>STOP</code> sur WhatsApp ou désinscrits manuellement sont enregistrés ici.
            Le système vérifie cette liste et <strong>bloque tout envoi automatique ou relance</strong> vers ces contacts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onRefreshBlacklist}
            disabled={loadingBlacklist}
            style={{
              background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px 16px',
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <RefreshCw size={16} className={loadingBlacklist ? 'animate-spin' : ''} />
            <span>{loadingBlacklist ? 'Actualisation...' : 'Actualiser'}</span>
          </button>

          <button
            onClick={onExportCSV}
            style={{
              background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px 16px',
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            style={{
              background: '#DC2626', color: '#fff', border: 'none', padding: '10px 18px',
              borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
            }}
          >
            <ShieldAlert size={16} />
            <span>Ajouter à la Blacklist</span>
          </button>
        </div>
      </div>

      {/* Barre de Recherche Blacklist */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Rechercher par numéro de téléphone, motif, nom de boutique ou contact..."
            value={blacklistSearch}
            onChange={(e) => setBlacklistSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1',
              fontSize: 14, outline: 'none',
            }}
          />
        </div>

        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
          <strong>{filteredBlacklist.length}</strong> numéro{filteredBlacklist.length > 1 ? 's' : ''} sur liste noire
        </span>
      </div>

      {/* Tableau Blacklist */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>Numéro Blacklisté</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>Boutique / Contact Lié</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>Motif du Blocage</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>Date d&apos;Inscription</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>Statut Sécurité</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlacklist.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    {loadingBlacklist ? 'Chargement de la liste noire...' : 'Aucun numéro sur la liste noire.'}
                  </td>
                </tr>
              ) : (
                filteredBlacklist.map((item) => (
                  <tr key={item.phone} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14, color: '#DC2626' }}>+{item.phone}</strong>
                        {item.operateur && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626' }}>
                            {item.operateur}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.nom_boutique ? (
                        <div>
                          <strong style={{ color: '#1C2B4A' }}>{item.nom_boutique}</strong>
                          {item.contact_nom && <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>{item.contact_nom}</span>}
                          {item.quartier && <span style={{ fontSize: 11, color: '#94A3B8' }}>{item.quartier}</span>}
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Non renseigné dans le CRM</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
                        display: 'inline-block',
                      }}>
                        {item.reason === 'optout' ? 'STOP WhatsApp (Opt-Out)' : item.reason}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748B' }}>
                      {new Date(item.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <Lock size={12} /> Bloqué (0 envoi)
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => onRemoveBlacklist(item.phone)}
                        title="Débloquer et retirer de la liste noire"
                        style={{
                          padding: '6px 12px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                          borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <Unlock size={13} /> Débloquer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
