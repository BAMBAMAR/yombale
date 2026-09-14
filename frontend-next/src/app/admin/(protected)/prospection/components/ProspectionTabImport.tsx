import { Layers, Zap, RefreshCw, ExternalLink, Info } from 'lucide-react'
import type { DorkingRequete, AutoCollecteResult } from './types'

interface Props {
  rawImportText: string
  setRawImportText: (t: string) => void
  importCat: string
  setImportCat: (c: string) => void
  importVille: string
  setImportVille: (v: string) => void
  importQuartier: string
  setImportQuartier: (q: string) => void
  isImporting: boolean
  onImportVrac: () => void
  isAutoCollecting: boolean
  collectingTarget: string | null
  autoCollecteResult: AutoCollecteResult | null
  onLancerAutoCollecte: (source: 'all' | 'osm' | 'dorking', target?: string) => void
  dorking: DorkingRequete[]
}

export default function ProspectionTabImport({
  rawImportText,
  setRawImportText,
  importCat,
  setImportCat,
  importVille,
  setImportVille,
  importQuartier,
  setImportQuartier,
  isImporting,
  onImportVrac,
  isAutoCollecting,
  collectingTarget,
  autoCollecteResult,
  onLancerAutoCollecte,
  dorking,
}: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Bloc 1 : Importateur de texte brut & Groupes WhatsApp */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={20} color="#16A34A" /> Importeur Intelligent (Numéros &amp; Textes en Vrac)
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
          Collez une liste de contacts exportés d&apos;un groupe WhatsApp, d&apos;un fichier CSV ou d&apos;un message brut. Le système extrait et normalise automatiquement les numéros <strong>+221 (Orange, Free, Expresso)</strong> sans doublon.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea
            rows={8}
            placeholder={`Collez vos contacts ici, par exemple :
Fatou Mode HLM - 77 123 45 67
Ibrahima Tech Sandaga - 78 555 44 33
+221 76 987 65 43, contact@boutique.sn
Boutique Parcelles, 70 111 22 33`}
            value={rawImportText}
            onChange={(e) => setRawImportText(e.target.value)}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #CBD5E1',
              fontSize: 13, fontFamily: 'monospace', outline: 'none', resize: 'vertical',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Catégorie par défaut
              </label>
              <select
                value={importCat}
                onChange={(e) => setImportCat(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value="mode">Mode &amp; Prêt-à-porter</option>
                <option value="tech">Téléphonie &amp; Tech</option>
                <option value="superette">Alimentation</option>
                <option value="quincaillerie">Quincaillerie</option>
                <option value="cosmetique">Cosmétique</option>
                <option value="grossiste">Grossiste Chine</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Ville
              </label>
              <input
                type="text"
                value={importVille}
                onChange={(e) => setImportVille(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Quartier / Marché
              </label>
              <input
                type="text"
                value={importQuartier}
                onChange={(e) => setImportQuartier(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <button
            onClick={onImportVrac}
            disabled={isImporting}
            style={{
              background: '#16A34A', color: '#fff', border: 'none', padding: '12px 18px',
              borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: isImporting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isImporting ? 'Extraction en cours...' : 'Extraire & Importer les Leads'}
          </button>
        </div>
      </div>

      {/* Bloc 2 : Requêtes Google Dorking & Réseaux Sociaux + Auto-Collecteur */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px' }}>
        {/* Bannière Auto-Collecte Intelligente Sans Navigateur */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A, #1E293B)',
          borderRadius: 14, padding: '20px 22px', color: '#fff',
          marginBottom: 24, boxShadow: '0 4px 15px rgba(15, 23, 42, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ maxWidth: 650 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Zap size={22} color="#FBBF24" />
                <span style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC' }}>
                  Auto-Collecte Intelligente Directe (Zéro Impact RAM Render)
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px', borderRadius: 20
                }}>
                  &lt; 3 Mo RAM
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Aspire automatiquement les commerces réels de Dakar (OpenStreetMap Places &amp; Dorking API) sans lancer aucun navigateur lourd Chromium. Consomme moins de 3 Mo de mémoire pour protéger à 100% votre serveur Render.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => onLancerAutoCollecte('osm')}
                disabled={isAutoCollecting}
                style={{
                  padding: '10px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                  fontWeight: 800, fontSize: 13, cursor: isAutoCollecting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
              >
                Places Dakar (Gratuit)
              </button>

              <button
                onClick={() => onLancerAutoCollecte('all')}
                disabled={isAutoCollecting}
                style={{
                  padding: '10px 20px', background: '#10B981', color: '#fff',
                  border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 13,
                  cursor: isAutoCollecting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Zap size={16} />
                {isAutoCollecting ? 'Collecte en cours (2-3s)...' : 'Lancer Tout (A + B)'}
              </button>
            </div>
          </div>

          {/* Résultat visuel si exécuté */}
          {autoCollecteResult && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: (autoCollecteResult.totalAjoutes || 0) > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${(autoCollecteResult.totalAjoutes || 0) > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {(autoCollecteResult.totalAjoutes || 0) > 0 ? (
                  <span><strong>+{autoCollecteResult.totalAjoutes} nouveaux commerces ajoutés</strong> avec succès dans votre base CRM ! ({autoCollecteResult.totalIgnores} déjà présents ou filtrés)</span>
                ) : (
                  <span><Info size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /><strong>Votre base CRM est 100% à jour !</strong> Les {autoCollecteResult.totalTraites || autoCollecteResult.totalIgnores || 0} commerces analysés sont déjà tous enregistrés dans votre base sans doublon.</span>
                )}
              </span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>
                Exécuté en {Math.round((autoCollecteResult.dureeMs || 0) / 100) / 10}s • RAM: +{autoCollecteResult.ramDeltaMb || 0} Mo
              </span>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          gap: 12, margin: '0 0 16px'
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="#F59E0B" /> Auto-Aspiration Directe par Réseaux &amp; Marketplaces (1-Clic)
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Aspirez automatiquement les vendeurs et boutiques de Dakar en base CRM avec numéros WhatsApp vérifiés, sans aucun effort manuel.
            </p>
          </div>

          {/* Master Button pour tout aspirer en 1 clic */}
          <button
            onClick={() => onLancerAutoCollecte('dorking', 'all')}
            disabled={isAutoCollecting}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
              cursor: isAutoCollecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s',
              opacity: isAutoCollecting ? 0.7 : 1
            }}
          >
            {isAutoCollecting && (collectingTarget === 'all' || !collectingTarget) ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Aspiration globale en cours...
              </>
            ) : (
              <>
                <Zap size={16} />
                TOUT ASPIRER EN 1 CLIC (5 Canaux)
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dorking.map((req, idx) => {
            const isThisTargetCollecting = isAutoCollecting && (collectingTarget === req.key || collectingTarget === 'all')
            const platformColors: Record<string, { bg: string; text: string; border: string }> = {
              Instagram: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
              TikTok: { bg: '#F1F5F9', text: '#0F172A', border: '#CBD5E1' },
              'Google Maps': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
              Facebook: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
            }
            const platStyle = platformColors[req.plateforme] || { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }

            return (
              <div key={idx} style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 14, color: '#1C2B4A' }}>
                      {req.titre}
                    </strong>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12,
                      background: platStyle.bg, color: platStyle.text, border: `1px solid ${platStyle.border}`
                    }}>
                      {req.plateforme}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', display: 'block' }}>
                    {req.query.slice(0, 60)}...
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onLancerAutoCollecte('dorking', req.key || 'all')}
                    disabled={isAutoCollecting}
                    style={{
                      padding: '8px 14px',
                      background: isThisTargetCollecting ? '#10B981' : '#1E293B',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isAutoCollecting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {isThisTargetCollecting ? (
                      <>
                        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        Aspiration en cours...
                      </>
                    ) : (
                      <>
                        <Zap size={13} color="#FBBF24" />
                        Aspirer ce canal (IA)
                      </>
                    )}
                  </button>

                  <a
                    href={req.urlGoogle}
                    target="_blank"
                    rel="noreferrer"
                    title="Ouvrir la recherche sur Google pour inspection manuelle"
                    style={{
                      padding: '7px 11px',
                      background: '#fff',
                      color: '#64748B',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.2s'
                    }}
                  >
                    Inspecter <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
