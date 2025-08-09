import { getStore } from '@netlify/blobs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  try {
    const store = getStore('usage')
    const now = new Date().toISOString()
    const ip =
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['client-ip'] ||
      null
    const payload = JSON.parse(event.body || '{}')
    const line = JSON.stringify({ ts: now, ip, ...payload }) + '\n'
    await store.append('events.jsonl', line)
    return { statusCode: 204 }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'log failed' }
  }
}
