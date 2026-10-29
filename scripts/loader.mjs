// Lets Node import the site's browser modules unchanged. The browser loads
// them by site path with a cache-busting query ("/content-store.js?v=3.8.0");
// here those resolve to the files in this repository. supabase.js pulls the
// Supabase client from a CDN, so Node gets a small fetch-based stand-in.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stub = pathToFileURL(path.join(root, "scripts", "supabase-node.mjs")).href;

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("/")) {
    const file = specifier.split("?")[0];
    if (file === "/supabase.js") return { url: stub, shortCircuit: true };
    return { url: pathToFileURL(path.join(root, file)).href, shortCircuit: true };
  }
  return next(specifier, context);
}
