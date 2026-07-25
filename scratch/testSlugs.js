const axios = require('axios');

async function testSlug(slug) {
  try {
    const res = await axios.get(`https://sn.coinafrique.com/categorie/${slug}`, { maxRedirects: 0, validateStatus: () => true });
    console.log(`${slug}: ${res.status}`);
  } catch (e) {
    console.log(`${slug}: Error ${e.message}`);
  }
}

async function run() {
  const slugs = [
    'electronique',
    'telephones-tablettes',
    'telephones-et-tablettes',
    'ordinateurs',
    'son-hifi-casques',
    'jeux-video-consoles',
    'electromenager',
    'mode-beaute',
    'mode-et-beaute'
  ];
  for (const slug of slugs) {
    await testSlug(slug);
  }
}
run();
