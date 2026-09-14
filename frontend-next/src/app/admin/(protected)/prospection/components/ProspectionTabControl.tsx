import { RefreshCw, Sparkles, Zap, Send, MessageSquare, Store, PackagePlus, Ban } from 'lucide-react'
import type { ScrapingResult, RelancesResult } from './types'

interface Props {
  loadingCronData: boolean
  onFetchCronStatus: () => void
  scrapingZone: string
  setScrapingZone: (z: string) => void
  scrapingLimite: number
  setScrapingLimite: (l: number) => void
  isScraping: boolean
  scrapingResult: ScrapingResult | null
  onRunScraping: () => void
  isRelancing: boolean
  relancesResult: RelancesResult | null
  onRunRelances: (type?: string) => void
  cronData: any
}

export default function ProspectionTabControl({
  loadingCronData,
  onFetchCronStatus,
  scrapingZone,
  setScrapingZone,
  scrapingLimite,
  setScrapingLimite,
  isScraping,
  scrapingResult,
  onRunScraping,
  isRelancing,
  relancesResult,
  onRunRelances,
  cronData,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Actions & Refresh */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 4px' }}>
            Centre de Contrôle &amp; Automatisations en Direct
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Déclenchez manuellement le scraping de prospection, lancez les vagues de relance WhatsApp et suivez l&apos;état des crons d&apos;arrière-plan.
          </p>
        </div>

        <button
          onClick={onFetchCronStatus}
          disabled={loadingCronData}
          style={{
            background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px 16px',
            borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <RefreshCw size={16} className={loadingCronData ? 'animate-spin' : ''} />
          <span>{loadingCronData ? 'Actualisation...' : 'Actualiser le statut'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* CARTE 1 : SCRAPER DE PROSPECTION DAKAR */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color="#2563EB" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                Scraping &amp; Sourcing de Marchés
              </h3>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Collecte de commerces ciblés par zone
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Zone / Marché cible
              </label>
              <select
                value={scrapingZone}
                onChange={(e) => setScrapingZone(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value="Sandaga">Marché Sandaga (Tech / Téléphonie)</option>
                <option value="HLM">Marché HLM (Mode / Bazin)</option>
                <option value="Centenaire">Centenaire / Allées (Grossistes Chine)</option>
                <option value="Colobane">Colobane (Électronique)</option>
                <option value="Plateau">Dakar Plateau (Boutiques &amp; Luxe)</option>
                <option value="Maristes">Les Maristes (Alimentation &amp; Supérettes)</option>
                <option value="Tilène">Marché Tilène (Cosmétique &amp; Beauté)</option>
                <option value="Thiès">Thiès (Commerce Général)</option>
                <option value="Touba">Touba (Commerces &amp; Quincaillerie)</option>
                <option value="all">Tout Dakar &amp; Régions</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Limite
              </label>
              <select
                value={scrapingLimite}
                onChange={(e) => setScrapingLimite(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value={10}>10 leads</option>
                <option value={30}>30 leads</option>
                <option value={50}>50 leads</option>
                <option value={100}>100 leads</option>
              </select>
            </div>
          </div>

          <button
            onClick={onRunScraping}
            disabled={isScraping}
            style={{
              padding: '12px 18px', background: '#2563EB', color: '#fff', border: 'none',
              borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: isScraping ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Zap size={18} />
            <span>{isScraping ? 'Scraping en cours...' : 'Lancer le Scraping Immédiat'}</span>
          </button>

          {scrapingResult && (
            <div style={{
              padding: 14,
              background: scrapingResult.succes === false ? '#FEF2F2' : '#EFF6FF',
              border: scrapingResult.succes === false ? '1px solid #FECACA' : '1px solid #BFDBFE',
              borderRadius: 10,
              fontSize: 13,
              color: scrapingResult.succes === false ? '#991B1B' : '#1E40AF',
            }}>
              <strong>{scrapingResult.succes === false ? 'Erreur de Scraping :' : 'Résultat du Scraping :'}</strong>
              {scrapingResult.error ? (
                <p style={{ margin: '4px 0 0' }}>{scrapingResult.error}</p>
              ) : (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                  <li><strong>{scrapingResult.ajoutes}</strong> nouveaux leads injectés dans le CRM</li>
                  <li><strong>{scrapingResult.ignores}</strong> doublons ou numéros invalides écartés</li>
                  <li>Total annonces analysées : <strong>{scrapingResult.totalScrapes ?? 0}</strong></li>
                  <li>Zone traitée : <strong>{scrapingResult.zone}</strong></li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* CARTE 2 : DÉCLENCHEUR DES RELANCES AUTOMATIQUES */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={22} color="#16A34A" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                Relances Automatisées WhatsApp
              </h3>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Dettes clients &amp; Abonnements marchands
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => onRunRelances('marchands')}
              disabled={isRelancing}
              style={{
                padding: '11px 16px', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#1E293B',
                borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: isRelancing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>Relances Marchands (J+1, J+7, J+25)</span>
              <span style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>Exécuter</span>
            </button>

            <button
              onClick={() => onRunRelances('dettes')}
              disabled={isRelancing}
              style={{
                padding: '11px 16px', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#1E293B',
                borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: isRelancing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>Relances Carnet de Dettes (&quot;Bor&quot;)</span>
              <span style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>Exécuter</span>
            </button>

            <button
              onClick={() => onRunRelances('tout')}
              disabled={isRelancing}
              style={{
                padding: '12px 18px', background: '#16A34A', color: '#fff', border: 'none',
                borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: isRelancing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
              }}
            >
              <RefreshCw size={18} className={isRelancing ? 'animate-spin' : ''} />
              <span>{isRelancing ? 'Envoi en cours...' : 'Tout Exécuter Maintenant'}</span>
            </button>
          </div>

          {relancesResult && (
            <div style={{ padding: 14, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, fontSize: 13, color: '#065F46' }}>
              <strong>Rapport d&apos;exécution des relances :</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                {relancesResult.resultats?.marchands?.stats && (
                  <li>
                    Marchands relancés : <strong>{relancesResult.resultats.marchands.stats.total}</strong> (J+1: {relancesResult.resultats.marchands.stats.j1}, J+7: {relancesResult.resultats.marchands.stats.j7}, J+25: {relancesResult.resultats.marchands.stats.j25})
                  </li>
                )}
                {relancesResult.resultats?.dettes && (
                  <li>
                    Clients débiteurs relancés : <strong>{relancesResult.resultats.dettes.relancesEnvoyees}</strong>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 : ASSISTANT MARCHAND & SÉCURITÉ */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="#9333EA" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
              Assistant Marchand WhatsApp (&quot;Bot Taf-Taf&quot; &amp; &quot;+produit&quot;)
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Commandes conversationnelles directes et gestion de catalogue
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Store size={18} color="#16A34A" />
              <strong style={{ fontSize: 14, color: '#1E293B' }}>Création de Boutique en 30s</strong>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5 }}>
              Un commerçant tape <code>créer boutique</code> sur WhatsApp. Le bot lui demande son nom, quartier et secteur, puis génère automatiquement sa vitrine en ligne avec 30 jours offerts.
            </p>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '3px 8px', borderRadius: 6 }}>
              Opérationnel 24h/24
            </span>
          </div>

          <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <PackagePlus size={18} color="#2563EB" />
              <strong style={{ fontSize: 14, color: '#1E293B' }}>Ajout de Produit Sécurisé (+produit)</strong>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5 }}>
              Un marchand tape <code>+produit</code> pour ajouter un article à son catalogue. Le système vérifie en base que son numéro est bien celui du propriétaire avant d&apos;autoriser l&apos;ajout.
            </p>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
              Contrôle de Propriété Sécurisé
            </span>
          </div>

          <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ban size={18} color="#DC2626" />
              <strong style={{ fontSize: 14, color: '#1E293B' }}>Désinscription Stricte (STOP)</strong>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5 }}>
              Si un destinataire répond <code>STOP</code>, son numéro est immédiatement inscrit dans la table de blacklist et marqué <em>désinscrit</em> dans le CRM. Aucun message futur ne lui est envoyé.
            </p>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '3px 8px', borderRadius: 6 }}>
              Blacklist Instantanée
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4 : MONITORING DES CRONS SYSTÈME */}
      {cronData && (
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
              État des Crons d&apos;Arrière-Plan &amp; Statistiques Globales
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Blacklist active : <strong>{cronData.stats?.blacklist || 0}</strong> numéros protégés
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {cronData.crons && Object.entries(cronData.crons).map(([key, item]: [string, any]) => (
              <div key={key} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13, color: '#1E293B' }}>{item.nom}</strong>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>
                    {item.statut}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 6px' }}>{item.description}</p>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Fréquence : {item.frequence}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
