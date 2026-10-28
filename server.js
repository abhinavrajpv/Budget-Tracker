/**
 * VaultBudget — Local Phone Server
 * Native Node.js HTTP server for fast local preview on phone & computer.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 8000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.clear();
  console.log('================================================================');
  console.log('         🛡️  VAULTBUDGET — 100% PRIVATE BUDGET TRACKER          ');
  console.log('================================================================\n');
  console.log('  100% Private. Zero Cloud. Zero Trackers. No Hacker Risk.\n');
  console.log('  ------------------------------------------------------------');
  console.log(`  📱 OPEN THIS ON YOUR ANDROID PHONE (same Wi-Fi):`);
  console.log(`     👉  http://${localIp}:${PORT}`);
  console.log('  ------------------------------------------------------------\n');
  console.log(`  💻 Open on this computer: http://localhost:${PORT}`);
  console.log('\n  Press Ctrl+C to stop the server anytime.');
  console.log('================================================================\n');

  if (process.platform === 'win32') {
    exec(`start "" "http://localhost:${PORT}"`);
  }
});
