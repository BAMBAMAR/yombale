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
    'jeux-video-et-consoles',
    'jeux-et-jouets',
    'son-hifi-et-casques',
    'accessoires-informatiques',
    'tv-box-et-video-projecteurs',
    'tv-box-video-projecteurs',
    'jeux-video-consoles'
  ];
  for (const slug of slugs) {
    await testSlug(slug);
  }
}
run();
