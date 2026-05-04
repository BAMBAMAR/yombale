# PrixMalin 🇸🇳

Comparateur de prix au Sénégal — Jumia, Expat-Dakar, Dakar-Deal, CoinAfrique

## Démarrage rapide

```bash
# Cloner et installer
git clone https://github.com/vous/prixmalin.git
cd prixmalin
npm install

# Configurer les variables
cp .env.example .env
# Editer .env avec vos clés API

# Créer la base de données
createdb prixmalin
npm run migrate

# Lancer en développement
npm run dev
# → http://localhost:3000
```

## Structure

```
prixmalin/
├── frontend/           Interface utilisateur (HTML/CSS/JS)
├── backend/
│   ├── app.js          Serveur Express
│   ├── routes/         Endpoints API REST
│   ├── models/         Connexion PostgreSQL + Redis
│   ├── middlewares/    Auth JWT, Rate limiting
│   └── services/       Scraping, Matching, Notifications
└── database/
    └── migrations/     Schéma SQL
```

## Stack

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | HTML/CSS/JS | Interface |
| Backend | Node.js + Express | API REST |
| Base de données | PostgreSQL | Stockage |
| Cache | Redis | Performances |
| Paiements | Wave + Orange Money | Transactions |
| SMS | Africa's Talking | Alertes |
| Emails | SendGrid | Notifications |

## Licence

MIT — Libre d'utilisation et de modification