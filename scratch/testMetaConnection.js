require('dotenv').config();
const axios = require('axios');

async function testConnection() {
  const token = process.env.WHATSAPP_API_TOKEN;
  const catalogId = '1062395312809955';

  console.log("=== DÉBUT DES TESTS DE CONNECTIVITÉ META ===");
  console.log("Token configuré :", token ? "Présent (commence par " + token.substring(0, 10) + "...)" : "ABSENT !");
  console.log("ID Catalogue testé :", catalogId);

  if (!token) {
    console.error("❌ Erreur : Le jeton WHATSAPP_API_TOKEN n'est pas configuré dans le fichier .env");
    return;
  }

  // Test 1 : Appel simple vers /me pour valider le Token
  console.log("\n[Test 1] Validation de la validité du Token (/me)...");
  try {
    const meRes = await axios.get('https://graph.facebook.com/v18.0/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("✅ Token valide ! Utilisateur/Objet connecté :", meRes.data);
  } catch (err) {
    console.error("❌ Échec validation Token :");
    if (err.response) {
      console.error(`Statut HTTP : ${err.response.status}`);
      console.error("Erreur Meta :", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }

  // Test 2 : Récupération des informations sur le Catalogue
  console.log(`\n[Test 2] Récupération des informations du Catalogue (${catalogId})...`);
  try {
    const catRes = await axios.get(`https://graph.facebook.com/v18.0/${catalogId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("✅ Catalogue trouvé et accessible ! Informations :", catRes.data);
  } catch (err) {
    console.error("❌ Échec de la récupération du Catalogue :");
    if (err.response) {
      console.error(`Statut HTTP : ${err.response.status}`);
      console.error("Erreur Meta :", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }

  // Test 3 : Liste des catalogues accessibles par ce Token
  console.log("\n[Test 3] Liste des catalogues accessibles par ce Token (/me/owned_product_catalogs)...");
  try {
    const catalogsRes = await axios.get('https://graph.facebook.com/v18.0/me/owned_product_catalogs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("✅ Catalogues possédés trouvés :", catalogsRes.data);
  } catch (err) {
    try {
      // Tenter une route alternative
      const catalogsResAlt = await axios.get('https://graph.facebook.com/v18.0/me/product_catalogs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("✅ Catalogues associés trouvés (route alternative) :", catalogsResAlt.data);
    } catch (errAlt) {
      console.error("❌ Échec de la récupération de la liste des catalogues :");
      if (errAlt.response) {
        console.error(`Statut HTTP : ${errAlt.response.status}`);
        console.error("Erreur Meta :", JSON.stringify(errAlt.response.data, null, 2));
      } else {
        console.error(errAlt.message);
      }
    }
  }
}

testConnection();
