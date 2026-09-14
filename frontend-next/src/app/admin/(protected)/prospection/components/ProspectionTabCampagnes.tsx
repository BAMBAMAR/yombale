import { Send, Filter, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { Lead, TemplateMsg } from './types'
import { CATEGORIES_OPTIONS, SOURCES_OPTIONS, OPERATEURS_OPTIONS } from './utils'
import ProspectionCampagnePreview from './ProspectionCampagnePreview'

interface Props {
  campaignTargetLeads: Lead[]
  nbDejaContactes: number
  selectedLeadIds: string[]
  setSelectedLeadIds: (ids: string[]) => void
  catFilter: string
  setCatFilter: (c: string) => void
  statutFilter: string
  setStatutFilter: (s: string) => void
  sourceFilter: string
  setSourceFilter: (s: string) => void
  operateurFilter: string
  setOperateurFilter: (o: string) => void
  quartierFilter: string
  setQuartierFilter: (q: string) => void
  campagneLimit: number | 'tous'
  setCampagneLimit: (l: number | 'tous') => void
  eligibleLeadsCount: number
  uniqueQuartiers: string[]
  campagneTitre: string
  setCampagneTitre: (t: string) => void
  templates: TemplateMsg[]
  selectedTemplate: TemplateMsg
  setSelectedTemplate: (tpl: TemplateMsg) => void
  campagneMessage: string
  setCampagneMessage: (m: string) => void
  setCampagneCanal: (c: 'whatsapp' | 'email') => void
  isSending: boolean
  onLancerCampagne: (simulation: boolean) => void
  previewLead: {
    nom_boutique?: string | null
  }
  previewText: string
}

export default function ProspectionTabCampagnes({
  campaignTargetLeads,
  nbDejaContactes,
  selectedLeadIds,
  setSelectedLeadIds,
  catFilter,
  setCatFilter,
  statutFilter,
  setStatutFilter,
  sourceFilter,
  setSourceFilter,
  operateurFilter,
  setOperateurFilter,
  quartierFilter,
  setQuartierFilter,
  campagneLimit,
  setCampagneLimit,
  eligibleLeadsCount,
  uniqueQuartiers,
  campagneTitre,
  setCampagneTitre,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  campagneMessage,
  setCampagneMessage,
  setCampagneCanal,
  isSending,
  onLancerCampagne,
  previewLead,
  previewText,
}: Props) {
  const handleCategoryChange = (newCat: string) => {
    setCatFilter(newCat)
    let matching = templates.find((t) => t.categorie === newCat)
    if (!matching) {
      if (newCat === 'tous' || newCat === 'general' || newCat === 'divers') {
        matching = templates.find((t) => t.id === 'commerce_general' || t.id === 'carnet_dettes')
      } else if (newCat === 'auto-moto') {
        matching = templates.find((t) => t.id === 'auto_vehicules')
      } else if (newCat === 'immo') {
        matching = templates.find((t) => t.id === 'immo_agences')
      } else if (newCat === 'tech' || newCat === 'smartphones' || newCat === 'informatique' || newCat === 'tv-electro') {
        matching = templates.find((t) => t.id === 'tech_telephonie')
      } else if (newCat === 'grossiste') {
        matching = templates.find((t) => t.id === 'sourcing_alibaba')
      } else if (newCat === 'mode') {
        matching = templates.find((t) => t.id === 'mode_pret_a_porter')
      }
    }
    if (matching) {
      setSelectedTemplate(matching)
      setCampagneMessage(matching.texte)
      setCampagneCanal(matching.canal as 'whatsapp' | 'email')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
      {/* Éditeur de Campagne */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Send size={20} color="#16A34A" /> Configuration de la Campagne de Prospection
        </h2>

        {/* Bloc de Paramétrage du Ciblage & Audience */}
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px',
          marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#1C2B4A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color="#16A34A" /> 1. Paramétrer l&apos;Audience Cible :
            </span>

            <span style={{
              fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
              background: campaignTargetLeads.length > 0 ? '#DCFCE7' : '#FEE2E2',
              color: campaignTargetLeads.length > 0 ? '#166534' : '#991B1B',
            }}>
              {campaignTargetLeads.length} prospect{campaignTargetLeads.length > 1 ? 's' : ''} ciblé{campaignTargetLeads.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Statut de Protection Anti-Doublon & Déjà Contactés */}
          {nbDejaContactes > 0 ? (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#991B1B' }}>
                  {nbDejaContactes} prospect{nbDejaContactes > 1 ? 's' : ''} DÉJÀ CONTACTÉ{nbDejaContactes > 1 ? 'S' : ''} dans cette sélection
                </div>
                <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 1 }}>
                  Ils ont déjà reçu un message WhatsApp lors d&apos;une campagne précédente. Ils ne sont inclus que parce que vous avez explicitement élargi le filtre de statut ou coché leurs cases.
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>
                <strong>Protection Anti-Doublon Active :</strong> 100% des {campaignTargetLeads.length} prospects ciblés sont <strong>NOUVEAUX</strong> (jamais contactés). Aucun marchand déjà prospecté ne sera relancé sans votre accord.
              </span>
            </div>
          )}

          {selectedLeadIds.length > 0 ? (
            <div style={{
              padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                Mode Sélection Manuelle : <strong>{selectedLeadIds.length}</strong> prospect{selectedLeadIds.length > 1 ? 's' : ''} coché{selectedLeadIds.length > 1 ? 's' : ''} dans la table.
              </span>
              <button
                onClick={() => setSelectedLeadIds([])}
                style={{
                  padding: '4px 10px', background: '#fff', border: '1px solid #93C5FD',
                  borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#2563EB', cursor: 'pointer',
                }}
              >
                Basculer sur les filtres
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {/* Catégorie avec Auto-Sélection de Template */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Catégorie Métier
                </label>
                <select
                  value={catFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                >
                  {CATEGORIES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Statut
                </label>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                >
                  <option value="nouveau">Nouveau (Recommandé)</option>
                  <option value="tous">Tous les statuts</option>
                  <option value="contacte_wa">Contacté WhatsApp</option>
                  <option value="en_discussion">En discussion</option>
                  <option value="converti">Converti</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                >
                  {SOURCES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Opérateur */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Opérateur
                </label>
                <select
                  value={operateurFilter}
                  onChange={(e) => setOperateurFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                >
                  {OPERATEURS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Quartier */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Quartier / Marché
                </label>
                <select
                  value={quartierFilter}
                  onChange={(e) => setQuartierFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, background: '#fff' }}
                >
                  <option value="tous">Tous les quartiers</option>
                  {uniqueQuartiers.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {/* Limite d'envoi / Volume */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 3 }}>
                  Volume à envoyer
                </label>
                <select
                  value={campagneLimit}
                  onChange={(e) => setCampagneLimit(e.target.value === 'tous' ? 'tous' : Number(e.target.value))}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1',
                    fontSize: 12, fontWeight: 800, color: '#166534', background: '#F0FDF4',
                  }}
                >
                  <option value="tous">Tous les ciblés ({eligibleLeadsCount})</option>
                  <option value={10}>10 prospects</option>
                  <option value={25}>25 prospects</option>
                  <option value={50}>50 prospects (Recommandé / jour)</option>
                  <option value={100}>100 prospects</option>
                  <option value={200}>200 prospects</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 6 }}>
              2. Titre de la Campagne
            </label>
            <input
              type="text"
              value={campagneTitre}
              onChange={(e) => setCampagneTitre(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 6 }}>
              3. Choisir un Modèle Pré-Rédigé Adapté au Marché Sénégalais
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl)
                    setCampagneMessage(tpl.texte)
                    setCampagneCanal(tpl.canal as 'whatsapp' | 'email')
                  }}
                  style={{
                    padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                    border: selectedTemplate.id === tpl.id ? '2px solid #16A34A' : '1px solid #E2E8F0',
                    background: selectedTemplate.id === tpl.id ? '#F0FDF4' : '#F8FAFC',
                    color: selectedTemplate.id === tpl.id ? '#166534' : '#1C2B4A',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {tpl.titre}
                </button>
              ))}
            </div>
          </div>

          {/* Alerte de cohérence Métier vs Template */}
          {catFilter === 'auto-moto' && /tailles|modèles|collections|robes|vêtements/i.test(campagneMessage) && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                Vous ciblez les <strong>Véhicules</strong> mais le message sélectionné parle de <strong>Mode / Vêtements</strong>.
              </span>
              <button
                onClick={() => {
                  const autoTpl = templates.find((t) => t.id === 'auto_vehicules')
                  if (autoTpl) {
                    setSelectedTemplate(autoTpl)
                    setCampagneMessage(autoTpl.texte)
                  }
                }}
                style={{
                  padding: '4px 12px', background: '#fff', border: '1px solid #F59E0B',
                  borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#B45309', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Appliquer le template Véhicules
              </button>
            </div>
          )}

          {catFilter === 'immo' && /tailles|modèles|collections|robes|vêtements/i.test(campagneMessage) && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                Vous ciblez l&apos;<strong>Immobilier</strong> mais le message sélectionné parle de <strong>Mode / Vêtements</strong>.
              </span>
              <button
                onClick={() => {
                  const immoTpl = templates.find((t) => t.id === 'immo_agences')
                  if (immoTpl) {
                    setSelectedTemplate(immoTpl)
                    setCampagneMessage(immoTpl.texte)
                  }
                }}
                style={{
                  padding: '4px 12px', background: '#fff', border: '1px solid #F59E0B',
                  borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#B45309', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Appliquer le template Immobilier
              </button>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 6 }}>
              4. Corps du Message (Variables : {'{nom_boutique}'}, {'{prenom}'}, {'{quartier}'}, {'{lien_boutique}'} | Spintax Anti-Spam : {'{Salam|Bonjour|Hello}'})
            </label>
            <textarea
              rows={9}
              value={campagneMessage}
              onChange={(e) => setCampagneMessage(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1',
                fontSize: 13, outline: 'none', lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 11, flexWrap: 'wrap', gap: 6 }}>
              <div>
                {campagneMessage.length <= 190 ? (
                  <span style={{ color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <strong>Seuil optimal respecté ({campagneMessage.length}/190 car.)</strong> : 100% visible sans bouton « Voir plus » sur smartphone
                  </span>
                ) : (
                  <span style={{ color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <strong>Attention ({campagneMessage.length} car. — seuil recommandé 190)</strong> : risque d&apos;apparition de « ... Voir plus » sur mobile
                  </span>
                )}
              </div>
              <span style={{ color: '#64748B', fontWeight: 600 }}>
                Seuil anti-troncature mobile : max ~190 car.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => onLancerCampagne(true)}
              disabled={isSending}
              style={{
                flex: 1, padding: '12px 18px', background: '#F8FAFC', color: '#1C2B4A',
                border: '1px solid #CBD5E1', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer',
              }}
            >
              Tester en Mode Simulation
            </button>

            <button
              onClick={() => onLancerCampagne(false)}
              disabled={isSending}
              style={{
                flex: 1, padding: '12px 18px', background: '#16A34A', color: '#fff',
                border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14,
                cursor: isSending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              }}
            >
              {isSending ? 'Envoi en cours...' : 'Lancer la Campagne Réelle'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu en direct du message rendu */}
      <ProspectionCampagnePreview
        previewLead={previewLead}
        previewText={previewText}
      />
    </div>
  )
}
