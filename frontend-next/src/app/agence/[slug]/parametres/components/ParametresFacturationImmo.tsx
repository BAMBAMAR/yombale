'use client'

import React from 'react'
import { FileText, Landmark, ShieldCheck, CreditCard } from 'lucide-react'

interface ParametresFacturationImmoProps {
  numeroAgrement: string
  setNumeroAgrement: (val: string) => void
  ninea: string
  setNinea: (val: string) => void
  rccm: string
  setRccm: (val: string) => void
  tauxTvaDefaut: string
  setTauxTvaDefaut: (val: string) => void
  timbreFiscalDefaut: string
  setTimbreFiscalDefaut: (val: string) => void
  banqueNom: string
  setBanqueNom: (val: string) => void
  ibanRib: string
  setIbanRib: (val: string) => void
  mentionsFacture: string
  setMentionsFacture: (val: string) => void
  autoriserCaution3x: boolean
  setAutoriserCaution3x: (val: boolean) => void
  autoriserVenteTranches: boolean
  setAutoriserVenteTranches: (val: boolean) => void
}

export default function ParametresFacturationImmo({
  numeroAgrement,
  setNumeroAgrement,
  ninea,
  setNinea,
  rccm,
  setRccm,
  tauxTvaDefaut,
  setTauxTvaDefaut,
  timbreFiscalDefaut,
  setTimbreFiscalDefaut,
  banqueNom,
  setBanqueNom,
  ibanRib,
  setIbanRib,
  mentionsFacture,
  setMentionsFacture,
  autoriserCaution3x,
  setAutoriserCaution3x,
  autoriserVenteTranches,
  setAutoriserVenteTranches,
}: ParametresFacturationImmoProps) {
  return (
    <>
      {/* ── Facturation d'Agence & Mentions Fiscales COCC ── */}
      <div className="agence-card">
        <div className="agence-card-header">
          <div className="agence-card-title">
            <FileText size={18} />
            Facturation d'Agence &amp; Mentions Légales COCC
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: '#64748B', marginTop: -4, marginBottom: 16 }}>
          Paramètres appliqués aux <strong>Notes d'Honoraires &amp; Débours</strong> de l'agence (distinctes d'une facture de vente boutique).
        </p>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">N° Agrément Professionnel Ministériel</label>
            <input
              type="text"
              placeholder="Ex: AGR-IMMO-2024-DKR-089"
              value={numeroAgrement}
              onChange={e => setNumeroAgrement(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">NINEA (Identification Fiscale)</label>
            <input
              type="text"
              placeholder="Ex: 009876543 2V9"
              value={ninea}
              onChange={e => setNinea(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">RCCM (Registre du Commerce)</label>
            <input
              type="text"
              placeholder="Ex: SN-DKR-2024-B-12345"
              value={rccm}
              onChange={e => setRccm(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">TVA d'Agence par Défaut</label>
            <select
              value={tauxTvaDefaut}
              onChange={e => setTauxTvaDefaut(e.target.value)}
              className="form-input"
              style={{ background: '#FFF' }}
            >
              <option value="18">18% (Régime réel de TVA)</option>
              <option value="0">0% (Exonéré / BRS / Régime forfaitaire)</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Droit de Timbre Fiscal (FCFA)</label>
            <input
              type="number"
              value={timbreFiscalDefaut}
              onChange={e => setTimbreFiscalDefaut(e.target.value)}
              className="form-input"
            />
            <span style={{ fontSize: 11, color: '#64748B' }}>Art. 544 Code Général des Impôts sénégalais</span>
          </div>

          <div className="form-group">
            <label className="form-label">Établissement Bancaire</label>
            <input
              type="text"
              placeholder="Ex: CBAO Groupe Attijariwafa / BOA"
              value={banqueNom}
              onChange={e => setBanqueNom(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">RIB / IBAN de l'Agence (Pour encaissement des honoraires)</label>
          <input
            type="text"
            placeholder="Ex: SN08 SN01 2010 0345 6789 0123 45"
            value={ibanRib}
            onChange={e => setIbanRib(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mentions de bas de page des Factures d'Honoraires</label>
          <textarea
            rows={2}
            placeholder="Ex: Honoraires d'agence exigibles conformément au mandat et aux dispositions du Code des Obligations Civiles et Commerciales."
            value={mentionsFacture}
            onChange={e => setMentionsFacture(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* ── Facilités Commerciales Immobilières ── */}
      <div className="agence-card">
        <div className="agence-card-header">
          <div className="agence-card-title">
            <CreditCard size={18} />
            Options de Facilités Immobilières &amp; Échelonnement
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              id="toggle-caution3x"
              checked={autoriserCaution3x}
              onChange={e => setAutoriserCaution3x(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent, #C75B00)' }}
            />
            <label htmlFor="toggle-caution3x" style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 13.5 }}>
                Proposer l'Échelonnement de Caution Locative (Paiement en 3x)
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Permet aux locataires d'étaler le dépôt de garantie sur les 3 premiers mois du bail.
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              id="toggle-vente-tranches"
              checked={autoriserVenteTranches}
              onChange={e => setAutoriserVenteTranches(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent, #C75B00)' }}
            />
            <label htmlFor="toggle-vente-tranches" style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 13.5 }}>
                Autoriser la Vente par Tranches &amp; VEFA (Vente sur plan)
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Active la gestion des échéanciers d'acompte et appels de fonds pour terrains et programmes neufs.
              </div>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}
