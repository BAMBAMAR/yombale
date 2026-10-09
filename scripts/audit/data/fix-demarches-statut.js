const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../../../backend/services/surga/demarches-service.js');
let content = fs.readFileSync(file, 'utf8');
const count = (content.match(/statut:\s*'BROUILLON'/g) || []).length;
console.log('Occurrences statut: BROUILLON :', count);
content = content.replace(/statut:\s*'BROUILLON'/g, "statut: 'PUBLIE'");
fs.writeFileSync(file, content, 'utf8');
console.log('Remplacement effectué avec succès.');
