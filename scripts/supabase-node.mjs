// Read-only stand-in for supabase.js when the site's modules run in Node.
// It takes the project URL and public key from supabase.js itself, so there is
// one place to change them, and reads the content row over Supabase's REST API.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "supabase.js"), "utf8");
const constant = (name) => (source.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`)) || [])[1] || "";

export const SUPABASE_URL = constant("SUPABASE_URL");
export const SUPABASE_ANON_KEY = constant("SUPABASE_ANON_KEY");
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function fetchCloudDoc() {
  if (!isSupabaseConfigured) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_content?id=eq.global&select=doc,updated_at`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase read failed: ${res.status} ${await res.text()}`);
  const [row] = await res.json();
  if (!row || !row.doc) return null;
  const doc = row.doc;
  if (row.updated_at) doc.updatedAt = row.updated_at;
  return doc;
}

// The renderer never writes, subscribes or migrates legacy tables.
export const saveCloudDoc = async () => ({ success: false, error: "read-only" });
export const subscribeToCloud = () => null;
export const fetchLegacyDoc = async () => null;
export const supabase = null;
