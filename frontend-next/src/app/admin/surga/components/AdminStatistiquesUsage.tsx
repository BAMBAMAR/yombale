'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Users, Activity, UserPlus, CreditCard, FileText, Bell, Briefcase, RefreshCw, Info, AlertCircle } from 'lucide-react'

interface Jour { jour: string; configurations: number; contenus: number }
interface Classement { libelle: string; n: number }
interface Statistiques {
  periode_jours: number
  comptes: { total: number | null; actifs_24h: number | null; actifs_7j: number | null; actifs_30j: number | null; nouveaux_periode: number | null; payeurs: number | null; taux_payeurs_pct: number | null }
  serie: Jour[]
  contenus: { notes: number; notes_periode: number; depenses: number; depenses_periode: number; rappels: number; rappels_periode: number } | null
  abonnements: { actifs?: number; en_attente?: number; encaisse_xof?: number; encaisse_periode_xof?: number }
  preferences: { modules: Classement[]; quartiers: Classement[]; heures: Classement[]; audio_actif: number | null; notifications_activees: number | null }
  rappels_envoyes: { envoyes: number; echecs: number } | null
  emploi: { documents: { cv: number; lettres: number; periode: number } | null; profils: number | null }
  suivis: { demarches: number | null; concours: number | null; alertes_immo_actives: number | null; adresses_favorites: number | null; abonnements_videos: number | null }
  presse: { derniere_depeche: string | null; depeches_24h: number; derniere_une: string | null } | null
  trafic: { en_attente: number; periode: number } | null
  non_mesure: string[]
}

const PERIODES = [7, 30, 90]
const nombre = (v: number | null | undefined) => (v == null ? null : new Intl.NumberFormat('fr-FR').format(v))
const fcfa = (v: number | null | undefined) => (v == null ? null : `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`)
const dateCourte = (iso: string) => { const [, m, j] = iso.split('-'); return `${j}/${m}` }

function Tuile({ icone, libelle, valeur, detail }: { icone: React.ReactNode; libelle: string; valeur: string | null; detail?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--surga-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28, 43, 74, 0.08)', color: 'var(--surga-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">{icone}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--surga-text3)' }}>{libelle}</div>
        <div style={{ fontSize: valeur == null ? 14 : 22, fontWeight: 800, color: valeur == null ? 'var(--surga-text3)' : 'var(--surga-navy)', marginTop: 2, overflowWrap: 'anywhere' }}>{valeur ?? 'Non mesuré'}</div>
        {detail && <div style={{ fontSize: 12, color: 'var(--surga-text3)', marginTop: 2 }}>{detail}</div>}
      </div>
    </div>
  )
}

// Barres fines, base commune, coins arrondis en haut seulement (spécification des marques du graphique).
function Barres({ titre, donnees, couleur }: { titre: string; donnees: Array<{ jour: string; valeur: number }>; couleur: string }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur))
  const total = donnees.reduce((s, d) => s + d.valeur, 0)
  const [survol, setSurvol] = useState<number | null>(null)
  const actif = survol != null ? donnees[survol] : null
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--surga-border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--surga-navy)' }}>{titre}</div>
        <div style={{ fontSize: 12, color: 'var(--surga-text2)' }} aria-live="polite">
          {actif ? `${dateCourte(actif.jour)} : ${actif.valeur}` : `Total : ${nombre(total)} · pic : ${nombre(max)}`}
        </div>
      </div>
      <div role="img" aria-label={`${titre}, ${donnees.length} jours, total ${total}`} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 96, marginTop: 12, borderBottom: '1px solid var(--surga-border)' }} onMouseLeave={() => setSurvol(null)}>
        {donnees.map((d, i) => (
          <div key={d.jour} onMouseEnter={() => setSurvol(i)} onFocus={() => setSurvol(i)} tabIndex={0} title={`${dateCourte(d.jour)} : ${d.valeur}`}
            style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'flex-end', cursor: 'default' }}>
            <div style={{ width: '100%', height: `${Math.max(d.valeur > 0 ? 3 : 0, (d.valeur / max) * 100)}%`, background: couleur, opacity: survol == null || survol === i ? 1 : 0.45, borderRadius: '3px 3px 0 0' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--surga-text3)', marginTop: 4 }}>
        <span>{donnees.length ? dateCourte(donnees[0].jour) : ''}</span><span>{donnees.length ? dateCourte(donnees[donnees.length - 1].jour) : ''}</span>
      </div>
    </div>
  )
}

function Classe({ titre, lignes, vide }: { titre: string; lignes: Classement[]; vide: string }) {
  const max = Math.max(1, ...lignes.map((l) => l.n))
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--surga-border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--surga-navy)', marginBottom: 10 }}>{titre}</div>
      {lignes.length === 0 ? <div style={{ fontSize: 13, color: 'var(--surga-text3)' }}>{vide}</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lignes.map((l) => (
            <div key={l.libelle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, color: 'var(--surga-text1, #0F172A)' }}><span style={{ overflowWrap: 'anywhere' }}>{l.libelle}</span><strong>{l.n}</strong></div>
              <div style={{ height: 6, background: 'var(--surga-bg)', borderRadius: 3, marginTop: 3 }}><div style={{ width: `${(l.n / max) * 100}%`, height: '100%', background: 'var(--surga-navy)', borderRadius: 3 }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminStatistiquesUsage() {
  const [jours, setJours] = useState(30)
  const [stats, setStats] = useState<Statistiques | null>(null)
  const [erreur, setErreur] = useState(false)
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async (n: number) => {
    setChargement(true); setErreur(false)
    try {
      const res = await fetch(`/api/admin/surga/statistiques?jours=${n}`)
      const data = await res.json()
      if (data.success && data.statistiques) setStats(data.statistiques); else setErreur(true)
    } catch { setErreur(true) } finally { setChargement(false) }
  }, [])
  useEffect(() => { charger(jours) }, [jours, charger])

  const c = stats?.comptes
  return (
    <section aria-label="Statistiques d’usage de Surga" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Statistiques d’usage</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {PERIODES.map((p) => (
            <button key={p} type="button" onClick={() => setJours(p)} aria-pressed={jours === p}
              style={{ padding: '6px 12px', minHeight: 32, borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--surga-border)', background: jours === p ? 'var(--surga-navy)' : '#FFFFFF', color: jours === p ? '#FFFFFF' : 'var(--surga-navy)' }}>{p} jours</button>
          ))}
          <button type="button" onClick={() => charger(jours)} aria-label="Actualiser les statistiques" title="Actualiser"
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--surga-border)', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--surga-navy)' }}>
            <RefreshCw size={14} className={chargement ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {erreur && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, fontWeight: 600 }}>
          <AlertCircle size={16} /> Les statistiques n’ont pas pu être chargées.
          <button type="button" onClick={() => charger(jours)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#B91C1C', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
        </div>
      )}

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            <Tuile icone={<Users size={18} />} libelle="Comptes avec une trace dans Surga" valeur={nombre(c?.total)} />
            <Tuile icone={<Activity size={18} />} libelle="Comptes actifs (7 jours)" valeur={nombre(c?.actifs_7j)} detail={`24 h : ${nombre(c?.actifs_24h) ?? 'n.m.'} · 30 jours : ${nombre(c?.actifs_30j) ?? 'n.m.'}`} />
            <Tuile icone={<UserPlus size={18} />} libelle={`Nouvelles configurations (${stats.periode_jours} j)`} valeur={nombre(c?.nouveaux_periode)} />
            <Tuile icone={<CreditCard size={18} />} libelle="Comptes payants" valeur={nombre(c?.payeurs)} detail={c?.taux_payeurs_pct != null ? `${c.taux_payeurs_pct} % des comptes · ${nombre(stats.abonnements.actifs) ?? 'n.m.'} abonnements en cours` : undefined} />
            <Tuile icone={<CreditCard size={18} />} libelle={`Encaissé (${stats.periode_jours} j)`} valeur={fcfa(stats.abonnements.encaisse_periode_xof)} detail={stats.abonnements.encaisse_xof != null ? `Depuis le début : ${fcfa(stats.abonnements.encaisse_xof)}` : undefined} />
            <Tuile icone={<FileText size={18} />} libelle={`Notes · dépenses · rappels (${stats.periode_jours} j)`} valeur={stats.contenus ? `${nombre(stats.contenus.notes_periode)} · ${nombre(stats.contenus.depenses_periode)} · ${nombre(stats.contenus.rappels_periode)}` : null} detail={stats.contenus ? `Au total : ${nombre(stats.contenus.notes)} · ${nombre(stats.contenus.depenses)} · ${nombre(stats.contenus.rappels)}` : undefined} />
            <Tuile icone={<Bell size={18} />} libelle="Notifications activées" valeur={nombre(stats.preferences.notifications_activees)} detail={stats.rappels_envoyes ? `Rappels envoyés (${stats.periode_jours} j) : ${nombre(stats.rappels_envoyes.envoyes)} · échecs : ${nombre(stats.rappels_envoyes.echecs)}` : undefined} />
            <Tuile icone={<Briefcase size={18} />} libelle={`CV et lettres générés (${stats.periode_jours} j)`} valeur={nombre(stats.emploi.documents?.periode)} detail={stats.emploi.documents ? `Total : ${stats.emploi.documents.cv} CV · ${stats.emploi.documents.lettres} lettres · ${nombre(stats.emploi.profils) ?? 'n.m.'} profils` : undefined} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <Barres titre="Configurations enregistrées par jour" couleur="var(--surga-navy)" donnees={stats.serie.map((d) => ({ jour: d.jour, valeur: d.configurations }))} />
            <Barres titre="Notes, dépenses et rappels créés par jour" couleur="var(--surga-accent)" donnees={stats.serie.map((d) => ({ jour: d.jour, valeur: d.contenus }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <Classe titre="Rubriques du briefing choisies" lignes={stats.preferences.modules} vide="Aucune préférence enregistrée." />
            <Classe titre="Quartiers de référence" lignes={stats.preferences.quartiers} vide="Aucun quartier enregistré." />
            <Classe titre="Heures de briefing demandées" lignes={stats.preferences.heures} vide="Aucune heure enregistrée." />
            <div style={{ background: '#FFFFFF', border: '1px solid var(--surga-border)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'var(--surga-text1, #0F172A)', lineHeight: 1.7 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--surga-navy)', marginBottom: 6 }}>Suivis et alertes en cours</div>
              <div>Démarches suivies : <strong>{nombre(stats.suivis.demarches) ?? 'n.m.'}</strong></div>
              <div>Concours suivis : <strong>{nombre(stats.suivis.concours) ?? 'n.m.'}</strong></div>
              <div>Alertes immobilières actives : <strong>{nombre(stats.suivis.alertes_immo_actives) ?? 'n.m.'}</strong></div>
              <div>Adresses en favoris : <strong>{nombre(stats.suivis.adresses_favorites) ?? 'n.m.'}</strong></div>
              <div>Abonnements aux chaînes vidéo : <strong>{nombre(stats.suivis.abonnements_videos) ?? 'n.m.'}</strong></div>
              <div>Audio du briefing activé : <strong>{nombre(stats.preferences.audio_actif) ?? 'n.m.'}</strong></div>
            </div>
          </div>

          <details style={{ background: '#FFFFFF', border: '1px solid var(--surga-border)', borderRadius: 12, padding: '10px 16px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--surga-navy)', minHeight: 32, display: 'flex', alignItems: 'center' }}>Voir les données jour par jour</summary>
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead><tr><th style={{ textAlign: 'left', padding: '4px 8px' }}>Jour</th><th style={{ textAlign: 'right', padding: '4px 8px' }}>Configurations</th><th style={{ textAlign: 'right', padding: '4px 8px' }}>Notes, dépenses, rappels</th></tr></thead>
                <tbody>{[...stats.serie].reverse().map((d) => (
                  <tr key={d.jour} style={{ borderTop: '1px solid var(--surga-border)' }}><td style={{ padding: '4px 8px' }}>{dateCourte(d.jour)}</td><td style={{ textAlign: 'right', padding: '4px 8px' }}>{d.configurations}</td><td style={{ textAlign: 'right', padding: '4px 8px' }}>{d.contenus}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </details>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, background: 'var(--surga-bg)', border: '1px solid var(--surga-border)', fontSize: 12, color: 'var(--surga-text2)', lineHeight: 1.5 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <div><strong>Ce que ces chiffres ne comptent pas.</strong> {stats.non_mesure.join(' ')} « n.m. » signifie non mesuré : la donnée n’a pas pu être lue.</div>
          </div>
        </>
      )}
    </section>
  )
}
