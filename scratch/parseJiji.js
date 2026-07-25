const cheerio = require('cheerio');
const fs = require('fs');
const $ = cheerio.load(fs.readFileSync('scratch/jiji.html', 'utf8'));
console.log($('.masonry-item').first().html());
