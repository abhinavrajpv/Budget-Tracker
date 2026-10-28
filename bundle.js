const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');
const js = fs.readFileSync('js/app.js', 'utf8');

// Replace stylesheet link with inline CSS
let bundled = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>');

// Replace script src with inline JS
bundled = bundled.replace('<script src="js/app.js"></script>', '<script>\n' + js + '\n</script>');

fs.writeFileSync('zenith_offline_phone.html', bundled, 'utf8');
console.log('zenith_offline_phone.html generated successfully! File size:', bundled.length, 'bytes');
