import { History, RefreshCw } from 'lucide-react'

interface Props {
  loadingLogs: boolean
  campagnesList: any[]
  logs: any[]
  onRefreshLogs: () => void
}

export default function ProspectionTabLogs({
  loadingLogs,
  campagnesList,
  logs,
  onRefreshLogs,
}: Props) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={20} color="#64748B" /> Journal des Messages &amp; Campagnes Envoyés
        </h2>
        <button
          onClick={onRefreshLogs}
          style={{
            padding: '6px 12px', background: '#F8FAFC', border: '1px solid #CBD5E1',
            borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {loadingLogs ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>Chargement des logs...</p>
      ) : (
        <>
          {/* Récapitulatif des Campagnes */}
          {campagnesList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#334155', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                Récapitulatif des Campagnes ({campagnesList.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 800 }}>Date</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800 }}>Titre</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800 }}>Statut</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Ciblés</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Envoyés</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Succès</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Échecs</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Réponses</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Conversions</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800 }}>Diagnostic &amp; Événements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campagnesList.slice(0, 20).map((c: any) => {
                      const diag = c.diagnostic || {}
                      const isZeroSend = c.statut === 'terminee' && (c.nb_envoyes || 0) === 0 && (c.nb_succes || 0) === 0
                      const nbReps = c.nb_reponses || c.nb_en_discussion || diag.nb_reponses || 0
                      const nbConv = c.nb_convertis || diag.nb_convertis || 0
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', background: isZeroSend ? '#FFF7ED' : undefined }}>
                          <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {new Date(c.created_at).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1C2B4A', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.titre}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                              background: c.statut === 'terminee' ? (isZeroSend ? '#FEF3C7' : '#DCFCE7') : c.statut === 'en_cours' ? '#DBEAFE' : '#F1F5F9',
                              color: c.statut === 'terminee' ? (isZeroSend ? '#92400E' : '#166534') : c.statut === 'en_cours' ? '#1E40AF' : '#64748B',
                            }}>
                              {c.statut === 'terminee' ? (isZeroSend ? '0 envoi' : 'Terminée') : c.statut === 'en_cours' ? 'En cours' : c.statut}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>{c.nb_total || 0}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center', color: (c.nb_envoyes || 0) > 0 ? '#2563EB' : '#94A3B8' }}>{c.nb_envoyes || 0}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center', color: (c.nb_succes || 0) > 0 ? '#16A34A' : '#94A3B8' }}>{c.nb_succes || 0}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center', color: (c.nb_echecs || 0) > 0 ? '#DC2626' : '#94A3B8' }}>{c.nb_echecs || 0}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>
                            {nbReps > 0 ? (
                              <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                                {nbReps}
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>0</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>
                            {nbConv > 0 ? (
                              <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                                {nbConv} boutique{nbConv > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 11, color: isZeroSend ? '#B45309' : '#64748B', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {diag.message || (isZeroSend ? 'Tous les prospects étaient déjà contactés' : diag.nb_ignores ? `${diag.nb_ignores} doublons ignorés` : '—')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Journal des Messages Individuels */}
          {logs.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>Aucun message envoyé pour l&apos;instant.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#334155', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                Messages Individuels ({logs.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Destinataire</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Canal</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Extrait Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1C2B4A' }}>
                        {log.nom_boutique || log.destinataire}
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: 11, fontWeight: 800 }}>
                        {log.canal}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                          background: log.statut === 'envoye' ? '#DCFCE7' : log.statut === 'livre' ? '#D1FAE5' : log.statut === 'lu' ? '#DBEAFE' : log.statut === 'simule' ? '#EFF6FF' : '#FEE2E2',
                          color: log.statut === 'envoye' ? '#166534' : log.statut === 'livre' ? '#065F46' : log.statut === 'lu' ? '#1E40AF' : log.statut === 'simule' ? '#1E40AF' : '#991B1B',
                        }}>
                          {log.statut}
                        </span>
                        {log.erreur && (
                          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4, maxWidth: 220, lineHeight: 1.25, fontWeight: 500 }}>
                            {log.erreur}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message_envoye}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
