const { scraperDecathlon, scraperJiji } = require('../backend/services/scraper');

async function test() {
  const d = await scraperDecathlon('3745-tous-les-sports', 1);
  console.log("Decathlon found:", d.length);
  if (d.length > 0) console.log(d[0]);

  const j = await scraperJiji('mobile-phones', 1);
  console.log("Jiji found:", j.length);
  if (j.length > 0) console.log(j[0]);
}

test();
