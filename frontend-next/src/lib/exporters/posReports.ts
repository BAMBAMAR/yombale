/**
 * Impression et export PDF officiel du Rapport Z / Clôture de Session de Caisse POS
 */
export function printPosSessionRapportZ_PDF({
  boutiqueNom,
  session,
  ventes = [],
}: {
  boutiqueNom: string
  session: any
  ventes?: any[]
}) {
  const printWindow = window.open('', '_blank', 'width=850,height=750')
  if (!printWindow) return

  const f = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA'
  const dateOuv = session.date_ouverture ? new Date(session.date_ouverture).toLocaleString('fr-FR') : '—'
  const dateClot = session.date_cloture ? new Date(session.date_cloture).toLocaleString('fr-FR') : 'En cours'
  const ecart = Number(session.ecart_caisse || 0)

  const ventesRowsHtml = (ventes || []).map((v, i) => `
    <tr>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; text-align:center; font-size:11px;">${i + 1}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; font-weight:700;">${v.reference || '—'}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px;">${v.nom_produit || 'Article'}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; text-align:center;">${v.quantite || 1}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; text-align:right; font-weight:700;">${f(v.montant_total)}</td>
      <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; text-align:center; text-transform:uppercase;">${v.methode_paiement || 'cash'}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>Rapport Z — Session Caisse ${session.id?.slice(0, 8) || ''}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
        .header { border-bottom: 2px solid #C75B00; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        h1 { margin: 0 0 4px; font-size: 20px; color: #C75B00; }
        .grid-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
        .kpi span { font-size: 11px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px; }
        .kpi strong { font-size: 15px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; text-align: left; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Rapport Z — Clôture de Caisse POS</h1>
          <p style="margin:0; font-size:12.5px; color:#64748b;">
            Boutique : <strong>${boutiqueNom}</strong> · Caissier : <strong>${session.caissier_nom || 'Caissier Principal'}</strong><br/>
            Ouverture : <strong>${dateOuv}</strong> · Clôture : <strong>${dateClot}</strong>
          </p>
        </div>
        <button class="no-print" onclick="window.print()" style="padding:8px 16px; background:#C75B00; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Imprimer Rapport</button>
      </div>

      <div class="grid-kpi">
        <div class="kpi">
          <span>Chiffre d'Affaires Total</span>
          <strong style="color:#1e3a8a;">${f(session.ventes_total)}</strong>
        </div>
        <div class="kpi">
          <span>Nombre de Ventes</span>
          <strong>${session.nb_ventes || 0} tickets</strong>
        </div>
        <div class="kpi">
          <span>Fond de Caisse Initial</span>
          <strong>${f(session.fond_caisse_initial)}</strong>
        </div>
        <div class="kpi">
          <span>Encaissements Espèces</span>
          <strong>${f(session.ventes_especes)}</strong>
        </div>
        <div class="kpi">
          <span>Encaissements Wave</span>
          <strong style="color:#0284c7;">${f(session.ventes_wave)}</strong>
        </div>
        <div class="kpi">
          <span>Encaissements Orange Money</span>
          <strong style="color:#ea580c;">${f(session.ventes_orange_money)}</strong>
        </div>
        <div class="kpi">
          <span>Espèces Comptées Physiquement</span>
          <strong>${f(session.especes_comptees)}</strong>
        </div>
        <div class="kpi" style="background:${ecart === 0 ? '#f0fdf4' : ecart > 0 ? '#eff6ff' : '#fef2f2'}; border-color:${ecart === 0 ? '#86efac' : ecart > 0 ? '#93c5fd' : '#fca5a5'};">
          <span>Écart de Caisse Constaté</span>
          <strong style="color:${ecart === 0 ? '#15803d' : ecart > 0 ? '#1d4ed8' : '#b91c1c'};">${ecart >= 0 ? '+' : ''}${f(ecart)}</strong>
        </div>
        <div class="kpi">
          <span>Statut Session</span>
          <strong style="text-transform:uppercase; color:${session.statut === 'cloturee' ? '#15803d' : '#C75B00'};">${session.statut || 'ouverte'}</strong>
        </div>
      </div>

      ${ventes.length > 0 ? `
        <h3 style="font-size:14px; margin:16px 0 6px; color:#1e293b;">Détail des Ventes Réalisées (${ventes.length} articles)</h3>
        <table>
          <thead>
            <tr>
              <th style="width:30px; text-align:center;">#</th>
              <th>Référence</th>
              <th>Produit</th>
              <th style="text-align:center;">Qté</th>
              <th style="text-align:right;">Montant</th>
              <th style="text-align:center;">Règlement</th>
            </tr>
          </thead>
          <tbody>${ventesRowsHtml}</tbody>
        </table>
      ` : ''}

      <div style="margin-top:30px; display:flex; justify-content:space-between; font-size:12px; color:#64748b;">
        <div>Signature du Caissier : ___________________</div>
        <div>Visa du Responsable / Gérant : ___________________</div>
      </div>

      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Génère et imprime un Reçu de Bon d'Avoir / Ticket de Retour thermique ou A5
 */
export function printBonAvoirPDF({
  boutiqueNom,
  referenceCommande,
  codeAvoir,
  clientNom,
  clientTel,
  montant,
  dateValidite,
  motif,
}: {
  boutiqueNom: string
  referenceCommande: string
  codeAvoir: string
  clientNom: string
  clientTel?: string
  montant: number
  dateValidite: string
  motif?: string
}) {
  const printWindow = window.open('', '_blank', 'width=450,height=650')
  if (!printWindow) {
    if (typeof window !== 'undefined') window.print()
    return
  }

  const f = (n: number) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
  const dateEmission = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <title>Bon d'Avoir — ${codeAvoir}</title>
      <meta charset="utf-8" />
      <style>
        @page { size: 80mm auto; margin: 0; }
        body {
          width: 80mm;
          margin: 0 auto;
          padding: 12px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          box-sizing: border-box;
          font-size: 11.5px;
          line-height: 1.4;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 700; }
        .extra-bold { font-weight: 900; }
        .header { margin-bottom: 12px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 10px; }
        .shop-name { font-size: 16px; font-weight: 900; color: #1C2B4A; text-transform: uppercase; }
        .badge-avoir {
          display: inline-block;
          background: #fff7ed;
          border: 1.5px solid #fed7aa;
          color: #C75B00;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .code-box {
          background: #f8fafc;
          border: 2px dashed #94a3b8;
          border-radius: 8px;
          padding: 10px;
          margin: 12px 0;
          text-align: center;
        }
        .code-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .code-val { font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 4px 0 0; }
        .amount-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .amount-label { font-size: 12px; font-weight: 700; color: #166534; }
        .amount-val { font-size: 15px; font-weight: 900; color: #15803d; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .label { color: #64748b; }
        .val { font-weight: 600; }
        .divider { border-top: 1px dashed #e2e8f0; margin: 8px 0; }
        .conditions { font-size: 9.5px; color: #64748b; text-align: center; margin-top: 12px; line-height: 1.35; }
        @media print {
          .no-print { display: none; }
          body { padding: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="header text-center">
        <div class="shop-name">${boutiqueNom}</div>
        <div class="badge-avoir">Bon d'Avoir Marchand</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Émis le ${dateEmission}</div>
      </div>

      <div class="code-box">
        <div class="code-title">Code Unique à Déduire en Caisse</div>
        <div class="code-val">${codeAvoir}</div>
      </div>

      <div class="amount-box">
        <span class="amount-label">SOLDE CRÉDITEUR :</span>
        <span class="amount-val">${f(montant)}</span>
      </div>

      <div class="row">
        <span class="label">Bénéficiaire :</span>
        <span class="val">${clientNom}</span>
      </div>
      ${clientTel ? `
      <div class="row">
        <span class="label">Téléphone :</span>
        <span class="val">${clientTel}</span>
      </div>
      ` : ''}
      <div class="row">
        <span class="label">Réf. Commande origine :</span>
        <span class="val">#${referenceCommande}</span>
      </div>
      <div class="row">
        <span class="label">Date limite de validité :</span>
        <span class="val">${dateValidite}</span>
      </div>
      ${motif ? `
      <div class="row">
        <span class="label">Motif du retour :</span>
        <span class="val">${motif}</span>
      </div>
      ` : ''}

      <div class="divider"></div>

      <div class="conditions">
        Ce bon d'achat est déductible directement lors de vos prochains achats en boutique physique (POS) ou sur notre vitrine en ligne.<br/>
        Conservez précieusement ce ticket. Valable jusqu'au ${dateValidite}.
      </div>

      <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 10px;">
        Généré via Nopalou POS · Système Caisse & Fidélité
      </div>

      <script>
        setTimeout(() => { window.print(); }, 400);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
