import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(rootDir, 'public');
const port = Number(process.env.PORT) || 4321;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function safeBuild(reason = '') {
  try {
    build();
    if (reason) console.log(`已重新构建 (${reason})`);
  } catch (error) {
    console.error('构建失败:', error.message);
  }
}

safeBuild();

const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';

    const root = path.resolve(publicDir);
    let filePath = path.resolve(root, `.${pathname}`);

    if (!filePath.startsWith(root)) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('403 Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      const notFound = path.join(root, '404.html');
      response.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : '404 Not Found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`500 Internal Server Error\n${error.message}`);
  }
});

let rebuildTimer = null;
function scheduleRebuild(label) {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => safeBuild(label), 120);
}

const watchers = [];
for (const target of ['content', 'src']) {
  const directory = path.join(rootDir, target);
  if (!fs.existsSync(directory)) continue;
  watchers.push(
    fs.watch(directory, { recursive: true }, (_eventType, fileName) => {
      if (fileName && /\.(md|css|js|html|json)$/.test(fileName)) {
        scheduleRebuild(`${target}/${fileName}`);
      }
    }),
  );
}

const configPath = path.join(rootDir, 'site.config.js');
if (fs.existsSync(configPath)) {
  watchers.push(
    fs.watch(configPath, () => scheduleRebuild('site.config.js')),
  );
}

server.listen(port, () => {
  console.log(`\n本地预览: http://localhost:${port}`);
  console.log('按 Ctrl+C 停止服务。修改 content/ 或 src/ 会自动重新构建。\n');
});

function shutdown() {
  for (const watcher of watchers) watcher.close();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
