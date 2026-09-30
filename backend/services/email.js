// backend/services/email.js — Envoi d'emails via l'API Resend (https://resend.com)
//
// Variables d'env requises :
//   RESEND_API_KEY — clé API Resend
//   EMAIL_FROM     — adresse d'expédition (ex: "Nopalou <onboarding@resend.dev>"
//                     ou "Nopalou <noreply@votredomaine.com>" une fois le domaine vérifié)

const axios = require('axios');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM     = process.env.EMAIL_FROM || 'Nopalou <onboarding@resend.dev>';

if (process.env.NODE_ENV === 'production' && (!process.env.EMAIL_FROM || process.env.EMAIL_FROM.includes('resend.dev'))) {
  console.error('[EMAIL] ⚠️  EMAIL_FROM non configuré ou utilise le domaine sandbox Resend — les emails partiront depuis onboarding@resend.dev. Configurez EMAIL_FROM avec votre domaine vérifié.');
}

async function envoyerEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY non configurée — email non envoyé:', subject, '→', to);
    return { skipped: true };
  }
  try {
    const r = await axios.post('https://api.resend.com/emails', {
      from: EMAIL_FROM, to, subject, html,
    }, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    });
    return r.data;
  } catch (err) {
    console.error('[EMAIL] Erreur envoi:', err.response?.data || err.message);
    throw err;
  }
}

function templateEmail({ preheader, titre, contenuHtml, boutonTexte, boutonUrl, noteBas }) {
  const annee = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titre}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1C2B4A; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(28, 43, 74, 0.06); border: 1px solid #E8DDD2;">
          <!-- En-tête -->
          <tr>
            <td style="background-color: #1C2B4A; padding: 24px 32px; text-align: left;">
              <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Nopalou</span>
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #C75B00; border-radius: 50%; margin-left: 2px;"></span>
            </td>
          </tr>
          <!-- Contenu principal -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1C2B4A; line-height: 1.3;">${titre}</h1>
              <div style="font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                ${contenuHtml}
              </div>
              ${boutonTexte && boutonUrl ? `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #C75B00;">
                    <a href="${boutonUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #C75B00; letter-spacing: 0.2px;">
                      ${boutonTexte}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #6b7280; line-height: 1.4; margin: 16px 0 0 0; word-break: break-all;">
                Si le bouton ne fonctionne pas, copiez ce lien :<br>
                <a href="${boutonUrl}" style="color: #C75B00; text-decoration: underline;">${boutonUrl}</a>
              </p>
              ` : ''}
              ${noteBas ? `
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #E8DDD2; font-size: 13px; color: #6b7280; line-height: 1.5;">
                ${noteBas}
              </div>` : ''}
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td style="background-color: #F8F5F0; padding: 20px 32px; text-align: center; border-top: 1px solid #E8DDD2;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
                Nopalou — Plateforme de commerce digital & immobilier au Sénégal
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                Dakar, Sénégal · © ${annee} Nopalou. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { envoyerEmail, templateEmail };
