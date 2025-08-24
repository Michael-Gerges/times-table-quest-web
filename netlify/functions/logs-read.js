import { getStore } from '@netlify/blobs'

export async function handler(event) {
  const url = new URL(event.rawUrl)
  const password = url.searchParams.get('password')
  if (password !== 'albert') {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  const siteID = process.env.BLOBS_SITE_ID
  const token = process.env.BLOBS_TOKEN || process.env.BLOBS_READWRITE_TOKEN

  if (!siteID || !token) {
    return {
      statusCode: 500,
      body: 'Missing Netlify Blob configuration. Set BLOBS_SITE_ID and BLOBS_TOKEN.',
    }
  }

  const store = getStore('usage', { siteID, token })
  const data = (await store.get('events.jsonl', { type: 'text' })) || ''
  const rows = data
    .trim()
    .split('\n')
    .filter(Boolean)
    .slice(-500)
    .map(JSON.parse)
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(rows),
  }
}
