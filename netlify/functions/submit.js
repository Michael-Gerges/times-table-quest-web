import { getStore } from '@netlify/blobs';

const STORE_NAME = 'submissions';
const LOG_KEY = 'logs/submissions.json';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('client-ip') ||
    req.headers.get('x-forwarded-for') ||
    'unknown';
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const entry = { ts, ip, ...body };

  const store = getStore(STORE_NAME);
  const existing = await store.get(LOG_KEY);
  let arr = [];
  if (existing) {
    try {
      arr = JSON.parse(existing);
    } catch {
      arr = [];
    }
  }
  arr.push(entry);
  await store.set(LOG_KEY, JSON.stringify(arr));

  return Response.json({ ok: true });
};
