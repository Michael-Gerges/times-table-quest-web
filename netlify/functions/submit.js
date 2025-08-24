import { getStore } from "@netlify/blobs";

const STORE_NAME = "submissions";        // a site-wide store
const LOG_KEY = "logs/submissions.log";  // single "log file" key inside that store

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = (body?.value ?? "").toString().trim();
  if (!raw) {
    return Response.json({ ok: false, error: "Empty value" }, { status: 400 });
  }

  const store = getStore(STORE_NAME);

  // Basic sanitation + length cap; keep it tiny for a demo
  const clean = raw.replace(/[\r\n\t]/g, " ").slice(0, 1000);
  const line = `${new Date().toISOString()} - ${clean}`;

  // Naive append: read whole log, append, write back.
  const existing = await store.get(LOG_KEY);     // string or null
  const next = existing ? `${existing}\n${line}` : line;
  await store.set(LOG_KEY, next);                // overwrite with new content

  return Response.json({ ok: true });
};
