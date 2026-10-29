// Local preview server for the desktop app's browser pane. Serves the site the
// way .htaccess does in production: /about -> about.html, /about/ -> about/index.html.
// Usage: node .claude/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2]) || 8899;
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain"
};

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const base = path.join(root, clean);
  if (!base.startsWith(root)) return null;
  const candidates = [base, base + ".html", path.join(base, "index.html")];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

http.createServer((req, res) => {
  const urlPath = new URL(req.url, "http://localhost").pathname;
  if (/^\/now(\/|\/index\.html|\.html)?$/.test(urlPath)) {
    res.writeHead(301, { Location: "/projects/" });
    return res.end();
  }
  const file = resolve(urlPath);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
