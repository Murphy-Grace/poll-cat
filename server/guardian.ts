import type { IncomingMessage, ServerResponse } from 'node:http'

const TTL = 15 * 60 * 1000
export function createGuardianHandler(apiKey: string | undefined, request = fetch) {
  let cache: { articles: object[]; updatedAt: string } | null = null
  let expires = 0
  let pending: Promise<void> | null = null
  let retryAfter = 0
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/news') return next()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Allow', 'GET')
      return res.end(JSON.stringify({ error: 'Method not allowed.' }))
    }
    if (!apiKey) {
      res.statusCode = 503
      return res.end(JSON.stringify({ error: 'Guardian news is not configured on the server.' }))
    }
    if (Date.now() >= expires && Date.now() >= retryAfter) {
      pending ??= (async () => {
        try {
          const url = new URL('https://content.guardianapis.com/search')
          url.search = new URLSearchParams({
            'api-key': apiKey, section: 'us-news',
            q: 'election OR elections OR midterms OR senate',
            'order-by': 'newest', 'page-size': '12', 'show-fields': 'thumbnail',
          }).toString()
          const response = await request(url, { signal: AbortSignal.timeout(10000) })
          if (!response.ok) throw new Error('Upstream unavailable')
          const payload = await response.json()
          if (payload.response?.status !== 'ok' || !Array.isArray(payload.response.results)) throw new Error('Invalid response')
          const articles = payload.response.results.filter((item: any) =>
            typeof item.id === 'string' && typeof item.webTitle === 'string' &&
            typeof item.webUrl === 'string' && item.webUrl.startsWith('https://www.theguardian.com/') &&
            typeof item.webPublicationDate === 'string' && Number.isFinite(Date.parse(item.webPublicationDate)),
          ).map((item: any) => ({
            id: item.id, title: item.webTitle, url: item.webUrl,
            publishedAt: item.webPublicationDate, description: '', image: typeof item.fields?.thumbnail === 'string' && item.fields.thumbnail.startsWith('https://') ? item.fields.thumbnail : null,
            source: { name: 'The Guardian', url: 'https://www.theguardian.com' },
          }))
          cache = { articles, updatedAt: new Date().toISOString() }
          expires = Date.now() + TTL
          retryAfter = 0
        } catch {
          retryAfter = Date.now() + 60000
        }
      })().finally(() => { pending = null })
      await pending
    } else if (pending) await pending
    if (!cache) {
      res.statusCode = 502
      return res.end(JSON.stringify({ error: 'Guardian news is temporarily unavailable. Please retry shortly.' }))
    }
    res.end(JSON.stringify({ ...cache, stale: Date.now() >= expires }))
  }
}
