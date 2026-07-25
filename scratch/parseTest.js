const cheerio = require('cheerio');
const fs = require('fs');

const decaHtml = fs.readFileSync('scratch/decathlon.html', 'utf8');
let $ = cheerio.load(decaHtml);
console.log("Decathlon product-miniature count:", $('.product-miniature').length);
if($('.product-miniature').length > 0) {
  console.log("Sample title:", $('.product-miniature').first().find('.product-title').text().trim());
  console.log("Sample price:", $('.product-miniature').first().find('.price').text().trim());
}

const jijiHtml = fs.readFileSync('scratch/jiji.html', 'utf8');
$ = cheerio.load(jijiHtml);
console.log("Jiji fw-card count:", $('.fw-card').length);
console.log("Jiji b-list-advert count:", $('.b-list-advert').length);
console.log("Jiji masonry-item count:", $('.masonry-item').length);
if($('.b-list-advert').length > 0) {
    console.log("Jiji title:", $('.b-list-advert').first().find('.qa-advert-title').text().trim() || $('.b-list-advert').first().find('.b-advert-title-inner').text().trim());
}
