const fs = require('fs');

const code = fs.readFileSync('backend/services/whatsapp-chatbot.js', 'utf8');

// Match all occurrences of SITE + '...' or `...${SITE}...` or similar URL generation
const matches = [];
const regex1 = /SITE\s*\+\s*['"]([^'"]+)['"]/g;
let m;
while ((m = regex1.exec(code)) !== null) {
    matches.push(m[1]);
}

const regex2 = /\$\{SITE\}([^`"'\s\n\\]+)/g;
while ((m = regex2.exec(code)) !== null) {
    matches.push(m[1]);
}

console.log('Unique URL paths constructed in whatsapp-chatbot.js:');
const unique = Array.from(new Set(matches));
unique.sort().forEach(u => console.log(' ' + u));
