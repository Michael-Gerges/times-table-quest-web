import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, 'usage-log.json');

function appendLog(entry) {
  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    if (!Array.isArray(logs)) logs = [];
  } catch {
    logs = [];
  }
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const entry = { ...data, ip, serverTime: new Date().toISOString() };
        appendLog(entry);
        res.writeHead(204).end();
      } catch {
        res.writeHead(400).end();
      }
    });
  } else if (req.method === 'GET' && req.url === '/logs') {
    try {
      const data = fs.readFileSync(LOG_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
  } else {
    res.writeHead(404).end();
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Logging server running on port ${port}`);
});
