const axios = require('axios');

async function testHandles() {
  const sources = [
    { name: 'TFM (@tfmsn)', url: 'https://www.youtube.com/@tfmsn/videos' },
    { name: 'Walf TV (@WalfadjriTV)', url: 'https://www.youtube.com/@WalfadjriTV/videos' },
    { name: '7TV (@7tvredaction187)', url: 'https://www.youtube.com/@7tvredaction187/videos' },
    { name: 'Sen TV (@GroupeDMEDIACOM)', url: 'https://www.youtube.com/@GroupeDMEDIACOM/videos' },
    { name: 'RTS (@rts-radiotelevisionsenegalaise)', url: 'https://www.youtube.com/@rts-radiotelevisionsenegalaise/videos' }
  ];

  for (const s of sources) {
    try {
      const res = await axios.get(s.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        timeout: 6000,
      });
      console.log(`✅ ${s.name} : Code HTTP ${res.status}`);
      const match = res.data.match(/ytInitialData\s*=\s*({.+?});/);
      if (match) {
        const data = JSON.parse(match[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const videosTab = tabs?.find((t) => t.tabRenderer?.title === 'Vidéos' || t.tabRenderer?.title === 'Videos');
        const items = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
        console.log(`   -> ${items.length} vidéos trouvées`);
        if (items.length > 0) {
          const lockup = items[0].richItemRenderer?.content?.lockupViewModel;
          if (lockup) {
            console.log(`   Exemple : "${lockup.metadata?.lockupMetadataViewModel?.title?.content}" (ID: ${lockup.contentId})`);
          }
        }
      }
    } catch (e) {
      console.log(`❌ ${s.name} : Erreur ${e.message}`);
    }
  }
}

testHandles();
