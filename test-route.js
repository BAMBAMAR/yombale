require('dotenv').config();
const { pool } = require('./backend/models/db');
const express = require('express');
const app = express();
app.use('/api/produits', require('./backend/routes/produits'));

app.listen(3333, async () => {
  console.log("Server listening on 3333");
  try {
    const res = await fetch('http://localhost:3333/api/produits?limit=50');
    const data = await res.json();
    console.log(JSON.stringify(data.produits.filter(p => !p.boutique_slug).map(p => ({ nom: p.nom, source: p.boutique_slug ? `Boutique: ${p.boutique_slug}` : 'Scraped', prix: p.prix_min, offres: p.nb_offres, order: p.sort_order })).slice(0, 3), null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
});
