import { FileText, Pencil, MessageSquare, Trash2 } from 'lucide-react'
import type { Lead } from './types'
import { STATUT_LABELS, OPERATEUR_COLORS, SOUS_PROFIL_BADGES } from './utils'

interface Props {
  filteredLeads: Lead[]
  sortedFilteredLeads: Lead[]
  selectedLeadIds: string[]
  onSelectAll: (checked: boolean) => void
  onToggleSelect: (id: string) => void
  onStatutChange: (leadId: string, newStatut: string) => void
  onDeleteLead: (leadId: string) => void
  onOpenEditModal: (lead: Lead) => void
}

export default function ProspectionCrmTable({
  filteredLeads,
  sortedFilteredLeads,
  selectedLeadIds,
  onSelectAll,
  onToggleSelect,
  onStatutChange,
  onDeleteLead,
  onOpenEditModal,
}: Props) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '14px 16px', width: 40 }}>
                <input
                  type="checkbox"
                  checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Boutique &amp; Contact</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Numéro &amp; Opérateur</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Catégorie / Zone</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Statut</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Source</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, whiteSpace: 'nowrap' }}>Score / Fit</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions 1-Clic</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                  Aucun prospect trouvé. Utilisez <strong>« Auto-Sourcing Annonces »</strong> ou <strong>« Import Vrac »</strong> pour alimenter votre base.
                </td>
              </tr>
            ) : (
              sortedFilteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id)
                const st = STATUT_LABELS[lead.statut] || STATUT_LABELS.nouveau
                const op = OPERATEUR_COLORS[lead.operateur] || OPERATEUR_COLORS.Autre
                const waDirectUrl = `https://wa.me/${lead.telephone}?text=${encodeURIComponent(
                  `Salam ${lead.nom_boutique} ! J'ai vu vos magnifiques articles. Avez-vous pensé à créer votre boutique en ligne avec paiement Wave direct et 0% commission ? 30 jours offerts : https://nopalou.com`
                )}`

                const sc = lead.score || 0
                const fc = lead.fit_score || 0
                const scColor = sc >= 70 ? '#16A34A' : sc >= 40 ? '#D97706' : '#DC2626'
                const fcColor = fc >= 70 ? '#7C3AED' : fc >= 40 ? '#2563EB' : '#94A3B8'

                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? '#F0FDF4' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(lead.id)}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ fontSize: 14, color: '#1C2B4A', display: 'block' }}>
                        {lead.nom_boutique}
                      </strong>
                      {lead.contact_nom && (
                        <span style={{ fontSize: 12, color: '#64748B' }}>{lead.contact_nom}</span>
                      )}
                      {lead.notes && (
                        <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', fontStyle: 'italic', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <FileText size={11} style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline' }} />{lead.notes}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: '#1C2B4A' }}>+{lead.telephone}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                          background: op.bg, color: op.color,
                        }}>
                          {lead.operateur}
                        </span>
                      </div>
                      {lead.email && (
                        <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>{lead.email}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>
                          {lead.categorie}
                        </span>
                        {lead.sous_profil && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: SOUS_PROFIL_BADGES[lead.sous_profil]?.bg || '#F1F5F9',
                            color: SOUS_PROFIL_BADGES[lead.sous_profil]?.color || '#475569',
                            whiteSpace: 'nowrap',
                          }}>
                            {SOUS_PROFIL_BADGES[lead.sous_profil]?.label || lead.sous_profil}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginTop: 2 }}>
                        {lead.quartier || lead.ville}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={lead.statut}
                        onChange={(e) => onStatutChange(lead.id, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                          background: st.bg, color: st.color, border: `1px solid ${st.color}40`,
                          cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="nouveau">Nouveau</option>
                        <option value="contacte_wa">Contacté WA</option>
                        <option value="contacte_email">Contacté Email</option>
                        <option value="en_discussion">En discussion</option>
                        <option value="converti">Converti</option>
                        <option value="sans_reponse">Sans Réponse</option>
                        <option value="desinscrit">Désinscrit</option>
                        <option value="invalide">Invalide</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
                        {lead.source}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: 110 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: scColor, minWidth: 22 }}>{sc}</span>
                          <div style={{ flex: 1, background: '#E2E8F0', borderRadius: 4, height: 5 }}>
                            <div style={{ width: `${sc}%`, background: scColor, borderRadius: 4, height: 5 }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: fcColor, minWidth: 22 }}>{fc}</span>
                          <div style={{ flex: 1, background: '#E2E8F0', borderRadius: 4, height: 5 }}>
                            <div style={{ width: `${fc}%`, background: fcColor, borderRadius: 4, height: 5 }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          onClick={() => onOpenEditModal(lead)}
                          title="Modifier ce prospect dans la base"
                          style={{
                            padding: '8px', background: '#F8FAFC', color: '#64748b', border: '1px solid #e2e8f0',
                            borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <a
                          href={waDirectUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '8px 14px', background: '#16A34A', color: '#fff', borderRadius: 8,
                            fontSize: 13, fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 4px 12px rgba(22,163,74,0.3)', transition: 'transform 0.1s'
                          }}
                        >
                          <MessageSquare size={15} /> Relancer
                        </a>
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          title="Supprimer ce prospect"
                          style={{
                            padding: '8px', background: '#FEE2E2', color: '#DC2626', border: 'none',
                            borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
