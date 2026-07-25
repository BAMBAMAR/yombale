const axios = require('axios');

async function run() {
  const slugs = [
    'telephones-tablettes',
    'informatique',
    'tv-audio-video',
    'electromenager',
    'mode-et-accessoires',
    'gaming'
  ];
  for (const slug of slugs) {
    try {
      const res = await axios.get(`https://www.jumia.sn/${slug}/`, { maxRedirects: 0, validateStatus: () => true });
      console.log(`Jumia - ${slug}: ${res.status}`);
    } catch (e) {
      console.log(`Jumia - ${slug}: Error ${e.message}`);
    }
  }
}
run();
