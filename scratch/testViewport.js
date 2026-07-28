const fs = require('fs');
fetch('http://localhost:3001/guide-prix')
  .then(res => res.text())
  .then(html => {
    const headStart = html.indexOf('<head>');
    const headEnd = html.indexOf('</head>');
    if (headStart !== -1 && headEnd !== -1) {
      console.log(html.substring(headStart, headEnd + 7));
    } else {
      console.log('No head found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
