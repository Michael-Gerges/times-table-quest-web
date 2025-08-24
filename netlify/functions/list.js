import { getStore } from '@netlify/blobs';

const STORE_NAME = 'submissions';
const LOG_KEY = 'logs/submissions.json';
const PASSWORD = 'albert';

export default async (req) => {
  const url = new URL(req.url);
  const pw = url.searchParams.get('password') || '';
  if (pw !== PASSWORD) {
    return new Response('Unauthorized', { status: 401 });
  }
  const store = getStore(STORE_NAME);
  const text = await store.get(LOG_KEY);
  let entries = [];
  if (text) {
    try {
      entries = JSON.parse(text);
    } catch {
      entries = [];
    }
  }
  return Response.json(entries);
};
