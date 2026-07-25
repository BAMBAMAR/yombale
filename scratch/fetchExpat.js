const axios = require('axios');
const fs = require('fs');

async function go() {
  try {
    const {data} = await axios.get('https://www.expat-dakar.com/telephones', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    fs.writeFileSync('scratch/expat.html', data);
    console.log("Done");
  } catch(e) {
    console.log("Error:", e.message);
  }
}
go();
