const COULEURS = {
  marine: '#1C2B4A',
  orange: '#C75B00',
  gris: '#64748B',
  grisClair: '#94A3B8',
  bordure: '#E2E8F0',
  fondClair: '#F8FAFC',
}

async function getSettings() {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let prixPro = 15000
  let prixBusiness = 35000
  let commissionBusiness = 2
  let tauxApporteur = 10
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) {
      const s = await r.json()
      prixPro = Number(s.plan_pro_prix) || 15000
      prixBusiness = Number(s.plan_business_prix) || 35000
      commissionBusiness = Number(s.commission_business) || 2
      tauxApporteur = Number(s.apporteur_taux_commission) || 10
    }
  } catch {
    // valeurs de repli
  }
  return { prixPro, prixBusiness, commissionBusiness, tauxApporteur }
}

function fcfa(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

const VERTICALES = [
  { emoji: '📱', titre: 'Produits', detail: 'Comparez les prix de milliers de produits chez tous les marchands en ligne au Sénégal — téléphones, TV, électro, mode.' },
  { emoji: '🏠', titre: 'Immobilier', detail: 'Location et vente d\'appartements, villas, terrains — annonces vérifiées avec photos et prix.' },
  { emoji: '📶', titre: 'Télécom', detail: 'Comparez les forfaits Orange, Yas, Expresso, Promobile en un coup d\'œil.' },
  { emoji: '🛍️', titre: 'Boutiques en ligne', detail: 'Les commerçants créent leur boutique et reçoivent leurs commandes directement sur WhatsApp.' },
  { emoji: '📋', titre: 'Annonces classifiées', detail: 'Vente entre particuliers — véhicules, meubles, équipements.' },
]

const ETAPES_APPORTEUR = [
  { titre: 'Activez votre statut', detail: 'Rendez-vous sur nopalou.com/compte/apporteur et activez votre statut d\'apporteur en un clic.' },
  { titre: 'Récupérez votre lien', detail: 'Un code et un lien unique vous sont attribués automatiquement — aucune configuration nécessaire.' },
  { titre: 'Partagez-le', detail: 'Envoyez votre lien par WhatsApp, en personne ou sur les réseaux à un commerçant, une agence ou un vendeur de votre réseau.' },
  { titre: 'Suivez vos commissions', detail: 'Dès que votre contact passe en abonnement Pro ou Business payant, vous touchez une commission chaque mois, visible depuis votre espace apporteur.' },
]

export async function GET() {
  const { prixPro, prixBusiness, commissionBusiness, tauxApporteur } = await getSettings()

  const commissionPro = Math.round(prixPro * tauxApporteur / 100)
  const commissionBiz = Math.round(prixBusiness * tauxApporteur / 100)

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Brochure apporteur d'affaires — Nopalou</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; }
  .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; break-after: page; }
  .page:last-child { break-after: auto; }
</style>
</head>
<body>

<!-- PAGE 1 — Couverture -->
<div class="page" style="background: linear-gradient(160deg, ${COULEURS.marine} 0%, #0f1d35 60%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; padding: 60px;">
  <div style="position:absolute; right:-80px; top:-80px; width:360px; height:360px; border-radius:50%; background: radial-gradient(circle, rgba(199,91,0,0.3) 0%, transparent 70%);"></div>
  <div style="position:absolute; left:-60px; bottom:-60px; width:300px; height:300px; border-radius:50%; background: radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%);"></div>
  <div style="display:flex; align-items:center; gap:16px; margin-bottom:56px;">
    <div style="width:64px; height:64px; border-radius:14px; background:${COULEURS.orange}; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:900; color:#fff;">N</div>
    <span style="font-size:40px; font-weight:900;">Nopa<span style="color:${COULEURS.orange};">lou</span></span>
  </div>
  <p style="font-size:44px; font-weight:900; text-align:center; margin:0 0 20px; max-width:600px; line-height:1.2;">Devenez apporteur d'affaires Nopalou</p>
  <p style="font-size:20px; color:#CBD5E1; text-align:center; margin:0; max-width:520px; line-height:1.6;">Présentez Nopalou aux commerçants de votre réseau et touchez une commission chaque mois.</p>
  <div style="margin-top:56px; background:${COULEURS.orange}; border-radius:16px; padding:16px 40px; font-size:20px; font-weight:800;">nopalou.com/compte/apporteur</div>
</div>

<!-- PAGE 2 — C'est quoi Nopalou -->
<div class="page" style="background:#fff; padding:56px 48px;">
  <h1 style="font-size:28px; font-weight:900; color:${COULEURS.marine}; margin:0 0 8px;">C'est quoi Nopalou ?</h1>
  <p style="font-size:15px; color:${COULEURS.gris}; line-height:1.7; margin:0 0 32px; max-width:640px;">
    Nopalou est la plateforme sénégalaise qui compare les prix de milliers de produits, annonces immobilières et forfaits télécom au Sénégal — 100% gratuite pour les acheteurs, avec des boutiques en ligne pour les commerçants. L'objectif : aider chacun à mieux acheter, et aider chaque marchand à être visible auprès de clients déjà en recherche active.
  </p>
  <div style="display:flex; flex-direction:column; gap:14px;">
    ${VERTICALES.map(v => `
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
      <span style="font-size:26px;">${v.emoji}</span>
      <div>
        <p style="font-size:15px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">${v.titre}</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.5;">${v.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  <div>${PagePiedString(2)}</div>
</div>

<!-- PAGE 3 — Le programme apporteur -->
<div class="page" style="background:#fff; padding:56px 48px;">
  <h1 style="font-size:28px; font-weight:900; color:${COULEURS.marine}; margin:0 0 8px;">Le programme apporteur d'affaires</h1>
  <div style="display:inline-block; background:#FFF7ED; border:1.5px solid ${COULEURS.orange}; border-radius:30px; padding:8px 20px; font-size:14px; color:${COULEURS.orange}; font-weight:700; margin-bottom:24px;">
    ${tauxApporteur}% de commission récurrente
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:32px;">
    <thead>
      <tr style="background:${COULEURS.fondClair}; border-bottom:2px solid ${COULEURS.bordure};">
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Formule recrutée</th>
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Prix</th>
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Votre commission</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 14px; font-weight:700; color:${COULEURS.marine};">Boutique Pro</td>
        <td style="padding:12px 14px; color:${COULEURS.gris};">${fcfa(prixPro)}/mois</td>
        <td style="padding:12px 14px; color:${COULEURS.orange}; font-weight:700;">${fcfa(commissionPro)}/mois</td>
      </tr>
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 14px; font-weight:700; color:${COULEURS.marine};">Boutique Business</td>
        <td style="padding:12px 14px; color:${COULEURS.gris};">${fcfa(prixBusiness)}/mois</td>
        <td style="padding:12px 14px; color:${COULEURS.orange}; font-weight:700;">${fcfa(commissionBiz)}/mois</td>
      </tr>
    </tbody>
  </table>
  <h2 style="font-size:16px; font-weight:700; color:${COULEURS.marine}; margin:0 0 14px;">Comment ça marche</h2>
  <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
    ${ETAPES_APPORTEUR.map((e, i) => `
    <div style="display:flex; gap:14px; align-items:flex-start;">
      <span style="font-size:12px; font-weight:800; color:${COULEURS.orange}; background:#FFF7ED; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${i + 1}</span>
      <div>
        <p style="font-size:13px; font-weight:700; color:${COULEURS.marine}; margin:0 0 2px;">${e.titre}</p>
        <p style="font-size:12px; color:${COULEURS.gris}; margin:0; line-height:1.5;">${e.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  <h2 style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 10px;">Quoi dire à un commerçant</h2>
  <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
    <p style="font-size:13px; color:${COULEURS.marine}; margin:0; line-height:1.7;">
      « Je te recommande Nopalou — ça te permet d'avoir une boutique en ligne et de recevoir tes commandes directement sur WhatsApp, l'outil que tu utilises déjà. Le premier mois est gratuit, sans engagement, et il n'y a pas de commission cachée. »
    </p>
  </div>
  <div>${PagePiedString(3)}</div>
</div>

<!-- PAGE 4 — Guide pratique -->
<div class="page" style="background:#fff; padding:56px 48px;">
  <h1 style="font-size:28px; font-weight:900; color:${COULEURS.marine}; margin:0 0 8px;">Démarrez en 4 étapes</h1>
  <p style="font-size:14px; color:${COULEURS.gris}; margin:0 0 32px;">Ce guide est pour vous, l'apporteur — suivez ces étapes pour commencer à recruter dès aujourd'hui.</p>
  <div style="display:flex; flex-direction:column; gap:18px;">
    ${ETAPES_APPORTEUR.map((e, i) => `
    <div style="display:flex; gap:18px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:20px 24px; background:${COULEURS.fondClair};">
      <span style="font-size:16px; font-weight:900; color:#fff; background:${COULEURS.orange}; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${i + 1}</span>
      <div>
        <p style="font-size:16px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">${e.titre}</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">${e.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  <div>${PagePiedString(4)}</div>
</div>

<!-- PAGE 5 — Contact -->
<div class="page" style="background: linear-gradient(160deg, ${COULEURS.marine} 0%, #0f1d35 60%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; padding:60px;">
  <p style="font-size:32px; font-weight:900; text-align:center; margin:0 0 20px;">Prêt à commencer ?</p>
  <p style="font-size:16px; color:#CBD5E1; text-align:center; margin:0 0 40px; max-width:480px; line-height:1.7;">
    Aucun investissement · Paiement mensuel · Sans limite de recrutement
  </p>
  <div style="background:${COULEURS.orange}; border-radius:16px; padding:18px 44px; font-size:22px; font-weight:800; margin-bottom:20px;">
    nopalou.com/compte/apporteur
  </div>
  <p style="font-size:14px; color:${COULEURS.grisClair};">💬 Contact WhatsApp officiel Nopalou</p>
  <div>${PagePiedString(5)}</div>
</div>

</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function PagePiedString(page: number) {
  return `<div style="position:absolute; bottom:24px; left:0; right:0; display:flex; justify-content:space-between; padding:0 48px; font-size:11px; color:${COULEURS.grisClair};"><span>nopalou.com</span><span>${page} / 5</span></div>`
}
