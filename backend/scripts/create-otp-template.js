/**
 * Script : Création du template WhatsApp d'authentification officiel Meta
 * Catégorie : AUTHENTICATION
 *
 * Usage : node backend/scripts/create-otp-template.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const TOKEN    = process.env.WHATSAPP_API_TOKEN;
const WABA_ID  = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '901008702321523';
const API      = 'https://graph.facebook.com/v21.0';
const AUTH     = { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } };

async function createOtpTemplate() {
  console.log(`📝 Création du template officiel AUTHENTICATION sur WABA ${WABA_ID}...`);

  const payload = {
    name: 'nopalou_auth_otp',
    language: 'fr',
    category: 'AUTHENTICATION',
    components: [
      {
        type: 'BODY',
        add_security_recommendation: true
      },
      {
        type: 'FOOTER',
        code_expiration_minutes: 10
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'OTP',
            otp_type: 'COPY_CODE',
            text: 'Copier le code'
          }
        ]
      }
    ]
  };

  try {
    const { data } = await axios.post(`${API}/${WABA_ID}/message_templates`, payload, AUTH);
    console.log('🎉 SUCCÈS ! Template officiel d\'authentification créé avec succès !');
    console.log(`   ID : ${data.id}`);
    console.log(`   Statut : ${data.status}`);
    return data;
  } catch (err) {
    const errData = err.response?.data?.error;
    console.error('❌ Erreur lors de la création du template :');
    console.error(errData?.error_user_msg || errData?.message || err.message);
    if (errData) console.error(JSON.stringify(errData, null, 2));
  }
}

createOtpTemplate();
