const axios = require('axios');
const fs = require('fs');

const reqOpts = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'fr-FR,fr;q=0.9',
    'Upgrade-Insecure-Requests': '1'
  }
};

async function dl() {
  try {
    const deca = await axios.get('https://www.decathlon.sn/3745-tous-les-sports', reqOpts);
    fs.writeFileSync('scratch/decathlon.html', deca.data);
    console.log("Decathlon DL OK");
    
    const jiji = await axios.get('https://jiji.sn/mobile-phones', reqOpts);
    fs.writeFileSync('scratch/jiji.html', jiji.data);
    console.log("Jiji DL OK");
  } catch(e) {
    console.log("Error:", e.message);
  }
}
dl();
