const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000; // Render fournit le port via la variable d'environnement

function serveStatic(res, filepath) {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Page introuvable');
      return;
    }
    const ext = path.extname(filepath).toLowerCase();
    const contentType = ext === '.html' ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8';
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
}

function checkCredentials(email, password) {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'users.csv'), 'utf8');
    const lines = raw.split(/\r?\n/);
    for (let i = 1; i < lines.length; i++) { // ignorer l'en-tête
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < 2) continue;
      const csvEmail = parts[0].trim();
      const csvPassword = parts.slice(1).join(',').trim();
      if (csvEmail === email && csvPassword === password) {
        return true;
      }
    }
  } catch (err) {
    console.error('Erreur lecture users.csv:', err);
  }
  return false;
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  if (req.method === 'GET') {
    if (req.url === '/' || req.url === '/index.html') return serveStatic(res, path.join(__dirname, 'index.html'));
    if (req.url === '/success.html') return serveStatic(res, path.join(__dirname, 'success.html'));
    if (req.url === '/error.html') return serveStatic(res, path.join(__dirname, 'error.html'));
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('Page introuvable');
  }

  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const form = querystring.parse(body);
      const email = (form.email || '').trim();
      const password = (form.password || '').trim();

      if (checkCredentials(email, password)) {
        res.writeHead(302, { 'Location': '/success.html' });
      } else {
        res.writeHead(302, { 'Location': '/error.html' });
      }
      res.end();
    });
    return;
  }

  res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
  res.end('Page introuvable');
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
