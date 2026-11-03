import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGuardianHandler } from './guardian.ts'

async function call(handler, method = 'GET', url = '/api/news') {
  let body, next = false
  const headers = {}
  const res = { statusCode: 200, setHeader: (key, value) => { headers[key] = value }, end: value => { body = value } }
  await handler({ method, url }, res, () => { next = true })
  return { status: res.statusCode, headers, body: body ? JSON.parse(body) : null, next }
}
const article = { id: 'us-news/example', webTitle: 'Election headline', webUrl: 'https://www.theguardian.com/us-news/example', webPublicationDate: '2026-11-03T12:00:00Z', fields: { thumbnail: 'https://media.guim.co.uk/example.jpg' } }
test('missing key and invalid method fail safely; other routes pass through', async () => {
  const handler = createGuardianHandler(undefined)
  assert.equal((await call(handler)).status, 503)
  assert.equal((await call(handler, 'POST')).status, 405)
  assert.equal((await call(handler, 'GET', '/elsewhere')).next, true)
})
test('normalizes results, hides key, caches and coalesces concurrent requests', async () => {
  let calls = 0
  const handler = createGuardianHandler('private-test-key', async url => {
    calls++
    assert.equal(url.searchParams.get('api-key'), 'private-test-key')
    assert.equal(url.searchParams.get('show-fields'), 'thumbnail')
    return Response.json({ response: { status: 'ok', results: [article, { ...article, webUrl: 'javascript:bad' }] } })
  })
  const results = await Promise.all([call(handler), call(handler)])
  assert.equal(calls, 1)
  assert.equal(results[0].body.articles.length, 1)
  assert.equal(results[0].body.stale, false)
  assert.equal(results[0].body.articles[0].image, article.fields.thumbnail)
  assert.ok(!JSON.stringify(results).includes('private-test-key'))
  await call(handler)
  assert.equal(calls, 1)
})
test('upstream failures are sanitized and briefly backed off', async () => {
  let calls = 0
  const handler = createGuardianHandler('secret', async () => { calls++; throw new Error('secret upstream URL') })
  assert.equal((await call(handler)).status, 502)
  const result = await call(handler)
  assert.equal(calls, 1)
  assert.ok(!JSON.stringify(result).includes('secret'))
})
test('expired data is retained and labeled stale after upstream failure', async () => {
  const originalNow = Date.now
  let now = originalNow(), calls = 0
  Date.now = () => now
  try {
    const handler = createGuardianHandler('secret', async () => {
      if (++calls > 1) throw new Error('offline')
      return Response.json({ response: { status: 'ok', results: [article] } })
    })
    const first = await call(handler)
    now += 16 * 60 * 1000
    const last = await call(handler)
    assert.equal(last.status, 200)
    assert.equal(last.body.stale, true)
    assert.equal(last.body.updatedAt, first.body.updatedAt)
  } finally { Date.now = originalNow }
})

test('missing and unsafe thumbnails use text-only fallback', async () => {
  const handler = createGuardianHandler('secret', async () => Response.json({response:{status:'ok',results:[{...article,fields:undefined},{...article,id:'other',fields:{thumbnail:'javascript:bad'}}]}}))
  const result = await call(handler)
  assert.ok(result.body.articles.every(a => a.image === null))
})
